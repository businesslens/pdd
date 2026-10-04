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

  it('compares an Experience beside a Variation\'s alternatives for a shared access mode, in a report too', () => {
    const input = JSON.parse(JSON.stringify(report()))
    const preview = input.model.experiences.find((item: any) => item.id === 'customer-mobile::catalog-preview')
    input.model.experiences.push({ ...preview, id: 'customer-mobile::help', title: 'Help', description: 'Where shoppers find answers inside the app.', entryPoints: [] })
    expect(validateProductReport(input).filter(issue => issue.includes('one access mode'))).toEqual([
      'experience "customer-mobile::catalog-preview": shares `public` access and an Actor with "customer-mobile::help"; one access mode is one context',
      'experience "customer-mobile::storefront": shares `public` access and an Actor with "customer-mobile::help"; one access mode is one context',
    ])
    expect(validateProductReport(report()).filter(issue => issue.includes('one access mode'))).toEqual([])
  })

  it('writes set-valued fact lists in one order, whatever order they were authored in', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bl-fact-order-'))
    try {
      cpSync(fixture, cwd, { recursive: true })
      const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
      writeFileSync(scenario, readFileSync(scenario, 'utf8').replaceAll('facts: [Name and description, Price, Stock remaining]', 'facts: [Stock remaining, Price, Name and description]'))
      const reordered = compileReport(loadModel(cwd), '2026-10-01')
      expect(JSON.stringify(reordered)).toBe(JSON.stringify(report()))
    } finally { rmSync(cwd, { recursive: true, force: true }) }
    const { model } = report()
    const steps = [...model.capabilityScenarios, ...model.journeyScenarios].flatMap((scenario: any) => scenario.steps)
    for (const entry of steps.flatMap((step: any) => step.entities)) expect(entry.facts).toEqual([...entry.facts].sort())
    for (const target of model.businessRules.flatMap((rule: any) => rule.appliesTo)) if (target.facts) expect(target.facts).toEqual([...target.facts].sort())
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

  /*
   * The Fixture Shop with each Variation reading the merge review found wrong:
   * Order reaches Cancelled only through the two cancellation alternatives,
   * one of them is placed directly on the storefront while the other stays on
   * its Order status Screen, and the Interface's shared catalog Screens vary.
   */
  const variedShop = () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bl-varied-shop-'))
    cpSync(fixture, cwd, { recursive: true })
    const bl = join(cwd, '.businesslens')
    const edit = (path: string, from: string, to: string) => {
      const file = join(bl, path)
      const text = readFileSync(file, 'utf8')
      expect(text).toContain(from)
      writeFileSync(file, text.replaceAll(from, to))
    }
    edit('capabilities/manage-orders/scenarios/merge-duplicate-orders.md',
      '{ entity: order, as: duplicate, effect: changes, from: Pending, to: Cancelled, facts: [] }',
      '{ entity: order, as: duplicate, effect: changes, facts: [Items ordered] }')
    edit('capabilities/cancel-order/scenarios/cancel-your-own-unpaid-order.md',
      'place: customer-web::storefront::order-status', 'place: customer-web::storefront')
    edit('entities/shopper.md', '- **Checkout assignment**',
      '- **Catalog layout assignment** — whether the catalog layout experiment shows this shopper a grid\n- **Checkout assignment**')
    writeFileSync(join(bl, 'interfaces/customer-web/screens/catalog-grid.md'), `---
entities:
  - { entity: catalog-product, shows: [Name and description, Price] }
---

# Catalog grid

The catalog as a grid of product tiles.
`)
    writeFileSync(join(bl, 'capabilities/browse-catalog/scenarios/browse-the-catalog-grid.md'), `---
kind: primary
routes: { web: Web }
steps:
  - text: The catalog is shown as a grid of product tiles
    kind: product
    entities: [{ entity: catalog-product, effect: reads, facts: [Name and description, Price] }]
    contexts: { web: { place: customer-web::catalog-grid } }
  - text: The shopper opens a product page
    kind: actor
    actor: shopper
    entities: [{ entity: catalog-product, effect: reads, facts: [Name and description, Price] }]
    contexts: { web: { place: customer-web::storefront::product-record } }
---

# Browse the catalog grid

## Trigger

A Shopper in the grid arm opens the storefront.

## Outcome

The shopper opens a product from its tile.
`)
    writeFileSync(join(bl, 'variations/catalog-layout.md'), `---
kind: experiment
of: screen
assignmentUnit: { entity: shopper }
assignmentMethod: Assign each signed-in Shopper randomly once. Store the arm on the Shopper.
assignmentFact: { entity: shopper, fact: Catalog layout assignment }
allocation: Half of eligible Shoppers in each arm.
takesEffect: On the first catalog opening after sign-in.
stability: The stored assignment holds until the experiment ends.
alternatives:
  - id: customer-web::catalog
    selectedWhen: The Shopper's Catalog layout assignment is List, or the Shopper is a guest.
  - id: customer-web::catalog-grid
    selectedWhen: The Shopper's Catalog layout assignment is Grid.
---

# Catalog layout

Signed-in Shoppers see the catalog as a list or as a grid.
`)
    return cwd
  }
  const variedWorkspace = () => {
    const cwd = variedShop()
    try {
      const model = loadModel(cwd)
      expect(lintModel(model, tracked).errors).toEqual([])
      return projectReportWorkspace(compileReport(model, '2026-10-02'))
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  }

  it('reads a State reached under every alternative of a set as unconditional, in a real model', () => {
    const workspace = variedWorkspace()
    const order = workspace.entities.find((entity: any) => entity.id === 'order')!
    const into = order.arcs.filter((arc: any) => arc.to === 'Cancelled' && arc.from !== 'Cancelled')
    expect(into.length).toBeGreaterThan(1)
    expect(into.every((arc: any) => lifecycleArcCondition(workspace, order, arc).conditional)).toBe(true)
    expect(lifecycleStateCondition(workspace, order, 'Cancelled')).toBeNull()
  })

  it('never strikes an alternative delivered on a Screen inside the place, in the tree or the Delivery map', () => {
    const workspace = variedWorkspace()
    const storefront = workspace.byKey.get('experience:customer-web::storefront')!
    const set = (nodes: any[]) => flatten(nodes).find(node => node.resource?.key === 'variation:cancellation-handling' && node.place?.key === storefront.key)
    const inTree = set(structureChildren(workspace, storefront))
    expect(inTree.children.map((child: any) => [child.resource.id, Boolean(child.absentFrom)])).toEqual([['cancel-order', false]])
    // Request cancellation is delivered one level down, on Order status.
    const status = flatten(structureChildren(workspace, storefront)).find(node => node.resource?.key === 'screen:customer-web::storefront::order-status')
    expect(flatten(status.children).some(node => node.resource?.id === 'request-cancellation' && !node.absentFrom)).toBe(true)
    const mapPlace = flatten([deliveryMapProjection(workspace)]).find(node => node.resource?.key === storefront.key)
    const inMap = mapPlace.children.find((node: any) => node.resource?.key === 'variation:cancellation-handling')
    expect(inMap.children.filter((child: any) => child.absentFrom)).toEqual([])
    // A Screen that genuinely lacks an alternative still strikes it.
    const mobileStatus = workspace.byKey.get('screen:customer-mobile::storefront::order-status')!
    const struck = flatten(structureChildren(workspace, mobileStatus)).filter(node => node.absentFrom)
    expect(struck.map(node => node.resource.id)).toContain('request-cancellation')
  })

  it('folds an Experience\'s shared Screen alternatives under their set, as its own Screens fold', () => {
    const workspace = variedWorkspace()
    const storefront = workspace.byKey.get('experience:customer-web::storefront')!
    const shared = structureChildren(workspace, storefront).find((node: any) => node.title === 'Shared Screens')
    expect(shared.children.map((node: any) => node.resource.key)).toEqual(['variation:catalog-layout'])
    const [set] = shared.children
    expect(set.children.map((child: any) => [child.resource.id, child.inSet, child.sharedFrom?.id, Boolean(child.absentFrom)])).toEqual([
      ['customer-web::catalog', true, 'customer-web', false],
      ['customer-web::catalog-grid', true, 'customer-web', false]
    ])
    expect(shared.count).toBe(2)
  })
})
