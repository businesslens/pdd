import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const VIEWER = join(__dirname, '..', 'layers', 'nuxt', 'report-viewer')
const workspaceModulePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
const entityFactsModulePath = '../layers/nuxt/report-viewer/app/utils/entityFacts.ts'
const routeWindowModulePath = '../layers/nuxt/report-viewer/app/utils/scenarioRouteWindow.ts'
const pageSectionsModulePath = '../layers/nuxt/report-viewer/app/utils/pageSections.ts'
const { projectReportWorkspace } = await import(workspaceModulePath)
const { entityFacts } = await import(entityFactsModulePath)
const { REPORT_ENTITY_KINDS } = await import(workspaceModulePath)
const { hasAuthoredBody, tabsFor } = await import(pageSectionsModulePath)
const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function source(path: string): string {
  return readFileSync(join(VIEWER, path), 'utf8')
}

describe('stable Product Report', () => {
  it('projects every report entity and keeps scenario types distinct', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)

    expect(workspace.identity).toMatchObject({
      id: report.id,
      title: report.title,
      description: report.description,
      schemaVersion: report.schemaVersion
    })
    expect(workspace.actors).toHaveLength(report.model.actors.length)
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
    expect(workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!.contexts
      .map((context: any) => context.key).sort()).toEqual([
      'customer-mobile::storefront',
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

  it('gives every entity kind a rail count', () => {
    // A rail row with a blank count is a kind someone forgot in a hand-kept map.
    // The map is keyed by ReportEntityKind so the build catches it now; this
    // pins the behaviour rather than the type.
    const shell = source('app/components/BlrReportShell.vue')
    for (const meta of REPORT_ENTITY_KINDS) {
      const key = meta.kind.includes('-') ? `'${meta.kind}':` : `${meta.kind}:`
      expect(shell).toContain(key)
    }
  })

  it('renders an Object as its lifecycle, distinct from a Screen\'s own states', () => {
    const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

    const order = workspace.objects.find((item: any) => item.id === 'order')
    expect(order.kind).toBe('object')
    expect(order.states.map((state: any) => state.name)).toEqual(['Pending', 'Confirmed', 'Refunded'])
    expect(order.transitions).toEqual([
      { from: 'Pending', to: 'Confirmed' },
      { from: 'Confirmed', to: 'Refunded' }
    ])
    expect(order.domainId).toBe('ordering')
    expect(workspace.counts.objects).toBe(1)

    // Reachable everywhere a kind is: rail, search, collection, and page.
    expect(workspace.byKey.get(order.key)).toBe(order)
    expect(entityFacts(workspace, order).map((fact: any) => fact.label))
      .toEqual(['States', 'Transitions'])

    // No Capability relation: an Object declares none and the format has no
    // structured edge for one, so the viewer invents nothing.
    expect('capabilityIds' in order).toBe(false)

    // The body block must actually be composed onto the page. An Object has no
    // `## Intent`, and two separate predicates each decided "does this kind have
    // a body" — one was updated and the other was not, so the lifecycle rendered
    // nowhere while the counts still showed.
    expect(hasAuthoredBody(order)).toBe(true)
    const overview = tabsFor(workspace, order).find((tab: any) => tab.id === 'overview')!
    expect(overview.blocks).toContain('detail')

    // A Screen's own states stay the view's, never the Object's lifecycle.
    const screen = workspace.screens.find((item: any) => item.states.length)
    expect(screen.states.map((state: any) => state.title)).not.toContain('Pending')
  })

  it('derives backlinks without mutating the canonical report', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const before = structuredClone(report)
    const workspace = projectReportWorkspace(report)

    expect(workspace.capabilities.some((item: any) => item.journeyIds.length || item.ruleIds.length)).toBe(true)
    expect(workspace.domains.some((item: any) => item.screenIds.length)).toBe(true)
    const scenarioRule = workspace.rules.find((item: any) => item.id === 'refunds-apply-only-to-existing-orders')!
    expect(scenarioRule.capabilityIds).toEqual([])
    expect(scenarioRule.derivedCapabilityIds).toEqual(['manage-orders'])
    expect(scenarioRule.domainIds).toEqual(['ordering'])
    expect(report).toEqual(before)
  })

  it('keeps same-id entities distinct across collections', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const sharedId = report.model.interfaces[0]!.id
    report.model.actors[0] = { ...report.model.actors[0]!, id: sharedId }

    const workspace = projectReportWorkspace(report)
    expect(workspace.entitiesById.get(sharedId)).toHaveLength(2)
    expect(workspace.byKey.get(`actor:${sharedId}`)?.kind).toBe('actor')
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
    /* Parallel lanes are not transitions — neither route changes Context place. */
    expect(matrix.steps.every((step: any) => step.cells.every((cell: any) => !cell.contextChanged))).toBe(true)
    expect(scenarioStepMatrix(workspace.capabilityScenarios[0]).routes).toHaveLength(2)
  })

  it('gives both Scenario types one Steps table while keeping their Context semantics distinct', () => {
    const body = source('app/components/BlrEntityBody.vue')
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
    expect(body).toContain("step.stepKind === 'actor' && stepActor(step.actorId)")
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
  })

  it('keeps kind icons and submarks concrete Interfaces and Actors with authored classifications', () => {
    const mark = source('app/components/BlrInterfaceType.vue')
    const actorMark = source('app/components/BlrActorType.vue')
    const kind = source('app/components/BlrKind.vue')
    const structure = source('app/assets/report-viewer.css')
    const cardPresentation = source('app/utils/entityCards.ts')
    const card = source('app/components/BlrEntityCard.vue')
    const connections = source('app/components/BlrConnections.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const flow = source('app/utils/flowGraph.ts')
    const flowNode = source('app/components/BlrFlowNode.vue')
    const flowGroup = source('app/components/BlrFlowGroup.vue')
    const entityBody = source('app/components/BlrEntityBody.vue')

    expect(mark).toContain('name="i-lucide-plug"')
    expect(mark).toContain(':name="meta.icon"')
    expect(mark).toContain('blr-interface-mark__type')
    expect(kind).toContain("kind === 'interface' && interfaceType")
    expect(kind).toContain('var(--blr-entity-mark-regular)')
    expect(kind).toContain('var(--blr-entity-mark-dense)')
    expect(mark).toContain('var(--blr-interface-mark-regular)')
    expect(mark).toContain('var(--blr-interface-badge-glyph-dense)')
    expect(mark).toContain(".blr-interface-mark[data-size='xs']")
    /* One glyph, on the shared entity scale. Actor carries two independent
       authored axes and a mark can only draw one, so `kind` is the silhouette
       and `relationship` is written where the surface has room for a word. */
    expect(actorMark).toContain(':name="kindMeta.icon"')
    expect(actorMark).not.toContain('i-lucide-users')
    expect(actorMark).not.toContain('blr-actor-relationship')
    expect(actorMark).not.toContain('showRelationship')
    expect(actorMark).toContain('var(--blr-entity-mark-regular)')
    expect(actorMark).toContain('var(--blr-entity-mark-dense)')
    expect(kind).toContain("kind === 'actor' && actorKind && actorRelationship")
    expect(kind).not.toContain('show-relationship')
    for (const variable of [
      '--blr-entity-mark-regular',
      '--blr-entity-mark-dense',
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
    expect(structure).toContain('--blr-entity-mark-regular: 1.25rem')
    expect(structure).toContain('--blr-entity-mark-dense: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-regular: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-dense: 1rem')
    expect(card).toContain(':interface-type="interfaceType"')
    expect(card).toContain(':actor-kind="actorKind"')
    expect(card).toContain(':actor-relationship="actorRelationship"')
    expect(connections).toContain(':interface-type="interfaceType(item.kind, id)"')
    expect(connections).toContain(':actor-kind="actorClassification(item.kind, id)?.actorKind"')
    expect(reportShell).toContain('resolvedInterfaceType(group.kind, group.key)')
    expect(reportShell).toContain('resolvedActor(group.kind, group.key)?.actorKind')
    expect(reportShell).toContain('BlrInterfaceTypeComponent')
    expect(reportShell).toContain('BlrActorTypeComponent')
    expect(flow).toContain("interfaceType: entity.kind === 'interface' ? entity.interfaceType : null")
    expect(flow).toContain("actorKind: entity.kind === 'actor' ? entity.actorKind : null")
    expect(flowNode).toContain("data.kind === 'interface' && data.interfaceType")
    expect(flowNode).toContain("data.kind === 'actor' && data.actorKind && data.actorRelationship")
    expect(flowNode).not.toContain('show-relationship')
    /* Topology is read for the Product boundary, so the node's sublabel writes
       it — the slot and the spelling an Experience gives its access mode. */
    expect(flow).toContain("`${ENTITY_KIND_META.actor.label} · ${entity.relationship}`")
    expect(flowGroup).toContain("data.kind === 'interface' && data.interfaceType")
    expect(flowNode).toContain('class="blr-flow-node__kind"')
    expect(flowNode).toContain('var(--blr-entity-mark-regular)')
    expect(flowGroup).toContain('class="blr-flow-group__kind"')
    expect(flowGroup).toContain('var(--blr-entity-mark-regular)')
    expect(source('app/components/BlrFlowLabel.vue')).toContain('var(--blr-entity-mark-dense)')
    expect(cardPresentation).not.toContain('INTERFACE_TYPE_META')
    expect(cardPresentation).toContain('Repeating it as a title badge adds no second fact')
    expect(cardPresentation).not.toContain('`${actor.actorKind} · ${actor.relationship}`')
    expect(cardPresentation).toContain('badge: actor.relationship')

    /* A Step names an Actor, so it renders one: the Actor's own mark in a chip
       that opens it, not a dimmed generic glyph beside plain text. */
    expect(entityBody).toContain('<BlrActorType')
    expect(entityBody).toContain(':actor-kind="stepActor(step.actorId)!.actorKind"')

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
      .toEqual(['Product record', 'Product record'])
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

    expect(renderer).toContain('ProductReportV11')
    expect(renderer).toContain('projectReportWorkspace')
    expect(renderer).toContain('<BlrReportShell')
    expect(source('app/components/BlrEntityBody.vue')).toContain('scenarioStepMatrix')
    expect(reportShell).toContain('<BlrProductTopology')
    /* Grouping is how authored Domains earn their place in navigation. */
    expect(reportShell).toContain('groupKind')
    expect(reportShell).toContain('groupOptions')
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

  it('uses the shared flow canvas for Product topology', () => {
    const flow = source('app/utils/flowGraph.ts')
    const canvas = source('app/components/BlrFlowCanvas.vue')
    const topology = source('app/components/BlrProductTopology.vue')

    expect(flow).toContain('export function directRelations')
    expect(flow).toContain('export function buildScreenMap')
    expect(existsSync(join(VIEWER, 'app/components/BlrTopology.vue'))).toBe(false)
    expect(topology).toContain('buildProductTopologyGraph')
    expect(canvas).toContain('@vue-flow/core')
    expect(canvas).toContain('#node-blr')
  })

  it('keeps the question-and-derivation bar exclusive to Topology', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const topology = source('app/components/BlrProductTopology.vue')

    expect(existsSync(join(VIEWER, 'app/utils/browseSurfaces.ts'))).toBe(false)
    expect(reportShell).not.toContain('surface.question')
    expect(reportShell).not.toContain('surface.flow')
    expect(topology).toContain('{{ view.question }}')
    expect(topology).toContain('v-for="(step, index) in kindSteps"')
  })

  it('scrolls collection controls with their list instead of pinning them as chrome', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const docs = source('app/utils/entityDocs.ts')
    const pane = reportShell.indexOf('v-if="!topologyActive" class="blr-pane min-h-0 flex-1"')
    const toolbar = reportShell.indexOf('v-if="showToolbar"', pane)
    const reading = reportShell.indexOf('<div class="p-5">', toolbar)

    expect(pane).toBeGreaterThan(-1)
    expect(toolbar).toBeGreaterThan(pane)
    expect(reading).toBeGreaterThan(toolbar)
    expect(reportShell.slice(toolbar, reading)).not.toContain('border-b border-default')
    expect(reportShell.slice(toolbar, reading)).toContain(':to="collectionDocs.url"')
    expect(reportShell.slice(toolbar, reading)).toContain('label="Docs"')
    expect(docs).toContain("screen: 'screens'")
    expect(docs).toContain("domain: 'domains'")
  })

  it('opens entities directly into the one page reading', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const body = source('app/components/BlrEntityBody.vue')

    expect(existsSync(join(VIEWER, 'app/components/BlrInspector.vue'))).toBe(false)
    expect(existsSync(join(VIEWER, 'app/components/BlrEntityPeek.vue'))).toBe(false)
    expect(reportShell).not.toContain('<BlrInspector')
    expect(reportShell).toContain('<BlrEntityPage')
    expect(reportShell).toContain(':on-select="(_event: Event, row: any) => openEntityPage(row.original)"')
    expect(reportShell).toContain('@open="openEntityPage"')
    expect(reportShell).toContain('@select="openEntityPage"')
    expect(page).toContain('<BlrPageBlock')
    expect(source('app/components/BlrPageBlock.vue')).toContain('<BlrEntityBody')
    for (const marker of ['stepMatrix.steps', 'asScreen.states', 'asRule.statement']) {
      expect(body, marker).toContain(marker)
    }
  })

  it('keeps Context where it answers an Overview question', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)
    const contexts = source('app/components/BlrContexts.vue')
    const contextPlace = source('app/components/BlrContextPlace.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const block = source('app/components/BlrPageBlock.vue')
    const sections = source('app/utils/pageSections.ts')
    const body = source('app/components/BlrEntityBody.vue')

    for (const entity of [
      workspace.screens[0]!,
      workspace.capabilities[0]!,
      workspace.journeys[0]!,
      workspace.rules[0]!
    ]) {
      expect(entityFacts(workspace, entity).map((fact: { label: string }) => fact.label)).not.toContain('Context')
      expect(entityFacts(workspace, entity).map((fact: { label: string }) => fact.label)).not.toContain('Contexts')
    }

    expect(page).toContain('<BlrPageBlock')
    expect(block).toContain('<BlrContexts')
    expect(block).toContain("props.entity.kind === 'capability' ? props.entity.contexts : []")
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
    expect(block).toContain("props.entity.kind === 'journey' ? props.entity.entryPoints : []")

    /* Scenario Context belongs to its route cells; a Rule selector belongs to
       the authored applicability binding rather than a generic roll-up. */
    expect(body).toContain('<BlrStepContext')
    expect(body).toContain('Every supported Context')
    expect(body).toContain('<BlrContextPlace')
    expect(body).toContain('Only in')
  })

  it('uses the Product Report trail as the only entity-page identity', () => {
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const globalHeader = reportShell.slice(
      reportShell.indexOf('<header'),
      reportShell.indexOf('<div class="flex min-h-0 flex-1">')
    )

    expect(reportShell).toContain('v-for="(step, index) in pageTrail"')
    expect(reportShell).toContain('aria-label="Page breadcrumb"')
    expect(reportShell).toContain('data-mobile-location')
    expect(reportShell).toContain('data-mobile-section')
    expect(reportShell).toContain('class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden sm:hidden"')
    expect(reportShell).not.toContain('class="inline-flex min-w-0 flex-1 items-center gap-1.5 hover:underline hover:underline-offset-4"')
    expect(reportShell).not.toContain(':title="step.title"')
    expect(reportShell).not.toContain('label="Neighbourhood"')
    expect(globalHeader).not.toContain('label="Docs"')
    expect(reportShell).not.toContain('DOCS_SLUG')
    expect(reportShell).toContain('@focus="focusTopology"')
    expect(page).toContain('label="Neighbourhood"')
    expect(page).not.toContain('<h1')
    expect(page).not.toContain('<BlrKind :kind="entity.kind"')
    expect(page).toContain('parentOf(props.workspace, props.entity)')
  })

  /*
    The rail lists kinds, and kinds do not nest. Scenarios are read from the
    parent entity page without adding a second collection tab to the Capability
    or Journey main screen.
  */
  it('keeps Scenarios off collection navigation and on their parent page', () => {
    const rail = source('app/components/BlrRail.vue')
    const reportShell = source('app/components/BlrReportShell.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const sections = source('app/utils/pageSections.ts')
    const scenarios = source('app/components/BlrScenarios.vue')

    expect(rail).toContain("PARENTED: ReportEntityKind[] = ['capability-scenario', 'journey-scenario']")
    expect(rail).not.toContain('blr-navchild')
    expect(reportShell).not.toContain('SCENARIO_OF')
    expect(reportShell).not.toContain('parentTabs')
    expect(reportShell).not.toContain('class="blr-tab"')
    expect(page).toContain('<BlrScenarios')
    expect(sections).toContain('scenariosByCapability')
    expect(sections).toContain('scenariosByJourney')
    expect(scenarios).toContain('selectedKey')
    expect(source('app/utils/reportWorkspace.ts')).toContain('scenariosByCapability')
  })

  it('uses Overview and only an optional Scenarios tab', () => {
    const page = source('app/components/BlrEntityPage.vue')
    const sections = source('app/utils/pageSections.ts')

    expect(sections).toContain("export type PageTabId = 'overview' | 'scenarios'")
    expect(sections).toContain("if (entity.references.length) overviewBlocks.push('references')")
    expect(sections).not.toContain("id: 'diagram'")
    expect(sections).not.toContain("id: 'references'")
    expect(page).toContain('data-sticky-page-tabs')
    expect(page).toContain('label="Neighbourhood"')
    expect(page).toContain("emit('focus', subject)")
  })

  /*
    A page a reader can reach but not link to, return to, or refresh is a modal
    with extra steps.
  */
  it('exposes page and Scenario route state for host URL persistence', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const reportShell = source('app/components/BlrReportShell.vue')

    expect(renderer).toContain("defineModel<string>('section'")
    expect(renderer).toContain("defineModel<string | null>('entity'")
    expect(renderer).toContain("defineModel<string | null>('scenarioRoute'")
    expect(renderer).toContain("defineModel<string>('routeColumns'")
    expect(renderer).toContain('v-model:entity="entity"')
    expect(renderer).toContain('v-model:scenario-route="scenarioRoute"')
    expect(reportShell).toContain("defineModel<string | null>('entity'")
  })

  it('moves product identity into a desktop-equivalent mobile rail', () => {
    const reportShell = source('app/components/BlrReportShell.vue')

    expect(reportShell).toContain("class=\"hidden size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5 lg:block\"")
    expect(reportShell).toContain(":ui=\"{ content: 'w-64 max-w-[85vw]', body: 'p-2' }\"")
    expect(reportShell).toContain('class="blr-report-shell flex min-w-0 flex-1 items-center gap-3"')
    expect(reportShell).toContain('class="blr-report-shell min-h-full"')
    expect(reportShell.match(/v-if="logoSrc"/g)).toHaveLength(2)
  })
})
