import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const SCRIPT = join(__dirname, '..', 'skills', 'businesslens-init', 'scripts', 'inventory-repository.mjs')
const temporaryDirectories: string[] = []

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('repository inventory', () => {
  it('uses tracked files only and writes deterministic candidate groups', () => {
    const repository = mkdtempSync(join(tmpdir(), 'bl-inventory-'))
    temporaryDirectories.push(repository)
    mkdirSync(join(repository, 'src', 'routes'), { recursive: true })
    mkdirSync(join(repository, 'docs'), { recursive: true })
    writeFileSync(join(repository, 'src', 'routes', 'checkout.ts'), 'export const checkout = true\n')
    writeFileSync(join(repository, 'docs', 'README.md'), '# Docs\n')
    writeFileSync(join(repository, 'untracked.ts'), 'export const ignored = true\n')
    git(repository, 'init', '--initial-branch=main')
    git(repository, 'add', 'src', 'docs')

    const output = execFileSync(
      process.execPath,
      [SCRIPT, '--root', repository, '--write'],
      { encoding: 'utf8' }
    )
    const inventory = JSON.parse(output)

    expect(inventory.trackedFileCount).toBe(2)
    expect(inventory.files).toEqual([
      'docs/README.md',
      'src/routes/checkout.ts'
    ])
    expect(inventory.candidates.documentation).toEqual(['docs/README.md'])
    expect(inventory.candidates.entryPoints).toEqual(['src/routes/checkout.ts'])
    expect(inventory.files).not.toContain('untracked.ts')
    expect(existsSync(join(repository, '.businesslens', 'cache', 'inventory.json'))).toBe(true)
    expect(JSON.parse(
      readFileSync(join(repository, '.businesslens', 'cache', 'inventory.json'), 'utf8')
    )).toEqual(inventory)
  })
})
