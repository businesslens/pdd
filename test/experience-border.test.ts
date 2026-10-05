import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { lintModel } from '../src/commands/lint.js'
import { expandProductReport } from '../src/commands/open.js'
import { loadModel } from '../src/core/model.js'
import { ProductReportV16Schema, validateProductReport } from '../src/core/portable.js'

const TRACKED = ['README.md', 'src/routes/storefront.ts', 'src/routes/admin.ts',
  'src/services/catalog.ts', 'src/services/orders.ts', 'src/services/payments.ts',
  'src/models/product.ts', 'src/models/order.ts']
const dirs: string[] = []
function temp() { const path = mkdtempSync(join(tmpdir(), 'bl-border-')); dirs.push(path); return path }
function fixture() { const path = temp(); cpSync(join(__dirname, 'fixtures/fixture-shop'), path, { recursive: true }); return path }
function edit(cwd: string, path: string, transform: (text: string) => string) {
  const file = join(cwd, '.businesslens', path)
  writeFileSync(file, transform(readFileSync(file, 'utf8')))
}
function errors(cwd: string) { return lintModel(loadModel(cwd), TRACKED).errors }
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const SCREEN = 'interfaces/customer-web/experiences/storefront/screens/product-record.md'
const CHECKOUT = 'capabilities/place-order/scenarios/complete-checkout.md'

describe('reviewed experience border', () => {
  it('round-trips input-only facts, prefilled fields, creation facts and explicit empty lists', () => {
    const cwd = fixture()
    edit(cwd, SCREEN, text => text.replace('shows: [Delivery address]', 'collects: [Delivery address]'))
    // A read prohibition is meaningful even when this surface only collects the fact.
    writeFileSync(join(cwd, '.businesslens/business-rules/address-input-is-not-disclosure.md'), `---
appliesTo:
  - type: entity
    id: shopper
    effect: reads
    contexts: [{ place: customer-web::storefront::product-record }]
permits: []
---

# Address input is not disclosure

The address may be supplied here but is not disclosed by the Product.
`)
    // The skip-review checkout arm reads the saved address here, which this hypothetical Rule forbids.
    edit(cwd, 'capabilities/place-order/scenarios/complete-checkout-without-review.md', text => text.replace('      - { entity: shopper, effect: reads, facts: [Delivery address] }\n', ''))
    expect(errors(cwd)).toEqual([])
    const report = compileReport(loadModel(cwd), '2026-09-26')
    expect(validateProductReport(report)).toEqual([])
    const target = temp()
    expandProductReport(target, report, false)
    const imported = loadModel(target)
    expect(errors(target)).toEqual([])
    expect(imported.screens.find(s => s.id === 'customer-web::storefront::product-record')!.entities.find(e => e.entity === 'shopper'))
      .toEqual({ entity: 'shopper', shows: [], collects: ['Delivery address'] })
    expect(readFileSync(join(target, '.businesslens', SCREEN), 'utf8')).not.toMatch(/^capabilities:/m)
    expect(imported.capabilityScenarios.find(s => s.id === 'complete-checkout')!.steps.flatMap(s => s.entities).find(e => e.effect === 'creates')!.facts)
      .toContain('Total charged')
    expect(imported.capabilityScenarios.flatMap(s => s.steps).flatMap(s => s.entities).some(e => e.effect !== 'removes' && !e.facts.length)).toBe(true)

    edit(cwd, SCREEN, text => text.replace('collects: [Delivery address]', 'shows: [Delivery address], collects: [Delivery address]'))
    expect(errors(cwd).join('\n')).toContain('which rule "address-input-is-not-disclosure" forbids anyone to read')
  })

  it('requires fact declarations and rejects even an empty authored removal fact list', () => {
    const cwd = fixture()
    edit(cwd, CHECKOUT, text => text.replace(/(entity: order, effect: creates[^\n]*), facts: \[[^\]]*\]/, '$1'))
    expect(errors(cwd).join('\n')).toContain('"facts" is required as a list')
    edit(cwd, CHECKOUT, text => text.replace('entity: cart, effect: removes', 'entity: cart, effect: removes, facts: []'))
    expect(errors(cwd).join('\n')).toContain('a "removes" entry carries no "facts"')
  })

  it('does not allow an Actor read to use a collected fact as a disclosed fact', () => {
    const cwd = fixture()
    edit(cwd, SCREEN, text => text.replace('shows: [Name and description, Price, Stock remaining]', 'collects: [Name and description, Price, Stock remaining]'))
    expect(errors(cwd).join('\n')).toContain('which does not show that fact')
    const model = loadModel(cwd)
    // The same restriction applies when the Entity itself also acts.
    const screen = model.screens.find(s => s.id === 'customer-web::storefront::product-record')!
    screen.entities.find(e => e.entity === 'shopper')!.shows = []
    screen.entities.find(e => e.entity === 'shopper')!.collects = ['Delivery address']
    const step = model.capabilityScenarios.find(s => s.id === 'browse-catalog')!.steps[1]!
    step.entities = [{ entity: 'shopper', effect: 'reads', facts: ['Delivery address'] }]
    expect(lintModel(model, []).errors.join('\n')).toContain('reads "Delivery address" of "shopper"')
  })

  it('validates the exact derived Capability set on the wire', () => {
    const report = compileReport(loadModel(fixture()), '2026-09-26')
    const screen = report.model.screens.find(s => s.id === 'customer-web::storefront::product-record')!
    expect(screen.capabilityIds).toEqual(['browse-catalog', 'place-order'])
    screen.capabilityIds = ['browse-catalog']
    expect(validateProductReport(report).join('\n')).toContain('capabilityIds must equal the Capabilities derived from placed Steps')
  })

  it('keeps Journey Step contributions after the Capability Scenario moves to a container', () => {
    const cwd = fixture()
    edit(cwd, 'capabilities/browse-catalog/scenarios/browse-catalog.md', text => text.replaceAll('customer-web::storefront::product-record', 'customer-web::storefront'))
    const model = loadModel(cwd)
    expect(model.screens.find(s => s.id === 'customer-web::storefront::product-record')!.capabilities).toContain('browse-catalog')
    expect(errors(cwd)).toEqual([])
  })
})
