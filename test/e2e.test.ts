import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildProject } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { lintModel } from '../src/commands/lint.js'
import { lsFiles } from '../src/core/git.js'
import { ProductReportV4Schema } from '../src/core/portable.js'

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
  it('lints the fixture against real git ls-files', () => {
    const result = lintModel(loadModel(repo), lsFiles(repo))
    expect(result.errors).toEqual([])
  })

  it('builds a schema-valid source-free report deterministically', () => {
    const first = buildProject(repo)
    const output = JSON.parse(readFileSync(first.outputFile, 'utf8'))
    const parsed = ProductReportV4Schema.parse(output)
    expect(parsed.id).toBe('fixture-shop')
    expect(parsed.summary).toEqual({
      actors: 2,
      experiences: 2,
      domains: 2,
      features: 3,
      journeys: 2,
      scenarios: 3,
      businessRules: 2
    })
    expect(parsed.model.journeys[0]!.experienceIds).toEqual(['storefront'])

    // Export produces a Blueprint, and a Blueprint carries no source evidence.
    // The fixture's model is full of codeRefs; none of them survive the trip.
    expect(parsed.model.actors.find(actor => actor.id === 'shopper')?.codeRefs).toEqual([])
    expect(parsed.model.domains.find(domain => domain.id === 'catalog')?.codeRefs).toEqual([])
    expect(Object.values(parsed.model).flatMap(entry =>
      Array.isArray(entry) ? entry.flatMap(item => item.codeRefs ?? []) : []
    )).toEqual([])
    expect(parsed.coverage.evidenceRedacted).toBe(true)

    // `mapped` still counts which authored entities carried bookmarks, so coverage does
    // not silently collapse to zero just because the paths were stripped.
    expect(parsed.coverage.mapped).toMatchObject({ actors: 1, domains: 2 })
    expect(parsed.model.features.find(feature => feature.id === 'checkout')?.businessRuleIds)
      .toEqual(['payment-before-confirmation'])
    expect(parsed.model.scenarios.find(scenario => scenario.id === 'complete-checkout')?.decisionPoints)
      .toHaveLength(1)
    expect(JSON.stringify(parsed)).not.toContain('github.com/example/fixture-shop')

    const second = buildProject(repo)
    expect(JSON.stringify(second.report)).toBe(JSON.stringify(first.report))
  })

  it('builds a draft planned model', () => {
    const isolated = mkdtempSync(join(tmpdir(), 'bl-e2e-draft-'))
    try {
      cpSync(FIXTURE, isolated, { recursive: true })
      writeFileSync(
        join(isolated, '.businesslens/coverage.md'),
        '---\nstatus: draft\nmethod: ["Planned before implementation"]\nsourceAreas: []\nunmapped: []\nlimitations: []\n---\n\n# Coverage\n\nPlanned map.\n'
      )
      sh(isolated, 'git', 'init', '--initial-branch=main')
      sh(isolated, 'git', 'config', 'user.email', 'fixture@example.com')
      sh(isolated, 'git', 'config', 'user.name', 'Fixture')
      sh(isolated, 'git', 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
      sh(isolated, 'git', 'add', '.')
      sh(isolated, 'git', 'commit', '-m', 'fixture')
      expect(buildProject(isolated).report.coverage.status).toBe('draft')
    } finally {
      rmSync(isolated, { recursive: true, force: true })
    }
  })

  it('build remains source-free and works with a dirty tracked worktree', () => {
    sh(repo, 'bash', '-c', 'echo "// dirty" >> src/models/order.ts')
    expect(buildProject(repo).report.id).toBe('fixture-shop')
    sh(repo, 'git', 'checkout', '--', 'src/models/order.ts')
  })

  it('build validates untracked authored product-model files without requiring publish provenance', () => {
    const untracked = join(repo, '.businesslens/actors/uncommitted.md')
    writeFileSync(untracked, '# Uncommitted actor\n\nA model entity that does not exist at HEAD.\n')
    expect(buildProject(repo).report.model.actors.some(actor => actor.id === 'uncommitted')).toBe(true)
    rmSync(untracked)
  })

  it('refuses to overwrite a generated-output symlink', () => {
    const external = mkdtempSync(join(tmpdir(), 'bl-external-'))
    const target = join(external, 'do-not-overwrite.json')
    const output = join(repo, '.businesslens/build/report.json')
    writeFileSync(target, 'keep me\n')
    rmSync(output, { force: true })
    symlinkSync(target, output)

    try {
      expect(() => buildProject(repo)).toThrow(/symbolic link/)
      expect(readFileSync(target, 'utf8')).toBe('keep me\n')
    } finally {
      rmSync(output, { force: true })
      rmSync(external, { recursive: true, force: true })
    }
  })

  it('refuses to traverse a generated-output directory symlink', () => {
    const external = mkdtempSync(join(tmpdir(), 'bl-external-dir-'))
    const buildDir = join(repo, '.businesslens/build')
    rmSync(buildDir, { recursive: true, force: true })
    symlinkSync(external, buildDir)
    sh(repo, 'git', 'add', '--force', '.businesslens/build')
    sh(repo, 'git', 'commit', '-m', 'track malicious generated-output symlink')

    try {
      expect(() => buildProject(repo)).toThrow(/symbolic link/)
      expect(() => readFileSync(join(external, 'report.json'), 'utf8')).toThrow()
    } finally {
      rmSync(buildDir, { recursive: true, force: true })
      rmSync(external, { recursive: true, force: true })
    }
  })
})
