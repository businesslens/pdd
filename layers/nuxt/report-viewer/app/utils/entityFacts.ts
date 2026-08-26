/**
 * The small set of facts that helps identify an entity before its full reading.
 *
 * Context is deliberately absent. It has its own section because repeating a
 * place in both this strip and the Context section makes the summary compete
 * with the complete value. Pages and peeks share this definition so they cannot
 * quietly describe the same entity differently.
 */
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { INTERFACE_TYPE_META, resolveEntity } from './reportWorkspace'

export interface EntityFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
}

export function entityFacts(workspace: ReportWorkspace, entity: AnyEntityView): EntityFact[] {
  const one = (kind: ReportEntityKind, ids: string[]) =>
    resolveEntity(workspace, kind, ids[0] ?? '')?.title ?? ''

  switch (entity.kind) {
    case 'actor': {
      const actor = entity as ActorView
      return [
        { label: 'Kind', value: actor.actorKind },
        { label: 'Relationship', value: actor.relationship },
        { label: 'Journeys', value: String(actor.journeyIds.length) }
      ]
    }
    case 'interface': {
      const item = entity as InterfaceView
      return [
        { label: 'Type', value: INTERFACE_TYPE_META[item.interfaceType].label },
        { label: 'Experiences', value: String(item.experienceIds.length) },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'experience': {
      const item = entity as ExperienceView
      return [
        { label: 'Interface', value: one('interface', item.interfaceIds), wide: true },
        { label: 'Access', value: item.accessMode },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'screen': {
      const screen = entity as ScreenView
      return [
        { label: 'States', value: String(screen.states.length) },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'object': {
      const object = entity as ObjectView
      return [
        { label: 'States', value: String(object.states.length) },
        { label: 'Transitions', value: String(object.transitions.length) }
      ]
    }
    case 'domain': {
      const domain = entity as DomainView
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length) },
        { label: 'Journeys reached', value: String(domain.journeyIds.length) },
        { label: 'Rules', value: String(domain.ruleIds.length) }
      ]
    }
    case 'capability': {
      const capability = entity as CapabilityView
      return [
        { label: 'Scenarios', value: String(capability.scenarioIds.length) },
        { label: 'Journeys', value: String(capability.journeyIds.length) }
      ]
    }
    case 'journey': {
      const journey = entity as JourneyView
      return [
        { label: 'Actor', value: one('actor', journey.actorIds), wide: true },
        { label: 'Scenarios', value: String(journey.scenarioIds.length) },
        { label: 'Steps', value: String(journey.stepCount) }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = entity as ScenarioView
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
      const rule = entity as RuleView
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length) },
        { label: 'References', value: String(rule.references.length) }
      ]
    }
    default:
      return []
  }
}

export function entityBadge(workspace: ReportWorkspace, entity: AnyEntityView): string {
  switch (entity.kind) {
    case 'actor': return `${(entity as ActorView).actorKind} · ${(entity as ActorView).relationship}`
    case 'experience': return (entity as ExperienceView).accessMode
    case 'capability-scenario': return (entity as ScenarioView).kindName
    case 'journey-scenario': return `${(entity as ScenarioView).kindName} · ${(entity as ScenarioView).result}`
    case 'capability': {
      const id = (entity as CapabilityView).domainId
      return id ? resolveEntity(workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
}
