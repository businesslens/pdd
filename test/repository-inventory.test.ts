import { execFileSync } from 'node:child_process'
import { request } from 'node:http'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { repositoryInventory } from '../src/core/repository-inventory.js'
import { startLocalViewer } from '../src/core/local-viewer-server.js'
import type { ProductReportV16 } from '../src/core/portable.js'
import type { RepositoryInventory } from '../src/core/coverage.js'

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
    const viewer = await startLocalViewer({ compile: () => ({ id: 'fixture' }) as ProductReportV16, assetRoot: root })
    try {
      const expected = ['.gitignore', 'linked', 'tracked.ts', 'untracked.ts']
      expect((await repositoryInventory(root, false)).paths).toEqual(expected)
      expect((await repositoryInventory(root, true)).paths).toEqual(['.gitignore', 'generated/ignored.js', 'linked', 'tracked.ts', 'untracked.ts'])
      const response = await fetch(`${viewer.url}/_businesslens/repository.json`)
      expect(response.status).toBe(200)
      expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
      expect(await response.json()).toMatchObject({ paths: expected, coverage: { baseline: null, pending: null, modelChanged: null } })
      const ignored = await fetch(`${viewer.url}/_businesslens/repository.json?includeIgnored=true`)
      expect((await ignored.json() as RepositoryInventory).paths).toContain('generated/ignored.js')
      writeFileSync(join(root, 'new.ts'), '')
      expect((await (await fetch(`${viewer.url}/_businesslens/repository.json`)).json() as RepositoryInventory).paths).toContain('new.ts')
      expect((await fetch(`${viewer.url}/_businesslens/repository.json`, { method: 'POST' })).status).toBe(405)
      const refused = await new Promise<number | undefined>((resolve, reject) => {
        const req = request(`${viewer.url}/_businesslens/repository.json`, { headers: { host: 'untrusted.example' } }, response => {
          response.resume()
          response.on('end', () => resolve(response.statusCode))
        })
        req.on('error', reject)
        req.end()
      })
      expect(refused).toBe(403)
    } finally {
      await viewer.close()
      rmSync(base, { recursive: true, force: true })
    }
  })

  it('distinguishes unavailable repository context from an empty inventory', async () => {
    const viewer = await startLocalViewer({ compile: () => ({ id: 'fixture' }) as ProductReportV16 })
    try {
      const response = await fetch(`${viewer.url}/_businesslens/repository.json`)
      expect(response.status).toBe(404)
      expect((await response.json() as { message: string }).message).toContain('no local repository inventory')
    } finally { await viewer.close() }
  })
})
