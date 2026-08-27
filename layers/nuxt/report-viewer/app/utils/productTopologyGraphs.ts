/** Graph builders for the question-led Product Topology views. */
import { Position } from '@vue-flow/core'
import type { AnyElementView, ReportElementKind, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META, elementKey } from './reportWorkspace'
import type { BlrFlowEdge, BlrFlowNode, FlowGraphShape, FlowNodeData, FlowRelation } from './flowGraph'
import {
  FLOW_NODE_HEIGHT,
  FLOW_NODE_WIDTH,
  buildSitemapTree,
  directRelations,
  elementNode,
  layoutFlow,
  relationEdge
} from './flowGraph'
import { barycenterOrder, layoutStrata, topologyNeighbourhood } from './productTopologyLayout'
import type { ProductTopologyViewId } from './productTopologyViews'

export interface ProductTopologyGraphOptions {
  selectedId?: string | null
  highlightId?: string | null
  journeyId?: string | null
}

function uniqueElements(elements: AnyElementView[]): AnyElementView[] {
  return [...new Map(elements.map(element => [element.key, element])).values()]
}

function graphFrom(
  elements: AnyElementView[],
  relations: FlowRelation[],
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const unique = uniqueElements(elements)
  const present = new Set(unique.map(element => element.key))
  const nodes = unique.map(element => elementNode(element, {
    selected: options.selectedId === element.key,
    count: element.kind === 'journey' ? element.scenarioIds.length : null
  }))
  const edges = new Map<string, BlrFlowEdge>()
  for (const relation of relations) {
    if (!present.has(relation.source) || !present.has(relation.target)) continue
    const edge = relationEdge(relation)
    edges.set(edge.id, edge)
  }
  return { nodes, edges: [...edges.values()] }
}

/**
 * Fade a complete graph without changing its membership or layout.
 *
 * A whole-model web is unreadable drawn at full strength, and thinning it by
 * dropping edges would misreport the model. Everything stays present and quiet
 * until one node lights its own neighbourhood.
 */
function latentGraph(shape: FlowGraphShape, highlightId: string | null | undefined): FlowGraphShape {
  const matching = new Set(shape.nodes
    .filter(node => node.data?.elementKey === highlightId)
    .map(node => node.id))
  const highlighted = Boolean(highlightId && matching.size)
  const hood = new Set<string>()
  if (highlighted) {
    for (const nodeId of matching) {
      for (const id of topologyNeighbourhood(nodeId, shape.edges)) hood.add(id)
    }
  }

  const nodes = shape.nodes.map((node) => {
    if (!node.data || !('dimmed' in node.data)) return node
    return {
      ...node,
      data: { ...node.data, dimmed: highlighted ? !hood.has(node.id) : false }
    } as BlrFlowNode
  })
  const edges = shape.edges.map((edge) => {
    const lit = highlighted && (matching.has(edge.source) || matching.has(edge.target))
    const next: BlrFlowEdge = {
      ...edge,
      style: {
        ...edge.style,
        stroke: lit ? 'var(--blr-flow-edge-emphasis)' : 'var(--blr-flow-edge)',
        strokeWidth: lit ? 2 : 1.2,
        opacity: highlighted ? (lit ? 1 : 0.07) : 0.16
      },
      labelStyle: { ...edge.labelStyle, opacity: lit ? 1 : 0 }
    }
    if (!lit) delete next.label
    return next
  })
  return { nodes, edges }
}

const MAP_GROUP_PADDING = 14
const MAP_GROUP_HEADER = 48
const MAP_GROUP_GAP = 34
const MAP_ROW_GAP = 10
const MAP_ACCESS_GAP = 36

/**
 * The product map answers what the product can do, grouped by authored Domain.
 * Actors and Interfaces form a compact access rail; Capabilities keep their
 * authored Domain colour inside the visible Domain container.
 */
export function buildProductMap(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const nodes: BlrFlowNode[] = []
  const edges: BlrFlowEdge[] = []
  const accessRows = Math.max(workspace.actors.length, workspace.interfaces.length, 1)
  const accessHeight = accessRows * (FLOW_NODE_HEIGHT + 18) - 18

  workspace.actors.forEach((actor, index) => {
    nodes.push({
      ...elementNode(actor, { selected: options.selectedId === actor.key }),
      position: { x: 0, y: index * (FLOW_NODE_HEIGHT + 18) }
    })
  })

  const interfaceX = FLOW_NODE_WIDTH + MAP_ACCESS_GAP
  workspace.interfaces.forEach((productInterface, index) => {
    nodes.push({
      ...elementNode(productInterface, { selected: options.selectedId === productInterface.key }),
      position: { x: interfaceX, y: index * (FLOW_NODE_HEIGHT + 18) }
    })
    for (const actorId of productInterface.actorIds) {
      edges.push(relationEdge({
        source: elementKey('actor', actorId),
        target: productInterface.key,
        label: 'enters'
      }))
    }
  })

  const buckets = [
    ...[...workspace.domains]
      .sort((left, right) => (left.colorSlot ?? 99) - (right.colorSlot ?? 99)
        || left.title.localeCompare(right.title))
      .map(domain => ({
        nodeId: domain.key,
        elementKey: domain.key,
        elementId: domain.id,
        title: domain.title,
        colorSlot: domain.colorSlot ?? null,
        capabilities: workspace.capabilitiesByDomain.get(domain.id) ?? []
      })),
    ...(workspace.capabilitiesByDomain.get('')?.length
      ? [{
          nodeId: 'blr-domain-none',
          elementKey: '',
          elementId: '',
          title: 'No Domain',
          colorSlot: null,
          capabilities: workspace.capabilitiesByDomain.get('') ?? []
        }]
      : [])
  ]

  let x = interfaceX + FLOW_NODE_WIDTH + 86
  for (const bucket of buckets) {
    const bodyHeight = bucket.capabilities.length
      ? bucket.capabilities.length * (FLOW_NODE_HEIGHT + MAP_ROW_GAP) - MAP_ROW_GAP
      : FLOW_NODE_HEIGHT
    const width = FLOW_NODE_WIDTH + MAP_GROUP_PADDING * 2
    const height = MAP_GROUP_HEADER + bodyHeight + MAP_GROUP_PADDING
    nodes.push({
      id: bucket.nodeId,
      type: 'blr-group',
      position: { x, y: Math.max(0, (accessHeight - height) / 2) },
      width,
      height,
      draggable: false,
      connectable: false,
      selectable: false,
      focusable: false,
      style: { width: `${width}px`, height: `${height}px` },
      data: {
        elementKey: bucket.elementKey,
        elementId: bucket.elementId,
        kind: 'domain',
        title: bucket.title,
        sublabel: `${bucket.capabilities.length} ${bucket.capabilities.length === 1 ? 'Capability' : 'Capabilities'}`,
        colorSlot: bucket.colorSlot,
        dimmed: false,
        selected: options.selectedId === bucket.elementKey,
        emptyNote: bucket.capabilities.length ? '' : 'No Capabilities are assigned to this Domain.'
      }
    })

    bucket.capabilities.forEach((capability, index) => {
      nodes.push({
        ...elementNode(capability, {
          selected: options.selectedId === capability.key,
          colorSlot: bucket.colorSlot
        }),
        parentNode: bucket.nodeId,
        extent: 'parent',
        position: {
          x: MAP_GROUP_PADDING,
          y: MAP_GROUP_HEADER + index * (FLOW_NODE_HEIGHT + MAP_ROW_GAP)
        }
      })
      for (const context of capability.contexts) {
        edges.push(relationEdge({
          source: elementKey('interface', context.interfaceId),
          target: capability.key,
          label: ''
        }))
      }
    })
    x += width + MAP_GROUP_GAP
  }

  return { nodes, edges }
}

/** One selected Journey, its accepted variations, Capability-bearing Steps and landings. */
export function buildValuePaths(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const journey = workspace.journeys.find(item => item.id === options.journeyId) ?? workspace.journeys[0]
  if (!journey) return { nodes: [], edges: [] }
  const scenarios = workspace.scenariosByJourney.get(journey.id) ?? []
  const nodes: BlrFlowNode[] = [elementNode(journey, {
    focus: true,
    selected: options.selectedId === journey.key,
    count: scenarios.length
  })]
  const edges: BlrFlowEdge[] = []
  const screens = new Map<string, AnyElementView>()

  for (const scenario of scenarios) {
    nodes.push(elementNode(scenario, { selected: options.selectedId === scenario.key }))
    edges.push(relationEdge({ source: journey.key, target: scenario.key, label: 'varies as' }))
    let previous = scenario.key
    const stepAnchors: Array<{ nodeId: string, capabilityId: string, screenIds: string[] }> = []

    scenario.steps.forEach((step, index) => {
      if (!step.capabilityId) return
      const capability = workspace.capabilities.find(item => item.id === step.capabilityId)
      if (!capability) return
      const occurrenceId = `${scenario.key}:step:${index}:${capability.key}`
      const node = elementNode(capability, {
        selected: options.selectedId === capability.key
      })
      const data = node.data as FlowNodeData
      nodes.push({
        ...node,
        id: occurrenceId,
        data: {
          ...data,
          sublabel: `${index + 1}. ${step.text}`,
          count: null
        }
      })
      edges.push(relationEdge({ source: previous, target: occurrenceId, label: index ? 'then' : 'starts' }))
      previous = occurrenceId
      stepAnchors.push({
        nodeId: occurrenceId,
        capabilityId: step.capabilityId,
        screenIds: step.contexts.flatMap(context => context.context.screenId ? [context.context.screenId] : [])
      })
    })

    /* A Screen Context belongs to one Step. Anchor the Screen on the last
       Capability-bearing Step that names it, and fall back to the Scenario only
       for an invalid or externally supplied report that lacks that placement. */
    for (const screen of workspace.screens.filter(item => item.journeyScenarioIds.includes(scenario.id))) {
      screens.set(screen.key, screen)
      const anchor = [...stepAnchors].reverse().find(step =>
        screen.capabilityIds.includes(step.capabilityId) && step.screenIds.includes(screen.id))
      edges.push(relationEdge({
        source: anchor?.nodeId ?? scenario.key,
        target: screen.key,
        label: 'lands on'
      }))
    }
  }

  nodes.push(...[...screens.values()].map(screen => elementNode(screen, {
    selected: options.selectedId === screen.key
  })))
  /*
    Ordered Capability-bearing Steps read downward, so variations sit side by side as columns.
    A left-to-right chain made a short Journey a thin ribbon: the row was wider
    than the canvas, so it scaled down and left the height unused.
  */
  return layoutFlow({ nodes, edges }, { direction: 'TB', ranksep: 72, nodesep: 42 })
}

/**
 * Delivery by Interface distinguishes graphical routes from direct integrations.
 * UI Interfaces continue through Experience and Screen; a non-visual direct
 * Interface terminates in the Capability it delivers.
 */
export function buildDeliveryByInterface(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const directInterfaceIds = new Set(workspace.interfaces
    .filter(productInterface => productInterface.experienceIds.length === 0)
    .map(productInterface => productInterface.id))
  const directCapabilityIds = new Set(workspace.capabilities
    .filter(capability => capability.contexts.some(context =>
      directInterfaceIds.has(context.interfaceId) && !context.experienceId))
    .map(capability => capability.id))
  const elements: AnyElementView[] = [
    ...workspace.actors,
    ...workspace.interfaces,
    ...workspace.experiences,
    ...workspace.screens,
    ...workspace.capabilities.filter(capability => directCapabilityIds.has(capability.id))
  ]
  const relations: FlowRelation[] = []

  for (const productInterface of workspace.interfaces) {
    productInterface.actorIds.forEach(actorId => relations.push({
      source: elementKey('actor', actorId),
      target: productInterface.key,
      label: 'enters'
    }))
  }
  for (const experience of workspace.experiences) {
    experience.interfaceIds.forEach(interfaceId => relations.push({
      source: elementKey('interface', interfaceId),
      target: experience.key,
      label: 'opens'
    }))
  }
  for (const screen of workspace.screens) {
    for (const context of screen.contexts) {
      relations.push({
        source: context.experienceId
          ? elementKey('experience', context.experienceId)
          : elementKey('interface', context.interfaceId),
        target: screen.key,
        label: context.experienceId ? 'contains' : 'offers directly'
      })
    }
  }
  for (const capability of workspace.capabilities.filter(item => directCapabilityIds.has(item.id))) {
    for (const context of capability.contexts.filter(item => directInterfaceIds.has(item.interfaceId))) {
      relations.push({
        source: elementKey('interface', context.interfaceId),
        target: capability.key,
        label: 'delivers directly'
      })
    }
  }

  return layoutFlow(graphFrom(elements, relations, options), { ranksep: 112, nodesep: 32 })
}

/**
 * Rule reach draws only authored attachments — never derived reach — so an
 * edge here always means "this Rule names that element". The two Scenario
 * collections keep separate ranks because a Rule constrains local acceptance
 * and end-to-end variation for different reasons.
 */
/**
 * What the Product keeps, and what moves it.
 *
 * The only view whose subject is the Product's nouns. Entity-to-Entity edges are
 * authored on one side and drawn once, so a Collection that holds Items appears
 * as one edge rather than two facing each other. A Capability appears only when
 * it acts on something, which keeps the canvas about the things rather than
 * becoming a second Product map.
 */
export function buildWhatItKeeps(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const changing = new Set(workspace.capabilities.filter(c => c.entityIds.length).map(c => c.id))
  const elements: AnyElementView[] = [
    ...workspace.entities,
    ...workspace.capabilities.filter(element => changing.has(element.id))
  ]
  const shape = graphFrom(elements, [], options)
  const present = new Set(shape.nodes.map(node => node.id))
  const edges: BlrFlowEdge[] = []
  const add = (source: string, target: string, label: string, minlen: number) => {
    if (!present.has(source) || !present.has(target)) return
    edges.push(relationEdge({ source, target, label }, { minlen }))
  }
  for (const capability of workspace.capabilities) {
    for (const id of capability.entityIds) {
      add(capability.key, elementKey('entity', id), 'changes', 1)
    }
  }
  for (const entity of workspace.entities) {
    for (const relation of entity.relations) {
      add(entity.key, elementKey('entity', relation.entityId), relation.verb, 1)
    }
  }
  return layoutFlow({ nodes: shape.nodes, edges: [...shape.edges, ...edges] }, { ranksep: 110, nodesep: 24 })
}

export function buildRuleReach(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const capabilityIds = new Set(workspace.rules.flatMap(rule => rule.capabilityIds))
  const journeyIds = new Set(workspace.rules.flatMap(rule => rule.journeyIds))
  const capabilityScenarioIds = new Set(workspace.rules.flatMap(rule => rule.capabilityScenarioIds))
  const journeyScenarioIds = new Set(workspace.rules.flatMap(rule => rule.journeyScenarioIds))
  const elements: AnyElementView[] = [
    ...workspace.rules,
    ...workspace.capabilities.filter(element => capabilityIds.has(element.id)),
    ...workspace.journeys.filter(element => journeyIds.has(element.id)),
    ...workspace.capabilityScenarios.filter(element => capabilityScenarioIds.has(element.id)),
    ...workspace.journeyScenarios.filter(element => journeyScenarioIds.has(element.id))
  ]
  const shape = graphFrom(elements, [], options)
  const present = new Set(shape.nodes.map(node => node.id))
  const edges: BlrFlowEdge[] = []
  const add = (source: string, target: string, minlen: number) => {
    if (!present.has(source) || !present.has(target)) return
    edges.push(relationEdge({ source, target, label: 'constrains' }, { minlen }))
  }
  for (const rule of workspace.rules) {
    rule.capabilityIds.forEach(target => add(rule.key, elementKey('capability', target), 2))
    rule.journeyIds.forEach(target => add(rule.key, elementKey('journey', target), 3))
    rule.capabilityScenarioIds.forEach(target => add(rule.key, elementKey('capability-scenario', target), 4))
    rule.journeyScenarioIds.forEach(target => add(rule.key, elementKey('journey-scenario', target), 4))
  }
  return latentGraph(layoutFlow({ nodes: shape.nodes, edges }, { ranksep: 98, nodesep: 22 }), options.highlightId)
}

/**
 * Shelves for the whole-model reading, in the order the report is understood:
 * who reaches it, which Interface they meet, what it accepts, what it can do, and
 * what governs all of it.
 */
export const EVERYTHING_SHELF_ORDER: ReportElementKind[] = [
  'product',
  'actor',
  'interface',
  'experience',
  'screen',
  'capability-scenario',
  'journey-scenario',
  'journey',
  'capability',
  'domain',
  'rule'
]

export function buildEverything(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const elements: AnyElementView[] = [
    ...workspace.actors,
    ...workspace.interfaces,
    ...workspace.experiences,
    ...workspace.screens,
    ...workspace.capabilityScenarios,
    ...workspace.journeyScenarios,
    ...workspace.journeys,
    ...workspace.capabilities,
    ...workspace.domains,
    ...workspace.entities,
    ...workspace.rules
  ]
  const productNode: BlrFlowNode = {
    id: 'blr-product-root',
    type: 'blr',
    position: { x: 0, y: 0 },
    width: FLOW_NODE_WIDTH,
    height: FLOW_NODE_HEIGHT,
    draggable: false,
    connectable: false,
    selectable: false,
    focusable: false,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: { width: `${FLOW_NODE_WIDTH}px`, height: `${FLOW_NODE_HEIGHT}px` },
    data: {
      elementKey: '',
      elementId: '',
      kind: 'product',
      scenarioType: null,
      title: workspace.identity.title,
      sublabel: 'Product',
      focus: false,
      dimmed: false,
      selected: false,
      count: workspace.counts.interfaces
    }
  }
  const nodes: BlrFlowNode[] = [productNode, ...elements.map(element => ({
    ...elementNode(element, { selected: options.selectedId === element.key }),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  }))]
  const present = new Set(nodes.map(node => node.id))
  const edgeMap = new Map<string, BlrFlowEdge>()
  const relations: FlowRelation[] = [
    ...workspace.interfaces.map(target => ({
      source: 'blr-product-root',
      target: target.key,
      label: 'offers'
    })),
    ...elements.flatMap(element => directRelations(workspace, element))
  ]
  for (const relation of relations) {
    if (!present.has(relation.source) || !present.has(relation.target)) continue
    const edge = relationEdge(relation)
    edgeMap.set(edge.id, edge)
  }
  const edges = [...edgeMap.values()]

  const byKind = new Map<ReportElementKind, string[]>()
  for (const node of nodes) {
    const kind = node.data!.kind
    byKind.set(kind, [...(byKind.get(kind) ?? []), node.id])
  }
  const rows = EVERYTHING_SHELF_ORDER.map(kind => byKind.get(kind) ?? [])
  const placed = layoutStrata(barycenterOrder(rows, edges), {
    nodeWidth: FLOW_NODE_WIDTH,
    nodeHeight: FLOW_NODE_HEIGHT,
    gapX: 34,
    gapY: 78
  })
  const positioned = nodes.map(node => ({
    ...node,
    position: placed.positions.get(node.id) ?? node.position
  }))
  const labels: BlrFlowNode[] = EVERYTHING_SHELF_ORDER.flatMap((kind, index) => {
    const top = placed.rowTops.get(index)
    const count = byKind.get(kind)?.length ?? 0
    if (top === undefined || !count) return []
    return [{
      id: `blr-shelf-${kind}`,
      type: 'blr-label',
      position: { x: -196, y: top + FLOW_NODE_HEIGHT / 2 - 15 },
      width: 168,
      height: 30,
      draggable: false,
      connectable: false,
      selectable: false,
      focusable: false,
      style: { width: '168px', height: '30px' },
      data: {
        elementKey: '',
        elementId: '',
        kind,
        label: count === 1 ? ENTITY_KIND_META[kind].label : ENTITY_KIND_META[kind].plural,
        count
      }
    }]
  })
  return latentGraph({ nodes: [...positioned, ...labels], edges }, options.highlightId)
}

export function buildProductTopologyGraph(
  workspace: ReportWorkspace,
  viewId: ProductTopologyViewId,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  switch (viewId) {
    case 'product-map': return buildProductMap(workspace, options)
    case 'value-paths': return buildValuePaths(workspace, options)
    case 'delivery-by-interface': return buildDeliveryByInterface(workspace, options)
    case 'sitemap': return buildSitemapTree(workspace, { selectedId: options.selectedId })
    case 'rule-reach': return buildRuleReach(workspace, options)
    case 'what-it-keeps': return buildWhatItKeeps(workspace, options)
    case 'everything': return buildEverything(workspace, options)
  }
}
