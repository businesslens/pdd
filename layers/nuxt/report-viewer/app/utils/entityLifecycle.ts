/** The Entity's state machine, composed from everything the model holds. */
import type { EntityArcView, EntityStateView, EntityView, ReportWorkspace } from './reportWorkspace'
import { resolveResource } from './reportWorkspace'
import type { Diagram, DiagramNode, DiagramEdge, DiagramEdgeBadge } from './diagram'

interface LifecycleState { name: string, reached: boolean, terminal: 'start' | 'end' | null }

export const LIFECYCLE_START = 'blr-lifecycle-start'
export const LIFECYCLE_END = 'blr-lifecycle-end'

function stateNodeId(entityId: string, state: string): string {
  return `blr-state:${entityId}:${state}`
}

function stateNode(entity: EntityView, data: LifecycleState): DiagramNode {
  return {
    id: data.terminal ? (data.terminal === 'start' ? LIFECYCLE_START : LIFECYCLE_END) : stateNodeId(entity.id, data.name),
    title: data.terminal === 'start' ? 'Created' : data.terminal === 'end' ? 'Removed' : data.name,
    ...(!data.terminal ? { inspectionKey: stateNodeId(entity.id, data.name) } : {}),
    unreached: !data.reached,
    ...(data.terminal ? { terminal: data.terminal } : {})
  }
}

/*
 * A change is drawn by what makes it — its Capabilities. The Rules that govern
 * it are read on the Steps they select, and so on those Steps' Scenarios and
 * Capabilities, never on the transition: a Rule governs Steps, and an arc is
 * only where some of them land. A change no one may make is the exception: no
 * Capability makes it, so its forbidding Rule is all there is to draw.
 */
export interface LifecycleArcLabel {
  /** The Capabilities whose Steps draw the arc, by title. */
  capabilities: string[]
  /** "also creates Refund" — what the same Steps do to other things. */
  coEffects: string[]
  forbidden: boolean
}

/** The words an arc carries, shared by the canvas edge and the list under it. */
export function lifecycleArcLabel(workspace: ReportWorkspace, entity: EntityView, arcIndex: number): LifecycleArcLabel {
  const arc = entity.arcs[arcIndex]!
  const titleOf = (kind: 'capability' | 'entity', id: string) => resolveResource(workspace, kind, id)?.title ?? id
  return {
    capabilities: arc.capabilityIds.map(id => titleOf('capability', id)),
    coEffects: arc.coEffects.map(co => `also ${co.effect} ${titleOf('entity', co.entityId)}${co.to ? ` → ${co.to}` : ''}`),
    forbidden: arc.forbiddenByRuleIds.length > 0
  }
}

/** A change no one may make is marked, not attributed: no Capability draws it. */
const FORBIDDEN_BADGE: DiagramEdgeBadge = { icon: 'i-lucide-ban', text: 'Forbidden' }

/** The canvas edge drawn for one arc, so the list under the machine can tell a listed arc from a drawn one. */
export function lifecycleArcEdgeId(entityId: string, arc: Pick<EntityArcView, 'key'>): string {
  return `blr-arc:${entityId}:${arc.key}`
}

export function lifecycleArcTitle(arc: Pick<EntityArcView, 'effect' | 'from' | 'to'>): string {
  if (arc.effect === 'creates') return `Created → ${arc.to}`
  if (arc.effect === 'removes') return `${arc.from} → Removed`
  return arc.to ? `${arc.from} → ${arc.to}` : 'Information changed'
}

export interface LifecycleRowGroup<T extends EntityArcView = EntityArcView> {
  key: string
  title: string
  state?: EntityStateView
  explanation?: string
  arcs: T[]
}

/** A change belongs to its starting State exactly once. Creation is not a State. */
export function groupEntityLifecycle<T extends EntityArcView>(entity: Pick<EntityView, 'id' | 'states'>, arcs: T[]): LifecycleRowGroup<T>[] {
  const states: LifecycleRowGroup<T>[] = entity.states.map(state => ({
    key: stateNodeId(entity.id, state.name), title: state.name, state, arcs: []
  }))
  const byName = new Map(states.map(group => [group.title, group]))
  const creation: LifecycleRowGroup<T> = { key: `blr-creation:${entity.id}`, title: 'Creation', explanation: 'Creation has no starting state.', arcs: [] }
  const unspecified: LifecycleRowGroup<T> = { key: `blr-unspecified:${entity.id}`, title: 'No specified state', explanation: 'These changes do not name a starting state.', arcs: [] }
  const unresolved: LifecycleRowGroup<T> = { key: `blr-unresolved:${entity.id}`, title: 'Unknown starting state', explanation: 'These changes name a starting state that is not declared in this Entity.', arcs: [] }
  for (const arc of arcs) {
    const group = arc.effect === 'creates' ? creation : arc.from ? byName.get(arc.from) ?? unresolved : unspecified
    group.arcs.push(arc)
  }
  return [creation, ...states, unspecified, unresolved].filter(group => group.state || group.arcs.length)
}

/** Build the placed graph for one Entity's composed lifecycle. */
export function buildEntityLifecycle(workspace: ReportWorkspace, entity: EntityView): Diagram {
  const nodes: DiagramNode[] = entity.states.map((state) => stateNode(entity, {
    name: state.name,
    reached: state.reached,
    terminal: null
  }))
  const present = new Set(nodes.map(node => node.id))
  const edges: DiagramEdge[] = []
  let hasStart = false
  let hasEnd = false

  /* The canvas carries a short label; selecting it reads the complete change. */
  const caption = (label: LifecycleArcLabel): string => {
    if (label.forbidden) return 'forbidden'
    const [first = '', ...rest] = label.capabilities
    return rest.length ? `${first} +${rest.length}` : first
  }
  /* The same words as a badge wearing the Capability's mark. */
  const badges = (label: LifecycleArcLabel): DiagramEdgeBadge[] => {
    if (label.forbidden) return [FORBIDDEN_BADGE]
    const [first, ...rest] = label.capabilities
    return first ? [{ kind: 'capability', text: rest.length ? `${first} +${rest.length}` : first }] : []
  }
  entity.arcs.forEach((arc, index) => {
    const label = lifecycleArcLabel(workspace, entity, index)
    const source = arc.effect === 'creates' ? LIFECYCLE_START : stateNodeId(entity.id, arc.from)
    const target = arc.effect === 'removes' ? LIFECYCLE_END : stateNodeId(entity.id, arc.to)
    /* An information change is an arc from a state to itself only when the Step says which state; with no state it is not drawn — it is on the Capability's own page. */
    if (arc.effect === 'changes' && !arc.to) return
    /* Skip before claiming a terminal: an arc whose state does not resolve draws no edge, and flagging Start or End for it would leave a node the machine never reaches. */
    if ((source !== LIFECYCLE_START && !present.has(source)) || (target !== LIFECYCLE_END && !present.has(target))) return
    if (arc.effect === 'creates') hasStart = true
    if (arc.effect === 'removes') hasEnd = true
    edges.push({
      source, target, label: caption(label), badges: badges(label),
      id: lifecycleArcEdgeId(entity.id, arc),
      inspectionKey: lifecycleArcEdgeId(entity.id, arc),
      inspectionLabel: lifecycleArcTitle(arc),
      forbidden: label.forbidden
    })
  })

  /* Prohibitions are arcs no Step draws; they still have a place on the machine. */
  for (const prohibition of entity.prohibitions) {
    if (!prohibition.from && !prohibition.to) continue
    if (prohibition.effect === 'reads') continue
    const source = prohibition.effect === 'creates' ? LIFECYCLE_START : prohibition.from ? stateNodeId(entity.id, prohibition.from) : ''
    const target = prohibition.effect === 'removes' ? LIFECYCLE_END : prohibition.to ? stateNodeId(entity.id, prohibition.to) : ''
    if (!source || !target) continue
    if ((source !== LIFECYCLE_START && !present.has(source)) || (target !== LIFECYCLE_END && !present.has(target))) continue
    if (edges.some(edge => edge.source === source && edge.target === target)) continue
    if (source === LIFECYCLE_START) hasStart = true
    if (target === LIFECYCLE_END) hasEnd = true
    edges.push({
      source, target, label: 'forbidden', badges: [FORBIDDEN_BADGE],
      id: `blr-forbidden:${entity.id}:${prohibition.ruleId}:${prohibition.from}:${prohibition.to}`,
      inspectionKey: `blr-forbidden:${entity.id}:${prohibition.ruleId}:${prohibition.from}:${prohibition.to}`,
      inspectionLabel: `Forbidden: ${prohibition.from || 'Created'} → ${prohibition.to || 'Removed'}`,
      forbidden: true
    })
  }

  if (hasStart) {
    nodes.unshift(stateNode(entity, {
      name: '', reached: true, terminal: 'start'
    }))
  }
  if (hasEnd) {
    nodes.push(stateNode(entity, {
      name: '', reached: true, terminal: 'end'
    }))
  }

  /* Top to bottom: a lifecycle reads down the page at full size, where a row of states shrinks to fit the width and takes its labels with it. */
  return { nodes, edges, direction: 'DOWN' }
}
