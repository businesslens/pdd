/**
 * Faceting and grouping over the projected workspace.
 *
 * Every element view already carries its relations as id arrays — authored in
 * one direction, back-filled in the other by `projectReportWorkspace`. This
 * module is the one place that reads them generically, so the Product Report can
 * offer consistent filters without a per-kind branch for each relation.
 *
 * Nothing here derives new relations: a facet is only ever an id array the
 * projection already holds.
 */

import type { AnyElementView, ReportElementKind, ReportWorkspace } from './reportWorkspace'

/** The elements of one kind, in authored order. */
export function elementsOfKind(workspace: ReportWorkspace, kind: ReportElementKind): AnyElementView[] {
  switch (kind) {
    case 'actor': return workspace.actors
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
 * The ids one element declares toward one kind.
 *
 * Availability is expanded to its Interface and Experience ids so "reachable
 * in this Experience" faceting works for the kinds that record access as
 * resolved Contexts rather than as plain id lists.
 */
export function relatedIds(element: AnyElementView, kind: ReportElementKind): string[] {
  switch (element.kind) {
    case 'actor':
      if (kind === 'interface') return element.interfaceIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'journey') return element.journeyIds
      if (kind === 'capability-scenario') return element.capabilityScenarioIds
      if (kind === 'journey-scenario') return element.journeyScenarioIds
      return []
    case 'interface':
      if (kind === 'actor') return element.actorIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'screen') return element.screenIds
      if (kind === 'journey') return element.journeyIds
      return []
    case 'experience':
      if (kind === 'actor') return element.actorIds
      if (kind === 'interface') return element.interfaceIds
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'domain') return element.domainIds
      if (kind === 'screen') return element.screenIds
      if (kind === 'journey') return element.journeyIds
      return []
    case 'screen':
      if (kind === 'interface') return element.interfaceIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'domain') return element.domainIds
      if (kind === 'journey') return element.journeyIds
      if (kind === 'capability-scenario') return element.capabilityScenarioIds
      if (kind === 'journey-scenario') return element.journeyScenarioIds
      return []
    case 'entity':
      if (kind === 'domain') return element.domainId ? [element.domainId] : []
      if (kind === 'capability') return element.changedByIds
      if (kind === 'screen') return element.presentedOnIds
      if (kind === 'entity') return element.relations.map(relation => relation.entityId)
      return []
    case 'domain':
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'journey') return element.journeyIds
      if (kind === 'screen') return element.screenIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'rule') return element.ruleIds
      return []
    case 'capability':
      if (kind === 'domain') return element.domainId ? [element.domainId] : []
      if (kind === 'entity') return element.entityIds
      if (kind === 'interface') return element.interfaceIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'journey') return element.journeyIds
      if (kind === 'screen') return element.screenIds
      if (kind === 'rule') return element.ruleIds
      if (kind === 'capability-scenario') return element.scenarioIds
      if (kind === 'journey-scenario') return element.journeyScenarioIds
      return []
    case 'journey':
      if (kind === 'actor') return element.actorIds
      if (kind === 'interface') return element.interfaceIds
      if (kind === 'experience') return element.experienceIds
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'domain') return element.domainIds
      if (kind === 'screen') return element.screenIds
      if (kind === 'journey-scenario') return element.scenarioIds
      if (kind === 'rule') return element.ruleIds
      return []
    case 'capability-scenario':
      if (kind === 'entity') return element.entityIds
      if (kind === 'actor') return element.actorIds
      if (kind === 'capability') return [element.capabilityId]
      if (kind === 'screen') return element.screenIds
      if (kind === 'rule') return element.ruleIds
      return []
    case 'journey-scenario':
      if (kind === 'entity') return element.entityIds
      if (kind === 'actor') return element.actorIds
      if (kind === 'capability') return [...new Set(element.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : []))]
      if (kind === 'journey') return element.journeyId ? [element.journeyId] : []
      if (kind === 'screen') return element.screenIds
      if (kind === 'rule') return element.ruleIds
      return []
    case 'rule':
      if (kind === 'domain') return element.domainIds
      if (kind === 'capability') return element.capabilityIds
      if (kind === 'journey') return element.journeyIds
      if (kind === 'capability-scenario') return element.capabilityScenarioIds
      if (kind === 'journey-scenario') return element.journeyScenarioIds
      return []
    default:
      return []
  }
}

/**
 * The kinds an element kind can be filtered and grouped by, in reading order:
 * who reaches it, where it lives, what it serves, what constrains it.
 */
export function facetKindsFor(kind: ReportElementKind): ReportElementKind[] {
  switch (kind) {
    case 'actor': return ['interface', 'experience', 'journey', 'capability-scenario', 'journey-scenario']
    case 'interface': return ['actor', 'experience', 'capability', 'screen', 'journey']
    case 'experience': return ['actor', 'interface', 'capability', 'domain', 'screen', 'journey']
    case 'screen': return ['interface', 'experience', 'capability', 'domain', 'journey', 'capability-scenario', 'journey-scenario']
    case 'domain': return ['capability', 'journey', 'screen', 'experience', 'rule']
    case 'entity': return ['domain', 'capability', 'screen', 'entity']
    case 'capability': return ['domain', 'entity', 'interface', 'experience', 'capability-scenario', 'journey-scenario', 'journey', 'screen', 'rule']
    case 'journey': return ['actor', 'interface', 'experience', 'capability', 'domain', 'screen', 'journey-scenario', 'rule']
    /* A Capability Scenario never names a Journey; offering the facet would be a permanently empty control. */
    case 'capability-scenario': return ['actor', 'capability', 'entity', 'screen', 'rule']
    case 'journey-scenario': return ['actor', 'journey', 'capability', 'entity', 'screen', 'rule']
    case 'rule': return ['domain', 'capability', 'journey', 'capability-scenario', 'journey-scenario']
    default: return []
  }
}

export type FacetSelections = Partial<Record<ReportElementKind, string[]>>

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
export function filterElements<T extends AnyElementView>(elements: T[], selections: FacetSelections): T[] {
  const active = Object.entries(selections)
    .filter((entry): entry is [ReportElementKind, string[]] => Boolean(entry[1]?.length))
  if (!active.length) return elements
  return elements.filter(element => active.every(([kind, ids]) => {
    const related = new Set(relatedIds(element, kind))
    return ids.some(id => related.has(id))
  }))
}

export interface ElementGroup<T extends AnyElementView = AnyElementView> {
  /** The grouping element's id; `''` for the trailing unassigned bucket. */
  key: string
  title: string
  /** The kind of the grouping element, or `null` for the unassigned bucket. */
  kind: ReportElementKind | null
  elements: T[]
}

/**
 * Group a list by its relation to another kind.
 *
 * An element that declares several relations appears under each of them — the
 * model says it belongs to all, and dropping it from any but the first would
 * be a quiet edit. Elements declaring none land in one trailing bucket, which
 * is only emitted when it has members.
 */
export function groupElements<T extends AnyElementView>(
  workspace: ReportWorkspace,
  elements: T[],
  by: ReportElementKind | null,
  unassignedLabel = 'Unassigned'
): Array<ElementGroup<T>> {
  if (!by) return [{ key: '', title: '', kind: null, elements }]

  const groups: Array<ElementGroup<T>> = []
  const seen = new Map<string, ElementGroup<T>>()
  for (const owner of elementsOfKind(workspace, by)) {
    const group: ElementGroup<T> = { key: owner.id, title: owner.title, kind: by, elements: [] }
    groups.push(group)
    seen.set(owner.id, group)
  }

  const unassigned: ElementGroup<T> = { key: '', title: unassignedLabel, kind: null, elements: [] }
  for (const element of elements) {
    const ids = relatedIds(element, by).filter(id => seen.has(id))
    if (!ids.length) {
      unassigned.elements.push(element)
      continue
    }
    for (const id of ids) seen.get(id)!.elements.push(element)
  }

  const populated = groups.filter(group => group.elements.length)
  if (unassigned.elements.length) populated.push(unassigned)
  return populated
}
