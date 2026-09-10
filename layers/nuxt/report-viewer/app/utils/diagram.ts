import type { ActingSide, AnyResourceView, EntityFacet, InterfaceView, ReportResourceKind, ReportScenarioType } from './reportWorkspace'
import { entityFacetOf } from './reportWorkspace'

/** Private drawing input. Resource identity is independent of an occurrence. */
export interface DiagramNode {
  id: string
  title: string
  resourceKey?: string
  note?: string
  description?: string
  colorSlot?: number
  terminal?: 'start' | 'end'
  unreached?: boolean
  kind?: ReportResourceKind
  entityFacet?: EntityFacet | null
  acts?: ActingSide | null
  interfaceType?: InterfaceView['interfaceType'] | null
  scenarioType?: ReportScenarioType | null
  branch?: { id: string, count: number, open: boolean }
}

export function diagramResource(resource: AnyResourceView): DiagramNode {
  return { id: resource.key, resourceKey: resource.key, title: resource.title, kind: resource.kind,
    entityFacet: entityFacetOf(resource), acts: resource.kind === 'entity' ? resource.acts : null,
    interfaceType: resource.kind === 'interface' ? resource.interfaceType : null,
    scenarioType: resource.kind === 'capability-scenario' || resource.kind === 'journey-scenario' ? resource.scenarioType : null }
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  label: string
  forbidden?: boolean
  arrow?: boolean
}

export interface Diagram {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  direction?: 'RIGHT' | 'DOWN'
  quiet?: boolean
  layout?: 'tree'
  totalNodes?: number
}

export interface DiagramSize { width: number, height: number }
export interface DiagramPoint { x: number, y: number }
export interface DiagramLayout {
  width: number
  height: number
  nodes: Array<DiagramNode & DiagramSize & DiagramPoint>
  edges: Array<DiagramEdge & { paths: DiagramPoint[][], labelBox?: DiagramSize & DiagramPoint }>
}

/** The browser supplies real text sizes; ELK owns both routes and label placement. */
export function diagramLayoutInput(diagram: Diagram, sizes: Record<string, DiagramSize>) {
  return {
    id: 'diagram',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': diagram.direction ?? 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.aspectRatio': '1.5',
      'elk.spacing.nodeNode': '44',
      'elk.layered.spacing.nodeNodeBetweenLayers': '48',
      'elk.spacing.edgeNode': '24',
      'elk.spacing.edgeEdge': '18',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '24',
      'elk.edgeLabels.inline': 'false',
      'elk.padding': '[top=24,left=24,bottom=24,right=24]',
      'elk.randomSeed': '1'
    },
    children: diagram.nodes.map(node => ({ id: node.id, ...sizes[`node:${node.id}`] })),
    edges: diagram.edges.map(edge => ({
      id: edge.id, sources: [edge.source], targets: [edge.target],
      labels: edge.label ? [{ id: `label:${edge.id}`, text: edge.label, ...sizes[`edge:${edge.id}`] }] : []
    }))
  }
}

export type DiagramLayoutInput = ReturnType<typeof diagramLayoutInput>

/** ELK may return routes inside their containing group; Vue Flow draws in root coordinates. */
export function diagramLayoutResult(diagram: Diagram, result: import('elkjs/lib/elk-api').ElkNode): DiagramLayout {
  const nodes = new Map<string, DiagramPoint & DiagramSize>()
  const routes = new Map<string, Pick<DiagramLayout['edges'][number], 'paths' | 'labelBox'>>()
  function visit(container: import('elkjs/lib/elk-api').ElkNode, offset: DiagramPoint) {
    for (const child of container.children ?? []) {
      const position = { x: offset.x + (child.x ?? 0), y: offset.y + (child.y ?? 0) }
      nodes.set(child.id, { ...position, width: child.width ?? 0, height: child.height ?? 0 })
      visit(child, position)
    }
    for (const edge of container.edges ?? []) {
      const label = edge.labels?.[0]
      routes.set(edge.id, {
        paths: edge.sections?.map(section => [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(point => ({ x: point.x + offset.x, y: point.y + offset.y }))) ?? [],
        labelBox: label ? { x: (label.x ?? 0) + offset.x, y: (label.y ?? 0) + offset.y, width: label.width ?? 0, height: label.height ?? 0 } : undefined
      })
    }
  }
  visit(result, { x: 0, y: 0 })
  return { width: result.width ?? 0, height: result.height ?? 0,
    nodes: diagram.nodes.map(node => ({ ...node, ...nodes.get(node.id)! })),
    edges: diagram.edges.map(edge => ({ ...edge, paths: [], ...routes.get(edge.id) })) }
}
