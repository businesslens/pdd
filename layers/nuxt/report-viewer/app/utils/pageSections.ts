/**
 * What a page is made of, now that the Overview absorbs most of it.
 *
 * The first audition put Detail, Connections and Also-on beside the Overview as
 * peers. They are not peers: they *are* what an overview of an element is — what
 * it says, what it touches, and where else it exists. Splitting them made four
 * thin tabs where one full one was wanted.
 *
 * Scenarios are the only material with a shape of their own. References remain
 * part of the Overview, and Neighbourhood is an action into the named Topology
 * surface rather than a third page reading.
 */
import type { AnyElementView, ReportWorkspace } from './reportWorkspace'
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

export type PageTabId = 'overview' | 'scenarios'

export interface PageTab {
  id: PageTabId
  label: string
  count?: number
  hint?: string
  blocks: PageBlockId[]
}

/*
 * Whether BlrElementBody would render anything. Exported because the component
 * asks the same question about itself, and keeping two copies of this list is
 * what let an Object reach its page with no body at all: the kind was added to
 * one enumeration and not the other, so the block was never composed.
 */
export function hasAuthoredBody(element: AnyElementView): boolean {
  if (isScenarioKind(element.kind)) return true
  if (element.kind === 'screen' || element.kind === 'object' || element.kind === 'rule' || element.kind === 'journey') return true
  if (element.intent) return true
  if ('capabilityBoundary' in element && (element as { capabilityBoundary: string }).capabilityBoundary) return true
  return element.kind === 'capability'
}

export function childrenOf(workspace: ReportWorkspace, element: AnyElementView): AnyElementView[] {
  if (element.kind === 'capability') return workspace.scenariosByCapability.get(element.id) ?? []
  if (element.kind === 'journey') return workspace.scenariosByJourney.get(element.id) ?? []
  return []
}

/** The final page has Overview and, only for a behavioral parent, Scenarios. */
export function tabsFor(workspace: ReportWorkspace, element: AnyElementView): PageTab[] {
  const overviewBlocks: PageBlockId[] = ['lead', 'facts']

  /* Only authored Capability Contexts belong in an Overview. A Journey keeps
     only its derived starting places; raw entry-point routes are not a useful
     human reading and the place-bearing element kinds already identify place. */
  const hasOverviewContexts = element.kind === 'capability' && element.contexts.length > 0
  const hasEntryPoints = element.kind === 'journey' && element.entryPoints.length > 0
  if (hasOverviewContexts || hasEntryPoints) overviewBlocks.push('contexts')

  if (hasAuthoredBody(element)) overviewBlocks.push('detail')

  if (counterpartsOf(workspace, element).length) overviewBlocks.push('counterparts')
  overviewBlocks.push('connections')
  if (element.supportingContent) overviewBlocks.push('supporting')
  if (element.references.length) overviewBlocks.push('references')

  const tabs: PageTab[] = [{
    id: 'overview',
    label: 'Overview',
    blocks: overviewBlocks
  }]

  const children = childrenOf(workspace, element)
  if (element.kind === 'capability' || element.kind === 'journey') {
    tabs.push({
      id: 'scenarios',
      label: 'Scenarios',
      count: children.length,
      hint: element.kind === 'capability'
        ? 'Each is one observable acceptance case for this Capability.'
        : 'Each is one path through this promise.',
      blocks: []
    })
  }

  return tabs
}

/** The parent of a Scenario — the page a Scenario is read inside. */
export function parentOf(workspace: ReportWorkspace, element: AnyElementView): AnyElementView | null {
  if (!isScenarioKind(element.kind)) return null
  const scenario = element as { scenarioType: string, capabilityId: string, journeyId: string }
  const key = scenario.scenarioType === 'capability'
    ? `capability:${scenario.capabilityId}`
    : `journey:${scenario.journeyId}`
  return workspace.byKey.get(key) ?? null
}
