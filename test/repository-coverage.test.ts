import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, cpSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { coverageStatus, cancelCoverageReview, finishCoverageReview, recordCoverageReview, repositoryContext, startCoverageReview } from '../src/core/repository-coverage.js'
import type { CoverageReview } from '../src/core/coverage.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { parseProductReport, projectPortableReport } from '../src/core/portable.js'

const temporary: string[] = []
const fixture = resolve('test/fixtures/fixture-shop')
function repo() {
  const root = mkdtempSync(join(tmpdir(), 'bl-review-'))
  temporary.push(root)
  cpSync(fixture, root, { recursive: true, filter: path => !path.split('/').includes('.git') })
  execFileSync('git', ['init', '-q', root])
  execFileSync('git', ['-C', root, 'add', '.'])
  return root
}
const entry = (paths: string[], extra = {}) => ({ paths, outcome: 'reviewed', summary: 'Inspected supporting material for the fixture Product.', resources: [], exclusions: [], gaps: [], ...extra })
async function recorded(root: string) {
  const pending = await startCoverageReview(root)
  await recordCoverageReview(root, { reviewId: pending.id, entries: [entry(pending.files.map(file => file.path))] })
  return pending
}
function storePath(root: string) {
  const directory = join(root, '.git/businesslens/coverage')
  return join(directory, readdirSync(directory).find(name => name.endsWith('.json'))!)
}
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }) })

describe('repository reviews', { timeout: 30_000 }, () => {
  it('shares completed reviews through a fresh clone while keeping pending work local', async () => {
    const root = repo()
    const coveragePath = join(root, '.businesslens/coverage.json')
    const authored = JSON.parse(readFileSync(coveragePath, 'utf8'))
    const pending = await recorded(root)
    expect(JSON.parse(readFileSync(coveragePath, 'utf8'))).toEqual(authored)
    const completed = await finishCoverageReview(root, pending.id)
    expect(JSON.parse(readFileSync(coveragePath, 'utf8'))).toEqual({ ...authored, review: completed })
    expect(JSON.parse(readFileSync(storePath(root), 'utf8'))).toEqual({ version: 1, pending: null })
    execFileSync('git', ['-C', root, 'add', '.businesslens/coverage.json'])
    execFileSync('git', ['-C', root, '-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-qm', 'share coverage'])
    const next = await startCoverageReview(root)
    const clone = mkdtempSync(join(tmpdir(), 'bl-coverage-clone-')); temporary.push(clone)
    execFileSync('git', ['clone', '--quiet', '--no-local', root, clone])
    const status = await coverageStatus(clone)
    expect(status.baseline).toEqual(completed)
    expect(status.pending).toBeNull()
    expect(status.modelChanged).toBe(false)
    expect(status.files.every(file => file.change === 'unchanged')).toBe(true)
    expect((await coverageStatus(root)).pending?.id).toBe(next.id)
  })

  it('includes review conclusions in workspace reports and removes them from portable reports', async () => {
    const root = repo()
    const pending = await recorded(root)
    const completed = await finishCoverageReview(root, pending.id)
    const report = compileReport(loadModel(root), '2026-09-16')
    expect(parseProductReport(report).coverage.review).toEqual(completed)
    const portable = projectPortableReport(report)
    expect(portable.coverage.review).toBeNull()
    expect(report.coverage.review).toEqual(completed)
    expect(JSON.stringify(portable)).not.toContain(completed.modelDigest)
    portable.coverage.review = completed
    expect(() => parseProductReport(portable)).toThrow('coverage.review')
  })

  it('recovers interrupted completion without refreshing saved conclusions or timestamps', async () => {
    const root = repo()
    const pending = await recorded(root)
    const interrupted = readFileSync(storePath(root), 'utf8')
    const completed = await finishCoverageReview(root, pending.id)
    const coveragePath = join(root, '.businesslens/coverage.json')
    const saved = readFileSync(coveragePath, 'utf8')
    writeFileSync(storePath(root), interrupted)
    writeFileSync(join(root, 'after-completion.ts'), 'later code')
    expect(await finishCoverageReview(root, pending.id)).toEqual(completed)
    expect(readFileSync(coveragePath, 'utf8')).toBe(saved)
    expect((await coverageStatus(root)).pending).toBeNull()
    const next = await startCoverageReview(root)
    await finishCoverageReview(root, pending.id)
    expect((await coverageStatus(root)).pending?.id).toBe(next.id)
  })

  it('fingerprints authored coverage independently of review records and JSON formatting', async () => {
    const root = repo()
    const pending = await recorded(root)
    await finishCoverageReview(root, pending.id)
    const coveragePath = join(root, '.businesslens/coverage.json')
    const document = JSON.parse(readFileSync(coveragePath, 'utf8'))
    document.review.entries[0].summary = 'Historical note clarified.'
    writeFileSync(coveragePath, JSON.stringify(document))
    expect((await coverageStatus(root)).modelChanged).toBe(false)
    document.scope = 'A newly approved model boundary.'
    writeFileSync(coveragePath, JSON.stringify(document))
    expect((await coverageStatus(root)).modelChanged).toBe(true)
  })

  it('rejects malformed or unfinished shared reviews instead of treating them as missing history', async () => {
    const root = repo()
    const pending = await startCoverageReview(root)
    const coveragePath = join(root, '.businesslens/coverage.json')
    const document = JSON.parse(readFileSync(coveragePath, 'utf8'))
    writeFileSync(coveragePath, JSON.stringify({ ...document, review: pending }))
    expect(loadModel(root).issues.join('\n')).toContain('Coverage review must be completed')
    await expect(coverageStatus(root)).rejects.toThrow('coverage.json')
    const context = await repositoryContext(root, false)
    expect(context.paths.length).toBeGreaterThan(0)
    expect(context.coverageError).toContain('coverage.json')
    writeFileSync(coveragePath, '{invalid')
    expect(loadModel(root).issues.join('\n')).toContain('invalid JSON')
  })

  it('has no inferred baseline and does not write when reading status or viewer context', async () => {
    const root = repo()
    const before = readdirSync(join(root, '.git'))
    const result = await coverageStatus(root)
    expect(result.baseline).toBeNull()
    expect(result.pending).toBeNull()
    expect(result.files.every(file => file.change === 'unreviewed')).toBe(true)
    expect(result.files.some(file => file.path.includes('.businesslens/'))).toBe(false)
    expect((await repositoryContext(root, false)).coverage?.baseline).toBeNull()
    expect(readdirSync(join(root, '.git'))).toEqual(before)
  })

  it('accounts for exact files, detects uncommitted additions, edits, deletions and model changes, and never refreshes the baseline', async () => {
    const root = repo()
    const pending = await recorded(root)
    const baseline = await finishCoverageReview(root, pending.id)
    expect(baseline.modelDigest).toMatch(/^[a-f0-9]{64}$/)
    const initial = await coverageStatus(root)
    expect(initial.modelChanged).toBe(false)
    expect(initial.files.every(file => file.change === 'unchanged')).toBe(true)
    const [modified, deleted] = pending.files.filter(file => file.path.startsWith('src/'))
    writeFileSync(join(root, modified!.path), 'changed behavior')
    rmSync(join(root, deleted!.path))
    writeFileSync(join(root, 'new.ts'), 'new behavior')
    const coverage = join(root, '.businesslens/coverage.json')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('toy codebase', 'toy Product'))
    const saved = readFileSync(coverage, 'utf8')
    const result = await coverageStatus(root)
    expect(result.files).toContainEqual({ path: modified!.path, change: 'modified' })
    expect(result.files).toContainEqual({ path: deleted!.path, change: 'deleted' })
    expect(result.files).toContainEqual({ path: 'new.ts', change: 'added' })
    expect(result.modelChanged).toBe(true)
    expect(result.baseline?.id).toBe(baseline.id)
    await repositoryContext(root, true)
    expect(readFileSync(coverage, 'utf8')).toBe(saved)
  })

  it('refuses incomplete, stale and malformed recording packets without modifying the saved work', async () => {
    const root = repo()
    const pending = await startCoverageReview(root)
    const file = pending.files[0]!.path
    const packet = { reviewId: pending.id, entries: [entry([file])] }
    await expect(finishCoverageReview(root, pending.id)).rejects.toThrow('files still need')
    await expect(startCoverageReview(root)).rejects.toThrow('still pending')
    await expect(recordCoverageReview(root, { ...packet, entries: [entry(['../outside'])] })).rejects.toThrow()
    await expect(recordCoverageReview(root, { ...packet, entries: [entry(['future.ts'])] })).rejects.toThrow('not in this review')
    await expect(recordCoverageReview(root, { ...packet, entries: [entry([file]), entry([file])] })).rejects.toThrow('only once')
    await expect(recordCoverageReview(root, { ...packet, entries: [entry([file], { resources: ['capabilities/missing.md'] })] })).rejects.toThrow('Unknown model resource')
    await expect(recordCoverageReview(root, { ...packet, entries: [entry([file], { outcome: 'excluded', exclusions: ['Invented exclusion'] })] })).rejects.toThrow('Unknown Coverage exclusion')
    await expect(recordCoverageReview(root, { ...packet, entries: [entry([file], { outcome: 'excluded' })] })).rejects.toThrow()
    await expect(recordCoverageReview(root, { ...packet, reviewId: '00000000-0000-4000-8000-000000000000' })).rejects.toThrow('No pending review')
    writeFileSync(join(root, file), 'changed')
    await expect(recordCoverageReview(root, packet)).rejects.toThrow('File changed')
    expect((await coverageStatus(root)).pending?.entries).toEqual([])
  })

  it('keeps the completed baseline while a new review is pending, cancels only pending work and refuses files changed during inspection', async () => {
    const root = repo()
    const first = await recorded(root)
    await finishCoverageReview(root, first.id)
    const pending = await recorded(root)
    writeFileSync(join(root, 'later.ts'), 'appeared during inspection')
    await expect(finishCoverageReview(root, pending.id)).rejects.toThrow('files changed during review')
    const status = await coverageStatus(root)
    expect(status.baseline?.id).toBe(first.id)
    expect(status.pendingChanged).toBe(true)
    await expect(cancelCoverageReview(root, first.id)).rejects.toThrow('No pending review')
    await cancelCoverageReview(root, pending.id)
    expect((await coverageStatus(root)).baseline?.id).toBe(first.id)
    const next = await startCoverageReview(root)
    expect(next.entries).toEqual([])
    expect(next.files.some(file => file.path === 'later.ts')).toBe(true)
  })

  it('links reviewed and excluded files to approved model meaning, including gaps without pretending they are modeled', async () => {
    const root = repo()
    const coverage = join(root, '.businesslens/coverage.json')
    writeFileSync(coverage, JSON.stringify({ ...JSON.parse(readFileSync(coverage, 'utf8')), status: 'partial', exclusions: [{ description: 'Build machinery is outside the model.', paths: [] }], unmapped: [{ description: ' Back-office behavior remains missing. ', paths: [] }] }))
    const pending = await startCoverageReview(root)
    const [first, second, ...rest] = pending.files.map(file => file.path)
    await recordCoverageReview(root, { reviewId: pending.id, entries: [
      entry([first!], { resources: ['capabilities/place-order/capability.md'], gaps: [' Back-office behavior remains missing. '] }),
      entry([second!], { outcome: 'excluded', exclusions: ['Build machinery is outside the model.'] }),
      entry(rest, { outcome: 'uncertain', summary: 'Some runtime effects could not be established.' })
    ] })
    const baseline = await finishCoverageReview(root, pending.id)
    expect(baseline.entries.map(item => item.outcome)).toEqual(['reviewed', 'excluded', 'uncertain'])
    expect(baseline.entries[0]!.gaps).toEqual([' Back-office behavior remains missing. '])
    // Updating one file never erases the conclusions for others in its group.
    const next = await startCoverageReview(root)
    await recordCoverageReview(root, { reviewId: next.id, entries: [entry(next.files.map(file => file.path))] })
    await recordCoverageReview(root, { reviewId: next.id, entries: [entry([first!], { summary: 'Revisited this file.' })] })
    const saved = (await coverageStatus(root)).pending!
    expect(saved.entries.flatMap(item => item.paths)).toHaveLength(next.files.length)
    expect(saved.entries.at(-1)!.summary).toBe('Revisited this file.')
  })

  it('includes ignored inputs only by explicit policy, does not follow symlinks, and distinguishes policy changes from deletion', async () => {
    const root = repo()
    writeFileSync(join(root, '.gitignore'), 'generated/\nignored/\n')
    mkdirSync(join(root, 'generated')); writeFileSync(join(root, 'generated/out.js'), 'generated')
    mkdirSync(join(root, 'ignored')); writeFileSync(join(root, 'ignored/config.json'), 'important')
    const outside = mkdtempSync(join(tmpdir(), 'bl-review-outside-')); temporary.push(outside)
    writeFileSync(join(outside, 'secret'), 'never read')
    symlinkSync(outside, join(root, 'linked'))
    writeFileSync(join(root, 'loose.txt'), 'untracked input')
    writeFileSync(join(root, 'filename#with-brackets[1].ts'), 'exact path')
    const pending = await startCoverageReview(root, ['ignored/'])
    expect(pending.files.some(file => file.path === 'ignored/config.json')).toBe(true)
    expect(pending.files.some(file => file.path === 'filename#with-brackets[1].ts')).toBe(true)
    expect(pending.files.some(file => file.path.startsWith('generated/'))).toBe(false)
    expect(pending.files.filter(file => file.path.startsWith('linked'))).toHaveLength(1)
    await recordCoverageReview(root, { reviewId: pending.id, entries: [entry(pending.files.map(file => file.path))] })
    await finishCoverageReview(root, pending.id)
    writeFileSync(join(outside, 'secret'), 'changed outside')
    writeFileSync(join(root, '.gitignore'), 'generated/\nignored/\nloose.txt\n')
    const result = await coverageStatus(root)
    expect(result.files).toContainEqual({ path: 'linked', change: 'unchanged' })
    expect(result.files).toContainEqual({ path: 'loose.txt', change: 'outside-policy' })
    expect(result.files).toContainEqual({ path: 'ignored/config.json', change: 'unchanged' })
  })

  it('keeps nested model and worktree reviews separate and fails visibly on corrupt storage', async () => {
    const root = repo()
    const first = await startCoverageReview(root)
    const nested = join(root, 'nested'); mkdirSync(nested)
    cpSync(join(root, '.businesslens'), join(nested, '.businesslens'), { recursive: true })
    expect((await coverageStatus(nested)).pending).toBeNull()
    const second = await startCoverageReview(nested)
    expect(second.id).not.toBe(first.id)
    expect((await coverageStatus(root)).pending?.id).toBe(first.id)
    // One record per model, without authoring a file under either model.
    expect(readdirSync(join(root, '.git/businesslens/coverage')).filter(name => name.endsWith('.json'))).toHaveLength(2)
    for (const file of readdirSync(join(root, '.git/businesslens/coverage'))) writeFileSync(join(root, '.git/businesslens/coverage', file), 'not json')
    await expect(coverageStatus(root)).rejects.toThrow('Cannot read')
    const context = await repositoryContext(root, false)
    expect(context.paths.length).toBeGreaterThan(0)
    expect(context.coverage).toBeUndefined()
    expect(context.coverageError).toContain('Cannot read')
  })

  it('works before a model exists and records through the public CLI without executing repository code', async () => {
    const root = repo()
    const backup = mkdtempSync(join(tmpdir(), 'bl-model-backup-')); temporary.push(backup)
    cpSync(join(root, '.businesslens'), join(backup, '.businesslens'), { recursive: true })
    rmSync(join(root, '.businesslens'), { recursive: true })
    const cli = resolve('dist/cli.js')
    const call = (args: string[], input?: string) => spawnSync(process.execPath, [cli, '--cwd', root, 'coverage', ...args], { encoding: 'utf8', input })
    const start = call(['start'])
    expect(start.status, start.stderr).toBe(0)
    const pending = JSON.parse(start.stdout) as CoverageReview
    cpSync(join(backup, '.businesslens'), join(root, '.businesslens'), { recursive: true })
    const record = call(['record', '-'], JSON.stringify({ reviewId: pending.id, entries: [entry(pending.files.map(file => file.path))] }))
    expect(record.status, record.stderr).toBe(0)
    const finish = call(['finish', pending.id])
    expect(finish.status, finish.stderr).toBe(0)
    expect(JSON.parse(call(['status']).stdout).baseline.id).toBe(pending.id)
    expect(call(['made-up']).status).toBe(2)
    expect(lstatSync(storePath(root)).mode & 0o777).toBe(0o600)
  })
  it('retains unavailable submodules as uncertain inputs instead of dropping them', async () => {
    const root = repo()
    execFileSync('git', ['-C', root, 'update-index', '--add', '--cacheinfo', '160000,1111111111111111111111111111111111111111,vendor'])
    const pending = await startCoverageReview(root)
    expect(pending.files.find(file => file.path === 'vendor')).toMatchObject({ digest: null, error: expect.any(String) })
    await expect(recordCoverageReview(root, { reviewId: pending.id, entries: [entry(['vendor'])] })).rejects.toThrow('Unreadable file')
    await recordCoverageReview(root, { reviewId: pending.id, entries: [entry(['vendor'], { outcome: 'uncertain' })] })
    expect((await coverageStatus(root)).files.find(file => file.path === 'vendor')?.change).toBe('unreadable')
  })

  it('isolates worktrees and ignores generated model files when comparing model identity', async () => {
    const root = repo()
    execFileSync('git', ['-C', root, '-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-qm', 'fixture'])
    const other = mkdtempSync(join(tmpdir(), 'bl-review-worktree-')); temporary.push(other)
    execFileSync('git', ['-C', root, 'worktree', 'add', '--detach', other], { stdio: 'pipe' })
    const first = await recorded(root)
    await finishCoverageReview(root, first.id)
    expect((await coverageStatus(other)).baseline).toBeNull()
    const pending = await startCoverageReview(other)
    expect((await coverageStatus(root)).pending).toBeNull()
    expect((await coverageStatus(other)).pending?.id).toBe(pending.id)
    mkdirSync(join(root, '.businesslens/cache'), { recursive: true })
    writeFileSync(join(root, '.businesslens/cache/generated.json'), 'irrelevant')
    expect((await coverageStatus(root)).modelChanged).toBe(false)
    symlinkSync(join(root, '.businesslens/coverage.json'), join(root, '.businesslens/linked.md'))
    await expect(coverageStatus(root)).rejects.toThrow('symbolic link in the Product Model')
  })

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)('retains files behind inaccessible directories as uncertain inputs', async () => {
    const root = repo()
    const protectedDirectory = join(root, 'protected')
    mkdirSync(protectedDirectory)
    writeFileSync(join(protectedDirectory, 'input.txt'), 'not readable during review')
    execFileSync('git', ['-C', root, 'add', 'protected'])
    chmodSync(protectedDirectory, 0)
    try {
      const pending = await startCoverageReview(root)
      expect(pending.files.find(file => file.path === 'protected/input.txt')).toMatchObject({ digest: null, error: expect.any(String) })
      expect((await coverageStatus(root)).files.find(file => file.path === 'protected/input.txt')?.change).toBe('unreadable')
    } finally { chmodSync(protectedDirectory, 0o755) }
  })

})
