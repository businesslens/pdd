import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { compileCommittedReport } from '../src/core/committed-report.js'

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
  const directory = mkdtempSync(join(tmpdir(), 'bl-committed-report-'))
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

  it('rejects historical models in an older format without migrating them', { timeout: GIT_TEST_TIMEOUT_MS }, () => {
    const root = repository()
    const resolved = resolveModelRoot(root)
    const config = join(root, '.businesslens/config.yaml')
    const current = readFileSync(config, 'utf8')
    writeFileSync(config, current.replace('schema: 11', 'schema: 10'))
    sh(root, 'commit', '-am', 'Older format')
    writeFileSync(config, current)
    const status = sh(root, 'status', '--porcelain')
    expect(() => compileCommittedReport(resolved)).toThrow('schema 10 is not supported')
    expect(sh(root, 'status', '--porcelain')).toBe(status)
    expect(readFileSync(config, 'utf8')).toBe(current)
  })
})
