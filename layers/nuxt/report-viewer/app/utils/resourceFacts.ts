/**
 * The small set of facts that helps identify a resource before its full reading.
 *
 * Context is deliberately absent. It has its own section because repeating a
 * place in both this strip and the Context section makes the summary compete
 * with the complete value. Pages and peeks share this definition so they cannot
 * quietly describe the same resource differently.
 */
import type {
  EntityView,
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
import type { VocabularySlug } from './vocabulary.generated'
import { KIND_TERM } from './vocabulary'

export interface ResourceFact {
  label: string
  value: string
  /** A name rather than a number: it wants width, and it identifies. */
  wide?: boolean
  /**
   * The word this label is, so a reader can ask what it means without leaving
   * the strip. A count of another kind names that kind: "Screens 4" is where a
   * reader first meets the word Screen, and it is the honest place to answer.
   */
  term?: VocabularySlug
}

export function resourceFacts(workspace: ReportWorkspace, resource: AnyResourceView): ResourceFact[] {
  const one = (kind: ReportResourceKind, ids: string[]) =>
    resolveResource(workspace, kind, ids[0] ?? '')?.title ?? ''

  switch (resource.kind) {
    case 'interface': {
      const item = resource as InterfaceView
      return [
        { label: 'Type', value: INTERFACE_TYPE_META[item.interfaceType].label, term: 'interface-type' },
        { label: 'Experiences', value: String(item.experienceIds.length), term: KIND_TERM.experience },
        { label: 'Screens', value: String(item.screenIds.length), term: KIND_TERM.screen }
      ]
    }
    case 'experience': {
      const item = resource as ExperienceView
      return [
        { label: 'Interface', value: one('interface', item.interfaceIds), wide: true, term: KIND_TERM.interface },
        { label: 'Access', value: item.accessMode, term: 'access-mode' },
        { label: 'Screens', value: String(item.screenIds.length), term: KIND_TERM.screen }
      ]
    }
    case 'screen': {
      const screen = resource as ScreenView
      return [
        { label: 'States', value: String(screen.states.length), term: 'view-state' },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'entity': {
      const entity = resource as EntityView
      if (entity.acts) {
        return [
          { label: 'Kind', value: entity.entityKind ?? '', term: 'actor' },
          { label: 'Acts', value: entity.acts, term: 'acts' },
          { label: 'Journeys', value: String(entity.journeyIds.length), term: KIND_TERM.journey },
          { label: 'Kept', value: String(entity.informationKept.length), term: 'information-kept' }
        ]
      }
      return [
        { label: 'Kept', value: String(entity.informationKept.length), term: 'information-kept' },
        { label: 'States', value: String(entity.states.length), term: 'state' },
        { label: 'Arcs', value: String(entity.arcs.length), term: 'arc' },
        { label: 'Changed by', value: String(entity.changedByIds.length), term: 'changed-by' }
      ]
    }
    case 'domain': {
      const domain = resource as DomainView
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length), term: KIND_TERM.capability },
        { label: 'Journeys reached', value: String(domain.journeyIds.length), term: KIND_TERM.journey },
        { label: 'Rules', value: String(domain.ruleIds.length), term: KIND_TERM.rule }
      ]
    }
    case 'capability': {
      const capability = resource as CapabilityView
      return [
        { label: 'Scenarios', value: String(capability.scenarioIds.length), term: KIND_TERM['capability-scenario'] },
        { label: 'Journeys', value: String(capability.journeyIds.length), term: KIND_TERM.journey }
      ]
    }
    case 'journey': {
      const journey = resource as JourneyView
      return [
        { label: 'Actor', value: one('entity', journey.actorIds), wide: true, term: 'actor' },
        { label: 'Scenarios', value: String(journey.scenarioIds.length), term: KIND_TERM['journey-scenario'] },
        { label: 'Steps', value: String(journey.stepCount), term: 'step' }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = resource as ScenarioView
      const parent: ResourceFact = scenario.scenarioType === 'capability'
        ? { label: 'Capability', value: scenario.capabilityTitle, wide: true, term: KIND_TERM.capability }
        : { label: 'Journey', value: scenario.journeyTitle, wide: true, term: KIND_TERM.journey }
      return [
        parent,
        { label: 'Steps', value: String(scenario.steps.length), term: 'step' },
        scenario.result
          ? { label: 'Result', value: scenario.result, term: 'result' }
          : { label: 'Screens', value: String(scenario.screenIds.length), term: KIND_TERM.screen }
      ]
    }
    case 'rule': {
      const rule = resource as RuleView
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length), term: 'applies-to' },
        { label: 'References', value: String(rule.references.length), term: 'reference' }
      ]
    }
    default:
      return []
  }
}

export function resourceBadge(workspace: ReportWorkspace, resource: AnyResourceView): string {
  switch (resource.kind) {
    case 'entity': {
      const entity = resource as EntityView
      return entity.acts ? `${entity.entityKind} · ${entity.acts}` : ''
    }
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
