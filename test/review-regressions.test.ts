import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { expandProductReport } from '../src/commands/open.js'
import { lintModel } from '../src/commands/lint.js'
import { loadModel } from '../src/core/model.js'
import { validateProductReport } from '../src/core/portable.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { placeDelivery } = await utility('placeReadings')
const { treeCards, structureChildren, treeCardExpanded } = await utility('collectionChildren')
const { deliveryMapProjection } = await utility('topologyProjections')
const { lifecycleArcCondition, lifecycleStateCondition, buildEntityLifecycle } = await utility('entityLifecycle')
const fixture = join(__dirname, 'fixtures/fixture-shop')
const tracked = ['README.md', 'src/routes/storefront.ts', 'src/routes/admin.ts', 'src/services/catalog.ts', 'src/services/orders.ts', 'src/services/payments.ts', 'src/models/product.ts', 'src/models/order.ts']
const report = () => compileReport(loadModel(fixture), '2026-10-01')
const flatten = (nodes: any[]): any[] => nodes.flatMap(node => [node, ...flatten(node.children)])

describe('merge review regressions', () => {
  it('rejects a shared Screen whose qualified ID also names an Experience, with both authored locations', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bl-place-collision-'))
    try {
      cpSync(fixture, cwd, { recursive: true })
      const screen = join(cwd, '.businesslens/interfaces/customer-web/screens/storefront.md')
      writeFileSync(screen, readFileSync(join(cwd, '.businesslens/interfaces/customer-web/screens/catalog.md'), 'utf8'))
      const issues = lintModel(loadModel(cwd), tracked).errors.filter(error => error.startsWith('place id'))
      expect(issues).toHaveLength(1)
      expect(issues[0]).toContain('customer-web::storefront')
      expect(issues[0]).toContain(screen)
      expect(issues[0]).toContain('.businesslens/interfaces/customer-web/experiences/storefront/experience.md')
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })

  it.each([false, true])('rejects an ambiguous report before filesystem writes, even with force=%s', force => {
    const input = JSON.parse(JSON.stringify(report()).replaceAll('customer-web::catalog', 'customer-web::storefront'))
    // All derived fields and references still agree; only cross-type identity is invalid.
    expect(validateProductReport(input)).toEqual([
      expect.stringContaining('place id "customer-web::storefront": used by Experience "customer-web::storefront" and Screen "customer-web::storefront"')
    ])
    const parent = mkdtempSync(join(tmpdir(), 'bl-reject-place-'))
    try {
      for (const existing of [false, true]) {
        const target = join(parent, existing ? 'existing' : 'empty')
        mkdirSync(target)
        if (existing) {
          mkdirSync(join(target, '.businesslens'))
          writeFileSync(join(target, '.businesslens/product.md'), '# Preserve this model\n')
        }
        const before = readdirSync(target)
        expect(() => expandProductReport(target, input, force)).toThrow(/place id "customer-web::storefront"/)
        expect(readdirSync(target)).toEqual(before)
        if (existing) expect(readFileSync(join(target, '.businesslens/product.md'), 'utf8')).toBe('# Preserve this model\n')
      }
      expect(readdirSync(parent).sort()).toEqual(['empty', 'existing'])
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })

  it('preserves a valid nested shared Screen’s owner, parent and location across export/import', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bl-shared-owner-'))
    const target = mkdtempSync(join(tmpdir(), 'bl-shared-import-'))
    try {
      cpSync(fixture, cwd, { recursive: true })
      const parent = join(cwd, '.businesslens/interfaces/customer-web/screens/shared-storefront')
      mkdirSync(join(parent, 'screens'), { recursive: true })
      const content = '---\nentities:\n  - { entity: catalog-product, shows: [Name and description, Price, Stock remaining] }\n---\n\n# Shared catalog\n\nThe shared catalog detail.\n'
      writeFileSync(join(parent, 'screen.md'), content.replace('Shared catalog', 'Shared storefront'))
      writeFileSync(join(parent, 'screens/shared-catalog.md'), content)
      const scenarioFile = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
      writeFileSync(scenarioFile, readFileSync(scenarioFile, 'utf8').replaceAll('customer-web::storefront::product-record', 'customer-web::shared-storefront::shared-catalog'))
      writeFileSync(join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/read-shared-catalog.md'), `---
kind: primary
routes: { web: Web }
steps:
  - text: The shopper reads the shared catalog
    kind: actor
    actor: shopper
    entities: [{ entity: catalog-product, effect: reads, facts: [Price] }]
    contexts: { web: { place: customer-web::shared-storefront } }
---

# Read the shared catalog

## Trigger

The catalog is opened.

## Outcome

Prices are shown.
`)
      const model = loadModel(cwd)
      expect(lintModel(model, tracked).errors).toEqual([])
      expandProductReport(target, compileReport(model, '2026-10-01'), false)
      const reopened = loadModel(target)
      expect(lintModel(reopened, tracked).errors).toEqual([])
      for (const id of ['customer-web::shared-storefront', 'customer-web::shared-storefront::shared-catalog', 'customer-web::storefront::product-record']) {
        const original = model.screens.find(screen => screen.id === id)!
        const imported = reopened.screens.find(screen => screen.id === id)!
        expect(imported).toMatchObject({ id, containerId: original.containerId, parentId: original.parentId })
        expect(imported.file.slice(target.length)).toBe(original.file.slice(cwd.length))
        expect(existsSync(imported.file)).toBe(true)
      }
    } finally { rmSync(cwd, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true }) }
  })

  it.each([
    ['experience', 'customer-web::storefront', 'browse-catalog'],
    ['interface', 'admin-web', 'manage-orders']
  ])('keeps directly placed behavior in %s Delivery, Rows and Graph despite Screen exposure', (kind, id, capabilityId) => {
    const model = loadModel(fixture)
    const scenario = model.capabilityScenarios.find(item => item.capability === capabilityId)!
    expect(scenario).toBeDefined()
    for (const step of scenario.steps) for (const context of step.contexts) {
      if (context.place.startsWith(`${id}::`)) context.place = id
    }
    expect(lintModel(model, tracked).errors).toEqual([])
    const workspace = projectReportWorkspace(compileReport(model, '2026-10-01'))
    const place = workspace.byKey.get(`${kind}:${id}`)!
    expect(workspace.screens.some((screen: any) => screen.capabilityIds.includes(capabilityId))).toBe(true)
    const delivery = placeDelivery(workspace, place).find((group: any) => group.capability.id === capabilityId)!
    expect(delivery.note).toBe('direct')
    expect(delivery.scenarios.filter((item: any) => item.id === scenario.id)).toHaveLength(1)
    const projectedScenario = workspace.byKey.get(`capability-scenario:${scenario.id}`)
    const indexes = projectedScenario.steps.flatMap((step: any, index: number) => step.contexts.some((context: any) => context.context.id === id) ? [index] : [])
    expect(delivery.stepsHere[projectedScenario.key]).toEqual(indexes)
    const own = structureChildren(workspace, place).find((node: any) => node.resource?.id === capabilityId)
    expect(flatten(own.children).some((node: any) => node.resource?.id === scenario.id)).toBe(true)
    const graphPlace = flatten([deliveryMapProjection(workspace)]).find(node => node.resource?.key === place.key)
    const graphCapability = graphPlace.children.find((node: any) => node.resource?.id === capabilityId)
    expect(flatten(graphCapability.children).some((node: any) => node.resource?.id === scenario.id)).toBe(true)
  })

  it('keeps a split Scenario’s direct and Screen Step indexes separate', () => {
    const input = report()
    const scenario = input.model.capabilityScenarios.find(item => item.id === 'browse-catalog')!
    scenario.steps[0]!.contexts.find(context => context.routeId === 'web')!.placeId = 'customer-web::storefront'
    const workspace = projectReportWorkspace(input)
    const place = workspace.byKey.get('experience:customer-web::storefront')!
    const screen = workspace.byKey.get('screen:customer-web::storefront::product-record')!
    const atContainer = placeDelivery(workspace, place).find((group: any) => group.capability.id === 'browse-catalog')!
    const atScreen = placeDelivery(workspace, screen).find((group: any) => group.capability.id === 'browse-catalog')!
    expect(atContainer.stepsHere['capability-scenario:browse-catalog']).toEqual([0])
    expect(atScreen.stepsHere['capability-scenario:browse-catalog']).toEqual(scenario.steps.slice(1).map((_, index) => index + 1))
  })

  it('combines complementary incoming State support without removing per-change conditions', () => {
    const workspace = projectReportWorkspace(report())
    const order = workspace.entities.find((entity: any) => entity.id === 'order')!
    const ids = workspace.variations.find((set: any) => set.id === 'checkout-review').alternatives.map((alt: any) => alt.key.split(':')[1])
    const arcs = [
      { ...order.arcs[0], effect: 'creates', key: 'creates-paid', from: '', to: 'Paid', capabilityScenarioIds: [ids[0], ids[0]], journeyScenarioIds: [] },
      { ...order.arcs[0], effect: 'changes', key: 'changes-paid', from: 'Pending', to: 'Paid', capabilityScenarioIds: [ids[1]], journeyScenarioIds: [] }
    ]
    const entity = { ...order, states: [...order.states, { name: 'Paid', content: 'Payment settled.', reached: true }], arcs }
    expect(arcs.every(arc => lifecycleArcCondition(workspace, entity, arc).conditional)).toBe(true)
    expect(lifecycleStateCondition(workspace, entity, 'Paid')).toBeNull()
    const graph = buildEntityLifecycle(workspace, entity)
    expect(graph.nodes.find((node: any) => node.title === 'Paid').conditional).toBeUndefined()
    expect(graph.edges.filter((edge: any) => edge.conditional)).toHaveLength(2)
    expect(lifecycleStateCondition(workspace, { ...entity, arcs: [arcs[0]] }, 'Paid')).toBe('Only under Complete checkout')
    expect(lifecycleStateCondition(workspace, { ...entity, arcs: [] }, 'Paid')).toBeNull()
    expect(lifecycleStateCondition(workspace, { ...entity, arcs: [{ ...arcs[0], from: 'Paid' }] }, 'Paid')).toBeNull()
    const unconditional = { ...arcs[0], capabilityScenarioIds: ['browse-catalog'] }
    expect(lifecycleStateCondition(workspace, { ...entity, arcs: [arcs[0], unconditional] }, 'Paid')).toBeNull()
  })

  it('folds Interface roots, retains concrete delivery children and keeps filtered alternatives under their set', () => {
    const workspace = projectReportWorkspace(report())
    const cards = treeCards(workspace, 'interface', workspace.interfaces, false)
    expect(cards).toHaveLength(workspace.interfaces.length - 1)
    const card = cards.find((card: any) => card.key === 'variation:payment-webhook-contract')!
    expect(card.children.map((child: any) => [child.resource.id, child.title, child.inSet])).toEqual([
      ['payment-webhook', 'Payment webhook', true], ['payment-webhook-v2', 'Payment webhook v2', true]
    ])
    for (const child of card.children) expect(child.children).toEqual(structureChildren(workspace, child.resource))
    expect(cards.find((card: any) => card.key === 'interface:customer-web').children).toEqual(structureChildren(workspace, workspace.byKey.get('interface:customer-web')))
    const lone = treeCards(workspace, 'interface', [workspace.byKey.get('interface:payment-webhook-v2')], true)
    expect(lone.map((card: any) => card.key)).toEqual([card.key])
    expect(lone[0].children.map((child: any) => child.resource.id)).toEqual(['payment-webhook-v2'])
    expect(lone[0].children[0].absentFrom).toBeUndefined()
    const [v1, v2] = card.children
    const descendants = [v1.children[0].id]
    const saved = treeCardExpanded(card, [v2.id], { [v1.id]: descendants, [v2.id]: [] })
    expect(saved).toContain(card.key)
    expect(saved).toContain(v1.id)
    expect(saved).toContain(descendants[0])
    expect(saved).not.toContain(v2.id)
    expect(treeCardExpanded(card, [], { [card.key]: [] })).toEqual([card.key])
    expect(treeCardExpanded(card, [card.key], { [card.key]: [v1.id] })).toEqual([v1.id])
  })
})
