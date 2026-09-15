import type { ReportWorkspace } from './reportWorkspace'
import { topologyRelations } from './topologyRelations'
import type { TopologyBranch } from './topologyProjections'

/**
 * The keys one hop around the focused resources, or `null` when nothing is
 * focused.
 *
 * Focus is a narrowing a resource page hands to a graph: "this one, and what
 * touches it". Every authored relation counts as a hop, and inside a
 * containment tree so does the whole subtree under a focused node, because a
 * focused Interface without its Screens is not the Interface.
 */
export function topologyNeighbourhood(workspace: ReportWorkspace, focus: string[], branches: TopologyBranch[] = []): Set<string> | null {
  if (!focus.length) return null
  const focused = new Set(focus)
  const keys = new Set(focused)
  for (const relation of topologyRelations(workspace)) {
    if (focused.has(relation.source) || focused.has(relation.target)) { keys.add(relation.source); keys.add(relation.target) }
  }
  /* An occurrence answers to its own id and to the resource it draws. */
  const descend = (node: TopologyBranch, included = false) => {
    const inside = included || focused.has(node.id) || (node.resource ? focused.has(node.resource.key) : false)
    if (inside) { keys.add(node.id); if (node.resource) keys.add(node.resource.key) }
    node.children.forEach(child => descend(child, inside))
  }
  branches.forEach(branch => descend(branch))
  return keys
}
