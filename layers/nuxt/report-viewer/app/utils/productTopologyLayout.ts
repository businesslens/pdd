/**
 * Pure layout helpers for the whole-product "Everything" view.
 *
 * Every resource kind keeps a fixed shelf. Only the order inside a shelf moves,
 * using the barycentre of related resources on the other shelves. Keeping this
 * dependency-free makes the most important topology invariant easy to test.
 */

export interface TopologyLink {
  source: string
  target: string
}

export interface TopologyPoint {
  x: number
  y: number
}

export function topologyAdjacency(edges: readonly TopologyLink[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()
  const link = (source: string, target: string) => {
    adjacency.set(source, new Set([...(adjacency.get(source) ?? []), target]))
  }
  for (const edge of edges) {
    link(edge.source, edge.target)
    link(edge.target, edge.source)
  }
  return adjacency
}

/** A node and everything connected to it by one edge. */
export function topologyNeighbourhood(nodeId: string, edges: readonly TopologyLink[]): Set<string> {
  return new Set([nodeId, ...(topologyAdjacency(edges).get(nodeId) ?? [])])
}

/**
 * Order each shelf by the average normalized position of its neighbours.
 * Alternating sweeps avoid the oscillation produced by sorting every shelf
 * from one stale snapshot. Ties preserve authored order.
 */
export function barycenterOrder(
  rows: readonly (readonly string[])[],
  edges: readonly TopologyLink[],
  passes = 6
): string[][] {
  const adjacency = topologyAdjacency(edges)
  const current = rows.map(row => [...row])
  const positions = new Map<string, number>()
  const refresh = (row: readonly string[]) => {
    row.forEach((id, index) => positions.set(id, (index + 0.5) / row.length))
  }
  current.forEach(refresh)

  for (let pass = 0; pass < passes; pass += 1) {
    const downward = pass % 2 === 0
    const indices = current.map((_, index) => index)
    const sweep = downward ? indices.slice(1) : indices.slice(0, -1).reverse()

    for (const rowIndex of sweep) {
      const row = current[rowIndex]
      if (!row || row.length < 2) continue
      const scored = row.map((id, index) => {
        const own = (index + 0.5) / row.length
        const neighbours = [...(adjacency.get(id) ?? [])]
          .map(other => positions.get(other))
          .filter((value): value is number => value !== undefined)
        const barycentre = neighbours.length
          ? neighbours.reduce((total, value) => total + value, 0) / neighbours.length
          : own
        return { id, barycentre, index }
      })
      scored.sort((left, right) => left.barycentre - right.barycentre || left.index - right.index)
      current[rowIndex] = scored.map(entry => entry.id)
      refresh(current[rowIndex])
    }
  }

  return current
}

export interface StrataLayoutOptions {
  nodeWidth: number
  nodeHeight: number
  gapX: number
  gapY: number
}

export interface StrataLayout {
  positions: Map<string, TopologyPoint>
  rowTops: Map<number, number>
  width: number
  height: number
}

/** Place non-empty shelves on a fixed pitch and center them on the widest. */
export function layoutStrata(
  rows: readonly (readonly string[])[],
  options: StrataLayoutOptions
): StrataLayout {
  const pitchX = options.nodeWidth + options.gapX
  const widest = Math.max(1, ...rows.map(row => row.length))
  const width = widest * pitchX - options.gapX
  const positions = new Map<string, TopologyPoint>()
  const rowTops = new Map<number, number>()
  let y = 0

  rows.forEach((row, rowIndex) => {
    if (!row.length) return
    const rowWidth = row.length * pitchX - options.gapX
    const startX = (width - rowWidth) / 2
    rowTops.set(rowIndex, y)
    row.forEach((id, index) => {
      positions.set(id, { x: startX + index * pitchX, y })
    })
    y += options.nodeHeight + options.gapY
  })

  return {
    positions,
    rowTops,
    width,
    height: Math.max(0, y - options.gapY)
  }
}
