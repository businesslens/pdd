/**
 * What a page is made of, now that the Overview absorbs most of it.
 *
 * The first audition put Detail, Connections and Also-on beside the Overview as
 * peers. They are not peers: they *are* what an overview of an entity is — what
 * it says, what it touches, and where else it exists. Splitting them made four
 * thin tabs where one full one was wanted.
 *
 * Scenarios are the only material with a shape of their own. References remain
 * part of the Overview, and Neighbourhood is an action into the named Topology
 * surface rather than a third page reading.
 */
import type { AnyEntityView, ReportWorkspace } from './reportWorkspace'
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

function hasAuthoredBody(entity: AnyEntityView): boolean {
  if (isScenarioKind(entity.kind)) return true
  if (entity.kind === 'screen' || entity.kind === 'rule' || entity.kind === 'journey') return true
  if (entity.intent) return true
  if ('capabilityBoundary' in entity && (entity as { capabilityBoundary: string }).capabilityBoundary) return true
  return entity.kind === 'capability'
}

export function childrenOf(workspace: ReportWorkspace, entity: AnyEntityView): AnyEntityView[] {
  if (entity.kind === 'capability') return workspace.scenariosByCapability.get(entity.id) ?? []
  if (entity.kind === 'journey') return workspace.scenariosByJourney.get(entity.id) ?? []
  return []
}

/** The final page has Overview and, only for a behavioral parent, Scenarios. */
export function tabsFor(workspace: ReportWorkspace, entity: AnyEntityView): PageTab[] {
  const overviewBlocks: PageBlockId[] = ['lead', 'facts']

  /* Only authored Capability Contexts belong in an Overview. A Journey keeps
     only its derived starting places; raw entry-point routes are not a useful
     human reading and the place-bearing entity kinds already identify place. */
  const hasOverviewContexts = entity.kind === 'capability' && entity.contexts.length > 0
  const hasEntryPoints = entity.kind === 'journey' && entity.entryPoints.length > 0
  if (hasOverviewContexts || hasEntryPoints) overviewBlocks.push('contexts')

  if (hasAuthoredBody(entity)) overviewBlocks.push('detail')

  if (counterpartsOf(workspace, entity).length) overviewBlocks.push('counterparts')
  overviewBlocks.push('connections')
  if (entity.supportingContent) overviewBlocks.push('supporting')
  if (entity.references.length) overviewBlocks.push('references')

  const tabs: PageTab[] = [{
    id: 'overview',
    label: 'Overview',
    blocks: overviewBlocks
  }]

  const children = childrenOf(workspace, entity)
  if (entity.kind === 'capability' || entity.kind === 'journey') {
    tabs.push({
      id: 'scenarios',
      label: 'Scenarios',
      count: children.length,
      hint: entity.kind === 'capability'
        ? 'Each is one observable acceptance case for this Capability.'
        : 'Each is one path through this promise.',
      blocks: []
    })
  }

  return tabs
}

/** The parent of a Scenario — the page a Scenario is read inside. */
export function parentOf(workspace: ReportWorkspace, entity: AnyEntityView): AnyEntityView | null {
  if (!isScenarioKind(entity.kind)) return null
  const scenario = entity as { scenarioType: string, capabilityId: string, journeyId: string }
  const key = scenario.scenarioType === 'capability'
    ? `capability:${scenario.capabilityId}`
    : `journey:${scenario.journeyId}`
  return workspace.byKey.get(key) ?? null
}
