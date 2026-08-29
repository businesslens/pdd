/**
 * Topology-local filtering.
 *
 * A named view decides which semantic graph exists. These filters only narrow
 * that result; they never alter report navigation or invent relationships.
 */
import type { BlrFlowEdge, BlrFlowNode, FlowGraphShape, FlowLabelData } from './flowGraph'
import type { ReportResourceKind } from './reportWorkspace'
import { topologyNeighbourhood } from './productTopologyLayout'

export interface ProductTopologyFilterOptions {
  /** Resource kinds currently visible inside the active topology view. */
  visibleKinds: readonly ReportResourceKind[]
  /** Model resources to focus; every matching occurrence keeps one-hop context. */
  focusResourceIds?: readonly string[]
}

function kindOf(node: BlrFlowNode): ReportResourceKind | null {
  return node.data?.kind ?? null
}

function resourceIdOf(node: BlrFlowNode): string {
  return node.data?.resourceKey ?? ''
}

/**
 * Narrow an already-built named view.
 *
 * Focus is resolved against node ids rather than resource ids because occurrence
 * views may draw the same resource in several contexts. Containment parents are
 * treated as graph neighbours, so focusing a Capability retains its Domain
 * frame. If that frame's kind is hidden, the child is safely detached and
 * keeps its absolute position.
 */
export function filterProductTopologyGraph(
  shape: FlowGraphShape,
  options: ProductTopologyFilterOptions
): FlowGraphShape {
  const visibleKinds = new Set(options.visibleKinds)
  const focusResourceIds = new Set(options.focusResourceIds ?? [])
  const nodesById = new Map(shape.nodes.map(node => [node.id, node]))
  const contextLinks = [
    ...shape.edges.map(edge => ({ source: edge.source, target: edge.target })),
    ...shape.nodes.flatMap(node => node.parentNode && nodesById.has(node.parentNode)
      ? [{ source: node.parentNode, target: node.id }]
      : [])
  ]

  let scopedNodeIds: Set<string> | null = null
  if (focusResourceIds.size) {
    const matches = shape.nodes.filter(node => focusResourceIds.has(resourceIdOf(node)))
    scopedNodeIds = new Set<string>()
    for (const match of matches) {
      for (const id of topologyNeighbourhood(match.id, contextLinks)) scopedNodeIds.add(id)
    }
  }

  const bodyNodes = shape.nodes.filter(node => node.type !== 'blr-label')
  const keptBody = bodyNodes.filter((node) => {
    const kind = kindOf(node)
    return Boolean(kind && visibleKinds.has(kind) && (!scopedNodeIds || scopedNodeIds.has(node.id)))
  })
  const keptBodyIds = new Set(keptBody.map(node => node.id))

  const nodes: BlrFlowNode[] = keptBody.map((node) => {
    if (!node.parentNode || keptBodyIds.has(node.parentNode)) return node
    const parent = nodesById.get(node.parentNode)
    return {
      ...node,
      parentNode: undefined,
      extent: undefined,
      position: parent
        ? { x: parent.position.x + node.position.x, y: parent.position.y + node.position.y }
        : node.position
    }
  })

  for (const label of shape.nodes.filter(node => node.type === 'blr-label')) {
    const kind = kindOf(label)
    if (!kind || !visibleKinds.has(kind)) continue
    const count = keptBody.filter(node => kindOf(node) === kind).length
    if (!count) continue
    nodes.push({
      ...label,
      data: { ...(label.data as FlowLabelData), count }
    })
  }

  const keptIds = new Set(nodes.map(node => node.id))
  const edges: BlrFlowEdge[] = shape.edges.filter(edge => keptIds.has(edge.source) && keptIds.has(edge.target))
  return { nodes, edges }
}
