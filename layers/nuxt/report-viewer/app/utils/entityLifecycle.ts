/**
 * The Entity's state machine, composed from everything the model holds.
 *
 * Nothing on the Entity says how it moves. Every arc here is a Step somewhere
 * that creates, moves or removes the thing; the label is the Capability those
 * Steps belong to; a Rule with grants on that operation marks it restricted, a
 * Rule closing it draws it forbidden; and a Step that changes two things at once
 * writes its co-effect on the arc — the one place a cross-entity lifecycle is
 * visible without being authored twice.
 *
 * States nothing produces are drawn as unreached rather than dropped: the answer
 * to "a reader cannot count the transitions" is not "never draw the machine".
 */
import { MarkerType, Position } from '@vue-flow/core'
import type { EntityView, ReportWorkspace } from './reportWorkspace'
import { resolveResource } from './reportWorkspace'
import type { BlrFlowEdge, BlrFlowNode, FlowGraphShape, FlowStateData } from './flowGraph'
import { layoutFlow } from './flowGraph'

export const LIFECYCLE_STATE_WIDTH = 168
export const LIFECYCLE_STATE_HEIGHT = 44
export const LIFECYCLE_TERMINAL_SIZE = 18

export const LIFECYCLE_START = 'blr-lifecycle-start'
export const LIFECYCLE_END = 'blr-lifecycle-end'

function stateNodeId(entityId: string, state: string): string {
  return `blr-state:${entityId}:${state}`
}

function stateNode(entity: EntityView, data: FlowStateData, size: { width: number, height: number }): BlrFlowNode {
  return {
    id: data.terminal ? (data.terminal === 'start' ? LIFECYCLE_START : LIFECYCLE_END) : stateNodeId(entity.id, data.name),
    type: 'blr-state',
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
    draggable: false,
    connectable: false,
    selectable: false,
    focusable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { width: `${size.width}px`, height: `${size.height}px` },
    data
  }
}

export interface LifecycleArcLabel {
  /** The Capabilities whose Steps draw the arc, by title. */
  capabilities: string[]
  /** "owner only", "Store admin only" — from the Rules with grants selecting it. */
  restriction: string
  /** "also creates Refund" — what the same Steps do to other things. */
  coEffects: string[]
  forbidden: boolean
}

/** The words an arc carries, shared by the canvas edge and the list under it. */
export function lifecycleArcLabel(workspace: ReportWorkspace, entity: EntityView, arcIndex: number): LifecycleArcLabel {
  const arc = entity.arcs[arcIndex]!
  const titleOf = (kind: 'capability' | 'entity' | 'rule', id: string) => resolveResource(workspace, kind, id)?.title ?? id
  const restrictions = arc.ruleIds
    .map(id => resolveResource(workspace, 'rule', id))
    .flatMap(rule => rule?.kind === 'rule' ? rule.grants.map(grant => grant.who) : [])
  return {
    capabilities: arc.capabilityIds.map(id => titleOf('capability', id)),
    restriction: restrictions.length ? `${[...new Set(restrictions)].join(' or ')} only` : '',
    coEffects: arc.coEffects.map(co => `also ${co.effect} ${titleOf('entity', co.entityId)}${co.to ? ` → ${co.to}` : ''}`),
    forbidden: arc.forbiddenByRuleIds.length > 0
  }
}

/** Build the placed graph for one Entity's composed lifecycle. */
export function buildEntityLifecycle(workspace: ReportWorkspace, entity: EntityView): FlowGraphShape {
  const nodes: BlrFlowNode[] = entity.states.map((state, index) => stateNode(entity, {
    resourceKey: '',
    resourceId: entity.id,
    kind: 'entity',
    name: state.name,
    reached: state.reached,
    initial: index === 0,
    terminal: null
  }, { width: LIFECYCLE_STATE_WIDTH, height: LIFECYCLE_STATE_HEIGHT }))
  const present = new Set(nodes.map(node => node.id))
  const edges: BlrFlowEdge[] = []
  let hasStart = false
  let hasEnd = false

  entity.arcs.forEach((arc, index) => {
    const label = lifecycleArcLabel(workspace, entity, index)
    const parts = [label.capabilities.join(', '), label.restriction, ...label.coEffects].filter(Boolean)
    const source = arc.effect === 'creates' ? LIFECYCLE_START : stateNodeId(entity.id, arc.from)
    const target = arc.effect === 'removes' ? LIFECYCLE_END : stateNodeId(entity.id, arc.to)
    /* An information change is an arc from a state to itself only when the
       Step says which state; with no state it is not drawn — it is on the
       Capability's own page. */
    if (arc.effect === 'changes' && !arc.to) return
    if (arc.effect === 'creates') hasStart = true
    if (arc.effect === 'removes') hasEnd = true
    if ((source !== LIFECYCLE_START && !present.has(source)) || (target !== LIFECYCLE_END && !present.has(target))) return
    edges.push({
      id: `blr-arc:${entity.id}:${arc.key}`,
      source,
      target,
      type: source === target ? 'blr-self' : 'smoothstep',
      label: label.forbidden ? `forbidden · ${parts.join(' · ')}` : parts.join(' · '),
      markerEnd: MarkerType.ArrowClosed,
      animated: false,
      class: label.forbidden ? 'blr-arc--forbidden' : label.restriction ? 'blr-arc--restricted' : undefined
    })
  })

  /* Prohibitions are arcs no Step draws; they still have a place on the machine. */
  for (const prohibition of entity.prohibitions) {
    if (!prohibition.from && !prohibition.to) continue
    if (prohibition.effect === 'reads') continue
    const source = prohibition.effect === 'creates' ? LIFECYCLE_START : prohibition.from ? stateNodeId(entity.id, prohibition.from) : ''
    const target = prohibition.effect === 'removes' ? LIFECYCLE_END : prohibition.to ? stateNodeId(entity.id, prohibition.to) : ''
    if (!source || !target) continue
    if (edges.some(edge => edge.source === source && edge.target === target)) continue
    if (source === LIFECYCLE_START) hasStart = true
    if (target === LIFECYCLE_END) hasEnd = true
    const rule = resolveResource(workspace, 'rule', prohibition.ruleId)
    edges.push({
      id: `blr-forbidden:${entity.id}:${prohibition.ruleId}:${prohibition.from}:${prohibition.to}`,
      source,
      target,
      type: source === target ? 'blr-self' : 'smoothstep',
      label: `forbidden · ${rule?.title ?? prohibition.ruleId}`,
      markerEnd: MarkerType.ArrowClosed,
      class: 'blr-arc--forbidden'
    })
  }

  if (hasStart) {
    nodes.unshift(stateNode(entity, {
      resourceKey: '', resourceId: entity.id, kind: 'entity', name: '', reached: true, initial: false, terminal: 'start'
    }, { width: LIFECYCLE_TERMINAL_SIZE, height: LIFECYCLE_TERMINAL_SIZE }))
  }
  if (hasEnd) {
    nodes.push(stateNode(entity, {
      resourceKey: '', resourceId: entity.id, kind: 'entity', name: '', reached: true, initial: false, terminal: 'end'
    }, { width: LIFECYCLE_TERMINAL_SIZE, height: LIFECYCLE_TERMINAL_SIZE }))
  }

  return layoutFlow({ nodes, edges }, { ranksep: 96, nodesep: 32 })
}
