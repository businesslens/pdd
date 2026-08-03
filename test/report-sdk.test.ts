import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as sdk from '../src/report.js'
import { reportDigest } from '../src/report-digest.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import type { ProductReportV6, ReportReference } from '../src/core/portable.js'

const packageJson = JSON.parse(
  await readFile(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
) as { exports?: Record<string, unknown>, dependencies?: Record<string, string> }

describe('report SDK entry point', () => {
  it('is exposed as the ./report and ./report/digest subpath exports', () => {
    expect(packageJson.exports?.['./report']).toEqual({
      types: './dist/report.d.ts',
      default: './dist/report.js'
    })
    expect(packageJson.exports?.['./report/digest']).toEqual({
      types: './dist/report-digest.d.ts',
      default: './dist/report-digest.js'
    })
  })

  it('exports the schema, semantic validator, portable projection, and digest', () => {
    expect(sdk.REPORT_SCHEMA_VERSION).toBe('6.0.0')
    for (const name of [
      'ProductReportV6Schema',
      'ProductReportSchema',
      'ReportReferenceSchema',
      'ReportInterfaceSchema',
      'ReportAvailabilitySchema',
      'ReportCapabilitySchema',
      'ReportScreenSchema',
      'ReportScreenStateSchema',
      'validateProductReport',
      'parseProductReport',
      'projectPortableReport',
      'canonicalReportJson'
    ]) {
      expect(sdk, `missing export ${name}`).toHaveProperty(name)
    }
  })

  it('never pulls the CLI or Node built-ins into the library graph', async () => {
    const seen = new Set<string>()
    const external = new Set<string>()
    const entry = fileURLToPath(new URL('../src/report.ts', import.meta.url))

    async function walk(file: string): Promise<void> {
      if (seen.has(file)) return
      seen.add(file)
      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
        const specifier = match[1]!
        if (!specifier.startsWith('.')) {
          external.add(specifier)
          continue
        }
        await walk(fileURLToPath(new URL(specifier.replace(/\.js$/, '.ts'), `file://${file}`)))
      }
    }
    await walk(entry)

    expect([...external].sort()).toEqual(['zod'])
    expect([...seen].some(file => file.includes('/commands/'))).toBe(false)
    for (const specifier of external) expect(packageJson.dependencies).toHaveProperty(specifier)
  })

  it('computes a key-order-independent digest', () => {
    const digest = reportDigest({ b: 1, a: [{ d: 2, c: 3 }] })
    expect(reportDigest({ a: [{ c: 3, d: 2 }], b: 1 })).toBe(digest)
    expect(sdk.canonicalReportJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })
})

describe('projectPortableReport', () => {
  const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'fixture-shop')
  let repo: string
  let report: ProductReportV6

  const allReferences = (value: ProductReportV6): ReportReference[] => [
    ...value.references,
    ...Object.values(value.model).flatMap(entry =>
      Array.isArray(entry) ? entry.flatMap(item => item.references ?? []) : [])
  ]

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), 'bl-portable-'))
    cpSync(FIXTURE, repo, { recursive: true })
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
    git('init', '--initial-branch=main')
    git('config', 'user.email', 'fixture@example.com')
    git('config', 'user.name', 'Fixture')
    git('add', '.')
    git('commit', '-m', 'fixture')
    const { modelRoot } = resolveModelRoot(repo)
    report = compileReport(loadModel(modelRoot), '2026-01-01')
  })

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true })
  })

  it('compiles a workspace profile with implementation navigation', () => {
    expect(report.referenceProfile).toBe('workspace')
    expect(allReferences(report).some(reference => reference.kind === 'code')).toBe(true)
    expect(report.coverage).toEqual({
      status: 'complete',
      method: ['Hand-authored golden fixture covering every source file.'],
      sourceAreas: ['src'],
      unmapped: [],
      limitations: [],
      rationale: 'The fixture map intentionally covers the whole toy codebase.'
    })
  })

  it('keeps only HTTP(S) intent and context references', () => {
    const enriched = structuredClone(report)
    enriched.model.actors[0]!.references = [
      { kind: 'code', role: 'intent', target: 'src/routes/storefront.ts' },
      { kind: 'doc', role: 'context', target: 'docs/local.md' },
      { kind: 'doc', role: 'context', target: 'https://example.com/handbook', title: 'Handbook' },
      { kind: 'visual', role: 'implementation', target: 'https://example.com/current.png' },
      { kind: 'proposal', role: 'intent', target: 'https://example.com/proposal' }
    ]

    const portable = sdk.projectPortableReport(enriched)
    expect(portable.referenceProfile).toBe('portable')
    expect(portable.model.actors[0]!.references).toEqual([
      { kind: 'doc', role: 'context', target: 'https://example.com/handbook', title: 'Handbook' },
      { kind: 'proposal', role: 'intent', target: 'https://example.com/proposal' }
    ])
    expect(allReferences(portable).every(reference =>
      reference.kind !== 'code'
      && reference.role !== 'implementation'
      && /^https?:\/\//.test(reference.target)
    )).toBe(true)
    expect(JSON.stringify(portable)).not.toContain('src/services/payments.ts')
  })

  it('drops repository entry points and Coverage source areas', () => {
    const enriched = structuredClone(report)
    enriched.model.journeys[0]!.entryPoints = [
      { type: 'relative', path: 'src/routes/storefront.ts' },
      { type: 'windows', path: String.raw`src\routes\storefront.ts` },
      { type: 'absolute', path: '/Users/owner/project/src/routes/storefront.ts' },
      { type: 'file-url', path: 'file:///Users/owner/project/src/routes/storefront.ts' },
      { type: 'route', path: '/checkout' },
      { type: 'url', path: 'https://example.com/checkout' },
      { type: 'mobile', path: 'fixture-shop://checkout' },
      { type: 'cli', path: 'shop checkout' }
    ]

    const portable = sdk.projectPortableReport(enriched)
    expect(portable.model.journeys[0]!.entryPoints).toEqual([
      { type: 'route', path: '/checkout' },
      { type: 'url', path: 'https://example.com/checkout' },
      { type: 'mobile', path: 'fixture-shop://checkout' },
      { type: 'cli', path: 'shop checkout' }
    ])
    expect(portable.coverage.sourceAreas).toEqual([])
  })

  it('rejects portable reports that still expose workspace references', () => {
    const base = sdk.projectPortableReport(report)
    const cases: ReportReference[] = [
      { kind: 'code', role: 'intent', target: 'src/routes/storefront.ts' },
      { kind: 'doc', role: 'implementation', target: 'https://example.com/live-doc' },
      { kind: 'visual', role: 'context', target: 'docs/local.png' }
    ]
    for (const reference of cases) {
      const tampered = structuredClone(base)
      tampered.model.actors[0]!.references = [reference]
      expect(sdk.validateProductReport(tampered).join('\n')).toContain(
        `portable report still exposes reference "${reference.target}"`
      )
    }

    const withSourceAreas = structuredClone(base)
    withSourceAreas.coverage.sourceAreas = ['src']
    expect(sdk.validateProductReport(withSourceAreas)).toContain(
      'referenceProfile is portable but coverage.sourceAreas names repository areas'
    )
  })

  it('rejects duplicate targets on one entity', () => {
    const duplicate = structuredClone(report)
    duplicate.model.actors[0]!.references = [
      { kind: 'doc', role: 'context', target: 'https://example.com/same' },
      { kind: 'visual', role: 'intent', target: 'https://example.com/same' }
    ]
    expect(sdk.validateProductReport(duplicate).join('\n')).toContain('duplicate reference target')
  })

  it('uses a strict reference record and rejects removed fields', () => {
    const unknown = structuredClone(report) as Record<string, any>
    unknown.model.actors[0].references = [{
      kind: 'doc', role: 'context', target: 'https://example.com', verified: true
    }]
    expect(sdk.ProductReportSchema.safeParse(unknown).success).toBe(false)

    const legacy = structuredClone(report) as Record<string, any>
    legacy.model.actors[0].codeRefs = []
    expect(sdk.ProductReportSchema.safeParse(legacy).success).toBe(false)
  })

  it('is non-mutating, idempotent, and produces a valid report', () => {
    const before = JSON.stringify(report)
    const once = sdk.projectPortableReport(report)
    expect(JSON.stringify(report)).toBe(before)
    expect(sdk.projectPortableReport(once)).toEqual(once)
    expect(sdk.validateProductReport(once)).toEqual([])
    expect(() => sdk.parseProductReport(JSON.parse(JSON.stringify(once)))).not.toThrow()
  })

  it('keeps Coverage independent from References', () => {
    const withoutReferences = structuredClone(report)
    withoutReferences.references = []
    for (const entry of Object.values(withoutReferences.model)) {
      if (Array.isArray(entry)) {
        for (const item of entry) if ('references' in item) item.references = []
      }
    }
    expect(sdk.validateProductReport(withoutReferences)).toEqual([])
    expect(withoutReferences.coverage).toEqual(report.coverage)
  })

  it('rejects historical Product Reports without normalization', () => {
    for (const schemaVersion of ['4.0.0', '5.0.0']) {
      const legacy = structuredClone(report) as Record<string, any>
      legacy.schemaVersion = schemaVersion
      expect(sdk.ProductReportSchema.safeParse(legacy).success).toBe(false)
      expect(() => sdk.parseProductReport(legacy)).toThrow()
    }
  })
})
