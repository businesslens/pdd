/**
 * The shared Vue Flow foundation for the report designs on audition.
 *
 * One node vocabulary, one relation vocabulary, one layout: every design draws
 * its graphs from here so the boxes read the same everywhere and a comparison
 * between designs is a comparison of information architecture, not of graph
 * styling. Relation verbs are fixed here for the same reason — an edge between
 * the same two entities must say the same thing in every design.
 *
 * Layout is @dagrejs/dagre for relation graphs and a deterministic measured
 * grid for the containment-shaped Screen map, where nesting — not rank — is
 * the meaning.
 */
import { Graph, layout } from '@dagrejs/dagre'
import { MarkerType, Position } from '@vue-flow/core'
import type { Edge, Node } from '@vue-flow/core'
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'

/** Data carried by every entity box (`type: 'blr'`). */
export interface FlowNodeData {
  entityId: string
  kind: ReportEntityKind
  title: string
  /** Small line under the title; defaults to the kind label. */
  sublabel: string
  /** The entity the graph is currently about — drawn larger, with a glow. */
  focus: boolean
  dimmed: boolean
  selected: boolean
  /** Optional count bubble, e.g. Scenarios in a Journey. */
  count: number | null
}

/** Data carried by a container box (`type: 'blr-group'`). */
export interface FlowGroupData {
  entityId: string
  kind: ReportEntityKind
  title: string
  sublabel: string
  dimmed: boolean
  selected: boolean
  /** Shown when the container has nothing inside — a fact, not a fault. */
  emptyNote: string
}

export type BlrFlowNode = Node<FlowNodeData | FlowGroupData>
export type BlrFlowEdge = Edge

export const FLOW_NODE_WIDTH = 208
export const FLOW_NODE_HEIGHT = 58
export const FLOW_FOCUS_WIDTH = 244
export const FLOW_FOCUS_HEIGHT = 70

/** One relation drawn between two entities, always in its canonical direction. */
export interface FlowRelation {
  source: string
  target: string
  /** Present-tense verb read along the arrow: "uses", "constrains". */
  label: string
}

export interface FlowGraphShape {
  nodes: BlrFlowNode[]
  edges: BlrFlowEdge[]
}

function entityNode(
  entity: AnyEntityView,
  options: { focus?: boolean, dimmed?: boolean, selected?: boolean, count?: number | null } = {}
): BlrFlowNode {
  const focus = options.focus ?? false
  const width = focus ? FLOW_FOCUS_WIDTH : FLOW_NODE_WIDTH
  const height = focus ? FLOW_FOCUS_HEIGHT : FLOW_NODE_HEIGHT
  return {
    id: entity.id,
    type: 'blr',
    position: { x: 0, y: 0 },
    width,
    height,
    draggable: false,
    connectable: false,
    selectable: false,
    focusable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { width: `${width}px`, height: `${height}px` },
    data: {
      entityId: entity.id,
      kind: entity.kind,
      title: entity.title,
      sublabel: ENTITY_KIND_META[entity.kind].label,
      focus,
      dimmed: options.dimmed ?? false,
      selected: options.selected ?? false,
      count: options.count ?? null
    }
  }
}

/** Slot index for a kind — the CSS variable the components resolve to colour. */
export function kindSlot(kind: ReportEntityKind): number {
  return ENTITY_KIND_META[kind].slot
}

export function relationEdge(relation: FlowRelation, options: { dimmed?: boolean, emphasized?: boolean } = {}): BlrFlowEdge {
  const dimmed = options.dimmed ?? false
  const emphasized = options.emphasized ?? false
  return {
    id: `${relation.source}->${relation.target}:${relation.label}`,
    source: relation.source,
    target: relation.target,
    type: 'smoothstep',
    label: relation.label,
    selectable: false,
    focusable: false,
    updatable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: 'var(--blr-flow-edge-marker)'
    },
    style: {
      stroke: emphasized ? 'var(--blr-flow-edge-emphasis)' : 'var(--blr-flow-edge)',
      strokeWidth: emphasized ? 2 : 1.4,
      opacity: dimmed ? 0.15 : 1
    },
    labelStyle: {
      fill: 'var(--ui-text-dimmed)',
      fontSize: '10px',
      fontFamily: 'var(--font-mono)',
      opacity: dimmed ? 0.2 : 1
    },
    labelShowBg: true,
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 5,
    labelBgStyle: {
      fill: 'var(--ui-bg)',
      fillOpacity: 0.92,
      stroke: 'var(--ui-border)',
      strokeWidth: 1
    }
  }
}

/**
 * Every relation one entity takes part in, in canonical direction.
 *
 * The verb set is deliberately small and fixed: Actors perform Journeys and
 * enter contexts; Journeys use Capabilities and case into Scenarios; Screens
 * expose Capabilities and serve Scenarios; Rules constrain; everything with
 * availability is available in its contexts.
 */
export function directRelations(workspace: ReportWorkspace, entity: AnyEntityView): FlowRelation[] {
  const relations: FlowRelation[] = []
  const push = (source: string, target: string, label: string) => {
    if (workspace.byId.has(source) && workspace.byId.has(target)) relations.push({ source, target, label })
  }
  const availability = (ids: Array<{ interfaceId: string, experienceId: string }>, sourceId: string, label = 'available in') => {
    for (const pair of ids) {
      push(sourceId, pair.experienceId || pair.interfaceId, label)
    }
  }

  switch (entity.kind) {
    case 'actor': {
      for (const id of entity.interfaceIds) push(entity.id, id, 'enters')
      for (const id of entity.experienceIds) push(entity.id, id, 'enters')
      for (const id of entity.journeyIds) push(entity.id, id, 'performs')
      break
    }
    case 'interface': {
      for (const id of entity.actorIds) push(id, entity.id, 'enters')
      for (const id of entity.experienceIds) push(id, entity.id, 'within')
      for (const id of entity.capabilityIds) push(id, entity.id, 'available in')
      for (const id of entity.screenIds) push(id, entity.id, 'available in')
      for (const id of entity.journeyIds) push(id, entity.id, 'available in')
      break
    }
    case 'experience': {
      for (const id of entity.actorIds) push(id, entity.id, 'enters')
      for (const id of entity.interfaceIds) push(entity.id, id, 'within')
      for (const id of entity.capabilityIds) push(id, entity.id, 'available in')
      for (const id of entity.screenIds) push(id, entity.id, 'available in')
      for (const id of entity.journeyIds) push(id, entity.id, 'available in')
      break
    }
    case 'screen': {
      for (const id of entity.capabilityIds) push(entity.id, id, 'exposes')
      for (const id of entity.scenarioIds) push(entity.id, id, 'serves')
      for (const id of entity.journeyIds) push(id, entity.id, 'passes through')
      availability(entity.availability, entity.id)
      break
    }
    case 'domain': {
      for (const id of entity.capabilityIds) push(id, entity.id, 'in')
      for (const id of entity.ruleIds) push(id, entity.id, 'constrains')
      break
    }
    case 'capability': {
      if (entity.domainId) push(entity.id, entity.domainId, 'in')
      for (const id of entity.journeyIds) push(id, entity.id, 'uses')
      for (const id of entity.screenIds) push(id, entity.id, 'exposes')
      for (const id of entity.ruleIds) push(id, entity.id, 'constrains')
      availability(entity.availability, entity.id)
      break
    }
    case 'journey': {
      for (const id of entity.actorIds) push(id, entity.id, 'performs')
      for (const id of entity.capabilityIds) push(entity.id, id, 'uses')
      for (const id of entity.scenarioIds) push(entity.id, id, 'cases into')
      for (const id of entity.screenIds) push(entity.id, id, 'passes through')
      for (const id of entity.ruleIds) push(id, entity.id, 'constrains')
      availability(entity.availability, entity.id)
      break
    }
    case 'scenario': {
      push(entity.journeyId, entity.id, 'cases into')
      for (const id of entity.screenIds) push(id, entity.id, 'serves')
      for (const id of entity.ruleIds) push(id, entity.id, 'constrains')
      availability(entity.availability, entity.id)
      break
    }
    case 'rule': {
      for (const id of entity.domainIds) push(entity.id, id, 'constrains')
      for (const id of entity.capabilityIds) push(entity.id, id, 'constrains')
      for (const id of entity.journeyIds) push(entity.id, id, 'constrains')
      for (const id of entity.scenarioIds) push(entity.id, id, 'constrains')
      availability(entity.availability, entity.id, 'scoped to')
      break
    }
  }
  return relations
}

/** The ids one hop away from an entity, deduplicated, in kind order. */
export function neighbourIds(workspace: ReportWorkspace, entityId: string): string[] {
  const entity = workspace.byId.get(entityId)
  if (!entity) return []
  const ids = new Set<string>()
  for (const relation of directRelations(workspace, entity)) {
    const other = relation.source === entityId ? relation.target : relation.source
    if (other !== entityId) ids.add(other)
  }
  return [...ids]
}

export interface NeighbourhoodOptions {
  /** Kinds allowed into the graph besides the roots; omit for all. */
  kinds?: ReadonlySet<ReportEntityKind>
  /** Currently selected entity, drawn with a ring. */
  selectedId?: string | null
  /** When set, everything else is faded rather than removed. */
  emphasizeIds?: ReadonlySet<string> | null
}

/**
 * The contextual neighbourhood the brief asks for: the roots, everything one
 * hop from a root, and every canonical relation among the included entities —
 * so a Journey's Screens also show which of its Capabilities they expose.
 */
export function buildNeighbourhood(
  workspace: ReportWorkspace,
  rootIds: string[],
  options: NeighbourhoodOptions = {}
): FlowGraphShape {
  const roots = rootIds.filter(id => workspace.byId.has(id))
  const included = new Set<string>(roots)
  for (const rootId of roots) {
    for (const id of neighbourIds(workspace, rootId)) {
      const kind = workspace.byId.get(id)!.kind
      if (!options.kinds || options.kinds.has(kind)) included.add(id)
    }
  }

  const nodes: BlrFlowNode[] = [...included].map((id) => {
    const entity = workspace.byId.get(id)!
    const emphasized = options.emphasizeIds ? options.emphasizeIds.has(id) : true
    return entityNode(entity, {
      focus: roots.includes(id),
      selected: options.selectedId === id,
      dimmed: !emphasized,
      count: entity.kind === 'journey' ? entity.scenarioIds.length : null
    })
  })

  const edgeById = new Map<string, BlrFlowEdge>()
  for (const id of included) {
    for (const relation of directRelations(workspace, workspace.byId.get(id)!)) {
      if (!included.has(relation.source) || !included.has(relation.target)) continue
      const emphasized = options.emphasizeIds
        ? options.emphasizeIds.has(relation.source) && options.emphasizeIds.has(relation.target)
        : false
      const edge = relationEdge(relation, {
        emphasized,
        dimmed: options.emphasizeIds ? !emphasized : false
      })
      edgeById.set(edge.id, edge)
    }
  }

  return { nodes, edges: [...edgeById.values()] }
}

export interface LayoutOptions {
  direction?: 'LR' | 'TB'
  ranksep?: number
  nodesep?: number
}

/** Position a relation graph with dagre; returns the same nodes, placed. */
export function layoutFlow(shape: FlowGraphShape, options: LayoutOptions = {}): FlowGraphShape {
  const direction = options.direction ?? 'LR'
  const graph = new Graph({ directed: true, multigraph: false, compound: false })
    .setGraph({
      rankdir: direction,
      ranker: 'network-simplex',
      ranksep: options.ranksep ?? 84,
      nodesep: options.nodesep ?? 26,
      edgesep: 18,
      marginx: 16,
      marginy: 16
    })
    .setDefaultEdgeLabel(() => ({}))

  for (const node of shape.nodes) {
    graph.setNode(node.id, {
      width: Number(node.width) || FLOW_NODE_WIDTH,
      height: Number(node.height) || FLOW_NODE_HEIGHT
    })
  }
  for (const edge of shape.edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target, { weight: 1, minlen: 1 })
    }
  }

  layout(graph)

  const vertical = direction === 'TB'
  const nodes = shape.nodes.map((node) => {
    const placed = graph.node(node.id) as { x: number, y: number }
    const width = Number(node.width) || FLOW_NODE_WIDTH
    const height = Number(node.height) || FLOW_NODE_HEIGHT
    return {
      ...node,
      sourcePosition: vertical ? Position.Bottom : Position.Right,
      targetPosition: vertical ? Position.Top : Position.Left,
      position: { x: placed.x - width / 2, y: placed.y - height / 2 }
    }
  })
  return { nodes, edges: shape.edges }
}

/* ------------------------------------------------------------------ */
/* Screen map: containment drawn as measured nested groups             */
/* ------------------------------------------------------------------ */

const MAP_CELL_WIDTH = 216
const MAP_CELL_HEIGHT = 58
const MAP_CELL_GAP = 10
const MAP_GROUP_PADDING = 14
const MAP_GROUP_HEADER = 46
const MAP_EMPTY_HEIGHT = 64
const MAP_COLUMN_GAP = 44

export interface ScreenMapOptions {
  /** Screens to emphasise (e.g. one Journey's); everything else fades. */
  emphasizeScreenIds?: ReadonlySet<string> | null
  selectedId?: string | null
}

/**
 * The required Screen map: Interfaces are columns; directly available Screens
 * sit under the Interface; Experiences are nested groups holding their
 * Screens. Interfaces without Screens keep their column and say why that is
 * fine — a CLI is not a failed browser app.
 */
export function buildScreenMap(workspace: ReportWorkspace, options: ScreenMapOptions = {}): FlowGraphShape {
  const nodes: BlrFlowNode[] = []
  const emphasize = options.emphasizeScreenIds ?? null

  const screenCell = (screenId: string, parentId: string, x: number, y: number): number => {
    const screen = workspace.byId.get(screenId)
    if (!screen) return y
    nodes.push({
      ...entityNode(screen, {
        dimmed: emphasize ? !emphasize.has(screenId) : false,
        selected: options.selectedId === screenId
      }),
      id: `${parentId}::${screenId}`,
      parentNode: parentId,
      extent: 'parent',
      position: { x, y },
      width: MAP_CELL_WIDTH,
      height: MAP_CELL_HEIGHT,
      style: { width: `${MAP_CELL_WIDTH}px`, height: `${MAP_CELL_HEIGHT}px` }
    })
    return y + MAP_CELL_HEIGHT + MAP_CELL_GAP
  }

  let columnX = 0
  for (const productInterface of workspace.interfaces) {
    const experiences = workspace.experiences.filter(item => item.interfaceIds.includes(productInterface.id))
    const experienceScreenIds = new Set(experiences.flatMap(item => item.screenIds))
    const directScreenIds = workspace.screens
      .filter(screen => screen.availability.some(pair => pair.interfaceId === productInterface.id && !pair.experienceId))
      .map(screen => screen.id)
      .filter(id => !experienceScreenIds.has(id))

    const groupWidth = MAP_CELL_WIDTH + MAP_GROUP_PADDING * 2
    const interfaceWidth = groupWidth + MAP_GROUP_PADDING * 2

    // Measure the column before emitting so the parent is sized to its content.
    const directHeight = directScreenIds.length
      ? directScreenIds.length * (MAP_CELL_HEIGHT + MAP_CELL_GAP) - MAP_CELL_GAP
      : 0
    const experienceHeights = experiences.map((experience) => {
      const count = experience.screenIds.length
      const body = count ? count * (MAP_CELL_HEIGHT + MAP_CELL_GAP) - MAP_CELL_GAP : MAP_EMPTY_HEIGHT
      return MAP_GROUP_HEADER + body + MAP_GROUP_PADDING
    })
    const hasContent = directScreenIds.length > 0 || experiences.length > 0
    const bodyHeight = hasContent
      ? (directHeight ? directHeight + (experiences.length ? MAP_CELL_GAP : 0) : 0)
      + experienceHeights.reduce((total, height) => total + height, 0)
      + Math.max(0, experiences.length - 1) * MAP_CELL_GAP
      : MAP_EMPTY_HEIGHT
    const interfaceHeight = MAP_GROUP_HEADER + bodyHeight + MAP_GROUP_PADDING

    nodes.push({
      id: productInterface.id,
      type: 'blr-group',
      position: { x: columnX, y: 0 },
      width: interfaceWidth,
      height: interfaceHeight,
      draggable: false,
      connectable: false,
      selectable: false,
      focusable: false,
      style: { width: `${interfaceWidth}px`, height: `${interfaceHeight}px` },
      data: {
        entityId: productInterface.id,
        kind: 'interface',
        title: productInterface.title,
        sublabel: 'Interface',
        dimmed: false,
        selected: options.selectedId === productInterface.id,
        emptyNote: hasContent ? '' : 'No Screens — this Interface is not a graphical surface.'
      }
    })

    let cursorY = MAP_GROUP_HEADER
    for (const screenId of directScreenIds) {
      cursorY = screenCell(screenId, productInterface.id, MAP_GROUP_PADDING, cursorY)
    }
    if (directScreenIds.length && experiences.length) cursorY += MAP_CELL_GAP

    experiences.forEach((experience, index) => {
      const groupHeight = experienceHeights[index]!
      nodes.push({
        id: `${productInterface.id}::${experience.id}`,
        type: 'blr-group',
        parentNode: productInterface.id,
        extent: 'parent',
        position: { x: MAP_GROUP_PADDING, y: cursorY },
        width: groupWidth,
        height: groupHeight,
        draggable: false,
        connectable: false,
        selectable: false,
        focusable: false,
        style: { width: `${groupWidth}px`, height: `${groupHeight}px` },
        data: {
          entityId: experience.id,
          kind: 'experience',
          title: experience.title,
          sublabel: `Experience · ${experience.accessMode}`,
          dimmed: false,
          selected: options.selectedId === experience.id,
          emptyNote: experience.screenIds.length ? '' : 'No Screens mapped to this Experience.'
        }
      })
      let innerY = MAP_GROUP_HEADER
      for (const screenId of experience.screenIds) {
        innerY = screenCell(screenId, `${productInterface.id}::${experience.id}`, MAP_GROUP_PADDING, innerY)
      }
      cursorY += groupHeight + MAP_CELL_GAP
    })

    columnX += interfaceWidth + MAP_COLUMN_GAP
  }

  return { nodes, edges: [] }
}
