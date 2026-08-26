/**
 * The small set of facts that helps identify an element before its full reading.
 *
 * Context is deliberately absent. It has its own section because repeating a
 * place in both this strip and the Context section makes the summary compete
 * with the complete value. Pages and peeks share this definition so they cannot
 * quietly describe the same element differently.
 */
import type {
  ActorView,
  AnyElementView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportElementKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { INTERFACE_TYPE_META, resolveElement } from './reportWorkspace'

export interface ElementFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
}

export function elementFacts(workspace: ReportWorkspace, element: AnyElementView): ElementFact[] {
  const one = (kind: ReportElementKind, ids: string[]) =>
    resolveElement(workspace, kind, ids[0] ?? '')?.title ?? ''

  switch (element.kind) {
    case 'actor': {
      const actor = element as ActorView
      return [
        { label: 'Kind', value: actor.actorKind },
        { label: 'Relationship', value: actor.relationship },
        { label: 'Journeys', value: String(actor.journeyIds.length) }
      ]
    }
    case 'interface': {
      const item = element as InterfaceView
      return [
        { label: 'Type', value: INTERFACE_TYPE_META[item.interfaceType].label },
        { label: 'Experiences', value: String(item.experienceIds.length) },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'experience': {
      const item = element as ExperienceView
      return [
        { label: 'Interface', value: one('interface', item.interfaceIds), wide: true },
        { label: 'Access', value: item.accessMode },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'screen': {
      const screen = element as ScreenView
      return [
        { label: 'States', value: String(screen.states.length) },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'entity': {
      const entity = element as EntityView
      return [
        { label: 'Kept', value: String(entity.informationKept.length) },
        { label: 'States', value: String(entity.states.length) },
        { label: 'Transitions', value: String(entity.transitions.length) },
        { label: 'Changed by', value: String(entity.changedByIds.length) }
      ]
    }
    case 'domain': {
      const domain = element as DomainView
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length) },
        { label: 'Journeys reached', value: String(domain.journeyIds.length) },
        { label: 'Rules', value: String(domain.ruleIds.length) }
      ]
    }
    case 'capability': {
      const capability = element as CapabilityView
      return [
        { label: 'Scenarios', value: String(capability.scenarioIds.length) },
        { label: 'Journeys', value: String(capability.journeyIds.length) }
      ]
    }
    case 'journey': {
      const journey = element as JourneyView
      return [
        { label: 'Actor', value: one('actor', journey.actorIds), wide: true },
        { label: 'Scenarios', value: String(journey.scenarioIds.length) },
        { label: 'Steps', value: String(journey.stepCount) }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = element as ScenarioView
      const parent: ElementFact = scenario.scenarioType === 'capability'
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
      const rule = element as RuleView
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length) },
        { label: 'References', value: String(rule.references.length) }
      ]
    }
    default:
      return []
  }
}

export function elementBadge(workspace: ReportWorkspace, element: AnyElementView): string {
  switch (element.kind) {
    case 'actor': return `${(element as ActorView).actorKind} · ${(element as ActorView).relationship}`
    case 'experience': return (element as ExperienceView).accessMode
    case 'capability-scenario': return (element as ScenarioView).kindName
    case 'journey-scenario': return `${(element as ScenarioView).kindName} · ${(element as ScenarioView).result}`
    case 'capability': {
      const id = (element as CapabilityView).domainId
      return id ? resolveElement(workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
}
