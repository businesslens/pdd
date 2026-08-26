/**
 * The complete Product Report, projected once for the renderer.
 *
 * A report that claims to describe a product must show the whole model, so
 * this projection keeps every authored field and
 * adds the backlinks a reader needs but the format never stores: the format
 * records relations in exactly one direction, and a reader needs both.
 *
 * This is the stable view projection used by the shipped report viewer.
 */
import type {
  ProductReportV11,
  ReportActor,
  ReportContext,
  ReportBusinessRule,
  ReportBusinessRuleTarget,
  ReportCapability,
  ReportCapabilityScenario,
  ReportCoverage,
  ReportDecisionPoint,
  ReportDomain,
  ReportEntity,
  ReportExperience,
  ReportInterface,
  ReportJourney,
  ReportJourneyScenario,
  ReportReference,
  ReportScreen,
  ReportScreenState,
  ReportSupportingSection
} from 'businesslens/report'

export type ReportElementKind =
  | 'product'
  | 'actor'
  | 'interface'
  | 'experience'
  | 'screen'
  | 'domain'
  | 'entity'
  | 'capability'
  | 'journey'
  | 'capability-scenario'
  | 'journey-scenario'
  | 'rule'

/**
 * The two Scenario collections are separate kinds, not one kind with a flag.
 * They answer different questions — local acceptance for one Capability versus
 * one end-to-end variation of a Journey — so they get their own navigation,
 * facets and columns rather than sharing a surface that fits neither.
 */
export type ReportScenarioKind = 'capability-scenario' | 'journey-scenario'
export type ReportScenarioType = 'capability' | 'journey'
export type ReportElementKey = string

export const SCENARIO_KINDS: ReportScenarioKind[] = ['capability-scenario', 'journey-scenario']

export function isScenarioKind(kind: ReportElementKind): kind is ReportScenarioKind {
  return kind === 'capability-scenario' || kind === 'journey-scenario'
}

export function scenarioKindOf(type: ReportScenarioType): ReportScenarioKind {
  return type === 'capability' ? 'capability-scenario' : 'journey-scenario'
}

/** Stable UI identity; raw ids are unique only within an element collection. */
export function elementKey(kind: ReportElementKind, id: string): ReportElementKey {
  return `${kind}:${id}`
}

export interface ElementKindMeta {
  kind: ReportElementKind
  /** Singular label used in prose and inspectors. */
  label: string
  /** Plural label used for section headings and counts. */
  plural: string
  icon: string
  /** Index into the report palette; also drives graph node colour. */
  slot: number
}

export const REPORT_ENTITY_KINDS: ElementKindMeta[] = [
  { kind: 'actor', label: 'Actor', plural: 'Actors', icon: 'i-lucide-users', slot: 0 },
  { kind: 'interface', label: 'Interface', plural: 'Interfaces', icon: 'i-lucide-plug', slot: 1 },
  { kind: 'experience', label: 'Experience', plural: 'Experiences', icon: 'i-lucide-layout-panel-left', slot: 2 },
  { kind: 'screen', label: 'Screen', plural: 'Screens', icon: 'i-lucide-monitor', slot: 3 },
  { kind: 'domain', label: 'Domain', plural: 'Domains', icon: 'i-lucide-boxes', slot: 4 },
  /*
    Entity shares Domain's slot. Both are axes rather than levels — they classify
    the behavior hierarchy instead of sitting inside it — so one hue reads as
    "the thing this is about", and the icon and label carry which axis it is.
  */
  { kind: 'entity', label: 'Entity', plural: 'Entities', icon: 'i-lucide-box', slot: 4 },
  { kind: 'capability', label: 'Capability', plural: 'Capabilities', icon: 'i-lucide-zap', slot: 5 },
  { kind: 'journey', label: 'Journey', plural: 'Journeys', icon: 'i-lucide-route', slot: 6 },
  /*
    Both Scenario kinds hold slot 7. Ten kinds is past the nine-slot categorical
    order, and the two that belong to one family are the honest pair to merge:
    the shared hue reads as "Scenario", and the icon, label and node sublabel
    carry the distinction — colour is never the only encoding here.
  */
  { kind: 'capability-scenario', label: 'Capability Scenario', plural: 'Capability Scenarios', icon: 'i-lucide-list-checks', slot: 7 },
  { kind: 'journey-scenario', label: 'Journey Scenario', plural: 'Journey Scenarios', icon: 'i-lucide-list-ordered', slot: 7 },
  { kind: 'rule', label: 'Business rule', plural: 'Business rules', icon: 'i-lucide-scale', slot: 8 }
]

export const ENTITY_KIND_META: Record<ReportElementKind, ElementKindMeta> = {
  product: { kind: 'product', label: 'Product', plural: 'Product', icon: 'i-lucide-package', slot: 9 },
  ...Object.fromEntries(REPORT_ENTITY_KINDS.map(meta => [meta.kind, meta]))
} as Record<ReportElementKind, ElementKindMeta>

export const INTERFACE_TYPE_META: Record<ReportInterface['type'], { label: string, icon: string }> = {
  web: { label: 'Web', icon: 'i-lucide-globe' },
  'mobile-app': { label: 'Mobile app', icon: 'i-lucide-smartphone' },
  'desktop-app': { label: 'Desktop app', icon: 'i-lucide-app-window' },
  cli: { label: 'CLI', icon: 'i-lucide-terminal' },
  api: { label: 'API', icon: 'i-lucide-braces' },
  webhook: { label: 'Webhook', icon: 'i-lucide-webhook' },
  messaging: { label: 'Messaging', icon: 'i-lucide-messages-square' },
  voice: { label: 'Voice', icon: 'i-lucide-audio-lines' },
  device: { label: 'Device', icon: 'i-lucide-cpu' },
  agent: { label: 'Agent', icon: 'i-lucide-bot' }
}

export const ACTOR_KIND_META: Record<ReportActor['kind'], { label: string, icon: string }> = {
  person: { label: 'Person', icon: 'i-lucide-user-round' },
  system: { label: 'System', icon: 'i-lucide-cpu' }
}

export const ACTOR_RELATIONSHIP_META: Record<ReportActor['relationship'], { label: string }> = {
  external: { label: 'External' },
  internal: { label: 'Internal' }
}

/** One resolved Context place; an empty Experience id means an Interface place. */
export interface ContextView {
  placeId: string
  placeKind: 'interface' | 'experience' | 'screen'
  interfaceId: string
  experienceId: string
  screenId: string
  interfaceTitle: string
  experienceTitle: string
  screenTitle: string
  key: string
}

export interface EntryPointView {
  interfaceId: string
  interfaceTitle: string
  path: string
  /** The exact place whose route this is, retained for the shared typed path. */
  context: ResolvedContextView
  key: string
}

interface ElementBase {
  key: ReportElementKey
  id: string
  kind: ReportElementKind
  title: string
  /** Lead prose: description, summary, or rule statement depending on kind. */
  lead: string
  intent: string
  supportingContent: string
  references: ReportReference[]
}

export interface ActorView extends ElementBase {
  kind: 'actor'
  actorKind: 'person' | 'system'
  relationship: 'external' | 'internal'
  interfaceIds: string[]
  experienceIds: string[]
  journeyIds: string[]
  /* Scenarios name their Actors, so an Actor with no Journey still has behaviour. */
  capabilityScenarioIds: string[]
  journeyScenarioIds: string[]
}

export interface InterfaceView extends ElementBase {
  kind: 'interface'
  interfaceType: ReportInterface['type']
  actorIds: string[]
  entryPoints: EntryPointView[]
  capabilityBoundary: string
  experienceIds: string[]
  capabilityIds: string[]
  screenIds: string[]
  journeyIds: string[]
}

export interface ExperienceView extends ElementBase {
  kind: 'experience'
  actorIds: string[]
  interfaceIds: string[]
  accessMode: 'public' | 'authenticated' | 'restricted'
  entryPoints: EntryPointView[]
  capabilityBoundary: string
  capabilityIds: string[]
  screenIds: string[]
  journeyIds: string[]
  /** Subject regions reached through the Capabilities available here. Never authored. */
  domainIds: string[]
}

export interface ScreenView extends ElementBase {
  kind: 'screen'
  contexts: ContextView[]
  capabilityIds: string[]
  capabilityScenarioIds: string[]
  journeyScenarioIds: string[]
  scenarioIds: string[]
  entryPoints: EntryPointView[]
  information: string[]
  actions: string[]
  states: ReportScreenState[]
  capabilityBoundary: string
  /** Journeys reached through explicitly linked Journey Scenarios. */
  scenarioJourneyIds: string[]
  /** Journeys inferred from the Capabilities the Screen exposes. */
  capabilityJourneyIds: string[]
  journeyIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
  /** Subject regions reached through the Capabilities this Screen exposes. Never authored. */
  domainIds: string[]
}

export interface DomainView extends ElementBase {
  kind: 'domain'
  /** Experiences reached through this Domain's Capabilities. Never authored. */
  experienceIds: string[]
  colorSlot?: number
  capabilityIds: string[]
  journeyIds: string[]
  screenIds: string[]
  ruleIds: string[]
}

/**
 * A thing the Product keeps whose state an Actor observes. Its states are an
 * authored lifecycle; a Screen's productStates are that view's own states, and
 * the two are never merged.
 */
export interface EntityView extends ElementBase {
  kind: 'entity'
  domainId?: string
  states: Array<{ name: string, content: string }>
  transitions: Array<{ from: string, to: string }>
}

export interface CapabilityView extends ElementBase {
  kind: 'capability'
  domainId?: string
  contexts: ContextView[]
  /** Capability Scenarios — the only direct acceptance coverage for this ability. */
  scenarioIds: string[]
  /** Journey Scenarios with a step that exercises this Capability. */
  journeyScenarioIds: string[]
  journeyIds: string[]
  screenIds: string[]
  ruleIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
}

export interface JourneyView extends ElementBase {
  kind: 'journey'
  actorIds: string[]
  capabilityIds: string[]
  failureOnlyCapabilityIds: string[]
  successCriterion: string
  contexts: ContextView[]
  entryPoints: EntryPointView[]
  scenarioIds: string[]
  domainIds: string[]
  screenIds: string[]
  ruleIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
  /** Total steps across the Journey's Scenarios — a rough weight for layout. */
  stepCount: number
}

export interface ScenarioView extends ElementBase {
  kind: ReportScenarioKind
  scenarioType: ReportScenarioType
  capabilityId: string
  capabilityTitle: string
  actorIds: string[]
  journeyId: string
  journeyTitle: string
  kindId: string
  kindName: string
  kindSlot: number
  /** Authored Step Contexts; Journey Scenario entries are unioned for display. */
  contexts: ContextView[]
  trigger: string
  routes: Array<{ id: string, name: string }>
  steps: Array<{
    text: string
    stepKind: 'actor' | 'product' | 'condition'
    actorId: string
    capabilityId: string
    contexts: Array<{
      routeId: string
      context: ResolvedContextView
    }>
  }>
  decisionPoints: ReportDecisionPoint[]
  outcome: string
  edgeCases: string[]
  result: 'achieved' | 'not-achieved' | ''
  screenIds: string[]
  ruleIds: string[]
}

export interface ResolvedContextView {
  id: string
  kind: 'interface' | 'experience' | 'screen'
  interfaceId: string
  interfaceTitle: string
  interfaceType: ReportInterface['type']
  experienceId: string
  experienceTitle: string
  screenId: string
  screenTitle: string
  boundary: ContextView
}

export interface RuleView extends ElementBase {
  kind: 'rule'
  statement: string
  rationale: string
  /** Domains reached through targeted behavior; Domains are never authored Rule targets. */
  domainIds: string[]
  capabilityIds: string[]
  journeyIds: string[]
  capabilityScenarioIds: string[]
  journeyScenarioIds: string[]
  scenarioIds: string[]
  derivedCapabilityIds: string[]
  derivedJourneyIds: string[]
  contexts: ContextView[]
  appliesTo: ReportBusinessRuleTarget[]
}

export type AnyElementView =
  | ActorView
  | InterfaceView
  | ExperienceView
  | ScreenView
  | DomainView
  | EntityView
  | CapabilityView
  | JourneyView
  | ScenarioView
  | RuleView

export interface ReportIdentity {
  id: string
  title: string
  summary: string
  description: string
  category: string | null
  categoryLabel: string | null
  tags: string[]
  authors: Array<{ name: string, url?: string }>
  license: string | null
  intent: string
  supportingContent: string
  references: ReportReference[]
  referenceProfile: 'workspace' | 'portable'
  limitations: string[]
  generatedAt: string
  generator: { name: string, version: string }
  schemaVersion: string
}

export interface WorkspaceCounts {
  actors: number
  interfaces: number
  experiences: number
  screens: number
  domains: number
  entities: number
  capabilities: number
  journeys: number
  capabilityScenarios: number
  journeyScenarios: number
  scenarios: number
  rules: number
  /** Derived depth measures the counts block never carries. */
  steps: number
  decisionPoints: number
  branches: number
  edgeCases: number
  screenStates: number
  entryPoints: number
  references: number
  availabilityContexts: number
}

export interface ReferenceGroup {
  reference: ReportReference
  ownerKey: ReportElementKey | ''
  ownerId: string
  ownerTitle: string
  ownerKind: ReportElementKind
}

export interface ReportWorkspace {
  identity: ReportIdentity
  coverage: ReportCoverage
  counts: WorkspaceCounts
  scenarioKinds: Array<{ id: string, name: string, description: string, slot: number, count: number }>
  actors: ActorView[]
  interfaces: InterfaceView[]
  experiences: ExperienceView[]
  screens: ScreenView[]
  domains: DomainView[]
  entities: EntityView[]
  capabilities: CapabilityView[]
  journeys: JourneyView[]
  capabilityScenarios: ScenarioView[]
  journeyScenarios: ScenarioView[]
  scenarios: ScenarioView[]
  rules: RuleView[]
  /** Every distinct Context declared or derived in the model. */
  contexts: ContextView[]
  /** All references in the model, each tagged with the element that owns it. */
  references: ReferenceGroup[]
  /** Collision-safe lookup used by navigation, selection, and graphs. */
  byKey: Map<ReportElementKey, AnyElementView>
  /** Raw-id index retained for diagnostics and explicitly typed resolution. */
  elementsById: Map<string, AnyElementView[]>
  /** Scenarios grouped by their parent Journey, in authored order. */
  scenariosByJourney: Map<string, ScenarioView[]>
  /** Scenarios grouped by their parent Capability, in authored order. */
  scenariosByCapability: Map<string, ScenarioView[]>
  /** Capabilities grouped by Domain; `''` collects the undomained ones. */
  capabilitiesByDomain: Map<string, CapabilityView[]>
}

const titleOf = (items: Array<{ id: string, title?: string, name?: string }>, id: string): string =>
  items.find(item => item.id === id)?.title ?? items.find(item => item.id === id)?.name ?? id

/**
 * One context, keyed by its own id.
 *
 * An Experience id already names the Interface that owns it, so the key is just
 * that id; an undivided Interface keys by its own. Concatenating the two would
 * repeat the Interface segment.
 */
export function contextKey(interfaceId: string, experienceId: string): string {
  return experienceId || interfaceId
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function supportingMarkdown(sections: ReportSupportingSection[]): string {
  return sections
    .map(section => `## ${section.heading}${section.content ? `\n\n${section.content}` : ''}`)
    .join('\n\n')
}

function uniqueContexts(contexts: ContextView[]): ContextView[] {
  return [...new Map(contexts.map(context => [context.key, context])).values()]
}

/** Render a kebab-case identifier as a sentence-cased label. */
export function humanize(value: string): string {
  const label = value.replaceAll('-', ' ')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

function expandContexts(
  contexts: ReportContext[],
  interfaces: ReportInterface[],
  experiences: ReportExperience[],
  screens: ReportScreen[]
): ContextView[] {
  return contexts.map((context) => {
    const screen = screens.find(item => item.id === context.placeId)
    const containerId = screen ? context.placeId.split('::').slice(0, -1).join('::') : context.placeId
    const experience = experiences.find(item => item.id === containerId)
    const interfaceId = experience?.interfaceIds[0] || containerId
    const experienceId = experience?.id || ''
    return {
      placeId: context.placeId,
      placeKind: screen ? 'screen' : experience ? 'experience' : 'interface',
      interfaceId,
      experienceId,
      screenId: screen?.id || '',
      interfaceTitle: titleOf(interfaces, interfaceId),
      experienceTitle: experience?.title || '',
      screenTitle: screen?.title || '',
      key: context.placeId
    }
  })
}

function entryPoints(
  points: Array<{ type: string, path: string }>,
  interfaces: ReportInterface[],
  context: ResolvedContextView
): EntryPointView[] {
  return points.map(point => ({
    interfaceId: point.type,
    interfaceTitle: titleOf(interfaces, point.type),
    path: point.path,
    context,
    key: `${context.id}\0${point.type}\0${point.path}`
  }))
}

/**
 * Build the complete renderable projection of a Product Report.
 *
 * Relations are resolved in both directions. The format stores each relation
 * once — a Business Rule lists its Capabilities, a Capability never lists its
 * Rules — so every backlink here is derived, never authored.
 */
export function projectReportWorkspace(report: ProductReportV11): ReportWorkspace {
  const model = report.model
  const interfaceOf = (interfaceId: string): ReportInterface => {
    const productInterface = model.interfaces.find(item => item.id === interfaceId)
    if (!productInterface) throw new Error(`Unknown Interface "${interfaceId}" in Context place`)
    return productInterface
  }
  const contextsOf = (contexts: ReportContext[]) =>
    expandContexts(contexts, model.interfaces, model.experiences, model.screens)
  const resolveContext = (context: ReportContext): ContextView => contextsOf([context])[0]!
  const placeOf = (placeId: string): ResolvedContextView => {
    const screen = model.screens.find(item => item.id === placeId)
    if (screen) {
      const containerId = screen.id.split('::').slice(0, -1).join('::')
      const context = resolveContext({ placeId: containerId })
      const productInterface = interfaceOf(context.interfaceId)
      return {
        id: placeId,
        kind: 'screen',
        interfaceId: context.interfaceId,
        interfaceTitle: context.interfaceTitle,
        interfaceType: productInterface.type,
        experienceId: context.experienceId,
        experienceTitle: context.experienceTitle,
        screenId: screen.id,
        screenTitle: screen.title,
        boundary: context
      }
    }
    const experience = model.experiences.find(item => item.id === placeId)
    if (experience) {
      const interfaceId = experience.interfaceIds[0] || ''
      const productInterface = interfaceOf(interfaceId)
      const context = resolveContext({ placeId: experience.id })
      return {
        id: placeId,
        kind: 'experience',
        interfaceId,
        interfaceTitle: context.interfaceTitle,
        interfaceType: productInterface.type,
        experienceId: experience.id,
        experienceTitle: experience.title,
        screenId: '',
        screenTitle: '',
        boundary: context
      }
    }
    const productInterface = interfaceOf(placeId)
    const context = resolveContext({ placeId })
    return {
      id: placeId,
      kind: 'interface',
      interfaceId: placeId,
      interfaceTitle: productInterface.title,
      interfaceType: productInterface.type,
      experienceId: '',
      experienceTitle: '',
      screenId: '',
      screenTitle: '',
      boundary: context
    }
  }
  const scenarioContexts = (scenario: ReportCapabilityScenario | ReportJourneyScenario): ContextView[] => uniqueContexts(
    scenario.steps.flatMap(step => step.contexts.map(context => placeOf(context.placeId).boundary))
  )

  const kindBySlot = new Map(model.taxonomies.scenarioKinds.map(kind => [kind.id, kind]))
  const allReportScenarios = [...model.capabilityScenarios, ...model.journeyScenarios]
  const journeyScenariosOf = (journeyId: string) =>
    model.journeyScenarios.filter(scenario => scenario.journeyId === journeyId)
  const journeyContexts = (journeyId: string) => uniqueContexts(
    journeyScenariosOf(journeyId).filter(scenario => scenario.result === 'achieved').flatMap(scenario =>
      scenarioContexts(scenario))
  )
  const journeyEntryPoints = (journeyId: string): EntryPointView[] => {
    const points = journeyScenariosOf(journeyId)
      .filter(scenario => scenario.result === 'achieved')
      .flatMap((scenario) => {
        const first = scenario.steps.find(step => step.kind === 'actor' && step.contexts.length)
        if (!first) return []
        return first.contexts.flatMap((context) => {
          const place = placeOf(context.placeId)
          const contextual = place.experienceId
            ? model.experiences.find(item => item.id === place.experienceId)
              ?.entryPoints.filter(point => point.type === place.interfaceId) ?? []
            : []
          const available = contextual.length
            ? contextual
            : model.interfaces
                .find(item => item.id === place.interfaceId)
                ?.entryPoints.filter(point => point.type === place.interfaceId) ?? []
          return entryPoints(available, model.interfaces, place)
        })
      })
    return [...new Map(points.map(point => [point.key, point])).values()]
  }

  // Forward relation tables, collected before any view is built so a backlink
  // never depends on the order the collections happen to be projected in.
  const experiencesByInterface = new Map<string, string[]>()
  for (const experience of model.experiences) {
    for (const interfaceId of experience.interfaceIds) {
      experiencesByInterface.set(interfaceId, [...(experiencesByInterface.get(interfaceId) || []), experience.id])
    }
  }

  const capabilityById = new Map(model.capabilities.map(item => [item.id, item]))
  const journeyById = new Map(model.journeys.map(item => [item.id, item]))
  const capabilityScenarioById = new Map(model.capabilityScenarios.map(item => [item.id, item]))
  const journeyScenarioById = new Map(model.journeyScenarios.map(item => [item.id, item]))
  const journeysByCapability = new Map<string, string[]>()
  const screensByCapability = new Map<string, string[]>()
  const rulesByCapability = new Map<string, string[]>()
  const rulesByDomain = new Map<string, string[]>()
  const rulesByJourney = new Map<string, string[]>()
  const rulesByScenario = new Map<string, string[]>()
  const screensByScenario = new Map<string, string[]>()
  const journeysByActor = new Map<string, string[]>()
  const experiencesByActor = new Map<string, string[]>()
  const interfacesByActor = new Map<string, string[]>()
  const capabilityScenariosByActor = new Map<string, string[]>()
  const journeyScenariosByActor = new Map<string, string[]>()
  const journeyScenariosByCapability = new Map<string, string[]>()

  const push = (table: Map<string, string[]>, key: string, value: string) => {
    table.set(key, [...(table.get(key) || []), value])
  }

  const ruleRelationsById = new Map(model.businessRules.map((rule) => {
    const targetIds = (type: 'capability' | 'capability-scenario' | 'journey' | 'journey-scenario') =>
      rule.appliesTo.flatMap(target => target.type === type && 'id' in target ? [target.id] : [])
    const capabilityIds = targetIds('capability')
    const capabilityScenarioIds = targetIds('capability-scenario')
    const journeyIds = targetIds('journey')
    const journeyScenarioIds = targetIds('journey-scenario')
    const backlinkCapabilityIds = unique([
      ...capabilityIds,
      ...capabilityScenarioIds
        .map(id => capabilityScenarioById.get(id)?.capabilityId)
        .filter((id): id is string => Boolean(id))
    ])
    const backlinkJourneyIds = unique([
      ...journeyIds,
      ...journeyScenarioIds
        .map(id => journeyScenarioById.get(id)?.journeyId)
        .filter((id): id is string => Boolean(id))
    ])
    const derivedCapabilityIds = backlinkCapabilityIds.filter(id => !capabilityIds.includes(id))
    const derivedJourneyIds = backlinkJourneyIds.filter(id => !journeyIds.includes(id))
    const domainCapabilityIds = unique([
      ...backlinkCapabilityIds,
      ...journeyIds.flatMap(id => journeyById.get(id)?.capabilityIds || []),
      ...journeyScenarioIds.flatMap(id => journeyScenarioById.get(id)?.steps
        .flatMap(item => item.capabilityId ? [item.capabilityId] : []) || [])
    ])
    const domainIds = unique(domainCapabilityIds
      .map(id => capabilityById.get(id)?.domainId)
      .filter((id): id is string => Boolean(id)))
    const contexts = uniqueContexts(rule.appliesTo.flatMap((target) => {
      if (target.type === 'context') return [resolveContext(target.context)]
      if (target.contexts.length) return target.contexts.map(resolveContext)
      if (target.type === 'capability') {
        const capability = capabilityById.get(target.id)
        return capability ? contextsOf(capability.availability) : []
      }
      if (target.type === 'capability-scenario') {
        const scenario = capabilityScenarioById.get(target.id)
        return scenario ? scenarioContexts(scenario) : []
      }
      if (target.type === 'journey') return journeyContexts(target.id)
      const scenario = journeyScenarioById.get(target.id)
      return scenario ? scenarioContexts(scenario) : []
    }))
    return [rule.id, {
      capabilityIds,
      capabilityScenarioIds,
      journeyIds,
      journeyScenarioIds,
      backlinkCapabilityIds,
      backlinkJourneyIds,
      derivedCapabilityIds,
      derivedJourneyIds,
      domainIds,
      contexts
    }]
  }))

  for (const productInterface of model.interfaces) {
    for (const actorId of productInterface.actorIds) push(interfacesByActor, actorId, productInterface.id)
  }
  for (const experience of model.experiences) {
    for (const actorId of experience.actorIds) push(experiencesByActor, actorId, experience.id)
  }
  for (const journey of model.journeys) {
    for (const actorId of journey.actorIds) push(journeysByActor, actorId, journey.id)
    for (const capabilityId of journey.capabilityIds) push(journeysByCapability, capabilityId, journey.id)
  }
  for (const screen of model.screens) {
    for (const capabilityId of screen.capabilityIds) push(screensByCapability, capabilityId, screen.id)
    for (const scenarioId of [...screen.capabilityScenarioIds, ...screen.journeyScenarioIds]) {
      push(screensByScenario, scenarioId, screen.id)
    }
  }
  for (const scenario of model.capabilityScenarios) {
    for (const actorId of scenario.actorIds) push(capabilityScenariosByActor, actorId, scenario.id)
  }
  for (const scenario of model.journeyScenarios) {
    for (const actorId of scenario.actorIds) push(journeyScenariosByActor, actorId, scenario.id)
    for (const capabilityId of new Set(scenario.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : []))) {
      push(journeyScenariosByCapability, capabilityId, scenario.id)
    }
  }
  for (const rule of model.businessRules) {
    const relations = ruleRelationsById.get(rule.id)!
    for (const domainId of relations.domainIds) push(rulesByDomain, domainId, rule.id)
    for (const capabilityId of relations.backlinkCapabilityIds) push(rulesByCapability, capabilityId, rule.id)
    for (const journeyId of relations.backlinkJourneyIds) push(rulesByJourney, journeyId, rule.id)
    for (const scenarioId of [...relations.capabilityScenarioIds, ...relations.journeyScenarioIds]) {
      push(rulesByScenario, scenarioId, rule.id)
    }
  }

  const actors: ActorView[] = model.actors.map((actor: ReportActor) => ({
    key: elementKey('actor', actor.id),
    id: actor.id,
    kind: 'actor',
    title: actor.name,
    lead: actor.description,
    intent: actor.intent,
    supportingContent: supportingMarkdown(actor.supportingSections),
    references: actor.references,
    actorKind: actor.kind,
    relationship: actor.relationship,
    interfaceIds: interfacesByActor.get(actor.id) || [],
    experienceIds: experiencesByActor.get(actor.id) || [],
    journeyIds: journeysByActor.get(actor.id) || [],
    capabilityScenarioIds: capabilityScenariosByActor.get(actor.id) || [],
    journeyScenarioIds: journeyScenariosByActor.get(actor.id) || []
  }))

  const interfaces: InterfaceView[] = model.interfaces.map((item: ReportInterface) => {
    const experienceIds = experiencesByInterface.get(item.id) || []
    const declares = (contexts: ReportContext[]) =>
      contexts.some(context => context.placeId === item.id || context.placeId.startsWith(`${item.id}::`))
    const containsScreen = (screen: ReportScreen) => screen.id.startsWith(`${item.id}::`)
    return {
      key: elementKey('interface', item.id),
      id: item.id,
      kind: 'interface',
      title: item.title,
      interfaceType: item.type,
      lead: item.description,
      intent: item.intent,
      supportingContent: supportingMarkdown(item.supportingSections),
      references: item.references,
      actorIds: item.actorIds,
      entryPoints: entryPoints(item.entryPoints, model.interfaces, placeOf(item.id)),
      capabilityBoundary: item.capabilityBoundary,
      experienceIds,
      capabilityIds: model.capabilities.filter(c => declares(c.availability)).map(c => c.id),
      screenIds: model.screens.filter(containsScreen).map(s => s.id),
      journeyIds: model.journeys.filter(j => journeyContexts(j.id).some(context => context.interfaceId === item.id)).map(j => j.id)
    }
  })

  /*
    Domain is an axis, not a level: `domain` on a Capability is the only authored
    Domain edge, and everything else is about the Domains of the Capabilities it
    reaches. Deriving it keeps one authority — a second, authored copy could
    disagree with the first and nothing would say which was right.
  */
  const domainsOfCapabilities = (capabilityIds: string[]): string[] =>
    unique(capabilityIds.map(id => capabilityById.get(id)?.domainId).filter((id): id is string => Boolean(id)))

  const experiences: ExperienceView[] = model.experiences.map((item: ReportExperience) => {
    const declares = (contexts: ReportContext[]) =>
      contexts.some(context => context.placeId === item.id)
    const containsScreen = (screen: ReportScreen) => screen.id.startsWith(`${item.id}::`)
    return {
      key: elementKey('experience', item.id),
      id: item.id,
      kind: 'experience',
      title: item.title,
      lead: item.description,
      intent: item.intent,
      supportingContent: supportingMarkdown(item.supportingSections),
      references: item.references,
      actorIds: item.actorIds,
      interfaceIds: item.interfaceIds,
      accessMode: item.accessMode,
      entryPoints: entryPoints(item.entryPoints, model.interfaces, placeOf(item.id)),
      capabilityBoundary: item.capabilityBoundary,
      capabilityIds: model.capabilities.filter(c => declares(c.availability)).map(c => c.id),
      screenIds: model.screens.filter(containsScreen).map(s => s.id),
      journeyIds: model.journeys.filter(j => journeyContexts(j.id).some(context => context.experienceId === item.id)).map(j => j.id),
      domainIds: domainsOfCapabilities(model.capabilities.filter(c => declares(c.availability)).map(c => c.id))
    }
  })

  const screens: ScreenView[] = model.screens.map((screen: ReportScreen) => {
    const contexts = contextsOf([{ placeId: screen.id.split('::').slice(0, -1).join('::') }])
    const scenarioJourneyIds = unique(model.journeyScenarios
      .filter(scenario => screen.journeyScenarioIds.includes(scenario.id))
      .map(scenario => scenario.journeyId))
    const capabilityJourneyIds = unique(model.journeys
      .filter(journey => journey.capabilityIds.some(id => screen.capabilityIds.includes(id)))
      .map(journey => journey.id))
    return {
      key: elementKey('screen', screen.id),
      id: screen.id,
      kind: 'screen',
      title: screen.title,
      lead: screen.description,
      intent: screen.intent,
      supportingContent: supportingMarkdown(screen.supportingSections),
      references: screen.references,
      contexts,
      capabilityIds: screen.capabilityIds,
      capabilityScenarioIds: screen.capabilityScenarioIds,
      journeyScenarioIds: screen.journeyScenarioIds,
      scenarioIds: [...screen.capabilityScenarioIds, ...screen.journeyScenarioIds],
      entryPoints: entryPoints(screen.entryPoints, model.interfaces, placeOf(screen.id)),
      information: screen.information,
      actions: screen.actions,
      states: screen.states,
      capabilityBoundary: screen.capabilityBoundary,
      scenarioJourneyIds,
      capabilityJourneyIds,
      journeyIds: unique([...scenarioJourneyIds, ...capabilityJourneyIds]),
      interfaceIds: unique(contexts.map(context => context.interfaceId)),
      experienceIds: unique(contexts.map(context => context.experienceId).filter(Boolean)),
      domainIds: domainsOfCapabilities(screen.capabilityIds)
    }
  })

  const entities: EntityView[] = model.entities.map((entity: ReportEntity) => ({
    key: elementKey('entity', entity.id),
    id: entity.id,
    kind: 'entity' as const,
    title: entity.title,
    lead: entity.description,
    intent: entity.intent,
    supportingContent: supportingMarkdown(entity.supportingSections),
    references: entity.references,
    domainId: entity.domainId,
    states: entity.states.map(state => ({ name: state.name, content: state.content })),
    /*
     * States and transitions, and the Domain. No Capability relation: an Entity
     * declares none, and the format says a Capability names the Entities it acts
     * on *in prose*, so there is no structured edge to derive. Deriving one
     * through the shared Domain looked like a relation and was not — it read
     * empty for a product-wide Entity and over-claimed for a scoped one.
     */
    transitions: entity.transitions.map(transition => ({ from: transition.from, to: transition.to }))
  }))

  const domains: DomainView[] = model.domains.map((domain: ReportDomain) => {
    const capabilityIds = model.capabilities.filter(c => c.domainId === domain.id).map(c => c.id)
    return {
      key: elementKey('domain', domain.id),
      id: domain.id,
      kind: 'domain',
      title: domain.name,
      lead: domain.description,
      intent: domain.intent,
      supportingContent: supportingMarkdown(domain.supportingSections),
      references: domain.references,
      colorSlot: domain.colorSlot,
      capabilityIds,
      journeyIds: unique(capabilityIds.flatMap(id => journeysByCapability.get(id) || [])),
      screenIds: unique(capabilityIds.flatMap(id => screensByCapability.get(id) || [])),
      experienceIds: unique(model.capabilities
        .filter(c => c.domainId === domain.id)
        .flatMap(c => c.availability.map(context => context.placeId))
        .filter(placeId => model.experiences.some(experience => experience.id === placeId))),
      ruleIds: unique([
        ...(rulesByDomain.get(domain.id) || []),
        ...capabilityIds.flatMap(id => rulesByCapability.get(id) || [])
      ])
    }
  })

  const capabilities: CapabilityView[] = model.capabilities.map((capability: ReportCapability) => {
    const contexts = contextsOf(capability.availability)
    return {
      key: elementKey('capability', capability.id),
      id: capability.id,
      kind: 'capability',
      title: capability.title,
      lead: capability.description,
      intent: capability.intent,
      supportingContent: supportingMarkdown(capability.supportingSections),
      references: capability.references,
      domainId: capability.domainId,
      contexts,
      scenarioIds: model.capabilityScenarios
        .filter(scenario => scenario.capabilityId === capability.id)
        .map(scenario => scenario.id),
      journeyScenarioIds: journeyScenariosByCapability.get(capability.id) || [],
      journeyIds: journeysByCapability.get(capability.id) || [],
      screenIds: screensByCapability.get(capability.id) || [],
      ruleIds: rulesByCapability.get(capability.id) || [],
      interfaceIds: unique(contexts.map(context => context.interfaceId)),
      experienceIds: unique(contexts.map(context => context.experienceId).filter(Boolean))
    }
  })

  const journeys: JourneyView[] = model.journeys.map((journey: ReportJourney) => {
    const contexts = journeyContexts(journey.id)
    const journeyScenarios = journeyScenariosOf(journey.id)
    const scenarioIds = journeyScenarios.map(scenario => scenario.id)
    return {
      key: elementKey('journey', journey.id),
      id: journey.id,
      kind: 'journey',
      title: journey.title,
      lead: journey.goal,
      intent: journey.intent,
      supportingContent: supportingMarkdown(journey.supportingSections),
      references: journey.references,
      actorIds: journey.actorIds,
      capabilityIds: journey.capabilityIds,
      failureOnlyCapabilityIds: journey.failureOnlyCapabilityIds,
      successCriterion: journey.successCriterion,
      contexts,
      entryPoints: journeyEntryPoints(journey.id),
      scenarioIds,
      domainIds: unique(journey.capabilityIds
        .map(id => capabilityById.get(id)?.domainId)
        .filter((id): id is string => Boolean(id))),
      screenIds: unique([
        ...scenarioIds.flatMap(id => screensByScenario.get(id) || []),
        ...journey.capabilityIds.flatMap(id => screensByCapability.get(id) || [])
      ]),
      ruleIds: unique([
        ...(rulesByJourney.get(journey.id) || []),
        ...scenarioIds.flatMap(id => rulesByScenario.get(id) || [])
      ]),
      interfaceIds: unique(contexts.map(context => context.interfaceId)),
      experienceIds: unique(contexts.map(context => context.experienceId).filter(Boolean)),
      stepCount: journeyScenarios.reduce((total, scenario) => total + scenario.steps.length, 0)
    }
  })

  const scenarioSteps = (scenario: ReportCapabilityScenario | ReportJourneyScenario): ScenarioView['steps'] =>
    scenario.steps.map(step => ({
      text: step.text,
      stepKind: step.kind,
      actorId: step.actorId ?? '',
      capabilityId: step.capabilityId ?? '',
      contexts: step.contexts.map(context => ({
        routeId: context.routeId,
        context: placeOf(context.placeId)
      }))
    }))

  const capabilityScenarios: ScenarioView[] = model.capabilityScenarios.map((scenario: ReportCapabilityScenario) => {
    const kind = kindBySlot.get(scenario.kindId)
    return {
      key: elementKey('capability-scenario', scenario.id),
      id: scenario.id,
      kind: 'capability-scenario',
      title: scenario.title,
      lead: scenario.trigger,
      intent: scenario.intent,
      supportingContent: supportingMarkdown(scenario.supportingSections),
      references: scenario.references,
      scenarioType: 'capability',
      capabilityId: scenario.capabilityId,
      capabilityTitle: titleOf(model.capabilities, scenario.capabilityId),
      actorIds: scenario.actorIds,
      journeyId: '',
      journeyTitle: '',
      kindId: scenario.kindId,
      kindName: kind?.name ?? humanize(scenario.kindId),
      kindSlot: kind?.colorSlot ?? 1,
      contexts: scenarioContexts(scenario),
      trigger: scenario.trigger,
      routes: scenario.routes,
      steps: scenarioSteps(scenario),
      decisionPoints: scenario.decisionPoints,
      outcome: scenario.outcome,
      edgeCases: scenario.edgeCases,
      result: '',
      screenIds: screensByScenario.get(scenario.id) || [],
      ruleIds: rulesByScenario.get(scenario.id) || []
    }
  })

  const journeyScenarios: ScenarioView[] = model.journeyScenarios.map((scenario: ReportJourneyScenario) => {
    const kind = kindBySlot.get(scenario.kindId)
    return {
      key: elementKey('journey-scenario', scenario.id),
      id: scenario.id,
      kind: 'journey-scenario',
      title: scenario.title,
      lead: scenario.trigger,
      intent: scenario.intent,
      supportingContent: supportingMarkdown(scenario.supportingSections),
      references: scenario.references,
      scenarioType: 'journey',
      capabilityId: '',
      capabilityTitle: '',
      actorIds: scenario.actorIds,
      journeyId: scenario.journeyId,
      journeyTitle: titleOf(model.journeys, scenario.journeyId),
      kindId: scenario.kindId,
      kindName: kind?.name ?? humanize(scenario.kindId),
      kindSlot: kind?.colorSlot ?? 1,
      contexts: scenarioContexts(scenario),
      trigger: scenario.trigger,
      routes: scenario.routes,
      steps: scenarioSteps(scenario),
      decisionPoints: scenario.decisionPoints,
      outcome: scenario.outcome,
      edgeCases: scenario.edgeCases,
      result: scenario.result,
      screenIds: screensByScenario.get(scenario.id) || [],
      ruleIds: rulesByScenario.get(scenario.id) || []
    }
  })

  const scenarios: ScenarioView[] = [...capabilityScenarios, ...journeyScenarios]

  const rules: RuleView[] = model.businessRules.map((rule: ReportBusinessRule) => {
    const relations = ruleRelationsById.get(rule.id)!
    return {
      key: elementKey('rule', rule.id),
      id: rule.id,
      kind: 'rule',
      title: rule.title,
      lead: rule.statement,
      intent: rule.intent,
      supportingContent: supportingMarkdown(rule.supportingSections),
      references: rule.references,
      statement: rule.statement,
      rationale: rule.rationale,
      domainIds: relations.domainIds,
      capabilityIds: relations.capabilityIds,
      journeyIds: relations.journeyIds,
      capabilityScenarioIds: relations.capabilityScenarioIds,
      journeyScenarioIds: relations.journeyScenarioIds,
      scenarioIds: [...relations.capabilityScenarioIds, ...relations.journeyScenarioIds],
      derivedCapabilityIds: relations.derivedCapabilityIds,
      derivedJourneyIds: relations.derivedJourneyIds,
      contexts: relations.contexts,
      appliesTo: rule.appliesTo
    }
  })

  const allElements: AnyElementView[] = [
    ...actors,
    ...interfaces,
    ...experiences,
    ...screens,
    ...domains,
    ...entities,
    ...capabilities,
    ...journeys,
    ...scenarios,
    ...rules
  ]

  const references: ReferenceGroup[] = [
    ...report.references.map(reference => ({
      reference,
      ownerKey: '' as const,
      ownerId: report.id,
      ownerTitle: report.title,
      ownerKind: 'product' as const
    })),
    ...allElements.flatMap(element => element.references.map(reference => ({
      reference,
      ownerKey: element.key,
      ownerId: element.id,
      ownerTitle: element.title,
      ownerKind: element.kind
    })))
  ]

  const contextSeen = new Map<string, ContextView>()
  for (const element of allElements) {
    const contexts = (element as { contexts?: ContextView[] }).contexts || []
    for (const context of contexts) if (!contextSeen.has(context.key)) contextSeen.set(context.key, context)
  }
  // Every Experience declares its Interfaces even when nothing is mapped to the
  // Context yet, so the matrix axis is complete rather than sampled from usage.
  for (const experience of model.experiences) {
    for (const interfaceId of experience.interfaceIds) {
      const key = contextKey(interfaceId, experience.id)
      if (!contextSeen.has(key)) {
        contextSeen.set(key, {
          placeId: experience.id,
          placeKind: 'experience',
          interfaceId,
          experienceId: experience.id,
          screenId: '',
          interfaceTitle: titleOf(model.interfaces, interfaceId),
          experienceTitle: experience.title,
          screenTitle: '',
          key
        })
      }
    }
  }

  const counts: WorkspaceCounts = {
    actors: model.actors.length,
    interfaces: model.interfaces.length,
    experiences: model.experiences.length,
    screens: model.screens.length,
    domains: model.domains.length,
    entities: model.entities.length,
    capabilities: model.capabilities.length,
    journeys: model.journeys.length,
    capabilityScenarios: model.capabilityScenarios.length,
    journeyScenarios: model.journeyScenarios.length,
    scenarios: allReportScenarios.length,
    rules: model.businessRules.length,
    steps: allReportScenarios.reduce((total, item) => total + item.steps.length, 0),
    decisionPoints: allReportScenarios.reduce((total, item) => total + item.decisionPoints.length, 0),
    branches: allReportScenarios.reduce(
      (total, item) => total + item.decisionPoints.reduce((sum, point) => sum + point.branches.length, 0),
      0
    ),
    edgeCases: allReportScenarios.reduce((total, item) => total + item.edgeCases.length, 0),
    screenStates: model.screens.reduce((total, item) => total + item.states.length, 0),
    entryPoints: [...model.interfaces, ...model.experiences, ...model.screens]
      .reduce((total, item) => total + item.entryPoints.length, 0),
    references: references.length,
    availabilityContexts: contextSeen.size
  }

  const scenarioKinds = model.taxonomies.scenarioKinds.map(kind => ({
    id: kind.id,
    name: kind.name,
    description: kind.description,
    slot: kind.colorSlot ?? 1,
    count: allReportScenarios.filter(scenario => scenario.kindId === kind.id).length
  }))

  const scenariosByJourney = new Map<string, ScenarioView[]>()
  for (const scenario of scenarios) {
    if (!scenario.journeyId) continue
    scenariosByJourney.set(scenario.journeyId, [...(scenariosByJourney.get(scenario.journeyId) || []), scenario])
  }

  /* Both parents index their children the same way: the Product Report reads a
     Capability's Scenarios exactly where it reads a Journey's. */
  const scenariosByCapability = new Map<string, ScenarioView[]>()
  for (const scenario of scenarios) {
    if (!scenario.capabilityId) continue
    scenariosByCapability.set(
      scenario.capabilityId,
      [...(scenariosByCapability.get(scenario.capabilityId) || []), scenario]
    )
  }

  const capabilitiesByDomain = new Map<string, CapabilityView[]>()
  for (const capability of capabilities) {
    const key = capability.domainId ?? ''
    capabilitiesByDomain.set(key, [...(capabilitiesByDomain.get(key) || []), capability])
  }

  const elementsById = new Map<string, AnyElementView[]>()
  for (const element of allElements) {
    elementsById.set(element.id, [...(elementsById.get(element.id) ?? []), element])
  }

  return {
    identity: {
      id: report.id,
      title: report.title,
      summary: report.summary,
      description: report.description,
      category: report.category,
      categoryLabel: report.category ? humanize(report.category) : null,
      tags: report.tags,
      authors: report.authors,
      license: report.license,
      intent: report.intent,
      supportingContent: supportingMarkdown(report.supportingSections),
      references: report.references,
      referenceProfile: report.referenceProfile,
      limitations: report.limitations,
      generatedAt: report.generatedAt,
      generator: report.generator,
      schemaVersion: report.schemaVersion
    },
    coverage: report.coverage,
    counts,
    scenarioKinds,
    actors,
    interfaces,
    experiences,
    screens,
    domains,
    entities,
    capabilities,
    journeys,
    capabilityScenarios,
    journeyScenarios,
    scenarios,
    rules,
    contexts: [...contextSeen.values()].sort((left, right) =>
      left.interfaceId.localeCompare(right.interfaceId) || left.experienceId.localeCompare(right.experienceId)),
    references,
    byKey: new Map(allElements.map(element => [element.key, element])),
    elementsById,
    scenariosByJourney,
    scenariosByCapability,
    capabilitiesByDomain
  }
}

/**
 * The same thing on another Interface.
 *
 * Qualified ids carry their path, so two elements of one kind sharing the
 * path *below* their Interface are counterparts:
 * `reader-web::personal-library::unread-library` and
 * `reader-mobile::personal-library::unread-library` are one goal on two
 * Interfaces, and the format says so on purpose. Matching the whole suffix rather
 * than the last segment keeps `personal-library::saved-items` and
 * `public-reading::saved-items` correctly distinct inside one Interface.
 *
 * The CLI computes this over authored files; the viewer computes it over the
 * report, from the same ids, because the report carries no counterpart field
 * and should not need one.
 */
export function counterpartsOf(workspace: ReportWorkspace, element: AnyElementView): AnyElementView[] {
  const suffix = element.id.split('::').slice(1).join('::')
  if (!suffix) return []
  return elementsOfKindInternal(workspace, element.kind)
    .filter(other => other.key !== element.key
      && other.id.split('::').slice(1).join('::') === suffix)
}

function elementsOfKindInternal(workspace: ReportWorkspace, kind: ReportElementKind): AnyElementView[] {
  switch (kind) {
    case 'interface': return workspace.interfaces
    case 'experience': return workspace.experiences
    case 'screen': return workspace.screens
    default: return []
  }
}

/** Resolve one id within a kind's collection. */
export function resolveElement(
  workspace: ReportWorkspace,
  kind: ReportElementKind,
  id: string
): AnyElementView | undefined {
  return workspace.byKey.get(elementKey(kind, id))
}

/**
 * Resolve a Scenario id when the caller holds a mixed list.
 *
 * Scenario ids are globally unique across both collections, so an id alone is
 * enough — but only the projection knows which collection it landed in.
 */
export function resolveScenario(workspace: ReportWorkspace, id: string): ScenarioView | undefined {
  for (const kind of SCENARIO_KINDS) {
    const element = workspace.byKey.get(elementKey(kind, id))
    if (element) return element as ScenarioView
  }
  return undefined
}

export function resolveElementKey(workspace: ReportWorkspace, key: ReportElementKey): AnyElementView | undefined {
  return workspace.byKey.get(key)
}

export function resolveElements(
  workspace: ReportWorkspace,
  kind: ReportElementKind,
  ids: string[]
): AnyElementView[] {
  return ids
    .map(id => resolveElement(workspace, kind, id))
    .filter((element): element is AnyElementView => Boolean(element))
}

/** Resolve a mixed Scenario id list, dropping anything unresolved. */
export function resolveScenarios(workspace: ReportWorkspace, ids: string[]): ScenarioView[] {
  return ids
    .map(id => resolveScenario(workspace, id))
    .filter((element): element is ScenarioView => Boolean(element))
}

/** One route's Context at one Scenario step. */
export interface ScenarioStepCell {
  routeId: string
  context: ResolvedContextView | null
  previousContext: ResolvedContextView | null
  /** This route arrives here at a different Context than its previous contextualized Step. */
  contextChanged: boolean
}

export interface ScenarioStepRow {
  index: number
  text: string
  stepKind: 'actor' | 'product' | 'condition'
  actorId: string
  capabilityId: string
  routeNeutral: boolean
  /** One cell per route, in authored route order. */
  cells: ScenarioStepCell[]
}

export interface ScenarioStepMatrix {
  routes: Array<{ id: string, name: string }>
  steps: ScenarioStepRow[]
}

/**
 * Either Scenario type's one authored sequence: Steps down, named routes
 * across, and the Context in every placed cell. Route-neutral Steps
 * keep their place in the reading and span the route columns.
 */
export function scenarioStepMatrix(scenario: ScenarioView): ScenarioStepMatrix {
  const routeIds = scenario.routes.map(route => route.id)
  const previousContexts = new Map<string, ResolvedContextView>()
  const steps = scenario.steps.map((step, index) => {
    const cells = routeIds.map((routeId) => {
      const context = step.contexts.find(item => item.routeId === routeId)?.context ?? null
      const before = previousContexts.get(routeId)
      const cell = {
        routeId,
        context,
        previousContext: before ?? null,
        contextChanged: Boolean(before && context && before.id !== context.id)
      }
      if (context) previousContexts.set(routeId, context)
      return cell
    })
    return {
      index,
      text: step.text,
      stepKind: step.stepKind,
      actorId: step.actorId,
      capabilityId: step.capabilityId,
      routeNeutral: step.contexts.length === 0,
      cells
    }
  })
  return { routes: scenario.routes, steps }
}
