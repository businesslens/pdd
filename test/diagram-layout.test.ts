import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { entityRelationsProjection, uiMapProjection } = await utility('topologyProjections')
const { buildEntityLifecycle } = await utility('entityLifecycle')
const { diagramLayoutInput, diagramLayoutResult } = await utility('diagram')
const { uiMapDiagram } = await utility('uiMap')
const { defaultTopologyReading } = await utility('topologyState')
const elkPath = 'elkjs/lib/elk.bundled.js'
const { default: ELK } = await import(elkPath)
const elk = new ELK({ algorithms: ['layered'] })
const epsilon = 0.001
const overlaps = (a: any, b: any) => a.x + a.width > b.x + epsilon && b.x + b.width > a.x + epsilon && a.y + a.height > b.y + epsilon && b.y + b.height > a.y + epsilon

async function layout(diagram: any) {
  const sizes = Object.fromEntries([
    ...diagram.nodes.map((node: any) => [`node:${node.id}`, { width: node.terminal ? 120 : 220, height: 60 }]),
    ...diagram.edges.map((edge: any) => [`edge:${edge.id}`, { width: Math.min(200, edge.label.length * 7 + 12), height: 40 }])
  ])
  return elk.layout(diagramLayoutInput(diagram, sizes))
}

function verifyGeometry(graph: any) {
  const nodes = graph.children ?? []
  const labels = (graph.edges ?? []).flatMap((edge: any) => edge.labels ?? [])
  const boxes = [...nodes, ...labels]
  for (const [index, box] of boxes.entries()) {
    expect(box.x, box.id).toBeGreaterThanOrEqual(-epsilon)
    expect(box.y, box.id).toBeGreaterThanOrEqual(-epsilon)
    expect(box.x + box.width, box.id).toBeLessThanOrEqual(graph.width + epsilon)
    expect(box.y + box.height, box.id).toBeLessThanOrEqual(graph.height + epsilon)
    for (const other of boxes.slice(index + 1)) expect(overlaps(box, other), `${box.id} overlaps ${other.id}`).toBe(false)
  }
  for (const edge of graph.edges ?? []) {
    expect(edge.sections?.length, edge.id).toBeGreaterThan(0)
    for (const section of edge.sections) {
      const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
      for (let index = 1; index < points.length; index++) {
        const a = points[index - 1], b = points[index]
        expect(Math.abs(a.x - b.x) < epsilon || Math.abs(a.y - b.y) < epsilon, `${edge.id} orthogonal`).toBe(true)
        for (const node of nodes.filter((node: any) => !edge.sources.includes(node.id) && !edge.targets.includes(node.id))) {
          const enters = Math.abs(a.x - b.x) < epsilon
            ? a.x > node.x + epsilon && a.x < node.x + node.width - epsilon && Math.max(a.y, b.y) > node.y + epsilon && Math.min(a.y, b.y) < node.y + node.height - epsilon
            : a.y > node.y + epsilon && a.y < node.y + node.height - epsilon && Math.max(a.x, b.x) > node.x + epsilon && Math.min(a.x, b.x) < node.x + node.width - epsilon
          expect(enters, `${edge.id} enters ${node.id}`).toBe(false)
        }
      }
    }
  }
}

describe('routed diagram geometry', () => {
  it.each(['blueprints/content-feed-reader', 'test/fixtures/fixture-shop', '.'])('preserves and routes real Entity relationships and every Lifecycle: %s', async root => {
    const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '..', root)), '2026-09-07'))
    const diagrams = [entityRelationsProjection(workspace), ...workspace.entities.filter((entity: any) => entity.states.length).map((entity: any) => buildEntityLifecycle(workspace, entity))]
    for (const diagram of diagrams) {
      const graph = await layout(diagram)
      expect(graph.children.map((node: any) => node.id)).toEqual(diagram.nodes.map((node: any) => node.id))
      expect(graph.edges.map((edge: any) => edge.id)).toEqual(diagram.edges.map((edge: any) => edge.id))
      verifyGeometry(graph)
    }
  })

  /* The UI map is a hierarchy: frames sized around their contents, arrows crossing frame borders, routes read back into root coordinates. */
  it.each(['test/fixtures/fixture-shop', 'blueprints/content-feed-reader', '.'])('nests UI map frames around their contents and routes every move in root coordinates: %s', async root => {
    const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '..', root)), '2026-09-07'))
    const map = uiMapProjection(workspace)
    const diagram = uiMapDiagram(map.places, map, defaultTopologyReading())
    expect(diagram.nodes.some((node: any) => node.parent)).toBe(true)
    const sizes = Object.fromEntries([
      ...diagram.nodes.map((node: any) => [`node:${node.id}`, node.group ? { width: 180, height: 40 } : { width: node.terminal ? 120 : 220, height: 60 }]),
      ...diagram.edges.map((edge: any) => [`edge:${edge.id}`, { width: Math.min(200, edge.label.length * 7 + 12), height: 40 }])
    ])
    const input = diagramLayoutInput(diagram, sizes)
    expect(input.layoutOptions['elk.hierarchyHandling']).toBe('INCLUDE_CHILDREN')
    const flattenInput = (children: any[]): any[] => children.flatMap(child => [child, ...flattenInput(child.children ?? [])])
    expect(flattenInput(input.children).map(child => child.id).sort()).toEqual(diagram.nodes.map((node: any) => node.id).sort())
    const placed = diagramLayoutResult(diagram, await elk.layout(input))
    const box = new Map<string, any>(placed.nodes.map((node: any) => [node.id, node]))
    for (const node of placed.nodes) {
      for (const value of [node.x, node.y, node.width, node.height]) expect(Number.isFinite(value), node.id).toBe(true)
      expect(node.x + node.width, node.id).toBeLessThanOrEqual(placed.width + epsilon)
      expect(node.y + node.height, node.id).toBeLessThanOrEqual(placed.height + epsilon)
      if (!node.parent) continue
      const frame = box.get(node.parent)!
      expect(node.x, `${node.id} inside ${node.parent}`).toBeGreaterThanOrEqual(frame.x - epsilon)
      expect(node.y, `${node.id} below ${node.parent}'s header`).toBeGreaterThanOrEqual(frame.y + 40 - epsilon)
      expect(node.x + node.width, `${node.id} inside ${node.parent}`).toBeLessThanOrEqual(frame.x + frame.width + epsilon)
      expect(node.y + node.height, `${node.id} inside ${node.parent}`).toBeLessThanOrEqual(frame.y + frame.height + epsilon)
    }
    for (const edge of placed.edges) {
      expect(edge.paths.length, edge.id).toBeGreaterThan(0)
      if (edge.label) expect(edge.labelBox, edge.id).toBeDefined()
      const touches = (id: string, point: any) => { const node = box.get(id)!; return point.x >= node.x - epsilon && point.x <= node.x + node.width + epsilon && point.y >= node.y - epsilon && point.y <= node.y + node.height + epsilon }
      expect(touches(edge.source, edge.paths[0][0]), `${edge.id} leaves its source`).toBe(true)
      expect(touches(edge.target, edge.paths.at(-1)!.at(-1)!), `${edge.id} reaches its target`).toBe(true)
    }
  })

  it('routes cycles, parallel edges, self-loops and isolated nodes repeatably', async () => {
    const diagram = {
      direction: 'DOWN',
      nodes: ['A', 'B', 'Isolated'].map(id => ({ id, title: id })),
      edges: [
        { id: 'ab1', source: 'A', target: 'B', label: 'First transition' },
        { id: 'ab2', source: 'A', target: 'B', label: 'Second transition' },
        { id: 'ba', source: 'B', target: 'A', label: 'Return' },
        { id: 'aa', source: 'A', target: 'A', label: 'Self transition' },
        { id: 'aa2', source: 'A', target: 'A', label: 'Another self transition' }
      ]
    }
    const first = await layout(diagram)
    // GWT attaches transient object hashes; they are not drawing geometry.
    const geometry = (graph: unknown) => JSON.parse(JSON.stringify(graph, (key, value) => key === '$H' ? undefined : value))
    expect(geometry(await layout(diagram))).toEqual(geometry(first))
    verifyGeometry(first)
    expect(first.edges[0].sections).not.toEqual(first.edges[1].sections)
  })
})
