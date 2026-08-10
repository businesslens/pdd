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
    expect(workspace.experiences).toHaveLength(report.model.experiences.length)
    expect(workspace.screens).toHaveLength(report.model.screens.length)
    expect(workspace.domains).toHaveLength(report.model.domains.length)
    expect(workspace.capabilities).toHaveLength(report.model.capabilities.length)
    expect(workspace.journeys).toHaveLength(report.model.journeys.length)
    expect(workspace.rules).toHaveLength(report.model.businessRules.length)
    expect(workspace.capabilityScenarios.every((item: any) => item.scenarioType === 'capability')).toBe(true)
    expect(workspace.journeyScenarios.every((item: any) => item.scenarioType === 'journey')).toBe(true)
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

    expect(renderer).toContain('ProductReportV8')
    expect(renderer).toContain('projectReportWorkspace')
    expect(renderer).toContain('<BlrWorkbench')
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

  it('keeps completeness in the inspector and Scenario drilldowns', () => {
    const workbench = source('app/components/BlrWorkbench.vue')
    const inspector = source('app/components/BlrInspector.vue')
    const drilldown = source('app/components/BlrWorkbenchScenarioDrilldown.vue')

    expect(workbench).toContain('<BlrWorkbenchScenarioDrilldown')
    expect(inspector).toContain('<BlrInspectorDetail')
    expect(drilldown).toContain("entity.kind === 'capability'")
    expect(drilldown).toContain("entity.kind === 'journey'")
    expect(drilldown).toContain('<BlrInspectorDetail')
  })
})
