import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ProductReportV13 } from '../src/core/portable.js'
import type { ReportDiff } from '../src/core/report-diff.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import { createGitHistory } from '../src/core/git-history.js'
import { checkpointReferenceBody, checkpointsDirectory, ensureCheckpointsDirectory, readCheckpoint, writeCheckpoint } from '../src/core/checkpoints.js'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'
import { withReferenceState } from '../layers/nuxt/report-viewer/app/utils/referenceNavigation.js'

const roots: string[] = []
const viewers: LocalViewer[] = []
afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bl-history-'))
  roots.push(root)
  cpSync(join(__dirname, 'fixtures/fixture-shop'), root, { recursive: true })
  return root
}
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
function repository() {
  const root = fixture()
  git(root, 'init', '--initial-branch=main')
  git(root, 'config', 'user.email', 'fixture@example.com')
  git(root, 'config', 'user.name', 'Fixture')
  git(root, 'add', '.')
  git(root, 'commit', '-m', 'Original model')
  return root
}
const report = (root: string) => compileReport(loadModel(root), '2026-09-16', root)
const timeout = 60_000

describe('Git history', () => {
  it('identifies default and current branches without guessing names or treating an upstream as the current branch', { timeout }, () => {
    const root = repository()
    const commit = git(root, 'rev-parse', 'HEAD')
    git(root, 'remote', 'add', 'origin', root)
    git(root, 'update-ref', 'refs/remotes/origin/main', commit)
    git(root, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')
    const history = createGitHistory(resolveModelRoot(root))
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
    const revision = history.revision()
    git(root, 'branch', 'feature')
    git(root, 'symbolic-ref', 'HEAD', 'refs/heads/feature')
    git(root, 'branch', '--set-upstream-to=origin/main', 'feature')
    expect(history.revision()).not.toBe(revision)
    expect(history.defaults()).toEqual({ base: 'branch:refs/remotes/origin/main', hasModelHistory: true })
    const branches = history.list().states.filter(state => state.kind === 'branch')
    expect(branches[0]).toMatchObject({ id: 'branch:refs/remotes/origin/main', isDefault: true, isCurrent: false })
    expect(branches[1]).toMatchObject({ id: 'branch:refs/heads/feature', isDefault: false, isCurrent: true })
    expect(branches.some(state => state.id === 'branch:refs/remotes/origin/HEAD')).toBe(false)
    git(root, 'remote', 'rename', 'origin', 'central')
    expect(history.defaults().base).toBe('branch:refs/remotes/central/main')
    git(root, 'remote', 'add', 'second', root)
    expect(history.defaults().base).toBe('branch:refs/remotes/central/main')
    git(root, 'config', '--unset', 'branch.feature.remote')
    expect(history.defaults().base).toBe('head')
    expect(history.list().states.some(state => state.kind === 'branch' && state.isDefault)).toBe(false)
    git(root, 'remote', 'remove', 'second')
    expect(history.defaults().base).toBe('branch:refs/remotes/central/main')
    git(root, 'symbolic-ref', '--delete', 'refs/remotes/central/HEAD')
    expect(history.defaults().base).toBe('head')
    expect(history.list().states.some(state => state.kind === 'branch' && state.isDefault)).toBe(false)
  })

  it('checks the selected model path and distinguishes missing models from older history', { timeout }, () => {
    const root = repository()
    const nested = join(root, 'nested')
    mkdirSync(nested)
    cpSync(join(root, '.businesslens'), join(nested, '.businesslens'), { recursive: true })
    // Start with the compact shape, then exercise the expanded Product shape below.
    writeFileSync(join(nested, '.businesslens/product.md'), readFileSync(join(nested, '.businesslens/product/product.md')))
    rmSync(join(nested, '.businesslens/product'), { recursive: true })
    const history = createGitHistory({ gitRoot: root, modelRoot: nested })
    expect(history.defaults()).toEqual({ base: null, hasModelHistory: false })
    git(root, 'add', 'nested/.businesslens')
    git(root, 'commit', '-m', 'Add nested model')
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
    git(root, 'rm', '--cached', 'nested/.businesslens/product.md')
    git(root, 'commit', '-m', 'Remove nested model')
    expect(history.defaults()).toEqual({ base: null, hasModelHistory: true })
    expect(createGitHistory(resolveModelRoot(root)).defaults().base).toBe('head')
    mkdirSync(join(nested, '.businesslens/product'))
    writeFileSync(join(nested, '.businesslens/product/product.md'), readFileSync(join(nested, '.businesslens/product.md')))
    rmSync(join(nested, '.businesslens/product.md'))
    cpSync(join(root, '.businesslens/product/logo.svg'), join(nested, '.businesslens/product/logo.svg'))
    git(root, 'add', 'nested/.businesslens/product')
    git(root, 'commit', '-m', 'Expanded nested model')
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
  })

  it('reads another branch without changing dirty or staged files and pins the returned commit', { timeout }, () => {
    const root = repository()
    const old = git(root, 'rev-parse', 'HEAD')
    git(root, 'branch', 'original')
    const path = join(root, '.businesslens/capabilities/place-order/capability.md')
    const body = readFileSync(path, 'utf8')
    writeFileSync(path, body.replace('# Checkout', '# Checkout revised'))
    git(root, 'commit', '-am', 'Revised model')
    writeFileSync(path, body.replace('# Checkout', '# Checkout dirty'))
    git(root, 'add', path)
    const status = git(root, 'status', '--porcelain')
    const history = createGitHistory(resolveModelRoot(root))
    const previous = history.read('branch:refs/heads/original')
    expect(previous.commit).toBe(old)
    expect(history.read(`commit:${old}`)).toBe(previous)
    expect(git(root, 'status', '--porcelain')).toBe(status)
    expect(readFileSync(path, 'utf8')).toContain('dirty')
    const head = history.read('head')
    const codePath = 'src/services/orders.ts'
    const historicalCode = history.body(old, codePath)
    writeFileSync(join(root, codePath), 'edited code')
    expect(history.body(old, codePath)).toEqual(historicalCode)
    expect(() => history.body(old, '../outside')).toThrow()
    git(root, 'branch', '-f', 'original', head.commit)
    expect(history.read('branch:refs/heads/original').commit).toBe(head.commit)
    expect(history.read(`commit:${old}`).commit).toBe(old)
    expect(history.list('Original').states.some(state => state.id === `commit:${old}`)).toBe(true)
    expect(history.list(old).states.some(state => state.id === `commit:${old}`)).toBe(true)
    expect(() => history.read('commit:--help')).toThrow()
  })
  it('paginates all local history without compiling every model', { timeout }, () => {
    const root = repository()
    const tree = git(root, 'rev-parse', 'HEAD^{tree}')
    let head = git(root, 'rev-parse', 'HEAD')
    for (let i = 0; i < 52; i += 1) head = git(root, 'commit-tree', tree, '-p', head, '-m', `History ${i}`)
    git(root, 'update-ref', 'refs/heads/many', head)
    const history = createGitHistory(resolveModelRoot(root))
    const first = history.list()
    const second = history.list('', 50)
    expect(first.more).toBe(true)
    expect(first.states.filter(state => state.kind === 'commit')).toHaveLength(50)
    expect(second.states.filter(state => state.kind === 'commit')).toHaveLength(3)
    expect(second.more).toBe(false)
  })
  it('lists and reads lightweight, annotated, and nested tags at their exact commits', { timeout }, () => {
    const root = repository()
    const commit = git(root, 'rev-parse', 'HEAD')
    git(root, 'tag', 'release-light', commit)
    git(root, 'tag', '-a', 'release-annotated', '-m', 'Release notes', commit)
    git(root, 'tag', '-a', 'release-nested', '-m', 'Nested release', 'release-annotated')
    git(root, 'tag', 'tree-only', `${commit}^{tree}`)
    const history = createGitHistory(resolveModelRoot(root))
    const tags = history.list().states.filter(state => state.kind === 'tag')
    expect(tags.map(state => state.label)).toEqual(['release-annotated', 'release-light', 'release-nested'])
    for (const tag of tags) {
      expect(tag.commit).toBe(commit)
      expect(tag.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(history.read(tag.id).commit).toBe(commit)
    }
    expect(history.list('release-annotated').states.some(state => state.id === 'tag:refs/tags/release-annotated')).toBe(true)
    expect(() => history.read('tag:refs/heads/main')).toThrow('Unknown Git state')
    expect(() => history.read('tag:refs/tags/tree-only')).toThrow('not available')
    const previous = history.read('tag:refs/tags/release-light')
    git(root, 'commit', '--allow-empty', '-m', 'Later model')
    git(root, 'tag', '-f', 'release-light')
    expect(history.read('tag:refs/tags/release-light').commit).toBe(git(root, 'rev-parse', 'HEAD'))
    expect(previous.commit).toBe(commit)
  })
})

it('defaults to checkpoints only before a model has been committed and never overrides explicit selections', { timeout }, async () => {
  const root = fixture()
  git(root, 'init', '--initial-branch=main')
  git(root, 'config', 'user.email', 'fixture@example.com')
  git(root, 'config', 'user.name', 'Fixture')
  const history = createGitHistory(resolveModelRoot(root))
  expect(history.defaults()).toEqual({ base: null, hasModelHistory: false })
  git(root, 'add', '.')
  git(root, 'rm', '-r', '--cached', '.businesslens')
  git(root, 'commit', '-m', 'Application before BusinessLens')
  const beforeModel = git(root, 'rev-parse', 'HEAD')
  const model = report(root)
  const directory = ensureCheckpointsDirectory(root)
  const viewer = await startLocalViewer({ port: 0, initialReport: model, history, checkpointsRoot: directory })
  viewers.push(viewer)
  const defaults = async () => (await fetch(`${viewer.url}/_businesslens/history/defaults`)).json()
  expect(await defaults()).toEqual({ base: null, target: 'working', emptyReason: 'no-saved-model' })
  const checkpoint = writeCheckpoint(root, model, { source: 'checkpoint' })
  expect(await defaults()).toEqual({ base: checkpoint.id, target: 'working', emptyReason: null })
  git(root, 'add', '.businesslens')
  git(root, 'commit', '-m', 'First model')
  git(root, 'remote', 'add', 'origin', root)
  git(root, 'update-ref', 'refs/remotes/origin/main', beforeModel)
  git(root, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')
  git(root, 'branch', 'feature')
  git(root, 'symbolic-ref', 'HEAD', 'refs/heads/feature')
  expect(await defaults()).toEqual({ base: 'head', target: 'working', emptyReason: null })
  const response = await fetch(`${viewer.url}/_businesslens/history/diff?base=commit:${beforeModel}&target=working`)
  expect(response.status).toBe(422)
  expect(await response.json()).toMatchObject({ message: expect.stringContaining('not been committed') })
})

describe('checkpoint contents', () => {
  it('preserves exact binary bytes, shares blobs, checks integrity, and supports older text snapshots', () => {
    const root = fixture()
    const model = report(root)
    model.references = [{ kind: 'visual', role: 'context', target: 'image.png' }, { kind: 'doc', role: 'context', target: 'notes.txt' }]
    const image = Buffer.from([0, 1, 2, 255, 128])
    writeFileSync(join(root, 'image.png'), image)
    writeFileSync(join(root, 'notes.txt'), 'original')
    const first = writeCheckpoint(root, model, { source: 'checkpoint' })
    writeCheckpoint(root, model, { source: 'checkpoint' })
    const directory = checkpointsDirectory(root)
    const saved = readCheckpoint(directory, first.id)!
    const imageFile = saved.referenceFiles!['image.png']!
    expect(imageFile.status).toBe('present')
    expect(checkpointReferenceBody(directory, saved, 'image.png')).toEqual(image)
    writeFileSync(join(root, 'image.png'), 'today')
    expect(checkpointReferenceBody(directory, saved, 'image.png')).toEqual(image)
    if (imageFile.status !== 'present') throw new Error('Missing capture')
    expect(readdirSync(join(directory, 'blobs')).filter(digest => digest === imageFile.digest)).toHaveLength(1)
    writeFileSync(join(directory, 'blobs', imageFile.digest), Buffer.alloc(image.length))
    expect(() => checkpointReferenceBody(directory, saved, 'image.png')).toThrow(/integrity/)
    const text = saved.referenceFiles!['notes.txt']!
    if (text.status !== 'present') throw new Error('Missing text')
    delete text.content
    expect(checkpointReferenceBody(directory, saved, 'notes.txt').toString()).toBe('original')
    delete imageFile.content
    expect(() => checkpointReferenceBody(directory, saved, 'image.png')).toThrow(/did not save/)
  })
  it('bounds unique captured contents and refuses overlapping writers', { timeout }, () => {
    const root = fixture()
    const model = report(root)
    for (const values of Object.values(model.model)) if (Array.isArray(values)) for (const resource of values) if ('references' in resource) resource.references = []
    model.references = []
    for (let i = 0; i < 5; i += 1) {
      const target = `budget-${i}.bin`
      model.references.push({ kind: 'doc', role: 'context', target })
      writeFileSync(join(root, target), Buffer.alloc(25 * 1024 * 1024, i))
    }
    model.references.push({ kind: 'doc', role: 'context', target: 'zz-note.txt' })
    writeFileSync(join(root, 'zz-note.txt'), 'small but outside the budget')
    const directory = ensureCheckpointsDirectory(root)
    const lock = join(directory, '.write-lock')
    writeFileSync(lock, String(process.pid))
    expect(() => writeCheckpoint(root, model, { source: 'checkpoint' })).toThrow(/Another checkpoint/)
    rmSync(lock)
    const meta = writeCheckpoint(root, model, { source: 'checkpoint' })
    const saved = readCheckpoint(directory, meta.id)!
    expect(saved.referenceFiles!['budget-3.bin']).toMatchObject({ content: 'stored' })
    expect(saved.referenceFiles!['budget-4.bin']).toMatchObject({ status: 'present', content: 'budget-exceeded' })
    expect(saved.referenceFiles!['zz-note.txt']).toMatchObject({ content: 'budget-exceeded', text: null })
    expect(readdirSync(join(directory, 'blobs'))).toHaveLength(4)
    expect(() => checkpointReferenceBody(directory, saved, 'budget-4.bin')).toThrow(/budget/)
    expect(existsSync(lock)).toBe(false)
  })
  it('prunes only blobs no retained checkpoint needs', () => {
    const root = fixture()
    const model = report(root)
    model.references = [{ kind: 'doc', role: 'context', target: 'notes.txt' }]
    // Exclude fixture resource References to keep the retention test small.
    for (const values of Object.values(model.model)) if (Array.isArray(values)) for (const resource of values) if ('references' in resource) resource.references = []
    writeFileSync(join(root, 'notes.txt'), 'old')
    const initial = writeCheckpoint(root, model, { source: 'checkpoint', now: new Date('2026-09-16T00:00:00Z') })
    const directory = checkpointsDirectory(root)
    const old = readCheckpoint(directory, initial.id)!.referenceFiles!['notes.txt']!
    writeFileSync(join(root, 'notes.txt'), 'shared')
    for (let i = 1; i <= 50; i += 1) writeCheckpoint(root, model, { source: 'checkpoint', now: new Date(Date.UTC(2026, 8, 16, 0, 0, i)) })
    expect(readCheckpoint(directory, initial.id)).toBeUndefined()
    expect(old.status === 'present' && existsSync(join(directory, 'blobs', old.digest))).toBe(false)
    expect(readdirSync(join(directory, 'blobs'))).toHaveLength(1)
  })
})

it('compares either direction and serves historical documents, nested links, code and images without working-file fallback', { timeout }, async () => {
  const root = repository()
  let current = report(root)
  current.references = [
    { kind: 'doc', role: 'context', target: 'history.md' },
    { kind: 'visual', role: 'context', target: 'image.png' },
    { kind: 'code', role: 'implementation', target: 'notes.ts#original' }
  ]
  writeFileSync(join(root, 'history.md'), '# Earlier\n\n![Image](image.png)\n\n[Missing](uncaptured.md)')
  writeFileSync(join(root, 'notes.ts'), 'export const original = true')
  const image = Buffer.from([0, 4, 255])
  writeFileSync(join(root, 'image.png'), image)
  const first = writeCheckpoint(root, current, { source: 'checkpoint', label: 'Earlier' })
  const removed = current.model.capabilities.pop()!
  writeFileSync(join(root, 'history.md'), '# Today')
  writeFileSync(join(root, 'notes.ts'), 'export const today = true')
  writeFileSync(join(root, 'image.png'), 'today')
  writeFileSync(join(root, 'uncaptured.md'), '# Should never leak')
  const second = writeCheckpoint(root, current, { source: 'checkpoint', label: 'Later' })
  let broken = false
  const viewer = await startLocalViewer({ port: 0, compile: () => { if (broken) throw new Error('Invalid working model'); return current },
    referenceRoot: root, assetRoot: root, checkpointsRoot: ensureCheckpointsDirectory(root), history: createGitHistory(resolveModelRoot(root)),
    pin: (value, label) => writeCheckpoint(root, value, { source: 'checkpoint', label }) })
  viewers.push(viewer)
  const get = async <T = unknown>(path: string) => {
    const response = await fetch(viewer.url + path, { headers: { accept: 'application/json' } })
    return { status: response.status, data: await response.json() as T }
  }
  const compared = await get<{ diff: ReportDiff, before: ProductReportV13 }>(`/_businesslens/history/diff?base=${first.id}&target=${second.id}`)
  expect(compared.data.diff.resources).toContainEqual(expect.objectContaining({ id: removed.id, change: 'removed' }))
  expect(compared.data.before.model.capabilities.some((item: { id: string }) => item.id === removed.id)).toBe(true)
  const swapped = await get<{ diff: ReportDiff }>(`/_businesslens/history/diff?base=${second.id}&target=${first.id}`)
  expect(swapped.data.diff.resources).toContainEqual(expect.objectContaining({ id: removed.id, change: 'added' }))
  const doc = await get(`/_businesslens/file/history.md?state=${first.id}`)
  expect(JSON.stringify(doc.data)).toContain('Earlier')
  expect(JSON.stringify(doc.data)).toContain(`image.png?state=${first.id}`)
  const code = await get(`/_businesslens/code?target=notes.ts%23original&state=${first.id}`)
  expect(code.status).toBe(200)
  expect(JSON.stringify(code.data)).toContain('original')
  expect(JSON.stringify(code.data)).not.toContain('today')
  const bytes = await fetch(viewer.url + `/_businesslens/file/image.png?state=${first.id}`)
  expect(Buffer.from(await bytes.arrayBuffer())).toEqual(image)
  expect((await get(`/_businesslens/file/uncaptured.md?state=${first.id}`)).status).toBe(404)
  expect((await get('/_businesslens/state?state=not-a-checkpoint')).status).toBe(422)
  broken = true
  viewer.refresh()
  expect((await get(`/_businesslens/history/diff?base=${first.id}&target=${second.id}`)).status).toBe(200)
  expect((await get(`/_businesslens/history/diff?base=${first.id}&target=working`)).status).toBe(422)
  expect((await fetch(viewer.url + '/_businesslens/checkpoints', { method: 'POST', headers: { 'content-type': 'application/json', 'x-businesslens-pin': '1' }, body: '{}' })).status).toBe(422)
})

it('keeps historical state through raw document links and fragments', () => {
  expect(withReferenceState('/_businesslens/file/guide.md?raw=1#setup', 'commit:abc')).toBe('/_businesslens/file/guide.md?raw=1&state=commit%3Aabc#setup')
  expect(withReferenceState('https://example.com/doc', 'commit:abc')).toBe('https://example.com/doc')
})
