import type { ActingSide, AnyResourceView, EntityFacet, InterfaceView, ReportResourceKind, ReportScenarioType } from './reportWorkspace'
import { entityFacetOf } from './reportWorkspace'

/** Private drawing input. Resource identity is independent of an occurrence. */
export interface DiagramNode {
  id: string
  title: string
  resourceKey?: string
  /** Select local diagram detail without navigating to another resource. */
  inspectionKey?: string
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
  branch?: { id: string, count: number, open: boolean, childrenLabel: string }
  /** The frame this node sits inside. A frame is a node drawn with `group`. */
  parent?: string
  group?: boolean
  /** Named in its container's navigation: a mark on the node, never an edge. */
  navigation?: boolean
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
  /** Drawn lighter and dotted: present, but not the drawing's subject. */
  faint?: boolean
  arrow?: boolean
  inspectionKey?: string
  inspectionLabel?: string
  /** Opens a resource page from the label, where the edge stands for one. */
  resourceKey?: string
  /** Read on hover: what the edge aggregates. */
  note?: string
}

export interface Diagram {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  direction?: 'RIGHT' | 'DOWN'
  quiet?: boolean
  layout?: 'tree'
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
  const nested = diagram.nodes.some(node => node.parent)
  /* A frame's size comes from what it holds; its measured header reserves the
     top band and the least width, so the title never overhangs the contents. */
  const children = (parent: string | undefined): ElkChild[] => diagram.nodes.filter(node => (node.parent || undefined) === parent).map((node) => {
    const size = sizes[`node:${node.id}`]
    if (!node.group) return { id: node.id, ...size }
    return { id: node.id, layoutOptions: {
      'elk.padding': `[top=${(size?.height ?? 0) + 12},left=16,bottom=16,right=16]`,
      'elk.nodeSize.constraints': 'MINIMUM_SIZE',
      'elk.nodeSize.minimum': `(${(size?.width ?? 0) + 32}, ${(size?.height ?? 0) + 28})`
    }, children: children(node.id) }
  })
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
      'elk.randomSeed': '1',
      ...(nested ? { 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' } : {})
    },
    children: children(undefined),
    edges: diagram.edges.map(edge => ({
      id: edge.id, sources: [edge.source], targets: [edge.target],
      labels: edge.label ? [{ id: `label:${edge.id}`, text: edge.label, ...sizes[`edge:${edge.id}`] }] : []
    }))
  }
}

interface ElkChild { id: string, width?: number, height?: number, layoutOptions?: Record<string, string>, children?: ElkChild[] }

export type DiagramLayoutInput = ReturnType<typeof diagramLayoutInput>

/** ELK returns positions relative to the containing node and routes relative to the edge's container; Vue Flow draws in root coordinates. */
export function diagramLayoutResult(diagram: Diagram, result: import('elkjs/lib/elk-api').ElkNode): DiagramLayout {
  const nodes = new Map<string, DiagramPoint & DiagramSize>()
  const routes = new Map<string, Pick<DiagramLayout['edges'][number], 'paths' | 'labelBox'>>()
  function place(container: import('elkjs/lib/elk-api').ElkNode, offset: DiagramPoint) {
    for (const child of container.children ?? []) {
      const position = { x: offset.x + (child.x ?? 0), y: offset.y + (child.y ?? 0) }
      nodes.set(child.id, { ...position, width: child.width ?? 0, height: child.height ?? 0 })
      place(child, position)
    }
  }
  function route(container: import('elkjs/lib/elk-api').ElkNode, offset: DiagramPoint) {
    for (const edge of container.edges ?? []) {
      /* A hierarchical edge is declared at the root but measured from the deepest node holding both ends. */
      const base = (edge.container && nodes.get(edge.container)) || offset
      const label = edge.labels?.[0]
      routes.set(edge.id, {
        paths: edge.sections?.map(section => [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(point => ({ x: point.x + base.x, y: point.y + base.y }))) ?? [],
        labelBox: label ? { x: (label.x ?? 0) + base.x, y: (label.y ?? 0) + base.y, width: label.width ?? 0, height: label.height ?? 0 } : undefined
      })
    }
    for (const child of container.children ?? []) route(child, nodes.get(child.id) ?? offset)
  }
  place(result, { x: 0, y: 0 })
  route(result, { x: 0, y: 0 })
  return { width: result.width ?? 0, height: result.height ?? 0,
    nodes: diagram.nodes.map(node => ({ ...node, ...nodes.get(node.id)! })),
    edges: diagram.edges.map(edge => ({ ...edge, paths: [], ...routes.get(edge.id) })) }
}
