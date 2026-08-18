/**
 * What a page is made of, now that the Overview absorbs most of it.
 *
 * The first audition put Detail, Connections and Also-on beside the Overview as
 * peers. They are not peers: they *are* what an overview of an entity is — what
 * it says, what it touches, and where else it exists. Splitting them made four
 * thin tabs where one full one was wanted.
 *
 * What is left beside the Overview is only material with a shape of its own: a
 * parent's Scenarios, a graph-led entity's neighbourhood, and the reference
 * list. A Journey's Steps stay inside its Scenarios; a second diagram tab would
 * be a lossy peer projection of the same authored sequence.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './model'
import { ENTITY_KIND_META, counterpartsOf, isScenarioKind } from './model'

export type PageBlockId =
  | 'lead'
  | 'facts'
  | 'access'
  | 'detail'
  | 'counterparts'
  | 'connections'
  | 'supporting'
  | 'references'

export type PageTabId = 'overview' | 'detail' | 'scenarios' | 'diagram' | 'references'

export interface PageTab {
  id: PageTabId
  label: string
  count?: number
  hint?: string
  blocks: PageBlockId[]
}

/** Kinds whose reach is the reading, so the graph is their body. */
export const GRAPH_LED: ReportEntityKind[] = ['actor', 'interface', 'experience', 'domain']

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

/**
 * The tabs a page offers.
 *
 * `detailApart` is the one axis option that changes the split rather than the
 * arrangement, so it is a parameter here instead of a second section list —
 * every layout then draws whatever it is handed.
 */
export function tabsFor(
  workspace: ReportWorkspace,
  entity: AnyEntityView,
  options: { detailApart?: boolean } = {}
): PageTab[] {
  const overviewBlocks: PageBlockId[] = ['lead', 'facts', 'access']
  const detailBlocks: PageBlockId[] = []

  if (hasAuthoredBody(entity)) {
    if (options.detailApart) detailBlocks.push('detail')
    else overviewBlocks.push('detail')
  }

  if (counterpartsOf(workspace, entity).length) overviewBlocks.push('counterparts')
  overviewBlocks.push('connections')
  if (entity.supportingContent) overviewBlocks.push('supporting')

  const tabs: PageTab[] = [{
    id: 'overview',
    label: 'Overview',
    blocks: overviewBlocks
  }]

  if (detailBlocks.length) {
    tabs.push({
      id: 'detail',
      label: isScenarioKind(entity.kind) ? 'The scenario' : 'Detail',
      hint: isScenarioKind(entity.kind)
        ? 'Trigger, steps, decisions and outcome.'
        : 'What the model authors about this entity.',
      blocks: detailBlocks
    })
  }

  const children = childrenOf(workspace, entity)
  if (entity.kind === 'capability' || entity.kind === 'journey') {
    tabs.push({
      id: 'scenarios',
      label: entity.kind === 'capability' ? 'Scenarios' : 'Scenarios',
      count: children.length,
      hint: entity.kind === 'capability'
        ? 'Each is one observable acceptance case for this Capability.'
        : 'Each is one path through this promise.',
      blocks: []
    })
  }

  if (GRAPH_LED.includes(entity.kind)) {
    tabs.push({
      id: 'diagram',
      label: 'Neighbourhood',
      hint: 'What it reaches, and what reaches it.',
      blocks: []
    })
  }

  if (entity.references.length) {
    tabs.push({ id: 'references', label: 'References', count: entity.references.length, blocks: ['references'] })
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

export const kindLabel = (kind: ReportEntityKind) => ENTITY_KIND_META[kind].label
