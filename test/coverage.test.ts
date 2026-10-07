import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { ReportCoverageSchema, projectPortableReport, validateProductReport } from '../src/core/portable.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { CoverageDocumentSchema } from '../src/core/coverage.js'

const coverage = { scope: 'Shopping behavior.', exclusions: [], method: '', covered: [], limitations: [] }
it('accepts authored Coverage and rejects retired inspection records in models and reports', () => {
  for (const schema of [CoverageDocumentSchema, ReportCoverageSchema]) {
    const document = { ...coverage, unmapped: [{ description: 'Subscription code.', paths: ['src/subscriptions/'] }] }
    expect(schema.safeParse(document).success).toBe(true)
    for (const status of ['draft', 'partial', 'complete']) {
      expect(schema.safeParse({ ...document, status }).success).toBe(false)
    }
    expect(schema.safeParse({ ...document, sourceAreas: [] }).success).toBe(false)
    const { covered, ...withoutCovered } = document
    expect(schema.safeParse({ ...withoutCovered, sourceAreas: covered }).success).toBe(false)
    expect(schema.safeParse({ ...document, rationale: 'Retired summary' }).success).toBe(false)
    expect(schema.safeParse({ ...document, method: ['Inspection log'] }).success).toBe(false)
    expect(schema.safeParse({ ...document, review: null }).success).toBe(false)
    expect(schema.safeParse({ ...document, review: { id: 'old-review' } }).success).toBe(false)
  }
})

describe('described Coverage areas and limitations', () => {
  it('reads brackets and braces as file names but refuses wildcards', () => {
    const at = (path: string) => CoverageDocumentSchema.safeParse({ ...coverage, unmapped: [{ description: 'A gap.', paths: [path] }] }).success
    for (const path of ['pages/products/[id].vue', 'app/[slug]/page.tsx', 'src/{legacy}/']) expect(at(path)).toBe(true)
    for (const path of ['src/*.ts', 'src/file?.ts', '../outside', 'src/a.ts#Symbol', 'src/a.ts:12']) expect(at(path)).toBe(false)
  })

  it('gives empty coverage one spelling: no scope or method without an entry', () => {
    const empty = { scope: '', method: '', covered: [], exclusions: [], unmapped: [], limitations: [] }
    expect(CoverageDocumentSchema.safeParse(empty).success).toBe(true)
    for (const field of ['scope', 'method'] as const) {
      const claimed = CoverageDocumentSchema.safeParse({ ...empty, [field]: 'Origin storefront.' })
      expect(claimed.success).toBe(false)
      expect(claimed.error?.issues.map(issue => issue.path.join('.'))).toEqual([field])
    }
  })

  it('requires every entry to name its code, in every category', () => {
    const located = [{ description: 'Scheduled **refunds** code.', paths: ['src/refunds.ts', 'jobs/'] }]
    for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations'] as const) {
      expect(ReportCoverageSchema.parse({ ...coverage, unmapped: [], [kind]: located })[kind]).toEqual(located)
      const unlocated = ReportCoverageSchema.safeParse({ ...coverage, unmapped: [], [kind]: [{ description: 'Recurring purchases.', paths: [] }] })
      expect(unlocated.success).toBe(false)
      expect(unlocated.error?.issues.map(issue => issue.message)).toContain('A Coverage entry names the code it is about; give it at least one path')
    }
  })

  it('lets a model tied to no code have empty coverage, scope included, but not entries without a scope', () => {
    const empty = { scope: '', method: '', covered: [], exclusions: [], unmapped: [], limitations: [] }
    for (const schema of [CoverageDocumentSchema, ReportCoverageSchema]) {
      expect(schema.safeParse(empty).success).toBe(true)
      const scopeless = schema.safeParse({ ...empty, covered: [{ description: 'Checkout code.', paths: ['src/checkout/'] }] })
      expect(scopeless.success).toBe(false)
      expect(scopeless.error?.issues.map(issue => issue.message)).toContain('Scope is required once Coverage records code; say the breadth of code the model accounts for')
    }
  })

  it('rejects legacy strings, incomplete objects, headings, and duplicate paths', () => {
    for (const entry of ['legacy gap', {}, { description: 'Gap' }, { paths: [] }, { description: '', paths: [] }, { description: '## Gap', paths: [] }, { description: 'Two\nlines', paths: [] }, { description: 'Gap', paths: ['src/', 'src/'] }, { description: 'Gap', paths: [], status: 'mapped' }]) {
      for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations']) {
        expect(ReportCoverageSchema.safeParse({ ...coverage, unmapped: [], [kind]: [entry] }).success).toBe(false)
      }
    }
  })

  it('rejects ambiguous path spellings while allowing intended paths that do not exist yet', () => {
    for (const path of ['/etc/passwd', '../src', './src', 'a/../b', 'src//file', 'src\\file', 'https://example.com/code', 'src/*.ts', 'src/a.ts#symbol', 'src/a.ts:4', ' src/', 'src/\n', '']) {
      const unmapped = [{ description: 'Gap', paths: [path] }]
      expect(ReportCoverageSchema.safeParse({ ...coverage, unmapped }).success, path).toBe(false)
    }
    expect(ReportCoverageSchema.safeParse({ ...coverage, unmapped: [{ description: 'Future behavior', paths: ['future/new-feature/'] }] }).success).toBe(true)
  })

  it('drops coverage whole from a portable report without mutating the workspace report', () => {
    const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-15')
    report.coverage.unmapped = [{ description: 'Back-office refunds are not modeled.', paths: ['src/refunds/'] }]
    report.coverage.limitations = [{ description: 'The retry policy is uncertain.', paths: ['src/refunds/'] }]
    expect(validateProductReport(report)).toEqual([])
    const portable = projectPortableReport(report)
    expect(validateProductReport(portable)).toEqual([])
    expect(portable.coverage).toEqual({ scope: '', method: '', covered: [], exclusions: [], unmapped: [], limitations: [] })
    expect(report.coverage.limitations[0]!.paths).toEqual(['src/refunds/'])
    expect(report.coverage.unmapped[0]!.paths).toEqual(['src/refunds/'])
    expect(projectPortableReport(portable)).toEqual(portable)
    for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations'] as const) {
      const invalid = structuredClone(portable)
      invalid.coverage.scope = 'The storefront.'
      invalid.coverage[kind] = [{ description: 'Refund code.', paths: ['src/refunds/'] }]
      expect(validateProductReport(invalid)).toContain(`referenceProfile is portable but coverage.${kind} describes the origin repository's code`)
    }
    for (const field of ['scope', 'method'] as const) {
      const invalid = structuredClone(portable)
      invalid.coverage[field] = 'The origin storefront.'
      expect(validateProductReport(invalid)).toEqual([`referenceProfile is portable but coverage.${field} describes the origin repository's code`])
    }
  })
})

it('distinguishes code excluded from code not yet modeled, and requires scope once code is recorded', () => {
  const excluded = { description: 'Payroll is outside the model.', paths: ['payroll/'] }
  const base = { ...coverage, exclusions: [excluded], unmapped: [] }
  expect(ReportCoverageSchema.safeParse(base).success).toBe(true)
  expect(ReportCoverageSchema.safeParse({ ...base, scope: '' }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, unmapped: [{ description: 'Checkout jobs.', paths: ['jobs/checkout/'] }] }).success).toBe(true)
  expect(ReportCoverageSchema.safeParse({ ...base, unmapped: [excluded] }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, covered: [excluded] }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, limitations: [excluded] }).success).toBe(false)
  const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-15')
  report.coverage.exclusions = [excluded]
  const portable = projectPortableReport(report)
  expect(portable.coverage.scope).toBe('')
  expect(portable.coverage.exclusions).toEqual([])
  expect(report.coverage.exclusions[0]!.paths).toEqual(['payroll/'])
})
