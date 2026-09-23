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
  ScenarioStepEntityView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { resourceKey } from './reportWorkspace'
import type { EntityEffectLike } from './entityEffectPhrase'
import { joinStateMoves } from './entityEffectPhrase'

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

export type ScreenEffect = EntityEffectLike & { entityId: string }

/** One Capability a Screen exposes, read on that Screen alone. */
export interface ScreenDeliveryRow {
  capability: CapabilityView
  /**
   * What the Steps placed exactly on this Screen do to each Entity, merged
   * across them: an instance alias folds into its Entity, a change outranks a
   * read of the same Entity, and moves that meet join into one run.
   */
  effects: ScreenEffect[]
  /** The Scenarios with a Step here, Capability Scenarios first. */
  scenarios: ScenarioView[]
  /** How many Steps are placed here for this Capability. */
  steps: number
}

/**
 * A Screen's own Delivery: each Capability it lists, with what happens on this
 * Screen for it — never on a nested Screen, which reads its own. A Step counts
 * for the Capability its Scenario belongs to, or, in a Journey Scenario, the
 * Capability the Step names.
 */
export function screenDelivery(workspace: ReportWorkspace, screen: ScreenView): ScreenDeliveryRow[] {
  return screen.capabilityIds.flatMap((capabilityId) => {
    const capability = workspace.byKey.get(resourceKey('capability', capabilityId))
    if (capability?.kind !== 'capability') return []
    const scenarios: ScenarioView[] = []
    const mentions: ScenarioStepEntityView[] = []
    let steps = 0
    for (const scenario of workspace.scenarios) {
      const here = scenario.steps.filter(step =>
        (scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId) === capabilityId
        && step.contexts.some(item => item.context.id === screen.id))
      if (!here.length) continue
      scenarios.push(scenario)
      steps += here.length
      mentions.push(...here.flatMap(step => step.entities))
    }
    scenarios.sort((a, b) => Number(a.scenarioType === 'journey') - Number(b.scenarioType === 'journey'))
    return [{ capability, effects: mergeEffects(mentions), scenarios, steps }]
  })
}

function mergeEffects(mentions: ScenarioStepEntityView[]): ScreenEffect[] {
  const byEntity = new Map<string, ScenarioStepEntityView[]>()
  for (const mention of mentions) byEntity.set(mention.entityId, [...byEntity.get(mention.entityId) ?? [], mention])
  return [...byEntity].flatMap(([entityId, all]) => {
    const changes = all.filter(item => item.effect !== 'reads')
    if (!changes.length) return [{ entityId, effect: 'reads' as const, from: '', to: '' }]
    const seen = new Set<string>()
    const distinct = changes.filter((item) => {
      const key = `${item.effect}|${item.from}|${item.to}`
      return !seen.has(key) && Boolean(seen.add(key))
    })
    return joinStateMoves(distinct.map(item => ({ effect: item.effect, from: item.from, to: item.to })))
      .map(effect => ({ ...effect, entityId }))
  })
}
