/**
 * Faceting and grouping over the projected workspace.
 *
 * Every entity view already carries its relations as id arrays — authored in
 * one direction, back-filled in the other by `projectReportWorkspace`. This
 * module is the one place that reads them generically, so the Workbench can
 * offer consistent filters without a per-kind branch for each relation.
 *
 * Nothing here derives new relations: a facet is only ever an id array the
 * projection already holds.
 */

import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './reportWorkspace'

/** The entities of one kind, in authored order. */
export function entitiesOfKind(workspace: ReportWorkspace, kind: ReportEntityKind): AnyEntityView[] {
  switch (kind) {
    case 'actor': return workspace.actors
    case 'interface': return workspace.interfaces
    case 'experience': return workspace.experiences
    case 'screen': return workspace.screens
    case 'domain': return workspace.domains
    case 'capability': return workspace.capabilities
    case 'journey': return workspace.journeys
    case 'capability-scenario': return workspace.capabilityScenarios
    case 'journey-scenario': return workspace.journeyScenarios
    case 'rule': return workspace.rules
    default: return []
  }
}

/**
 * The ids one entity declares toward one kind.
 *
 * Availability is expanded to its Interface and Experience ids so "reachable
 * in this Experience" faceting works for the kinds that record access as
 * resolved Contexts rather than as plain id lists.
 */
export function relatedIds(entity: AnyEntityView, kind: ReportEntityKind): string[] {
  switch (entity.kind) {
    case 'actor':
      if (kind === 'interface') return entity.interfaceIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'journey') return entity.journeyIds
      if (kind === 'capability-scenario') return entity.capabilityScenarioIds
      if (kind === 'journey-scenario') return entity.journeyScenarioIds
      return []
    case 'interface':
      if (kind === 'actor') return entity.actorIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'screen') return entity.screenIds
      if (kind === 'journey') return entity.journeyIds
      return []
    case 'experience':
      if (kind === 'actor') return entity.actorIds
      if (kind === 'interface') return entity.interfaceIds
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'domain') return entity.domainIds
      if (kind === 'screen') return entity.screenIds
      if (kind === 'journey') return entity.journeyIds
      return []
    case 'screen':
      if (kind === 'interface') return entity.interfaceIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'domain') return entity.domainIds
      if (kind === 'journey') return entity.journeyIds
      if (kind === 'capability-scenario') return entity.capabilityScenarioIds
      if (kind === 'journey-scenario') return entity.journeyScenarioIds
      return []
    case 'domain':
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'journey') return entity.journeyIds
      if (kind === 'screen') return entity.screenIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'rule') return entity.ruleIds
      return []
    case 'capability':
      if (kind === 'domain') return entity.domainId ? [entity.domainId] : []
      if (kind === 'interface') return entity.interfaceIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'journey') return entity.journeyIds
      if (kind === 'screen') return entity.screenIds
      if (kind === 'rule') return entity.ruleIds
      if (kind === 'capability-scenario') return entity.scenarioIds
      if (kind === 'journey-scenario') return entity.journeyScenarioIds
      return []
    case 'journey':
      if (kind === 'actor') return entity.actorIds
      if (kind === 'interface') return entity.interfaceIds
      if (kind === 'experience') return entity.experienceIds
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'domain') return entity.domainIds
      if (kind === 'screen') return entity.screenIds
      if (kind === 'journey-scenario') return entity.scenarioIds
      if (kind === 'rule') return entity.ruleIds
      return []
    case 'capability-scenario':
      if (kind === 'actor') return entity.actorIds
      if (kind === 'capability') return [entity.capabilityId]
      if (kind === 'screen') return entity.screenIds
      if (kind === 'rule') return entity.ruleIds
      return []
    case 'journey-scenario':
      if (kind === 'actor') return entity.actorIds
      if (kind === 'capability') return [...new Set(entity.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : []))]
      if (kind === 'journey') return entity.journeyId ? [entity.journeyId] : []
      if (kind === 'screen') return entity.screenIds
      if (kind === 'rule') return entity.ruleIds
      return []
    case 'rule':
      if (kind === 'domain') return entity.domainIds
      if (kind === 'capability') return entity.capabilityIds
      if (kind === 'journey') return entity.journeyIds
      if (kind === 'capability-scenario') return entity.capabilityScenarioIds
      if (kind === 'journey-scenario') return entity.journeyScenarioIds
      return []
    default:
      return []
  }
}

/**
 * The kinds an entity kind can be filtered and grouped by, in reading order:
 * who reaches it, where it lives, what it serves, what constrains it.
 */
export function facetKindsFor(kind: ReportEntityKind): ReportEntityKind[] {
  switch (kind) {
    case 'actor': return ['interface', 'experience', 'journey', 'capability-scenario', 'journey-scenario']
    case 'interface': return ['actor', 'experience', 'capability', 'screen', 'journey']
    case 'experience': return ['actor', 'interface', 'capability', 'domain', 'screen', 'journey']
    case 'screen': return ['interface', 'experience', 'capability', 'domain', 'journey', 'capability-scenario', 'journey-scenario']
    case 'domain': return ['capability', 'journey', 'screen', 'experience', 'rule']
    case 'capability': return ['domain', 'interface', 'experience', 'capability-scenario', 'journey-scenario', 'journey', 'screen', 'rule']
    case 'journey': return ['actor', 'interface', 'experience', 'capability', 'domain', 'screen', 'journey-scenario', 'rule']
    /* A Capability Scenario never names a Journey; offering the facet would be a permanently empty control. */
    case 'capability-scenario': return ['actor', 'capability', 'screen', 'rule']
    case 'journey-scenario': return ['actor', 'journey', 'capability', 'screen', 'rule']
    case 'rule': return ['domain', 'capability', 'journey', 'capability-scenario', 'journey-scenario']
    default: return []
  }
}

export type FacetSelections = Partial<Record<ReportEntityKind, string[]>>

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
export function filterEntities<T extends AnyEntityView>(entities: T[], selections: FacetSelections): T[] {
  const active = Object.entries(selections)
    .filter((entry): entry is [ReportEntityKind, string[]] => Boolean(entry[1]?.length))
  if (!active.length) return entities
  return entities.filter(entity => active.every(([kind, ids]) => {
    const related = new Set(relatedIds(entity, kind))
    return ids.some(id => related.has(id))
  }))
}

export interface EntityGroup<T extends AnyEntityView = AnyEntityView> {
  /** The grouping entity's id; `''` for the trailing unassigned bucket. */
  key: string
  title: string
  /** The kind of the grouping entity, or `null` for the unassigned bucket. */
  kind: ReportEntityKind | null
  entities: T[]
}

/**
 * Group a list by its relation to another kind.
 *
 * An entity that declares several relations appears under each of them — the
 * model says it belongs to all, and dropping it from any but the first would
 * be a quiet edit. Entities declaring none land in one trailing bucket, which
 * is only emitted when it has members.
 */
export function groupEntities<T extends AnyEntityView>(
  workspace: ReportWorkspace,
  entities: T[],
  by: ReportEntityKind | null,
  unassignedLabel = 'Unassigned'
): Array<EntityGroup<T>> {
  if (!by) return [{ key: '', title: '', kind: null, entities }]

  const groups: Array<EntityGroup<T>> = []
  const seen = new Map<string, EntityGroup<T>>()
  for (const owner of entitiesOfKind(workspace, by)) {
    const group: EntityGroup<T> = { key: owner.id, title: owner.title, kind: by, entities: [] }
    groups.push(group)
    seen.set(owner.id, group)
  }

  const unassigned: EntityGroup<T> = { key: '', title: unassignedLabel, kind: null, entities: [] }
  for (const entity of entities) {
    const ids = relatedIds(entity, by).filter(id => seen.has(id))
    if (!ids.length) {
      unassigned.entities.push(entity)
      continue
    }
    for (const id of ids) seen.get(id)!.entities.push(entity)
  }

  const populated = groups.filter(group => group.entities.length)
  if (unassigned.entities.length) populated.push(unassigned)
  return populated
}
