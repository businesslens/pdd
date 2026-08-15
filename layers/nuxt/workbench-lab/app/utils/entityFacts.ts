/**
 * The facts that give an entity its shape, in one place.
 *
 * The page and the slideover render the same reading, so they must draw from
 * the same description — a panel that quietly shows different facts is the
 * thing that made the old peek hard to trust.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from './model'
import { resolveEntity } from './model'

export interface EntityFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
}

const scopeOf = (entity: AnyEntityView): string => {
  if (!('availability' in entity)) return ''
  const pairs = entity.availability as Array<{ interfaceTitle: string, experienceTitle: string }>
  const [first] = pairs
  if (!first) return ''
  const name = first.experienceTitle ? `${first.interfaceTitle} › ${first.experienceTitle}` : first.interfaceTitle
  return pairs.length > 1 ? `${name} +${pairs.length - 1}` : name
}

export function entityFacts(workspace: ReportWorkspace, entity: AnyEntityView): EntityFact[] {
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
      const parent: EntityFact = scenario.scenarioType === 'capability'
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

export function entityBadge(workspace: ReportWorkspace, entity: AnyEntityView): string {
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
