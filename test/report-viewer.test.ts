import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const VIEWER = join(__dirname, '..', 'layers', 'nuxt', 'report-viewer')
const workspaceModulePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
const routeWindowModulePath = '../layers/nuxt/report-viewer/app/utils/scenarioRouteWindow.ts'
const { projectReportWorkspace } = await import(workspaceModulePath)
const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function source(path: string): string {
  return readFileSync(join(VIEWER, path), 'utf8')
}

describe('stable Product Report Workbench', () => {
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
    expect(firstCapabilityStep.places.map((place: any) => place.routeId)).toEqual(['web', 'mobile'])
    expect([...firstCapabilityStep.places.map((place: any) => place.place.context.key)].sort()).toEqual([
      'customer-mobile::storefront',
      'customer-web::storefront'
    ])
    expect(workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!.availability
      .map((pair: any) => pair.key).sort()).toEqual([
      'customer-mobile::storefront',
      'customer-web::storefront'
    ])
    expect(workspace.counts.scenarios).toBe(
      report.counts.capabilityScenarios + report.counts.journeyScenarios
    )
  })

  it('derives backlinks without mutating the canonical report', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const before = structuredClone(report)
    const workspace = projectReportWorkspace(report)

    expect(workspace.capabilities.some((item: any) => item.journeyIds.length || item.ruleIds.length)).toBe(true)
    expect(workspace.domains.some((item: any) => item.screenIds.length)).toBe(true)
    const scenarioRule = workspace.rules.find((item: any) => item.id === 'refund-existing-orders')!
    expect(scenarioRule.capabilityIds).toEqual([])
    expect(scenarioRule.derivedCapabilityIds).toEqual(['order-management'])
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
    expect(matrix.steps[1].cells.map((cell: any) => cell.place.context.key)).toEqual([
      'customer-web::storefront',
      'customer-mobile::storefront'
    ])
    /* Parallel lanes are not transitions — neither route changes Product Place. */
    expect(matrix.steps.every((step: any) => step.cells.every((cell: any) => !cell.placeChanged))).toBe(true)
    expect(scenarioStepMatrix(workspace.capabilityScenarios[0]).routes).toHaveLength(2)
  })

  it('gives both Scenario types one Steps table while keeping their scope semantics distinct', () => {
    const body = source('app/components/BlrEntityBody.vue')
    const context = source('app/components/BlrStepContext.vue')
    const links = source('app/components/BlrLinks.vue')
    const layer = source('nuxt.config.ts')

    expect(body).toContain('v-if="stepMatrix"')
    expect(body).toContain('scenarioStepMatrix')
    expect(body).toContain('v-for="route in visibleRoutes"')
    expect(body.match(/<BlrStepContext/g)).toHaveLength(2)
    expect(body).toContain('No Product Place — same Step on every route')
    expect(body).toContain('{{ route.name }}')
    expect(body).not.toContain('{{ route.id }}')
    expect(body).not.toContain('{{ column.id }}')
    for (const kind of ['experience', 'screen']) {
      expect(context).toContain(`<BlrKind kind="${kind}"`)
    }
    expect(context).toContain('<BlrInterfaceType')
    expect(source('app/components/BlrInterfaceType.vue')).toContain(":role=\"labelled ? undefined : 'img'\"")
    expect(body).toContain("asScenario.scenarioType === 'journey' && step.capabilityId")
    expect(body).toContain("step.stepKind === 'actor' && stepActor(step.actorId)")
    expect(body).toContain('{{ stepActor(step.actorId)?.title }}')
    expect(body).not.toContain('label="Performed by"')
    expect(body).toContain('Product action')
    expect(body).toContain('Condition')
    expect(body).toContain('Moved from')
    expect(context).toContain('ProductPlaceView')
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
    expect(body).not.toContain('Product Place ·')
    expect(context).toContain('<BlrInterfaceType :type="place.interfaceType" size="xs" />')
    expect(context).toContain('whitespace-nowrap')
    expect(context).toContain("compact ? 'max-w-24'")
    expect(context).toContain('truncate')
    expect(context.match(/<UTooltip/g)).toHaveLength(3)
    expect(context).not.toContain(':title="place.')
    expect(links).toContain('inline-flex min-h-6 items-center')
    for (const icon of ['align-justify', 'circle-dot-dashed', 'user-round']) {
      expect(layer).toContain(`'lucide:${icon}'`)
    }
  })

  it('keeps the Interface plug and submarks a concrete Interface with its authored type', () => {
    const mark = source('app/components/BlrInterfaceType.vue')
    const kind = source('app/components/BlrKind.vue')
    const structure = source('app/assets/report-workbench.css')
    const card = source('app/components/BlrEntityCard.vue')
    const connections = source('app/components/BlrConnections.vue')
    const workbench = source('app/components/BlrWorkbench.vue')
    const flow = source('app/utils/flowGraph.ts')
    const flowNode = source('app/components/BlrFlowNode.vue')
    const flowGroup = source('app/components/BlrFlowGroup.vue')

    expect(mark).toContain('name="i-lucide-plug"')
    expect(mark).toContain(':name="meta.icon"')
    expect(mark).toContain('blr-interface-mark__type')
    expect(kind).toContain("kind === 'interface' && interfaceType")
    expect(kind).toContain('var(--blr-entity-mark-regular)')
    expect(kind).toContain('var(--blr-entity-mark-dense)')
    expect(mark).toContain('var(--blr-interface-mark-regular)')
    expect(mark).toContain('var(--blr-interface-badge-glyph-dense)')
    expect(mark).toContain(".blr-interface-mark[data-size='xs']")
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
    expect(structure).toContain('--blr-entity-mark-regular: 1.25rem')
    expect(structure).toContain('--blr-entity-mark-dense: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-regular: 1.125rem')
    expect(structure).toContain('--blr-interface-kind-dense: 1rem')
    expect(card).toContain(':interface-type="interfaceType"')
    expect(connections).toContain(':interface-type="interfaceType(item.kind, id)"')
    expect(workbench).toContain('resolvedInterfaceType(group.kind, group.key)')
    expect(workbench).toContain('BlrInterfaceTypeComponent')
    expect(flow).toContain("interfaceType: entity.kind === 'interface' ? entity.interfaceType : null")
    expect(flowNode).toContain("data.kind === 'interface' && data.interfaceType")
    expect(flowGroup).toContain("data.kind === 'interface' && data.interfaceType")
    expect(flowNode).toContain('class="blr-flow-node__kind"')
    expect(flowNode).toContain('var(--blr-entity-mark-regular)')
    expect(flowGroup).toContain('class="blr-flow-group__kind"')
    expect(flowGroup).toContain('var(--blr-entity-mark-regular)')
    expect(source('app/components/BlrFlowLabel.vue')).toContain('var(--blr-entity-mark-dense)')

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

  it('projects the exact authored Screen Place on each Step without inference', async () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const workspace = projectReportWorkspace(report)
    const journeyScenario = workspace.journeyScenarios.find(
      (item: any) => item.id === 'browse-and-complete-checkout'
    )!
    const browsingStep = journeyScenario.steps.find((step: any) => step.capabilityId === 'catalog-browsing')!
    const checkoutStep = journeyScenario.steps.find((step: any) => step.capabilityId === 'checkout')!

    expect(browsingStep.places.map((place: any) => place.place.screenTitle)).toEqual(['Product record', 'Product record'])
    expect(checkoutStep.places.map((place: any) => place.place.screenTitle)).toEqual(['Product record', 'Product record'])

    const capabilityScenario = workspace.capabilityScenarios.find((item: any) => item.id === 'browse-catalog')!
    expect(capabilityScenario.steps[0].places.map((place: any) => place.place.screenTitle))
      .toEqual(['Product record', 'Product record'])
  })

  it('marks a Product Place transition and preserves its previous Place, per route', async () => {
    const { scenarioStepMatrix } = await import(workspaceModulePath)
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const scenario = report.model.journeyScenarios.find(
      (item: any) => item.id === 'browse-and-complete-checkout'
    )!
    const transitionedPlace = scenario.steps
      .find((step: any) => step.capabilityId === 'checkout')!
      .places.find((place: any) => place.routeId === 'web')!
    transitionedPlace.placeId = 'customer-web::storefront'

    const workspace = projectReportWorkspace(report)
    const matrix = scenarioStepMatrix(
      workspace.journeyScenarios.find((item: any) => item.id === 'browse-and-complete-checkout')!
    )

    expect(matrix.steps[0].cells.map((cell: any) => cell.placeChanged)).toEqual([false, false])
    expect(matrix.steps[1].cells.map((cell: any) => cell.placeChanged)).toEqual([true, false])
    expect(matrix.steps[1].cells[0].previousPlace.id).toBe('customer-web::storefront::product-record')
  })

  it('derives Journey availability only from achieved flows', () => {
    const report = compileReport(loadModel(FIXTURE), '2026-08-08')
    const scenario = report.model.journeyScenarios[0]!
    report.model.journeyScenarios[0] = { ...scenario, result: 'not-achieved' }

    const workspace = projectReportWorkspace(report)
    const journey = workspace.journeys.find((item: any) => item.id === scenario.journeyId)!
    expect(journey.availability).toEqual([])
    expect(journey.entryPoints).toEqual([])
  })

  it('ships Workbench as the only report renderer', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const workbench = source('app/components/BlrWorkbench.vue')
    const layer = source('nuxt.config.ts')

    expect(renderer).toContain('ProductReportV9')
    expect(renderer).toContain('projectReportWorkspace')
    expect(renderer).toContain('<BlrWorkbench')
    expect(source('app/components/BlrEntityBody.vue')).toContain('scenarioStepMatrix')
    expect(workbench).toContain('<BlrProductTopology')
    /* Grouping is how authored Domains earn their place in navigation. */
    expect(workbench).toContain('groupKind')
    expect(workbench).toContain('groupOptions')
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
      'app/components/BlrWorkbench.vue'
    ]) {
      expect(source(path), path).not.toMatch(/<footer|<\/footer>/)
      expect(source(path), path).not.toMatch(/\$slots\.footer|name="footer"/)
    }
  })

  it('keeps short viewports inside the Workbench scroll boundary', () => {
    const structure = source('app/assets/report-structure.css')
    const panes = source('app/assets/report-workbench.css')

    expect(structure).toContain('min-height: 0')
    expect(structure).not.toContain('min-height: 42rem')
    expect(panes).toContain('overflow-y: auto')
  })

  it('uses shared flow surfaces for contextual and Product topology', () => {
    const flow = source('app/utils/flowGraph.ts')
    const topology = source('app/components/BlrTopology.vue')
    const canvas = source('app/components/BlrFlowCanvas.vue')

    expect(flow).toContain('export function directRelations')
    expect(flow).toContain('export function buildNeighbourhood')
    expect(flow).toContain('export function buildScreenMap')
    expect(topology).toContain('buildNeighbourhood')
    expect(canvas).toContain('@vue-flow/core')
    expect(canvas).toContain('#node-blr')
  })

  it('keeps the question-and-derivation bar exclusive to Topology', () => {
    const workbench = source('app/components/BlrWorkbench.vue')
    const topology = source('app/components/BlrProductTopology.vue')

    expect(existsSync(join(VIEWER, 'app/utils/browseSurfaces.ts'))).toBe(false)
    expect(workbench).not.toContain('surface.question')
    expect(workbench).not.toContain('surface.flow')
    expect(topology).toContain('{{ view.question }}')
    expect(topology).toContain('v-for="(step, index) in kindSteps"')
  })

  it('scrolls collection controls with their list instead of pinning them as chrome', () => {
    const workbench = source('app/components/BlrWorkbench.vue')
    const docs = source('app/utils/entityDocs.ts')
    const pane = workbench.indexOf('v-if="!topologyActive" class="blr-pane min-h-0 flex-1"')
    const toolbar = workbench.indexOf('v-if="showToolbar"', pane)
    const reading = workbench.indexOf('<div class="p-5">', toolbar)

    expect(pane).toBeGreaterThan(-1)
    expect(toolbar).toBeGreaterThan(pane)
    expect(reading).toBeGreaterThan(toolbar)
    expect(workbench.slice(toolbar, reading)).not.toContain('border-b border-default')
    expect(workbench.slice(toolbar, reading)).toContain(':to="collectionDocs.url"')
    expect(workbench.slice(toolbar, reading)).toContain('label="Docs"')
    expect(docs).toContain("screen: 'screens'")
    expect(docs).toContain("domain: 'domains'")
  })

  /*
    The peek is a glance and the page is the reading. One panel served both for
    a while, and it could not: authored content runs from roughly 570px for an
    Actor to 2264px for a Journey Scenario. These assertions keep the authored
    body out of the panel, which is the only thing stopping it growing back.
  */
  it('keeps the peek a glance and the page the reading', () => {
    const workbench = source('app/components/BlrWorkbench.vue')
    const inspector = source('app/components/BlrInspector.vue')
    const peek = source('app/components/BlrEntityPeek.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const body = source('app/components/BlrEntityBody.vue')

    expect(inspector).toContain('<BlrEntityPeek')
    expect(workbench).toContain('<BlrEntityPage')
    expect(page).toContain('<BlrEntityBody')
    expect(page).not.toContain('buildJourneyAnatomy')
    expect(page).not.toContain('journeyStepsGraph')

    /* The authored body belongs to the page. */
    for (const marker of ['stepMatrix.steps', 'asScreen.states', 'asRule.statement']) {
      expect(body, marker).toContain(marker)
      expect(peek, marker).not.toContain(marker)
    }

    /* Depth is one level: a relation navigates rather than re-targeting. */
    expect(peek).toContain("emit('open', entity)")
    expect(inspector).not.toMatch(/history\.value|const history = ref|function goBack/)
  })

  it('uses the Workbench trail as the only entity-page identity', () => {
    const workbench = source('app/components/BlrWorkbench.vue')
    const page = source('app/components/BlrEntityPage.vue')
    const globalHeader = workbench.slice(
      workbench.indexOf('<header'),
      workbench.indexOf('<div class="flex min-h-0 flex-1">')
    )

    expect(workbench).toContain('v-for="(step, index) in pageTrail"')
    expect(workbench).toContain('aria-label="Page breadcrumb"')
    expect(workbench).toContain('data-mobile-location')
    expect(workbench).toContain('data-mobile-section')
    expect(workbench).toContain('class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden sm:hidden"')
    expect(workbench).not.toContain('class="inline-flex min-w-0 flex-1 items-center gap-1.5 hover:underline hover:underline-offset-4"')
    expect(workbench).not.toContain(':title="step.title"')
    expect(workbench).not.toContain('label="Neighbourhood"')
    expect(globalHeader).not.toContain('label="Docs"')
    expect(workbench).not.toContain('DOCS_SLUG')
    expect(workbench).toContain('@focus="focusTopology"')
    expect(page).not.toContain('<h1')
    expect(page).not.toContain('<BlrKind :kind="entity.kind"')
    expect(page).not.toContain('const parentOf = computed')
  })

  /*
    The rail lists kinds, and kinds do not nest. Scenarios are read from the
    parent entity page without adding a second collection tab to the Capability
    or Journey main screen.
  */
  it('keeps Scenarios off collection navigation and on their parent page', () => {
    const rail = source('app/components/BlrRail.vue')
    const workbench = source('app/components/BlrWorkbench.vue')
    const page = source('app/components/BlrEntityPage.vue')

    expect(rail).toContain("PARENTED: ReportEntityKind[] = ['capability-scenario', 'journey-scenario']")
    expect(rail).not.toContain('blr-navchild')
    expect(workbench).not.toContain('SCENARIO_OF')
    expect(workbench).not.toContain('parentTabs')
    expect(workbench).not.toContain('class="blr-tab"')
    expect(page).toContain('scenariosByCapability')
    expect(page).toContain('scenariosByJourney')
    expect(source('app/utils/reportWorkspace.ts')).toContain('scenariosByCapability')
  })

  /*
    A page a reader can reach but not link to, return to, or refresh is a modal
    with extra steps.
  */
  it('exposes page and Scenario route state for host URL persistence', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const workbench = source('app/components/BlrWorkbench.vue')

    expect(renderer).toContain("defineModel<string>('section'")
    expect(renderer).toContain("defineModel<string | null>('entity'")
    expect(renderer).toContain("defineModel<string | null>('scenarioRoute'")
    expect(renderer).toContain("defineModel<string>('routeColumns'")
    expect(renderer).toContain('v-model:entity="entity"')
    expect(renderer).toContain('v-model:scenario-route="scenarioRoute"')
    expect(workbench).toContain("defineModel<string | null>('entity'")
  })

  it('moves product identity into a desktop-equivalent mobile rail', () => {
    const workbench = source('app/components/BlrWorkbench.vue')

    expect(workbench).toContain("class=\"hidden size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5 lg:block\"")
    expect(workbench).toContain(":ui=\"{ content: 'w-64 max-w-[85vw]', body: 'p-2' }\"")
    expect(workbench).toContain('class="blr-workbench flex min-w-0 flex-1 items-center gap-3"')
    expect(workbench).toContain('class="blr-workbench min-h-full"')
    expect(workbench.match(/v-if="logoSrc"/g)).toHaveLength(2)
  })
})
