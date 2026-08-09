/** Graph builders for the seven fixed Product Topology views. */
import { Position } from '@vue-flow/core'
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META, entityKey } from './reportWorkspace'
import type { BlrFlowEdge, BlrFlowNode, FlowGraphShape, FlowNodeData, FlowRelation } from './flowGraph'
import {
  FLOW_NODE_HEIGHT,
  FLOW_NODE_WIDTH,
  buildSitemapTree,
  directRelations,
  entityNode,
  layoutFlow,
  relationEdge
} from './flowGraph'
import { barycenterOrder, layoutStrata, topologyNeighbourhood } from './productTopologyLayout'
import type { ProductTopologyViewId } from './productTopologyViews'

export const EVERYTHING_SHELF_ORDER: ReportEntityKind[] = [
  'product',
  'actor',
  'interface',
  'experience',
  'screen',
  'scenario',
  'journey',
  'capability',
  'domain',
  'rule'
]

export interface ProductTopologyGraphOptions {
  selectedId?: string | null
  highlightId?: string | null
  journeyId?: string | null
}

const journeyCount = (entity: AnyEntityView): number | null =>
  entity.kind === 'journey' ? entity.scenarioIds.length : null

function uniqueEntities(entities: AnyEntityView[]): AnyEntityView[] {
  return [...new Map(entities.map(entity => [entity.key, entity])).values()]
}

function graphFrom(
  entities: AnyEntityView[],
  relations: FlowRelation[],
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const unique = uniqueEntities(entities)
  const present = new Set(unique.map(entity => entity.key))
  const nodes = unique.map(entity => entityNode(entity, {
    selected: options.selectedId === entity.key,
    count: journeyCount(entity)
  }))
  const edges = new Map<string, BlrFlowEdge>()
  for (const relation of relations) {
    if (!present.has(relation.source) || !present.has(relation.target)) continue
    const edge = relationEdge(relation)
    edges.set(edge.id, edge)
  }
  return { nodes, edges: [...edges.values()] }
}

/** Fade a complete graph without changing its membership or layout. */
function latentGraph(shape: FlowGraphShape, highlightId: string | null | undefined): FlowGraphShape {
  const matching = new Set(shape.nodes
    .filter(node => node.data?.entityKey === highlightId)
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

export function buildValueFlow(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const entities = [
    ...workspace.actors,
    ...workspace.journeys,
    ...workspace.capabilities,
    ...workspace.screens
  ]
  const relations: FlowRelation[] = []
  for (const journey of workspace.journeys) {
    journey.actorIds.forEach(source => relations.push({
      source: entityKey('actor', source), target: journey.key, label: 'performs'
    }))
    journey.capabilityIds.forEach(target => relations.push({
      source: journey.key, target: entityKey('capability', target), label: 'uses'
    }))
  }
  for (const screen of workspace.screens) {
    screen.capabilityIds.forEach(source => relations.push({
      source: entityKey('capability', source), target: screen.key, label: 'exposed by'
    }))
  }
  return layoutFlow(graphFrom(entities, relations, options), { ranksep: 118, nodesep: 34 })
}

export function buildAccessMap(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const entities = [
    ...workspace.actors,
    ...workspace.interfaces,
    ...workspace.experiences,
    ...workspace.screens
  ]
  const relations: FlowRelation[] = []
  for (const productInterface of workspace.interfaces) {
    productInterface.actorIds.forEach(source => relations.push({
      source: entityKey('actor', source), target: productInterface.key, label: 'enters'
    }))
  }
  for (const experience of workspace.experiences) {
    experience.interfaceIds.forEach(source => relations.push({
      source: entityKey('interface', source), target: experience.key, label: 'contains'
    }))
  }
  for (const screen of workspace.screens) {
    for (const pair of screen.availability) {
      relations.push({
        source: pair.experienceId
          ? entityKey('experience', pair.experienceId)
          : entityKey('interface', pair.interfaceId),
        target: screen.key,
        label: pair.experienceId ? 'contains' : 'offers directly'
      })
    }
  }
  return layoutFlow(graphFrom(entities, relations, options), { ranksep: 118, nodesep: 34 })
}

const DOMAIN_GROUP_PADDING = 14
const DOMAIN_GROUP_HEADER = 48
const DOMAIN_GROUP_GAP = 48
const DOMAIN_GROUP_EMPTY_HEIGHT = 68

export function buildDomainAnatomy(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const nodes: BlrFlowNode[] = []
  const buckets = [
    ...workspace.domains.map(domain => ({
      nodeId: domain.key,
      entityKey: domain.key,
      entityId: domain.id,
      title: domain.title,
      capabilities: workspace.capabilitiesByDomain.get(domain.id) ?? []
    })),
    ...(workspace.capabilitiesByDomain.get('')?.length
      ? [{
          nodeId: 'blr-domain-none',
          entityKey: '',
          entityId: '',
          title: 'No Domain',
          capabilities: workspace.capabilitiesByDomain.get('') ?? []
        }]
      : [])
  ]

  let x = 0
  for (const bucket of buckets) {
    const bodyHeight = bucket.capabilities.length
      ? bucket.capabilities.length * (FLOW_NODE_HEIGHT + 10) - 10
      : DOMAIN_GROUP_EMPTY_HEIGHT
    const width = FLOW_NODE_WIDTH + DOMAIN_GROUP_PADDING * 2
    const height = DOMAIN_GROUP_HEADER + bodyHeight + DOMAIN_GROUP_PADDING
    nodes.push({
      id: bucket.nodeId,
      type: 'blr-group',
      position: { x, y: 0 },
      width,
      height,
      draggable: false,
      connectable: false,
      selectable: false,
      focusable: false,
      style: { width: `${width}px`, height: `${height}px` },
      data: {
        entityKey: bucket.entityKey,
        entityId: bucket.entityId,
        kind: 'domain',
        title: bucket.title,
        sublabel: `${bucket.capabilities.length} ${bucket.capabilities.length === 1 ? 'Capability' : 'Capabilities'}`,
        dimmed: false,
        selected: options.selectedId === bucket.entityKey,
        emptyNote: bucket.capabilities.length ? '' : 'No Capabilities are assigned to this Domain.'
      }
    })
    bucket.capabilities.forEach((capability, index) => {
      nodes.push({
        ...entityNode(capability, {
          selected: options.selectedId === capability.key,
          count: capability.journeyIds.length || null
        }),
        parentNode: bucket.nodeId,
        extent: 'parent',
        position: {
          x: DOMAIN_GROUP_PADDING,
          y: DOMAIN_GROUP_HEADER + index * (FLOW_NODE_HEIGHT + 10)
        }
      })
    })
    x += width + DOMAIN_GROUP_GAP
  }

  return { nodes, edges: [] }
}

export function buildRuleReach(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const domainIds = new Set(workspace.rules.flatMap(rule => rule.domainIds))
  const capabilityIds = new Set(workspace.rules.flatMap(rule => rule.capabilityIds))
  const journeyIds = new Set(workspace.rules.flatMap(rule => rule.journeyIds))
  const scenarioIds = new Set(workspace.rules.flatMap(rule => rule.scenarioIds))
  const entities: AnyEntityView[] = [
    ...workspace.rules,
    ...workspace.domains.filter(entity => domainIds.has(entity.id)),
    ...workspace.capabilities.filter(entity => capabilityIds.has(entity.id)),
    ...workspace.journeys.filter(entity => journeyIds.has(entity.id)),
    ...workspace.scenarios.filter(entity => scenarioIds.has(entity.id))
  ]
  const shape = graphFrom(entities, [], options)
  const present = new Set(shape.nodes.map(node => node.id))
  const edges: BlrFlowEdge[] = []
  const add = (source: string, target: string, minlen: number) => {
    if (!present.has(source) || !present.has(target)) return
    edges.push(relationEdge({ source, target, label: 'constrains' }, { minlen }))
  }
  for (const rule of workspace.rules) {
    rule.domainIds.forEach(target => add(rule.key, entityKey('domain', target), 1))
    rule.capabilityIds.forEach(target => add(rule.key, entityKey('capability', target), 2))
    rule.journeyIds.forEach(target => add(rule.key, entityKey('journey', target), 3))
    rule.capabilityScenarioIds.forEach(target => add(rule.key, entityKey('scenario', target, 'capability'), 4))
    rule.journeyScenarioIds.forEach(target => add(rule.key, entityKey('scenario', target, 'journey'), 4))
  }
  return latentGraph(layoutFlow({ nodes: shape.nodes, edges }, { ranksep: 98, nodesep: 22 }), options.highlightId)
}

export function buildJourneyAnatomy(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const journey = workspace.journeys.find(item => item.id === options.journeyId) ?? workspace.journeys[0]
  if (!journey) return { nodes: [], edges: [] }
  const scenarios = workspace.scenariosByJourney.get(journey.id) ?? []
  const nodes: BlrFlowNode[] = [entityNode(journey, {
    selected: options.selectedId === journey.key,
    count: scenarios.length
  })]
  const edges: BlrFlowEdge[] = []
  const screens = new Map<string, AnyEntityView>()

  for (const scenario of scenarios) {
    nodes.push(entityNode(scenario, { selected: options.selectedId === scenario.key }))
    edges.push(relationEdge({ source: journey.key, target: scenario.key, label: 'cases into' }))
    let previous = scenario.key

    scenario.flow.forEach((stage, index) => {
      const capability = workspace.capabilities.find(item => item.id === stage.capabilityId)
      if (!capability) return
      const occurrenceId = `${scenario.key}:stage:${index}:${capability.key}`
      const node = entityNode(capability, { selected: options.selectedId === capability.key })
      const data = node.data as FlowNodeData
      nodes.push({
        ...node,
        id: occurrenceId,
        data: {
          ...data,
          sublabel: `${index + 1}. ${stage.operation}`,
          count: null
        }
      })
      edges.push(relationEdge({ source: previous, target: occurrenceId, label: index ? 'then' : 'starts' }))
      previous = occurrenceId
    })

    for (const screen of workspace.screens.filter(item => item.journeyScenarioIds.includes(scenario.id))) {
      screens.set(screen.key, screen)
      edges.push(relationEdge({ source: previous, target: screen.key, label: 'lands on' }))
    }
  }

  nodes.push(...[...screens.values()].map(screen => entityNode(screen, {
    selected: options.selectedId === screen.key
  })))
  return layoutFlow({ nodes, edges }, { ranksep: 108, nodesep: 28 })
}

function everythingEntities(workspace: ReportWorkspace): AnyEntityView[] {
  return [
    ...workspace.actors,
    ...workspace.interfaces,
    ...workspace.experiences,
    ...workspace.screens,
    ...workspace.scenarios,
    ...workspace.journeys,
    ...workspace.capabilities,
    ...workspace.domains,
    ...workspace.rules
  ]
}

export function buildEverything(
  workspace: ReportWorkspace,
  options: ProductTopologyGraphOptions = {}
): FlowGraphShape {
  const entities = everythingEntities(workspace)
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
      entityKey: '',
      entityId: '',
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
  const nodes = [productNode, ...entities.map(entity => ({
    ...entityNode(entity, {
      selected: options.selectedId === entity.key,
      count: journeyCount(entity)
    }),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  }))]
  const present = new Set(nodes.map(node => node.id))
  const edgeMap = new Map<string, BlrFlowEdge>()
  const relations = [
    ...workspace.interfaces.map(target => ({ source: 'blr-product-root', target: target.key, label: 'offers' })),
    ...entities.flatMap(entity => directRelations(workspace, entity))
  ]
  for (const relation of relations) {
    if (!present.has(relation.source) || !present.has(relation.target)) continue
    const edge = relationEdge(relation)
    edgeMap.set(edge.id, edge)
  }
  const edges = [...edgeMap.values()]
  const byKind = new Map<ReportEntityKind, string[]>()
  for (const node of nodes) {
    const kind = node.data!.kind
    byKind.set(kind, [...(byKind.get(kind) ?? []), node.id])
  }
  const rows = EVERYTHING_SHELF_ORDER.map(kind => byKind.get(kind) ?? [])
  const ordered = barycenterOrder(rows, edges)
  const placed = layoutStrata(ordered, {
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
      position: { x: -176, y: top + FLOW_NODE_HEIGHT / 2 - 15 },
      width: 148,
      height: 30,
      draggable: false,
      connectable: false,
      selectable: false,
      focusable: false,
      style: { width: '148px', height: '30px' },
      data: {
        entityKey: '',
        entityId: '',
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
    case 'everything': return buildEverything(workspace, options)
    case 'value-flow': return buildValueFlow(workspace, options)
    case 'access-map': return buildAccessMap(workspace, options)
    case 'sitemap': return buildSitemapTree(workspace, { selectedId: options.selectedId })
    case 'domain-anatomy': return buildDomainAnatomy(workspace, options)
    case 'rule-reach': return buildRuleReach(workspace, options)
    case 'journey-anatomy': return buildJourneyAnatomy(workspace, options)
  }
}
