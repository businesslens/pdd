import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const VIEWER = join(__dirname, '..', 'layers', 'nuxt', 'report-viewer')
const workspaceModulePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
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
    expect(body).toContain('v-for="route in stepMatrix.routes"')
    expect(body.match(/<BlrStepContext/g)).toHaveLength(1)
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
    expect(body).toContain('stepMatrix.routes.length * 310')
    expect(body).toContain('sticky left-0')
    expect(context).toContain('whitespace-nowrap')
    expect(links).toContain('inline-flex min-h-6 items-center')
    for (const icon of ['align-justify', 'circle-dot-dashed', 'user-round']) {
      expect(layer).toContain(`'lucide:${icon}'`)
    }
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

  /*
    Panes must chain at their end, or a host footer below the report is
    unreachable by wheel however far the reader scrolls.
  */
  it('lets pane scrolling continue into the host page', () => {
    expect(source('app/assets/report-workbench.css')).not.toContain('overscroll-behavior')
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

  /*
    The rail lists kinds, and kinds do not nest. Both Scenario kinds are reached
    from the parent that owns them, which is where the documentation explains
    them too.
  */
  it('keeps Scenarios off the navigation rail and on their parent', () => {
    const rail = source('app/components/BlrRail.vue')
    const workbench = source('app/components/BlrWorkbench.vue')

    expect(rail).toContain("PARENTED: ReportEntityKind[] = ['capability-scenario', 'journey-scenario']")
    expect(rail).not.toContain('blr-navchild')
    expect(workbench).toContain('SCENARIO_OF')
    expect(workbench).toContain('parentTabs')
    expect(source('app/utils/reportWorkspace.ts')).toContain('scenariosByCapability')
  })

  /*
    A page a reader can reach but not link to, return to, or refresh is a modal
    with extra steps.
  */
  it('exposes the open section and the open page as bindable state', () => {
    const renderer = source('app/components/BusinessLensReportViewer.vue')
    const workbench = source('app/components/BlrWorkbench.vue')

    expect(renderer).toContain("defineModel<string>('section'")
    expect(renderer).toContain("defineModel<string | null>('entity'")
    expect(renderer).toContain('v-model:entity="entity"')
    expect(workbench).toContain("defineModel<string | null>('entity'")
  })
})
