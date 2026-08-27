import * as z from 'zod'
import { parseCodeTarget } from './coderefs.js'
import { containsPlace, interfaceOf, parentPlace } from './ids.js'
import { containsStructuralHeading } from './markdown.js'
import { INTERFACE_TYPES } from './interface-types.js'

export const REPORT_SCHEMA_VERSION = '11.0.0'

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
/**
 * A qualified Interface, Experience, or Screen id.
 *
 * Interfaces, Experiences and Screens repeat names across Interfaces on
 * purpose, so their ids carry the segments that tell them apart.
 */
const QualifiedIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:::[a-z0-9]+(?:-[a-z0-9]+)*)*$/)
const ProductIdSchema = IdSchema.max(64)
const SingleLineTextSchema = z.string().min(1)
  .refine(value => value.trim().length > 0, 'Expected non-whitespace text')
  .refine(value => !/[\r\n]/.test(value), 'Expected a single line')

const RequiredMarkdownFragmentSchema = z.string().min(1)
  .refine(value => value.trim().length > 0, 'Expected non-whitespace text')
  .refine(value => !containsStructuralHeading(value), 'Markdown fragment must not contain H1 or H2 headings')

const MarkdownFragmentSchema = z.string()
  .refine(value => !containsStructuralHeading(value), 'Markdown fragment must not contain H1 or H2 headings')

function validHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  try {
    return Boolean(new URL(value).hostname)
  } catch {
    return false
  }
}

function validRepositoryTarget(value: string): boolean {
  const path = value.split(/[?#]/, 1)[0] || ''
  return Boolean(value.trim())
    && Boolean(path.trim())
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && !/^(?:[/\\]|~[/\\]|[a-z]:[/\\])/i.test(value)
    && !value.includes('\\')
    && !path.split('/').includes('..')
}

export const ReportReferenceSchema = z.strictObject({
  kind: z.enum(['code', 'prd', 'spec', 'proposal', 'doc', 'adr', 'visual', 'research']),
  role: z.enum(['intent', 'implementation', 'context']),
  target: SingleLineTextSchema,
  title: SingleLineTextSchema.optional(),
  /** Screens only: the `## View states` H3 this artefact depicts. */
  state: SingleLineTextSchema.optional()
}).superRefine((reference, context) => {
  if (reference.kind === 'code') {
    const issues: string[] = []
    if (!parseCodeTarget(reference.target, issues, 'reference')) {
      context.addIssue({ code: 'custom', path: ['target'], message: issues[0] || 'Invalid code reference target' })
    }
    return
  }
  if (!validHttpUrl(reference.target) && !validRepositoryTarget(reference.target)) {
    context.addIssue({
      code: 'custom',
      path: ['target'],
      message: 'Reference target must use HTTP(S) or a repository-relative path'
    })
  }
})

export const ReportSupportingSectionSchema = z.strictObject({
  heading: SingleLineTextSchema.refine(value => value === value.trim(), 'Expected no surrounding whitespace'),
  content: MarkdownFragmentSchema
})

const ElementContentSchema = {
  intent: MarkdownFragmentSchema,
  supportingSections: z.array(ReportSupportingSectionSchema),
  references: z.array(ReportReferenceSchema)
}

export const TaxonomyEntrySchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: z.string(),
  colorSlot: z.number().int().optional()
})

const ReportElementCountShape = {
  actors: z.number().int().min(0),
  interfaces: z.number().int().min(0),
  experiences: z.number().int().min(0),
  screens: z.number().int().min(0),
  domains: z.number().int().min(0),
  entities: z.number().int().min(0),
  capabilities: z.number().int().min(0),
  capabilityScenarios: z.number().int().min(0),
  journeys: z.number().int().min(0),
  journeyScenarios: z.number().int().min(0),
  businessRules: z.number().int().min(0)
}

export const ReportCountsSchema = z.strictObject(ReportElementCountShape)

export const ReportAuthorSchema = z.strictObject({
  name: SingleLineTextSchema.max(120),
  url: z.string().refine(validHttpUrl, 'Author URL must use HTTP(S)').optional()
})

export const ReportGeneratorSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().min(1)
})

export const ReportEntryPointSchema = z.strictObject({
  type: SingleLineTextSchema,
  path: SingleLineTextSchema
})

export const ReportContextSchema = z.strictObject({
  placeId: QualifiedIdSchema
})

export const ReportActorSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  kind: z.enum(['person', 'system']),
  relationship: z.enum(['external', 'internal']),
  /** What the Product keeps about this Actor. Same rule as an Entity's. */
  informationKept: z.array(SingleLineTextSchema),
  ...ElementContentSchema
})

export const ReportInterfaceSchema = z.strictObject({
  id: QualifiedIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  type: z.enum(INTERFACE_TYPES),
  actorIds: z.array(IdSchema).min(1),
  entryPoints: z.array(ReportEntryPointSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...ElementContentSchema
})

export const ReportExperienceSchema = z.strictObject({
  id: QualifiedIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  interfaceIds: z.array(QualifiedIdSchema).min(1),
  accessMode: z.enum(['public', 'authenticated', 'restricted']),
  entryPoints: z.array(ReportEntryPointSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...ElementContentSchema
})

export const ReportDomainSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  colorSlot: z.number().int().optional(),
  ...ElementContentSchema
})

export const ReportEntityStateSchema = z.strictObject({
  name: SingleLineTextSchema,
  content: RequiredMarkdownFragmentSchema
})

export const ReportEntityTransitionSchema = z.strictObject({
  from: SingleLineTextSchema,
  to: SingleLineTextSchema,
  /** The Capability that causes the move. Always declares this Entity. */
  capabilityId: IdSchema
})

/**
 * An edge to another Entity, declared on one side. The inverse is derived by
 * consumers rather than authored, so the two sides cannot disagree.
 */
export const ReportEntityRelationSchema = z.strictObject({
  entityId: IdSchema,
  verb: SingleLineTextSchema,
  cardinality: z.enum(['one', 'many'])
})

/**
 * A thing the Product keeps whose state an Actor can observe. Entity states are
 * an authored lifecycle; a Screen's `states` remain that view's own
 * states, and the two are never merged.
 */
export const ReportEntitySchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  domainId: IdSchema.optional(),
  /** What the Product keeps about the thing. Never how it is stored. */
  informationKept: z.array(SingleLineTextSchema),
  relations: z.array(ReportEntityRelationSchema),
  states: z.array(ReportEntityStateSchema),
  transitions: z.array(ReportEntityTransitionSchema),
  ...ElementContentSchema
})

export const ReportCapabilitySchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  domainId: IdSchema.optional(),
  /** The Entities this Capability acts on. */
  entityIds: z.array(IdSchema),
  availability: z.array(ReportContextSchema).min(1),
  ...ElementContentSchema
})

export const ReportScreenStateSchema = z.strictObject({
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema
})

export const ReportScreenSchema = z.strictObject({
  id: QualifiedIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  capabilityIds: z.array(IdSchema).min(1),
  /** The Entities this view presents. */
  entityIds: z.array(IdSchema),
  capabilityScenarioIds: z.array(IdSchema),
  journeyScenarioIds: z.array(IdSchema),
  entryPoints: z.array(ReportEntryPointSchema),
  information: z.array(SingleLineTextSchema).min(1),
  actions: z.array(SingleLineTextSchema),
  states: z.array(ReportScreenStateSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...ElementContentSchema
})

export const ReportJourneySchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  goal: RequiredMarkdownFragmentSchema,
  successCriterion: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  capabilityIds: z.array(IdSchema),
  failureOnlyCapabilityIds: z.array(IdSchema),
  domainIds: z.array(IdSchema),
  ...ElementContentSchema
})

export const ReportDecisionPointSchema = z.strictObject({
  title: SingleLineTextSchema,
  question: RequiredMarkdownFragmentSchema,
  branches: z.array(z.strictObject({
    condition: SingleLineTextSchema,
    outcome: SingleLineTextSchema
  })).min(2)
})

export const ReportScenarioRouteSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema
})

export const ReportScenarioStepContextSchema = z.strictObject({
  routeId: IdSchema,
  placeId: QualifiedIdSchema
})

export const ReportScenarioStepSchema = z.strictObject({
  text: SingleLineTextSchema,
  kind: z.enum(['actor', 'product', 'condition']),
  actorId: IdSchema.nullable(),
  capabilityId: IdSchema.nullable(),
  /** The Entity this Step acts on, and the state it leaves it in. */
  entityId: IdSchema.nullable(),
  entityState: SingleLineTextSchema.nullable(),
  /** True only on a first condition Step that nobody triggers. */
  unattended: z.boolean(),
  contexts: z.array(ReportScenarioStepContextSchema)
})

const ReportScenarioContentShape = {
  title: SingleLineTextSchema,
  kindId: IdSchema,
  // Empty exactly when the Scenario is unattended: nobody triggers it, so it
  // derives no Actor. Every other Scenario still names at least one.
  actorIds: z.array(IdSchema),
  routes: z.array(ReportScenarioRouteSchema).min(1),
  steps: z.array(ReportScenarioStepSchema).min(1),
  trigger: RequiredMarkdownFragmentSchema,
  decisionPoints: z.array(ReportDecisionPointSchema),
  outcome: RequiredMarkdownFragmentSchema,
  edgeCases: z.array(SingleLineTextSchema),
  ...ElementContentSchema
}

export const ReportCapabilityScenarioSchema = z.strictObject({
  id: IdSchema,
  capabilityId: IdSchema,
  ...ReportScenarioContentShape
})

export const ReportJourneyScenarioSchema = z.strictObject({
  id: IdSchema,
  journeyId: IdSchema,
  result: z.enum(['achieved', 'not-achieved']),
  ...ReportScenarioContentShape
})

const ReportBusinessRuleElementTargetSchema = z.strictObject({
  type: z.enum(['capability', 'capability-scenario', 'journey', 'journey-scenario']),
  id: IdSchema,
  contexts: z.array(ReportContextSchema)
})

const ReportBusinessRuleContextTargetSchema = z.strictObject({
  type: z.literal('context'),
  context: ReportContextSchema
})

export const ReportBusinessRuleTargetSchema = z.discriminatedUnion('type', [
  ReportBusinessRuleElementTargetSchema,
  ReportBusinessRuleContextTargetSchema
])

export const ReportBusinessRuleSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  statement: RequiredMarkdownFragmentSchema,
  rationale: MarkdownFragmentSchema,
  appliesTo: z.array(ReportBusinessRuleTargetSchema).min(1),
  ...ElementContentSchema
})

export const ReportCoverageSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  unmapped: z.array(z.string()),
  limitations: z.array(z.string()),
  rationale: MarkdownFragmentSchema
})

export const ProductReportV11Schema = z.strictObject({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  id: ProductIdSchema,
  title: SingleLineTextSchema.max(160),
  summary: SingleLineTextSchema.max(400),
  description: RequiredMarkdownFragmentSchema.max(2000),
  category: IdSchema.max(60).nullable(),
  authors: z.array(ReportAuthorSchema),
  license: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.+-]*$/).max(80).nullable(),
  intent: MarkdownFragmentSchema,
  supportingSections: z.array(ReportSupportingSectionSchema),
  references: z.array(ReportReferenceSchema),
  referenceProfile: z.enum(['workspace', 'portable']),
  tags: z.array(z.string().min(1).max(48)).max(24),
  generatedAt: z.iso.date(),
  generator: ReportGeneratorSchema,
  counts: ReportCountsSchema,
  limitations: z.array(z.string()),
  model: z.strictObject({
    taxonomies: z.strictObject({
      scenarioKinds: z.array(TaxonomyEntrySchema)
    }),
    actors: z.array(ReportActorSchema),
    interfaces: z.array(ReportInterfaceSchema).min(1),
    experiences: z.array(ReportExperienceSchema),
    screens: z.array(ReportScreenSchema),
    domains: z.array(ReportDomainSchema),
    entities: z.array(ReportEntitySchema),
    capabilities: z.array(ReportCapabilitySchema),
    capabilityScenarios: z.array(ReportCapabilityScenarioSchema),
    journeys: z.array(ReportJourneySchema),
    journeyScenarios: z.array(ReportJourneyScenarioSchema),
    businessRules: z.array(ReportBusinessRuleSchema)
  }),
  coverage: ReportCoverageSchema
})

export const ProductReportSchema = ProductReportV11Schema

export type ProductReportV11 = z.infer<typeof ProductReportV11Schema>
export type ProductReport = ProductReportV11
export type ReportDecisionPoint = z.infer<typeof ReportDecisionPointSchema>
export type ReportScreenState = z.infer<typeof ReportScreenStateSchema>
export type ReportCoverage = z.infer<typeof ReportCoverageSchema>
export type ReportCounts = z.infer<typeof ReportCountsSchema>
export type ReportAuthor = z.infer<typeof ReportAuthorSchema>
export type ReportActor = z.infer<typeof ReportActorSchema>
export type ReportInterface = z.infer<typeof ReportInterfaceSchema>
export type ReportExperience = z.infer<typeof ReportExperienceSchema>
export type ReportDomain = z.infer<typeof ReportDomainSchema>
export type ReportEntity = z.infer<typeof ReportEntitySchema>
export type ReportEntityState = z.infer<typeof ReportEntityStateSchema>
export type ReportEntityTransition = z.infer<typeof ReportEntityTransitionSchema>
export type ReportEntityRelation = z.infer<typeof ReportEntityRelationSchema>
export type ReportCapability = z.infer<typeof ReportCapabilitySchema>
export type ReportContext = z.infer<typeof ReportContextSchema>
export type ReportScreen = z.infer<typeof ReportScreenSchema>
export type ReportJourney = z.infer<typeof ReportJourneySchema>
export type ReportCapabilityScenario = z.infer<typeof ReportCapabilityScenarioSchema>
export type ReportScenarioRoute = z.infer<typeof ReportScenarioRouteSchema>
export type ReportScenarioStepContext = z.infer<typeof ReportScenarioStepContextSchema>
export type ReportScenarioStep = z.infer<typeof ReportScenarioStepSchema>
export type ReportJourneyScenario = z.infer<typeof ReportJourneyScenarioSchema>
export type ReportBusinessRule = z.infer<typeof ReportBusinessRuleSchema>
export type ReportBusinessRuleTarget = z.infer<typeof ReportBusinessRuleTargetSchema>
export type ReportReference = z.infer<typeof ReportReferenceSchema>
export type ReportSupportingSection = z.infer<typeof ReportSupportingSectionSchema>

function duplicateIssues(label: string, ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates].sort().map(id => `${label}: duplicate id "${id}"`)
}

function requireUniqueValues(
  issues: string[],
  label: string,
  relation: string,
  values: string[]
): void {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) issues.push(`${label}: ${relation} contains duplicate "${value}"`)
    seen.add(value)
  }
}

function validateSupportingSections(
  issues: string[],
  label: string,
  sections: ReportSupportingSection[],
  reservedHeadings: string[]
): void {
  const reserved = new Set(reservedHeadings.map(heading => heading.toLowerCase()))
  for (const item of sections) {
    if (reserved.has(item.heading.trim().toLowerCase())) {
      issues.push(`${label}: supporting section "${item.heading}" conflicts with a structured section`)
    }
  }
}

function missingRelation(
  issues: string[],
  label: string,
  relation: string,
  ids: string[],
  available: Set<string>
): void {
  for (const id of ids) {
    if (!available.has(id)) issues.push(`${label}: references missing ${relation} "${id}"`)
  }
}

function validateContextPlace(
  issues: string[],
  label: string,
  context: ReportContext,
  placeIds: Set<string>
): string {
  if (!placeIds.has(context.placeId)) issues.push(`${label}: Context references missing place "${context.placeId}"`)
  return context.placeId
}

function validateAvailabilityPlaces(
  issues: string[],
  label: string,
  availability: ReportContext[],
  availabilityPlaceIds: Set<string>,
  placeIds: Set<string>
): Set<string> {
  const places = new Set<string>()
  for (const context of availability) {
    const place = validateContextPlace(issues, label, context, placeIds)
    if (places.has(place)) issues.push(`${label}: duplicate availability Context place "${place}"`)
    if (placeIds.has(place) && !availabilityPlaceIds.has(place)) {
      issues.push(`${label}: availability Context place "${place}" must name an undivided Interface or an Experience`)
    }
    if (availabilityPlaceIds.has(place)) places.add(place)
  }
  return places
}

function sameIds(actual: string[], expected: Iterable<string>): boolean {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
}

function requireEntryPointInterfaces(
  issues: string[],
  label: string,
  entryPoints: Array<{ type: string }>,
  interfaces: Set<string>
): void {
  for (const point of entryPoints) {
    if (!interfaces.has(point.type)) {
      issues.push(`${label}: entry point references undeclared interface "${point.type}"`)
    }
  }
}

/** Cross-element and computed-field validation, shared with every report consumer. */
export function validateProductReport(report: ProductReportV11): string[] {
  const issues: string[] = []
  const { model } = report
  const actorIds = new Set(model.actors.map(item => item.id))
  const interfaceIds = new Set(model.interfaces.map(item => item.id))
  const interfacesById = new Map(model.interfaces.map(item => [item.id, item]))
  const experiencesById = new Map(model.experiences.map(item => [item.id, item]))
  const domainIds = new Set(model.domains.map(item => item.id))
  const capabilityIds = new Set(model.capabilities.map(item => item.id))
  const capabilityAvailability = new Map<string, Set<string>>()
  const journeyIds = new Set(model.journeys.map(item => item.id))
  const capabilityScenarioIds = new Set(model.capabilityScenarios.map(item => item.id))
  const journeyScenarioIds = new Set(model.journeyScenarios.map(item => item.id))
  const kindIds = new Set(model.taxonomies.scenarioKinds.map(item => item.id))
  const experienceScopedInterfaces = new Set(model.experiences.flatMap(experience => experience.interfaceIds))
  const availabilityPlaceIds = new Set<string>([
    ...model.interfaces.filter(item => !experienceScopedInterfaces.has(item.id)).map(item => item.id),
    ...model.experiences.map(item => item.id)
  ])
  const placeIds = new Set<string>([
    ...model.interfaces.map(item => item.id),
    ...model.experiences.map(item => item.id),
    ...model.screens.map(item => item.id)
  ])

  requireUniqueValues(issues, 'product', 'tags', report.tags)
  validateSupportingSections(issues, 'product', report.supportingSections, ['Intent'])

  const collections: Array<[string, string[]]> = [
    ['actors', model.actors.map(item => item.id)],
    ['interfaces', model.interfaces.map(item => item.id)],
    ['experiences', model.experiences.map(item => item.id)],
    ['screens', model.screens.map(item => item.id)],
    ['domains', model.domains.map(item => item.id)],
    ['capabilities', model.capabilities.map(item => item.id)],
    ['capabilityScenarios', model.capabilityScenarios.map(item => item.id)],
    ['journeys', model.journeys.map(item => item.id)],
    ['journeyScenarios', model.journeyScenarios.map(item => item.id)],
    ['businessRules', model.businessRules.map(item => item.id)],
    ['scenarioKinds', model.taxonomies.scenarioKinds.map(item => item.id)]
  ]
  for (const [label, ids] of collections) issues.push(...duplicateIssues(label, ids))
  const capabilityScenarioFiles = new Map(model.capabilityScenarios.map(item => [item.id, `capability scenario "${item.id}"`]))
  for (const scenario of model.journeyScenarios) {
    const previous = capabilityScenarioFiles.get(scenario.id)
    if (previous) issues.push(`journey scenario "${scenario.id}": id already used by ${previous}`)
  }

  for (const actor of model.actors) {
    validateSupportingSections(issues, `actor "${actor.id}"`, actor.supportingSections, ['Intent', 'Information kept'])
  }
  for (const domain of model.domains) {
    validateSupportingSections(issues, `domain "${domain.id}"`, domain.supportingSections, ['Intent'])
  }

  for (const productInterface of model.interfaces) {
    requireUniqueValues(issues, `interface "${productInterface.id}"`, 'actorIds', productInterface.actorIds)
    validateSupportingSections(
      issues,
      `interface "${productInterface.id}"`,
      productInterface.supportingSections,
      ['Intent', 'Capability boundary']
    )
    missingRelation(issues, `interface "${productInterface.id}"`, 'actor', productInterface.actorIds, actorIds)
  }
  for (const experience of model.experiences) {
    requireUniqueValues(issues, `experience "${experience.id}"`, 'actorIds', experience.actorIds)
    requireUniqueValues(issues, `experience "${experience.id}"`, 'interfaceIds', experience.interfaceIds)
    validateSupportingSections(
      issues,
      `experience "${experience.id}"`,
      experience.supportingSections,
      ['Intent', 'Capability boundary']
    )
    missingRelation(issues, `experience "${experience.id}"`, 'actor', experience.actorIds, actorIds)
    missingRelation(issues, `experience "${experience.id}"`, 'interface', experience.interfaceIds, interfaceIds)
    for (const interfaceId of experience.interfaceIds) {
      const supportedActors = new Set(interfacesById.get(interfaceId)?.actorIds || [])
      for (const actorId of experience.actorIds) {
        if (!supportedActors.has(actorId)) {
          issues.push(`experience "${experience.id}": actor "${actorId}" is not supported by interface "${interfaceId}"`)
        }
      }
    }
    requireEntryPointInterfaces(
      issues,
      `experience "${experience.id}"`,
      experience.entryPoints,
      new Set(experience.interfaceIds)
    )
  }
  for (const productInterface of model.interfaces) {
    const experiences = model.experiences.filter(experience => experience.interfaceIds.includes(productInterface.id))
    if (!experiences.length) continue
    const coveredActors = new Set(experiences.flatMap(experience => experience.actorIds))
    for (const actorId of productInterface.actorIds) {
      if (!coveredActors.has(actorId)) {
        issues.push(`interface "${productInterface.id}": actor "${actorId}" needs at least one Experience context`)
      }
    }
  }
  for (const capability of model.capabilities) {
    validateSupportingSections(
      issues,
      `capability "${capability.id}"`,
      capability.supportingSections,
      ['Intent']
    )
    if (capability.domainId && !domainIds.has(capability.domainId)) {
      issues.push(`capability "${capability.id}": references missing domain "${capability.domainId}"`)
    }
    capabilityAvailability.set(
      capability.id,
      validateAvailabilityPlaces(
        issues,
        `capability "${capability.id}"`,
        capability.availability,
        availabilityPlaceIds,
        placeIds
      )
    )
  }
  const supportedActorsForContainer = (place: string): Set<string> | undefined => {
    const experience = experiencesById.get(place)
    if (experience) return new Set(experience.actorIds)
    const productInterface = interfacesById.get(place)
    return productInterface ? new Set(productInterface.actorIds) : undefined
  }

  const screensById = new Map(model.screens.map(screen => [screen.id, screen]))
  const screensByContainer = new Map<string, ReportScreen[]>()
  const containerForScreen = (screen: ReportScreen): string => parentPlace(screen.id) || ''
  for (const screen of model.screens) {
    const container = containerForScreen(screen)
    const siblings = screensByContainer.get(container) || []
    siblings.push(screen)
    screensByContainer.set(container, siblings)
  }

  const resolveScenarioContext = (label: string, placeId: string) => {
    const screen = screensById.get(placeId)
    if (screen) return { place: placeId, containerId: containerForScreen(screen), screen }
    const experience = experiencesById.get(placeId)
    if (experience) {
      if ((screensByContainer.get(placeId) || []).length) {
        issues.push(`${label}: Experience "${placeId}" owns Screens, so the Context must name one of its Screens`)
      }
      return { place: placeId, containerId: placeId, screen: undefined }
    }
    if (interfacesById.has(placeId)) {
      if (experienceScopedInterfaces.has(placeId)) {
        issues.push(`${label}: Interface "${placeId}" is divided into Experiences, so the Context must name one of them or one of their Screens`)
      } else if ((screensByContainer.get(placeId) || []).length) {
        issues.push(`${label}: Interface "${placeId}" owns Screens, so the Context must name one of its Screens`)
      }
      return { place: placeId, containerId: placeId, screen: undefined }
    }
    issues.push(`${label}: Context references missing place "${placeId}"`)
    return undefined
  }

  type ReportScenarioForValidation = ReportCapabilityScenario | ReportJourneyScenario
  const validateScenarioShape = (
    scenario: ReportScenarioForValidation,
    label: string,
    parentCapabilityId?: string,
    journeyActors?: Set<string>
  ) => {
    requireUniqueValues(issues, label, 'actorIds', scenario.actorIds)
    requireUniqueValues(issues, label, 'route ids', scenario.routes.map(route => route.id))
    const routeNames = new Set<string>()
    const routeIds = new Set(scenario.routes.map(route => route.id))
    const routeContextPlaces = new Map<string, string[]>(scenario.routes.map(route => [route.id, []]))
    for (const route of scenario.routes) {
      const normalized = route.name.trim().toLocaleLowerCase()
      if (routeNames.has(normalized)) issues.push(`${label}: duplicate route name "${route.name}"`)
      routeNames.add(normalized)
    }

    const derivedActors = new Set<string>()
    const allContextPlaces = new Set<string>()
    const allContainers = new Set<string>()
    const capabilitySteps: Array<{ capabilityId: string, contextPlaces: Set<string>, containers: Set<string> }> = []
    const screenIds = new Set<string>()
    for (const [index, step] of scenario.steps.entries()) {
      const stepLabel = `${label}: step ${index + 1}`
      if (step.kind === 'actor') {
        if (!step.actorId) issues.push(`${stepLabel}: an actor Step needs one actorId`)
        else {
          derivedActors.add(step.actorId)
          if (!actorIds.has(step.actorId)) issues.push(`${stepLabel}: references missing actor "${step.actorId}"`)
        }
      } else if (step.actorId !== null) {
        issues.push(`${stepLabel}: actorId is only valid when kind is "actor"`)
      }
      if (parentCapabilityId && step.capabilityId !== parentCapabilityId) {
        issues.push(`${stepLabel}: capabilityId must equal parent capability "${parentCapabilityId}"`)
      }
      if (step.capabilityId) {
        capabilitySteps.push({ capabilityId: step.capabilityId, contextPlaces: new Set<string>(), containers: new Set<string>() })
        if (!capabilityIds.has(step.capabilityId)) {
          issues.push(`${stepLabel}: references missing capability "${step.capabilityId}"`)
        }
      }

      requireUniqueValues(issues, stepLabel, 'routeIds', step.contexts.map(context => context.routeId))
      if (!step.contexts.length) continue
      const contextualizedRouteIds = new Set(step.contexts.map(context => context.routeId))
      if (!sameIds([...contextualizedRouteIds], routeIds)) {
        issues.push(`${stepLabel}: contexts must assign every declared route or be empty`)
      }
      for (const context of step.contexts) {
        const contextLabel = `${stepLabel}: route "${context.routeId}"`
        if (!routeIds.has(context.routeId)) issues.push(`${contextLabel}: references undeclared route`)
        routeContextPlaces.get(context.routeId)?.push(context.placeId)
        const resolved = resolveScenarioContext(contextLabel, context.placeId)
        if (!resolved) continue
        allContextPlaces.add(resolved.place)
        allContainers.add(resolved.containerId)
        if (resolved.screen) screenIds.add(resolved.screen.id)
        const capabilityStep = step.capabilityId ? capabilitySteps.at(-1) : undefined
        capabilityStep?.contextPlaces.add(resolved.place)
        capabilityStep?.containers.add(resolved.containerId)
        if (step.capabilityId) {
          const supported = capabilityAvailability.get(step.capabilityId) || new Set<string>()
          if (!supported.has(resolved.containerId)) {
            issues.push(`${contextLabel}: Context place "${resolved.place}" is outside capability "${step.capabilityId}"`)
          }
          if (resolved.screen && !resolved.screen.capabilityIds.includes(step.capabilityId)) {
            issues.push(`${contextLabel}: Screen "${resolved.screen.id}" does not expose capability "${step.capabilityId}"`)
          }
        }
        if (step.kind === 'actor' && step.actorId) {
          const supported = supportedActorsForContainer(resolved.containerId) || new Set<string>()
          if (!supported.has(step.actorId)) {
            issues.push(`${contextLabel}: Context place does not support actor "${step.actorId}"`)
          }
        }
      }
    }
    if (!sameIds(scenario.actorIds, derivedActors)) {
      issues.push(`${label}: actorIds must equal the Actor Step union`)
    }
    missingRelation(issues, label, 'actor', scenario.actorIds, actorIds)
    for (const route of scenario.routes) {
      if (!(routeContextPlaces.get(route.id) || []).length) issues.push(`${label}: route "${route.id}" must have a Context on at least one Step`)
    }
    const sequences = new Map<string, string>()
    for (const route of scenario.routes) {
      const sequence = (routeContextPlaces.get(route.id) || []).join('\n')
      if (!sequence) continue
      const twin = sequences.get(sequence)
      if (twin) issues.push(`${label}: route "${route.id}" repeats every Context place of route "${twin}"`)
      else sequences.set(sequence, route.id)
    }
    // An unattended Scenario derives no Actor, so this question has no answer
    // for it. Its Contexts say where an Actor observes the outcome.
    const isUnattended = scenario.steps[0]?.unattended === true
    const supportedSomewhere = new Set<string>()
    if (!isUnattended) {
      for (const container of allContainers) {
        const supported = supportedActorsForContainer(container) || new Set<string>()
        const participating = scenario.actorIds.filter(actorId => supported.has(actorId))
        if (!participating.length) issues.push(`${label}: Context place "${container}" permits none of the Scenario Actors`)
        for (const actorId of participating) supportedSomewhere.add(actorId)
      }
    }
    for (const actorId of scenario.actorIds) {
      if (actorIds.has(actorId) && !supportedSomewhere.has(actorId)) {
        issues.push(`${label}: actor "${actorId}" is not supported by any selected Context place`)
      }
    }
    if (journeyActors) {
      for (const route of scenario.routes) {
        const firstActorStep = scenario.steps.find(step =>
          step.kind === 'actor' && step.contexts.some(context => context.routeId === route.id)
        )
        if (!firstActorStep?.actorId || !journeyActors.has(firstActorStep.actorId)) {
          issues.push(`${label}: route "${route.id}" must begin its contextualized Actor Steps with a Journey Actor`)
        }
      }
    }
    return { allContextPlaces, allContainers, capabilitySteps, screenIds }
  }

  const capabilityScenariosById = new Map(model.capabilityScenarios.map(item => [item.id, item]))
  const capabilityScenarioContextPlaces = new Map<string, Set<string>>()
  const coveredCapabilityPlaces = new Map<string, Set<string>>()
  const capabilityScenarioScreens = new Map<string, Set<string>>()
  for (const scenario of model.capabilityScenarios) {
    const label = `capability scenario "${scenario.id}"`
    validateSupportingSections(
      issues,
      label,
      scenario.supportingSections,
      ['Intent', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases', 'Goal', 'Success criterion']
    )
    if (!kindIds.has(scenario.kindId)) issues.push(`${label}: references missing scenario kind "${scenario.kindId}"`)
    if (!capabilityIds.has(scenario.capabilityId)) {
      issues.push(`${label}: references missing capability "${scenario.capabilityId}"`)
    }
    const { allContextPlaces, allContainers, screenIds } = validateScenarioShape(scenario, label, scenario.capabilityId)
    capabilityScenarioScreens.set(scenario.id, screenIds)
    capabilityScenarioContextPlaces.set(scenario.id, allContextPlaces)
    const covered = coveredCapabilityPlaces.get(scenario.capabilityId) || new Set<string>()
    for (const place of allContainers) covered.add(place)
    coveredCapabilityPlaces.set(scenario.capabilityId, covered)
    const supported = capabilityAvailability.get(scenario.capabilityId) || new Set<string>()
    for (const place of allContainers) {
      if (!supported.has(place)) {
        issues.push(`${label}: Context place "${place}" is outside capability "${scenario.capabilityId}"`)
      }
    }
  }
  if (report.coverage.status === 'complete') {
    for (const capability of model.capabilities) {
      const covered = coveredCapabilityPlaces.get(capability.id) || new Set<string>()
      for (const place of capabilityAvailability.get(capability.id) || []) {
        if (!covered.has(place)) {
          issues.push(`capability "${capability.id}": availability Context place "${place}" needs Capability Scenario coverage`)
        }
      }
    }
  }

  const journeysById = new Map(model.journeys.map(item => [item.id, item]))
  const journeyScenariosById = new Map(model.journeyScenarios.map(item => [item.id, item]))
  const journeyScenarioSteps = new Map<string, Array<{ capabilityId: string, contextPlaces: Set<string>, containers: Set<string> }>>()
  const journeyScenarioScreens = new Map<string, Set<string>>()
  for (const scenario of model.journeyScenarios) {
    const label = `journey scenario "${scenario.id}"`
    validateSupportingSections(
      issues,
      label,
      scenario.supportingSections,
      ['Intent', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases', 'Goal', 'Success criterion']
    )
    const journey = journeysById.get(scenario.journeyId)
    if (!journey) issues.push(`${label}: references missing journey "${scenario.journeyId}"`)
    if (!kindIds.has(scenario.kindId)) issues.push(`${label}: references missing scenario kind "${scenario.kindId}"`)
    const journeyActorSet = new Set(journey?.actorIds || [])
    const { capabilitySteps, screenIds } = validateScenarioShape(scenario, label, undefined, journeyActorSet)
    journeyScenarioScreens.set(scenario.id, screenIds)
    if (journey && !scenario.actorIds.some(actorId => journeyActorSet.has(actorId))) {
      issues.push(`${label}: actorIds must include at least one actor from journey "${scenario.journeyId}"`)
    }
    if (!capabilitySteps.length) issues.push(`${label}: needs at least one Capability-bearing step`)
    journeyScenarioSteps.set(scenario.id, capabilitySteps)
    if (scenario.result === 'achieved' && new Set(capabilitySteps.map(item => item.capabilityId)).size < 2) {
      issues.push(`${label}: an achieved Journey Scenario needs at least two distinct Capabilities`)
    }
  }

  for (const journey of model.journeys) {
    const label = `journey "${journey.id}"`
    requireUniqueValues(issues, label, 'actorIds', journey.actorIds)
    requireUniqueValues(issues, label, 'capabilityIds', journey.capabilityIds)
    requireUniqueValues(issues, label, 'failureOnlyCapabilityIds', journey.failureOnlyCapabilityIds)
    requireUniqueValues(issues, label, 'domainIds', journey.domainIds)
    validateSupportingSections(
      issues,
      label,
      journey.supportingSections,
      ['Intent', 'Goal', 'Success criterion', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases']
    )
    missingRelation(issues, label, 'actor', journey.actorIds, actorIds)
    const scenarios = model.journeyScenarios.filter(scenario => scenario.journeyId === journey.id)
    const achieved = scenarios.filter(scenario => scenario.result === 'achieved')
    if (!achieved.length) issues.push(`${label}: needs at least one achieved Journey Scenario`)
    const achievedActors = new Set(achieved.flatMap(scenario => scenario.actorIds))
    for (const actorId of journey.actorIds) {
      if (!achievedActors.has(actorId)) issues.push(`${label}: actor "${actorId}" needs an achieved Journey Scenario`)
    }
    const achievedCapabilities = new Set(achieved.flatMap(scenario => scenario.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : [])))
    const failedCapabilities = new Set(
      scenarios.filter(scenario => scenario.result === 'not-achieved')
        .flatMap(scenario => scenario.steps.flatMap(item => item.capabilityId ? [item.capabilityId] : []))
    )
    const failureOnly = new Set([...failedCapabilities].filter(capabilityId => !achievedCapabilities.has(capabilityId)))
    const domains = new Set(
      [...achievedCapabilities].map(capabilityId => model.capabilities.find(item => item.id === capabilityId)?.domainId).filter(Boolean) as string[]
    )
    missingRelation(issues, label, 'capability', journey.capabilityIds, capabilityIds)
    missingRelation(issues, label, 'failure-only capability', journey.failureOnlyCapabilityIds, capabilityIds)
    missingRelation(issues, label, 'domain', journey.domainIds, domainIds)
    if (!sameIds(journey.capabilityIds, achievedCapabilities)) issues.push(`${label}: capabilityIds must equal the achieved-step Capability union`)
    if (!sameIds(journey.failureOnlyCapabilityIds, failureOnly)) issues.push(`${label}: failureOnlyCapabilityIds must equal the failure-only Capability set`)
    if (!sameIds(journey.domainIds, domains)) issues.push(`${label}: domainIds must equal the Domains derived from achieved-step Capabilities`)
  }

  for (const screen of model.screens) {
    const label = `screen "${screen.id}"`
    requireUniqueValues(issues, label, 'capabilityIds', screen.capabilityIds)
    requireUniqueValues(issues, label, 'capabilityScenarioIds', screen.capabilityScenarioIds)
    requireUniqueValues(issues, label, 'journeyScenarioIds', screen.journeyScenarioIds)
    validateSupportingSections(
      issues,
      label,
      screen.supportingSections,
      ['Intent', 'Information presented', 'Available actions', 'View states', 'Capability boundary']
    )
    const containerId = containerForScreen(screen)
    if (!availabilityPlaceIds.has(containerId)) {
      issues.push(`${label}: containing place "${containerId}" must be an undivided Interface or an Experience`)
    }
    missingRelation(issues, label, 'capability', screen.capabilityIds, capabilityIds)
    missingRelation(issues, label, 'Capability Scenario', screen.capabilityScenarioIds, capabilityScenarioIds)
    missingRelation(issues, label, 'Journey Scenario', screen.journeyScenarioIds, journeyScenarioIds)
    requireEntryPointInterfaces(issues, label, screen.entryPoints, new Set([interfaceOf(containerId)]))
    for (const capabilityId of screen.capabilityIds) {
      const supported = capabilityAvailability.get(capabilityId)
      if (!supported) continue
      if (!supported.has(containerId)) {
        issues.push(`${label}: capability "${capabilityId}" is not available in containing place "${containerId}"`)
      }
    }
    const expectedCapabilityScenarios = model.capabilityScenarios
      .filter(scenario => capabilityScenarioScreens.get(scenario.id)?.has(screen.id))
      .map(scenario => scenario.id)
    const expectedJourneyScenarios = model.journeyScenarios
      .filter(scenario => journeyScenarioScreens.get(scenario.id)?.has(screen.id))
      .map(scenario => scenario.id)
    if (!sameIds(screen.capabilityScenarioIds, expectedCapabilityScenarios)) {
      issues.push(`${label}: capabilityScenarioIds must equal the Scenario Step Screen backlinks`)
    }
    if (!sameIds(screen.journeyScenarioIds, expectedJourneyScenarios)) {
      issues.push(`${label}: journeyScenarioIds must equal the Scenario Step Screen backlinks`)
    }
    const stateTitles = new Set<string>()
    for (const state of screen.states) {
      const normalized = state.title.toLowerCase()
      if (stateTitles.has(normalized)) issues.push(`${label}: duplicate view state "${state.title}"`)
      stateTitles.add(normalized)
    }
  }

  for (const rule of model.businessRules) {
    const label = `business rule "${rule.id}"`
    validateSupportingSections(issues, label, rule.supportingSections, ['Intent', 'Rationale'])
    const seenTargets = new Set<string>()
    const capabilityTargets = new Set<string>()
    const journeyTargets = new Set<string>()
    const capabilityScenarioTargets: string[] = []
    const journeyScenarioTargets: string[] = []
    const directContextPlaces: string[] = []
    for (const [index, target] of rule.appliesTo.entries()) {
      const targetLabel = `${label}: appliesTo item ${index + 1}`
      if (target.type === 'context') {
        const place = validateContextPlace(issues, targetLabel, target.context, placeIds)
        const key = `context\0${place}`
        if (seenTargets.has(key)) issues.push(`${targetLabel}: duplicate Context target place "${place}"`)
        const overlapping = directContextPlaces.find(existing =>
          existing !== place && (containsPlace(existing, place) || containsPlace(place, existing))
        )
        if (overlapping) issues.push(`${targetLabel}: Context target place "${place}" is redundant with "${overlapping}"`)
        seenTargets.add(key)
        directContextPlaces.push(place)
        continue
      }
      const key = `${target.type}\0${target.id}`
      if (seenTargets.has(key)) issues.push(`${targetLabel}: duplicate target "${target.type}:${target.id}"`)
      seenTargets.add(key)
      let supported = new Set<string>()
      if (target.type === 'capability') {
        if (!capabilityIds.has(target.id)) issues.push(`${targetLabel}: references missing capability "${target.id}"`)
        capabilityTargets.add(target.id)
        supported = new Set(capabilityAvailability.get(target.id) || [])
        for (const screen of model.screens) {
          if (supported.has(containerForScreen(screen)) && screen.capabilityIds.includes(target.id)) supported.add(screen.id)
        }
      } else if (target.type === 'capability-scenario') {
        if (!capabilityScenarioIds.has(target.id)) issues.push(`${targetLabel}: references missing Capability Scenario "${target.id}"`)
        capabilityScenarioTargets.push(target.id)
        supported = capabilityScenarioContextPlaces.get(target.id) || supported
      } else if (target.type === 'journey') {
        if (!journeyIds.has(target.id)) issues.push(`${targetLabel}: references missing journey "${target.id}"`)
        journeyTargets.add(target.id)
        for (const scenario of model.journeyScenarios.filter(item => item.journeyId === target.id && item.result === 'achieved')) {
          for (const entry of journeyScenarioSteps.get(scenario.id) || []) {
            for (const place of entry.contextPlaces) supported.add(place)
          }
        }
      } else {
        if (!journeyScenarioIds.has(target.id)) issues.push(`${targetLabel}: references missing Journey Scenario "${target.id}"`)
        journeyScenarioTargets.push(target.id)
        for (const entry of journeyScenarioSteps.get(target.id) || []) {
          for (const place of entry.contextPlaces) supported.add(place)
        }
      }
      const seenContextPlaces: string[] = []
      for (const [contextIndex, context] of target.contexts.entries()) {
        const contextLabel = `${targetLabel}: Context ${contextIndex + 1}`
        const place = validateContextPlace(issues, contextLabel, context, placeIds)
        if (seenContextPlaces.includes(place)) issues.push(`${contextLabel}: duplicate Context place "${place}"`)
        const overlapping = seenContextPlaces.find(existing =>
          existing !== place && (containsPlace(existing, place) || containsPlace(place, existing))
        )
        if (overlapping) issues.push(`${contextLabel}: Context place "${place}" is redundant with "${overlapping}"`)
        seenContextPlaces.push(place)
        if (!supported.has(place) && ![...supported].some(candidate => containsPlace(place, candidate))) {
          issues.push(`${contextLabel}: Context place "${place}" is outside target "${target.type}:${target.id}"`)
        }
      }
    }
    for (const scenarioId of capabilityScenarioTargets) {
      const capabilityId = capabilityScenariosById.get(scenarioId)?.capabilityId
      if (capabilityId && capabilityTargets.has(capabilityId)) {
        issues.push(`${label}: target "capability-scenario:${scenarioId}" is redundant with capability target "${capabilityId}"`)
      }
    }
    for (const scenarioId of journeyScenarioTargets) {
      const journeyId = journeyScenariosById.get(scenarioId)?.journeyId
      if (journeyId && journeyTargets.has(journeyId)) {
        issues.push(`${label}: target "journey-scenario:${scenarioId}" is redundant with journey target "${journeyId}"`)
      }
    }
  }

  if (report.coverage.status === 'complete' && model.capabilities.length === 0) {
    issues.push('a complete model needs at least one capability')
  }

  const expectedCounts = {
    actors: model.actors.length,
    interfaces: model.interfaces.length,
    experiences: model.experiences.length,
    screens: model.screens.length,
    domains: model.domains.length,
    entities: model.entities.length,
    capabilities: model.capabilities.length,
    capabilityScenarios: model.capabilityScenarios.length,
    journeys: model.journeys.length,
    journeyScenarios: model.journeyScenarios.length,
    businessRules: model.businessRules.length
  }
  const referenceHosts = [
    { id: 'product', references: report.references },
    ...model.actors,
    ...model.interfaces,
    ...model.experiences,
    ...model.screens,
    ...model.domains,
    ...model.capabilities,
    ...model.capabilityScenarios,
    ...model.journeys,
    ...model.journeyScenarios,
    ...model.businessRules
  ]
  for (const host of referenceHosts) {
    const targets = new Set<string>()
    for (const reference of host.references) {
      if (targets.has(reference.target)) {
        issues.push(`"${host.id}": duplicate reference target "${reference.target}"`)
      }
      targets.add(reference.target)
    }
  }

  if (report.referenceProfile === 'portable') {
    if (report.coverage.sourceAreas.length) {
      issues.push('referenceProfile is portable but coverage.sourceAreas names repository areas')
    }
    const entryPointHosts = [...model.interfaces, ...model.experiences, ...model.screens]
    for (const host of entryPointHosts) {
      for (const point of host.entryPoints) {
        if (isRepositoryEntryPoint(point.path)) {
          issues.push(`"${host.id}": portable report still exposes the repository entry point "${point.path}"`)
        }
      }
    }
    for (const host of referenceHosts) {
      for (const reference of host.references) {
        if (
          reference.kind === 'code'
          || reference.role === 'implementation'
          || !isHttpUrl(reference.target)
        ) {
          issues.push(`"${host.id}": portable report still exposes reference "${reference.target}"`)
        }
      }
    }
  }

  for (const key of Object.keys(expectedCounts) as Array<keyof typeof expectedCounts>) {
    const value = expectedCounts[key]
    if (report.counts[key] !== value) issues.push(`counts.${key} must equal ${value}`)
  }

  return issues
}

function isAbsoluteFilesystemPath(value: string): boolean {
  if (/^file:/i.test(value)) return true
  if (value.includes('\\')) return true
  if (/^[a-z]:[\\/]/i.test(value) || /^(?:\\\\|\/\/)/.test(value)) return true
  return /^\/Users(?:\/|$)/.test(value)
    || /^\/home\/[^/]+(?:\/|$)/.test(value)
    || /^\/(?:private|var|tmp|etc|usr|opt|srv|mnt|media|Volumes|workspace|workspaces|repo|repos)(?:\/|$)/.test(value)
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function isRepositoryEntryPoint(value: string): boolean {
  const path = value.trim()
  if (isAbsoluteFilesystemPath(path)) return true
  if (isHttpUrl(path)) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false
  if (!path.includes('/')) return false
  return !path.startsWith('/')
}

/** Project a report into the source-free profile delivered outside its repository. */
export function projectPortableReport(report: ProductReportV11): ProductReportV11 {
  const portableReferences = <T extends { kind: string, role: string, target: string }>(items: T[]): T[] =>
    items.filter(reference =>
      reference.kind !== 'code'
      && reference.role !== 'implementation'
      && isHttpUrl(reference.target)
    )
  const publicEntryPoints = <T extends { path: string }>(items: T[]): T[] =>
    items.filter(point => !isRepositoryEntryPoint(point.path))

  const strip = <T extends { references: Array<{ kind: string, role: string, target: string }> }>(items: T[]): T[] =>
    items.map(item => ({ ...item, references: portableReferences(item.references) }))
  const stripWithEntryPoints = <
    T extends { references: Array<{ kind: string, role: string, target: string }>, entryPoints: Array<{ path: string }> }
  >(items: T[]): T[] =>
    items.map(item => ({
      ...item,
      references: portableReferences(item.references),
      entryPoints: publicEntryPoints(item.entryPoints)
    }))

  return {
    ...report,
    referenceProfile: 'portable',
    references: portableReferences(report.references),
    model: {
      ...report.model,
      actors: strip(report.model.actors),
      interfaces: stripWithEntryPoints(report.model.interfaces),
      experiences: stripWithEntryPoints(report.model.experiences),
      screens: stripWithEntryPoints(report.model.screens),
      domains: strip(report.model.domains),
      entities: strip(report.model.entities),
      capabilities: strip(report.model.capabilities),
      capabilityScenarios: strip(report.model.capabilityScenarios),
      journeys: strip(report.model.journeys),
      journeyScenarios: strip(report.model.journeyScenarios),
      businessRules: strip(report.model.businessRules)
    },
    coverage: { ...report.coverage, sourceAreas: [] }
  }
}

export function parseProductReport(input: unknown): ProductReportV11 {
  const report = ProductReportV11Schema.parse(input)
  const issues = validateProductReport(report)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return report
}

/** Additional publication policy for a Product Report entering the public Blueprint catalog. */
export function validateBlueprintReport(report: ProductReportV11): string[] {
  const issues: string[] = []
  if (!report.category) issues.push('category is required for a public Blueprint')
  if (!report.tags.length) issues.push('at least one tag is required for a public Blueprint')
  if (!report.authors.length) issues.push('at least one author is required for a public Blueprint')
  if (!report.license) issues.push('license is required for a public Blueprint')
  if (!report.model.capabilities.length) issues.push('a public Blueprint needs at least one capability')
  const covered = new Map<string, Set<string>>()
  const screenIds = new Set(report.model.screens.map(item => item.id))
  const availabilityPlace = (placeId: string): string => screenIds.has(placeId) ? parentPlace(placeId) || '' : placeId
  for (const scenario of report.model.capabilityScenarios) {
    const places = covered.get(scenario.capabilityId) || new Set<string>()
    for (const context of scenario.steps.flatMap(step => step.contexts)) places.add(availabilityPlace(context.placeId))
    covered.set(scenario.capabilityId, places)
  }
  for (const capability of report.model.capabilities) {
    const coveredPlaces = covered.get(capability.id) || new Set<string>()
    for (const context of capability.availability) {
      if (!coveredPlaces.has(context.placeId)) {
        issues.push(`capability "${capability.id}" availability Context place "${context.placeId}" needs Capability Scenario coverage for a public Blueprint`)
      }
    }
  }
  return issues
}

/** Key-sorted JSON shared by report digest producers and consumers. */
export function canonicalReportJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalReportJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map(key =>
      `${JSON.stringify(key)}:${canonicalReportJson(record[key])}`
    ).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}
