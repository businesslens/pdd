/**
 * The complete Product Report, projected once for every lab design.
 *
 * `businesslens/report/view-model` deliberately renders a narrow slice — five
 * entity kinds and their titles. A report that claims to describe a product
 * must show the whole model, so this projection keeps every authored field and
 * adds the backlinks a reader needs but the format never stores: the format
 * records relations in exactly one direction, and a reader needs both.
 *
 * This lives in the lab because it is still being auditioned. When a design
 * wins, promote this projection into `src/` beside the shipped view model.
 */
import type {
  ProductReportV8,
  ReportActor,
  ReportAvailability,
  ReportBusinessRule,
  ReportCapability,
  ReportCoverage,
  ReportDecisionPoint,
  ReportDomain,
  ReportExperience,
  ReportInterface,
  ReportJourney,
  ReportReference,
  ReportScenario,
  ReportScreen,
  ReportScreenState
} from 'businesslens/report'

export type ReportEntityKind =
  | 'product'
  | 'actor'
  | 'interface'
  | 'experience'
  | 'screen'
  | 'domain'
  | 'capability'
  | 'journey'
  | 'scenario'
  | 'rule'

export interface EntityKindMeta {
  kind: ReportEntityKind
  /** Singular label used in prose and inspectors. */
  label: string
  /** Plural label used for section headings and counts. */
  plural: string
  icon: string
  /** Index into the lab palette; also drives graph node colour. */
  slot: number
}

export const REPORT_ENTITY_KINDS: EntityKindMeta[] = [
  { kind: 'actor', label: 'Actor', plural: 'Actors', icon: 'i-lucide-users', slot: 0 },
  { kind: 'interface', label: 'Interface', plural: 'Interfaces', icon: 'i-lucide-plug', slot: 1 },
  { kind: 'experience', label: 'Experience', plural: 'Experiences', icon: 'i-lucide-layout-panel-left', slot: 2 },
  { kind: 'screen', label: 'Screen', plural: 'Screens', icon: 'i-lucide-monitor', slot: 3 },
  { kind: 'domain', label: 'Domain', plural: 'Domains', icon: 'i-lucide-boxes', slot: 4 },
  { kind: 'capability', label: 'Capability', plural: 'Capabilities', icon: 'i-lucide-zap', slot: 5 },
  { kind: 'journey', label: 'Journey', plural: 'Journeys', icon: 'i-lucide-route', slot: 6 },
  { kind: 'scenario', label: 'Scenario', plural: 'Scenarios', icon: 'i-lucide-list-checks', slot: 7 },
  { kind: 'rule', label: 'Business rule', plural: 'Business rules', icon: 'i-lucide-scale', slot: 8 }
]

export const ENTITY_KIND_META: Record<ReportEntityKind, EntityKindMeta> = {
  product: { kind: 'product', label: 'Product', plural: 'Product', icon: 'i-lucide-package', slot: 9 },
  ...Object.fromEntries(REPORT_ENTITY_KINDS.map(meta => [meta.kind, meta]))
} as Record<ReportEntityKind, EntityKindMeta>

/** One resolved Interface scope; an empty Experience id means direct availability. */
export interface AvailabilityPair {
  interfaceId: string
  experienceId: string
  interfaceTitle: string
  experienceTitle: string
  key: string
}

export interface EntryPointView {
  interfaceId: string
  interfaceTitle: string
  path: string
}

interface EntityBase {
  id: string
  kind: ReportEntityKind
  title: string
  /** Lead prose: description, summary, or rule statement depending on kind. */
  lead: string
  intent: string
  supportingContent: string
  references: ReportReference[]
}

export interface ActorView extends EntityBase {
  kind: 'actor'
  actorKind: 'person' | 'system'
  relationship: 'external' | 'internal'
  interfaceIds: string[]
  experienceIds: string[]
  journeyIds: string[]
}

export interface InterfaceView extends EntityBase {
  kind: 'interface'
  actorIds: string[]
  entryPoints: EntryPointView[]
  capabilityBoundary: string
  experienceIds: string[]
  capabilityIds: string[]
  screenIds: string[]
  journeyIds: string[]
}

export interface ExperienceView extends EntityBase {
  kind: 'experience'
  actorIds: string[]
  interfaceIds: string[]
  accessMode: 'public' | 'authenticated' | 'restricted'
  entryPoints: EntryPointView[]
  capabilityBoundary: string
  capabilityIds: string[]
  screenIds: string[]
  journeyIds: string[]
}

export interface ScreenView extends EntityBase {
  kind: 'screen'
  availability: AvailabilityPair[]
  capabilityIds: string[]
  scenarioIds: string[]
  entryPoints: EntryPointView[]
  information: string[]
  actions: string[]
  states: ReportScreenState[]
  capabilityBoundary: string
  journeyIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
}

export interface DomainView extends EntityBase {
  kind: 'domain'
  colorSlot?: number
  capabilityIds: string[]
  journeyIds: string[]
  screenIds: string[]
  ruleIds: string[]
}

export interface CapabilityView extends EntityBase {
  kind: 'capability'
  domainId?: string
  availability: AvailabilityPair[]
  journeyIds: string[]
  screenIds: string[]
  ruleIds: string[]
  interfaceIds: string[]
  experienceIds: string[]
}

export interface JourneyView extends EntityBase {
  kind: 'journey'
  actorIds: string[]
  capabilityIds: string[]
  availability: AvailabilityPair[]
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

export interface ScenarioView extends EntityBase {
  kind: 'scenario'
  journeyId: string
  journeyTitle: string
  kindId: string
  kindName: string
  kindSlot: number
  /** Empty means "every pair the parent Journey declares". */
  availability: AvailabilityPair[]
  trigger: string
  steps: string[]
  decisionPoints: ReportDecisionPoint[]
  outcome: string
  edgeCases: string[]
  screenIds: string[]
  ruleIds: string[]
}

export interface RuleView extends EntityBase {
  kind: 'rule'
  statement: string
  rationale: string
  domainIds: string[]
  capabilityIds: string[]
  journeyIds: string[]
  scenarioIds: string[]
  availability: AvailabilityPair[]
}

export type AnyEntityView =
  | ActorView
  | InterfaceView
  | ExperienceView
  | ScreenView
  | DomainView
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
  capabilities: number
  journeys: number
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
  availabilityPairs: number
}

export interface ReferenceGroup {
  reference: ReportReference
  ownerId: string
  ownerTitle: string
  ownerKind: ReportEntityKind
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
  capabilities: CapabilityView[]
  journeys: JourneyView[]
  scenarios: ScenarioView[]
  rules: RuleView[]
  /** Every direct or Experience-scoped Interface availability declared anywhere in the model. */
  pairs: AvailabilityPair[]
  /** All references in the model, each tagged with the entity that owns it. */
  references: ReferenceGroup[]
  byId: Map<string, AnyEntityView>
  /** Scenarios grouped by their parent Journey, in authored order. */
  scenariosByJourney: Map<string, ScenarioView[]>
  /** Capabilities grouped by Domain; `''` collects the undomained ones. */
  capabilitiesByDomain: Map<string, CapabilityView[]>
}

const titleOf = (items: Array<{ id: string, title?: string, name?: string }>, id: string): string =>
  items.find(item => item.id === id)?.title ?? items.find(item => item.id === id)?.name ?? id

/**
 * The comparison key for one Interface availability scope.
 *
 * Exported so a design never rebuilds the string itself: a second spelling of
 * the same key silently matches nothing, which reads as "the model declares no
 * availability" rather than as a bug.
 */
export function availabilityKey(interfaceId: string, experienceId: string): string {
  return `${interfaceId}::${experienceId}`
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

/** Render a kebab-case identifier as a sentence-cased label. */
export function humanize(value: string): string {
  const label = value.replaceAll('-', ' ')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

function expandPairs(
  availability: ReportAvailability[],
  interfaces: ReportInterface[],
  experiences: ReportExperience[]
): AvailabilityPair[] {
  return availability.flatMap((item) => {
    if (!item.experienceIds.length) {
      return [{
        interfaceId: item.interfaceId,
        experienceId: '',
        interfaceTitle: titleOf(interfaces, item.interfaceId),
        experienceTitle: '',
        key: availabilityKey(item.interfaceId, '')
      }]
    }
    return item.experienceIds.map(experienceId => ({
      interfaceId: item.interfaceId,
      experienceId,
      interfaceTitle: titleOf(interfaces, item.interfaceId),
      experienceTitle: titleOf(experiences, experienceId),
      key: availabilityKey(item.interfaceId, experienceId)
    }))
  })
}

function entryPoints(
  points: Array<{ type: string, path: string }>,
  interfaces: ReportInterface[]
): EntryPointView[] {
  return points.map(point => ({
    interfaceId: point.type,
    interfaceTitle: titleOf(interfaces, point.type),
    path: point.path
  }))
}

/**
 * Build the complete renderable projection of a Product Report.
 *
 * Relations are resolved in both directions. The format stores each relation
 * once — a Business Rule lists its Capabilities, a Capability never lists its
 * Rules — so every backlink here is derived, never authored.
 */
export function projectReportWorkspace(report: ProductReportV8): ReportWorkspace {
  const model = report.model
  const pairsOf = (availability: ReportAvailability[]) =>
    expandPairs(availability, model.interfaces, model.experiences)

  const kindBySlot = new Map(model.taxonomies.scenarioKinds.map(kind => [kind.id, kind]))

  // Forward relation tables, collected before any view is built so a backlink
  // never depends on the order the collections happen to be projected in.
  const experiencesByInterface = new Map<string, string[]>()
  for (const experience of model.experiences) {
    for (const interfaceId of experience.interfaceIds) {
      experiencesByInterface.set(interfaceId, [...(experiencesByInterface.get(interfaceId) || []), experience.id])
    }
  }

  const capabilityById = new Map(model.capabilities.map(item => [item.id, item]))
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

  const push = (table: Map<string, string[]>, key: string, value: string) => {
    table.set(key, [...(table.get(key) || []), value])
  }

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
    for (const scenarioId of screen.scenarioIds) push(screensByScenario, scenarioId, screen.id)
  }
  for (const rule of model.businessRules) {
    for (const domainId of rule.domainIds) push(rulesByDomain, domainId, rule.id)
    for (const capabilityId of rule.capabilityIds) push(rulesByCapability, capabilityId, rule.id)
    for (const journeyId of rule.journeyIds) push(rulesByJourney, journeyId, rule.id)
    for (const scenarioId of rule.scenarioIds) push(rulesByScenario, scenarioId, rule.id)
  }

  const scenariosOfJourney = (journeyId: string) =>
    model.scenarios.filter(scenario => scenario.journeyId === journeyId)

  const actors: ActorView[] = model.actors.map((actor: ReportActor) => ({
    id: actor.id,
    kind: 'actor',
    title: actor.name,
    lead: actor.description,
    intent: actor.intent,
    supportingContent: actor.supportingContent,
    references: actor.references,
    actorKind: actor.kind,
    relationship: actor.relationship,
    interfaceIds: interfacesByActor.get(actor.id) || [],
    experienceIds: experiencesByActor.get(actor.id) || [],
    journeyIds: journeysByActor.get(actor.id) || []
  }))

  const interfaces: InterfaceView[] = model.interfaces.map((item: ReportInterface) => {
    const experienceIds = experiencesByInterface.get(item.id) || []
    const declares = (availability: ReportAvailability[]) =>
      availability.some(entry => entry.interfaceId === item.id)
    return {
      id: item.id,
      kind: 'interface',
      title: item.title,
      lead: item.description,
      intent: item.intent,
      supportingContent: item.supportingContent,
      references: item.references,
      actorIds: item.actorIds,
      entryPoints: entryPoints(item.entryPoints, model.interfaces),
      capabilityBoundary: item.capabilityBoundary,
      experienceIds,
      capabilityIds: model.capabilities.filter(c => declares(c.availability)).map(c => c.id),
      screenIds: model.screens.filter(s => declares(s.availability)).map(s => s.id),
      journeyIds: model.journeys.filter(j => declares(j.availability)).map(j => j.id)
    }
  })

  const experiences: ExperienceView[] = model.experiences.map((item: ReportExperience) => {
    const declares = (availability: ReportAvailability[]) =>
      availability.some(entry => entry.experienceIds.includes(item.id))
    return {
      id: item.id,
      kind: 'experience',
      title: item.title,
      lead: item.description,
      intent: item.intent,
      supportingContent: item.supportingContent,
      references: item.references,
      actorIds: item.actorIds,
      interfaceIds: item.interfaceIds,
      accessMode: item.accessMode,
      entryPoints: entryPoints(item.entryPoints, model.interfaces),
      capabilityBoundary: item.capabilityBoundary,
      capabilityIds: model.capabilities.filter(c => declares(c.availability)).map(c => c.id),
      screenIds: model.screens.filter(s => declares(s.availability)).map(s => s.id),
      journeyIds: model.journeys.filter(j => declares(j.availability)).map(j => j.id)
    }
  })

  const screens: ScreenView[] = model.screens.map((screen: ReportScreen) => {
    const availability = pairsOf(screen.availability)
    return {
      id: screen.id,
      kind: 'screen',
      title: screen.title,
      lead: screen.description,
      intent: screen.intent,
      supportingContent: screen.supportingContent,
      references: screen.references,
      availability,
      capabilityIds: screen.capabilityIds,
      scenarioIds: screen.scenarioIds,
      entryPoints: entryPoints(screen.entryPoints, model.interfaces),
      information: screen.information,
      actions: screen.actions,
      states: screen.states,
      capabilityBoundary: screen.capabilityBoundary,
      journeyIds: unique([
        ...model.scenarios.filter(s => screen.scenarioIds.includes(s.id)).map(s => s.journeyId),
        ...model.journeys
          .filter(j => j.capabilityIds.some(id => screen.capabilityIds.includes(id)))
          .map(j => j.id)
      ]),
      interfaceIds: unique(availability.map(pair => pair.interfaceId)),
      experienceIds: unique(availability.map(pair => pair.experienceId).filter(Boolean))
    }
  })

  const domains: DomainView[] = model.domains.map((domain: ReportDomain) => {
    const capabilityIds = model.capabilities.filter(c => c.domainId === domain.id).map(c => c.id)
    return {
      id: domain.id,
      kind: 'domain',
      title: domain.name,
      lead: domain.description,
      intent: domain.intent,
      supportingContent: domain.supportingContent,
      references: domain.references,
      colorSlot: domain.colorSlot,
      capabilityIds,
      journeyIds: unique(capabilityIds.flatMap(id => journeysByCapability.get(id) || [])),
      screenIds: unique(capabilityIds.flatMap(id => screensByCapability.get(id) || [])),
      ruleIds: unique([
        ...(rulesByDomain.get(domain.id) || []),
        ...capabilityIds.flatMap(id => rulesByCapability.get(id) || [])
      ])
    }
  })

  const capabilities: CapabilityView[] = model.capabilities.map((capability: ReportCapability) => {
    const availability = pairsOf(capability.availability)
    return {
      id: capability.id,
      kind: 'capability',
      title: capability.title,
      lead: capability.description,
      intent: capability.intent,
      supportingContent: capability.supportingContent,
      references: capability.references,
      domainId: capability.domainId,
      availability,
      journeyIds: journeysByCapability.get(capability.id) || [],
      screenIds: screensByCapability.get(capability.id) || [],
      ruleIds: rulesByCapability.get(capability.id) || [],
      interfaceIds: unique(availability.map(pair => pair.interfaceId)),
      experienceIds: unique(availability.map(pair => pair.experienceId).filter(Boolean))
    }
  })

  const journeys: JourneyView[] = model.journeys.map((journey: ReportJourney) => {
    const availability = pairsOf(journey.availability)
    const journeyScenarios = scenariosOfJourney(journey.id)
    const scenarioIds = journeyScenarios.map(scenario => scenario.id)
    return {
      id: journey.id,
      kind: 'journey',
      title: journey.title,
      lead: journey.summary,
      intent: journey.intent,
      supportingContent: journey.supportingContent,
      references: journey.references,
      actorIds: journey.actorIds,
      capabilityIds: journey.capabilityIds,
      availability,
      entryPoints: entryPoints(journey.entryPoints, model.interfaces),
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
      interfaceIds: unique(availability.map(pair => pair.interfaceId)),
      experienceIds: unique(availability.map(pair => pair.experienceId).filter(Boolean)),
      stepCount: journeyScenarios.reduce((total, scenario) => total + scenario.steps.length, 0)
    }
  })

  const scenarios: ScenarioView[] = model.scenarios.map((scenario: ReportScenario) => {
    const kind = kindBySlot.get(scenario.kindId)
    return {
      id: scenario.id,
      kind: 'scenario',
      title: scenario.title,
      lead: scenario.trigger,
      intent: scenario.intent,
      supportingContent: scenario.supportingContent,
      references: scenario.references,
      journeyId: scenario.journeyId,
      journeyTitle: titleOf(model.journeys, scenario.journeyId),
      kindId: scenario.kindId,
      kindName: kind?.name ?? humanize(scenario.kindId),
      kindSlot: kind?.colorSlot ?? 1,
      availability: pairsOf(scenario.availability),
      trigger: scenario.trigger,
      steps: scenario.steps,
      decisionPoints: scenario.decisionPoints,
      outcome: scenario.outcome,
      edgeCases: scenario.edgeCases,
      screenIds: screensByScenario.get(scenario.id) || [],
      ruleIds: rulesByScenario.get(scenario.id) || []
    }
  })

  const rules: RuleView[] = model.businessRules.map((rule: ReportBusinessRule) => ({
    id: rule.id,
    kind: 'rule',
    title: rule.title,
    lead: rule.statement,
    intent: rule.intent,
    supportingContent: rule.supportingContent,
    references: rule.references,
    statement: rule.statement,
    rationale: rule.rationale,
    domainIds: rule.domainIds,
    capabilityIds: rule.capabilityIds,
    journeyIds: rule.journeyIds,
    scenarioIds: rule.scenarioIds,
    availability: pairsOf(rule.availability)
  }))

  const allEntities: AnyEntityView[] = [
    ...actors,
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
      ownerId: report.id,
      ownerTitle: report.title,
      ownerKind: 'product' as const
    })),
    ...allEntities.flatMap(entity => entity.references.map(reference => ({
      reference,
      ownerId: entity.id,
      ownerTitle: entity.title,
      ownerKind: entity.kind
    })))
  ]

  const pairSeen = new Map<string, AvailabilityPair>()
  for (const entity of allEntities) {
    const availability = (entity as { availability?: AvailabilityPair[] }).availability || []
    for (const pair of availability) if (!pairSeen.has(pair.key)) pairSeen.set(pair.key, pair)
  }
  // Every Experience declares its Interfaces even when nothing is mapped to the
  // pair yet, so the matrix axis is complete rather than sampled from usage.
  for (const experience of model.experiences) {
    for (const interfaceId of experience.interfaceIds) {
      const key = availabilityKey(interfaceId, experience.id)
      if (!pairSeen.has(key)) {
        pairSeen.set(key, {
          interfaceId,
          experienceId: experience.id,
          interfaceTitle: titleOf(model.interfaces, interfaceId),
          experienceTitle: experience.title,
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
    capabilities: model.capabilities.length,
    journeys: model.journeys.length,
    scenarios: model.scenarios.length,
    rules: model.businessRules.length,
    steps: model.scenarios.reduce((total, item) => total + item.steps.length, 0),
    decisionPoints: model.scenarios.reduce((total, item) => total + item.decisionPoints.length, 0),
    branches: model.scenarios.reduce(
      (total, item) => total + item.decisionPoints.reduce((sum, point) => sum + point.branches.length, 0),
      0
    ),
    edgeCases: model.scenarios.reduce((total, item) => total + item.edgeCases.length, 0),
    screenStates: model.screens.reduce((total, item) => total + item.states.length, 0),
    entryPoints: [...model.interfaces, ...model.experiences, ...model.screens, ...model.journeys]
      .reduce((total, item) => total + item.entryPoints.length, 0),
    references: references.length,
    availabilityPairs: pairSeen.size
  }

  const scenarioKinds = model.taxonomies.scenarioKinds.map(kind => ({
    id: kind.id,
    name: kind.name,
    description: kind.description,
    slot: kind.colorSlot ?? 1,
    count: model.scenarios.filter(scenario => scenario.kindId === kind.id).length
  }))

  const scenariosByJourney = new Map<string, ScenarioView[]>()
  for (const scenario of scenarios) {
    scenariosByJourney.set(scenario.journeyId, [...(scenariosByJourney.get(scenario.journeyId) || []), scenario])
  }

  const capabilitiesByDomain = new Map<string, CapabilityView[]>()
  for (const capability of capabilities) {
    const key = capability.domainId ?? ''
    capabilitiesByDomain.set(key, [...(capabilitiesByDomain.get(key) || []), capability])
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
      supportingContent: report.supportingContent,
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
    capabilities,
    journeys,
    scenarios,
    rules,
    pairs: [...pairSeen.values()].sort((left, right) =>
      left.interfaceId.localeCompare(right.interfaceId) || left.experienceId.localeCompare(right.experienceId)),
    references,
    byId: new Map(allEntities.map(entity => [entity.id, entity])),
    scenariosByJourney,
    capabilitiesByDomain
  }
}

/** Resolve a list of ids into entity views, dropping anything unresolved. */
export function resolveEntities(workspace: ReportWorkspace, ids: string[]): AnyEntityView[] {
  return ids.map(id => workspace.byId.get(id)).filter((entity): entity is AnyEntityView => Boolean(entity))
}
