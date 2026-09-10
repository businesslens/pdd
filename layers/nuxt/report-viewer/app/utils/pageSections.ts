/** What a page is made of, now that the Overview absorbs most of it. */
import type { AnyResourceView, ReportWorkspace } from './reportWorkspace'
import { counterpartsOf, isScenarioKind } from './reportWorkspace'

export type PageBlockId =
  | 'lead'
  | 'facts'
  | 'contexts'
  | 'detail'
  | 'counterparts'
  | 'connections'
  | 'delivery'
  | 'screens'
  | 'supporting'
  | 'references'

export type PageTabId = 'overview' | 'scenarios' | 'lifecycle'

export interface PageTab {
  id: PageTabId
  label: string
  count?: number
  hint?: string
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

/** The final page has Overview and one peer tab: Scenarios for a behavioral parent, Lifecycle for a thing with States. */
export function tabsFor(workspace: ReportWorkspace, resource: AnyResourceView): PageTab[] {
  const overviewBlocks: PageBlockId[] = ['lead', 'facts']

  /* Only authored Capability Contexts belong in an Overview. */
  const hasOverviewContexts = resource.kind === 'capability' && resource.contexts.length > 0
  const hasEntryPoints = resource.kind === 'journey' && resource.entryPoints.length > 0
  if (hasOverviewContexts || hasEntryPoints) overviewBlocks.push('contexts')

  if (hasAuthoredBody(resource)) overviewBlocks.push('detail')

  if (counterpartsOf(workspace, resource).length) overviewBlocks.push('counterparts')
  if (resource.kind === 'interface') overviewBlocks.push('delivery')
  if (resource.kind === 'experience') overviewBlocks.push('screens')
  overviewBlocks.push('connections')
  if (resource.supportingContent) overviewBlocks.push('supporting')
  if (resource.references.length) overviewBlocks.push('references')

  const tabs: PageTab[] = [{
    id: 'overview',
    label: 'Overview',
    blocks: overviewBlocks
  }]

  const children = childrenOf(workspace, resource)
  if (resource.kind === 'capability' || resource.kind === 'journey') {
    tabs.push({
      id: 'scenarios',
      label: 'Scenarios',
      count: children.length,
      hint: resource.kind === 'capability'
        ? 'Each is one observable acceptance case for this Capability.'
        : 'Each is one path through this promise.',
      blocks: []
    })
  }
  if (resource.kind === 'entity' && resource.states.length) {
    tabs.push({
      id: 'lifecycle',
      label: 'Lifecycle',
      count: resource.states.length,
      hint: 'What it can be, and every Step in the model that moves it.',
      blocks: []
    })
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
