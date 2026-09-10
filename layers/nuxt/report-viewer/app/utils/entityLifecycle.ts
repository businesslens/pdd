/** The Entity's state machine, composed from everything the model holds. */
import type { EntityArcView, EntityView, ReportWorkspace } from './reportWorkspace'
import { resolveResource } from './reportWorkspace'
import type { Diagram, DiagramNode, DiagramEdge } from './diagram'

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
    unreached: !data.reached,
    ...(data.terminal ? { terminal: data.terminal } : {})
  }
}

/** One Rule with grants selecting an arc, read the way the Rule's own page reads it. */
export interface LifecycleArcRule {
  id: string
  title: string
  /** Each grant as a full sentence, its `when` conditions included — never the bare who, which reads "the Shopper" where the Rule says "the Shopper while Pending". */
  grants: string[]
}

export interface LifecycleArcLabel {
  /** The Capabilities whose Steps draw the arc, by title. */
  capabilities: string[]
  /** Every Rule with grants selecting the arc, each kept apart. */
  rules: LifecycleArcRule[]
  /** "also creates Refund" — what the same Steps do to other things. */
  coEffects: string[]
  forbidden: boolean
}

/** The words an arc carries, shared by the canvas edge and the list under it. */
export function lifecycleArcLabel(workspace: ReportWorkspace, entity: EntityView, arcIndex: number): LifecycleArcLabel {
  const arc = entity.arcs[arcIndex]!
  const titleOf = (kind: 'capability' | 'entity' | 'rule', id: string) => resolveResource(workspace, kind, id)?.title ?? id
  const rules = arc.ruleIds.flatMap((id) => {
    const rule = resolveResource(workspace, 'rule', id)
    return rule?.kind === 'rule' ? [{ id, title: rule.title, grants: rule.grants.map(grant => grant.sentence) }] : []
  })
  return {
    capabilities: arc.capabilityIds.map(id => titleOf('capability', id)),
    rules,
    coEffects: arc.coEffects.map(co => `also ${co.effect} ${titleOf('entity', co.entityId)}${co.to ? ` → ${co.to}` : ''}`),
    forbidden: arc.forbiddenByRuleIds.length > 0
  }
}

/** The one word the canvas carries for a restriction, and how many Rules stand behind it when more than one does. */
export function lifecycleRestrictionMarker(label: LifecycleArcLabel): string {
  if (!label.rules.length) return ''
  return label.rules.length > 1 ? `restricted by ${label.rules.length} Rules` : 'restricted'
}

/** The canvas edge drawn for one arc, so the list under the machine can tell a listed arc from a drawn one. */
export function lifecycleArcEdgeId(entityId: string, arc: Pick<EntityArcView, 'key'>): string {
  return `blr-arc:${entityId}:${arc.key}`
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

  /* The canvas carries the Capability and one word for the Rule's presence; the sentence — who may, and what else the Step does — is the list under it. */
  const caption = (label: LifecycleArcLabel): string => {
    if (label.forbidden) return 'forbidden'
    const [first = '', ...rest] = label.capabilities
    const capabilities = rest.length ? `${first} +${rest.length}` : first
    const marker = lifecycleRestrictionMarker(label)
    return marker ? `${capabilities} · ${marker}` : capabilities
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
      source, target, label: caption(label),
      id: lifecycleArcEdgeId(entity.id, arc),
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
      source, target, label: 'forbidden',
      id: `blr-forbidden:${entity.id}:${prohibition.ruleId}:${prohibition.from}:${prohibition.to}`,
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
