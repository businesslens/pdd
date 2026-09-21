import type { Diagram, DiagramEdge, DiagramNode } from './diagram'
import { diagramResource } from './diagram'
import type { TopologyBranch, UiMap } from './topologyProjections'
import type { TopologyReading } from './topologyState'
import { topologyGroupOpen } from './topologyState'
import { ENTITY_KIND_META } from './reportWorkspace'

/** Outside the Product: where entry points arrive from. */
export const UI_MAP_ENTRY = 'entry'

export function branchChildrenLabel(children: TopologyBranch[]): string {
  const kind = children[0]?.resource?.kind
  if (!kind || children.some(child => child.resource?.kind !== kind)) return 'branches'
  return children.length === 1 ? ENTITY_KIND_META[kind].label : ENTITY_KIND_META[kind].plural
}

/** Every place that holds another, whether open or closed. */
export function uiMapGroupIds(places: TopologyBranch[]): string[] {
  return places.flatMap(place => place.children.length ? [place.id, ...uiMapGroupIds(place.children)] : [])
}

/**
 * The containment tree gives the frames and the moves give the arrows. A
 * closed frame stands in for everything inside it: an arrow into a hidden
 * Screen lands on the frame, once per Capability, still naming every Scenario.
 */
export function uiMapDiagram(places: TopologyBranch[], map: Pick<UiMap, 'moves' | 'entries'>, reading: TopologyReading): Diagram {
  const nodes: DiagramNode[] = []
  /* The node that draws each place: itself, or the closed frame above it. */
  const stands = new Map<string, string>()
  const visit = (place: TopologyBranch, parent?: string, closedBy?: string) => {
    const resource = place.resource
    if (!resource) return
    if (closedBy) {
      stands.set(resource.key, closedBy)
      place.children.forEach(child => visit(child, undefined, closedBy))
      return
    }
    const open = topologyGroupOpen(reading, place.id, place.children.length)
    nodes.push({ ...diagramResource(resource), parent, group: open && place.children.length > 0 || undefined,
      navigation: resource.kind === 'screen' && resource.alwaysReachable || undefined,
      branch: place.children.length ? { id: place.id, count: place.children.length, open, childrenLabel: branchChildrenLabel(place.children) } : undefined })
    stands.set(resource.key, resource.key)
    place.children.forEach(child => visit(child, resource.key, open ? undefined : resource.key))
  }
  places.forEach(place => visit(place))

  const edges = new Map<string, DiagramEdge & { scenarios: Set<string> }>()
  for (const move of map.moves) {
    const source = stands.get(move.from.key), target = stands.get(move.to.key)
    if (!source || !target || source === target) continue
    const id = `${source}->${target}:${move.capabilityId}`
    const edge = edges.get(id) ?? { id, source, target, label: move.capability?.title ?? move.capabilityId, resourceKey: move.capability?.key, scenarios: new Set<string>() }
    for (const scenario of move.scenarios) edge.scenarios.add(scenario.title)
    edges.set(id, edge)
  }
  const entries = new Map<string, { target: string, paths: Set<string> }>()
  for (const entry of map.entries) {
    const target = stands.get(entry.place.key)
    if (!target) continue
    const item = entries.get(target) ?? { target, paths: new Set<string>() }
    entry.paths.forEach(path => item.paths.add(path))
    entries.set(target, item)
  }
  if (entries.size) nodes.unshift({ id: UI_MAP_ENTRY, title: 'Entry', terminal: 'start', description: 'Outside the Product. Entry points arrive from here.' })
  return { direction: 'RIGHT', nodes, edges: [
    ...[...entries.values()].map(({ target, paths }) => ({ id: `${UI_MAP_ENTRY}->${target}`, source: UI_MAP_ENTRY, target, label: [...paths].join(' · '), faint: true,
      note: `Entry ${paths.size === 1 ? 'point' : 'points'} from outside: ${[...paths].join(', ')}` })),
    ...[...edges.values()].map(({ scenarios, ...edge }) => ({ ...edge,
      note: `${scenarios.size} ${scenarios.size === 1 ? 'Scenario walks' : 'Scenarios walk'} this move: ${[...scenarios].join(', ')}` }))
  ] }
}
