import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/export.js'
import { runOpen } from '../src/commands/open.js'
import { lsFiles } from '../src/core/git.js'
import { loadModel } from '../src/core/model.js'
import { projectPortableReport, type ProductReportV11 } from '../src/core/portable.js'
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

function withoutRepositoryEvidence(report: ProductReportV11): Record<string, any> {
  const portable = projectPortableReport(report)
  return {
    ...portable,
    generatedAt: '<date>',
    generator: { ...portable.generator, version: '<version>' },
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
    expect(imported.journeys[0]).toMatchObject({
      id: 'browse-and-buy',
      goal: 'A shopper wants to purchase a suitable product.',
      successCriterion: 'A confirmed order exists for the selected product.'
    })
    expect(imported.interfaces.map(productInterface => [productInterface.id, productInterface.type]))
      .toEqual(expect.arrayContaining([
        ['customer-web', 'web'],
        ['customer-mobile', 'mobile-app'],
        ['operator-cli', 'cli']
      ]))
    expect(imported.journeyScenarios[0]!.steps.map(step => [step.text, step.capability])).toEqual([
      ['The shopper finds and selects an available product', 'browse-catalog'],
      ['The shopper submits checkout', 'place-order'],
      ['The Product confirms the paid order', undefined]
    ])
    expect(imported.experiences.flatMap(experience => experience.entryPoints))
      .toEqual(expect.arrayContaining([{ type: 'customer-web', path: '/' }]))
    // The Screen exists once per Interface: same purpose, two places, and the id
    // carries which is which.
    expect(imported.screens.map(screen => screen.id)).toEqual([
      'customer-mobile::storefront::product-record',
      'customer-web::storefront::product-record'
    ])
    expect(imported.screens[1]).toMatchObject({
      id: 'customer-web::storefront::product-record',
      containerId: 'customer-web::storefront',
      capabilities: ['browse-catalog', 'place-order']
    })
    expect(imported.screens.flatMap(screen => screen.entryPoints.map(point => point.path))).toEqual([
      'fixture-shop://products/:id',
      '/products/:id'
    ])

    const rebuilt = buildProject(target)
    expect(withoutRepositoryEvidence(rebuilt.report)).toEqual(withoutRepositoryEvidence(original.report))
    expect(rebuilt.report.coverage.status).toBe(original.report.coverage.status)
    expect(rebuilt.report.coverage.sourceAreas).toEqual([])
    expect(Object.values(rebuilt.report.model).flatMap(value =>
      Array.isArray(value) ? value.flatMap(item => item.references || []) : []
    ).every(reference =>
      reference.kind !== 'code'
      && reference.role !== 'implementation'
      && /^https?:\/\//.test(reference.target)
    )).toBe(true)
    expect(readFileSync(join(target, '.businesslens/capabilities/place-order/capability.md'), 'utf8'))
      .toContain('availability:')
    expect(readFileSync(join(target, '.businesslens/business-rules/payment-before-confirmation.md'), 'utf8'))
      .toContain('appliesTo:')
    expect(readFileSync(
      join(target, '.businesslens/capabilities/place-order/scenarios/complete-checkout.md'),
      'utf8'
    )).toContain('## Decision points')
    expect(readFileSync(
      join(target, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md'),
      'utf8'
    )).toContain('## Handoff note')
    expect(readFileSync(
      join(target, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md'),
      'utf8'
    )).toContain('steps:')
    expect(readFileSync(
      join(target, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md'),
      'utf8'
    )).not.toContain('## Steps')
    expect(readFileSync(join(target, '.businesslens/journeys/browse-and-buy/journey.md'), 'utf8'))
      .toContain('## Teaching note')
    expect(readFileSync(join(target, '.businesslens/capabilities/place-order/scenarios/complete-checkout.md'), 'utf8'))
      .toContain('## Recovery note')
    expect(readFileSync(join(target, '.businesslens/product.md'), 'utf8'))
      .toContain('## Teaching note')
    expect(readFileSync(join(target, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md'), 'utf8'))
      .toContain('## Product states')
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

  it('round-trips direct Interface availability without creating Experiences', async () => {
    const fresh = mkdtempSync(join(tmpdir(), 'bl-open-direct-'))
    initialize(fresh)
    try {
      const report = structuredClone(buildProject(source).report)
      report.model.experiences = []
      report.counts.experiences = 0
      for (const collection of [
        report.model.capabilities,
        report.model.businessRules
      ]) {
        for (const element of collection) {
          if ('availability' in element) {
            element.availability = element.availability.map(context => ({
              placeId: context.placeId.split('::')[0]!
            }))
          }
        }
      }
      const directScreenIds = new Map<string, string>()
      for (const screen of report.model.screens) {
        // interface::experience::screen -> interface::screen
        const parts = screen.id.split('::')
        directScreenIds.set(screen.id, [parts[0], parts.at(-1)].join('::'))
      }
      for (const scenario of [...report.model.capabilityScenarios, ...report.model.journeyScenarios]) {
        for (const step of scenario.steps) {
          for (const context of step.contexts) {
            context.placeId = directScreenIds.get(context.placeId) || context.placeId.split('::')[0]!
          }
        }
      }
      for (const screen of report.model.screens) screen.id = directScreenIds.get(screen.id)!
      const file = join(fresh, 'direct-report.json')
      writeFileSync(file, JSON.stringify(report))

      expect(await runOpen(fresh, file, false)).toBe(0)
      const imported = loadModel(fresh)
      expect(imported.experiences).toEqual([])
      expect(imported.capabilities.flatMap(capability => capability.availability))
        .toEqual(expect.arrayContaining([{ place: 'customer-web' }, { place: 'customer-mobile' }]))
      expect(readFileSync(join(fresh, '.businesslens/capabilities/place-order/capability.md'), 'utf8'))
        .not.toContain('::')
      expect(readFileSync(join(fresh, '.businesslens/config.yaml'), 'utf8'))
        .toContain('schema: 7')

      const rebuilt = buildProject(fresh)
      expect(withoutRepositoryEvidence(rebuilt.report)).toEqual(withoutRepositoryEvidence(report))
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
      expect(readme).toContain('Treat Capability Scenarios as local acceptance contracts')
      expect(readme).toContain('References are optional navigation and context')
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  })

  it('writes nothing outside .businesslens/, including repository instructions', async () => {
    // The invariant in AGENTS.md "Installer standards" buys:
    // BusinessLens owns one directory, so repository instructions are untouched.
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

  it('writes required classifications and omits absent optional fields', () => {
    const product = readFileSync(join(target, '.businesslens/product.md'), 'utf8')
    expect(product).toContain('summary: Browse a product catalog, buy products, and manage the resulting orders.')
    expect(product).toContain('category: commerce')
    expect(product).not.toContain('icon:')
    expect(product).not.toContain('accent:')
    expect(product).toContain('license: MIT')

    const actor = readFileSync(join(target, '.businesslens/actors/shopper.md'), 'utf8')
    expect(actor).toMatch(/^---\nkind: person\nrelationship: external\n---\n/)

    expect(readFileSync(join(target, '.businesslens/capabilities/place-order/capability.md'), 'utf8'))
      .toMatch(/^---\ndomain: ordering\navailability:/)
  })

  it('refuses to overwrite a non-empty product model without force', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const report = join(source, '.businesslens/build/report.json')
    expect(await runOpen(target, report, false)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('is not empty'))
    vi.restoreAllMocks()
  })

  it('rejects report fields that cannot be written as canonical element Markdown', async () => {
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

  it('rejects a portable report that exposes a local reference before writing files', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-invalid-reference-'))
    const original = buildProject(source)
    const report = structuredClone(original.report)
    report.model.actors[0]!.references = [
      { kind: 'doc', role: 'context', target: 'docs/private.md' }
    ]
    const file = join(rejectedTarget, 'invalid.json')
    writeFileSync(file, JSON.stringify(report))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(rejectedTarget, file, false)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('portable report still exposes reference'))
    expect(() => readFileSync(join(rejectedTarget, '.businesslens/product.md'))).toThrow()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })

  it('rejects historical Product Reports instead of migrating them', async () => {
    const legacyTarget = mkdtempSync(join(tmpdir(), 'bl-open-v9-'))
    initialize(legacyTarget)
    try {
      const report = structuredClone(buildProject(source).report) as Record<string, any>
      report.schemaVersion = '9.0.0'
      const file = join(legacyTarget, 'v9.json')
      writeFileSync(file, JSON.stringify(report))
      vi.spyOn(console, 'error').mockImplementation(() => undefined)

      expect(await runOpen(legacyTarget, file, false)).toBe(1)
      expect(console.error).toHaveBeenCalled()
      expect(() => readFileSync(join(legacyTarget, '.businesslens/product.md'))).toThrow()
    } finally {
      vi.restoreAllMocks()
      rmSync(legacyTarget, { recursive: true, force: true })
    }
  })

  it('directs remote Hub users to pull instead of accepting a URL', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-remote-'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(
      rejectedTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/acme/fixture-shop/report.json',
      false
    )).toBe(2)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('businesslens blueprint pull'))

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })
})
