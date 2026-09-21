import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
const utilPath = '../layers/nuxt/report-viewer/app/utils/resourceComparison.ts'
const workspacePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
const { comparisonRows, comparisonReadings, pairedFields, comparisonFileKey, comparisonResource } = await import(utilPath)
const { projectReportWorkspace } = await import(workspacePath)
const report = compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-08-08')
const side = (model = report, state = 'working') => ({ report: model, workspace: projectReportWorkspace(model), state })
const before = side(report, 'commit:before')

describe('rendered resource comparison', () => {
  it('anchors inserted and deleted steps without shifting every following step', () => {
    const steps = [{ text: 'Choose' }, { text: 'Pay' }, { text: 'Finish' }]
    const after = [steps[0], { text: 'Confirm address' }, steps[1], steps[2]]
    expect(comparisonRows(steps, after, (item: any) => item).map((row: any) => row.change)).toEqual([null, 'added', null, null])
    expect(comparisonRows(after, steps, (item: any) => item).map((row: any) => row.change)).toEqual([null, 'deleted', null, null])
  })
  it('pairs a single step edit and keeps ambiguous rewrites as removals and additions', () => {
    expect(comparisonRows([{ text: 'Pay' }], [{ text: 'Pay securely' }], (item: any) => item)[0].change).toBe('modified')
    expect(comparisonRows(['a', 'b'], ['c', 'd'], (item: any) => item).map((row: any) => row.change)).toEqual(['deleted', 'deleted', 'added', 'added'])
    expect(comparisonRows(['same', 'same'], ['same', 'new', 'same'], (item: any) => item).filter((row: any) => row.change)).toHaveLength(1)
  })
  it('matches named facts without interpreting a new first fact as edits to the others', () => {
    const old = [{ name: 'Total', description: 'Amount' }, { name: 'Date', description: 'Time' }]
    const next = [{ name: 'Status', description: 'State' }, { name: 'Total', description: 'Charged amount' }, old[1]]
    expect(comparisonRows(old, next, (item: any) => item, (item: any) => item.name).map((row: any) => row.change)).toEqual(['added', 'modified', null])
  })
  it('makes reordered named rows visible without inferring a move', () => {
    const rows = [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }]
    const result = comparisonRows(rows, [rows[1], rows[0], rows[2]], (item: any) => item, (item: any) => item.name)
    expect(result.filter((row: any) => row.change).map((row: any) => row.change).sort()).toEqual(['added', 'deleted'])
    expect(result.filter((row: any) => row.change === 'modified')).toHaveLength(0)
  })
  it('retains unchanged paragraphs around a changed paragraph', () => {
    const first = structuredClone(report), second = structuredClone(report)
    first.description = 'An unchanged paragraph.\n\nAn earlier explanation.'
    second.description = 'An unchanged paragraph.\n\nA revised explanation.'
    const paragraphField = (model: typeof report) => comparisonReadings(side(model), 'product')[0]!.fields.find((field: any) => field.id === 'description')!
    expect(comparisonRows(paragraphField(first).items, paragraphField(second).items, (item: any) => item.value).map((row: any) => row.change)).toEqual([null, 'modified'])
  })
  it('gives every resource kind a reading and retains all populated authored fields', () => {
    const kinds = new Set()
    for (const resource of before.workspace.byKey.values()) {
      kinds.add(resource.kind)
      const readings = comparisonReadings(before, resource.key)
      const ids = new Set(readings.flatMap((reading: any) => reading.fields.map((field: any) => field.id)))
      const raw = comparisonResource(before, resource.key)!
      for (const [key, value] of Object.entries(raw)) {
        if (key === 'supportingSections' || Array.isArray(value) && !value.length || value === null || value === undefined || value === '') continue
        expect(ids.has(key), `${resource.key}.${key}`).toBe(true)
      }
    }
    expect(kinds.size).toBe(10)
  })
  it('retains removed references and lifecycle fields from the earlier version', () => {
    const original = structuredClone(report)
    original.model.entities.find(item => item.states.length)!.references = [{ kind: 'doc', role: 'context', target: 'old-guide.md' }]
    const changed = structuredClone(original)
    const entity = changed.model.entities.find(item => item.states.length)!
    entity.states = []
    entity.references = []
    const key = `entity:${entity.id}`
    const old = comparisonReadings(side(original, 'commit:before'), key)
    const next = comparisonReadings(side(changed), key)
    const stateField = old.find((item: any) => item.id === 'lifecycle')!.fields.find((field: any) => field.id === 'states')!
    const newStateField = next.find((item: any) => item.id === 'lifecycle')?.fields.find((field: any) => field.id === 'states')
    expect(pairedFields([stateField], newStateField ? [newStateField] : [])[0].change).not.toBeNull()
    const refs = old.find((item: any) => item.id === 'references')
    expect(refs).toBeDefined()
    expect(next.find((item: any) => item.id === 'references')).toBeUndefined()
  })
  it('distinguishes no authorization claim from forbidding everyone', () => {
    const first = structuredClone(report), second = structuredClone(report)
    first.model.businessRules[0]!.permits = null
    second.model.businessRules[0]!.permits = []
    const key = `rule:${first.model.businessRules[0]!.id}`
    const field = (model: typeof report) => comparisonReadings(side(model), key)[0]!.fields.find((field: any) => field.id === 'permits')!
    expect(pairedFields([field(first)], [field(second)])[0].change).toBe('modified')
    expect(field(first).items[0].text).toBe('No authorization claim.')
    expect(field(second).items[0].text).toContain('Nobody may')
  })
  it('compares Product and Coverage without generated timestamps or repository inventory', () => {
    const readings = comparisonReadings(before, 'product')
    expect(readings.map((reading: any) => reading.id)).toEqual(['overview', 'coverage', 'references'])
    const coverage = comparisonReadings(before, 'coverage')[0]!
    expect(coverage.fields.map((field: any) => field.id)).toEqual(['scope', 'method', 'covered', 'exclusions', 'unmapped', 'limitations'])
    expect(readings.flatMap((reading: any) => reading.fields).map((field: any) => field.id)).not.toContain('generatedAt')
    expect(comparisonFileKey(before, 'apps/shop/.businesslens', 'apps/shop/.businesslens/product/product.md')).toBe('product')
    expect(comparisonFileKey(before, '.businesslens', '.businesslens/coverage.md')).toBe('coverage')
    expect(comparisonFileKey(before, '.businesslens', '.businesslens/config.yaml')).toBeNull()
    expect(comparisonReadings(null, 'entity:order')).toEqual([])
  })
  it('shows the first entry in an empty list as an addition, not an edit to an empty placeholder', () => {
    const next = structuredClone(report)
    next.coverage.unmapped = [{ description: 'Missing behavior', paths: ['src/'] }]
    const field = (model: typeof report) => comparisonReadings(side(model), 'coverage')[0]!.fields.find((field: any) => field.id === 'unmapped')!
    expect(field(report).items).toEqual([])
    expect(comparisonRows(field(report).items, field(next).items, (item: any) => item.value).map((row: any) => row.change)).toEqual(['added'])
  })
  it('identifies derived effects and retains before-version labels and resource keys', () => {
    const next = structuredClone(report)
    const entity = next.model.entities.find(item => item.id === report.model.interfaces[0]!.actorIds[0])!
    entity.title = 'Renamed customer'
    const originalInterface = report.model.interfaces.find(item => item.actorIds.includes(entity.id))!
    const key = `interface:${originalInterface.id}`
    const actors = (readingSide: ReturnType<typeof side>) => comparisonReadings(readingSide, key)[0]!.fields.find((field: any) => field.id === 'actorIds')!.items
    expect(actors(before).find((node: any) => node.resource === `entity:${entity.id}`)?.text).not.toBe('Renamed customer')
    expect(actors(side(next)).find((node: any) => node.resource === `entity:${entity.id}`)?.text).toBe('Renamed customer')
    const effects = comparisonReadings(before, 'capability:place-order')[0]!.fields.find((field: any) => field.id === 'effects')
    expect(effects?.derived).toBe(true)
  })
})

const reviewPath = '../layers/nuxt/report-viewer/app/utils/resourceReview.ts'
const { reviewRows, reviewValueChange, reviewStepValue } = await import(reviewPath)
describe('changes within ordinary resource readings', () => {
  it('restores only current rows when highlighting is switched off', () => {
    const before = [{ name: 'Removed' }, { name: 'Kept' }]
    const after = [{ name: 'Kept' }, { name: 'New' }]
    const annotated = reviewRows(before, after, true, (item: { name: string }) => item, (item: { name: string }) => item.name)
    expect(annotated.map((row: { change: string | null }) => row.change)).toEqual(['deleted', null, 'added'])
    const ordinary = reviewRows(before, after, false)
    expect(ordinary.map((row: { after: unknown }) => row.after)).toEqual(after)
    expect(ordinary.every((row: { change: string | null }) => row.change === null)).toBe(true)
  })
  it('keeps step anchors when a referenced place is renamed', () => {
    const scenario = [...before.workspace.byKey.values()].filter((item: any) => item.kind.endsWith('scenario')).find((item: any) => item.steps.some((step: any) => step.contexts.length))!
    const step = scenario.steps.find((item: any) => item.contexts.length)!
    const renamed = structuredClone(step)
    renamed.contexts[0]!.context.interfaceTitle = 'Renamed interface'
    expect(reviewRows([step], [renamed], true, reviewStepValue)[0].change).toBeNull()
    renamed.contexts[0]!.context.boundary.placeId = 'different-place'
    expect(reviewRows([step], [renamed], true, reviewStepValue)[0].change).toBe('modified')
  })
  it('does not mistake an empty collection for a recorded value or hide false and zero', () => {
    expect(reviewValueChange(undefined, [])).toBeNull()
    expect(reviewValueChange('', null)).toBeNull()
    expect(reviewValueChange(['old'], [])).toBe('deleted')
    expect(reviewValueChange([], ['new'])).toBe('added')
    expect(reviewValueChange(0, 1)).toBe('modified')
    expect(reviewValueChange(false, true)).toBe('modified')
    expect(reviewValueChange({ a: 1, b: 2 }, { b: 2, a: 1 })).toBeNull()
  })
})
