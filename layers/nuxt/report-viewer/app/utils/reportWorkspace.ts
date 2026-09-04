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
  ProductReportV13,
  ReportContext,
  ReportBusinessRule,
  ReportBusinessRuleTarget,
  ReportCapability,
  ReportCapabilityScenario,
  ReportCoverage,
  ReportDecisionPoint,
  ReportDomain,
  ReportEntity,
  ReportEntityRelation,
  ReportExperience,
  ReportGrant,
  ReportGrantCondition,
  ReportInterface,
  ReportJourney,
  ReportJourneyScenario,
  ReportReference,
  ReportScreen,
  ReportScreenState,
  ReportSupportingSection
} from 'businesslens/report'

/**
 * Split an authored `cardinality` into its two ends.
 *
 * A relation is authored once and read from both sides. The side that declares
 * it reads the `target` end — how many of the other Entity it reaches — and the
 * side it points at reads `source`. Copying one end onto both is how an Item
 * came to claim many Sources on a page whose whole point was that it has one.
 */
export function relationEnds(cardinality: ReportEntityRelation['cardinality']): {
  source: 'one' | 'many'
  target: 'one' | 'many'
} {
  const [source, , target] = cardinality.split('-') as ['one' | 'many', string, 'one' | 'many']
  return { source, target }
}

export type ReportResourceKind =
  | 'product'
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
export type ReportResourceKey = string

export const SCENARIO_KINDS: ReportScenarioKind[] = ['capability-scenario', 'journey-scenario']

export function isScenarioKind(kind: ReportResourceKind): kind is ReportScenarioKind {
  return kind === 'capability-scenario' || kind === 'journey-scenario'
}

export function scenarioKindOf(type: ReportScenarioType): ReportScenarioKind {
  return type === 'capability' ? 'capability-scenario' : 'journey-scenario'
}

/** Stable UI identity; raw ids are unique only within a resource collection. */
export function resourceKey(kind: ReportResourceKind, id: string): ReportResourceKey {
  return `${kind}:${id}`
}

export interface ResourceKindMeta {
  kind: ReportResourceKind
  /** Singular label used in prose and inspectors. */
  label: string
  /** Plural label used for section headings and counts. */
  plural: string
  icon: string
  /** Index into the report palette; also drives graph node colour. */
  slot: number
}

/**
 * Every kind, once, in rail order.
 *
 * The type annotation is doing real work here. This was two lists — an array of the rail
 * kinds and a record spread from it, closed with `as Record<ReportResourceKind,
 * ResourceKindMeta>` — and that cast asserted completeness instead of proving it.
 * A kind added to `ReportResourceKind` and forgotten here compiled, then rendered
 * `undefined.icon` and `undefined.plural` at runtime, which is exactly how
 * Entity reached its own page with no icon and its rail row with no count.
 *
 * Insertion order is the rail order, and `Object.values` preserves it for
 * string keys — so the ordered list below is derived rather than restated.
 * Product sits last because it is the report itself, not a rail collection.
 */
export const ENTITY_KIND_META: Record<ReportResourceKind, ResourceKindMeta> = {
  /*
    Entity leads the rail and takes slot 0 outright. There is one resource type
    for things — the people and systems that act on the Product included — so
    the collection a reader opens first is the one that says who it is for and
    what it keeps. Actor is the word for the subset that acts, and it is a facet
    over this collection rather than a row of its own.
  */
  entity: { kind: 'entity', label: 'Entity', plural: 'Entities', icon: 'i-lucide-box', slot: 0 },
  interface: { kind: 'interface', label: 'Interface', plural: 'Interfaces', icon: 'i-lucide-plug', slot: 1 },
  experience: { kind: 'experience', label: 'Experience', plural: 'Experiences', icon: 'i-lucide-layout-panel-left', slot: 2 },
  screen: { kind: 'screen', label: 'Screen', plural: 'Screens', icon: 'i-lucide-monitor', slot: 3 },
  domain: { kind: 'domain', label: 'Domain', plural: 'Domains', icon: 'i-lucide-boxes', slot: 4 },
  capability: { kind: 'capability', label: 'Capability', plural: 'Capabilities', icon: 'i-lucide-zap', slot: 5 },
  journey: { kind: 'journey', label: 'Journey', plural: 'Journeys', icon: 'i-lucide-route', slot: 6 },
  /*
    Both Scenario kinds hold slot 7. Ten kinds is past the nine-slot categorical
    order, and the two that belong to one family are the honest pair to merge:
    the shared hue reads as "Scenario", and the icon, label and node sublabel
    carry the distinction — colour is never the only encoding here.
  */
  'capability-scenario': { kind: 'capability-scenario', label: 'Capability Scenario', plural: 'Capability Scenarios', icon: 'i-lucide-list-checks', slot: 7 },
  'journey-scenario': { kind: 'journey-scenario', label: 'Journey Scenario', plural: 'Journey Scenarios', icon: 'i-lucide-list-ordered', slot: 7 },
  rule: { kind: 'rule', label: 'Business rule', plural: 'Business rules', icon: 'i-lucide-scale', slot: 8 },
  product: { kind: 'product', label: 'Product', plural: 'Product', icon: 'i-lucide-package', slot: 9 }
}

/**
 * A kind ordering that has to name every kind, checked when it is written.
 *
 * `EVERYTHING_SHELF_ORDER` was a plain `ReportResourceKind[]`, so adding Entity
 * to the model left it out of the one view whose question is "the entire
 * product, all at once" — and the kind filter, seeing no shelf for it, removed
 * all thirteen. An ordering is the one place a missing kind is invisible: the
 * list still looks complete, because nothing about it says what complete is.
 *
 * A missing kind turns the parameter into a shape no array satisfies, and the
 * compiler names the absentee in the failure.
 */
export function everyKind<const T extends readonly ReportResourceKind[]>(
  kinds: Exclude<ReportResourceKind, T[number]> extends never
    ? T
    : { orderingIsMissingResourceKind: Exclude<ReportResourceKind, T[number]> }
): T {
  return kinds as T
}

/** The rail collections, in rail order. Product is the report, not a collection. */
export const REPORT_ENTITY_KINDS: ResourceKindMeta[] =
  Object.values(ENTITY_KIND_META).filter(meta => meta.kind !== 'product')

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

export type ActingKind = NonNullable<ReportEntity['kind']>
export type ActingSide = NonNullable<ReportEntity['acts']>

/** The mark an Entity that acts is drawn with: a person or a system. */
export const ACTOR_KIND_META: Record<ActingKind, { label: string, icon: string }> = {
  person: { label: 'Person', icon: 'i-lucide-user-round' },
  system: { label: 'System', icon: 'i-lucide-cpu' }
}

/** Which side of the Product boundary an Entity acts from. */
export const ACTOR_ACTS_META: Record<ActingSide, { label: string }> = {
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

interface ResourceBase {
  key: ReportResourceKey
  id: string
  kind: ReportResourceKind
  title: string
  /** Lead prose: description, summary, or rule statement depending on kind. */
  lead: string
  intent: string
  supportingContent: string
  references: ReportReference[]
}

export interface InterfaceView extends ResourceBase {
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

export interface ExperienceView extends ResourceBase {
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

export interface ScreenView extends ResourceBase {
  /** The Entities this view presents, as authored. */
  entityIds: string[]
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

export interface DomainView extends ResourceBase {
  kind: 'domain'
  /** Experiences reached through this Domain's Capabilities. Never authored. */
  experienceIds: string[]
  /** Entities in this subject region. Authored on the Entity, read back here. */
  entityIds: string[]
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
/** An authored relation, resolved for the side being read. */
export interface EntityRelationView {
  entityId: string
  verb: string
  /** How many of `entityId` the Entity being read relates to. */
  cardinality: 'one' | 'many'
  /**
   * Both ends exactly as authored, source to target of the *declaring* side.
   *
   * A row reads one end and needs `cardinality`; a diagram draws the edge once
   * and needs both. Only the declaring side's rows carry a meaningful `ends`,
   * which is why an inbound row reads `cardinality` and never this.
   */
  ends: ReportEntityRelation['cardinality']
}

/**
 * One state the thing can be in, and the Scenarios that leave it there.
 *
 * The back-link is derived, never authored: a Step names the Entity and the
 * state it moves it to. Without it a lifecycle said what a thing can be and
 * never what actually puts it there.
 */
export interface EntityStateView {
  name: string
  content: string
  /** Capability Scenarios whose Steps leave the Entity in this state. */
  capabilityScenarioIds: string[]
  /** Journey Scenarios whose Steps leave the Entity in this state. */
  journeyScenarioIds: string[]
  /**
   * Whether the composed lifecycle ever gets here. The first listed state is
   * where a thing starts, so it is reached by construction; every other state
   * has to be produced by some Step, and one that is not is drawn as unreached
   * rather than dropped.
   */
  reached: boolean
}

/** A named fact the Product keeps, and the Rules that govern it. */
export interface EntityFactView {
  name: string
  description: string
  /** Rules whose Entity target names this fact — a derivation, or field-level visibility. */
  ruleIds: string[]
}

/**
 * One arc of the composed state machine.
 *
 * Nothing here is authored on the Entity. Every arc is a Step somewhere that
 * creates, moves or removes the thing, grouped by what it does; its labels are
 * the Capabilities those Steps belong to; its constraints are the Rules whose
 * target selects that operation; and its co-effects are what the same Steps do
 * to other things at the same time — the only place the model makes a
 * combined cross-entity lifecycle visible.
 */
export interface EntityArcView {
  key: string
  effect: 'creates' | 'changes' | 'removes'
  /** Empty for a creation. */
  from: string
  /** Empty for a removal, and for an information change. */
  to: string
  capabilityIds: string[]
  capabilityScenarioIds: string[]
  journeyScenarioIds: string[]
  /** Rules with grants that select this operation. */
  ruleIds: string[]
  /** A Rule closing this operation to everyone; the arc is drawn as forbidden. */
  forbiddenByRuleIds: string[]
  coEffects: Array<{ entityId: string, effect: 'creates' | 'changes' | 'removes', to: string }>
}

/** An operation a Rule closes to everyone, read on the state it would leave. */
export interface EntityProhibitionView {
  ruleId: string
  effect: 'creates' | 'changes' | 'removes' | 'reads' | ''
  from: string
  to: string
}

export interface EntityView extends ResourceBase {
  kind: 'entity'
  domainId?: string
  /**
   * `person` or `system` when the thing acts, else null. There is one resource
   * type for things; "Actor" is the word for the subset that acts.
   */
  entityKind: ActingKind | null
  /** Which side of the Product boundary it acts from, or null for a thing that does not act. */
  acts: ActingSide | null
  /** What the Product keeps about the thing, by name. Never how it is stored. */
  informationKept: EntityFactView[]
  states: EntityStateView[]
  /** The composed lifecycle: every arc a Step draws, labelled, constrained, and with its co-effects. */
  arcs: EntityArcView[]
  /** Operations a Rule closes to everyone. */
  prohibitions: EntityProhibitionView[]
  /** Notes the page shows and lint never reports: a thing with states nothing creates, or nothing ends. */
  noCreation: boolean
  noTermination: boolean
  /** Edges this Entity declares, each carrying how many of the target it reaches. */
  relations: EntityRelationView[]
  /**
   * Edges other Entities declare at this one, flipped.
   *
   * `cardinality` here is the *source* end of the authored relation — how many
   * of the other Entity this one relates to. A Source publishing many Items
   * means an Item has one Source, and copying the authored end instead printed
   * the opposite on the Item's page.
   */
  inboundRelations: EntityRelationView[]
  /** Capabilities whose Steps create, change or remove this Entity. Derived. */
  changedByIds: string[]
  /** Capabilities whose Steps only read it. Derived, never merged into changedByIds. */
  readByIds: string[]
  /** Screens that declare presenting it. Derived. */
  presentedOnIds: string[]
  /** Rules with an Entity target naming this thing. Derived. */
  ruleIds: string[]
  /* Where it acts. Empty for a thing that does not act. */
  interfaceIds: string[]
  experienceIds: string[]
  journeyIds: string[]
  /** Scenarios whose Steps name it as an actor, performing or attributed. */
  actorCapabilityScenarioIds: string[]
  actorJourneyScenarioIds: string[]
}

/**
 * What one Capability does to one Entity, aggregated over its Scenarios.
 *
 * One line per Entity, never a lifecycle fragment each: a Capability that
 * touches thirteen things gets thirteen lines, which a page can carry, and not
 * thirteen state machines, which it cannot.
 */
export interface CapabilityEntityEffectView {
  entityId: string
  effects: Array<{ effect: 'creates' | 'changes' | 'removes', from: string, to: string }>
  scenarioIds: string[]
}

export interface CapabilityView extends ResourceBase {
  kind: 'capability'
  domainId?: string
  /** The Entities its Scenarios' Steps create, change or remove. Derived, never authored. */
  entityIds: string[]
  /** The Entities its Steps only read. Derived, never merged into entityIds. */
  readEntityIds: string[]
  entityEffects: CapabilityEntityEffectView[]
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

export interface JourneyView extends ResourceBase {
  kind: 'journey'
  actorIds: string[]
  capabilityIds: string[]
  failureOnlyCapabilityIds: string[]
  successCriterion: string
  contexts: ContextView[]
  entryPoints: EntryPointView[]
  scenarioIds: string[]
  domainIds: string[]
  /** Entities its Scenarios' Steps change. Derived, exactly as domainIds are. */
  entityIds: string[]
  /** Where its achieved Scenarios leave each thing they changed. Derived, beside the Success criterion. */
  leavesBehind: ScenarioStepEntityView[]
  screenIds: string[]
  ruleIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
  /** Total steps across the Journey's Scenarios — a rough weight for layout. */
  stepCount: number
}

/**
 * What one Step does to one Entity, as the wire carries it: the effect resolved,
 * the alias for a second instance of one thing, and the states it leaves from
 * and lands in. Nothing is derived from a neighbouring Step.
 */
export interface ScenarioStepEntityView {
  entityId: string
  /** Scenario-local instance alias, or empty. */
  as: string
  effect: 'creates' | 'changes' | 'removes' | 'reads'
  from: string
  to: string
}

export interface ScenarioView extends ResourceBase {
  /** Entities the Steps create, change or remove. Derived, exactly as the Actor set is. */
  entityIds: string[]
  /** Entities the Steps only read. Derived, and never merged into entityIds. */
  readEntityIds: string[]
  /**
   * Where each changed instance is left when the Scenario ends.
   *
   * The last non-read entry naming it, in Step order — which is what "what did
   * this accomplish" means, and what the Outcome prose says in words.
   */
  outcomeStates: ScenarioStepEntityView[]
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
    /**
     * What this Step does to the Product's Entities, in authored order.
     *
     * A list because one observable act can move two things at once. The
     * Scenario's `entityIds` is this set deduped across Steps, which answers
     * *what* a Scenario touches but never *where*; the reading is the sequence,
     * so the entries belong on the Step that causes them.
     */
    entities: ScenarioStepEntityView[]
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

/** One grant, read back as a sentence a reader who never saw the format can judge. */
export interface GrantView {
  /** Who: the acting Entities, the path, the thing itself, the schedule, the gate. */
  who: string
  /** The conditions, each a phrase; AND-ed. */
  when: string[]
  sentence: string
}

export interface RuleEntityTargetView {
  entityId: string
  effect: 'creates' | 'changes' | 'removes' | 'reads' | ''
  from: string
  to: string
  facts: string[]
  contexts: ContextView[]
}

export interface RuleView extends ResourceBase {
  kind: 'rule'
  statement: string
  rationale: string
  /** Entities its Entity targets name. */
  entityIds: string[]
  entityTargets: RuleEntityTargetView[]
  /** Null when the Rule makes no authorization claim; empty when it forbids the operation to everyone. */
  permits: ReportGrant[] | null
  grants: GrantView[]
  /** True exactly when `permits` is the empty list. */
  prohibits: boolean
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

export type AnyResourceView =
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
  /** Entities that act. A facet of `entities`, not a collection of its own. */
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
  ownerKey: ReportResourceKey | ''
  ownerId: string
  ownerTitle: string
  ownerKind: ReportResourceKind
}

export interface ReportWorkspace {
  identity: ReportIdentity
  coverage: ReportCoverage
  counts: WorkspaceCounts
  scenarioKinds: Array<{ id: string, name: string, description: string, slot: number, count: number }>
  /** The Entities that act, in authored order: the "Actors" facet of `entities`. */
  actingEntities: EntityView[]
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
  /** All references in the model, each tagged with the resource that owns it. */
  references: ReferenceGroup[]
  /** Collision-safe lookup used by navigation, selection, and graphs. */
  byKey: Map<ReportResourceKey, AnyResourceView>
  /** Raw-id index retained for diagnostics and explicitly typed resolution. */
  resourcesById: Map<string, AnyResourceView[]>
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
export function projectReportWorkspace(report: ProductReportV13): ReportWorkspace {
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
  const rulesByEntity = new Map<string, string[]>()
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
    const entityIds = unique(rule.appliesTo.flatMap(target => target.type === 'entity' ? [target.entityId] : []))
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
    const domainIds = unique([
      ...domainCapabilityIds.map(id => capabilityById.get(id)?.domainId),
      ...entityIds.map(id => model.entities.find(entity => entity.id === id)?.domainId)
    ].filter((id): id is string => Boolean(id)))
    const contexts = uniqueContexts(rule.appliesTo.flatMap((target) => {
      if (target.type === 'context') return [resolveContext(target.context)]
      if (target.contexts.length) return target.contexts.map(resolveContext)
      /* An Entity target with no place scope governs the thing wherever it is,
         which is nowhere in particular. */
      if (target.type === 'entity') return []
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
      entityIds,
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
    for (const entityId of relations.entityIds) push(rulesByEntity, entityId, rule.id)
  }

  const interfaces: InterfaceView[] = model.interfaces.map((item: ReportInterface) => {
    const experienceIds = experiencesByInterface.get(item.id) || []
    const declares = (contexts: ReportContext[]) =>
      contexts.some(context => context.placeId === item.id || context.placeId.startsWith(`${item.id}::`))
    const containsScreen = (screen: ReportScreen) => screen.id.startsWith(`${item.id}::`)
    return {
      key: resourceKey('interface', item.id),
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
      key: resourceKey('experience', item.id),
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
      key: resourceKey('screen', screen.id),
      entityIds: screen.entityIds,
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

  /*
   * Everything the Steps say about every Entity, indexed once.
   *
   * The lifecycle is composed here and nowhere else: which Scenarios leave a
   * thing in which state, which Capabilities change it, and every arc a Step
   * draws. Keyed on (Entity, state), because two Entities may both have a
   * "Draft" and merging them would put one thing's acceptance cases on another
   * thing's lifecycle.
   */
  const scenarioOwner = (scenario: ReportCapabilityScenario | ReportJourneyScenario, step: { capabilityId: string | null }) =>
    'capabilityId' in scenario ? scenario.capabilityId : step.capabilityId ?? ''
  const isCapabilityScenario = (scenario: ReportCapabilityScenario | ReportJourneyScenario): scenario is ReportCapabilityScenario =>
    'capabilityId' in scenario
  const scenariosByState = new Map<string, { capability: string[], journey: string[] }>()
  const changedBy = new Map<string, Set<string>>()
  const readBy = new Map<string, Set<string>>()
  type ArcAccumulator = Omit<EntityArcView, 'capabilityIds' | 'capabilityScenarioIds' | 'journeyScenarioIds' | 'ruleIds' | 'forbiddenByRuleIds' | 'coEffects'> & {
    capabilityIds: Set<string>
    capabilityScenarioIds: Set<string>
    journeyScenarioIds: Set<string>
    coEffects: Map<string, EntityArcView['coEffects'][number]>
  }
  const arcsByEntity = new Map<string, Map<string, ArcAccumulator>>()
  for (const scenario of allReportScenarios) {
    for (const step of scenario.steps) {
      const owner = scenarioOwner(scenario, step)
      for (const entry of step.entities) {
        if (entry.effect === 'reads') {
          if (owner) readBy.set(entry.entityId, new Set([...(readBy.get(entry.entityId) ?? []), owner]))
          continue
        }
        if (owner) changedBy.set(entry.entityId, new Set([...(changedBy.get(entry.entityId) ?? []), owner]))
        if (entry.to) {
          const key = `${entry.entityId}\u0000${entry.to}`
          const found = scenariosByState.get(key) ?? { capability: [], journey: [] }
          const bucket = isCapabilityScenario(scenario) ? found.capability : found.journey
          if (!bucket.includes(scenario.id)) bucket.push(scenario.id)
          scenariosByState.set(key, found)
        }
        const arcKey = `${entry.effect}\u0000${entry.from ?? ''}\u0000${entry.to ?? ''}`
        const arcs = arcsByEntity.get(entry.entityId) ?? new Map<string, ArcAccumulator>()
        const arc = arcs.get(arcKey) ?? {
          key: arcKey,
          effect: entry.effect,
          from: entry.from ?? '',
          to: entry.to ?? '',
          capabilityIds: new Set<string>(),
          capabilityScenarioIds: new Set<string>(),
          journeyScenarioIds: new Set<string>(),
          coEffects: new Map()
        }
        if (owner) arc.capabilityIds.add(owner)
        if (isCapabilityScenario(scenario)) arc.capabilityScenarioIds.add(scenario.id)
        else arc.journeyScenarioIds.add(scenario.id)
        for (const other of step.entities) {
          if (other === entry || other.effect === 'reads' || other.entityId === entry.entityId) continue
          const coKey = `${other.entityId}\u0000${other.effect}\u0000${other.to ?? ''}`
          if (!arc.coEffects.has(coKey)) arc.coEffects.set(coKey, { entityId: other.entityId, effect: other.effect, to: other.to ?? '' })
        }
        arcs.set(arcKey, arc)
        arcsByEntity.set(entry.entityId, arcs)
      }
    }
  }

  /* A Rule's Entity target selects an arc by the same keys the Step carries.
     A target scoped by `contexts` governs the operation only at those places.
     Validation resolves a Step's places — its own, or its Scenario's when it
     omits `contexts` — and holds the Rule to them; an arc cannot, because it is
     one aggregate over every Step that performs the move, drawn for the whole
     Product. Restricting it globally would overstate the Rule, so it is left
     off and reaches the Entity page through its Rule relations instead. A
     target naming `facts` governs information, not an operation, and is left
     off for the same reason. */
  const targetSelects = (
    target: Extract<ReportBusinessRuleTarget, { type: 'entity' }>,
    entityId: string,
    effect: string,
    from: string,
    to: string
  ) => target.entityId === entityId
    && !target.facts.length
    && !target.contexts.length
    && (target.effect === null || target.effect === effect)
    && (target.from === null || target.from === from)
    && (target.to === null || target.to === to)
  const rulesSelecting = (entityId: string, effect: string, from: string, to: string, closed: boolean) =>
    model.businessRules
      .filter(rule => rule.permits !== null && (closed ? rule.permits.length === 0 : rule.permits.length > 0)
        && rule.appliesTo.some(target => target.type === 'entity' && targetSelects(target, entityId, effect, from, to)))
      .map(rule => rule.id)

  const entities: EntityView[] = model.entities.map((entity: ReportEntity) => {
    const first = entity.states[0]?.name ?? ''
    const arcs: EntityArcView[] = [...(arcsByEntity.get(entity.id)?.values() ?? [])].map(arc => ({
      key: arc.key,
      effect: arc.effect,
      from: arc.from,
      to: arc.to,
      capabilityIds: [...arc.capabilityIds].sort(),
      capabilityScenarioIds: [...arc.capabilityScenarioIds],
      journeyScenarioIds: [...arc.journeyScenarioIds],
      ruleIds: rulesSelecting(entity.id, arc.effect, arc.from, arc.to, false),
      forbiddenByRuleIds: rulesSelecting(entity.id, arc.effect, arc.from, arc.to, true),
      coEffects: [...arc.coEffects.values()]
    }))
    const produced = new Set(arcs.map(arc => arc.to).filter(Boolean))
    const prohibitions: EntityProhibitionView[] = model.businessRules
      .filter(rule => rule.permits !== null && rule.permits.length === 0)
      .flatMap(rule => rule.appliesTo
        .filter((target): target is Extract<ReportBusinessRuleTarget, { type: 'entity' }> =>
          target.type === 'entity' && target.entityId === entity.id)
        .map(target => ({ ruleId: rule.id, effect: target.effect ?? '', from: target.from ?? '', to: target.to ?? '' })))
    const factRules = (name: string) => model.businessRules
      .filter(rule => rule.appliesTo.some(target => target.type === 'entity' && target.entityId === entity.id && target.facts.includes(name)))
      .map(rule => rule.id)
    return {
      key: resourceKey('entity', entity.id),
      id: entity.id,
      kind: 'entity' as const,
      title: entity.title,
      lead: entity.description,
      intent: entity.intent,
      supportingContent: supportingMarkdown(entity.supportingSections),
      references: entity.references,
      domainId: entity.domainId,
      entityKind: entity.kind,
      acts: entity.acts,
      informationKept: entity.informationKept.map(fact => ({
        name: fact.name,
        description: fact.description,
        ruleIds: factRules(fact.name)
      })),
      relations: entity.relations.map(r => ({
        entityId: r.entityId,
        verb: r.verb,
        cardinality: relationEnds(r.cardinality).target,
        ends: r.cardinality
      })),
      // The inverse is derived so the two sides can never disagree.
      inboundRelations: model.entities
        .filter(other => other.id !== entity.id)
        .flatMap(other => other.relations
          .filter(r => r.entityId === entity.id)
          .map(r => ({
            entityId: other.id,
            verb: r.verb,
            cardinality: relationEnds(r.cardinality).source,
            ends: r.cardinality
          }))),
      changedByIds: [...(changedBy.get(entity.id) ?? [])].sort(),
      readByIds: [...(readBy.get(entity.id) ?? [])].filter(id => !changedBy.get(entity.id)?.has(id)).sort(),
      presentedOnIds: model.screens.filter(sc => sc.entityIds.includes(entity.id)).map(sc => sc.id),
      ruleIds: rulesByEntity.get(entity.id) || [],
      states: entity.states.map(state => ({
        name: state.name,
        content: state.content,
        capabilityScenarioIds: scenariosByState.get(`${entity.id}\u0000${state.name}`)?.capability ?? [],
        journeyScenarioIds: scenariosByState.get(`${entity.id}\u0000${state.name}`)?.journey ?? [],
        reached: state.name === first || produced.has(state.name)
      })),
      arcs,
      prohibitions,
      noCreation: entity.states.length > 0 && !arcs.some(arc => arc.effect === 'creates'),
      noTermination: entity.states.length > 0 && !arcs.some(arc => arc.effect === 'removes'),
      interfaceIds: interfacesByActor.get(entity.id) || [],
      experienceIds: experiencesByActor.get(entity.id) || [],
      journeyIds: journeysByActor.get(entity.id) || [],
      actorCapabilityScenarioIds: capabilityScenariosByActor.get(entity.id) || [],
      actorJourneyScenarioIds: journeyScenariosByActor.get(entity.id) || []
    }
  })
  const actingEntities = entities.filter(entity => entity.acts !== null)

  const domains: DomainView[] = model.domains.map((domain: ReportDomain) => {
    const capabilityIds = model.capabilities.filter(c => c.domainId === domain.id).map(c => c.id)
    return {
      key: resourceKey('domain', domain.id),
      id: domain.id,
      kind: 'domain',
      title: domain.name,
      lead: domain.description,
      intent: domain.intent,
      supportingContent: supportingMarkdown(domain.supportingSections),
      references: domain.references,
      colorSlot: domain.colorSlot,
      capabilityIds,
      entityIds: model.entities.filter(entity => entity.domainId === domain.id).map(entity => entity.id),
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
    /* What a Capability does to each thing, read off every Step of every
       Scenario that belongs to it — its own, and Journey Steps that name it. */
    const effects = new Map<string, CapabilityEntityEffectView>()
    const readIds = new Set<string>()
    for (const scenario of allReportScenarios) {
      for (const step of scenario.steps) {
        if (scenarioOwner(scenario, step) !== capability.id) continue
        for (const entry of step.entities) {
          if (entry.effect === 'reads') {
            readIds.add(entry.entityId)
            continue
          }
          const line = effects.get(entry.entityId) ?? { entityId: entry.entityId, effects: [], scenarioIds: [] }
          if (!line.effects.some(item => item.effect === entry.effect && item.from === (entry.from ?? '') && item.to === (entry.to ?? ''))) {
            line.effects.push({ effect: entry.effect, from: entry.from ?? '', to: entry.to ?? '' })
          }
          if (!line.scenarioIds.includes(scenario.id)) line.scenarioIds.push(scenario.id)
          effects.set(entry.entityId, line)
        }
      }
    }
    const entityIds = [...effects.keys()].sort()
    return {
      key: resourceKey('capability', capability.id),
      id: capability.id,
      entityIds,
      readEntityIds: [...readIds].filter(id => !effects.has(id)).sort(),
      entityEffects: entityIds.map(id => effects.get(id)!),
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

  const outcomeStates = (steps: ScenarioView['steps']): ScenarioStepEntityView[] => {
    const last = new Map<string, ScenarioStepEntityView>()
    for (const step of steps) {
      for (const entry of step.entities) {
        if (entry.effect === 'reads') continue
        last.set(`${entry.entityId}\u0000${entry.as}`, entry)
      }
    }
    /*
     * Everything it changed, not only what carries a state. A reader arrives at
     * the Outcome asking what the Scenario produced, and an empty line there is
     * a worse answer than one that repeats the subject band.
     */
    return [...last.values()]
  }

  const scenarioSteps = (
    scenario: ReportCapabilityScenario | ReportJourneyScenario
  ): ScenarioView['steps'] =>
    scenario.steps.map(step => ({
      text: step.text,
      stepKind: step.kind,
      actorId: step.actorId ?? '',
      capabilityId: step.capabilityId ?? '',
      entities: step.entities.map(entry => ({
        entityId: entry.entityId,
        as: entry.as ?? '',
        effect: entry.effect,
        from: entry.from ?? '',
        to: entry.to ?? ''
      })),
      contexts: step.contexts.map(context => ({
        routeId: context.routeId,
        context: placeOf(context.placeId)
      }))
    }))

  const journeys: JourneyView[] = model.journeys.map((journey: ReportJourney) => {
    const contexts = journeyContexts(journey.id)
    const journeyScenarios = journeyScenariosOf(journey.id)
    const scenarioIds = journeyScenarios.map(scenario => scenario.id)
    return {
      key: resourceKey('journey', journey.id),
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
      /* Its Scenarios' Steps, not its Capabilities' declarations: a Journey
         moves what it is actually shown moving, and a Capability it uses may
         change things no path through this Journey ever reaches. */
      entityIds: unique(journeyScenarios.flatMap(scenario => scenario.steps
        .flatMap(step => step.entities.filter(entry => entry.effect !== 'reads').map(entry => entry.entityId)))),
      leavesBehind: outcomeStates(journeyScenarios
        .filter(scenario => scenario.result === 'achieved')
        .flatMap(scenario => scenarioSteps(scenario))),
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


  const capabilityScenarios: ScenarioView[] = model.capabilityScenarios.map((scenario: ReportCapabilityScenario) => {
    const kind = kindBySlot.get(scenario.kindId)
    return {
      key: resourceKey('capability-scenario', scenario.id),
      id: scenario.id,
      kind: 'capability-scenario',
      entityIds: unique(scenario.steps.flatMap(step => step.entities.filter(entry => entry.effect !== 'reads').map(entry => entry.entityId))),
      readEntityIds: unique(scenario.steps.flatMap(step => step.entities.filter(entry => entry.effect === 'reads').map(entry => entry.entityId)))
        .filter(id => !scenario.steps.some(step => step.entities.some(entry => entry.entityId === id && entry.effect !== 'reads'))),
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
      outcomeStates: outcomeStates(scenarioSteps(scenario)),
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
      key: resourceKey('journey-scenario', scenario.id),
      id: scenario.id,
      kind: 'journey-scenario',
      entityIds: unique(scenario.steps.flatMap(step => step.entities.filter(entry => entry.effect !== 'reads').map(entry => entry.entityId))),
      readEntityIds: unique(scenario.steps.flatMap(step => step.entities.filter(entry => entry.effect === 'reads').map(entry => entry.entityId)))
        .filter(id => !scenario.steps.some(step => step.entities.some(entry => entry.entityId === id && entry.effect !== 'reads'))),
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
      outcomeStates: outcomeStates(scenarioSteps(scenario)),
      decisionPoints: scenario.decisionPoints,
      outcome: scenario.outcome,
      edgeCases: scenario.edgeCases,
      result: scenario.result,
      screenIds: screensByScenario.get(scenario.id) || [],
      ruleIds: rulesByScenario.get(scenario.id) || []
    }
  })

  const scenarios: ScenarioView[] = [...capabilityScenarios, ...journeyScenarios]

  const entityTitle = (id: string) => titleOf(model.entities, id)
  const describeValue = (value: ReportGrantCondition['value']): string => {
    if (value === null) return ''
    if (typeof value === 'object') return `the ${entityTitle(value.configuredByEntityId)} threshold`
    return String(value)
  }
  const describeCondition = (condition: ReportGrantCondition, targetId: string): string => {
    if (condition.state !== null) return `while ${condition.state}`
    const subject = condition.entityId && condition.entityId !== targetId
      ? `${entityTitle(condition.entityId)}'s ${condition.fact}`
      : condition.fact ?? ''
    switch (condition.operator) {
      case 'over': return `${subject} over ${describeValue(condition.value)}`
      case 'under': return `${subject} under ${describeValue(condition.value)}`
      case 'at-least': return `${subject} at least ${describeValue(condition.value)}`
      case 'at-most': return `${subject} at most ${describeValue(condition.value)}`
      case 'is': return `${subject} is ${describeValue(condition.value)}`
      case 'is-not': return `${subject} is not ${describeValue(condition.value)}`
      case 'present': return `${subject} is present`
      case 'absent': return `${subject} is absent`
      default: return subject
    }
  }
  /*
   * A grant read back as a sentence, so a reader who never saw the format can
   * tell it is wrong. Keys within a grant are AND, so the who-parts join with
   * "and" and the conditions follow "when".
   */
  const describeGrant = (grant: ReportGrant, targetId: string): GrantView => {
    const who: string[] = []
    if (grant.actorIds.length) who.push(grant.actorIds.map(entityTitle).join(' or '))
    if (grant.related.length) {
      const end = grant.related[grant.related.length - 1]!
      const path = grant.related.map(segment => segment.verb).join(' → ')
      who.push(`the ${entityTitle(end.entityId)} related by ${path}`)
    }
    if (grant.self) who.push('the thing itself')
    if (grant.unattended) who.push("the Product's own schedule")
    if (grant.configuredByEntityId) who.push(`whoever ${entityTitle(grant.configuredByEntityId)} configures`)
    const when = grant.when.map(condition => describeCondition(condition, targetId))
    const subject = who.join(' and ') || 'nobody'
    // A state condition already reads "while Pending"; a fact condition needs
    // its "when". "the Shopper related by owns while Pending", never "when while".
    const clauses = when.map(clause => clause.startsWith('while ') ? clause : `when ${clause}`)
    return { who: subject, when, sentence: clauses.length ? `${subject} ${clauses.join(' and ')}` : subject }
  }

  const rules: RuleView[] = model.businessRules.map((rule: ReportBusinessRule) => {
    const relations = ruleRelationsById.get(rule.id)!
    const entityTargets: RuleEntityTargetView[] = rule.appliesTo.flatMap(target => target.type === 'entity'
      ? [{
          entityId: target.entityId,
          effect: target.effect ?? '',
          from: target.from ?? '',
          to: target.to ?? '',
          facts: target.facts,
          contexts: target.contexts.map(resolveContext)
        }]
      : [])
    const targetId = entityTargets[0]?.entityId ?? ''
    return {
      entityIds: relations.entityIds,
      entityTargets,
      permits: rule.permits,
      grants: (rule.permits ?? []).map(grant => describeGrant(grant, targetId)),
      prohibits: rule.permits !== null && rule.permits.length === 0,
      key: resourceKey('rule', rule.id),
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

  const allResources: AnyResourceView[] = [
    ...entities,
    ...interfaces,
    ...experiences,
    ...screens,
    ...domains,
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
    ...allResources.flatMap(resource => resource.references.map(reference => ({
      reference,
      ownerKey: resource.key,
      ownerId: resource.id,
      ownerTitle: resource.title,
      ownerKind: resource.kind
    })))
  ]

  const contextSeen = new Map<string, ContextView>()
  for (const resource of allResources) {
    const contexts = (resource as { contexts?: ContextView[] }).contexts || []
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
    actors: actingEntities.length,
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

  const resourcesById = new Map<string, AnyResourceView[]>()
  for (const resource of allResources) {
    resourcesById.set(resource.id, [...(resourcesById.get(resource.id) ?? []), resource])
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
    actingEntities,
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
    byKey: new Map(allResources.map(resource => [resource.key, resource])),
    resourcesById,
    scenariosByJourney,
    scenariosByCapability,
    capabilitiesByDomain
  }
}

/**
 * The same thing on another Interface.
 *
 * Qualified ids carry their path, so two resources of one kind sharing the
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
export function counterpartsOf(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView[] {
  const suffix = resource.id.split('::').slice(1).join('::')
  if (!suffix) return []
  return resourcesOfKindInternal(workspace, resource.kind)
    .filter(other => other.key !== resource.key
      && other.id.split('::').slice(1).join('::') === suffix)
}

function resourcesOfKindInternal(workspace: ReportWorkspace, kind: ReportResourceKind): AnyResourceView[] {
  switch (kind) {
    case 'interface': return workspace.interfaces
    case 'experience': return workspace.experiences
    case 'screen': return workspace.screens
    default: return []
  }
}

/** Resolve one id within a kind's collection. */
export function resolveResource(
  workspace: ReportWorkspace,
  kind: ReportResourceKind,
  id: string
): AnyResourceView | undefined {
  return workspace.byKey.get(resourceKey(kind, id))
}

/**
 * Resolve a Scenario id when the caller holds a mixed list.
 *
 * Scenario ids are globally unique across both collections, so an id alone is
 * enough — but only the projection knows which collection it landed in.
 */
export function resolveScenario(workspace: ReportWorkspace, id: string): ScenarioView | undefined {
  for (const kind of SCENARIO_KINDS) {
    const resource = workspace.byKey.get(resourceKey(kind, id))
    if (resource) return resource as ScenarioView
  }
  return undefined
}

export function resolveResourceKey(workspace: ReportWorkspace, key: ReportResourceKey): AnyResourceView | undefined {
  return workspace.byKey.get(key)
}

export function resolveResources(
  workspace: ReportWorkspace,
  kind: ReportResourceKind,
  ids: string[]
): AnyResourceView[] {
  return ids
    .map(id => resolveResource(workspace, kind, id))
    .filter((resource): resource is AnyResourceView => Boolean(resource))
}

/** Resolve a mixed Scenario id list, dropping anything unresolved. */
export function resolveScenarios(workspace: ReportWorkspace, ids: string[]): ScenarioView[] {
  return ids
    .map(id => resolveScenario(workspace, id))
    .filter((resource): resource is ScenarioView => Boolean(resource))
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
  /** Everything this Step names — changes first, then reads. Reads sit beside changes here and nowhere else. */
  mentions: ScenarioStepEntityView[]
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
      mentions: step.entities,
      routeNeutral: step.contexts.length === 0,
      cells
    }
  })
  return { routes: scenario.routes, steps }
}
