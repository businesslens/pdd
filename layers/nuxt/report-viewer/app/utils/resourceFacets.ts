/**
 * Faceting and grouping over the projected workspace.
 *
 * Every resource view already carries its relations as id arrays — authored in
 * one direction, back-filled in the other by `projectReportWorkspace`. This
 * module is the one place that reads them generically, so the Product Report can
 * offer consistent filters without a per-kind branch for each relation.
 *
 * Nothing here derives new relations: a facet is only ever an id array the
 * projection already holds.
 */

import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'
import { resourceCardPresentation } from './resourceCards'

/** The resources of one kind, in authored order. */
export function resourcesOfKind(workspace: ReportWorkspace, kind: ReportResourceKind): AnyResourceView[] {
  switch (kind) {
    case 'interface': return workspace.interfaces
    case 'experience': return workspace.experiences
    case 'screen': return workspace.screens
    case 'domain': return workspace.domains
    case 'entity': return workspace.entities
    case 'capability': return workspace.capabilities
    case 'journey': return workspace.journeys
    case 'capability-scenario': return workspace.capabilityScenarios
    case 'journey-scenario': return workspace.journeyScenarios
    case 'rule': return workspace.rules
    default: return []
  }
}

/**
 * The ids one resource declares toward one kind.
 *
 * Availability is expanded to its Interface and Experience ids so "reachable
 * in this Experience" faceting works for the kinds that record access as
 * resolved Contexts rather than as plain id lists.
 */
export function relatedIds(resource: AnyResourceView, kind: ReportResourceKind): string[] {
  switch (resource.kind) {
    case 'interface':
      if (kind === 'entity') return resource.actorIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'screen') return resource.screenIds
      if (kind === 'journey') return resource.journeyIds
      return []
    case 'experience':
      if (kind === 'entity') return resource.actorIds
      if (kind === 'interface') return resource.interfaceIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'domain') return resource.domainIds
      if (kind === 'screen') return resource.screenIds
      if (kind === 'journey') return resource.journeyIds
      return []
    case 'screen':
      if (kind === 'entity') return resource.entityIds
      if (kind === 'interface') return resource.interfaceIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'domain') return resource.domainIds
      if (kind === 'journey') return resource.journeyIds
      if (kind === 'capability-scenario') return resource.capabilityScenarioIds
      if (kind === 'journey-scenario') return resource.journeyScenarioIds
      return []
    case 'entity':
      if (kind === 'domain') return resource.domainId ? [resource.domainId] : []
      if (kind === 'capability') return resource.changedByIds
      if (kind === 'screen') return resource.presentedOnIds
      if (kind === 'entity') return resource.relations.map(relation => relation.entityId)
      if (kind === 'rule') return resource.ruleIds
      /* Where it acts; empty for a thing that does not. */
      if (kind === 'interface') return resource.interfaceIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'journey') return resource.journeyIds
      if (kind === 'capability-scenario') return resource.actorCapabilityScenarioIds
      if (kind === 'journey-scenario') return resource.actorJourneyScenarioIds
      return []
    case 'domain':
      if (kind === 'entity') return resource.entityIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'journey') return resource.journeyIds
      if (kind === 'screen') return resource.screenIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'rule') return resource.ruleIds
      return []
    case 'capability':
      if (kind === 'domain') return resource.domainId ? [resource.domainId] : []
      if (kind === 'entity') return resource.entityIds
      if (kind === 'interface') return resource.interfaceIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'journey') return resource.journeyIds
      if (kind === 'screen') return resource.screenIds
      if (kind === 'rule') return resource.ruleIds
      if (kind === 'capability-scenario') return resource.scenarioIds
      if (kind === 'journey-scenario') return resource.journeyScenarioIds
      return []
    case 'journey':
      /* A Journey involves the things it changes and the Actors who pursue it, and both are Entities. */
      if (kind === 'entity') return [...new Set([...resource.entityIds, ...resource.actorIds])]
      if (kind === 'interface') return resource.interfaceIds
      if (kind === 'experience') return resource.experienceIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'domain') return resource.domainIds
      if (kind === 'screen') return resource.screenIds
      if (kind === 'journey-scenario') return resource.scenarioIds
      if (kind === 'rule') return resource.ruleIds
      return []
    case 'capability-scenario':
      if (kind === 'entity') return [...new Set([...resource.entityIds, ...resource.actorIds])]
      if (kind === 'capability') return [resource.capabilityId]
      if (kind === 'screen') return resource.screenIds
      if (kind === 'rule') return resource.ruleIds
      return []
    case 'journey-scenario':
      if (kind === 'entity') return [...new Set([...resource.entityIds, ...resource.actorIds])]
      if (kind === 'capability') return [...new Set(resource.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : []))]
      if (kind === 'journey') return resource.journeyId ? [resource.journeyId] : []
      if (kind === 'screen') return resource.screenIds
      if (kind === 'rule') return resource.ruleIds
      return []
    case 'rule':
      if (kind === 'domain') return resource.domainIds
      if (kind === 'entity') return resource.entityIds
      if (kind === 'capability') return resource.capabilityIds
      if (kind === 'journey') return resource.journeyIds
      if (kind === 'capability-scenario') return resource.capabilityScenarioIds
      if (kind === 'journey-scenario') return resource.journeyScenarioIds
      return []
    default:
      return []
  }
}

/** Reading order for whatever a collection turns out to offer. */
const FACET_ORDER: ReportResourceKind[] = [
  'domain', 'entity', 'interface', 'experience', 'screen',
  'capability', 'journey', 'capability-scenario', 'journey-scenario', 'rule'
]

/**
 * The kinds a collection can be filtered by: exactly the relations its own rows
 * already print.
 *
 * A facet the reader cannot see on a card is a correlation they have to take on
 * trust, and a hand-kept list drifts from the card the moment either changes.
 * So the offer is derived from the card itself — every metric that names a kind,
 * plus the Domain a card carries as its badge — and a collection that prints
 * nothing relational offers no filter at all.
 */
export function facetKindsFor(workspace: ReportWorkspace, kind: ReportResourceKind): ReportResourceKind[] {
  const printed = new Set<ReportResourceKind>()
  for (const resource of resourcesOfKind(workspace, kind)) {
    if (relatedIds(resource, 'domain').length) printed.add('domain')
    for (const metric of resourceCardPresentation(workspace, resource).metrics) {
      if (metric.kind) printed.add(metric.kind)
    }
  }
  return FACET_ORDER.filter(item => item !== kind && printed.has(item))
}

/**
 * The one grouping rule: Domain, wherever the type carries one.
 *
 * Nothing here is configurable. Offering every related kind as a grouping axis
 * was a view builder wearing a select menu — "Capabilities by Journeys" states
 * no derivation and nothing is accountable for it — while a single authored
 * axis is a fact about the model the reader can challenge from `docs/`.
 */
export const GROUPING_KIND: Partial<Record<ReportResourceKind, ReportResourceKind>> = {
  entity: 'domain',
  capability: 'domain',
  rule: 'domain'
}

export type FacetSelections = Partial<Record<ReportResourceKind, string[]>>

/** True when any value is selected in any facet. */
export function hasSelections(selections: FacetSelections): boolean {
  return Object.values(selections).some(ids => ids && ids.length > 0)
}

/**
 * Narrow a list: OR within one facet, AND across facets.
 *
 * "Screens in the Web Interface, used by Checkout or Search" is the shape a
 * reader expects, and it is the only combination that stays truthful when a
 * facet holds several values.
 */
export function filterResources<T extends AnyResourceView>(resources: T[], selections: FacetSelections): T[] {
  const active = Object.entries(selections)
    .filter((entry): entry is [ReportResourceKind, string[]] => Boolean(entry[1]?.length))
  if (!active.length) return resources
  return resources.filter(resource => active.every(([kind, ids]) => {
    const related = new Set(relatedIds(resource, kind))
    return ids.some(id => related.has(id))
  }))
}

/**
 * A collection's groups, under the fixed rule.
 *
 * Entities that act lead their own collection in a group of their own: who the
 * Product is for is the question the rail is opened with, and it was previously
 * answered by an invisible sort that no header explained.
 */
export function collectionGroups<T extends AnyResourceView>(
  workspace: ReportWorkspace,
  kind: ReportResourceKind,
  resources: T[]
): Array<ResourceGroup<T>> {
  const by = GROUPING_KIND[kind]
  if (!by) return [{ key: '', title: '', kind: null, resources }]
  const unassigned = `No ${ENTITY_KIND_META[by].label}`
  if (kind !== 'entity') return groupResources(workspace, resources, by, unassigned)

  const acts = (resource: AnyResourceView) => resource.kind === 'entity' && Boolean(resource.acts)
  const actors = resources.filter(acts)
  const kept = resources.filter(resource => !acts(resource))
  return [
    ...(actors.length ? [{ key: 'actors', title: 'Actors', kind: 'entity' as ReportResourceKind, resources: actors }] : []),
    ...groupResources(workspace, kept, by, unassigned)
  ]
}

export interface ResourceGroup<T extends AnyResourceView = AnyResourceView> {
  /** The grouping resource's id; `''` for the trailing unassigned bucket. */
  key: string
  title: string
  /** The kind of the grouping resource, or `null` for the unassigned bucket. */
  kind: ReportResourceKind | null
  resources: T[]
}

/**
 * Group a list by its relation to another kind.
 *
 * A resource that declares several relations appears under each of them — the
 * model says it belongs to all, and dropping it from any but the first would
 * be a quiet edit. Resources declaring none land in one trailing bucket, which
 * is only emitted when it has members.
 */
export function groupResources<T extends AnyResourceView>(
  workspace: ReportWorkspace,
  resources: T[],
  by: ReportResourceKind | null,
  unassignedLabel = 'Unassigned'
): Array<ResourceGroup<T>> {
  if (!by) return [{ key: '', title: '', kind: null, resources }]

  const groups: Array<ResourceGroup<T>> = []
  const seen = new Map<string, ResourceGroup<T>>()
  for (const owner of resourcesOfKind(workspace, by)) {
    const group: ResourceGroup<T> = { key: owner.id, title: owner.title, kind: by, resources: [] }
    groups.push(group)
    seen.set(owner.id, group)
  }

  const unassigned: ResourceGroup<T> = { key: '', title: unassignedLabel, kind: null, resources: [] }
  for (const resource of resources) {
    const ids = relatedIds(resource, by).filter(id => seen.has(id))
    if (!ids.length) {
      unassigned.resources.push(resource)
      continue
    }
    for (const id of ids) seen.get(id)!.resources.push(resource)
  }

  const populated = groups.filter(group => group.resources.length)
  if (unassigned.resources.length) populated.push(unassigned)
  return populated
}
