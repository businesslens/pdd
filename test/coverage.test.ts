import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { ReportCoverageSchema, projectPortableReport, validateProductReport } from '../src/core/portable.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { CoverageDocumentSchema } from '../src/core/coverage.js'

const coverage = { scope: 'Shopping behavior.', exclusions: [], method: '', covered: [], limitations: [] }
it('accepts authored Coverage and rejects retired inspection records in models and reports', () => {
  for (const schema of [CoverageDocumentSchema, ReportCoverageSchema]) {
    const document = { ...coverage, unmapped: [] }
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
  it('accepts located and unlocated gaps with the same shape', () => {
    const unmapped = [{ description: 'Scheduled **refunds** are not modeled.', paths: ['src/refunds.ts', 'jobs/'] }, { description: 'Recurring purchases are not modeled.', paths: [] }]
    for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations'] as const) {
      expect(ReportCoverageSchema.parse({ ...coverage, unmapped: [], [kind]: unmapped })[kind]).toEqual(unmapped)
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

  it('preserves gap meaning and strips all repository locations without mutating the workspace report', () => {
    const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-15')
    report.coverage.unmapped = [{ description: 'Back-office refunds are not modeled.', paths: ['src/refunds/'] }]
    report.coverage.limitations = [{ description: 'The retry policy is uncertain.', paths: ['src/refunds/'] }]
    expect(validateProductReport(report)).toEqual([])
    const portable = projectPortableReport(report)
    expect(validateProductReport(portable)).toEqual([])
    expect(portable.coverage).not.toHaveProperty('status')
    expect(portable.coverage.unmapped).toEqual([{ description: report.coverage.unmapped[0]!.description, paths: [] }])
    expect(portable.coverage.covered).toEqual(report.coverage.covered.map(area => ({ ...area, paths: [] })))
    expect(portable.coverage.limitations).toEqual([{ description: 'The retry policy is uncertain.', paths: [] }])
    expect(report.coverage.limitations[0]!.paths).toEqual(['src/refunds/'])
    expect(report.coverage.unmapped[0]!.paths).toEqual(['src/refunds/'])
    expect(projectPortableReport(portable)).toEqual(portable)
    for (const kind of ['covered', 'unmapped', 'limitations'] as const) {
      const invalid = structuredClone(portable)
      invalid.coverage[kind][0]!.paths = ['src/refunds/']
      expect(validateProductReport(invalid)).toContain(`referenceProfile is portable but coverage.${kind} paths name repository areas`)
    }
  })
})

it('distinguishes approved exclusions from gaps, requires scope and allows known missing behavior', () => {
  const excluded = { description: 'Payroll is outside the model.', paths: ['payroll/'] }
  const base = { ...coverage, exclusions: [excluded], unmapped: [] }
  expect(ReportCoverageSchema.safeParse(base).success).toBe(true)
  expect(ReportCoverageSchema.safeParse({ ...base, scope: '' }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, unmapped: [{ description: 'Missing checkout behavior.', paths: [] }] }).success).toBe(true)
  expect(ReportCoverageSchema.safeParse({ ...base, unmapped: [excluded] }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, covered: [excluded] }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, limitations: [excluded] }).success).toBe(false)
  const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-15')
  report.coverage.exclusions = [excluded]
  const portable = projectPortableReport(report)
  expect(portable.coverage.scope).toBe(report.coverage.scope)
  expect(portable.coverage.exclusions).toEqual([{ ...excluded, paths: [] }])
  expect(report.coverage.exclusions[0]!.paths).toEqual(['payroll/'])
  portable.coverage.exclusions[0]!.paths = ['payroll/']
  expect(validateProductReport(portable)).toContain('referenceProfile is portable but coverage.exclusions paths name repository areas')
})
