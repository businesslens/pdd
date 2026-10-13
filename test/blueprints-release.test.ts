import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const SCRIPT = join(ROOT, 'scripts', 'blueprints-release.mjs')
const temporaryDirectories: string[] = []

function release(...args: string[]) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8' })
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

afterAll(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true })
})

describe('Blueprint release script', () => {
  it('shows its usage with --help and -h', () => {
    for (const option of ['--help', '-h']) {
      const result = release(option)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('Usage: pnpm blueprints:release <out-dir>')
      expect(result.stdout).toContain('index.json')
    }
  })

  it('requires exactly one output directory', () => {
    for (const args of [[], ['a', 'b'], ['--wat']]) {
      const result = release(...args)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Pass exactly one output directory')
    }
  })

  it('refuses a non-empty output directory before building anything', () => {
    const out = mkdtempSync(join(tmpdir(), 'pdd-kit-release-'))
    temporaryDirectories.push(out)
    mkdirSync(join(out, 'old'))
    writeFileSync(join(out, 'old', 'stale.json'), '{}')
    const result = release(out)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('is not empty')
    expect(result.stdout).not.toContain('built')
  })
})
