import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import {
  CHECKPOINT_LIMIT,
  checkpointsDirectory,
  compileCommittedReport,
  createCommittedReportSource,
  ensureCheckpointsDirectory,
  listCheckpoints,
  readCheckpoint,
  writeCheckpoint
} from '../src/core/checkpoints.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
/* Each of these spawns git a dozen times and compiles twice; the suite runs beside twenty others. */
const GIT_TEST_TIMEOUT_MS = 30_000
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function sh(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim()
}

function fixtureCopy(): string {
  const directory = mkdtempSync(join(tmpdir(), 'bl-checkpoints-'))
  directories.push(directory)
  cpSync(FIXTURE, directory, { recursive: true })
  return directory
}

function repository(): string {
  const directory = fixtureCopy()
  sh(directory, 'init', '--initial-branch=main')
  sh(directory, 'config', 'user.email', 'fixture@example.com')
  sh(directory, 'config', 'user.name', 'Fixture')
  sh(directory, 'add', '.')
  sh(directory, 'commit', '-m', 'fixture')
  return directory
}

const report = (root: string) => compileReport(loadModel(root), '2026-08-08', root)

describe('checkpoints', () => {
  it('seals a report as a record beside its report file, newest first', () => {
    const root = fixtureCopy()
    const first = writeCheckpoint(root, report(root), { source: 'checkpoint', now: new Date('2026-09-15T10:00:00.000Z') })
    expect(first.id).toBe('20260915T100000000Z')
    expect(first.label).toBeNull()
    const directory = checkpointsDirectory(root)
    expect(readdirSync(directory).sort()).toEqual(['20260915T100000000Z.json', '20260915T100000000Z.references.json', '20260915T100000000Z.report.json', 'blobs'])

    const labelled = writeCheckpoint(root, report(root), { source: 'checkpoint', label: '  Mapped   billing ', now: new Date('2026-09-15T10:05:00.000Z') })
    expect(labelled.label).toBe('Mapped billing')
    expect(listCheckpoints(directory).map(item => item.id)).toEqual([labelled.id, first.id])

    const read = readCheckpoint(directory, first.id)!
    expect(read.report.id).toBe('fixture-shop')
    expect(read.digest).toBe(first.digest)
    expect(readCheckpoint(directory, '../etc/passwd')).toBeUndefined()
    expect(readCheckpoint(directory, 'missing')).toBeUndefined()
  })

  it('seals every time it is asked, even when the model has not changed', () => {
    const root = fixtureCopy()
    const compiled = report(root)
    const first = writeCheckpoint(root, compiled, { source: 'checkpoint' })
    const second = writeCheckpoint(root, compiled, { source: 'checkpoint' })
    const pinned = writeCheckpoint(root, compiled, { source: 'pin' })
    expect(second.digest).toBe(first.digest)
    expect(listCheckpoints(checkpointsDirectory(root)).map(item => item.id)).toEqual([pinned.id, second.id, first.id])
  })

  it('refuses a label that is too long and keeps ids unique within a millisecond', () => {
    const root = fixtureCopy()
    expect(() => writeCheckpoint(root, report(root), { source: 'checkpoint', label: 'x'.repeat(121) })).toThrow(/at most 120/)
    const now = new Date('2026-09-15T10:00:00.000Z')
    const one = writeCheckpoint(root, report(root), { source: 'pin', now })
    const two = writeCheckpoint(root, report(root), { source: 'pin', now })
    expect(two.id).not.toBe(one.id)
    expect(two.id > one.id).toBe(true)
  })

  it('keeps only the newest checkpoints', () => {
    const root = fixtureCopy()
    const compiled = report(root)
    const start = new Date('2026-09-15T00:00:00.000Z').getTime()
    for (let index = 0; index < CHECKPOINT_LIMIT + 2; index += 1) {
      writeCheckpoint(root, compiled, { source: 'pin', now: new Date(start + index * 1000) })
    }
    const kept = listCheckpoints(checkpointsDirectory(root))
    expect(kept).toHaveLength(CHECKPOINT_LIMIT)
    expect(kept[0]!.id).toBe('20260915T000051000Z')
    expect(kept.at(-1)!.id).toBe('20260915T000002000Z')
    expect(readdirSync(checkpointsDirectory(root))).toHaveLength(CHECKPOINT_LIMIT * 3 + 1)
  })

  it('creates the watched directory inside the generated cache', () => {
    const root = fixtureCopy()
    const directory = ensureCheckpointsDirectory(root)
    expect(existsSync(directory)).toBe(true)
    expect(realpathSync(directory)).toBe(realpathSync(checkpointsDirectory(root)))
    expect(listCheckpoints(directory)).toEqual([])
  })

  it('ignores forged metadata identities and never prunes outside the cache', () => {
    const root = fixtureCopy()
    const compiled = report(root)
    const directory = ensureCheckpointsDirectory(root)
    const victim = join(root, 'victim.json')
    const victimReport = join(root, 'victim.report.json')
    writeFileSync(victim, 'repository-owned metadata')
    writeFileSync(victimReport, 'repository-owned report')

    const forged = [
      '../../../victim',
      '..\\..\\..\\victim',
      join(root, 'victim'),
      '20260915T000000000Z'
    ]
    for (const [index, id] of forged.entries()) {
      const fileId = `20200101T00000000${index}Z`
      writeFileSync(join(directory, `${fileId}.json`), JSON.stringify({
        id, at: '2020-01-01T00:00:00.000Z', digest: 'x', source: 'checkpoint', label: null
      }))
      expect(readCheckpoint(directory, fileId)).toBeUndefined()
    }
    expect(listCheckpoints(directory)).toEqual([])

    const start = new Date('2026-09-15T00:00:00.000Z').getTime()
    for (let index = 0; index <= CHECKPOINT_LIMIT; index += 1) {
      writeCheckpoint(root, compiled, { source: 'checkpoint', now: new Date(start + index) })
    }
    expect(listCheckpoints(directory)).toHaveLength(CHECKPOINT_LIMIT)
    expect(readFileSync(victim, 'utf8')).toBe('repository-owned metadata')
    expect(readFileSync(victimReport, 'utf8')).toBe('repository-owned report')
    for (let index = 0; index < forged.length; index += 1) {
      expect(existsSync(join(directory, `20200101T00000000${index}Z.json`))).toBe(true)
    }
  })
})

describe('the committed baseline', () => {
  it('compiles the model as the last commit has it, not as the working tree does', { timeout: GIT_TEST_TIMEOUT_MS }, () => {
    const root = repository()
    const resolved = resolveModelRoot(root)
    const file = join(root, '.businesslens', 'capabilities', 'place-order', 'capability.md')
    const source = readFileSync(file, 'utf8')
    writeFileSync(file, source.replace(/^# (.*)$/m, '# $1 (working tree)'))

    const committed = compileCommittedReport(resolved, '2026-08-08')
    expect(committed.commit).toBe(sh(root, 'rev-parse', 'HEAD'))
    expect(committed.subject).toBe('fixture')
    expect(committed.report.model.capabilities.some(item => item.title.endsWith('(working tree)'))).toBe(false)
    expect(report(root).model.capabilities.some(item => item.title.endsWith('(working tree)'))).toBe(true)
    // The working tree stays untouched by the compile.
    expect(readFileSync(file, 'utf8')).toContain('(working tree)')
  })

  it('has no baseline outside a repository or before the first commit', { timeout: GIT_TEST_TIMEOUT_MS }, () => {
    const outside = fixtureCopy()
    expect(() => compileCommittedReport({ modelRoot: outside })).toThrow(/not in a Git repository/)

    const fresh = fixtureCopy()
    sh(fresh, 'init', '--initial-branch=main')
    expect(() => compileCommittedReport(resolveModelRoot(fresh))).toThrow(/not been committed/)
  })

  it('recompiles only when HEAD moves', { timeout: GIT_TEST_TIMEOUT_MS }, () => {
    const root = repository()
    const source = createCommittedReportSource(resolveModelRoot(root))
    const first = source()
    expect(source()).toBe(first)

    const readme = join(root, '.businesslens', 'README.md')
    writeFileSync(readme, `${readFileSync(readme, 'utf8')}\nMore.\n`)
    sh(root, 'commit', '-am', 'touch readme')
    const second = source()
    expect(second).not.toBe(first)
    expect(second.commit).not.toBe(first.commit)
    expect(second.subject).toBe('touch readme')
  })
})
