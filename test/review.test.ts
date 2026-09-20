import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileResolvedWorkspaceReport } from '../src/commands/export.js'
import { createRepositoryComparison } from '../src/core/repository-diff.js'
import { createGitHistory } from '../src/core/git-history.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'
import { diffReports } from '../src/core/report-diff.js'

const roots: string[] = [], viewers: LocalViewer[] = []
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})
function repository(model = false) {
  const root = mkdtempSync(join(tmpdir(), 'bl-review-')); roots.push(root)
  if (model) cpSync(join(__dirname, 'fixtures/fixture-shop'), root, { recursive: true, filter: path => !path.split('/').includes('.git') })
  git(root, 'init', '--initial-branch=main')
  git(root, 'config', 'user.email', 'fixture@example.com'); git(root, 'config', 'user.name', 'Fixture')
  writeFileSync(join(root, '.gitignore'), 'ignored/\n.businesslens/cache/\n')
  writeFileSync(join(root, 'source.ts'), 'export const value = 1\n')
  git(root, 'add', '.'); git(root, 'commit', '-m', 'Before')
  return root
}
const commit = (root: string) => `commit:${git(root, 'rev-parse', 'HEAD')}`

describe('repository Review', () => {
  it('compares staged, unstaged, untracked, deleted and mode-only changes without writing the index', async () => {
    const root = repository(), base = commit(root), compare = createRepositoryComparison(root)
    writeFileSync(join(root, 'source.ts'), 'staged\n'); git(root, 'add', 'source.ts')
    writeFileSync(join(root, 'source.ts'), 'working\n')
    writeFileSync(join(root, 'new.ts'), 'untracked\n')
    rmSync(join(root, '.gitignore'))
    const status = git(root, 'status', '--porcelain')
    const index = git(root, 'ls-files', '--stage')
    const result = await compare.compare(base, 'working')
    expect(result.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'source.ts', change: 'modified' }),
      expect.objectContaining({ path: 'new.ts', change: 'added' }),
      expect.objectContaining({ path: '.gitignore', change: 'deleted' })
    ]))
    expect((await compare.file(base, 'working', 'source.ts')).after).toMatchObject({ status: 'text', text: 'working\n' })
    expect(git(root, 'status', '--porcelain')).toBe(status)
    expect(git(root, 'ls-files', '--stage')).toBe(index)
    git(root, 'add', '.'); git(root, 'commit', '-m', 'After')
    const after = commit(root)
    expect((await compare.compare(after, base)).files).toContainEqual(expect.objectContaining({ path: 'new.ts', change: 'deleted' }))
    chmodSync(join(root, 'source.ts'), 0o755)
    expect((await compare.compare(after, 'working')).files).toEqual([{ path: 'source.ts', change: 'modified', beforeMode: '100644', afterMode: '100755' }])
  })

  it('keeps authored model files and omits ignored untracked files, Git internals and generated model files', async () => {
    const root = repository(), compare = createRepositoryComparison(root)
    for (const directory of ['ignored', '.businesslens/cache', '.businesslens/build', '.businesslens.backup-123']) mkdirSync(join(root, directory), { recursive: true })
    for (const path of ['ignored/private.txt', '.businesslens/cache/generated.json', '.businesslens/build/report.json', '.businesslens.backup-123/product.md']) writeFileSync(join(root, path), 'not review input')
    writeFileSync(join(root, '.businesslens/product.md'), '# Product')
    const result = await compare.compare(commit(root), 'working')
    expect(result.files.map(file => file.path)).toEqual(['.businesslens/product.md'])
    expect(result.paths.some(path => path.startsWith('.git/'))).toBe(false)
  })

  it('reads symlink text without following it, and reports binary, oversized and missing contents', async () => {
    const root = repository(), base = commit(root), compare = createRepositoryComparison(root)
    symlinkSync('/etc/passwd', join(root, 'link'))
    symlinkSync('/etc', join(root, 'linked-directory'))
    writeFileSync(join(root, 'image.bin'), Buffer.from([0, 255, 1]))
    writeFileSync(join(root, 'large.txt'), 'x'.repeat(256 * 1024 + 1))
    expect((await compare.file(base, 'working', 'link')).after).toMatchObject({ status: 'text', text: '/etc/passwd', mode: '120000' })
    expect((await compare.file(base, 'working', 'linked-directory/passwd')).after.status).toBe('missing')
    expect((await compare.file(base, 'working', 'image.bin')).after.status).toBe('binary')
    expect((await compare.file(base, 'working', 'large.txt')).after.status).toBe('large')
    expect((await compare.file(base, 'working', 'new.txt')).before.status).toBe('missing')
    await expect(compare.file(base, 'working', '../outside')).rejects.toThrow(/cannot be read/)
    await expect(compare.file(base, 'working', '.git/config')).rejects.toThrow(/cannot be read/)
  })

  it('retains both sides of a file-to-folder replacement', async () => {
    const root = repository(), base = commit(root), compare = createRepositoryComparison(root)
    rmSync(join(root, 'source.ts')); mkdirSync(join(root, 'source.ts'))
    writeFileSync(join(root, 'source.ts/child.txt'), 'new child')
    const result = await compare.compare(base, 'working')
    expect(result.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'source.ts', change: 'deleted' }),
      expect.objectContaining({ path: 'source.ts/child.txt', change: 'added' })
    ]))
    expect((await compare.file(base, 'working', 'source.ts')).before).toMatchObject({ status: 'text' })
  })
})

describe('read-only Review API', () => {
  it('reviews a new nested model against an empty state and follows its first commit', { timeout: 30_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'bl-review-unborn-')), nested = join(root, 'app')
    roots.push(root)
    cpSync(join(__dirname, 'fixtures/fixture-shop'), root, { recursive: true, filter: path => !path.split('/').includes('.git') })
    git(root, 'init', '--initial-branch=main')
    git(root, 'config', 'user.email', 'fixture@example.com')
    git(root, 'config', 'user.name', 'Fixture')
    mkdirSync(nested)
    cpSync(join(__dirname, 'fixtures/fixture-shop/.businesslens'), join(nested, '.businesslens'), { recursive: true })
    rmSync(join(root, '.businesslens'), { recursive: true })
    git(root, 'add', '.')
    const resolved = resolveModelRoot(nested)
    const viewer = await startLocalViewer({ port: 0, compile: () => compileResolvedWorkspaceReport(resolved), history: createGitHistory(resolved), assetRoot: root })
    viewers.push(viewer)
    const get = async (path: string) => {
      const response = await fetch(viewer.url + path)
      expect(response.status).toBe(200)
      return response.json() as Promise<any>
    }
    expect((await get('/_businesslens/history/defaults')).base).toBe('empty')
    const result = await get('/_businesslens/history/diff?base=empty&target=working')
    expect(result.repository.modelPath).toBe('app/.businesslens')
    expect(result.before).toBeNull()
    expect(result.modelNotice).toBeUndefined()
    expect(result.repository.files.every((file: any) => file.change === 'added')).toBe(true)
    const path = 'app/.businesslens/config.yaml'
    expect((await get(`/_businesslens/review/file?base=empty&target=working&path=${path}`)).before.status).toBe('missing')
    git(root, 'commit', '-m', 'First model')
    expect((await get('/_businesslens/history/defaults')).base).toBe('head')
    expect((await get('/_businesslens/history/diff?base=head&target=working')).repository.files).toEqual([])
  })

  it.each([false, true])('starts CLI Review without a working model (historical model: %s)', { timeout: 30_000 }, async (hadModel) => {
    const root = repository(hadModel), base = commit(root)
    if (hadModel) rmSync(join(root, '.businesslens'), { recursive: true })
    writeFileSync(join(root, 'source.ts'), 'export const value = 2\n')
    const status = git(root, 'status', '--porcelain')
    const index = git(root, 'ls-files', '--stage')
    const child = spawn(process.execPath, [join(__dirname, '../dist/cli.js'), '--cwd', root, 'view', '--no-open'], { stdio: ['ignore', 'pipe', 'pipe'] })
    const closed = once(child, 'close')
    try {
      const url = await new Promise<string>((resolve, reject) => {
        let output = ''
        const timeout = setTimeout(() => reject(new Error(`Viewer did not start: ${output}`)), 10_000)
        child.stdout.on('data', chunk => {
          output += chunk.toString()
          const match = output.match(/http:\/\/127\.0\.0\.1:\d+/)
          if (match) { clearTimeout(timeout); resolve(match[0]) }
        })
        child.stderr.on('data', chunk => { output += chunk.toString() })
        child.once('error', error => { clearTimeout(timeout); reject(error) })
        child.once('exit', () => { clearTimeout(timeout); reject(new Error(`Viewer exited: ${output}`)) })
      })
      const get = async (path: string) => {
        const response = await fetch(url + path)
        expect(response.status).toBe(200)
        return response.json() as Promise<any>
      }
      expect((await fetch(url + '/_businesslens/report.json')).status).toBe(422)
      expect((await get('/_businesslens/history/defaults')).base).toBe('head')
      expect((await get('/_businesslens/history')).states).toContainEqual(expect.objectContaining({ id: base }))
      const result = await get(`/_businesslens/history/diff?base=${base}&target=working`)
      expect(result.diff).toBeNull()
      expect(result.modelNotice).toBeTruthy()
      expect(result.repository.files).toContainEqual(expect.objectContaining({ path: 'source.ts', change: 'modified' }))
      const file = await get(`/_businesslens/review/file?base=${base}&target=working&path=source.ts`)
      expect(file.before).toMatchObject({ text: 'export const value = 1\n' })
      expect(file.after).toMatchObject({ text: 'export const value = 2\n' })
      if (hadModel) expect((await get(`/_businesslens/state?state=${base}`)).report.id).toBeTruthy()
      expect(git(root, 'status', '--porcelain')).toBe(status)
      expect(git(root, 'ls-files', '--stage')).toBe(index)
    } finally {
      child.kill('SIGTERM')
      await closed
    }
  })

  it('compares model and unreferenced source changes, pins Git identities, and refuses all writes', { timeout: 30_000 }, async () => {
    const root = repository(true), resolved = resolveModelRoot(root), base = commit(root)
    git(root, 'branch', 'original')
    const resource = join(root, '.businesslens/capabilities/place-order/capability.md')
    writeFileSync(resource, readFileSync(resource, 'utf8').replace(/^# (.*)$/m, '# Submit order'))
    writeFileSync(join(root, 'source.ts'), 'export const value = 2\n')
    const viewer = await startLocalViewer({ port: 0, compile: () => compileResolvedWorkspaceReport(resolved), history: createGitHistory(resolved), assetRoot: root, referenceRoot: root })
    viewers.push(viewer)
    const get = async (path: string) => (await fetch(viewer.url + path)).json() as Promise<any>
    const result = await get('/_businesslens/history/diff?base=branch:refs/heads/original&target=working')
    expect(result.base.id).toBe(base)
    expect(result.diff.resources).toContainEqual(expect.objectContaining({ id: 'place-order', change: 'changed', title: 'Submit order' }))
    expect(result.repository.files).toContainEqual(expect.objectContaining({ path: 'source.ts', change: 'modified' }))
    git(root, 'add', '.'); git(root, 'commit', '-m', 'After'); git(root, 'branch', '-f', 'original', 'HEAD')
    const file = await get(`/_businesslens/review/file?base=${result.base.id}&target=working&path=source.ts`)
    expect(file.before).toMatchObject({ text: 'export const value = 1\n' })
    expect(file.after).toMatchObject({ text: 'export const value = 2\n' })
    for (const path of ['/_businesslens/changes', '/_businesslens/changes/diff?base=head', '/_businesslens/checkpoints']) {
      expect((await fetch(viewer.url + path)).status).toBe(404)
    }
    for (const path of ['/_businesslens/checkpoints', '/_businesslens/history/diff', '/_businesslens/report.json']) {
      expect((await fetch(viewer.url + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-businesslens-pin': '1' }, body: '{}' })).status).toBe(405)
    }
    expect(git(root, 'status', '--porcelain')).toBe('')
    writeFileSync(join(root, 'source.ts'), 'third version\n')
    expect((await get(`/_businesslens/review/file?base=${base}&target=working&path=source.ts`)).after).toMatchObject({ text: 'third version\n' })
  })

  it('compares repository files when an earlier revision has no model or the working model fails', { timeout: 30_000 }, async () => {
    const root = repository(), base = commit(root)
    cpSync(join(__dirname, 'fixtures/fixture-shop/.businesslens'), join(root, '.businesslens'), { recursive: true })
    const resolved = resolveModelRoot(root)
    const viewer = await startLocalViewer({ port: 0, compile: () => { throw new Error('Invalid working model') }, history: createGitHistory(resolved), assetRoot: root })
    viewers.push(viewer)
    const response = await fetch(`${viewer.url}/_businesslens/history/diff?base=${base}&target=working`)
    expect(response.status).toBe(200)
    const result = await response.json() as any
    expect(result.diff).toBeNull()
    expect(result.modelNotice).toContain('Invalid working model')
    expect(result.repository.files.length).toBeGreaterThan(0)
    const defaults = await (await fetch(viewer.url + '/_businesslens/history/defaults')).json() as any
    expect(defaults.base).toBe('head')
  })

  it('compares authored Coverage changes', () => {
    const root = repository(true), report = compileResolvedWorkspaceReport(resolveModelRoot(root)), after = structuredClone(report)
    after.coverage.scope = 'New model scope'
    expect(diffReports(report, after).product).toContainEqual(expect.objectContaining({ field: 'coverage.scope' }))
  })
})
