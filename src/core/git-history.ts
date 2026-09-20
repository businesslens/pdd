/** Read historical models and files from Git objects, without touching the checkout. */
import { spawnSync } from 'node:child_process'
import { join, relative } from 'node:path'
import { realpathSync } from 'node:fs'
import { compileCommittedReport, type CommittedReport } from './committed-report.js'
import { git } from './git.js'
import type { ModelRoot } from './model-root.js'
import type { ReportBaseline } from './report-diff.js'
import { MAX_REFERENCE_BYTES } from './reference-files.js'
import { excludedReferencePath, localReferencePath } from './report-reference-files.js'

export interface HistoryPage { states: ReportBaseline[], more: boolean }
export interface GitHistory {
  modelPath: string
  list: (query?: string, offset?: number) => HistoryPage
  defaults: () => { base: string | null, hasModelHistory: boolean }
  resolve: (id: string) => Extract<ReportBaseline, { kind: 'commit' }>
  read: (id: string) => CommittedReport
  body: (commit: string, path: string) => Buffer
  revision: () => string
}
const PAGE_SIZE = 50
const COMMIT = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/

export function createGitHistory(resolved: ModelRoot): GitHistory {
  const root = resolved.gitRoot
  const optionalGit = (...args: string[]) => {
    if (!root) return ''
    try { return git(root, ...args) } catch { return '' }
  }
  function branches() {
    const current = optionalGit('symbolic-ref', '--quiet', 'HEAD') || null
    const remotes = optionalGit('remote').split('\n').filter(Boolean)
    const configured = current ? optionalGit('config', '--get', `branch.${current.slice('refs/heads/'.length)}.remote`) : ''
    const remote = remotes.includes(configured) ? configured : remotes.includes('origin') ? 'origin' : remotes.length === 1 ? remotes[0] : undefined
    const candidate = remote ? optionalGit('symbolic-ref', '--quiet', `refs/remotes/${remote}/HEAD`) : ''
    const defaultBranch = candidate && candidate.startsWith(`refs/remotes/${remote}/`) && optionalGit('rev-parse', '--verify', '--end-of-options', `${candidate}^{commit}`) ? candidate : null
    const onDefault = !!defaultBranch && current === `refs/heads/${defaultBranch.slice(`refs/remotes/${remote}/`.length)}`
    return { current, defaultBranch, onDefault }
  }
  const resolveCommit = (id: string) => {
    if (!root) throw new Error('This model is not in a Git repository.')
    const revision = id === 'head' ? 'HEAD'
      : id.startsWith('commit:') && COMMIT.test(id.slice(7)) ? id.slice(7)
      : id.startsWith('branch:refs/heads/') || id.startsWith('branch:refs/remotes/') ? id.slice(7)
      : id.startsWith('tag:refs/tags/') ? id.slice(4) : ''
    if (!revision) throw new Error('Unknown Git state.')
    try { return git(root, 'rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`) }
    catch { throw new Error('This Git revision is not available locally.') }
  }
  const commitState = (line: string): ReportBaseline => {
    const [commit = '', at = '', ...subject] = line.split('\0')
    return { id: `commit:${commit}`, kind: 'commit', available: true, commit, at,
      label: `${commit.slice(0, 7)} ${subject.join(' ')}`, detail: at }
  }
  return {
    modelPath: relative(realpathSync(root ?? resolved.modelRoot), join(realpathSync(resolved.modelRoot), '.businesslens')).split('\\').join('/'),
    revision() {
      if (!root) return ''
      return `${optionalGit('show-ref', '--head')}\n${JSON.stringify(branches())}`
    },
    defaults() {
      if (!root) return { base: null, hasModelHistory: false }
      try { resolveCommit('head'); return { base: 'head', hasModelHistory: true } }
      catch { return { base: 'empty', hasModelHistory: !!optionalGit('log', '--all', '--max-count=1', '--format=%H') } }
    },
    list(query = '', offset = 0) {
      if (!root) return { states: [], more: false }
      const states: ReportBaseline[] = []
      const search = query.trim().slice(0, 200)
      if (offset === 0) {
        if (!search) states.push({ id: 'empty', kind: 'empty', available: true })
        const context = branches()
        try {
          const [commit, at, subject] = git(root, 'show', '-s', '--format=%H%x00%cI%x00%s', 'HEAD').split('\0')
          if (!search) states.push({ id: 'head', kind: 'committed', available: true, at: at!, detail: `${commit!.slice(0, 7)} ${subject}` })
        } catch { if (!search) states.push({ id: 'head', kind: 'committed', available: false, reason: 'There are no commits yet.' }) }

        const refs = git(root, 'for-each-ref', '--format=%(refname)%00%(objecttype)%00%(objectname)%00%(committerdate:iso-strict)%00%(subject)%00%(*objecttype)%00%(*objectname)%00%(*committerdate:iso-strict)%00%(*subject)%00%(symref)', 'refs/heads', 'refs/remotes', 'refs/tags')
        const namedStates: ReportBaseline[] = []
        for (const line of refs.split('\n').filter(Boolean)) {
          const [ref = '', type, oid = '', date = '', title = '', peeledType, peeledOid = '', peeledDate = '', peeledTitle = '', symbolic] = line.split('\0')
          if (symbolic) continue
          let commit = type === 'tag' ? peeledOid : oid
          let at = type === 'tag' ? peeledDate : date
          let subject = type === 'tag' ? peeledTitle : title
          if (type !== 'commit' && peeledType !== 'commit') {
            // Nested annotated tags need recursive peeling; tags of blobs or trees cannot supply a model.
            if (type !== 'tag') continue
            try {
              commit = git(root, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`)
              const details = git(root, 'show', '-s', '--format=%cI%x00%s', commit).split('\0')
              at = details[0] ?? ''
              subject = details[1] ?? ''
            } catch { continue }
          }
          const kind = ref.startsWith('refs/tags/') ? 'tag' : 'branch'
          const label = ref.replace(/^refs\/(heads|remotes|tags)\//, '')
          if (search && !`${label} ${commit} ${subject}`.toLowerCase().includes(search.toLowerCase())) continue
          namedStates.push({ id: `${kind}:${ref}`, kind, available: true, commit, at, label, detail: `${commit.slice(0, 7)} ${subject}`,
            ...(kind === 'branch' ? { isDefault: ref === context.defaultBranch, isCurrent: ref === context.current } : {}) })
        }
        const priority = (state: ReportBaseline) => state.kind === 'branch' ? state.isDefault ? 0 : state.isCurrent ? 1 : 2 : 3
        states.push(...namedStates.sort((a, b) => priority(a) - priority(b)))
        // A pasted SHA or revision can select history outside the paginated log.
        if (search) {
          try {
            const commit = git(root, 'rev-parse', '--verify', '--end-of-options', `${search}^{commit}`)
            states.push(commitState(git(root, 'show', '-s', '--format=%H%x00%cI%x00%s', commit)))
          } catch { /* It may be a subject search instead. */ }
        }
      }
      let lines: string[] = []
      try {
        lines = git(root, 'log', '--all', '--date-order', '--format=%H%x00%cI%x00%s', `--skip=${Math.max(0, offset)}`, `--max-count=${PAGE_SIZE + 1}`,
          ...(search ? ['--fixed-strings', '--regexp-ignore-case', `--grep=${search}`] : []), '--').split('\n').filter(Boolean)
      } catch { /* An unborn repository has no commits. */ }
      states.push(...lines.slice(0, PAGE_SIZE).map(commitState))
      return { states: [...new Map(states.map(state => [state.id, state])).values()], more: lines.length > PAGE_SIZE }
    },
    resolve(id) {
      const commit = resolveCommit(id)
      const [at = '', subject = ''] = git(root!, 'show', '-s', '--format=%cI%x00%s', commit).split('\0')
      return { id: `commit:${commit}`, kind: 'commit', available: true, commit, at,
        label: `${commit.slice(0, 7)} ${subject}`, detail: at }
    },
    read(id) {
      return compileCommittedReport(resolved, undefined, resolveCommit(id))
    },
    body(commit, path) {
      if (!root || !COMMIT.test(commit) || excludedReferencePath(path) || localReferencePath({ kind: 'doc', target: path }) !== path) {
        throw new Error('This historical file is unavailable.')
      }
      const entry = git(root, '--literal-pathspecs', 'ls-tree', '-lz', commit, '--', path)
      const tab = entry.indexOf('\t')
      const [mode, type, oid, size] = entry.slice(0, tab).trim().split(/\s+/)
      if (tab < 0 || entry.slice(tab + 1).replace(/\0$/, '') !== path || type !== 'blob' || !['100644', '100755'].includes(mode!)) {
        throw new Error('This file is absent or is not a regular file at the selected commit.')
      }
      if (Number(size) > MAX_REFERENCE_BYTES) throw new Error('This file exceeds the 25 MiB preview limit.')
      const result = spawnSync('git', ['-C', root, 'cat-file', 'blob', oid!], { maxBuffer: MAX_REFERENCE_BYTES + 1024 })
      if (result.status !== 0) throw new Error('The historical file could not be read.')
      return result.stdout
    }
  }
}
