/**
 * What a place delivers, read on that place alone — never summed over the
 * places nested inside it, which read their own.
 *
 * Both readings are derived from what the model already holds once, on
 * purpose: a Capability's `availability`, a Screen's `capabilities`, and the
 * place each Step is contextualized on. Nothing here is a new relation — it is
 * the same facts read from the place's side, which is the side a reader
 * standing on an Interface, an Experience or a Screen asks from.
 */
import type {
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

/**
 * The Capabilities a place carries where it sits in the tree. A Screen carries
 * its own `capabilities` — never a child's, which the child carries. An
 * Experience or Interface carries only what is available there and exposed on
 * no Screen that belongs to it, a gap `lint` grades; an Interface with no
 * Screens at all carries its available Capabilities as delivered directly.
 */
export interface PlaceCapabilities {
  capabilities: CapabilityView[]
  note: 'own' | 'gap' | 'direct'
}

export function placeCapabilities(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): PlaceCapabilities {
  if (place.kind === 'screen') {
    return { note: 'own', capabilities: place.capabilityIds.flatMap((id) => {
      const capability = workspace.byKey.get(resourceKey('capability', id))
      return capability?.kind === 'capability' ? [capability] : []
    }) }
  }
  const available = workspace.capabilities.filter(capability => capability.contexts.some(context => place.kind === 'experience'
    ? context.experienceId === place.id
    : context.interfaceId === place.id && !context.experienceId))
  const screens = workspace.screens.filter(screen => screen.contexts.some(context => place.kind === 'experience'
    ? context.experienceId === place.id || (place.interfaceIds.includes(context.interfaceId) && !context.experienceId)
    : context.interfaceId === place.id))
  if (place.kind === 'interface' && !screens.length) return { note: 'direct', capabilities: available }
  return { note: 'gap', capabilities: available.filter(capability => !screens.some(screen => screen.capabilityIds.includes(capability.id))) }
}

/** One Capability a place delivers itself, read through its own Scenarios that happen there. */
export interface PlaceDeliveryGroup {
  capability: CapabilityView
  note: PlaceCapabilities['note']
  /** The Capability's own Scenarios with a Step placed exactly on this place. */
  scenarios: ScenarioView[]
  /** Per Scenario key, the indexes of those Steps. */
  stepsHere: Record<string, number[]>
}

/** Which Steps of a Scenario are placed exactly on a place. */
const stepsOn = (scenario: ScenarioView, place: InterfaceView | ExperienceView | ScreenView): number[] =>
  scenario.steps.flatMap((step, index) => step.contexts.some(item => item.context.id === place.id) ? [index] : [])

/**
 * A place's Delivery tab: each Capability it delivers itself (see
 * `placeCapabilities`), with only the Capability Scenarios it owns that have a
 * Step placed exactly on this place — never on a place nested inside, which
 * reads its own. A Journey Scenario belongs to its Journey, not to any
 * Capability its Steps use, so it is read on the place (see `placeJourneys`).
 */
export function placeDelivery(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): PlaceDeliveryGroup[] {
  const { capabilities, note } = placeCapabilities(workspace, place)
  return capabilities.map((capability) => {
    const stepsHere: Record<string, number[]> = {}
    const scenarios = workspace.scenarios.filter((scenario) => {
      if (scenario.scenarioType !== 'capability' || scenario.capabilityId !== capability.id) return false
      const here = stepsOn(scenario, place)
      if (here.length) stepsHere[scenario.key] = here
      return here.length > 0
    })
    return { capability, note, scenarios, stepsHere }
  })
}

/** A Journey that passes through a place: its Scenarios with a Step placed there, and those Steps. */
export interface PlaceJourney {
  journey: JourneyView
  scenarios: Array<{ scenario: ScenarioView, steps: number[] }>
}

/**
 * The Journeys passing through a place, in model order, each holding its
 * Scenarios with a Step placed exactly on this place — once each, whatever
 * Capabilities those Steps use, and never on a place nested inside, which
 * reads its own.
 */
export function placeJourneys(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): PlaceJourney[] {
  return workspace.journeys.flatMap((journey) => {
    const scenarios = workspace.scenarios.flatMap((scenario) => {
      if (scenario.scenarioType !== 'journey' || scenario.journeyId !== journey.id) return []
      const steps = stepsOn(scenario, place)
      return steps.length ? [{ scenario, steps }] : []
    })
    return scenarios.length ? [{ journey, scenarios }] : []
  })
}

export type Place = InterfaceView | ExperienceView | ScreenView

/** How a tree says an alternative does not happen at a place. */
export function absenceLabel(place: Place): string {
  return place.kind === 'screen' ? 'Not on this Screen' : place.kind === 'experience' ? 'Not in this Experience' : 'Not in this Interface'
}
