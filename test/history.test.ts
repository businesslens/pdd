import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ProductReportV16 } from '../src/core/portable.js'
import type { ReportDiff } from '../src/core/report-diff.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import { createGitHistory } from '../src/core/git-history.js'
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

  it('keeps Git baselines available independently of model presence', { timeout }, () => {
    const root = repository()
    const nested = join(root, 'nested')
    mkdirSync(nested)
    cpSync(join(root, '.businesslens'), join(nested, '.businesslens'), { recursive: true })
    // Start with the compact shape, then exercise the expanded Product shape below.
    writeFileSync(join(nested, '.businesslens/product.md'), readFileSync(join(nested, '.businesslens/product/product.md')))
    rmSync(join(nested, '.businesslens/product'), { recursive: true })
    const history = createGitHistory({ gitRoot: root, modelRoot: nested })
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
    git(root, 'add', 'nested/.businesslens')
    git(root, 'commit', '-m', 'Add nested model')
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
    git(root, 'rm', '--cached', 'nested/.businesslens/product.md')
    git(root, 'commit', '-m', 'Remove nested model')
    expect(history.defaults()).toEqual({ base: 'head', hasModelHistory: true })
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
    const reread = history.read(`commit:${old}`)
    expect(reread).toEqual(previous)
    expect(reread).not.toBe(previous)
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

it('keeps historical state through raw document links and fragments', () => {
  expect(withReferenceState('/_businesslens/file/guide.md?raw=1#setup', 'commit:abc')).toBe('/_businesslens/file/guide.md?raw=1&state=commit%3Aabc#setup')
  expect(withReferenceState('https://example.com/doc', 'commit:abc')).toBe('https://example.com/doc')
})
