import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import type { ProductReportV16 } from '../src/core/portable.js'
import { describeValue, diffFields, diffIsEmpty, diffReports } from '../src/core/report-diff.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function report(): ProductReportV16 {
  return compileReport(loadModel(FIXTURE), '2026-08-08')
}

describe('report diff', () => {
  it('finds nothing between a report and itself, whatever the date', () => {
    const before = report()
    const after = { ...report(), generatedAt: '2026-09-15' }
    const diff = diffReports(before, after)
    expect(diffIsEmpty(diff)).toBe(true)
    expect(diff.counts).toEqual({ added: 0, removed: 0, changed: 0 })
  })

  it('names added, removed and changed resources by collection, in a stable order', () => {
    const before = report()
    const after = report()
    // Removed: the first Entity. Added: a Rule under a new id. Changed: a Capability's title.
    const removed = after.model.entities.shift()!
    const rule = { ...after.model.businessRules[0]!, id: 'zz-new-rule', title: 'A new rule' }
    after.model.businessRules.push(rule)
    const capability = after.model.capabilities[0]!
    capability.title = `${capability.title} (renamed)`

    const diff = diffReports(before, after)
    expect(diff.counts).toEqual({ added: 1, removed: 1, changed: 1 })
    expect(diff.resources.map(item => [item.collection, item.id, item.change])).toEqual([
      ['entities', removed.id, 'removed'],
      ['capabilities', capability.id, 'changed'],
      ['businessRules', 'zz-new-rule', 'added']
    ])
    const changed = diff.resources.find(item => item.change === 'changed')!
    expect(changed.title).toBe(capability.title)
    expect(changed.fields).toEqual([
      { field: 'title', change: 'changed', before: before.model.capabilities[0]!.title, after: capability.title }
    ])
    // A removed resource keeps the title it had.
    expect(diff.resources[0]!.title).toBe(removed.title)
    // Whole-resource changes carry no field list.
    expect(diff.resources[0]!.fields).toEqual([])
    expect(diff.resources[2]!.fields).toEqual([])
  })

  it('reads a list by its members and a nested object by its leaves', () => {
    const before = report()
    const after = report()
    const scenario = after.model.capabilityScenarios[0]!
    const step = { ...scenario.steps[0]!, text: 'The customer waves goodbye' }
    scenario.steps = [...scenario.steps, step]
    after.coverage = { ...after.coverage, scope: 'Shopping and subscriptions.' }

    const diff = diffReports(before, after)
    const steps = diff.resources.find(item => item.id === scenario.id)!.fields.find(field => field.field === `steps[${scenario.steps.length}]`)!
    expect(steps.change).toBe('added')
    expect(steps.after).toContain('The customer waves goodbye')
    expect(steps.before).toBeNull()
    expect(diff.product).toEqual([
      { field: 'coverage.scope', change: 'changed', before: before.coverage.scope, after: 'Shopping and subscriptions.' }
    ])
  })

  it('includes taxonomy-only edits in the Product comparison', () => {
    const before = report()
    const after = structuredClone(before)
    after.model.taxonomies.scenarioKinds[0]!.description = 'A different meaning for this kind'

    const diff = diffReports(before, after)
    expect(diffIsEmpty(diff)).toBe(false)
    expect(diff.resources).toEqual([])
    expect(diff.product).toEqual([{
      field: 'taxonomies.scenarioKinds[1].description',
      change: 'changed',
      before: before.model.taxonomies.scenarioKinds[0]!.description,
      after: 'A different meaning for this kind'
    }])
  })

  it('includes taxonomy additions and removals without inventing resource changes', () => {
    const before = report()
    const after = structuredClone(before)
    const added = { id: 'new-kind', name: 'New kind', description: 'A new taxonomy member' }
    after.model.taxonomies.scenarioKinds.push(added)
    const addition = diffReports(before, after)
    expect(addition.resources).toEqual([])
    expect(addition.product).toHaveLength(1)
    expect(addition.product[0]!.change).toBe('added')
    expect(JSON.parse(addition.product[0]!.after!)).toEqual(added)
    const removal = diffReports(after, before)
    expect(removal.product[0]!.change).toBe('removed')
    expect(JSON.parse(removal.product[0]!.before!)).toEqual(added)
  })

  it('shows an Entity effect change even when the Scenario Step text is unchanged', () => {
    const before = report()
    const after = structuredClone(before)
    const scenario = after.model.capabilityScenarios.find(item => item.steps.some(step => step.entities.length))!
    const index = scenario.steps.findIndex(step => step.entities.length)
    const entity = scenario.steps[index]!.entities[0]!
    const original = entity.effect
    entity.effect = original === 'reads' ? 'changes' : 'reads'

    const changed = diffReports(before, after).resources.find(item => item.id === scenario.id)!
    expect(changed.fields).toEqual([{
      field: `steps[${index + 1}].entities[1].effect`, change: 'changed', before: original, after: entity.effect
    }])
  })

  it('shows changed reference targets and preserves differences beyond a short label', () => {
    const before = { references: [{ title: 'Design', target: 'https://example.com/old' }], intent: `${'x'.repeat(500)} before` }
    const after = { references: [{ title: 'Design', target: 'https://example.com/new' }], intent: `${'x'.repeat(500)} after` }
    const diff = diffFields(before, after)
    expect(diff).toEqual([
      { field: 'intent', change: 'changed', before: before.intent, after: after.intent },
      { field: 'references[1].target', change: 'changed', before: 'https://example.com/old', after: 'https://example.com/new' }
    ])
  })

  it('describes complete values without dropping nested fields or text', () => {
    expect(describeValue(null)).toBeNull()
    expect(describeValue([])).toBe('[]')
    expect(describeValue('  two\n words ')).toBe('  two\n words ')
    expect(describeValue(['a', 'b'])).toBe('["a","b"]')
    expect(JSON.parse(describeValue([{ id: 'x', title: 'Titled' }, { name: 'Named' }])!)).toEqual([{ id: 'x', title: 'Titled' }, { name: 'Named' }])
    expect(describeValue('x'.repeat(500))!.length).toBe(500)
  })
})
