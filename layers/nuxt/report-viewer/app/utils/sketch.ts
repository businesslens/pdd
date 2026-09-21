/**
 * Sketches and storyboards, derived and nothing else.
 *
 * A Sketch is the same skeleton for every Screen: the frame comes from the
 * Interface type, always-reachable Screens form the strip, presented facts are
 * placeholders grouped by Entity, facts a Step edits here are fields, exposed
 * Capabilities are actions, child Screens are tabs. It arranges nothing the
 * model does not say — the way an ERD is not a schema — so it can never be
 * mistaken for a design proposal.
 *
 * A Storyboard is one route of one Scenario: one frame per Step that names a
 * place, that place's Sketch with the Step's facts and Capability lit.
 *
 * Everything here is plain data from the projected workspace. Nothing is
 * authored, nothing is written back, and no component decides a derivation.
 */
import type { ReportInterface } from 'businesslens/report'
import type {
  ExperienceView,
  InterfaceView,
  ReportWorkspace,
  ResolvedContextView,
  ScenarioView,
  ScreenView
} from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export const SKETCH_DERIVATION = 'A Sketch is the same skeleton for every Screen: the frame comes from the Interface type, always-reachable Screens form the strip, presented facts are placeholders grouped by Entity, facts a Step edits here are fields, exposed Capabilities are actions, child Screens are tabs. It arranges nothing the model does not say.'
export const STORYBOARD_DERIVATION = 'A Storyboard is one route of one Scenario: one frame per Step that names a place, that place\'s Sketch with the Step\'s facts and Capability lit.'

export type SketchFrameKind = 'browser' | 'window' | 'phone' | 'terminal' | 'request' | 'inbound' | 'transcript' | 'panel'
export type SketchStripPlacement = 'top' | 'side' | 'bottom' | null
/** How the frame writes its entry point: as an address, a title, a deep link, a prompt, a route, a system line or a label. */
export type SketchEntryStyle = 'address' | 'title' | 'deep-link' | 'prompt' | 'route' | 'system' | 'label'

export interface SketchFrame {
  kind: SketchFrameKind
  interfaceType: ReportInterface['type']
  strip: SketchStripPlacement
  entry: SketchEntryStyle
}

/** Frame by Interface `type`. A strip is a menu, so only the three windowed types carry one. */
export const SKETCH_FRAMES: Record<ReportInterface['type'], Omit<SketchFrame, 'interfaceType'>> = {
  web: { kind: 'browser', strip: 'top', entry: 'address' },
  'desktop-app': { kind: 'window', strip: 'side', entry: 'title' },
  'mobile-app': { kind: 'phone', strip: 'bottom', entry: 'deep-link' },
  cli: { kind: 'terminal', strip: null, entry: 'prompt' },
  api: { kind: 'request', strip: null, entry: 'route' },
  webhook: { kind: 'inbound', strip: null, entry: 'route' },
  messaging: { kind: 'transcript', strip: null, entry: 'system' },
  agent: { kind: 'transcript', strip: null, entry: 'system' },
  voice: { kind: 'transcript', strip: null, entry: 'system' },
  device: { kind: 'panel', strip: null, entry: 'label' }
}

export function sketchFrameOf(interfaceType: ReportInterface['type']): SketchFrame {
  return { ...SKETCH_FRAMES[interfaceType], interfaceType }
}

export interface SketchStripItem {
  screenId: string
  screenKey: string
  title: string
  /** The Screen being sketched, when it is itself always reachable. */
  current: boolean
}

export interface SketchLine {
  /** A field is a fact a Step placed exactly here changes; a placeholder any other fact; a bare line stands for an entry naming no facts. */
  kind: 'field' | 'placeholder' | 'bare'
  label: string
  lit: boolean
}

export interface SketchGroup {
  entityId: string
  entityKey: string
  title: string
  lines: SketchLine[]
  /** "facts not named", for a bare entry. */
  note: string | null
  lit: boolean
}

export interface SketchActionStep {
  scenarioKey: string
  scenarioTitle: string
  /** Zero-based position in its Scenario. */
  index: number
  text: string
}

export interface SketchAction {
  capabilityId: string
  capabilityKey: string
  title: string
  /** The actor Steps placed exactly on this Screen for this Capability. */
  steps: SketchActionStep[]
  /** Exposed here, yet no Step is placed here for it. */
  dashed: boolean
  lit: boolean
}

export interface SketchTab {
  screenId: string
  screenKey: string
  title: string
}

export interface ScreenSketch {
  kind: 'screen'
  screenId: string
  screenKey: string
  title: string
  frame: SketchFrame
  /** The Screen's own entry point paths, as the frame's entry line writes them. */
  entry: string[]
  strip: SketchStripItem[]
  groups: SketchGroup[]
  actions: SketchAction[]
  tabs: SketchTab[]
}

export interface SketchMiniature {
  screenId: string
  screenKey: string
  title: string
  groupLabels: string[]
  actionCount: number
  tabs: SketchTab[]
}

export interface SketchWallGroup {
  /** Empty for an Interface's shared Screens, or an Experience's own wall. */
  experienceId: string
  experienceKey: string
  /** Empty where the wall has one group and nothing to tell apart. */
  title: string
  miniatures: SketchMiniature[]
}

export interface SketchListing {
  capabilityId: string
  capabilityKey: string
  title: string
}

export interface ContainerSketch {
  kind: 'container'
  containerId: string
  containerKey: string
  containerKind: 'interface' | 'experience'
  title: string
  frame: SketchFrame
  entry: string[]
  strip: SketchStripItem[]
  /** The wall of miniatures where the container has Screens; null otherwise. */
  wall: SketchWallGroup[] | null
  /** The Capabilities available here, listed as the frame would list them, where the container has no Screens. */
  listing: SketchListing[]
}

const inside = (containerId: string, placeId: string) => placeId === containerId || placeId.startsWith(`${containerId}::`)

function screenOf(workspace: ReportWorkspace, screenId: string): ScreenView | undefined {
  const resource = workspace.byKey.get(resourceKey('screen', screenId))
  return resource?.kind === 'screen' ? resource : undefined
}

function containerOf(workspace: ReportWorkspace, containerId: string): InterfaceView | ExperienceView | undefined {
  const experience = workspace.byKey.get(resourceKey('experience', containerId))
  if (experience?.kind === 'experience') return experience
  const productInterface = workspace.byKey.get(resourceKey('interface', containerId))
  return productInterface?.kind === 'interface' ? productInterface : undefined
}

function interfaceOf(workspace: ReportWorkspace, container: InterfaceView | ExperienceView): InterfaceView | undefined {
  if (container.kind === 'interface') return container
  const productInterface = workspace.byKey.get(resourceKey('interface', container.interfaceIds[0] ?? ''))
  return productInterface?.kind === 'interface' ? productInterface : undefined
}

const byTitle = (left: { title: string }, right: { title: string }) => left.title.localeCompare(right.title)

/**
 * The strip: `navigation` of the Interface plus the containing Experience,
 * sorted by title because order carries no meaning. A frame without a strip
 * placement draws none, whatever the container names.
 */
function stripOf(workspace: ReportWorkspace, frame: SketchFrame, interfaceId: string, experienceId: string, currentId: string): SketchStripItem[] {
  if (!frame.strip) return []
  const productInterface = workspace.byKey.get(resourceKey('interface', interfaceId))
  const experience = experienceId ? workspace.byKey.get(resourceKey('experience', experienceId)) : undefined
  const ids = new Set([
    ...(productInterface?.kind === 'interface' ? productInterface.navigationIds : []),
    ...(experience?.kind === 'experience' ? experience.navigationIds : [])
  ])
  return [...ids]
    .flatMap((screenId) => {
      const screen = screenOf(workspace, screenId)
      return screen ? [{ screenId, screenKey: screen.key, title: screen.title, current: screenId === currentId }] : []
    })
    .sort(byTitle)
}

/** The Steps placed exactly on one place, on any route, in Scenario order. */
function stepsPlacedOn(workspace: ReportWorkspace, placeId: string) {
  return workspace.scenarios.flatMap(scenario => scenario.steps.flatMap((step, index) =>
    step.contexts.some(item => item.context.id === placeId) ? [{ scenario, step, index }] : []))
}

/** The Capability a Step exercises: its Scenario's own, or the Journey Step's. */
const stepCapabilityId = (scenario: ScenarioView, step: ScenarioView['steps'][number]) =>
  scenario.scenarioType === 'capability' ? scenario.capabilityId : step.capabilityId

/**
 * Tab order: if some Scenario route visits two or more children in sequence,
 * the order of the first such route (authored Scenario order, then route
 * order), the children it skips following in authored order; otherwise
 * authored order.
 */
function tabOrder(workspace: ReportWorkspace, childIds: string[]): string[] {
  if (childIds.length < 2) return childIds
  const childOf = (placeId: string) => childIds.find(id => inside(id, placeId))
  for (const scenario of workspace.scenarios) {
    for (const route of scenario.routes) {
      const visited: string[] = []
      for (const step of scenario.steps) {
        const context = step.contexts.find(item => item.routeId === route.id)?.context
        const child = context ? childOf(context.id) : undefined
        if (child && !visited.includes(child)) visited.push(child)
      }
      if (visited.length >= 2) return [...visited, ...childIds.filter(id => !visited.includes(id))]
    }
  }
  return childIds
}

/** The Sketch of one Screen, unlit. */
export function screenSketch(workspace: ReportWorkspace, screenId: string): ScreenSketch | null {
  const screen = screenOf(workspace, screenId)
  if (!screen) return null
  const context = screen.contexts[0]
  const productInterface = context ? workspace.byKey.get(resourceKey('interface', context.interfaceId)) : undefined
  if (!context || productInterface?.kind !== 'interface') return null
  const frame = sketchFrameOf(productInterface.interfaceType)
  const placed = stepsPlacedOn(workspace, screen.id)
  const changedFacts = new Map<string, Set<string>>()
  for (const { step } of placed) {
    for (const entry of step.entities) {
      if (entry.effect === 'reads' || !entry.facts.length) continue
      const facts = changedFacts.get(entry.entityId) ?? new Set<string>()
      for (const fact of entry.facts) facts.add(fact)
      changedFacts.set(entry.entityId, facts)
    }
  }
  const groups: SketchGroup[] = screen.entities.map((entry) => {
    const entity = workspace.byKey.get(resourceKey('entity', entry.entityId))
    const changed = changedFacts.get(entry.entityId)
    return {
      entityId: entry.entityId,
      entityKey: resourceKey('entity', entry.entityId),
      title: entity?.title ?? entry.entityId,
      lines: entry.facts
        ? entry.facts.map(fact => ({ kind: changed?.has(fact) ? 'field' as const : 'placeholder' as const, label: fact, lit: false }))
        : [{ kind: 'bare', label: '', lit: false }],
      note: entry.facts ? null : 'facts not named',
      lit: false
    }
  })
  const actions: SketchAction[] = screen.capabilityIds.map((capabilityId) => {
    const capability = workspace.byKey.get(resourceKey('capability', capabilityId))
    const steps = placed
      .filter(({ scenario, step }) => step.stepKind === 'actor' && stepCapabilityId(scenario, step) === capabilityId)
      .map(({ scenario, step, index }) => ({ scenarioKey: scenario.key, scenarioTitle: scenario.title, index, text: step.text }))
    return {
      capabilityId,
      capabilityKey: resourceKey('capability', capabilityId),
      title: capability?.title ?? capabilityId,
      steps,
      dashed: steps.length === 0,
      lit: false
    }
  })
  const tabs: SketchTab[] = tabOrder(workspace, screen.childScreenIds).flatMap((childId) => {
    const child = screenOf(workspace, childId)
    return child ? [{ screenId: childId, screenKey: child.key, title: child.title }] : []
  })
  return {
    kind: 'screen',
    screenId: screen.id,
    screenKey: screen.key,
    title: screen.title,
    frame,
    entry: screen.entryPoints.map(point => point.path),
    strip: stripOf(workspace, frame, context.interfaceId, context.experienceId, screen.id),
    groups,
    actions,
    tabs
  }
}

function miniatureOf(workspace: ReportWorkspace, screen: ScreenView): SketchMiniature {
  return {
    screenId: screen.id,
    screenKey: screen.key,
    title: screen.title,
    groupLabels: screen.entities.map(entry => workspace.byKey.get(resourceKey('entity', entry.entityId))?.title ?? entry.entityId),
    actionCount: screen.capabilityIds.length,
    tabs: tabOrder(workspace, screen.childScreenIds).flatMap((childId) => {
      const child = screenOf(workspace, childId)
      return child ? [{ screenId: childId, screenKey: child.key, title: child.title }] : []
    })
  }
}

/** The Sketch of an Interface or Experience: its frame, its strip, and its wall of Screens or its listing of Capabilities. */
export function containerSketch(workspace: ReportWorkspace, containerId: string): ContainerSketch | null {
  const container = containerOf(workspace, containerId)
  const productInterface = container ? interfaceOf(workspace, container) : undefined
  if (!container || !productInterface) return null
  const frame = sketchFrameOf(productInterface.interfaceType)
  const experienceId = container.kind === 'experience' ? container.id : ''
  const topLevel = (parentId: string) => workspace.screens
    .filter(screen => !screen.parentScreenId && inside(parentId, screen.id) && screen.contexts[0]?.placeId === parentId)
    .map(screen => miniatureOf(workspace, screen))
  let wall: SketchWallGroup[] | null = null
  if (container.screenIds.length) {
    const groups: SketchWallGroup[] = []
    if (container.kind === 'interface') {
      const shared = topLevel(container.id)
      const perExperience = container.experienceIds.flatMap((id) => {
        const experience = workspace.byKey.get(resourceKey('experience', id))
        const miniatures = topLevel(id)
        return experience?.kind === 'experience' && miniatures.length
          ? [{ experienceId: id, experienceKey: experience.key, title: experience.title, miniatures }]
          : []
      })
      if (shared.length) groups.push({ experienceId: '', experienceKey: '', title: perExperience.length ? 'Shared Screens' : '', miniatures: shared })
      groups.push(...perExperience)
    } else {
      groups.push({ experienceId: container.id, experienceKey: container.key, title: '', miniatures: topLevel(container.id) })
    }
    wall = groups
  }
  const listing: SketchListing[] = wall
    ? []
    : container.capabilityIds.map(capabilityId => ({
        capabilityId,
        capabilityKey: resourceKey('capability', capabilityId),
        title: workspace.byKey.get(resourceKey('capability', capabilityId))?.title ?? capabilityId
      }))
  return {
    kind: 'container',
    containerId: container.id,
    containerKey: container.key,
    containerKind: container.kind,
    title: container.title,
    frame,
    entry: container.entryPoints.map(point => point.path),
    strip: stripOf(workspace, frame, productInterface.id, experienceId, ''),
    wall,
    listing
  }
}

/** Whether the Sketch tab has anything to draw for a container: Screens, or Capabilities to list. */
export function hasContainerSketch(container: InterfaceView | ExperienceView): boolean {
  return container.screenIds.length > 0 || container.capabilityIds.length > 0
}

interface StoryboardStepBase {
  /** Zero-based position in the Scenario. */
  index: number
  text: string
  stepKind: 'actor' | 'product' | 'condition'
  /** The Capability a Journey Step names; empty on a Capability Scenario, whose parent names it. */
  capabilityTitle: string
  capabilityKey: string
}

export type StoryboardFrame =
  | (StoryboardStepBase & { kind: 'sketch', product: boolean, sketch: ScreenSketch })
  | (StoryboardStepBase & { kind: 'container', product: boolean, container: ContainerSketch, line: { prompt: boolean, text: string } })
  | (StoryboardStepBase & { kind: 'interstitial' })
  | (StoryboardStepBase & { kind: 'note' })

export interface Storyboard {
  scenarioKey: string
  routeId: string
  routeName: string
  frames: StoryboardFrame[]
}

/** Light a Sketch for one Step: its Capability's action, and the facts it cites or the Entities it changes. */
function light(sketch: ScreenSketch, scenario: ScenarioView, step: ScenarioView['steps'][number]): ScreenSketch {
  const capabilityId = stepCapabilityId(scenario, step)
  const cited = new Map<string, Set<string>>()
  const changed = new Set<string>()
  for (const entry of step.entities) {
    if (step.stepKind === 'actor') {
      const facts = cited.get(entry.entityId) ?? new Set<string>()
      for (const fact of entry.facts) facts.add(fact)
      cited.set(entry.entityId, facts)
    } else if (entry.effect !== 'reads') {
      changed.add(entry.entityId)
    }
  }
  return {
    ...sketch,
    groups: sketch.groups.map((group) => {
      const groupLit = step.stepKind === 'product' && changed.has(group.entityId)
      const facts = cited.get(group.entityId)
      return {
        ...group,
        lit: groupLit,
        lines: group.lines.map(line => ({ ...line, lit: groupLit || Boolean(facts?.has(line.label)) }))
      }
    }),
    actions: sketch.actions.map(action => ({ ...action, lit: step.stepKind === 'actor' && action.capabilityId === capabilityId }))
  }
}

/** One route of one Scenario as frames. Null where the Scenario or the route is unknown. */
export function storyboard(workspace: ReportWorkspace, scenarioId: string, routeId: string): Storyboard | null {
  const scenario = workspace.scenarios.find(item => item.id === scenarioId)
  const route = scenario?.routes.find(item => item.id === routeId)
  if (!scenario || !route) return null
  const frames = scenario.steps.map((step, index): StoryboardFrame => {
    const capability = scenario.scenarioType === 'journey' && step.capabilityId
      ? workspace.byKey.get(resourceKey('capability', step.capabilityId))
      : undefined
    const base: StoryboardStepBase = {
      index,
      text: step.text,
      stepKind: step.stepKind,
      capabilityTitle: capability?.title ?? '',
      capabilityKey: capability?.key ?? ''
    }
    if (step.stepKind === 'condition') return { ...base, kind: 'note' }
    const context: ResolvedContextView | undefined = step.contexts.find(item => item.routeId === route.id)?.context
    if (!context) return { ...base, kind: 'interstitial' }
    const product = step.stepKind === 'product'
    if (context.kind === 'screen') {
      const sketch = screenSketch(workspace, context.screenId)
      if (sketch) return { ...base, kind: 'sketch', product, sketch: light(sketch, scenario, step) }
    }
    const container = containerSketch(workspace, context.kind === 'screen' ? context.boundary.placeId : context.id)
    if (container) return { ...base, kind: 'container', product, container, line: { prompt: !product, text: step.text } }
    return { ...base, kind: 'interstitial' }
  })
  return { scenarioKey: scenario.key, routeId: route.id, routeName: route.name, frames }
}
