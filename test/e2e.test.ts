import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildProject } from '../src/commands/build.js'
import { loadModel } from '../src/core/model.js'
import { validateModel } from '../src/commands/validate.js'
import { lsFiles } from '../src/core/git.js'
import { PortableProjectV3Schema } from '../src/core/portable.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function sh(cwd: string, command: string, ...args: string[]): void {
  execFileSync(command, args, { cwd, stdio: 'pipe' })
}

let repo: string

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'bl-e2e-'))
  cpSync(FIXTURE, repo, { recursive: true })
  sh(repo, 'git', 'init', '--initial-branch=main')
  sh(repo, 'git', 'config', 'user.email', 'fixture@example.com')
  sh(repo, 'git', 'config', 'user.name', 'Fixture')
  sh(repo, 'git', 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
  sh(repo, 'git', 'add', '.')
  sh(repo, 'git', 'commit', '-m', 'fixture')
})

afterAll(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('end to end on a real git repo', () => {
  it('validates the fixture against real git ls-files', () => {
    const result = validateModel(loadModel(repo), lsFiles(repo))
    expect(result.errors).toEqual([])
  })

  it('builds a schema-valid portable project deterministically', () => {
    const first = buildProject(repo)
    const output = JSON.parse(readFileSync(first.outputFile, 'utf8'))
    const parsed = PortableProjectV3Schema.parse(output)
    expect(parsed.id).toBe('fixture-shop')
    expect(parsed.summary).toEqual({ actors: 2, experiences: 2, domains: 2, journeys: 2, scenarios: 3 })
    expect(parsed.model.journeys[0]!.experienceIds).toEqual(['storefront'])
    expect(parsed.model.actors.find(actor => actor.id === 'shopper')?.codeRefs).toEqual([
      { path: 'src/routes/storefront.ts' }
    ])
    expect(parsed.model.domains.find(domain => domain.id === 'catalog')?.codeRefs).toEqual([
      { path: 'src/services/catalog.ts' }
    ])
    expect(parsed.coverage.mapped).toMatchObject({ actors: 1, domains: 2 })
    expect(parsed.source.repositoryUrl).toBe('https://github.com/example/fixture-shop')

    const second = buildProject(repo)
    expect(JSON.stringify(second.project)).toBe(JSON.stringify(first.project))
  })

  it('refuses to build with a dirty tracked worktree', () => {
    sh(repo, 'bash', '-c', 'echo "// dirty" >> src/models/order.ts')
    expect(() => buildProject(repo)).toThrow(/uncommitted changes/)
    sh(repo, 'git', 'checkout', '--', 'src/models/order.ts')
  })

  it('refuses to build when authored product-map files are untracked', () => {
    const untracked = join(repo, '.businesslens/actors/uncommitted.md')
    writeFileSync(untracked, '# Uncommitted actor\n\nA map entity that does not exist at HEAD.\n')
    expect(() => buildProject(repo)).toThrow(/authored \.businesslens\/ map has uncommitted or untracked files/)
    rmSync(untracked)
  })
})
