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
  parentNode?: string
  data?: { entityKey?: string, entityId?: string, kind?: string, dimmed?: boolean, colorSlot?: number | null }
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
const filterProductTopologyGraph = filtersModule.filterProductTopologyGraph as (
  graph: TestGraph,
  options: { visibleKinds: string[], focusEntityIds?: string[] }
) => TestGraph
const PRODUCT_TOPOLOGY_VIEWS = viewsModule.PRODUCT_TOPOLOGY_VIEWS as TestTopologyView[]
const DEFAULT_PRODUCT_TOPOLOGY_VIEW = viewsModule.DEFAULT_PRODUCT_TOPOLOGY_VIEW as string

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const workspace = projectReportWorkspace(compileReport(loadModel(FIXTURE), '2026-08-08'))
const TEACHING_BLUEPRINT = join(__dirname, '..', 'blueprints', 'content-feed-reader')
const teachingWorkspace = projectReportWorkspace(compileReport(loadModel(TEACHING_BLUEPRINT), '2026-08-08'))

describe('named Product Topology views', () => {
  it('registers the fixed questions and opens on Product map', () => {
    expect(DEFAULT_PRODUCT_TOPOLOGY_VIEW).toBe('product-map')
    expect(PRODUCT_TOPOLOGY_VIEWS.map(view => view.id)).toEqual([
      'product-map',
      'value-paths',
      'delivery-by-interface',
      'sitemap',
      'rule-reach',
      'everything'
    ])
    expect(PRODUCT_TOPOLOGY_VIEWS.every(view => view.question.endsWith('?'))).toBe(true)
  })

  it('draws every restored view without dangling edges', () => {
    for (const view of PRODUCT_TOPOLOGY_VIEWS) {
      const graph = buildProductTopologyGraph(teachingWorkspace, view.id)
      const ids = new Set(graph.nodes.map(node => node.id))

      expect(graph.nodes.length, view.id).toBeGreaterThan(0)
      expect(graph.edges.every(edge => ids.has(edge.source) && ids.has(edge.target)), view.id).toBe(true)
    }
  })

  /* Derived reach belongs on the Rule card; an edge here is always authored. */
  it('draws only authored attachments in Rule reach', () => {
    const graph = buildProductTopologyGraph(teachingWorkspace, 'rule-reach')
    const authored = new Set(teachingWorkspace.rules.flatMap((rule: any) => [
      ...rule.capabilityIds.map((id: string) => `${rule.key}->capability:${id}`),
      ...rule.journeyIds.map((id: string) => `${rule.key}->journey:${id}`),
      ...rule.capabilityScenarioIds.map((id: string) => `${rule.key}->capability-scenario:${id}`),
      ...rule.journeyScenarioIds.map((id: string) => `${rule.key}->journey-scenario:${id}`)
    ]))

    expect(graph.edges.length).toBeGreaterThan(0)
    expect(graph.edges.every(edge => authored.has(`${edge.source}->${edge.target}`))).toBe(true)
  })

  it('gives each Scenario kind its own Everything shelf', () => {
    const graph = buildProductTopologyGraph(teachingWorkspace, 'everything')
    const shelves = graph.nodes.filter(node => node.id.startsWith('blr-shelf-')).map(node => node.id)

    expect(shelves).toContain('blr-shelf-capability-scenario')
    expect(shelves).toContain('blr-shelf-journey-scenario')
    expect(shelves).not.toContain('blr-shelf-scenario')
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
      expect(graph.edges.length, `${view.name} edges`).toBeGreaterThan(0)
    }
  })

  it('keeps identity views unique and Value path Steps contextual', () => {
    const delivery = buildProductTopologyGraph(workspace, 'delivery-by-interface')
    const identityIds = delivery.nodes
      .map(node => node.data?.entityKey)
      .filter((id): id is string => Boolean(id))
    expect(new Set(identityIds).size).toBe(identityIds.length)

    const valuePaths = buildProductTopologyGraph(workspace, 'value-paths')
    const occurrenceNodes = valuePaths.nodes.filter(node => node.id.includes(':step:'))
    expect(occurrenceNodes.length).toBeGreaterThan(0)
    expect(occurrenceNodes.some(node => node.id !== node.data?.entityKey)).toBe(true)
  })

  it('draws only the selected Journey value path', () => {
    const journey = workspace.journeys.at(-1)!
    const graph = buildProductTopologyGraph(workspace, 'value-paths', { journeyId: journey.id })
    const journeyIds = graph.nodes
      .filter(node => node.data?.kind === 'journey')
      .map(node => node.data?.entityId)
    expect(journeyIds).toEqual([journey.id])
    expect(graph.nodes.some(node => node.id.includes(':step:'))).toBe(true)
    expect(graph.edges.some(edge => edge.label === 'then' || edge.label === 'starts')).toBe(true)
  })

  it('uses Capability kind colour when no Domain grouping is visible', () => {
    const composition = buildProductTopologyGraph(teachingWorkspace, 'value-paths')
    const compositionCapabilities = composition.nodes.filter(node =>
      node.id.includes(':step:') && node.data?.kind === 'capability')
    expect(compositionCapabilities.length).toBeGreaterThan(0)
    expect(compositionCapabilities.every(node => node.data?.colorSlot === null)).toBe(true)

    const delivery = buildProductTopologyGraph(workspace, 'delivery-by-interface')
    const deliveredCapabilities = delivery.nodes.filter(node => node.data?.kind === 'capability')
    expect(deliveredCapabilities.length).toBeGreaterThan(0)
    expect(deliveredCapabilities.every(node => node.data?.colorSlot === null)).toBe(true)
  })

  it('groups Capabilities in Domain lanes and applies authored Domain colours', () => {
    const domain = workspace.domains.find((item: any) => item.colorSlot != null)!
    const capability = workspace.capabilities.find((item: any) => item.domainId === domain.id)!
    const graph = buildProductTopologyGraph(workspace, 'product-map')
    const capabilityNode = graph.nodes.find(node => node.data?.entityKey === capability.key)!

    expect(capabilityNode.parentNode).toBe(domain.key)
    expect(capabilityNode.data?.colorSlot).toBe(domain.colorSlot)
  })

  it('shows direct Interfaces delivering Capabilities without fake Experiences', () => {
    const directInterface = workspace.interfaces.find((item: any) => item.experienceIds.length === 0)!
    const capability = workspace.capabilities.find((item: any) => item.interfaceIds.includes(directInterface.id))!
    const graph = buildProductTopologyGraph(workspace, 'delivery-by-interface')

    expect(graph.edges.some(edge => edge.source === directInterface.key && edge.target === capability.key)).toBe(true)
  })

  it('hides entity kinds locally and removes their incident relations', () => {
    const base = buildProductTopologyGraph(workspace, 'delivery-by-interface')
    const filtered = filterProductTopologyGraph(base, {
      visibleKinds: ['interface', 'experience', 'screen', 'capability']
    })
    const nodeIds = new Set(filtered.nodes.map(node => node.id))

    expect(filtered.nodes.some(node => node.data?.kind === 'actor')).toBe(false)
    expect(filtered.edges.every(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))).toBe(true)
    expect(base.nodes.some(node => node.data?.kind === 'actor')).toBe(true)
  })

  /*
    A Screen is authored against the Scenario, not one Step. Anchoring on the
    final Step claimed a Capability "lands on" a Screen it shares no
    availability with — here the public reading Step against the owner's
    private workspace, which is limited to the personal library.
  */
  it('anchors a Value paths Screen on a Step that actually exposes it', () => {
    const graph = buildProductTopologyGraph(teachingWorkspace, 'value-paths', {
      journeyId: 'publish-and-share-a-collection'
    })
    const screen = teachingWorkspace.screens.find((item: any) => item.id === 'reader-web::personal-library::collection-workspace')!
    const landing = graph.edges.find(edge => edge.target === screen.key)!
    const source = graph.nodes.find(node => node.id === landing.source)!

    expect(landing.label).toBe('lands on')
    expect(source.data?.entityId).toBe('collection-publication')
    expect(source.data?.entityId).not.toBe('public-collection-reading')
  })

  it('runs Value path Steps downward so a short Journey is not a thin ribbon', () => {
    const graph = buildProductTopologyGraph(teachingWorkspace, 'value-paths', {
      journeyId: 'follow-and-receive-from-a-source'
    })
    const nodes = graph.nodes as Array<TestNode & { position: { x: number, y: number } }>
    const spanX = Math.max(...nodes.map(node => node.position.x)) - Math.min(...nodes.map(node => node.position.x))
    const spanY = Math.max(...nodes.map(node => node.position.y)) - Math.min(...nodes.map(node => node.position.y))

    expect(spanY).toBeGreaterThan(spanX)
  })

  it('focuses entities with one-hop context instead of unrelated branches', () => {
    const base = buildProductTopologyGraph(workspace, 'delivery-by-interface')
    const entity = [...workspace.interfaces, ...workspace.experiences, ...workspace.screens].find((item: any) =>
      base.edges.some(edge => edge.source === item.key || edge.target === item.key))!
    const expected = topologyNeighbourhood(entity.key, base.edges)
    const filtered = filterProductTopologyGraph(base, {
      visibleKinds: ['actor', 'interface', 'experience', 'screen', 'capability'],
      focusEntityIds: [entity.key]
    })

    expect(new Set(filtered.nodes.map(node => node.id))).toEqual(expected)
    expect(filtered.nodes.length).toBeLessThan(base.nodes.length)
  })
})
