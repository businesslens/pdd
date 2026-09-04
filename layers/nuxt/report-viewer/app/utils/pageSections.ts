/**
 * What a page is made of, now that the Overview absorbs most of it.
 *
 * The first audition put Detail, Connections and Also-on beside the Overview as
 * peers. They are not peers: they *are* what an overview of a resource is — what
 * it says, what it touches, and where else it exists. Splitting them made four
 * thin tabs where one full one was wanted.
 *
 * Scenarios have a shape of their own, and so does a lifecycle: an Entity
 * with States reads its composed machine on a peer tab, the way a Capability
 * reads its Scenarios. References remain part of the Overview, and
 * Neighbourhood is an action into the named Topology surface rather than a
 * third page reading.
 */
import type { AnyResourceView, ReportWorkspace } from './reportWorkspace'
import { counterpartsOf, isScenarioKind } from './reportWorkspace'

export type PageBlockId =
  | 'lead'
  | 'facts'
  | 'contexts'
  | 'detail'
  | 'counterparts'
  | 'connections'
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

/*
 * Whether BlrResourceBody would render anything. Exported because the component
 * asks the same question about itself, and keeping two copies of this list is
 * what let an Entity reach its page with no body at all: the kind was added to
 * one enumeration and not the other, so the block was never composed.
 */
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

  /* Only authored Capability Contexts belong in an Overview. A Journey keeps
     only its derived starting places; raw entry-point routes are not a useful
     human reading and the place-bearing resource kinds already identify place. */
  const hasOverviewContexts = resource.kind === 'capability' && resource.contexts.length > 0
  const hasEntryPoints = resource.kind === 'journey' && resource.entryPoints.length > 0
  if (hasOverviewContexts || hasEntryPoints) overviewBlocks.push('contexts')

  if (hasAuthoredBody(resource)) overviewBlocks.push('detail')

  if (counterpartsOf(workspace, resource).length) overviewBlocks.push('counterparts')
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
