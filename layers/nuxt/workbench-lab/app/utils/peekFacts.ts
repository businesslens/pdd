/**
 * What a peek knows about an entity, independent of how it draws it.
 *
 * The five peek variations differ in *visualization*, so they must not differ
 * in content — otherwise the audition compares two different summaries rather
 * than two ways of showing one. Everything they render comes from here.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './model'
import { ENTITY_KIND_META, relatedIds, resolveEntity } from './model'

export interface PeekFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
}

export interface PeekRelation {
  kind: ReportEntityKind
  label: string
  ids: string[]
  derived: boolean
}

const scopeOf = (entity: AnyEntityView): string => {
  if (!('availability' in entity)) return ''
  const pairs = entity.availability as Array<{ interfaceTitle: string, experienceTitle: string }>
  const [first] = pairs
  if (!first) return ''
  const name = first.experienceTitle ? `${first.interfaceTitle} › ${first.experienceTitle}` : first.interfaceTitle
  return pairs.length > 1 ? `${name} +${pairs.length - 1}` : name
}

export function peekFacts(workspace: ReportWorkspace, entity: AnyEntityView): PeekFact[] {
  const one = (kind: ReportEntityKind, ids: string[]) =>
    resolveEntity(workspace, kind, ids[0] ?? '')?.title ?? ''

  switch (entity.kind) {
    case 'actor': {
      const actor = entity as { actorKind: string, relationship: string, journeyIds: string[] }
      return [
        { label: 'Kind', value: actor.actorKind },
        { label: 'Relationship', value: actor.relationship },
        { label: 'Journeys', value: String(actor.journeyIds.length) }
      ]
    }
    case 'interface': {
      const item = entity as { experienceIds: string[], screenIds: string[], entryPoints: unknown[] }
      return [
        { label: 'Experiences', value: String(item.experienceIds.length) },
        { label: 'Screens', value: String(item.screenIds.length) },
        { label: 'Entry points', value: String(item.entryPoints.length) }
      ]
    }
    case 'experience': {
      const item = entity as { interfaceIds: string[], accessMode: string, screenIds: string[] }
      return [
        { label: 'Interface', value: one('interface', item.interfaceIds), wide: true },
        { label: 'Access', value: item.accessMode },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'screen': {
      const screen = entity as { states: unknown[], actions: unknown[] }
      return [
        { label: 'Scope', value: scopeOf(entity), wide: true },
        { label: 'States', value: String(screen.states.length) },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'domain': {
      const domain = entity as { capabilityIds: string[], journeyIds: string[], ruleIds: string[] }
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length) },
        { label: 'Journeys reached', value: String(domain.journeyIds.length) },
        { label: 'Rules', value: String(domain.ruleIds.length) }
      ]
    }
    case 'capability': {
      const capability = entity as { scenarioIds: string[], journeyIds: string[] }
      return [
        { label: 'Scope', value: scopeOf(entity), wide: true },
        { label: 'Scenarios', value: String(capability.scenarioIds.length) },
        { label: 'Journeys', value: String(capability.journeyIds.length) }
      ]
    }
    case 'journey': {
      const journey = entity as { actorIds: string[], scenarioIds: string[], stepCount: number }
      return [
        { label: 'Actor', value: one('actor', journey.actorIds), wide: true },
        { label: 'Scenarios', value: String(journey.scenarioIds.length) },
        { label: 'Steps', value: String(journey.stepCount) }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = entity as {
        scenarioType: string
        capabilityTitle: string
        journeyTitle: string
        steps: unknown[]
        result: string
        screenIds: string[]
      }
      const parent: PeekFact = scenario.scenarioType === 'capability'
        ? { label: 'Capability', value: scenario.capabilityTitle, wide: true }
        : { label: 'Journey', value: scenario.journeyTitle, wide: true }
      return [
        parent,
        { label: 'Steps', value: String(scenario.steps.length) },
        scenario.result
          ? { label: 'Result', value: scenario.result }
          : { label: 'Screens', value: String(scenario.screenIds.length) }
      ]
    }
    case 'rule': {
      const rule = entity as { appliesTo: unknown[], availability: unknown[], references: unknown[] }
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length) },
        { label: 'Scopes', value: String(rule.availability.length) },
        { label: 'References', value: String(rule.references.length) }
      ]
    }
    default:
      return []
  }
}

export function peekBadge(workspace: ReportWorkspace, entity: AnyEntityView): string {
  switch (entity.kind) {
    case 'actor': {
      const actor = entity as { actorKind: string, relationship: string }
      return `${actor.actorKind} · ${actor.relationship}`
    }
    case 'experience': return (entity as { accessMode: string }).accessMode
    case 'capability-scenario': return (entity as { kindName: string }).kindName
    case 'journey-scenario': {
      const scenario = entity as { kindName: string, result: string }
      return `${scenario.kindName} · ${scenario.result}`
    }
    case 'capability': {
      const id = (entity as { domainId: string }).domainId
      return id ? resolveEntity(workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
}

/**
 * Relations collapsed to one row per kind.
 *
 * The shipped peek keeps every authored label, which is right on a page — the
 * two ways a Screen reaches a Journey are genuinely different derivations. In a
 * panel it produces five near-identical rows with sentence-long labels, so the
 * variations that need compactness fold by kind and say so.
 */
export function peekRelationsByKind(entity: AnyEntityView): PeekRelation[] {
  const KINDS: ReportEntityKind[] = [
    'actor', 'interface', 'experience', 'screen', 'domain',
    'capability', 'journey', 'capability-scenario', 'journey-scenario', 'rule'
  ]
  return KINDS
    .map((kind) => {
      const ids = [...new Set(relatedIds(entity, kind))]
      return {
        kind,
        label: ENTITY_KIND_META[kind].plural,
        ids,
        derived: false
      }
    })
    .filter(relation => relation.ids.length > 0)
}

/** The names behind a relation, disambiguating counterparts only when needed. */
export function relationTitles(
  workspace: ReportWorkspace,
  kind: ReportEntityKind,
  ids: string[]
): Array<{ id: string, title: string }> {
  return ids.map((id) => {
    const entity = resolveEntity(workspace, kind, id)
    if (!entity) return { id, title: id }
    const clash = ids.some(other => other !== id
      && resolveEntity(workspace, kind, other)?.title === entity.title)
    if (!clash) return { id, title: entity.title }
    const [surface] = entity.id.split('::')
    if (!surface || surface === entity.id) return { id, title: entity.title }
    const owner = resolveEntity(workspace, 'interface', surface)?.title ?? surface
    return { id, title: `${entity.title} · ${owner.replace(/ application$/, '')}` }
  })
}
