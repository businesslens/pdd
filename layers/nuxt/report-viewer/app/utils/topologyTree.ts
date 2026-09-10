import type { DiagramPoint, DiagramSize } from './diagram'

export interface TopologyTreeItem { id: string, children: TopologyTreeItem[] }
export interface TopologyTreePosition extends DiagramPoint, DiagramSize { id: string, depth: number }

/**
 * The reference Tree grammar: parents above children, shared orthogonal buses.
 * Subtree contours reserve measured text space without giving an empty branch
 * the width of its deepest sibling. Sibling order remains the model's order.
 */
export function layoutTopologyTree(root: TopologyTreeItem, sizes: Record<string, DiagramSize>) {
  const gap = 24
  const tierGap = 76
  const padding = 24
  type Subtree = { positions: Array<{ id: string, x: number, depth: number }>, left: number[], right: number[] }
  function place(item: TopologyTreeItem): Subtree {
    const children: Array<{ tree: Subtree, shift: number }> = []
    const left: number[] = [], right: number[] = []
    for (const child of item.children) {
      const tree = place(child)
      const shift = children.length ? Math.max(...tree.left.map((edge, depth) => right[depth] === undefined ? -Infinity : right[depth]! + gap - edge)) : 0
      children.push({ tree, shift })
      tree.left.forEach((edge, depth) => { left[depth] = Math.min(left[depth] ?? Infinity, edge + shift) })
      tree.right.forEach((edge, depth) => { right[depth] = Math.max(right[depth] ?? -Infinity, edge + shift) })
    }
    const center = children.length ? (children[0]!.shift + children.at(-1)!.shift) / 2 : 0
    return {
      positions: [{ id: item.id, x: 0, depth: 0 }, ...children.flatMap(({ tree, shift }) => tree.positions.map(node => ({ ...node, x: node.x + shift - center, depth: node.depth + 1 })))],
      left: [-sizes[item.id]!.width / 2, ...left.map(edge => edge - center)],
      right: [sizes[item.id]!.width / 2, ...right.map(edge => edge - center)]
    }
  }
  const tree = place(root)
  const heights: number[] = []
  for (const node of tree.positions) heights[node.depth] = Math.max(heights[node.depth] ?? 0, sizes[node.id]!.height)
  const tops: number[] = []
  for (let depth = 0; depth < heights.length; depth++) tops[depth] = depth ? tops[depth - 1]! + heights[depth - 1]! + tierGap : padding
  const min = Math.min(...tree.left), max = Math.max(...tree.right)
  const nodes: TopologyTreePosition[] = tree.positions.map(node => ({ ...node, ...sizes[node.id]!, x: node.x - sizes[node.id]!.width / 2 - min + padding, y: tops[node.depth]! }))
  const byId = new Map(nodes.map(node => [node.id, node]))
  const branches: Array<{ source: string, stem: DiagramPoint[], bus: DiagramPoint[], children: Array<{ target: string, drop: DiagramPoint[], points: DiagramPoint[] }> }> = []
  function connect(item: TopologyTreeItem) {
    if (!item.children.length) return
    const node = byId.get(item.id)!
    const start = { x: node.x + node.width / 2, y: node.y + node.height }
    const busY = node.y + heights[node.depth]! + tierGap / 2
    const children = item.children.map(child => {
      const target = byId.get(child.id)!
      const end = { x: target.x + target.width / 2, y: target.y }
      const turn = { x: end.x, y: busY }
      return { target: child.id, drop: [turn, end], points: [start, { x: start.x, y: busY }, turn, end] }
    })
    branches.push({ source: item.id, stem: [start, { x: start.x, y: busY }], bus: [children[0]!.drop[0]!, children.at(-1)!.drop[0]!], children })
    item.children.forEach(connect)
  }
  connect(root)
  return { width: max - min + padding * 2, height: tops.at(-1)! + heights.at(-1)! + padding, nodes, branches }
}
