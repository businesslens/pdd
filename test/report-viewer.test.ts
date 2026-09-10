import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const VIEWER = join(__dirname, '..', 'layers', 'nuxt', 'report-viewer')
const workspaceModulePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
const resourceFactsModulePath = '../layers/nuxt/report-viewer/app/utils/resourceFacts.ts'
const resourceFacetsModulePath = '../layers/nuxt/report-viewer/app/utils/resourceFacets.ts'
const routeWindowModulePath = '../layers/nuxt/report-viewer/app/utils/scenarioRouteWindow.ts'
const pageSectionsModulePath = '../layers/nuxt/report-viewer/app/utils/pageSections.ts'
const { projectReportWorkspace } = await import(workspaceModulePath)
const { resourceFacts } = await import(resourceFactsModulePath)
const { REPORT_ENTITY_KINDS, ENTITY_KIND_META, INTERFACE_TYPE_META } = await import(workspaceModulePath)
const { hasAuthoredBody, tabsFor } = await import(pageSectionsModulePath)
const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function source(path: string): string {
  return readFileSync(join(VIEWER, path), 'utf8')
}

/*
 * Icon names the model chooses at runtime cannot be discovered by the bundler,
 * so `clientBundle.icons` lists them by hand — and a kind whose icon is missing
 * renders a blank square rather than failing. Entity shipped that way, and so
 * did the `agent` Interface type.
 */
describe('bundled icons', () => {
  const bundled = new Set(
    [...source('nuxt.config.ts').matchAll(/'([a-z0-9-]+:[a-z0-9-]+)'/g)].map(match => match[1])
  )
  const asBundleName = (icon: string) => icon.replace(/^i-([a-z0-9-]+?)-/, '$1:')

  it('bundles the icon of every resource kind and every Interface type', () => {
    const icons = (record: unknown) =>
      Object.values(record as Record<string, { icon: string }>).map(meta => meta.icon)
    const required = [...icons(ENTITY_KIND_META), ...icons(INTERFACE_TYPE_META)].map(asBundleName)

    expect(required.length).toBeGreaterThan(0)
    expect(required.filter(icon => !bundled.has(icon))).toEqual([])
  })
})

describe('stable Product Report', () => {
  it('projects every report resource and keeps scenario types distinct', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)

    expect(workspace.identity).toMatchObject({
      id: report.id,
      title: report.title,
      description: report.description,
      schemaVersion: report.schemaVersion
    })
    // An Actor is an Entity that acts: a facet of one collection, not a collection.
    expect(workspace.actingEntities).toHaveLength(report.model.entities.filter(item => item.acts !== null).length)
    expect(workspace.entities).toHaveLength(report.model.entities.length)
    expect(workspace.interfaces).toHaveLength(report.model.interfaces.length)
    expect(workspace.interfaces.find((item: any) => item.id === 'customer-mobile')?.interfaceType)
      .toBe('mobile-app')
    expect(workspace.experiences).toHaveLength(report.model.experiences.length)
    expect(workspace.screens).toHaveLength(report.model.screens.length)
    expect(workspace.domains).toHaveLength(report.model.domains.length)
    expect(workspace.capabilities).toHaveLength(report.model.capabilities.length)
    expect(workspace.journeys).toHaveLength(report.model.journeys.length)
    expect(workspace.rules).toHaveLength(report.model.businessRules.length)
    expect(workspace.capabilityScenarios.every((item: any) => item.scenarioType === 'capability')).toBe(true)
    expect(workspace.journeyScenarios.every((item: any) => item.scenarioType === 'journey')).toBe(true)
    const journeyScenario = workspace.journeyScenarios.find((item: any) => item.id === 'browse-and-complete-checkout')!
    const firstCapabilityStep = journeyScenario.steps.find((step: any) => step.capabilityId)!
    expect(firstCapabilityStep.contexts.map((context: any) => context.routeId)).toEqual(['web', 'mobile'])
    expect([...firstCapabilityStep.contexts.map((context: any) => context.context.boundary.key)].sort()).toEqual([
      'customer-mobile::storefront',
      'customer-web::storefront'
    ])
    // The catalog Step sits on a Screen customer-web shares beside its Experience,
    // so the Scenario also reaches the Interface itself.
    expect(workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!.contexts
      .map((context: any) => context.key).sort()).toEqual([
      'customer-mobile::storefront',
      'customer-web',
      'customer-web::storefront'
    ])
    const journey = workspace.journeys.find((item: any) => item.id === 'browse-and-buy')!
    expect(journey.entryPoints.map((point: any) => [point.path, point.context.id]).sort()).toEqual([
      ['/', 'customer-web::storefront::product-record'],
      ['fixture-shop://storefront', 'customer-mobile::storefront::product-record']
    ])
    const productScreen = workspace.screens.find((item: any) => item.id === 'customer-web::storefront::product-record')!
    expect(productScreen.entryPoints[0].context.id).toBe(productScreen.id)
    expect(workspace.counts.scenarios).toBe(
      report.counts.capabilityScenarios + report.counts.journeyScenarios
    )
  })

  it('gives every resource kind a rail count', () => {
    // A rail row with a blank count is a kind someone forgot in a hand-kept map.
    // The map is keyed by ReportResourceKind so the build catches it now; this
    // pins the behaviour rather than the type.
    const shell = source('app/components/BlrReportShell.vue')
    for (const meta of REPORT_ENTITY_KINDS) {
      const key = meta.kind.includes('-') ? `'${meta.kind}':` : `${meta.kind}:`
      expect(shell).toContain(key)
    }
  })

  /*
   * The inverse of a relation is the *other* end of it. Copying the authored
   * end onto both sides printed "publishes many Source" on the page of a thing
   * that has exactly one, and a symmetric `many-to-many` fixture hid it.
   */
  it('derives the inverse of a relation from its other end, not from the same one', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    report.model.entities.find(entity => entity.id === 'order')!.relations = [
      { entityId: 'catalog-product', verb: 'was placed for', cardinality: 'one-to-many' }
    ]
    const workspace = projectReportWorkspace(report)

    const order = workspace.entities.find((item: any) => item.id === 'order')
    const product = workspace.entities.find((item: any) => item.id === 'catalog-product')
    expect(order.relations[0].cardinality).toBe('many')
    const fromOrder = product.inboundRelations.find((item: any) => item.entityId === 'order')
    expect(fromOrder.cardinality).toBe('one')
  })

  it('renders an Entity as what it keeps, what it can be, and how it moves', () => {
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const order = workspace.entities.find((item: any) => item.id === 'order')
    expect(order.kind).toBe('entity')
    // Facts are named, and a Rule that governs one is marked on it.
    expect(order.informationKept.map((fact: any) => fact.name)).toContain('When placed')
    expect(order.informationKept.find((fact: any) => fact.name === 'Total charged').ruleIds).toEqual(['total-charged'])
    expect(order.states.map((state: any) => state.name)).toEqual(['Pending', 'Confirmed', 'Cancelled', 'Refunded'])
    // A thing that does not act says nothing; one that does says which.
    expect(order.acts).toBeNull()
    expect(workspace.entities.find((item: any) => item.id === 'payment-gateway')).toMatchObject({ entityKind: 'system', acts: 'external' })

    // A relation is declared on one side; the inverse is derived.
    expect(order.relations).toEqual([
      { entityId: 'catalog-product', verb: 'was placed for', cardinality: 'many', ends: 'many-to-many' },
      { entityId: 'refund', verb: 'is repaid by', cardinality: 'many', ends: 'one-to-many' }
    ])
    const product = workspace.entities.find((item: any) => item.id === 'catalog-product')
    expect(product.inboundRelations).toContainEqual({
      entityId: 'order', verb: 'was placed for', cardinality: 'many', ends: 'many-to-many'
    })
    expect(product.relations).toEqual([])

    // A Scenario's Entity set is derived from its Steps, as its Actor set is.
    const complete = workspace.capabilityScenarios.find((s: any) => s.id === 'complete-checkout')
    // One Step, two Entities: the order it stores and the cart it consumes.
    expect(complete.entityIds).toEqual(['shopper', 'order', 'cart'])
    // A Capability declares nothing: what it changes is what its Steps say.
    expect(workspace.capabilities.find((c: any) => c.id === 'place-order').entityIds)
      .toEqual(['cart', 'catalog-product', 'order', 'shopper'])

    // The lifecycle is composed from Steps: every arc names the Capability
    // whose Step draws it, the Rules that constrain it, and its co-effects.
    const arc = (from: string, to: string) => order.arcs.find((item: any) => item.from === from && item.to === to)
    expect(arc('Pending', 'Confirmed').capabilityIds).toEqual(['settle-payment'])
    expect(arc('Confirmed', 'Refunded')).toMatchObject({ capabilityIds: ['manage-orders'], ruleIds: ['refunds-need-an-operator', 'who-may-change-an-order'] })
    expect(arc('Confirmed', 'Refunded').coEffects).toEqual([{ entityId: 'refund', effect: 'creates', to: 'Requested' }])
    expect(order.arcs.find((item: any) => item.effect === 'creates').to).toBe('Pending')
    expect(order.states.every((state: any) => state.reached)).toBe(true)
    // A Rule closing an operation is read on the machine, never drawn as a path.
    expect(order.prohibitions.map((item: any) => item.ruleId).sort()).toEqual(['a-refunded-order-is-never-cancelled', 'orders-are-never-deleted'])
    expect(order.noCreation).toBe(false)

    // Both relations are derived from the Steps and Screens, never authored here.
    expect(order.changedByIds).toEqual(['cancel-order', 'manage-orders', 'place-order', 'settle-payment'])
    expect(order.readByIds).toEqual(['track-order'])
    expect(order.presentedOnIds).toEqual([
      'admin-web::order-detail',
      'customer-mobile::storefront::order-status',
      'customer-web::storefront::order-status'
    ])
    // A thing no Capability creates is a real thing whose instances pre-exist the model.
    expect(product.noCreation).toBe(true)
    expect(product.states.map((state: any) => state.reached)).toEqual([true, true])

    // A thing may be worth naming for what is kept about it alone.
    const cart = workspace.entities.find((item: any) => item.id === 'cart')
    expect(cart.states).toEqual([])
    expect(cart.informationKept.length).toBeGreaterThan(0)
    expect(cart.presentedOnIds.length).toBeGreaterThan(0)

    expect(workspace.byKey.get(order.key)).toBe(order)
    expect(resourceFacts(workspace, order).map((fact: any) => fact.label))
      .toEqual(['Kept', 'States', 'Arcs', 'Changed by'])
    expect(resourceFacts(workspace, workspace.entities.find((item: any) => item.id === 'shopper')).map((fact: any) => fact.label))
      .toEqual(['Kind', 'Acts', 'Journeys', 'Kept'])
    expect(hasAuthoredBody(order)).toBe(true)
    const overview = tabsFor(workspace, order).find((tab: any) => tab.id === 'overview')!
    expect(overview.blocks).toContain('detail')
    // A thing with States reads its machine on a peer tab; one without has only the Overview.
    expect(tabsFor(workspace, order).map((tab: any) => tab.id)).toEqual(['overview', 'lifecycle'])
    expect(tabsFor(workspace, workspace.entities.find((item: any) => item.id === 'cart')).map((tab: any) => tab.id)).toEqual(['overview'])

    // A Screen's own states stay the view's, never the thing's lifecycle.
    const screen = workspace.screens.find((item: any) => item.states.length)
    expect(screen.states.map((state: any) => state.title)).not.toContain('Pending')
  })

  /*
   * The wire contract carries an `entities` list on every Step, and the reading
   * is the sequence, so the list belongs on the Step that causes it. All the
   * Scenario's deduped `entityIds` answers is what it touches, not where.
   */
  it('carries what a Step does into the reading, not only into the Scenario set', async () => {
    const { scenarioStepMatrix } = await import(workspaceModulePath)
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))
    const scenario = workspace.capabilityScenarios.find((item: any) => item.id === 'complete-checkout')!

    // One observable act, two Entities — and only one of them has a lifecycle.
    const persisted = scenario.steps.at(-1)!
    expect(persisted.entities.map((entry: any) => [entry.entityId, entry.effect, entry.from, entry.to]))
      .toEqual([['order', 'creates', '', 'Pending'], ['cart', 'removes', '', '']])

    // A Step that touches nothing reads as an empty list, never as undefined.
    const settle = workspace.capabilityScenarios.find((item: any) => item.id === 'settle-a-refund')!
    expect(settle.steps.at(-1)!.entities).toEqual([])

    // The matrix is what the page renders, so the list has to survive it.
    const row = scenarioStepMatrix(scenario).steps.at(-1)!
    expect(row.mentions[0]).toMatchObject({ entityId: 'order', to: 'Pending' })
  })

  /*
   * Both ends of a move are authored on the Step. Nothing is inferred from a
   * neighbouring Step, and a creation starts nowhere.
   */
  it('reads both ends of a move off the Step, and an alias off an instance', () => {
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const refund = workspace.capabilityScenarios.find((item: any) => item.id === 'refund-order')!
    const refunded = refund.steps.flatMap((step: any) => step.entities).find((entry: any) => entry.to === 'Refunded')!
    expect(refunded).toMatchObject({ entityId: 'order', effect: 'changes', from: 'Confirmed', to: 'Refunded' })

    const sold = workspace.capabilityScenarios.find((item: any) => item.id === 'sell-the-last-available-unit')!
    const created = sold.steps.flatMap((step: any) => step.entities).find((entry: any) => entry.effect === 'creates')!
    expect(created).toMatchObject({ entityId: 'order', from: '', to: 'Pending' })

    // Two instances of one thing in one Step are told apart by alias.
    const merge = workspace.capabilityScenarios.find((item: any) => item.id === 'merge-duplicate-orders')!
    expect(merge.steps.at(-1)!.entities.map((entry: any) => [entry.as, entry.effect, entry.from, entry.to]))
      .toEqual([['duplicate', 'changes', 'Pending', 'Cancelled'], ['original', 'changes', '', '']])
  })

  /*
   * A read is a mention and never a claim about what can alter a thing. It has
   * to reach the reading — otherwise a Step whose text names two Entities says
   * nothing at all — while staying out of every derivation `changes` feeds.
   */
  it('carries a Step read into the reading and out of every change derivation', async () => {
    const { scenarioStepMatrix } = await import(workspaceModulePath)
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))
    const browse = workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!

    expect(browse.readEntityIds).toEqual(['catalog-product'])
    expect(browse.entityIds).toEqual([])

    // The row the page renders carries changes and reads together, told apart.
    const row = scenarioStepMatrix(browse).steps[0]!
    expect(row.mentions).toEqual([
      { entityId: 'catalog-product', as: '', effect: 'reads', from: '', to: '' }
    ])

    // "What can alter this thing" keeps its answer: browsing is not in it.
    const product = workspace.entities.find((item: any) => item.id === 'catalog-product')!
    expect(product.changedByIds).not.toContain('browse-catalog')
  })

  /*
   * The Outcome prose says where things end up in words. The summary says it
   * without the reader parsing the sentence, and is the last change naming each
   * Entity in Step order rather than anything authored a second time.
   */
  it('summarises where the Scenario leaves each Entity it changed', () => {
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const complete = workspace.capabilityScenarios.find((item: any) => item.id === 'complete-checkout')!
    // Everything it changed, whether or not the thing carries a state: the
    // reader arrives here asking what the Scenario produced.
    expect(complete.outcomeStates.map((item: any) => [item.entityId, item.effect, item.to]))
      .toEqual([['shopper', 'changes', ''], ['order', 'creates', 'Pending'], ['cart', 'removes', '']])

    // A Journey states what its achieved paths leave behind, beside its Success criterion.
    const journey = workspace.journeys.find((item: any) => item.id === 'browse-and-buy')!
    expect(journey.leavesBehind.map((item: any) => [item.entityId, item.to]))
      .toEqual([['order', 'Confirmed'], ['cart', '']])

    // A Scenario that changes nothing summarises nothing.
    const browse = workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!
    expect(browse.outcomeStates).toEqual([])
  })

  /*
   * A lifecycle said what a thing can be, and the transitions named only the
   * Capability that moves it. Neither answered what actually puts it in a
   * state, which is the question a reader arrives at one with.
   */
  it('names the Scenarios that leave an Entity in each of its states', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const cancel = report.model.journeyScenarios.find((item: any) => item.id === 'cancel-an-order-before-fulfilment')!
    const cancelStep = cancel.steps.at(-1)!
    cancel.steps[cancel.steps.length - 1] = {
      ...cancelStep,
      entities: [{ entityId: 'order', as: null, effect: 'changes' as const, from: 'Confirmed', to: 'Refunded' }]
    }
    const workspace = projectReportWorkspace(report)

    const order = workspace.entities.find((item: any) => item.id === 'order')!
    const stateOf = (name: string) => order.states.find((state: any) => state.name === name)!

    expect(stateOf('Confirmed').capabilityScenarioIds).toEqual(['confirm-an-order-when-the-gateway-settles'])
    expect(stateOf('Confirmed').journeyScenarioIds).toEqual(['browse-and-complete-checkout', 'cancel-an-order-before-fulfilment'])
    expect(stateOf('Refunded').journeyScenarioIds).toEqual(['cancel-an-order-before-fulfilment'])
    expect(stateOf('Pending').capabilityScenarioIds).toEqual(['complete-checkout', 'sell-the-last-available-unit'])

    // A state nothing lands in says so by holding nothing, not by guessing —
    // and, past the first, is marked unreached.
    expect(stateOf('Cancelled').journeyScenarioIds).toEqual([])
    expect(stateOf('Cancelled').reached).toBe(true)
    order.states.push({ name: 'Archived', content: 'Filed.', capabilityScenarioIds: [], journeyScenarioIds: [], reached: false })

    // Keyed on the pair: a state name is only unique within its own Entity.
    const cart = workspace.entities.find((item: any) => item.id === 'cart')!
    expect(cart.states).toEqual([])
  })

  /*
   * An Entity edge authored on one side was readable from that side only: a
   * Screen declares what it presents and a Capability what it changes, yet only
   * the Entity could be narrowed by either. A facet offered in one direction
   * and missing in the other is a filter the reader cannot find.
   */
  it('reads every Entity relation from both of its ends', async () => {
    const { relatedIds, facetKindsFor, resourcesOfKind } = await import(resourceFacetsModulePath)
    const { resourceCardPresentation } = await import(resourceFacetsModulePath.replace('resourceFacets', 'resourceCards'))
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const screen = workspace.screens.find((item: any) => item.entityIds.length)!
    expect(relatedIds(screen, 'entity')).toEqual(screen.entityIds)
    const presented = workspace.entities.find((item: any) => item.id === screen.entityIds[0])!
    expect(relatedIds(presented, 'screen')).toContain(screen.id)

    // A Domain classifies Entities, though the Entity is the side that says so.
    const ordering = workspace.domains.find((item: any) => item.id === 'ordering')!
    expect(ordering.entityIds).toEqual(['cart', 'order', 'refund'])
    expect(relatedIds(ordering, 'entity')).toEqual(['cart', 'order', 'refund'])

    // An Entity that acts is reachable from where it acts, and the other way.
    const shopper = workspace.entities.find((item: any) => item.id === 'shopper')!
    expect(relatedIds(shopper, 'interface')).toEqual(['customer-mobile', 'customer-web'])
    expect(relatedIds(workspace.interfaces.find((item: any) => item.id === 'customer-web')!, 'entity')).toEqual(['shopper'])

    /* A collection filters by what its rows print, so the offer is derived from
       the card rather than kept by hand beside it — which is why a Domain, whose
       card names its Capabilities and not its Entities, no longer offers an
       Entity facet the reader could not have seen coming. */
    for (const kind of ['interface', 'journey', 'capability']) {
      expect(facetKindsFor(workspace, kind), kind).toContain('entity')
    }
    expect(facetKindsFor(workspace, 'domain')).not.toContain('entity')
    expect(facetKindsFor(workspace, 'capability').length).toBeLessThan(6)
    for (const kind of ['entity', 'capability', 'journey', 'interface', 'domain', 'screen', 'rule']) {
      const printed = new Set(resourcesOfKind(workspace, kind)
        .flatMap((resource: any) => resourceCardPresentation(workspace, resource).metrics)
        .flatMap((metric: any) => metric.kind ? [metric.kind] : []))
      for (const facet of facetKindsFor(workspace, kind)) {
        expect(printed.has(facet) || facet === 'domain', `${kind} offers ${facet}`).toBe(true)
      }
    }
  })

  /*
   * What a Journey moves is what its Scenarios are shown moving. Reading it off
   * its Capabilities' declarations instead would claim every Entity they can
   * touch, including ones no path through this Journey ever reaches.
   */
  it('derives what a Journey changes from its Scenarios, not from its Capabilities', () => {
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const journey = workspace.journeys.find((item: any) => item.id === 'browse-and-buy')!
    // Its paths never touch the Shopper or the Catalog product, which its Capabilities do;
    // the cancellation path does create a Refund.
    expect(journey.entityIds).toEqual(['order', 'cart', 'refund'])
    expect(workspace.capabilities.find((item: any) => item.id === 'place-order')!.entityIds)
      .toEqual(['cart', 'catalog-product', 'order', 'shopper'])

    // A Capability page reads one aggregate line per Entity, never a lifecycle fragment each.
    const settle = workspace.capabilities.find((item: any) => item.id === 'settle-payment')!
    expect(settle.entityEffects.map((line: any) => [line.entityId, line.effects, line.scenarioIds.length])).toEqual([
      ['order', [{ effect: 'changes', from: 'Pending', to: 'Confirmed' }], 3],
      ['refund', [{ effect: 'changes', from: 'Requested', to: 'Settled' }], 1]
    ])
  })

  it('derives backlinks without mutating the canonical report', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const before = structuredClone(report)
    const workspace = projectReportWorkspace(report)

    expect(workspace.capabilities.some((item: any) => item.journeyIds.length || item.ruleIds.length)).toBe(true)
    expect(workspace.domains.some((item: any) => item.screenIds.length)).toBe(true)
    const entityRule = workspace.rules.find((item: any) => item.id === 'a-refund-never-exceeds-the-charge')!
    expect(entityRule.capabilityIds).toEqual([])
    expect(entityRule.entityIds).toEqual(['refund'])
    expect(entityRule.domainIds).toEqual(['ordering'])
    expect(entityRule.permits).toBeNull()
    // A permission Rule reads its grants back as sentences a reader can judge.
    const refunds = workspace.rules.find((item: any) => item.id === 'refunds-need-an-operator')!
    expect(refunds.grants.map((grant: any) => grant.sentence)).toEqual([
      'Store admin when Total charged at most 100',
      'whoever Store settings configures when Total charged over the Store settings threshold'
    ])
    expect(workspace.rules.find((item: any) => item.id === 'orders-are-never-deleted')!.prohibits).toBe(true)
    expect(workspace.rules.find((item: any) => item.id === 'a-refund-is-visible-to-its-shopper')!.grants[0].who)
      .toBe('the Shopper related by is repaid by → owns')
    expect(report).toEqual(before)
  })

  it('keeps same-id resources distinct across collections', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const sharedId = report.model.interfaces[0]!.id
    report.model.entities[0] = { ...report.model.entities[0]!, id: sharedId }

    const workspace = projectReportWorkspace(report)
    expect(workspace.resourcesById.get(sharedId)).toHaveLength(2)
    expect(workspace.byKey.get(`entity:${sharedId}`)?.kind).toBe('entity')
    expect(workspace.byKey.get(`interface:${sharedId}`)?.kind).toBe('interface')
  })

  /* One authored sequence projects directly into the reading-and-routes table. */
  it('reads a Journey Scenario as one steps-by-routes table', async () => {
    const { scenarioStepMatrix } = await import(workspaceModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)
    const scenario = workspace.journeyScenarios.find((item: any) => item.id === 'browse-and-complete-checkout')!

    const matrix = scenarioStepMatrix(scenario)
    expect(matrix.routes.map((route: any) => route.id)).toEqual(['web', 'mobile'])
    expect(matrix.steps.map((step: any) => step.text)).toEqual([
      'The shopper finds and selects an available product',
      'The shopper submits checkout',
      'The Product confirms the paid order'
    ])
    expect(matrix.steps[1].cells.map((cell: any) => cell.context.boundary.key)).toEqual([
      'customer-web::storefront',
      'customer-mobile::storefront'
    ])
    /* Parallel lanes are not transitions; a Step that moves to the webhook is one, on both. */
    expect(matrix.steps[1].cells.map((cell: any) => cell.contextChanged)).toEqual([false, false])
    expect(matrix.steps[2].cells.map((cell: any) => cell.contextChanged)).toEqual([true, true])
    expect(scenarioStepMatrix(workspace.capabilityScenarios[0]).routes).toHaveLength(2)
  })

  it('gives both Scenario types one Steps table while keeping their Context semantics distinct', () => {
    const body = source('app/components/BlrResourceBody.vue')
    const context = source('app/components/BlrStepContext.vue')
    const contextPlace = source('app/components/BlrContextPlace.vue')
    const links = source('app/components/BlrLinks.vue')
    const layer = source('nuxt.config.ts')

    expect(body).toContain('v-if="stepMatrix"')
    expect(body).toContain('scenarioStepMatrix')
    expect(body).toContain('v-for="route in visibleRoutes"')
    expect(body.match(/<BlrStepContext/g)).toHaveLength(2)
    expect(body).toContain('No Context — same Step on every route')
    expect(body).toContain('{{ route.name }}')
    expect(body).not.toContain('{{ route.id }}')
    expect(body).not.toContain('{{ column.id }}')
    expect(context).toContain('<BlrContextPlace')
    for (const kind of ['experience', 'screen']) {
      expect(contextPlace).toContain(`<BlrKind kind="${kind}"`)
    }
    expect(contextPlace).toContain('<BlrInterfaceType')
    expect(source('app/components/BlrInterfaceType.vue')).toContain(":role=\"labelled ? undefined : 'img'\"")
    expect(body).toContain("asScenario.scenarioType === 'journey' && step.capabilityId")
    /* Any Step may name an Actor now: performing on an actor Step, attributed on
       a Product or condition Step, and the chip is the same reference. */
    expect(body).toContain('v-if="stepActor(step.actorId)"')
    expect(body).toContain('<span v-if="step.stepKind !== \'actor\'">for</span>')
    expect(body).toContain('{{ stepActor(step.actorId)!.title }}')
    expect(body).not.toContain('label="Performed by"')
    expect(body).toContain('Product action')
    expect(body).toContain('Condition')
    expect(body).toContain('Moved from')
    expect(context).toContain('ResolvedContextView')
    expect(context).not.toContain('scenarioStepScreens')
    expect(body).not.toContain('<ol class="max-w-3xl list-decimal')
    expect(body).not.toContain('stepMatrix.routes.length * 310')
    expect(body).not.toContain('sticky left-0')
    expect(body).toContain('scenarioRouteColumnCount')
    expect(body).toContain('visibleRouteWindow.start + 1')
    expect(body).toContain('aria-label="Number of route columns"')
    expect(body).toContain("icon: 'i-lucide-route'")
    expect(body.match(/aria-label="Show previous route"/g)).toHaveLength(2)
    expect(body.match(/aria-label="Show next route"/g)).toHaveLength(2)
    expect(body).toContain('compact')
    expect(body).not.toContain('Context ·')
    expect(contextPlace).toContain(':type="productInterface.interfaceType"')
    expect(contextPlace).toContain('whitespace-nowrap')
    expect(contextPlace).toContain("compact ? 'max-w-24'")
    expect(contextPlace).toContain('truncate')
    expect(contextPlace.match(/<UTooltip/g)).toHaveLength(3)
    expect(contextPlace).not.toContain(':title="place.')
    expect(links).toContain('inline-flex min-h-6 items-center')
    for (const icon of ['align-justify', 'circle-dot-dashed', 'user-round']) {
      expect(layer).toContain(`'lucide:${icon}'`)
    }
    /* The rail's ten rows have to separate by shape: Product takes slot 9,
       which wraps onto Entity's slot 0, so Overview and Entities carry the same
       hue and one container glyph drawn twice separated nothing. */
    for (const icon of ['house', 'shapes', 'land-plot', 'network', 'box']) {
      expect(layer, icon).toContain(`'lucide:${icon}'`)
    }
    for (const gone of ['package', 'boxes', 'waypoints']) {
      expect(layer, gone).not.toContain(`'lucide:${gone}'`)
    }
  })

  it('keeps kind icons and submarks concrete Interfaces and Actors with authored classifications', () => {
    const mark = source('app/components/BlrInterfaceType.vue')
    const entityMark = source('app/components/BlrEntityMark.vue')
    const kind = source('app/components/BlrKind.vue')
    const structure = source('app/assets/report-viewer.css')
    const cardPresentation = source('app/utils/resourceCards.ts')
    const card = source('app/components/BlrResourceCard.vue')
    const connections = source('app/components/BlrConnections.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const resourceBody = source('app/components/BlrResourceBody.vue')

    expect(mark).toContain('name="i-lucide-plug"')
    expect(mark).toContain(':name="meta.icon"')
    expect(mark).toContain('blr-interface-mark__type')
    expect(kind).toContain("kind === 'interface' && interfaceType")
    expect(kind).toContain('var(--blr-resource-mark-regular)')
    expect(kind).toContain('var(--blr-resource-mark-dense)')
    expect(mark).toContain('var(--blr-interface-mark-regular)')
    expect(mark).toContain('var(--blr-interface-badge-glyph-dense)')
    expect(mark).toContain(".blr-interface-mark[data-size='xs']")
    /* One glyph, on the shared resource scale. An Actor carries two independent
       authored axes and a mark can only draw one, so the facet is the silhouette
       and `relationship` is written where the surface has room for a word. The
       subset that does not act is a facet value, never a fallthrough to the
       type glyph — the rail already said Entities. */
    expect(entityMark).toContain(':name="facetMeta.icon"')
    expect(entityMark).not.toContain('i-lucide-users')
    expect(entityMark).not.toContain('blr-actor-relationship')
    expect(entityMark).not.toContain('showRelationship')
    expect(entityMark).toContain('var(--blr-resource-mark-regular)')
    expect(entityMark).toContain('var(--blr-resource-mark-dense)')
    expect(kind).toContain("kind === 'entity' && facet")
    expect(kind).not.toContain('show-relationship')
    for (const variable of [
      '--blr-resource-mark-regular',
      '--blr-resource-mark-dense',
      '--blr-interface-mark-regular',
      '--blr-interface-kind-regular',
      '--blr-interface-badge-regular',
      '--blr-interface-badge-glyph-regular',
      '--blr-interface-mark-dense',
      '--blr-interface-kind-dense',
      '--blr-interface-badge-dense',
      '--blr-interface-badge-glyph-dense',
      '--blr-interface-badge-offset-regular',
      '--blr-interface-badge-offset-dense'
    ]) {
      expect(structure, variable).toContain(`${variable}:`)
    }
    /* An Actor no longer needs a scale of its own: nothing sits on top of its
       glyph, so it uses the same box every other kind's mark does. */
    expect(structure).not.toContain('--blr-actor-')
    expect(structure).toContain('--blr-resource-mark-regular: 1.25rem')
    expect(structure).toContain('--blr-resource-mark-dense: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-regular: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-dense: 1rem')
    expect(card).toContain(':interface-type="interfaceType"')
    expect(card).toContain(':facet="facet"')
    expect(card).toContain(':acts="acts"')
    expect(connections).toContain(':interface-type="interfaceType(item.kind, id)"')
    expect(connections).toContain(':facet="entityFacetOf(entityAt(item.kind, id))"')
    expect(reportShell).toContain('entityFacetOf(resolvedGroupEntity(group.kind, group.key))')
    expect(cardPresentation).not.toContain('INTERFACE_TYPE_META')
    expect(cardPresentation).toContain('Repeating it as a title badge adds no second fact')
    expect(cardPresentation).not.toContain('`${entity.entityKind} · ${entity.acts}`')
    expect(cardPresentation).toContain('badge: entity.acts')

    /* A Step names an Actor, so it renders one: the Actor's own mark in a chip
       that opens it, not a dimmed generic glyph beside plain text. */
    expect(resourceBody).toContain('<BlrEntityMark')
    expect(resourceBody).toContain(':facet="stepActor(step.actorId)!.entityKind!"')
    /* The Entity page draws its composed state machine on the shared canvas,
       on its own tab, with every arc routed along the layout's points. */
    const lifecycle = source('app/components/BlrEntityLifecycle.vue')
    expect(lifecycle).toContain('buildEntityLifecycle')
    expect(lifecycle).toContain(':diagram="lifecycle"')
    expect(resourceBody).not.toContain('buildEntityLifecycle')
    expect(source('app/components/BlrResourcePage.vue')).toContain('<BlrEntityLifecycle')

    /* A collection or relation heading means the Interface kind, not one
       concrete Interface, so its generic plug remains deliberately generic. */
    expect(source('app/components/BlrRail.vue')).toContain(':name="meta.icon"')
  })

  it('fits and pages an authored-order route window without empty columns', async () => {
    const {
      scenarioRouteCapacity,
      scenarioRouteColumnCount,
      scenarioRouteWindow
    } = await import(routeWindowModulePath)
    const routes = ['web', 'mobile', 'tablet', 'admin', 'kiosk']
      .map(id => ({ id, name: id }))

    expect(scenarioRouteCapacity(520, routes.length)).toBe(1)
    expect(scenarioRouteCapacity(900, routes.length)).toBe(2)
    expect(scenarioRouteCapacity(1200, routes.length)).toBe(3)
    expect(scenarioRouteColumnCount(1200, routes.length, '2')).toBe(2)
    expect(scenarioRouteColumnCount(900, routes.length, '4')).toBe(2)

    expect(scenarioRouteWindow(routes, 'mobile', 2)).toMatchObject({
      start: 1,
      end: 3,
      routes: [{ id: 'mobile' }, { id: 'tablet' }]
    })
    expect(scenarioRouteWindow(routes, 'kiosk', 2)).toMatchObject({
      start: 3,
      end: 5,
      routes: [{ id: 'admin' }, { id: 'kiosk' }]
    })
  })

  it('projects the authored Screen Context on each Step without inference', async () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)
    const journeyScenario = workspace.journeyScenarios.find(
      (item: any) => item.id === 'browse-and-complete-checkout'
    )!
    const browsingStep = journeyScenario.steps.find((step: any) => step.capabilityId === 'browse-catalog')!
    const checkoutStep = journeyScenario.steps.find((step: any) => step.capabilityId === 'place-order')!

    expect(browsingStep.contexts.map((context: any) => context.context.screenTitle)).toEqual(['Product record', 'Product record'])
    expect(checkoutStep.contexts.map((context: any) => context.context.screenTitle)).toEqual(['Product record', 'Product record'])

    const capabilityScenario = workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!
    expect(capabilityScenario.steps[0].contexts.map((context: any) => context.context.screenTitle))
      .toEqual(['Catalog', 'Product record'])
  })

  it('marks a Context place transition and preserves its previous Context, per route', async () => {
    const { scenarioStepMatrix } = await import(workspaceModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const scenario = report.model.journeyScenarios.find(
      (item: any) => item.id === 'browse-and-complete-checkout'
    )!
    const transitionedPlace = scenario.steps
      .find((step: any) => step.capabilityId === 'place-order')!
      .contexts.find((context: any) => context.routeId === 'web')!
    transitionedPlace.placeId = 'customer-web::storefront'

    const workspace = projectReportWorkspace(report)
    const matrix = scenarioStepMatrix(
      workspace.journeyScenarios.find((item: any) => item.id === 'browse-and-complete-checkout')!
    )

    expect(matrix.steps[0].cells.map((cell: any) => cell.contextChanged)).toEqual([false, false])
    expect(matrix.steps[1].cells.map((cell: any) => cell.contextChanged)).toEqual([true, false])
    expect(matrix.steps[1].cells[0].previousContext.id).toBe('customer-web::storefront::product-record')
  })

  it('derives Journey Contexts only from achieved flows', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const scenario = report.model.journeyScenarios[0]!
    report.model.journeyScenarios[0] = { ...scenario, result: 'not-achieved' }

    const workspace = projectReportWorkspace(report)
    const journey = workspace.journeys.find((item: any) => item.id === scenario.journeyId)!
    expect(journey.contexts).toEqual([])
    expect(journey.entryPoints).toEqual([])
  })

  it('ships Product Report as the only report renderer', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const layer = source('nuxt.config.ts')

    expect(renderer).toContain('ProductReportV13')
    expect(renderer).toContain('projectReportWorkspace')
    expect(renderer).toContain('<BlrReportShell')
    expect(source('app/components/BlrResourceBody.vue')).toContain('scenarioStepMatrix')
    expect(reportShell).toContain('<BlrProductTopology')
    /* The Product's page is a page: same heading, same strip, same width, and
       its readings are peer tabs rather than a column of disclosures. */
    expect(source('app/components/BlrOverview.vue')).not.toContain('<UCollapsible')
    expect(source('app/components/BlrOverview.vue')).not.toContain('blr-disclosure')
    expect(source('app/components/BlrOverview.vue')).not.toContain('mx-auto max-w-3xl')
    expect(source('app/components/BlrOverview.vue')).not.toContain('<BlrResourceCard')
    expect(reportShell).toContain('PRODUCT_TABS')
    /* A rail row and the heading it opens say the same word, and the qualifier
       beside it names the resource type the surface presents. `Product Report`
       named the rendered artifact rather than anything the model authors. */
    expect(reportShell).toContain("title: 'Overview', meta: meta.label")
    expect(reportShell).not.toContain("'Product Report'")
    /* The report's identity and the way home are on every surface. */
    expect(reportShell).not.toContain('atProductRoot')

    /* Grouping is how authored Domains earn their place in navigation, and it
       is a fact about the model rather than a control on it: offering every
       related kind as an axis was a view builder wearing a select menu. */
    expect(reportShell).toContain('collectionGroups(props.workspace, activeKind.value, visibleResources.value)')
    expect(reportShell).not.toContain('groupOptions')
    expect(reportShell).not.toContain('aria-label="Stop grouping"')
    expect(source('app/utils/resourceFacets.ts')).toContain('export const GROUPING_KIND')
    expect(source('app/utils/resourceFacets.ts')).toContain("title: 'Actors'")
    expect(layer).toContain("extends: [join(currentDir, '../theme')]")
  })

  /*
    Site chrome belongs to the host. A footer shipped from the layer reached
    every host at once — the catalog got a report footer where its own belongs,
    and it sat pinned inside a bounded surface no reader could scroll past.
  */
  it('renders the report and no site chrome around it', () => {
    expect(existsSync(join(VIEWER, 'app/components/BlrReportFooter.vue'))).toBe(false)

    for (const path of [
      'app/components/BusinessLensReportViewer.vue',
      'app/components/BlrReportShell.vue'
    ]) {
      expect(source(path), path).not.toMatch(/<footer|<\/footer>/)
      expect(source(path), path).not.toMatch(/\$slots\.footer|name="footer"/)
    }
  })

  it('keeps short viewports inside the Product Report scroll boundary', () => {
    const structure = source('app/assets/report-structure.css')
    const panes = source('app/assets/report-viewer.css')

    expect(structure).toContain('min-height: 0')
    expect(structure).not.toContain('min-height: 42rem')
    expect(panes).toContain('overflow-y: auto')
  })

  it('keeps structured readings beside the shared Vue Flow diagram canvas', () => {
    expect(existsSync(join(VIEWER, 'app/components/BlrFlowCanvas.vue'))).toBe(true)
    const topology = source('app/components/BlrProductTopology.vue')
    for (const family of ['BlrTopologyMatrix', 'BlrTopologyBranch', 'BlrDiagram']) expect(topology).toContain(family)
  })

  it('keeps the question-and-derivation bar exclusive to Topology', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const topology = source('app/components/BlrProductTopology.vue')

    expect(existsSync(join(VIEWER, 'app/utils/browseSurfaces.ts'))).toBe(false)
    expect(reportShell).not.toContain('surface.question')
    expect(reportShell).not.toContain('surface.flow')
    /* The surface heading names the subject and the tab names the reading, so
       the view states only what it answers — once, as the tab's hint. */
    expect(topology).not.toContain('{{ view.name }}')
    expect(topology).not.toContain('blr-topology-title-row')
    expect(topology).toContain('{{ view.diagramType }}')
    expect(reportShell).toContain('{{ surfaceHint }}')
    expect(reportShell).toContain('findProductTopologyView(item.view).question')
  })

  /*
    Coverage is one fact on two surfaces, so it is one component. It is drawn
    in umber at every status: an amber partial and a green complete spent two
    ramps this theme never chose, and told the reader that the honest
    declaration the format asks for was a fault to clear.
  */
  it('reads coverage as one umber mark on both surfaces that carry it', () => {
    const badge = source('app/components/BlrCoverageBadge.vue')
    const shell = source('app/components/BlrReportShell.vue')
    const overview = source('app/components/BlrOverview.vue')

    expect(badge).toContain("color=\"neutral\"")
    expect(badge).toContain('rounded-full')
    expect(shell).toContain('<BlrCoverageBadge :status="workspace.coverage.status" named size="md" />')
    expect(overview).toContain('<BlrCoverageBadge :status="workspace.coverage.status" named size="md" />')
    for (const [label, file] of [['badge', badge], ['shell', shell], ['overview', overview]] as const) {
      expect(file, label).not.toContain('COVERAGE_TONE')
      for (const offPalette of ["'warning'", "'success'", '"warning"', '"success"']) {
        expect(file, `${label} ${offPalette}`).not.toContain(offPalette)
      }
    }
  })

  /*
    Embedded reports without a host-header target keep the bordered controls
    that fit their report row. A host can instead move them into its header.
  */
  it('keeps the bordered Vocabulary control when the host has no tools target', () => {
    const tools = source('app/components/BlrReportTools.vue')
    const shell = tools.slice(tools.indexOf('<template v-else>'))
    const vocabulary = shell.indexOf('label="Vocabulary"')
    const button = shell.lastIndexOf('<UButton', vocabulary)

    expect(vocabulary).toBeGreaterThan(-1)
    expect(shell.slice(button, vocabulary)).toContain('variant="outline"')
    expect(shell.slice(vocabulary, vocabulary + 200)).toContain('rounded-full')
  })

  /*
    A reader who has learned the words puts the tooltips away. The word stays in
    the sentence as plain text, and beside a label that already names it — an
    icon-only mark in a breadcrumb — nothing is left behind at all.
  */
  it('renders a term as plain text when the tooltips are off', () => {
    const term = source('app/components/BlrTerm.vue')
    const plain = term.indexOf('<span')
    const popover = term.indexOf('<UPopover')

    expect(term).toContain('v-if="!shown && !iconOnly"')
    expect(term).toContain('v-else-if="shown"')
    expect(plain).toBeGreaterThan(-1)
    expect(plain).toBeLessThan(popover)
    /*
      A button carries `text-transform: none` from the user agent, so the
      breadcrumb's uppercase eyebrow never reached the term while it was one.
      The span replacing it has to say so, or Entities becomes ENTITIES.
    */
    expect(term).toMatch(/\.blr-term-plain \{[^}]*text-transform: none/)
  })

  /*
    Hiding destroys the button the popover belongs to, so the preference flips on
    the popover's close and focus is placed by hand. Flipping it on the click
    unmounts the trigger mid-close and drops focus on the document body.
  */
  it('closes the tooltip before it hides them, and lands focus on the word', () => {
    const term = source('app/components/BlrTerm.vue')

    expect(term).toContain('function requestHide()')
    expect(term).toMatch(/function onCloseAutoFocus[\s\S]*?hiding = false[\s\S]*?completeHide\(\)/)
    expect(term).toMatch(/completeHide[\s\S]*?hide\(\)[\s\S]*?await nextTick\(\)[\s\S]*?\.focus\(/)
    expect(term).toContain("actions: [{ label: 'Undo'")
    /*
      The sentence that names the way back is the way back: the toast renders
      outside this component, so the word is a rendered node rather than a slot.
    */
    expect(term).toMatch(/description: \(\) => h\('span'/)
    expect(term).toContain("'blr-toast-link'")
    expect(term).toContain('panel.show()')
  })

  /*
    Both ways back are load-bearing: the exit sits where the annoyance is, the
    switch sits in the panel a reader already knows to open, and the header
    control that opens that panel is never behind the preference.
  */
  it('offers the exit in the tooltip and the way back in the panel', () => {
    const definition = source('app/components/BlrTermDefinition.vue')
    const vocabulary = source('app/components/BlrVocabulary.vue')
    const shell = source('app/components/BlrReportShell.vue')

    expect(definition).toContain("emit('hide')")
    expect(definition).toContain('v-if="inPopover"')
    expect(definition).toContain('label="Hide tooltips"')
    /*
      A command, not a link: the exit carries the report's own bordered pill so
      it reads as pressable beside the documentation link it sits with. Flattened
      to a bare label it reads as a caption, which is where this started.
    */
    const hide = definition.indexOf('label="Hide tooltips"')
    expect(definition.slice(hide - 200, hide + 200)).toContain('variant="outline"')
    expect(definition.slice(hide - 200, hide + 200)).toContain('rounded-full')
    expect(vocabulary).toContain('#actions')
    /*
      The panel shows both states rather than naming an act on them: alone in
      that head there is nothing to read the state off, and a lone button naming
      an act cannot say whether the act already happened. One segment is filled,
      and it is the one you are in.
    */
    expect(vocabulary).toContain('<UFieldGroup')
    expect(vocabulary).toContain(":variant=\"tooltipsShown ? 'solid' : 'outline'\"")
    expect(vocabulary).toContain(":variant=\"tooltipsShown ? 'outline' : 'solid'\"")
    /* Selection is the theme's own accent; the report has no black of its own. */
    expect(vocabulary).toContain(":color=\"tooltipsShown ? 'primary' : 'neutral'\"")
    expect(vocabulary).toContain(":color=\"tooltipsShown ? 'neutral' : 'primary'\"")
    expect(vocabulary).toContain(':aria-pressed="tooltipsShown"')
    expect(vocabulary).toContain(':aria-pressed="!tooltipsShown"')
    expect(shell).toContain('<BlrVocabulary :context="vocabularyContext" tooltips />')
    expect(shell).not.toMatch(/<BlrReportTools[^>]*v-if/)
  })

  /*
    The panel's own job is looking a word up, so the switch rides in the head
    beside the close button rather than costing a row of the list or a band under
    the search field, where the Back button already appears.
  */
  it('keeps the tooltip switch in the panel head, not in its list', () => {
    const vocabulary = source('app/components/BlrVocabulary.vue')
    const actions = vocabulary.indexOf('#actions')
    const list = vocabulary.indexOf('data-vocabulary-list')

    expect(actions).toBeGreaterThan(-1)
    expect(actions).toBeGreaterThan(list)
    expect(vocabulary).not.toContain('#footer')
    /* On the description's line, under the close button, not centred on the title. */
    const block = vocabulary.slice(actions, vocabulary.indexOf('</template>', actions))
    expect(block).toContain('self-end')
  })

  /*
    The docs host mounts the same panel and draws no tooltips, so the switch is
    behind a host declaration rather than something the panel assumes.
  */
  it('keeps the tooltip switch behind the host that draws tooltips', () => {
    const vocabulary = source('app/components/BlrVocabulary.vue')
    const actions = vocabulary.indexOf('#actions')

    expect(vocabulary).toContain('tooltips?: boolean')
    expect(vocabulary.slice(actions - 40, actions)).toContain('v-if="tooltips"')
  })

  /*
    A host may render the report on the server, so the preference has to be known
    before the first paint. Local storage would draw the tooltips and take them
    away on every page load for the one reader who asked for them gone.
  */
  it('keeps the tooltip preference in a cookie that outlives a refresh', () => {
    const tooltips = source('app/composables/useTooltips.ts')

    expect(tooltips).toContain("useCookie<'on' | 'off'>('blr-tooltips'")
    expect(tooltips).toContain('maxAge: 60 * 60 * 24 * 365')
    expect(tooltips).not.toContain('localStorage')
    expect(tooltips).not.toContain('useState')
  })

  it('scrolls collection controls with their list instead of pinning them as chrome', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const docs = source('app/utils/resourceDocs.ts')
    const pane = reportShell.indexOf('v-if="!topologyActive" ref="resourcePane" class="blr-pane min-h-0 flex-1"')
    const toolbar = reportShell.indexOf('v-if="showToolbar"', pane)
    const reading = reportShell.indexOf('<div class="p-5">', toolbar)

    expect(pane).toBeGreaterThan(-1)
    expect(toolbar).toBeGreaterThan(pane)
    expect(reading).toBeGreaterThan(toolbar)
    expect(reportShell.slice(toolbar, reading)).not.toContain('border-b border-default')
    /* Narrowing scrolls with the list. Identity and the ways out do not: an
       exit belongs to the subject, so it sits on the heading row above. */
    expect(reportShell.slice(toolbar, reading)).not.toContain('label="Docs"')
    expect(reportShell.indexOf(':to="surfaceDocs.url"')).toBeLessThan(pane)
    expect(reportShell.indexOf('v-for="link in exits"')).toBeLessThan(pane)
    /* One Filter, one slot: the collection and its named views share it. */
    expect(reportShell.slice(toolbar, reading)).toContain('label="Filter"')
    expect(source('app/components/BlrProductTopology.vue')).toContain('label="Filter"')
    expect(source('app/components/BlrProductTopology.vue')).not.toContain("'Filters'")
    expect(docs).toContain("experience: 'interfaces#experiences'")
    expect(docs).toContain("screen: 'interfaces#screens'")
    expect(docs).toContain("domain: 'domains'")
  })

  it('opens resources directly into the one page reading', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrResourcePage.vue')
    const body = source('app/components/BlrResourceBody.vue')

    expect(existsSync(join(VIEWER, 'app/components/BlrInspector.vue'))).toBe(false)
    expect(existsSync(join(VIEWER, 'app/components/BlrResourcePeek.vue'))).toBe(false)
    expect(reportShell).not.toContain('<BlrInspector')
    expect(reportShell).toContain('<BlrResourcePage')
    expect(reportShell).not.toContain('<UTable')
    expect(reportShell).not.toContain('TableColumn')
    expect(reportShell).toContain('@open="openResourcePage"')
    expect(reportShell).toContain('@select="openResourcePage"')
    expect(page).toContain('<BlrPageBlock')
    expect(source('app/components/BlrPageBlock.vue')).toContain('<BlrResourceBody')
    for (const marker of ['stepMatrix.steps', 'asScreen.states', 'asRule.statement']) {
      expect(body, marker).toContain(marker)
    }
  })

  it('keeps Context where it answers an Overview question', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)
    const contexts = source('app/components/BlrContexts.vue')
    const contextPlace = source('app/components/BlrContextPlace.vue')
    const page = source('app/components/BlrResourcePage.vue')
    const block = source('app/components/BlrPageBlock.vue')
    const sections = source('app/utils/pageSections.ts')
    const body = source('app/components/BlrResourceBody.vue')

    for (const resource of [
      workspace.screens[0]!,
      workspace.capabilities[0]!,
      workspace.journeys[0]!,
      workspace.rules[0]!
    ]) {
      expect(resourceFacts(workspace, resource).map((fact: { label: string }) => fact.label)).not.toContain('Context')
      expect(resourceFacts(workspace, resource).map((fact: { label: string }) => fact.label)).not.toContain('Contexts')
    }

    expect(page).toContain('<BlrPageBlock')
    expect(block).toContain('<BlrContexts')
    expect(block).toContain("props.resource.kind === 'capability' ? props.resource.contexts : []")
    expect(sections).toContain("overviewBlocks.push('contexts')")
    expect(contexts).toContain('<BlrContextPlace')
    expect(source('app/components/BlrStepContext.vue')).toContain('<BlrContextPlace')
    expect(contextPlace).toContain('<BlrInterfaceType')
    expect(contextPlace).toContain('<BlrKind kind="experience"')
    expect(contextPlace).toContain('<BlrKind kind="screen"')
    expect(contexts).toContain("props.contexts.length === 1 ? 'Context' : 'Contexts'")
    expect(contexts).not.toContain('CONTEXT_NOTE')
    expect(contexts).not.toContain('Derived from achieved Scenarios')
    expect(contexts).toContain('Starts at')
    expect(contexts).toContain(':context="point.context"')
    expect(contexts).not.toContain('point.path')
    expect(contexts).not.toContain('{{ point.interfaceTitle }}')
    expect(block).toContain("props.resource.kind === 'journey' ? props.resource.entryPoints : []")

    /* Scenario Context belongs to its route cells; a Rule selector belongs to
       the authored applicability binding rather than a generic roll-up. */
    expect(body).toContain('<BlrStepContext')
    expect(body).toContain('Every supported Context')
    expect(body).toContain('<BlrContextPlace')
    expect(body).toContain('Only in')
  })

  it('uses the Product Report trail as the only resource-page identity', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrResourcePage.vue')
    const globalHeader = reportShell.slice(
      reportShell.indexOf('<header'),
      reportShell.indexOf('<div class="flex min-h-0 flex-1">')
    )

    expect(reportShell).toContain('v-for="(step, index) in pageTrail"')
    expect(reportShell).toContain('aria-label="Page breadcrumb"')
    /* One trail at every width, and it is a path rather than a title: it ends
       at the parent, and the surface names itself in its own heading. */
    expect(reportShell).toContain('data-page-trail')
    expect(reportShell).not.toContain('data-mobile-location')
    expect(reportShell).not.toContain('blr-mobile-ancestor')
    expect(reportShell).not.toContain("aria-current=\"page\"")
    expect(reportShell).toContain('...parents.map(parent => ({')
    expect(reportShell).toContain('<h1 v-if="surfaceHeading"')
    // Narrow-screen bounds and help targets are exercised in the browser
    // regression script; clipping the entire trail would cut off focus rings.
    expect(reportShell).not.toContain('class="inline-flex min-w-0 flex-1 items-center gap-1.5 hover:underline hover:underline-offset-4"')
    expect(reportShell).not.toContain(':title="step.title"')
    expect(reportShell).not.toContain('label="Neighbourhood"')
    expect(globalHeader).not.toContain('label="Docs"')
    expect(reportShell).not.toContain('DOCS_SLUG')
    expect(page).not.toContain('<h1')
    expect(page).not.toContain('<BlrKind :kind="resource.kind"')
    expect(page).toContain('parentOf(props.workspace, props.resource)')
  })

  /*
    The rail lists kinds, and kinds do not nest. Scenarios are read from the
    parent resource page without adding a second collection tab to the Capability
    or Journey main screen.
  */
  it('keeps Scenarios off collection navigation and on their parent page', () => {
    const rail = source('app/components/BlrRail.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrResourcePage.vue')
    const sections = source('app/utils/pageSections.ts')
    const scenarios = source('app/components/BlrScenarios.vue')

    expect(rail).not.toContain('blr-navchild')
    /* The rail changes the subject; a named view is a tab of its collection. */
    expect(rail).not.toContain('view: [section: string]')
    expect(reportShell).not.toContain('SCENARIO_OF')
    expect(reportShell).not.toContain('parentTabs')
    expect(reportShell).not.toContain('class="blr-tab"')
    expect(page).toContain('<BlrScenarios')
    expect(sections).toContain('scenariosByCapability')
    expect(sections).toContain('scenariosByJourney')
    expect(scenarios).toContain('selectedKey')
    expect(source('app/utils/reportWorkspace.ts')).toContain('scenariosByCapability')
  })

  it('uses Overview and one peer tab: Scenarios, or a Lifecycle', () => {
    const page = source('app/components/BlrResourcePage.vue')
    const sections = source('app/utils/pageSections.ts')

    expect(sections).toContain("export type PageTabId = 'overview' | 'scenarios' | 'lifecycle'")
    expect(sections).toContain("if (resource.references.length) overviewBlocks.push('references')")
    expect(sections).not.toContain("id: 'diagram'")
    expect(sections).not.toContain("id: 'references'")
    expect(page).toContain('data-sticky-page-tabs')
    /* A strip with one tab switches nothing, so it does not render — and the
       ways out live on the heading row, which the host draws. */
    expect(page).toContain('v-if="tabs.length > 1"')
    expect(page).not.toContain('aria-label="Explore this resource"')
    expect(page).not.toContain("emit('view', link.section, subject)")
    expect(page).not.toContain('label="Docs"')
    /* Both strips are the same control, so the rule is not scoped to one. */
    expect(page).toContain('class="blr-surface-tab"')
    expect(source('app/components/BlrReportShell.vue')).toContain('class="blr-surface-tab"')
    expect(source('app/assets/report-viewer.css')).toContain('.blr-surface-tab')
  })

  /*
    A page a reader can reach but not link to, return to, or refresh is a modal
    with extra steps.
  */
  it('exposes page, tab and Scenario route state for host URL persistence', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrResourcePage.vue')

    expect(renderer).toContain("defineModel<string>('section'")
    expect(renderer).toContain("defineModel<string | null>('resource'")
    expect(renderer).toContain("defineModel<string>('tab'")
    expect(renderer).toContain("defineModel<string | null>('scenarioRoute'")
    expect(renderer).toContain("defineModel<string>('routeColumns'")
    expect(renderer).toContain(':resource="location.resource"')
    expect(renderer).toContain('@update:resource="resource = $event"')
    expect(renderer).toContain(':tab="location.tab"')
    expect(renderer).toContain('@update:tab="tab = $event"')
    expect(renderer).toContain('v-model:scenario-route="scenarioRoute"')
    expect(reportShell).toContain("defineModel<string | null>('resource'")
    /* The open tab is the page's model, not a ref it keeps to itself: a
       Lifecycle a reader cannot link to or refresh into is a modal with extra
       steps. A Scenario key in the address still outranks it. */
    expect(reportShell).toContain("defineModel<string>('tab'")
    expect(reportShell).toContain('v-model:tab="pageTab"')
    expect(page).toContain("defineModel<string>('tab'")
    expect(page).not.toContain("const active = ref<PageTabId>('overview')\n\nwatch")
    expect(page).toContain("if (requestedChild.value && isTab('scenarios'))")
    /* Opening a page opens its Overview; the tab is reset in the same tick as
       the page, so one gesture is one history entry. */
    expect(reportShell).toContain("openResource.value = resource.key\n  pageTab.value = 'overview'")
  })

  /*
    The host maps the tab to `t`, left out for the Overview the way `s` is left
    out for the overview section, so an ordinary page link stays as short as it
    was.
  */
  it('keeps the open tab in the host URL as t', () => {
    const host = readFileSync(join(__dirname, '..', 'viewer', 'app', 'app', 'pages', 'index.vue'), 'utf8')

    expect(host).toContain('useBlrReportNavigation()')
    const navigation = source('app/composables/useBlrReportNavigation.ts')
    expect(navigation).toContain("options.tabKey ?? 't'")
    expect(navigation).toContain('topologyToQuery(next.topology)')
    expect(host).toContain('v-model:topology="topology"')
    expect(host).toContain('v-model:tab="tab"')
  })

  it('moves product identity into a desktop-equivalent mobile rail', () => {
    const reportShell = source('app/components/BlrReportShell.vue')

    /* The way home is one affordance at both widths: the same house, the same
       name, the same target. A mark that changes shape with the model — a logo
       here, a glyph there — is two affordances wearing one slot, so a Product's
       own logo is content and lives on the reading that names it. */
    expect(reportShell.match(/i-lucide-house/g)).toHaveLength(2)
    expect(reportShell.match(/title="Open the Overview"/g)).toHaveLength(2)
    expect(reportShell).not.toContain('v-if="logoSrc"')
    expect(source('app/components/BlrOverview.vue')).toContain('v-if="logoSrc"')
    expect(reportShell).toContain(":ui=\"{ content: 'w-64 max-w-[85vw]', body: 'p-2' }\"")
    expect(reportShell).toContain('class="blr-report-shell flex min-w-0 flex-1 items-center gap-3"')
    expect(reportShell).toContain('class="blr-report-shell min-h-full"')
  })
})

/*
 * The composed lifecycle, on a real report. Every arc is a Step somewhere; what
 * the canvas and the list under it say about an arc is derived here, and a
 * reading that misstates who may move a thing is worse than none.
 */
describe('composed lifecycle', () => {
  const lifecycleModulePath = '../layers/nuxt/report-viewer/app/utils/entityLifecycle.ts'

  const workspaceOf = (report: any) => projectReportWorkspace(report)
  const entityOf = (workspace: any, id: string) => workspace.entities.find((item: any) => item.id === id)
  const arcOf = (entity: any, from: string, to: string, effect = 'changes') =>
    entity.arcs.findIndex((item: any) => item.effect === effect && item.from === from && item.to === to)
  /** A step that does exactly the given things to Entities, appended to the first Scenario of a Capability. */
  const addStep = (report: any, capabilityId: string, entities: Array<Record<string, unknown>>) => {
    const scenario = report.model.capabilityScenarios.find((item: any) => item.capabilityId === capabilityId)!
    const template = scenario.steps[scenario.steps.length - 1]
    scenario.steps.push({ ...structuredClone(template), text: 'The test moves it.', entities })
  }

  it('draws terminals for a thing that is created and removed, and a self-transition as a loop', async () => {
    const { buildEntityLifecycle, LIFECYCLE_START, LIFECYCLE_END } = await import(lifecycleModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    addStep(report, 'settle-payment', [
      { entityId: 'refund', as: null, effect: 'changes', from: 'Settled', to: 'Settled' },
      { entityId: 'refund', as: null, effect: 'removes', from: 'Settled', to: null }
    ])
    const workspace = workspaceOf(report)
    const refund = entityOf(workspace, 'refund')
    const graph = buildEntityLifecycle(workspace, refund)

    const ids = graph.nodes.map((node: any) => node.id)
    expect(ids[0]).toBe(LIFECYCLE_START)
    expect(ids[ids.length - 1]).toBe(LIFECYCLE_END)
    const loop = graph.edges.find((edge: any) => edge.source === edge.target)
    expect(loop).toMatchObject({ source: 'blr-state:refund:Settled', target: 'blr-state:refund:Settled', label: 'Payment settlement' })
    expect(graph.direction).toBe('DOWN')
    expect(graph.edges.some((edge: any) => edge.source === 'blr-state:refund:Settled' && edge.target === LIFECYCLE_END)).toBe(true)
  })

  it('draws an arc a Rule closes to everyone as forbidden', async () => {
    const { buildEntityLifecycle, lifecycleArcLabel, LIFECYCLE_END } = await import(lifecycleModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    addStep(report, 'manage-orders', [{ entityId: 'order', as: null, effect: 'removes', from: 'Cancelled', to: null }])
    const workspace = workspaceOf(report)
    const order = entityOf(workspace, 'order')
    const index = arcOf(order, 'Cancelled', '', 'removes')

    expect(order.arcs[index].forbiddenByRuleIds).toEqual(['orders-are-never-deleted'])
    expect(lifecycleArcLabel(workspace, order, index)).toMatchObject({ forbidden: true, rules: [] })
    const edge = buildEntityLifecycle(workspace, order).edges.find((item: any) => item.target === LIFECYCLE_END)
    expect(edge).toMatchObject({ label: 'forbidden', forbidden: true })
  })

  it('lists a stateless information change without drawing it, and counts what it draws', async () => {
    const { buildEntityLifecycle, lifecycleArcEdgeId } = await import(lifecycleModulePath)
    const workspace = workspaceOf(compileReport(loadModel(FIXTURE), '2026-08-08'))
    const order = entityOf(workspace, 'order')
    const graph = buildEntityLifecycle(workspace, order)
    const drawn = new Set(graph.edges.map((edge: any) => edge.id))

    const stateless = order.arcs.find((arc: any) => arc.effect === 'changes' && !arc.to)
    expect(stateless.capabilityIds).toEqual(['manage-orders'])
    expect(drawn.has(lifecycleArcEdgeId(order.id, stateless))).toBe(false)
    expect(order.arcs).toHaveLength(6)
    expect(order.arcs.filter((arc: any) => drawn.has(lifecycleArcEdgeId(order.id, arc)))).toHaveLength(5)
    /* The heading says both numbers when they differ, so "6 arcs" over five edges never happens. */
    const component = source('app/components/BlrEntityLifecycle.vue')
    expect(component).toContain('drawnEdgeIds.value.has(lifecycleArcEdgeId(props.resource.id, arc))')
    expect(component).toContain('<template v-if="drawnCount !== arcs.length">, {{ drawnCount }} drawn</template>')
    expect(component).toContain('· not drawn')
  })

  /*
   * Grants within a Rule are OR; Rules selecting one operation are AND. The
   * fixture's Confirmed → Cancelled is selected by one Rule whose four grants
   * mostly hold only while Pending, so "Shopper or admin or gateway or
   * schedule" was three grants wider than the truth. Each Rule is read apart,
   * with every grant's conditions, and the canvas carries only the marker.
   */
  it('reads restrictions per Rule with each grant in full, never flattened across Rules', async () => {
    const { buildEntityLifecycle, lifecycleArcLabel, lifecycleRestrictionMarker } = await import(lifecycleModulePath)
    const workspace = workspaceOf(compileReport(loadModel(FIXTURE), '2026-08-08'))
    const order = entityOf(workspace, 'order')

    const cancel = lifecycleArcLabel(workspace, order, arcOf(order, 'Confirmed', 'Cancelled'))
    expect(cancel).not.toHaveProperty('restriction')
    expect(cancel.rules).toEqual([{
      id: 'who-may-change-an-order',
      title: 'Who may change an order',
      grants: [
        'the Shopper related by owns while Pending',
        'Store admin',
        'Payment gateway while Pending',
        "the Product's own schedule while Pending"
      ]
    }])
    expect(cancel.rules[0].grants.filter((grant: string) => grant.includes('Pending'))).toHaveLength(3)
    expect(lifecycleRestrictionMarker(cancel)).toBe('restricted')

    const refund = lifecycleArcLabel(workspace, order, arcOf(order, 'Confirmed', 'Refunded'))
    expect(refund.rules.map((rule: any) => rule.id)).toEqual(['refunds-need-an-operator', 'who-may-change-an-order'])
    expect(refund.rules[0].grants).toEqual([
      'Store admin when Total charged at most 100',
      'whoever Store settings configures when Total charged over the Store settings threshold'
    ])
    expect(refund.rules[1].grants).toHaveLength(4)
    expect(lifecycleRestrictionMarker(refund)).toBe('restricted by 2 Rules')

    const edges = buildEntityLifecycle(workspace, order).edges
    expect(edges.find((edge: any) => edge.target === 'blr-state:order:Refunded'))
      .toMatchObject({ label: 'Order management · restricted by 2 Rules' })
    expect(edges.find((edge: any) => edge.source === 'blr-state:order:Confirmed' && edge.target === 'blr-state:order:Cancelled'))
      .toMatchObject({ label: 'Order cancellation · restricted' })
    expect(edges.find((edge: any) => edge.target === 'blr-state:order:Pending')).toMatchObject({ label: 'Checkout', forbidden: false })

    /* The list under the machine links each Rule and says how the Rules compose. */
    const component = source('app/components/BlrEntityLifecycle.vue')
    expect(component).toContain('v-for="rule in arc.rules"')
    expect(component).toContain("@click=\"open('rule', rule.id)\"")
    expect(component).toContain('<span v-if="index" class="blr-meta"> or </span>')
    expect(component).toContain('Each Rule must permit it; within a Rule, any one grant does.')
    expect(component).not.toContain('arc.restriction')
  })

  it('does not restrict the machine by a Rule scoped to a place', async () => {
    const { lifecycleArcLabel } = await import(lifecycleModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const template = report.model.businessRules.find((rule: any) => rule.id === 'refunds-need-an-operator')!
    report.model.businessRules.push({
      ...structuredClone(template),
      id: 'operators-settle-at-the-console',
      title: 'Operators settle at the console',
      appliesTo: [{
        type: 'entity', entityId: 'order', effect: 'changes', from: 'Pending', to: 'Confirmed', facts: [],
        contexts: [{ placeId: 'admin-web::order-detail' }]
      }],
      permits: [{ actorIds: ['store-admin'], related: [], self: false, when: [], unattended: false, configuredByEntityId: null }]
    })
    const workspace = workspaceOf(report)
    const order = entityOf(workspace, 'order')
    const index = arcOf(order, 'Pending', 'Confirmed')

    expect(order.arcs[index].ruleIds).toEqual(['who-may-change-an-order'])
    expect(lifecycleArcLabel(workspace, order, index).rules.map((rule: any) => rule.id)).toEqual(['who-may-change-an-order'])
    /* It still reaches the Entity page as a Rule relation; only the machine leaves it off. */
    expect(order.ruleIds).toContain('operators-settle-at-the-console')
  })

  it('draws the same machine from the same report every time', async () => {
    const { buildEntityLifecycle, lifecycleArcLabel } = await import(lifecycleModulePath)
    const read = () => {
      const workspace = workspaceOf(compileReport(loadModel(FIXTURE), '2026-08-08'))
      const order = entityOf(workspace, 'order')
      return {
        graph: buildEntityLifecycle(workspace, order),
        labels: order.arcs.map((_: unknown, index: number) => lifecycleArcLabel(workspace, order, index))
      }
    }
    expect(read()).toEqual(read())
  })

  it('keeps one name for what a Step does to an Entity', () => {
    const workspaceSource = source('app/utils/reportWorkspace.ts')
    expect(workspaceSource).not.toContain('ScenarioStepMentionView')
    expect(workspaceSource).toContain('mentions: ScenarioStepEntityView[]')
    expect(source('app/components/BlrStepEntity.vue')).toContain('mention: ScenarioStepEntityView')
  })
})
