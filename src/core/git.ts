import { spawnSync } from 'node:child_process'

export function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`)
  return result.stdout.trim()
}

export function repoRoot(cwd: string): string {
  return git(cwd, 'rev-parse', '--show-toplevel')
}

export function lsFiles(cwd: string): string[] {
  return git(cwd, 'ls-files', '-z').split('\0').filter(Boolean)
}

export function normalizeRepositoryUrl(origin: string): string {
  const scpStyle = origin.match(/^git@([^:]+):(.+?)(?:\.git)?$/)
  const value = scpStyle ? `https://${scpStyle[1]}/${scpStyle[2]}` : origin
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('The origin must resolve to a public HTTPS URL without embedded credentials.')
  }
  url.hash = ''
  url.search = ''
  url.pathname = url.pathname.replace(/\.git\/?$/i, '').replace(/\/+$/, '')
  return url.toString().replace(/\/$/, '')
}

export interface Provenance {
  repository: string
  repositoryUrl: string
  branch: string
  commit: string
  commitMessage?: string
  committedAt: string
}

/** Pin the repository revision. Detached HEAD is allowed only with an explicit ref label. */
export function provenance(
  cwd: string,
  options: { requireClean?: boolean, detachedHeadName?: string } = {}
): Provenance {
  const root = repoRoot(cwd)
  if (options.requireClean !== false && git(root, 'status', '--porcelain', '--untracked-files=no')) {
    throw new Error('Tracked files have uncommitted changes. Commit or stash them so the model matches the pinned revision.')
  }
  if (options.requireClean !== false && git(root, 'status', '--porcelain', '--untracked-files=all', '--', '.businesslens')) {
    throw new Error('The authored .businesslens/ Product Model has uncommitted or untracked files. Commit it so the reported model exists at the pinned revision.')
  }
  const repositoryUrl = normalizeRepositoryUrl(git(root, 'remote', 'get-url', 'origin'))
  let branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
  if (branch === 'HEAD') {
    if (!options.detachedHeadName) {
      throw new Error('The repository is in detached HEAD state. Check out a branch, or publish an exact tag with --tag.')
    }
    branch = options.detachedHeadName
  }
  const commit = git(root, 'rev-parse', 'HEAD')
  const commitMessage = git(root, 'show', '-s', '--format=%s', 'HEAD')
  const committedAt = git(root, 'show', '-s', '--format=%cI', 'HEAD')
  const repository = new URL(repositoryUrl).pathname.replace(/^\//, '')
  return { repository, repositoryUrl, branch, commit, commitMessage, committedAt }
}
