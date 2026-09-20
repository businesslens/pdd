/** Resource readings separate explanation, behavior, relationships and references. */
import type { AnyResourceView, ReportWorkspace } from './reportWorkspace'
import { counterpartsOf, isScenarioKind } from './reportWorkspace'
import { structureChildren } from './collectionChildren'
import { resourceConnectionRows } from './resourceConnections'

export type PageBlockId =
  | 'lead'
  | 'facts'
  | 'audience'
  | 'contexts'
  | 'detail'
  | 'boundary'
  | 'counterparts'
  | 'connections'
  | 'structure'
  | 'supporting'
  | 'references'

export type PageTabId = 'overview' | 'scenarios' | 'lifecycle' | 'behavior' | 'structure' | 'connections' | 'references'

export interface PageTab {
  id: PageTabId
  label: string
  count?: number
  blocks: PageBlockId[]
}

/* Whether BlrResourceBody would render anything. */
export function hasAuthoredBody(resource: AnyResourceView): boolean {
  if (isScenarioKind(resource.kind)) return true
  if (resource.kind === 'screen' || resource.kind === 'entity' || resource.kind === 'rule' || resource.kind === 'journey') return true
  if (resource.intent) return true
  if ('capabilityBoundary' in resource && (resource as { capabilityBoundary: string }).capabilityBoundary) return true
  return resource.kind === 'capability'
}

export function childrenOf(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView[] {
  if (resource.kind === 'capability') return workspace.scenariosByCapability.get(resource.id) ?? []
  if (resource.kind === 'journey') return workspace.scenariosByJourney.get(resource.id) ?? []
  return []
}

/** A Scenario shares its parent's readings while retaining its own References. */
export function tabsFor(workspace: ReportWorkspace, requestedResource: AnyResourceView): PageTab[] {
  const resource = parentOf(workspace, requestedResource) ?? requestedResource
  const overviewBlocks: PageBlockId[] = ['lead', 'facts']
  if ((resource.kind === 'interface' || resource.kind === 'experience') && resource.actorIds.length) overviewBlocks.push('audience')

  /* Only authored Capability Contexts belong in an Overview. */
  const hasOverviewContexts = resource.kind === 'capability' && resource.contexts.length > 0
  const hasEntryPoints = resource.kind === 'journey' && resource.entryPoints.length > 0
  if (hasOverviewContexts || hasEntryPoints) overviewBlocks.push('contexts')

  if (hasAuthoredBody(resource)) overviewBlocks.push('detail')

  const hasCounterparts = counterpartsOf(workspace, resource).length > 0
  if (hasCounterparts && resource.kind !== 'screen') overviewBlocks.push('counterparts')
  if (resource.supportingContent) overviewBlocks.push('supporting')
  if (resource.kind === 'screen') overviewBlocks.push('boundary')

  const tabs: PageTab[] = [{
    id: 'overview',
    label: 'Overview',
    blocks: overviewBlocks
  }]

  const children = childrenOf(workspace, resource)
  if (resource.kind === 'capability' || resource.kind === 'journey') {
    tabs.push({ id: 'scenarios', label: 'Scenarios', count: children.length, blocks: [] })
  }
  if (resource.kind === 'entity' && resource.states.length) {
    tabs.push({ id: 'lifecycle', label: 'Lifecycle', blocks: [] })
  }
  if (structureChildren(workspace, resource).length) tabs.push({ id: 'structure', label: 'Structure', blocks: ['structure'] })
  if (resource.kind === 'screen' && (resource.actions.length || resource.states.length)) {
    tabs.push({ id: 'behavior', label: 'Behavior', blocks: [] })
  }
  const connections: PageBlockId[] = resourceConnectionRows(workspace, resource).length ? ['connections'] : []
  if (resource.kind === 'screen' && hasCounterparts) connections.push('counterparts')
  if (connections.length) {
    tabs.push({ id: 'connections', label: 'Connections', blocks: connections })
  }
  if (requestedResource.references.length) {
    tabs.push({ id: 'references', label: 'References', count: requestedResource.references.length, blocks: ['references'] })
  }

  return tabs
}

/** The parent of a Scenario — the page a Scenario is read inside. */
export function parentOf(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView | null {
  if (!isScenarioKind(resource.kind)) return null
  const scenario = resource as { scenarioType: string, capabilityId: string, journeyId: string }
  const key = scenario.scenarioType === 'capability'
    ? `capability:${scenario.capabilityId}`
    : `journey:${scenario.journeyId}`
  return workspace.byKey.get(key) ?? null
}
