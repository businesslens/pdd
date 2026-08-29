/**
 * The small set of facts that helps identify a resource before its full reading.
 *
 * Context is deliberately absent. It has its own section because repeating a
 * place in both this strip and the Context section makes the summary compete
 * with the complete value. Pages and peeks share this definition so they cannot
 * quietly describe the same resource differently.
 */
import type {
  ActorView,
  AnyResourceView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportResourceKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { INTERFACE_TYPE_META, resolveResource } from './reportWorkspace'

export interface ResourceFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
}

export function resourceFacts(workspace: ReportWorkspace, resource: AnyResourceView): ResourceFact[] {
  const one = (kind: ReportResourceKind, ids: string[]) =>
    resolveResource(workspace, kind, ids[0] ?? '')?.title ?? ''

  switch (resource.kind) {
    case 'actor': {
      const actor = resource as ActorView
      return [
        { label: 'Kind', value: actor.actorKind },
        { label: 'Relationship', value: actor.relationship },
        { label: 'Journeys', value: String(actor.journeyIds.length) }
      ]
    }
    case 'interface': {
      const item = resource as InterfaceView
      return [
        { label: 'Type', value: INTERFACE_TYPE_META[item.interfaceType].label },
        { label: 'Experiences', value: String(item.experienceIds.length) },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'experience': {
      const item = resource as ExperienceView
      return [
        { label: 'Interface', value: one('interface', item.interfaceIds), wide: true },
        { label: 'Access', value: item.accessMode },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'screen': {
      const screen = resource as ScreenView
      return [
        { label: 'States', value: String(screen.states.length) },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'entity': {
      const entity = resource as EntityView
      return [
        { label: 'Kept', value: String(entity.informationKept.length) },
        { label: 'States', value: String(entity.states.length) },
        { label: 'Transitions', value: String(entity.transitions.length) },
        { label: 'Changed by', value: String(entity.changedByIds.length) }
      ]
    }
    case 'domain': {
      const domain = resource as DomainView
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length) },
        { label: 'Journeys reached', value: String(domain.journeyIds.length) },
        { label: 'Rules', value: String(domain.ruleIds.length) }
      ]
    }
    case 'capability': {
      const capability = resource as CapabilityView
      return [
        { label: 'Scenarios', value: String(capability.scenarioIds.length) },
        { label: 'Journeys', value: String(capability.journeyIds.length) }
      ]
    }
    case 'journey': {
      const journey = resource as JourneyView
      return [
        { label: 'Actor', value: one('actor', journey.actorIds), wide: true },
        { label: 'Scenarios', value: String(journey.scenarioIds.length) },
        { label: 'Steps', value: String(journey.stepCount) }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = resource as ScenarioView
      const parent: ResourceFact = scenario.scenarioType === 'capability'
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
      const rule = resource as RuleView
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length) },
        { label: 'References', value: String(rule.references.length) }
      ]
    }
    default:
      return []
  }
}

export function resourceBadge(workspace: ReportWorkspace, resource: AnyResourceView): string {
  switch (resource.kind) {
    case 'actor': return `${(resource as ActorView).actorKind} · ${(resource as ActorView).relationship}`
    case 'experience': return (resource as ExperienceView).accessMode
    case 'capability-scenario': return (resource as ScenarioView).kindName
    case 'journey-scenario': return `${(resource as ScenarioView).kindName} · ${(resource as ScenarioView).result}`
    case 'capability': {
      const id = (resource as CapabilityView).domainId
      return id ? resolveResource(workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
}
