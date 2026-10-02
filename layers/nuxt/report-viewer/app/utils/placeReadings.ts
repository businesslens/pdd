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
  AnyResourceView,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  ScenarioView,
  ScreenView,
  VariationSetView
} from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

/**
 * The Capabilities a place carries where it sits in the tree. A Screen carries
 * its own `capabilities` — never a child's, which the child carries. An
 * Experience or Interface carries behavior with Steps placed exactly there,
 * plus what is available there and exposed on no Screen, a gap `lint` grades.
 * Screen exposure never suppresses Steps placed directly on a container.
 */
export function placeCapabilities(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): CapabilityView[] {
  if (place.kind === 'screen') {
    return place.capabilityIds.flatMap((id) => {
      const capability = workspace.byKey.get(resourceKey('capability', id))
      return capability?.kind === 'capability' ? [capability] : []
    })
  }
  const available = workspace.capabilities.filter(capability => capability.contexts.some(context => place.kind === 'experience'
    ? context.experienceId === place.id
    : context.interfaceId === place.id && !context.experienceId))
  const screens = workspace.screens.filter(screen => screen.contexts.some(context => place.kind === 'experience'
    ? context.experienceId === place.id || (place.interfaceIds.includes(context.interfaceId) && !context.experienceId)
    : context.interfaceId === place.id))
  if (place.kind === 'interface' && !screens.length) return available
  const directIds = new Set(workspace.scenarios.filter(scenario =>
    scenario.scenarioType === 'capability' && stepsOn(scenario, place).length > 0
  ).map(scenario => scenario.capabilityId))
  const gapIds = new Set(available.filter(capability =>
    !screens.some(screen => screen.capabilityIds.includes(capability.id))
  ).map(capability => capability.id))
  return workspace.capabilities.filter(capability => directIds.has(capability.id) || gapIds.has(capability.id))
}

/** One Capability a place delivers itself, read through its own Scenarios that happen there. */
export interface PlaceDeliveryGroup {
  capability: CapabilityView
  /** A Screen's own; else placed here directly, by its Scenarios' Steps; else a gap: available here and on no Screen. */
  note: 'own' | 'direct' | 'gap'
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
  return placeCapabilities(workspace, place).map((capability) => {
    const stepsHere: Record<string, number[]> = {}
    const scenarios = workspace.scenarios.filter((scenario) => {
      if (scenario.scenarioType !== 'capability' || scenario.capabilityId !== capability.id) return false
      const here = stepsOn(scenario, place)
      if (here.length) stepsHere[scenario.key] = here
      return here.length > 0
    })
    const note: PlaceDeliveryGroup['note'] = place.kind === 'screen' ? 'own' : scenarios.length ? 'direct' : 'gap'
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

/**
 * Every place a reader standing on `place` finds in its branch: the place, the
 * Experiences and Screens inside it, nested ones included, and for an
 * Experience the Screens its Interfaces share with it.
 */
function placeScope(workspace: ReportWorkspace, place: Place): Set<string> {
  const inside = (id: string) => id === place.id || id.startsWith(`${place.id}::`)
  const experiences = new Set(workspace.experiences
    .filter(item => inside(item.id) || (place.kind === 'interface' && item.interfaceIds.includes(place.id)))
    .map(item => item.id))
  const screens = workspace.screens.filter(screen => inside(screen.id) || screen.contexts.some(context =>
    experiences.has(context.experienceId)
    || (place.kind === 'interface' && context.interfaceId === place.id)
    || (place.kind === 'experience' && !context.experienceId && place.interfaceIds.includes(context.interfaceId))))
  return new Set([place.id, ...experiences, ...screens.map(screen => screen.id)])
}

/**
 * Whether a resource happens anywhere in a place's branch — on the place or
 * on one nested inside it. A tree strikes an alternative only when this is
 * false: one delivered a level down is in the place, just not at its level.
 */
export function happensWithin(workspace: ReportWorkspace, resource: AnyResourceView, place: Place): boolean {
  return happensIn(resource, placeScope(workspace, place))
}

function happensIn(resource: AnyResourceView, scope: Set<string>): boolean {
  if (resource.kind === 'interface' || resource.kind === 'experience' || resource.kind === 'screen') return scope.has(resource.id)
  if (resource.kind === 'capability') {
    return resource.contexts.some(context => scope.has(context.placeId)) || resource.screenIds.some(id => scope.has(id))
  }
  if (resource.kind === 'journey') return resource.contexts.some(context => scope.has(context.placeId))
  if (resource.kind === 'capability-scenario' || resource.kind === 'journey-scenario') {
    return resource.steps.some(step => step.contexts.some(item => scope.has(item.context.id)))
  }
  return false
}

/** The alternatives of a set a place's node strikes: not drawn there and happening nowhere in its branch. */
export function absentAlternatives(workspace: ReportWorkspace, set: VariationSetView, drawn: ReadonlySet<string | undefined>, place: Place): AnyResourceView[] {
  const scope = placeScope(workspace, place)
  return set.alternatives
    .flatMap((item) => {
      const alternative = workspace.byKey.get(item.key)
      return alternative && !drawn.has(item.key) && !happensIn(alternative, scope) ? [alternative] : []
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'en'))
}

/** How a tree says an alternative does not happen at a place. */
export function absenceLabel(place: Place): string {
  return place.kind === 'screen' ? 'Not on this Screen' : place.kind === 'experience' ? 'Not in this Experience' : 'Not in this Interface'
}
