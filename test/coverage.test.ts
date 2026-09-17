import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { ReportCoverageSchema, projectPortableReport, validateProductReport } from '../src/core/portable.js'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const coverage = { status: 'partial', scope: 'Shopping behavior.', exclusions: [], method: [], sourceAreas: [], limitations: [], rationale: '', review: null }
describe('structured Coverage gaps', () => {
  it('accepts located and unlocated gaps with the same shape', () => {
    const unmapped = [{ description: 'Scheduled **refunds** are not modeled.', paths: ['src/refunds.ts', 'jobs/'] }, { description: 'Recurring purchases are not modeled.', paths: [] }]
    expect(ReportCoverageSchema.parse({ ...coverage, unmapped }).unmapped).toEqual(unmapped)
  })

  it('rejects legacy strings, incomplete objects, headings, and duplicate paths', () => {
    for (const entry of ['legacy gap', {}, { description: 'Gap' }, { paths: [] }, { description: '', paths: [] }, { description: '## Gap', paths: [] }, { description: 'Two\nlines', paths: [] }, { description: 'Gap', paths: ['src/', 'src/'] }, { description: 'Gap', paths: [], status: 'mapped' }]) {
      expect(ReportCoverageSchema.safeParse({ ...coverage, unmapped: [entry] }).success).toBe(false)
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
    report.coverage.status = 'partial'
    report.coverage.unmapped = [{ description: 'Back-office refunds are not modeled.', paths: ['src/refunds/'] }]
    const portable = projectPortableReport(report)
    expect(portable.coverage.unmapped).toEqual([{ description: report.coverage.unmapped[0]!.description, paths: [] }])
    expect(portable.coverage.sourceAreas).toEqual([])
    expect(report.coverage.unmapped[0]!.paths).toEqual(['src/refunds/'])
    expect(projectPortableReport(portable)).toEqual(portable)
    portable.coverage.unmapped[0]!.paths = ['src/refunds/']
    expect(validateProductReport(portable)).toContain('referenceProfile is portable but coverage.unmapped paths name repository areas')
  })
})

it('distinguishes approved exclusions from gaps, requires scope and rejects contradictory completeness', () => {
  const excluded = { description: 'Payroll is outside the model.', paths: ['payroll/'] }
  const base = { ...coverage, status: 'complete', exclusions: [excluded], unmapped: [] }
  expect(ReportCoverageSchema.safeParse(base).success).toBe(true)
  expect(ReportCoverageSchema.safeParse({ ...base, scope: '' }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, unmapped: [{ description: 'Missing checkout behavior.', paths: [] }] }).success).toBe(false)
  expect(ReportCoverageSchema.safeParse({ ...base, status: 'partial', unmapped: [excluded] }).success).toBe(false)
  const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-15')
  report.coverage.exclusions = [excluded]
  const portable = projectPortableReport(report)
  expect(portable.coverage.scope).toBe(report.coverage.scope)
  expect(portable.coverage.exclusions).toEqual([{ ...excluded, paths: [] }])
  expect(report.coverage.exclusions[0]!.paths).toEqual(['payroll/'])
  portable.coverage.exclusions[0]!.paths = ['payroll/']
  expect(validateProductReport(portable)).toContain('referenceProfile is portable but coverage.exclusions paths name repository areas')
})
