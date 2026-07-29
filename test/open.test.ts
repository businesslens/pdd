import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/build.js'
import { runOpen } from '../src/commands/open.js'
import { lsFiles } from '../src/core/git.js'
import { loadModel } from '../src/core/model.js'
import { redactSourceEvidence, type ProductReportV4 } from '../src/core/portable.js'
import { validateModel } from '../src/commands/validate.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

function initialize(cwd: string): void {
  git(cwd, 'init', '--initial-branch=main')
  git(cwd, 'config', 'user.email', 'fixture@example.com')
  git(cwd, 'config', 'user.name', 'Fixture')
  git(cwd, 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
  git(cwd, 'add', '.')
  git(cwd, 'commit', '--allow-empty', '-m', 'fixture')
}

function withoutRepositoryEvidence(report: ProductReportV4): Record<string, any> {
  const redacted = redactSourceEvidence(report)
  const strip = (items: Array<Record<string, any>>) => items.map(({ codeRefs: _codeRefs, ...item }) => item)
  return {
    ...redacted,
    generatedAt: '<date>',
    generator: { ...redacted.generator, version: '<version>' },
    model: {
      ...redacted.model,
      actors: strip(redacted.model.actors),
      experiences: strip(redacted.model.experiences),
      domains: strip(redacted.model.domains),
      features: strip(redacted.model.features),
      journeys: strip(redacted.model.journeys),
      scenarios: strip(redacted.model.scenarios),
      businessRules: strip(redacted.model.businessRules)
    },
    coverage: '<repository-specific>'
  }
}

let source: string
let target: string

beforeAll(() => {
  source = mkdtempSync(join(tmpdir(), 'bl-open-source-'))
  target = mkdtempSync(join(tmpdir(), 'bl-open-target-'))
  cpSync(FIXTURE, source, { recursive: true })
  initialize(source)
  initialize(target)
})

afterAll(() => {
  rmSync(source, { recursive: true, force: true })
  rmSync(target, { recursive: true, force: true })
})

describe('open report', () => {
  it('opens into an empty repository as a valid draft without transplanting source evidence', async () => {
    const original = buildProject(source)
    expect(await runOpen(target, original.outputFile, false)).toBe(0)
    git(target, 'add', '.')
    git(target, 'commit', '-m', 'open product model')

    const imported = loadModel(target)
    const validation = validateModel(imported, lsFiles(target))
    expect(validation.ok).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('needs at least one codeRef before coverage can leave draft')
    ]))
    expect(imported.journeys.flatMap(journey => journey.entryPoints)).toEqual([])
    expect(imported.experiences.flatMap(experience => experience.entryPoints))
      .toEqual(expect.arrayContaining([{ type: 'web', path: '/' }]))

    const rebuilt = buildProject(target)
    expect(withoutRepositoryEvidence(rebuilt.report)).toEqual(withoutRepositoryEvidence(original.report))
    expect(rebuilt.report.coverage.status).toBe('draft')
    expect(rebuilt.report.coverage.sourceAreas).toEqual([])
    expect(Object.values(rebuilt.report.model).flatMap((value) =>
      Array.isArray(value) ? value.flatMap(item => item.codeRefs || []) : []
    )).toEqual([])
    expect(readFileSync(join(target, '.businesslens/features/checkout.md'), 'utf8'))
      .toContain('businessRules:')
    expect(readFileSync(
      join(target, '.businesslens/journeys/browse-and-buy/scenarios/complete-checkout.md'),
      'utf8'
    )).toContain('## Decision points')
  })

  it('omits the frontmatter block for entities that carry no frontmatter fields', () => {
    const actor = readFileSync(join(target, '.businesslens/actors/shopper.md'), 'utf8')
    expect(actor).not.toContain('{}')
    expect(actor.startsWith('# ')).toBe(true)

    // Entities that do carry fields keep a real frontmatter block.
    expect(readFileSync(join(target, '.businesslens/features/checkout.md'), 'utf8'))
      .toMatch(/^---\ndomain: ordering\n/)
  })

  it('refuses to overwrite a non-empty product model without force', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const report = join(source, '.businesslens/build/report.json')
    expect(await runOpen(target, report, false)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('is not empty'))
    vi.restoreAllMocks()
  })

  it('rejects report fields that cannot be written as canonical entity Markdown', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-invalid-markdown-'))
    const original = buildProject(source)
    const report = structuredClone(original.report)
    report.model.actors[0]!.name = 'Injected actor\n## Extra'
    const file = join(rejectedTarget, 'invalid.json')
    writeFileSync(file, JSON.stringify(report))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(rejectedTarget, file, false)).toBe(1)
    expect(console.error).toHaveBeenCalled()
    expect(() => readFileSync(join(rejectedTarget, '.businesslens/product.md'))).toThrow()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })

  it('rejects inconsistent mapped coverage before writing files', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-invalid-coverage-'))
    const original = buildProject(source)
    const report = structuredClone(original.report)
    report.coverage.mapped.actors = 999
    const file = join(rejectedTarget, 'invalid.json')
    writeFileSync(file, JSON.stringify(report))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(rejectedTarget, file, false)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('coverage.mapped.actors'))
    expect(() => readFileSync(join(rejectedTarget, '.businesslens/product.md'))).toThrow()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })

  it('accepts historical v4 coverage metric names', async () => {
    const legacyTarget = mkdtempSync(join(tmpdir(), 'bl-open-legacy-coverage-'))
    const original = buildProject(source)
    const report = structuredClone(original.report)
    report.coverage.counts = {
      trackedFiles: original.report.coverage.counts.files!
    }
    report.coverage.mapped = {
      journeysWithScenarios: original.report.summary.journeys
    }
    for (const journey of report.model.journeys) journey.codeRefs = []
    for (const scenario of report.model.scenarios) scenario.codeRefs = []
    const file = join(legacyTarget, 'legacy.json')
    writeFileSync(file, JSON.stringify(report))

    expect(await runOpen(legacyTarget, file, false)).toBe(0)
    expect(readFileSync(join(legacyTarget, '.businesslens/product.md'), 'utf8'))
      .toContain('# Fixture Shop')

    rmSync(legacyTarget, { recursive: true, force: true })
  })

  it('directs remote Hub users to pull instead of accepting a URL', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-remote-'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(
      rejectedTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/acme/fixture-shop/report.json',
      false
    )).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('businesslens pull'))

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })
})
