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

/**
 * The kinds a resource kind can be filtered and grouped by, in reading order:
 * who reaches it, where it lives, what it serves, what constrains it.
 */
export function facetKindsFor(kind: ReportResourceKind): ReportResourceKind[] {
  switch (kind) {
    case 'interface': return ['entity', 'experience', 'capability', 'screen', 'journey']
    case 'experience': return ['entity', 'interface', 'capability', 'domain', 'screen', 'journey']
    case 'screen': return ['interface', 'experience', 'capability', 'domain', 'entity', 'journey', 'capability-scenario', 'journey-scenario']
    case 'domain': return ['capability', 'entity', 'journey', 'screen', 'experience', 'rule']
    case 'entity': return ['domain', 'capability', 'screen', 'entity', 'rule', 'interface', 'experience', 'journey']
    case 'capability': return ['domain', 'entity', 'interface', 'experience', 'capability-scenario', 'journey-scenario', 'journey', 'screen', 'rule']
    case 'journey': return ['entity', 'interface', 'experience', 'capability', 'domain', 'screen', 'journey-scenario', 'rule']
    /* A Capability Scenario never names a Journey; offering the facet would be a permanently empty control. */
    case 'capability-scenario': return ['entity', 'capability', 'screen', 'rule']
    case 'journey-scenario': return ['entity', 'journey', 'capability', 'screen', 'rule']
    case 'rule': return ['domain', 'entity', 'capability', 'journey', 'capability-scenario', 'journey-scenario']
    default: return []
  }
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
