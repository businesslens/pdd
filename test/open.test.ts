import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/export.js'
import { runOpen } from '../src/commands/open.js'
import { lsFiles } from '../src/core/git.js'
import { loadModel } from '../src/core/model.js'
import { redactSourceEvidence, type ProductReportV4 } from '../src/core/portable.js'
import { lintModel } from '../src/commands/lint.js'

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
  it('opens into an empty repository without downgrading model completeness', async () => {
    const original = buildProject(source)
    expect(await runOpen(target, original.outputFile, false)).toBe(0)
    git(target, 'add', '.')
    git(target, 'commit', '-m', 'open product model')

    const imported = loadModel(target)
    const lint = lintModel(imported, lsFiles(target))
    expect(lint.ok).toBe(true)
    expect(lint.errors).toEqual([])
    expect(lint.warnings).toEqual([])
    expect(imported.journeys.flatMap(journey => journey.entryPoints)).toEqual([])
    expect(imported.experiences.flatMap(experience => experience.entryPoints))
      .toEqual(expect.arrayContaining([{ type: 'web', path: '/' }]))

    const rebuilt = buildProject(target)
    expect(withoutRepositoryEvidence(rebuilt.report)).toEqual(withoutRepositoryEvidence(original.report))
    expect(rebuilt.report.coverage.status).toBe(original.report.coverage.status)
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

  it('preserves known unmapped product areas as model-breadth context', async () => {
    const fresh = mkdtempSync(join(tmpdir(), 'bl-open-unmapped-'))
    initialize(fresh)
    try {
      const report = structuredClone(buildProject(source).report)
      report.coverage.status = 'partial'
      report.coverage.unmapped = ['Back-office dispute handling']
      const file = join(fresh, 'partial.json')
      writeFileSync(file, JSON.stringify(report))

      expect(await runOpen(fresh, file, false)).toBe(0)
      const imported = loadModel(fresh)
      expect(imported.coverage.status).toBe('partial')
      expect(imported.coverage.unmapped).toEqual(['Back-office dispute handling'])
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })

  it('writes the model README, because the model arrived from elsewhere', async () => {
    // A fresh repository: the suite's shared target already holds a model, and
    // `open` refuses a non-empty `.businesslens/` without --force.
    const fresh = mkdtempSync(join(tmpdir(), 'bl-open-readme-'))
    initialize(fresh)
    try {
      const original = buildProject(source)
      expect(await runOpen(fresh, original.outputFile, false)).toBe(0)

      const readme = readFileSync(join(fresh, '.businesslens', 'README.md'), 'utf8')
      expect(readme).toContain('BusinessLens Product Model')
      expect(readme).toContain('Treat scenarios as the acceptance contract')
      expect(readme).toContain('codeRefs` as optional navigation')
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })

  it('writes nothing outside .businesslens/, including repository instructions', async () => {
    // The invariant adr/0002 buys: BusinessLens owns one directory and touches
    // nothing else, so a repository's own instruction files are never contested.
    const fresh = mkdtempSync(join(tmpdir(), 'bl-open-outside-'))
    initialize(fresh)
    try {
      const original = buildProject(source)
      writeFileSync(join(fresh, 'AGENTS.md'), '# House rules\n\nRun the linter.\n')
      writeFileSync(join(fresh, 'CLAUDE.md'), '# Claude rules\n\nPreserve this file.\n')
      writeFileSync(join(fresh, 'README.md'), '# Existing repository\n')
      expect(await runOpen(fresh, original.outputFile, false)).toBe(0)
      expect(await runOpen(fresh, original.outputFile, true)).toBe(0)

      expect(readFileSync(join(fresh, 'AGENTS.md'), 'utf8')).toBe('# House rules\n\nRun the linter.\n')
      expect(readFileSync(join(fresh, 'CLAUDE.md'), 'utf8')).toBe('# Claude rules\n\nPreserve this file.\n')
      expect(readFileSync(join(fresh, 'README.md'), 'utf8')).toBe('# Existing repository\n')

      // `.businesslens/` and — because the second open passed --force — its
      // timestamped backup. Nothing the repository owns for its own purposes.
      const owned = new Set(['.git', 'AGENTS.md', 'CLAUDE.md', 'README.md'])
      const created = readdirSync(fresh).filter(entry => !owned.has(entry))
      expect(created.every(entry => entry.startsWith('.businesslens'))).toBe(true)
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })

  it('expands to a fixed point so a re-opened model is byte-identical', async () => {
    // A catalog Blueprint's committed model is itself an expanded report, so
    // `pull` re-expands it and the result has to match what is committed. The
    // open-coverage limitation used to be appended unconditionally, gaining one
    // copy per cycle and making that comparison fail from the second pull on.
    const first = readFileSync(join(target, '.businesslens/coverage.md'), 'utf8')
    expect(first.match(/Implementation alignment must be verified/g)).toHaveLength(1)

    const roundTrip = mkdtempSync(join(tmpdir(), 'businesslens-open-fixed-point-'))
    try {
      initialize(roundTrip)
      expect(await runOpen(roundTrip, buildProject(target).outputFile, false)).toBe(0)
      const second = readFileSync(join(roundTrip, '.businesslens/coverage.md'), 'utf8')
      expect(second.match(/Implementation alignment must be verified/g)).toHaveLength(1)
      expect(second).toEqual(first)
    } finally {
      rmSync(roundTrip, { recursive: true, force: true })
    }
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
