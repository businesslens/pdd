import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { repositoryInventory } from '../src/core/repository-inventory.js'

describe('local repository inventory', () => {
  it('lists current tracked and untracked files, optionally includes ignored files, and never traverses symlinks', async () => {
    const base = mkdtempSync(join(tmpdir(), 'bl-inventory-'))
    const root = join(base, 'repo')
    mkdirSync(root)
    execFileSync('git', ['init', '-q', root])
    writeFileSync(join(root, '.gitignore'), 'generated/\n')
    writeFileSync(join(root, 'tracked.ts'), 'private content')
    writeFileSync(join(root, 'deleted.ts'), '')
    execFileSync('git', ['-C', root, 'add', '.'])
    rmSync(join(root, 'deleted.ts'))
    writeFileSync(join(root, 'untracked.ts'), '')
    mkdirSync(join(root, 'generated'))
    writeFileSync(join(root, 'generated', 'ignored.js'), '')
    mkdirSync(join(base, 'outside'))
    writeFileSync(join(base, 'outside', 'secret.txt'), 'secret')
    symlinkSync(join(base, 'outside'), join(root, 'linked'), 'dir')
    try {
      const expected = ['.gitignore', 'linked', 'tracked.ts', 'untracked.ts']
      expect((await repositoryInventory(root, false)).paths).toEqual(expected)
      expect((await repositoryInventory(root, true)).paths).toEqual(['.gitignore', 'generated/ignored.js', 'linked', 'tracked.ts', 'untracked.ts'])
    } finally {
      rmSync(base, { recursive: true, force: true })
    }
  })

  it('reports unavailable Git context instead of an empty repository', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bl-inventory-missing-git-'))
    try {
      await expect(repositoryInventory(root, false)).rejects.toThrow()
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
})
