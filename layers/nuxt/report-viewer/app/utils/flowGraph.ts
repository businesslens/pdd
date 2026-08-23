/**
 * The shared Vue Flow foundation for the stable Product Report Workbench.
 *
 * One node vocabulary, one relation vocabulary, one layout: every view draws
 * its graphs from here so the boxes read the same everywhere. Relation verbs
 * are fixed here for the same reason — an edge between
 * the same two entities must say the same thing in every view.
 *
 * Layout is @dagrejs/dagre for relation graphs, a deterministic measured
 * grid for the containment-shaped Screen map, where nesting — not rank — is
 * the meaning, and a deterministic sitemap tree drawn either top-down, where
 * levels are the meaning, or radially, where distance from the Product core
 * is the meaning.
 */
import { Graph, layout } from '@dagrejs/dagre'
import { MarkerType, Position } from '@vue-flow/core'
import type { Edge, Node } from '@vue-flow/core'
import type { ActorView, AnyEntityView, InterfaceView, ReportEntityKind, ReportScenarioType, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META, entityKey, resolveEntity, resolveEntityKey } from './reportWorkspace'

/** Data carried by every entity box (`type: 'blr'`). */
export interface FlowNodeData {
  entityKey: string
  entityId: string
  kind: ReportEntityKind
  /** Present only for a concrete Actor; the node draws kind, the sublabel writes relationship. */
  actorKind?: ActorView['actorKind'] | null
  actorRelationship?: ActorView['relationship'] | null
  /** Present only for a concrete Interface; generic kind nodes keep the plug. */
  interfaceType?: InterfaceView['interfaceType'] | null
  scenarioType: ReportScenarioType | null
  title: string
  /** Small line under the title; defaults to the kind label. */
  sublabel: string
  /** The entity the graph is currently about — drawn larger, with a glow. */
  focus: boolean
  dimmed: boolean
  selected: boolean
  /** Optional count bubble, e.g. Scenarios in a Journey. */
  count: number | null
  /** Authored Domain colour when semantic grouping should override kind colour. */
  colorSlot?: number | null
}

/** Data carried by a container box (`type: 'blr-group'`). */
export interface FlowGroupData {
  entityKey: string
  entityId: string
  kind: ReportEntityKind
  interfaceType?: InterfaceView['interfaceType'] | null
  title: string
  sublabel: string
  dimmed: boolean
  selected: boolean
  /** Authored Domain colour when the group represents a Domain. */
  colorSlot?: number | null
  /** Shown when the container has nothing inside — a fact, not a fault. */
  emptyNote: string
}

/** Non-interactive shelf or column caption used by designed topology views. */
export interface FlowLabelData {
  entityKey: ''
  entityId: ''
  kind: ReportEntityKind
  label: string
  count: number
}

export type BlrFlowNode = Node<FlowNodeData | FlowGroupData | FlowLabelData>
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

export function entityNode(
  entity: AnyEntityView,
  options: {
    focus?: boolean
    dimmed?: boolean
    selected?: boolean
    count?: number | null
    colorSlot?: number | null
  } = {}
): BlrFlowNode {
  const focus = options.focus ?? false
  const width = focus ? FLOW_FOCUS_WIDTH : FLOW_NODE_WIDTH
  const height = focus ? FLOW_FOCUS_HEIGHT : FLOW_NODE_HEIGHT
  return {
    id: entity.key,
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
      entityKey: entity.key,
      entityId: entity.id,
      kind: entity.kind,
      actorKind: entity.kind === 'actor' ? entity.actorKind : null,
      actorRelationship: entity.kind === 'actor' ? entity.relationship : null,
      interfaceType: entity.kind === 'interface' ? entity.interfaceType : null,
      title: entity.title,
      /* An Actor's second authored axis is the Product boundary, which is what
         a topology is read for. The mark cannot carry it, so the sublabel does
         — the same slot, and the same spelling, an Experience gives its access
         mode. */
      sublabel: entity.kind === 'actor'
        ? `${ENTITY_KIND_META.actor.label} · ${entity.relationship}`
        : ENTITY_KIND_META[entity.kind].label,
      scenarioType: entity.kind === 'capability-scenario' || entity.kind === 'journey-scenario'
        ? entity.scenarioType
        : null,
      focus,
      dimmed: options.dimmed ?? false,
      selected: options.selected ?? false,
      count: options.count ?? null,
      colorSlot: options.colorSlot ?? null
    }
  }
}

/** Slot index for a kind — the CSS variable the components resolve to colour. */
export function kindSlot(kind: ReportEntityKind): number {
  return ENTITY_KIND_META[kind].slot
}

export function relationEdge(
  relation: FlowRelation,
  options: { dimmed?: boolean, emphasized?: boolean, minlen?: number } = {}
): BlrFlowEdge {
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
    data: options.minlen ? { minlen: options.minlen } : undefined,
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
    if (workspace.byKey.has(source) && workspace.byKey.has(target)) relations.push({ source, target, label })
  }
  const availability = (ids: Array<{ interfaceId: string, experienceId: string }>, sourceKey: string, label = 'available in') => {
    for (const pair of ids) {
      const target = pair.experienceId
        ? entityKey('experience', pair.experienceId)
        : entityKey('interface', pair.interfaceId)
      push(sourceKey, target, label)
    }
  }

  switch (entity.kind) {
    case 'actor': {
      for (const id of entity.interfaceIds) push(entity.key, entityKey('interface', id), 'enters')
      for (const id of entity.experienceIds) push(entity.key, entityKey('experience', id), 'enters')
      for (const id of entity.journeyIds) push(entity.key, entityKey('journey', id), 'performs')
      break
    }
    case 'interface': {
      for (const id of entity.actorIds) push(entityKey('actor', id), entity.key, 'enters')
      for (const id of entity.experienceIds) push(entityKey('experience', id), entity.key, 'within')
      for (const id of entity.capabilityIds) push(entityKey('capability', id), entity.key, 'available in')
      for (const id of entity.screenIds) push(entityKey('screen', id), entity.key, 'available in')
      for (const id of entity.journeyIds) push(entityKey('journey', id), entity.key, 'available in')
      break
    }
    case 'experience': {
      for (const id of entity.actorIds) push(entityKey('actor', id), entity.key, 'enters')
      for (const id of entity.interfaceIds) push(entity.key, entityKey('interface', id), 'within')
      for (const id of entity.capabilityIds) push(entityKey('capability', id), entity.key, 'available in')
      for (const id of entity.screenIds) push(entityKey('screen', id), entity.key, 'available in')
      for (const id of entity.journeyIds) push(entityKey('journey', id), entity.key, 'available in')
      break
    }
    case 'screen': {
      for (const id of entity.capabilityIds) push(entity.key, entityKey('capability', id), 'exposes')
      for (const id of entity.capabilityScenarioIds) push(entity.key, entityKey('capability-scenario', id), 'serves')
      for (const id of entity.journeyScenarioIds) push(entity.key, entityKey('journey-scenario', id), 'serves')
      for (const id of entity.scenarioJourneyIds) push(entityKey('journey', id), entity.key, 'passes through scenario')
      for (const id of entity.capabilityJourneyIds) push(entityKey('journey', id), entity.key, 'reaches via capability')
      availability(entity.availability, entity.key)
      break
    }
    case 'domain': {
      for (const id of entity.capabilityIds) push(entityKey('capability', id), entity.key, 'in')
      for (const id of entity.ruleIds) push(entityKey('rule', id), entity.key, 'reaches through target')
      break
    }
    case 'capability': {
      if (entity.domainId) push(entity.key, entityKey('domain', entity.domainId), 'in')
      for (const id of entity.scenarioIds) push(entity.key, entityKey('capability-scenario', id), 'cases into')
      for (const id of entity.journeyIds) push(entityKey('journey', id), entity.key, 'uses')
      for (const id of entity.screenIds) push(entityKey('screen', id), entity.key, 'exposes')
      for (const id of entity.ruleIds) push(entityKey('rule', id), entity.key, 'constrains')
      availability(entity.availability, entity.key)
      break
    }
    case 'journey': {
      for (const id of entity.actorIds) push(entityKey('actor', id), entity.key, 'performs')
      for (const id of entity.capabilityIds) push(entity.key, entityKey('capability', id), 'uses')
      for (const id of entity.scenarioIds) push(entity.key, entityKey('journey-scenario', id), 'cases into')
      for (const id of entity.screenIds) push(entity.key, entityKey('screen', id), 'passes through')
      for (const id of entity.ruleIds) push(entityKey('rule', id), entity.key, 'constrains')
      availability(entity.availability, entity.key)
      break
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      if (entity.scenarioType === 'capability') {
        push(entityKey('capability', entity.capabilityId), entity.key, 'cases into')
      } else {
        push(entityKey('journey', entity.journeyId), entity.key, 'cases into')
        for (const capabilityId of new Set(entity.steps.flatMap(step => step.capabilityId ? [step.capabilityId] : []))) {
          push(entity.key, entityKey('capability', capabilityId), 'uses')
        }
      }
      for (const id of entity.screenIds) push(entityKey('screen', id), entity.key, 'serves')
      for (const id of entity.ruleIds) push(entityKey('rule', id), entity.key, 'constrains')
      availability(entity.availability, entity.key)
      break
    }
    case 'rule': {
      for (const id of entity.capabilityIds) push(entity.key, entityKey('capability', id), 'constrains')
      for (const id of entity.journeyIds) push(entity.key, entityKey('journey', id), 'constrains')
      for (const id of entity.capabilityScenarioIds) push(entity.key, entityKey('capability-scenario', id), 'constrains')
      for (const id of entity.journeyScenarioIds) push(entity.key, entityKey('journey-scenario', id), 'constrains')
      availability(entity.availability, entity.key, 'scoped to')
      break
    }
  }
  return relations
}

/** The ids one hop away from an entity, deduplicated, in kind order. */
export function neighbourIds(workspace: ReportWorkspace, entityId: string): string[] {
  const entity = resolveEntityKey(workspace, entityId)
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
 * The contextual neighbourhood: the roots, everything one
 * hop from a root, and every canonical relation among the included entities —
 * so a Journey's Screens also show which of its Capabilities they expose.
 */
export function buildNeighbourhood(
  workspace: ReportWorkspace,
  rootIds: string[],
  options: NeighbourhoodOptions = {}
): FlowGraphShape {
  const roots = rootIds.filter(id => workspace.byKey.has(id))
  const included = new Set<string>(roots)
  for (const rootId of roots) {
    for (const id of neighbourIds(workspace, rootId)) {
      const kind = resolveEntityKey(workspace, id)!.kind
      if (!options.kinds || options.kinds.has(kind)) included.add(id)
    }
  }

  const nodes: BlrFlowNode[] = [...included].map((id) => {
    const entity = resolveEntityKey(workspace, id)!
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
    for (const relation of directRelations(workspace, resolveEntityKey(workspace, id)!)) {
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
      graph.setEdge(edge.source, edge.target, {
        weight: 1,
        minlen: Number((edge.data as { minlen?: number } | undefined)?.minlen) || 1
      })
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
    const screen = resolveEntity(workspace, 'screen', screenId)
    if (!screen) return y
    nodes.push({
      ...entityNode(screen, {
        dimmed: emphasize ? !emphasize.has(screenId) : false,
        selected: options.selectedId === screen.key
      }),
      id: `${parentId}::${screen.key}`,
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
      id: productInterface.key,
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
        entityKey: productInterface.key,
        entityId: productInterface.id,
        kind: 'interface',
        interfaceType: productInterface.interfaceType,
        title: productInterface.title,
        sublabel: 'Interface',
        dimmed: false,
        selected: options.selectedId === productInterface.key,
        emptyNote: hasContent ? '' : 'No Screens — this Interface is not a graphical surface.'
      }
    })

    let cursorY = MAP_GROUP_HEADER
    for (const screenId of directScreenIds) {
      cursorY = screenCell(screenId, productInterface.key, MAP_GROUP_PADDING, cursorY)
    }
    if (directScreenIds.length && experiences.length) cursorY += MAP_CELL_GAP

    experiences.forEach((experience, index) => {
      const groupHeight = experienceHeights[index]!
      nodes.push({
        id: `${productInterface.key}::${experience.key}`,
        type: 'blr-group',
        parentNode: productInterface.key,
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
          entityKey: experience.key,
          entityId: experience.id,
          kind: 'experience',
          title: experience.title,
          sublabel: `Experience · ${experience.accessMode}`,
          dimmed: false,
          selected: options.selectedId === experience.key,
          emptyNote: experience.screenIds.length ? '' : 'No Screens mapped to this Experience.'
        }
      })
      let innerY = MAP_GROUP_HEADER
      for (const screenId of experience.screenIds) {
        innerY = screenCell(screenId, `${productInterface.key}::${experience.key}`, MAP_GROUP_PADDING, innerY)
      }
      cursorY += groupHeight + MAP_CELL_GAP
    })

    columnX += interfaceWidth + MAP_COLUMN_GAP
  }

  return { nodes, edges: [] }
}

/* ------------------------------------------------------------------ */
/* Sitemap: one authored hierarchy, two drawings                       */
/* ------------------------------------------------------------------ */

/** Arc distance keeping the wide boxes apart where neighbours sit side by side. */
const SITEMAP_ARC_X = 250
/** Arc distance keeping boxes apart where neighbours stack vertically. */
const SITEMAP_ARC_Y = 100
const SITEMAP_RING_STEP_X = 330
const SITEMAP_RING_STEP_Y = 155
/** Column pitch of the top-down tree; a leaf Screen owns one column. */
const SITEMAP_TREE_COLUMN = FLOW_NODE_WIDTH + 30
/** Row pitch of the top-down tree — one row per click depth. */
const SITEMAP_TREE_ROW = 170

/** The root node is synthetic — the Product itself is not a model entity. */
export const SITEMAP_ROOT_ID = 'blr-sitemap-root'

export interface SitemapOptions {
  /** Screens to light up (e.g. one Journey's); everything off their path fades. */
  emphasizeScreenIds?: ReadonlySet<string> | null
  selectedId?: string | null
}

interface SitemapBranch {
  nodeId: string
  entity: AnyEntityView
  depth: number
  children: SitemapBranch[]
  /** Leaf slots this subtree occupies on the rim or bottom row — empty branches still claim one. */
  leaves: number
  /** On the emphasized path: an emphasized Screen, or an ancestor of one. */
  lit: boolean
  count: number | null
  angle: number
}

/**
 * The sitemap hierarchy both drawings share: Interface, then Experience, then
 * Screen — the same containment the measured Screen map nests, expressed as a
 * tree. Purely derived from authored availability; the model authors no
 * screen-to-screen navigation, so none is invented.
 */
function sitemapBranches(workspace: ReportWorkspace, emphasize: ReadonlySet<string> | null): SitemapBranch[] {
  const screenBranch = (screenId: string, parentId: string, depth: number): SitemapBranch | null => {
    const screen = resolveEntity(workspace, 'screen', screenId)
    if (!screen) return null
    return {
      nodeId: `${parentId}::${screen.key}`,
      entity: screen,
      depth,
      children: [],
      leaves: 1,
      lit: !emphasize || emphasize.has(screenId),
      count: null,
      angle: 0
    }
  }

  return workspace.interfaces.map((productInterface) => {
    const experiences = workspace.experiences.filter(item => item.interfaceIds.includes(productInterface.id))
    const experienceScreenIds = new Set(experiences.flatMap(item => item.screenIds))
    const directScreenIds = workspace.screens
      .filter(screen => screen.availability.some(pair => pair.interfaceId === productInterface.id && !pair.experienceId))
      .map(screen => screen.id)
      .filter(id => !experienceScreenIds.has(id))

    const children: SitemapBranch[] = directScreenIds
      .map(id => screenBranch(id, productInterface.key, 2))
      .filter((branch): branch is SitemapBranch => branch !== null)

    for (const experience of experiences) {
      const nodeId = `${productInterface.key}::${experience.key}`
      const screens = experience.screenIds
        .map(id => screenBranch(id, nodeId, 3))
        .filter((branch): branch is SitemapBranch => branch !== null)
      children.push({
        nodeId,
        entity: experience,
        depth: 2,
        children: screens,
        leaves: Math.max(1, screens.reduce((total, child) => total + child.leaves, 0)),
        lit: !emphasize || screens.some(child => child.lit),
        count: screens.length,
        angle: 0
      })
    }

    return {
      nodeId: productInterface.key,
      entity: productInterface,
      depth: 1,
      children,
      leaves: Math.max(1, children.reduce((total, child) => total + child.leaves, 0)),
      lit: !emphasize || children.some(child => child.lit),
      count: children.reduce((total, child) => total + (child.entity.kind === 'screen' ? 1 : child.children.length), 0),
      angle: 0
    }
  })
}

/**
 * A sitemap connector: a plain containment line, not a relation arrow — the
 * hierarchy is authored, the reading direction is the levels themselves.
 * Radial spokes run straight along the box side facing the centre; the tree
 * uses org-chart elbows from a parent's bottom to a child's top. Handle ids
 * pick the box side (see BlrFlowNode).
 */
function sitemapSpoke(
  sourceId: string,
  targetId: string,
  sourceCenter: { x: number, y: number },
  targetCenter: { x: number, y: number },
  options: { dimmed?: boolean, emphasized?: boolean, elbow?: boolean } = {}
): BlrFlowEdge {
  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y
  const horizontal = !options.elbow && Math.abs(dx) >= Math.abs(dy)
  const emphasized = options.emphasized ?? false
  return {
    id: `${sourceId}~${targetId}`,
    source: sourceId,
    target: targetId,
    sourceHandle: options.elbow ? 's-bottom' : horizontal ? (dx >= 0 ? 's-right' : 's-left') : (dy >= 0 ? 's-bottom' : 's-top'),
    targetHandle: options.elbow ? 't-top' : horizontal ? (dx >= 0 ? 't-left' : 't-right') : (dy >= 0 ? 't-top' : 't-bottom'),
    type: options.elbow ? 'smoothstep' : 'straight',
    selectable: false,
    focusable: false,
    updatable: false,
    style: {
      stroke: emphasized ? 'var(--blr-flow-edge-emphasis)' : 'var(--blr-flow-edge)',
      strokeWidth: emphasized ? 2 : 1.4,
      opacity: options.dimmed ? 0.15 : 1
    }
  }
}

function sitemapRootNode(workspace: ReportWorkspace, center: { x: number, y: number }): BlrFlowNode {
  return {
    id: SITEMAP_ROOT_ID,
    type: 'blr',
    position: { x: center.x - FLOW_FOCUS_WIDTH / 2, y: center.y - FLOW_FOCUS_HEIGHT / 2 },
    width: FLOW_FOCUS_WIDTH,
    height: FLOW_FOCUS_HEIGHT,
    draggable: false,
    connectable: false,
    selectable: false,
    focusable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { width: `${FLOW_FOCUS_WIDTH}px`, height: `${FLOW_FOCUS_HEIGHT}px` },
    data: {
      entityKey: '',
      entityId: '',
      kind: 'product',
      scenarioType: null,
      title: workspace.identity.title,
      sublabel: 'Product',
      focus: true,
      dimmed: false,
      selected: false,
      count: null
    }
  }
}

function sitemapBranchNode(branch: SitemapBranch, center: { x: number, y: number }, emphasize: ReadonlySet<string> | null, options: SitemapOptions): BlrFlowNode {
  return {
    ...entityNode(branch.entity, {
      dimmed: emphasize ? !branch.lit : false,
      selected: options.selectedId === branch.entity.key,
      count: branch.count
    }),
    id: branch.nodeId,
    position: { x: center.x - FLOW_NODE_WIDTH / 2, y: center.y - FLOW_NODE_HEIGHT / 2 }
  }
}

/**
 * The industry sitemap as the industry usually draws it: the Product at the
 * top, one row per click depth, every leaf Screen owning one column and every
 * parent centred over its span — a deterministic tidy tree, no dagre needed
 * because the hierarchy already is a tree.
 */
export function buildSitemapTree(workspace: ReportWorkspace, options: SitemapOptions = {}): FlowGraphShape {
  const emphasize = options.emphasizeScreenIds ?? null
  const branches = sitemapBranches(workspace, emphasize)
  const totalLeaves = branches.reduce((total, branch) => total + branch.leaves, 0)

  const rootCenter = { x: (totalLeaves * SITEMAP_TREE_COLUMN) / 2, y: 0 }
  const nodes: BlrFlowNode[] = [sitemapRootNode(workspace, rootCenter)]
  const edges: BlrFlowEdge[] = []

  const place = (branch: SitemapBranch, leafStart: number, parentId: string, parentCenter: { x: number, y: number }) => {
    const center = {
      x: (leafStart + branch.leaves / 2) * SITEMAP_TREE_COLUMN,
      y: branch.depth * SITEMAP_TREE_ROW
    }
    nodes.push(sitemapBranchNode(branch, center, emphasize, options))
    edges.push(sitemapSpoke(parentId, branch.nodeId, parentCenter, center, {
      dimmed: emphasize ? !branch.lit : false,
      emphasized: Boolean(emphasize && branch.lit),
      elbow: true
    }))
    let childStart = leafStart
    for (const child of branch.children) {
      place(child, childStart, branch.nodeId, center)
      childStart += child.leaves
    }
  }
  let cursor = 0
  for (const branch of branches) {
    place(branch, cursor, SITEMAP_ROOT_ID, rootCenter)
    cursor += branch.leaves
  }

  return { nodes, edges }
}

/**
 * The same sitemap centralized: the Product at the core instead of the top,
 * rings encoding click depth, subtrees owning angular sectors sized by their
 * leaf count.
 */
export function buildRadialSitemap(workspace: ReportWorkspace, options: SitemapOptions = {}): FlowGraphShape {
  const emphasize = options.emphasizeScreenIds ?? null
  const interfaceBranches = sitemapBranches(workspace, emphasize)

  const TAU = Math.PI * 2
  const totalLeaves = interfaceBranches.reduce((total, branch) => total + branch.leaves, 0)
  const assignAngles = (branch: SitemapBranch, start: number, span: number) => {
    branch.angle = start + span / 2
    let childStart = start
    for (const child of branch.children) {
      const childSpan = span * (child.leaves / branch.leaves)
      assignAngles(child, childStart, childSpan)
      childStart += childSpan
    }
  }
  let cursor = -Math.PI / 2
  for (const branch of interfaceBranches) {
    const span = totalLeaves ? TAU * (branch.leaves / totalLeaves) : TAU
    assignAngles(branch, cursor, span)
    cursor += span
  }

  // Ring radii: each ring clears the previous one and stretches until its
  // tightest pair of neighbours has room — wider in x than in y because the
  // boxes are wide, which is also why the rings read as orbits, not circles.
  const anglesByDepth = new Map<number, number[]>()
  const collectAngles = (branch: SitemapBranch) => {
    anglesByDepth.set(branch.depth, [...(anglesByDepth.get(branch.depth) || []), branch.angle])
    branch.children.forEach(collectAngles)
  }
  interfaceBranches.forEach(collectAngles)

  const maxDepth = Math.max(0, ...anglesByDepth.keys())
  const rx: number[] = [0]
  const ry: number[] = [0]
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const angles = (anglesByDepth.get(depth) || []).slice().sort((left, right) => left - right)
    let minGap = TAU
    for (let index = 1; index < angles.length; index += 1) minGap = Math.min(minGap, angles[index]! - angles[index - 1]!)
    if (angles.length > 1) minGap = Math.min(minGap, angles[0]! + TAU - angles[angles.length - 1]!)
    rx.push(Math.max(rx[depth - 1]! + SITEMAP_RING_STEP_X, SITEMAP_ARC_X / minGap))
    ry.push(Math.max(ry[depth - 1]! + SITEMAP_RING_STEP_Y, SITEMAP_ARC_Y / minGap))
  }

  const nodes: BlrFlowNode[] = [sitemapRootNode(workspace, { x: 0, y: 0 })]
  const edges: BlrFlowEdge[] = []

  const place = (branch: SitemapBranch, parentId: string, parentCenter: { x: number, y: number }) => {
    const center = {
      x: rx[branch.depth]! * Math.cos(branch.angle),
      y: ry[branch.depth]! * Math.sin(branch.angle)
    }
    nodes.push(sitemapBranchNode(branch, center, emphasize, options))
    edges.push(sitemapSpoke(parentId, branch.nodeId, parentCenter, center, {
      dimmed: emphasize ? !branch.lit : false,
      emphasized: Boolean(emphasize && branch.lit)
    }))
    for (const child of branch.children) place(child, branch.nodeId, center)
  }

  for (const branch of interfaceBranches) place(branch, SITEMAP_ROOT_ID, { x: 0, y: 0 })

  return { nodes, edges }
}
