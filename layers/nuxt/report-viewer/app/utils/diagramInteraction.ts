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
    for (const edge of diagram.edges) {
      if (edge.source !== active.id && edge.target !== active.id) continue
      nodes.add(edge.source)
      nodes.add(edge.target)
      edges.add(edge.id)
    }
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
