import type { Diagram, DiagramLayout } from './diagram'

/** Use measured layout bounds even before Vue Flow has observed new nodes. */
export function diagramBounds(diagram: Pick<DiagramLayout, 'nodes'>) {
  if (!diagram.nodes.length) return { x: 0, y: 0, width: 0, height: 0 }
  const left = Math.min(...diagram.nodes.map(node => node.x))
  const top = Math.min(...diagram.nodes.map(node => node.y))
  const right = Math.max(...diagram.nodes.map(node => node.x + node.width))
  const bottom = Math.max(...diagram.nodes.map(node => node.y + node.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** Highlight the drawing's context without changing its visible set or layout. */
export function diagramContext(diagram: Pick<Diagram, 'nodes' | 'edges' | 'layout'>, activeId: string | null) {
  const active = diagram.nodes.find(node => node.id === activeId)
  if (!active) return null
  const occurrences = new Set(diagram.nodes.filter(node => node.id === active.id
    || (diagram.layout === 'tree' && active.resourceKey && node.resourceKey === active.resourceKey)).map(node => node.id))
  const nodes = new Set(occurrences)
  const edges = new Set<string>()

  if (diagram.layout !== 'tree') {
    /* A frame stands for what it holds: hovering it reads every edge in or out of the contents. */
    const parents = new Map(diagram.nodes.map(node => [node.id, node.parent]))
    const ancestors = (id: string) => { const path: string[] = []; for (let parent = parents.get(id); parent; parent = parents.get(parent)) path.push(parent); return path }
    for (const node of diagram.nodes) if (ancestors(node.id).includes(active.id)) occurrences.add(node.id)
    for (const id of occurrences) nodes.add(id)
    for (const edge of diagram.edges) {
      if (!occurrences.has(edge.source) && !occurrences.has(edge.target)) continue
      nodes.add(edge.source)
      nodes.add(edge.target)
      edges.add(edge.id)
    }
    /* A frame never dims around a highlighted node inside it. */
    for (const id of [...nodes]) ancestors(id).forEach(parent => nodes.add(parent))
    return { nodes, edges, occurrences }
  }

  const incoming = new Map<string, typeof diagram.edges>()
  const outgoing = new Map<string, typeof diagram.edges>()
  for (const edge of diagram.edges) {
    if (!incoming.has(edge.target)) incoming.set(edge.target, [])
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
    incoming.get(edge.target)!.push(edge)
    outgoing.get(edge.source)!.push(edge)
  }
  // Walk up and down separately: an ancestor must not pull in sibling branches.
  for (const direction of ['source', 'target'] as const) {
    const adjacency = direction === 'source' ? incoming : outgoing
    const pending = [...occurrences]
    const visited = new Set<string>()
    while (pending.length) {
      const id = pending.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      for (const edge of adjacency.get(id) ?? []) {
        edges.add(edge.id)
        nodes.add(edge[direction])
        pending.push(edge[direction])
      }
    }
  }
  return { nodes, edges, occurrences }
}

/**
 * Highlight an edge's context the way a node's is: the edge and the nodes it
 * joins stay lit, everything else dims. Only this edge: another edge naming
 * the same Capability is another change, and lighting it would answer a
 * question the reader did not ask of this one.
 */
export function diagramEdgeContext(diagram: Pick<Diagram, 'nodes' | 'edges'>, activeId: string | null) {
  const active = diagram.edges.find(edge => edge.id === activeId)
  if (!active) return null
  const nodes = new Set([active.source, active.target])
  /* A frame never dims around a lit node inside it. */
  const parents = new Map(diagram.nodes.map(node => [node.id, node.parent]))
  for (const id of [...nodes]) for (let parent = parents.get(id); parent; parent = parents.get(parent)) nodes.add(parent)
  return { nodes, edges: new Set([active.id]), occurrences: new Set<string>() }
}
