import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/build.js'
import { runOpen } from '../src/commands/open.js'
import { canonicalReportJson } from '../src/core/portable.js'
import { lsFiles } from '../src/core/git.js'
import { loadModel } from '../src/core/model.js'
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

function withoutRepositoryEvidence(report: Record<string, any>): Record<string, any> {
  const strip = (items: Array<Record<string, any>>) => items.map(({ codeRefs: _codeRefs, ...item }) => item)
  return {
    ...report,
    generatedAt: '<date>',
    generator: { ...report.generator, version: '<version>' },
    model: {
      ...report.model,
      actors: strip(report.model.actors),
      experiences: strip(report.model.experiences),
      domains: strip(report.model.domains),
      features: strip(report.model.features),
      journeys: strip(report.model.journeys),
      scenarios: strip(report.model.scenarios),
      businessRules: strip(report.model.businessRules)
    },
    coverage: '<repository-specific>'
  }
}

let source: string
let target: string
let remoteTarget: string

beforeAll(() => {
  source = mkdtempSync(join(tmpdir(), 'bl-open-source-'))
  target = mkdtempSync(join(tmpdir(), 'bl-open-target-'))
  remoteTarget = mkdtempSync(join(tmpdir(), 'bl-open-remote-'))
  cpSync(FIXTURE, source, { recursive: true })
  initialize(source)
  initialize(target)
})

afterAll(() => {
  rmSync(source, { recursive: true, force: true })
  rmSync(target, { recursive: true, force: true })
  rmSync(remoteTarget, { recursive: true, force: true })
})

describe('open report', () => {
  it('opens into an empty repository as a valid draft without transplanting source evidence', async () => {
    const original = buildProject(source)
    expect(await runOpen(target, original.outputFile, false)).toBe(0)
    git(target, 'add', '.')
    git(target, 'commit', '-m', 'open product model')

    const validation = validateModel(loadModel(target), lsFiles(target))
    expect(validation.ok).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('needs at least one codeRef before coverage can leave draft')
    ]))

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

  it('refuses to overwrite a non-empty product model without force', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const report = join(source, '.businesslens/build/report.json')
    expect(await runOpen(target, report, false)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('is not empty'))
    vi.restoreAllMocks()
  })

  it('verifies a remote Hub report digest before writing files', async () => {
    const original = buildProject(source)
    const report = JSON.parse(readFileSync(original.outputFile, 'utf8')) as unknown
    const digest = createHash('sha256').update(canonicalReportJson(report)).digest('hex')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(report), {
      headers: { 'x-businesslens-report-digest': digest }
    }))

    expect(await runOpen(
      remoteTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/fixture-shop/releases/1/report.json',
      false
    )).toBe(0)
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }))
    vi.restoreAllMocks()
  })

  it('rejects a remote report whose digest header is invalid', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-rejected-'))
    const original = buildProject(source)
    const report = readFileSync(original.outputFile, 'utf8')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(report, {
      headers: { 'x-businesslens-report-digest': '0'.repeat(64) }
    }))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(
      rejectedTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/fixture-shop/report.json',
      false
    )).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('digest does not match'))
    expect(() => readFileSync(join(rejectedTarget, '.businesslens/product.md'))).toThrow()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
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

  it('rejects query-bearing remote report URLs before fetching', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-query-'))
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(
      rejectedTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/fixture-shop/report.json?token=secret',
      false
    )).toBe(1)
    expect(fetchMock).not.toHaveBeenCalled()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })

  it('stops streaming a remote report once it exceeds the byte limit', async () => {
    const rejectedTarget = mkdtempSync(join(tmpdir(), 'bl-open-oversized-'))
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array((8 * 1024 * 1024) + 1))
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runOpen(
      rejectedTarget,
      'https://app.businesslens.io/api/v1/hub/blueprints/fixture-shop/report.json',
      false
    )).toBe(1)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('8 MiB'))
    expect(() => readFileSync(join(rejectedTarget, '.businesslens/product.md'))).toThrow()

    vi.restoreAllMocks()
    rmSync(rejectedTarget, { recursive: true, force: true })
  })
})
