/**
 * What a place delivers, and what changes there.
 *
 * Both readings are derived from what the model already holds once, on
 * purpose: a Capability's `availability`, a Screen's `capabilities`, and the
 * place each Step is contextualized on. Nothing here is a new relation — it is
 * the same facts read from the place's side, which is the side a reader
 * standing on an Interface, an Experience or a Screen asks from.
 */
import type {
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  ReportWorkspace,
  ScenarioStepEntityView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export interface DeliveryRow {
  capability: CapabilityView
  /** The Screens inside the container that expose it, in authored order. */
  screens: ScreenView[]
}

export interface DeliveryGroup {
  /** Null collects the Capabilities no Domain claims. */
  domain: DomainView | null
  rows: DeliveryRow[]
}

export interface DeliveryReading {
  /** Capabilities exposed on a Screen, grouped by Domain in Domain order. */
  groups: DeliveryGroup[]
  /** Available here, yet no Screen inside exposes them — a finding, where the container owns Screens. */
  unexposed: CapabilityView[]
  /** False for a container with no Screens at all, where every Capability is delivered directly. */
  ownsScreens: boolean
  /** Every Capability available here. */
  count: number
}

const inside = (containerId: string, placeId: string) => placeId === containerId || placeId.startsWith(`${containerId}::`)

/**
 * The Capabilities available in an Interface or Experience, and the Screen each
 * is exposed on. Availability naming the container, one of its Experiences, or
 * a Screen inside it all count as "available here"; exposure is a Screen inside
 * the container listing the Capability, nested Screens included.
 */
export function deliveryOf(workspace: ReportWorkspace, container: InterfaceView | ExperienceView): DeliveryReading {
  const available = workspace.capabilities.filter(capability =>
    capability.contexts.some(context => inside(container.id, context.placeId)))
  const screens = workspace.screens.filter(screen => inside(container.id, screen.id) && screen.id !== container.id)
  const rows = available.map(capability => ({
    capability,
    screens: screens.filter(screen => screen.capabilityIds.includes(capability.id))
  }))
  const ownsScreens = screens.length > 0
  const exposed = ownsScreens ? rows.filter(row => row.screens.length) : rows
  const groupOf = (domain: DomainView | null): DeliveryGroup => ({
    domain,
    rows: exposed.filter(row => (row.capability.domainId ?? '') === (domain?.id ?? ''))
  })
  return {
    groups: [...workspace.domains.map(groupOf), groupOf(null)].filter(group => group.rows.length),
    unexposed: ownsScreens ? rows.filter(row => !row.screens.length).map(row => row.capability) : [],
    ownsScreens,
    count: available.length
  }
}

export interface ScreenChangeStep {
  /** Position in its Scenario, for the reader who opens it. */
  index: number
  text: string
  stepKind: 'actor' | 'product' | 'condition'
  actorId: string
  /** Changes first, then reads, as the Step authored them. */
  entities: ScenarioStepEntityView[]
  /** The descendant Screens the Step is placed on; empty when it is placed on the Screen itself. */
  placedOn: ScreenView[]
}

export interface ScreenChangeGroup {
  scenario: ScenarioView
  steps: ScreenChangeStep[]
}

/**
 * The Steps that change something on this Screen or on a Screen nested inside
 * it, grouped by Scenario in the model's order. A Step placed on a descendant
 * says so; a Step that only reads is not a change and is left to the Scenario.
 */
export function screenChanges(workspace: ReportWorkspace, screen: ScreenView): ScreenChangeGroup[] {
  return workspace.scenarios.flatMap((scenario) => {
    const steps = scenario.steps.flatMap((step, index): ScreenChangeStep[] => {
      if (!step.entities.some(entry => entry.effect !== 'reads')) return []
      const places = [...new Set(step.contexts.map(item => item.context.id).filter(placeId => inside(screen.id, placeId)))]
      if (!places.length) return []
      const placedOn = places.includes(screen.id)
        ? []
        : places.flatMap((placeId) => {
            const place = workspace.byKey.get(resourceKey('screen', placeId))
            return place?.kind === 'screen' ? [place] : []
          })
      return [{ index, text: step.text, stepKind: step.stepKind, actorId: step.actorId, entities: step.entities, placedOn }]
    })
    return steps.length ? [{ scenario, steps }] : []
  })
}
