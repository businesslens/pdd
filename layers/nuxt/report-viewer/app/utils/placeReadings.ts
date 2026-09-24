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

/** One Capability a place delivers itself, read through the Scenarios that happen there. */
export interface PlaceDeliveryGroup {
  capability: CapabilityView
  note: PlaceCapabilities['note']
  /** Scenarios with a Step for this Capability placed exactly on this place, Capability Scenarios first. */
  scenarios: ScenarioView[]
  /** Per Scenario key, the indexes of those Steps. */
  stepsHere: Record<string, number[]>
  /** Every Scenario that exercises the Capability, wherever it happens. */
  total: number
}

/**
 * A place's Delivery tab: each Capability it delivers itself (see
 * `placeCapabilities`), with only the Scenarios that have a Step for it placed
 * exactly on this place — never on a place nested inside, which reads its own.
 * A Step counts for the Capability its Scenario belongs to or, in a Journey
 * Scenario, the Capability the Step names.
 */
export function placeDelivery(workspace: ReportWorkspace, place: InterfaceView | ExperienceView | ScreenView): PlaceDeliveryGroup[] {
  const { capabilities, note } = placeCapabilities(workspace, place)
  const capabilityOf = (scenario: ScenarioView, step: ScenarioView['steps'][number]) =>
    scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId
  return capabilities.map((capability) => {
    const stepsHere: Record<string, number[]> = {}
    let total = 0
    const scenarios = workspace.scenarios.filter((scenario) => {
      const exercised = scenario.steps.some(step => capabilityOf(scenario, step) === capability.id)
      if (exercised) total++
      const here = scenario.steps.flatMap((step, index) => capabilityOf(scenario, step) === capability.id
        && step.contexts.some(item => item.context.id === place.id) ? [index] : [])
      if (here.length) stepsHere[scenario.key] = here
      return here.length > 0
    }).sort((a, b) => Number(a.scenarioType === 'journey') - Number(b.scenarioType === 'journey'))
    return { capability, note, scenarios, stepsHere, total }
  })
}
