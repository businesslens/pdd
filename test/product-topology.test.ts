import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import {
  barycenterOrder,
  layoutStrata,
  topologyNeighbourhood
} from '../layers/nuxt/report-viewer/app/utils/productTopologyLayout.js'

interface TestNode {
  id: string
  data?: { entityKey?: string, entityId?: string, kind?: string, dimmed?: boolean }
}

interface TestEdge {
  source: string
  target: string
  label?: string
  style?: { opacity?: number }
}

interface TestGraph {
  nodes: TestNode[]
  edges: TestEdge[]
}

interface TestTopologyView {
  id: string
  name: string
  question: string
}

// These Nuxt-layer modules intentionally use bundler-style imports. Loading
// through a runtime specifier lets Vitest exercise them without making the
// root NodeNext typecheck reinterpret the whole Nuxt layer as Node modules.
const workspaceModulePath = '../layers/nuxt/report-viewer/app/utils/reportWorkspace.ts'
const graphModulePath = '../layers/nuxt/report-viewer/app/utils/productTopologyGraphs.ts'
const filtersModulePath = '../layers/nuxt/report-viewer/app/utils/productTopologyFilters.ts'
const viewsModulePath = '../layers/nuxt/report-viewer/app/utils/productTopologyViews.ts'
const workspaceModule = await import(workspaceModulePath)
const graphModule = await import(graphModulePath)
const filtersModule = await import(filtersModulePath)
const viewsModule = await import(viewsModulePath)

const projectReportWorkspace = workspaceModule.projectReportWorkspace as (report: ReturnType<typeof compileReport>) => any
const buildProductTopologyGraph = graphModule.buildProductTopologyGraph as (
  workspace: any,
  viewId: string,
  options?: { journeyId?: string, highlightId?: string }
) => TestGraph
const EVERYTHING_SHELF_ORDER = graphModule.EVERYTHING_SHELF_ORDER as string[]
const filterProductTopologyGraph = filtersModule.filterProductTopologyGraph as (
  graph: TestGraph,
  options: { visibleKinds: string[], focusEntityIds?: string[] }
) => TestGraph
const PRODUCT_TOPOLOGY_VIEWS = viewsModule.PRODUCT_TOPOLOGY_VIEWS as TestTopologyView[]
const DEFAULT_PRODUCT_TOPOLOGY_VIEW = viewsModule.DEFAULT_PRODUCT_TOPOLOGY_VIEW as string

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))

describe('named Product Topology views', () => {
  it('registers seven fixed questions and opens on Value flow', () => {
    expect(DEFAULT_PRODUCT_TOPOLOGY_VIEW).toBe('value-flow')
    expect(PRODUCT_TOPOLOGY_VIEWS.map(view => view.id)).toEqual([
      'everything',
      'value-flow',
      'access-map',
      'sitemap',
      'domain-anatomy',
      'rule-reach',
      'journey-anatomy'
    ])
    expect(PRODUCT_TOPOLOGY_VIEWS.every(view => view.question.endsWith('?'))).toBe(true)
  })

  it('keeps every entity kind on one fixed Everything shelf', () => {
    expect(EVERYTHING_SHELF_ORDER).toEqual([
      'product', 'actor', 'interface', 'experience', 'screen',
      'scenario', 'journey', 'capability', 'domain', 'rule'
    ])
    expect(new Set(EVERYTHING_SHELF_ORDER).size).toBe(EVERYTHING_SHELF_ORDER.length)
  })

  it('orders shelves deterministically by their related neighbours', () => {
    const rows = [['a1', 'a2', 'a3'], ['b3', 'b2', 'b1']]
    const edges = [
      { source: 'a1', target: 'b1' },
      { source: 'a2', target: 'b2' },
      { source: 'a3', target: 'b3' }
    ]
    expect(barycenterOrder(rows, edges)[1]).toEqual(['b1', 'b2', 'b3'])
    expect(barycenterOrder(rows, edges)).toEqual(barycenterOrder(rows, edges))
  })

  it('removes empty shelf gaps and centers narrower shelves', () => {
    const result = layoutStrata([['product'], [], ['left', 'right']], {
      nodeWidth: 100,
      nodeHeight: 40,
      gapX: 20,
      gapY: 30
    })
    expect(result.rowTops.has(1)).toBe(false)
    expect(result.positions.get('right')?.y).toBe(70)
    expect(result.positions.get('product')?.x).toBe(60)
  })

  it('computes a one-hop neighbourhood in either edge direction', () => {
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'b' },
      { source: 'c', target: 'd' }
    ]
    expect([...topologyNeighbourhood('b', edges)].sort()).toEqual(['a', 'b', 'c'])
  })

  it('builds every view from the shared report projection', () => {
    for (const view of PRODUCT_TOPOLOGY_VIEWS) {
      const graph = buildProductTopologyGraph(workspace, view.id, {
        journeyId: workspace.journeys[0]?.id
      })
      expect(graph.nodes.length, `${view.name} nodes`).toBeGreaterThan(0)
      if (view.id !== 'domain-anatomy') {
        expect(graph.edges.length, `${view.name} edges`).toBeGreaterThan(0)
      }
    }
  })

  it('keeps identity views unique and Sitemap occurrences contextual', () => {
    const valueFlow = buildProductTopologyGraph(workspace, 'value-flow')
    const identityIds = valueFlow.nodes
      .map(node => node.data?.entityKey)
      .filter((id): id is string => Boolean(id))
    expect(new Set(identityIds).size).toBe(identityIds.length)

    const sitemap = buildProductTopologyGraph(workspace, 'sitemap')
    const occurrenceNodes = sitemap.nodes.filter(node => node.id.includes('::'))
    expect(occurrenceNodes.length).toBeGreaterThan(0)
    expect(occurrenceNodes.some(node => node.id !== node.data?.entityKey)).toBe(true)
  })

  it('draws only the selected Journey anatomy', () => {
    const journey = workspace.journeys.at(-1)!
    const graph = buildProductTopologyGraph(workspace, 'journey-anatomy', { journeyId: journey.id })
    const journeyIds = graph.nodes
      .filter(node => node.data?.kind === 'journey')
      .map(node => node.data?.entityId)
    expect(journeyIds).toEqual([journey.id])
    expect(graph.nodes.some(node => node.id.includes(':stage:'))).toBe(true)
    expect(graph.edges.some(edge => edge.label === 'then' || edge.label === 'starts')).toBe(true)
  })

  it('connects Capability Scenarios to their owning Capability', () => {
    const capability = workspace.capabilities.find((item: any) => item.scenarioIds.length)!
    const scenario = workspace.capabilityScenarios.find((item: any) => item.capabilityId === capability.id)!
    const graph = buildProductTopologyGraph(workspace, 'everything')

    expect(graph.edges.some(edge => edge.source === capability.key && edge.target === scenario.key)).toBe(true)
  })

  it('keeps Everything edges latent until an entity is highlighted', () => {
    const quiet = buildProductTopologyGraph(workspace, 'everything')
    expect(quiet.edges.every(edge => Number((edge.style as { opacity?: number }).opacity) < 0.2)).toBe(true)

    const actor = workspace.actors[0]!
    const lit = buildProductTopologyGraph(workspace, 'everything', { highlightId: actor.key })
    expect(lit.edges.some(edge => Number((edge.style as { opacity?: number }).opacity) === 1)).toBe(true)
    expect(lit.nodes.some(node => node.data?.entityKey !== actor.key && 'dimmed' in (node.data ?? {}) && node.data?.dimmed)).toBe(true)
  })

  it('hides entity kinds locally and removes their incident relations', () => {
    const base = buildProductTopologyGraph(workspace, 'value-flow')
    const filtered = filterProductTopologyGraph(base, {
      visibleKinds: ['journey', 'capability', 'screen']
    })
    const nodeIds = new Set(filtered.nodes.map(node => node.id))

    expect(filtered.nodes.some(node => node.data?.kind === 'actor')).toBe(false)
    expect(filtered.edges.every(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))).toBe(true)
    expect(base.nodes.some(node => node.data?.kind === 'actor')).toBe(true)
  })

  it('focuses entities with one-hop context instead of unrelated branches', () => {
    const base = buildProductTopologyGraph(workspace, 'value-flow')
    const capability = workspace.capabilities.find((item: any) =>
      base.edges.some(edge => edge.source === item.key || edge.target === item.key))!
    const expected = topologyNeighbourhood(capability.key, base.edges)
    const filtered = filterProductTopologyGraph(base, {
      visibleKinds: ['actor', 'journey', 'capability', 'screen'],
      focusEntityIds: [capability.key]
    })

    expect(new Set(filtered.nodes.map(node => node.id))).toEqual(expected)
    expect(filtered.nodes.length).toBeLessThan(base.nodes.length)
  })
})
