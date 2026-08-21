import * as z from 'zod'
import { parseCodeTarget } from './coderefs.js'
import { containsStructuralHeading } from './markdown.js'
import { INTERFACE_TYPES } from './interface-types.js'

export const REPORT_SCHEMA_VERSION = '9.0.0'

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
/**
 * A surface-tree id, qualified by the path that distinguishes it.
 *
 * Interfaces, Experiences and Screens repeat names across Interfaces on
 * purpose, so their ids carry the segments that tell them apart.
 */
const SurfaceIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:::[a-z0-9]+(?:-[a-z0-9]+)*)*$/)
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
  kind: z.enum(['code', 'spec', 'proposal', 'doc', 'adr', 'visual', 'research']),
  role: z.enum(['intent', 'implementation', 'context']),
  target: SingleLineTextSchema,
  title: SingleLineTextSchema.optional(),
  /** Screens only: the `## Product states` H3 this artefact depicts. */
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

const EntityContentSchema = {
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

const ReportEntityCountShape = {
  actors: z.number().int().min(0),
  interfaces: z.number().int().min(0),
  experiences: z.number().int().min(0),
  screens: z.number().int().min(0),
  domains: z.number().int().min(0),
  capabilities: z.number().int().min(0),
  capabilityScenarios: z.number().int().min(0),
  journeys: z.number().int().min(0),
  journeyScenarios: z.number().int().min(0),
  businessRules: z.number().int().min(0)
}

export const ReportCountsSchema = z.strictObject(ReportEntityCountShape)

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

export const ReportAvailabilitySchema = z.strictObject({
  interfaceId: SurfaceIdSchema,
  experienceIds: z.array(SurfaceIdSchema)
})

export const ReportExactContextSchema = z.strictObject({
  interfaceId: SurfaceIdSchema,
  experienceId: SurfaceIdSchema.nullable()
})

export const ReportActorSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  kind: z.enum(['person', 'system']),
  relationship: z.enum(['external', 'internal']),
  ...EntityContentSchema
})

export const ReportInterfaceSchema = z.strictObject({
  id: SurfaceIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  type: z.enum(INTERFACE_TYPES),
  actorIds: z.array(IdSchema).min(1),
  entryPoints: z.array(ReportEntryPointSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...EntityContentSchema
})

export const ReportExperienceSchema = z.strictObject({
  id: SurfaceIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  interfaceIds: z.array(SurfaceIdSchema).min(1),
  accessMode: z.enum(['public', 'authenticated', 'restricted']),
  entryPoints: z.array(ReportEntryPointSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...EntityContentSchema
})

export const ReportDomainSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  colorSlot: z.number().int().optional(),
  ...EntityContentSchema
})

export const ReportCapabilitySchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  domainId: IdSchema.optional(),
  availability: z.array(ReportAvailabilitySchema).min(1),
  ...EntityContentSchema
})

export const ReportScreenStateSchema = z.strictObject({
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema
})

export const ReportScreenSchema = z.strictObject({
  id: SurfaceIdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  availability: z.array(ReportAvailabilitySchema).min(1),
  capabilityIds: z.array(IdSchema).min(1),
  capabilityScenarioIds: z.array(IdSchema),
  journeyScenarioIds: z.array(IdSchema),
  entryPoints: z.array(ReportEntryPointSchema),
  information: z.array(SingleLineTextSchema).min(1),
  actions: z.array(SingleLineTextSchema),
  states: z.array(ReportScreenStateSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...EntityContentSchema
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
  ...EntityContentSchema
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

export const ReportScenarioStepPlaceSchema = z.strictObject({
  routeId: IdSchema,
  placeId: SurfaceIdSchema
})

export const ReportScenarioStepSchema = z.strictObject({
  text: SingleLineTextSchema,
  kind: z.enum(['actor', 'product', 'condition']),
  actorId: IdSchema.nullable(),
  capabilityId: IdSchema.nullable(),
  places: z.array(ReportScenarioStepPlaceSchema)
})

const ReportScenarioContentShape = {
  title: SingleLineTextSchema,
  kindId: IdSchema,
  actorIds: z.array(IdSchema).min(1),
  routes: z.array(ReportScenarioRouteSchema).min(1),
  steps: z.array(ReportScenarioStepSchema).min(1),
  trigger: RequiredMarkdownFragmentSchema,
  decisionPoints: z.array(ReportDecisionPointSchema),
  outcome: RequiredMarkdownFragmentSchema,
  edgeCases: z.array(SingleLineTextSchema),
  ...EntityContentSchema
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

const ReportBusinessRuleEntityTargetSchema = z.strictObject({
  type: z.enum(['capability', 'capability-scenario', 'journey', 'journey-scenario']),
  id: IdSchema,
  contexts: z.array(ReportExactContextSchema)
})

const ReportBusinessRuleContextTargetSchema = z.strictObject({
  type: z.literal('context'),
  ...ReportExactContextSchema.shape
})

export const ReportBusinessRuleTargetSchema = z.discriminatedUnion('type', [
  ReportBusinessRuleEntityTargetSchema,
  ReportBusinessRuleContextTargetSchema
])

export const ReportBusinessRuleSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  statement: RequiredMarkdownFragmentSchema,
  rationale: MarkdownFragmentSchema,
  appliesTo: z.array(ReportBusinessRuleTargetSchema).min(1),
  ...EntityContentSchema
})

export const ReportCoverageSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  unmapped: z.array(z.string()),
  limitations: z.array(z.string()),
  rationale: MarkdownFragmentSchema
})

export const ProductReportV9Schema = z.strictObject({
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
    capabilities: z.array(ReportCapabilitySchema),
    capabilityScenarios: z.array(ReportCapabilityScenarioSchema),
    journeys: z.array(ReportJourneySchema),
    journeyScenarios: z.array(ReportJourneyScenarioSchema),
    businessRules: z.array(ReportBusinessRuleSchema)
  }),
  coverage: ReportCoverageSchema
})

export const ProductReportSchema = ProductReportV9Schema

export type ProductReportV9 = z.infer<typeof ProductReportV9Schema>
export type ProductReport = ProductReportV9
export type ReportDecisionPoint = z.infer<typeof ReportDecisionPointSchema>
export type ReportScreenState = z.infer<typeof ReportScreenStateSchema>
export type ReportCoverage = z.infer<typeof ReportCoverageSchema>
export type ReportCounts = z.infer<typeof ReportCountsSchema>
export type ReportAuthor = z.infer<typeof ReportAuthorSchema>
export type ReportActor = z.infer<typeof ReportActorSchema>
export type ReportInterface = z.infer<typeof ReportInterfaceSchema>
export type ReportExperience = z.infer<typeof ReportExperienceSchema>
export type ReportDomain = z.infer<typeof ReportDomainSchema>
export type ReportCapability = z.infer<typeof ReportCapabilitySchema>
export type ReportAvailability = z.infer<typeof ReportAvailabilitySchema>
export type ReportScreen = z.infer<typeof ReportScreenSchema>
export type ReportJourney = z.infer<typeof ReportJourneySchema>
export type ReportCapabilityScenario = z.infer<typeof ReportCapabilityScenarioSchema>
export type ReportExactContext = z.infer<typeof ReportExactContextSchema>
export type ReportScenarioRoute = z.infer<typeof ReportScenarioRouteSchema>
export type ReportScenarioStepPlace = z.infer<typeof ReportScenarioStepPlaceSchema>
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

function pairKey(interfaceId: string, experienceId: string): string {
  return `${interfaceId}\0${experienceId}`
}

/**
 * A scope reads as its own id.
 *
 * An Experience id already names the Interface that owns it, so joining the two
 * would repeat the Interface segment.
 */
function availabilityLabel(key: string): string {
  const [interfaceId, experienceId] = key.split('\0')
  return experienceId || interfaceId || ''
}

function availabilityPairs(
  issues: string[],
  label: string,
  availability: ReportAvailability[],
  interfaceIds: Set<string>,
  experiencesById: Map<string, ReportExperience>
): Set<string> {
  const pairs = new Set<string>()
  const seenInterfaces = new Set<string>()
  const experienceScopedInterfaces = new Set(
    [...experiencesById.values()].flatMap(experience => experience.interfaceIds)
  )
  for (const item of availability) {
    if (seenInterfaces.has(item.interfaceId)) {
      issues.push(`${label}: duplicate availability interface "${item.interfaceId}"`)
    }
    seenInterfaces.add(item.interfaceId)
    if (!interfaceIds.has(item.interfaceId)) {
      issues.push(`${label}: references missing interface "${item.interfaceId}"`)
    }
    if (!item.experienceIds.length) {
      if (experienceScopedInterfaces.has(item.interfaceId)) {
        issues.push(`${label}: availability for interface "${item.interfaceId}" needs at least one experience because the interface uses Experience contexts`)
      }
      pairs.add(pairKey(item.interfaceId, ''))
    }
    const seenExperiences = new Set<string>()
    for (const experienceId of item.experienceIds) {
      if (seenExperiences.has(experienceId)) {
        issues.push(`${label}: duplicate availability experience "${experienceId}" for interface "${item.interfaceId}"`)
      }
      seenExperiences.add(experienceId)
      const experience = experiencesById.get(experienceId)
      if (!experience) {
        issues.push(`${label}: references missing experience "${experienceId}"`)
      } else if (!experience.interfaceIds.includes(item.interfaceId)) {
        issues.push(`${label}: experience "${experienceId}" does not declare interface "${item.interfaceId}"`)
      }
      const key = pairKey(item.interfaceId, experienceId)
      if (pairs.has(key)) issues.push(`${label}: duplicate availability scope "${item.interfaceId}/${experienceId}"`)
      pairs.add(key)
    }
  }
  return pairs
}

function exactContextPair(
  issues: string[],
  label: string,
  context: ReportExactContext,
  interfaceIds: Set<string>,
  experiencesById: Map<string, ReportExperience>
): string {
  if (!interfaceIds.has(context.interfaceId)) {
    issues.push(`${label}: references missing interface "${context.interfaceId}"`)
  }
  const experienceScopedInterfaces = new Set(
    [...experiencesById.values()].flatMap(experience => experience.interfaceIds)
  )
  const scoped = experienceScopedInterfaces.has(context.interfaceId)
  if (scoped && !context.experienceId) {
    issues.push(`${label}: context for interface "${context.interfaceId}" needs one experience because the interface uses Experience contexts`)
  }
  if (!scoped && context.experienceId) {
    issues.push(`${label}: context for interface "${context.interfaceId}" must omit experience because the interface has no Experience contexts`)
  }
  if (context.experienceId) {
    const experience = experiencesById.get(context.experienceId)
    if (!experience) {
      issues.push(`${label}: references missing experience "${context.experienceId}"`)
    } else if (!experience.interfaceIds.includes(context.interfaceId)) {
      issues.push(`${label}: experience "${context.experienceId}" does not declare interface "${context.interfaceId}"`)
    }
  }
  return pairKey(context.interfaceId, context.experienceId || '')
}

function interfaceIdsFromAvailability(availability: ReportAvailability[]): Set<string> {
  return new Set(availability.map(item => item.interfaceId))
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

/** Cross-entity and computed-field validation, shared with every report consumer. */
export function validateProductReport(report: ProductReportV9): string[] {
  const issues: string[] = []
  const { model } = report
  const actorIds = new Set(model.actors.map(item => item.id))
  const interfaceIds = new Set(model.interfaces.map(item => item.id))
  const interfacesById = new Map(model.interfaces.map(item => [item.id, item]))
  const experiencesById = new Map(model.experiences.map(item => [item.id, item]))
  const domainIds = new Set(model.domains.map(item => item.id))
  const capabilityIds = new Set(model.capabilities.map(item => item.id))
  const capabilityPairs = new Map<string, Set<string>>()
  const journeyIds = new Set(model.journeys.map(item => item.id))
  const capabilityScenarioIds = new Set(model.capabilityScenarios.map(item => item.id))
  const journeyScenarioIds = new Set(model.journeyScenarios.map(item => item.id))
  const kindIds = new Set(model.taxonomies.scenarioKinds.map(item => item.id))

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
    validateSupportingSections(issues, `actor "${actor.id}"`, actor.supportingSections, ['Intent'])
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
    capabilityPairs.set(
      capability.id,
      availabilityPairs(
        issues,
        `capability "${capability.id}"`,
        capability.availability,
        interfaceIds,
        experiencesById
      )
    )
  }
  const supportedActorsForPair = (pair: string): Set<string> | undefined => {
    const [interfaceId, experienceId] = pair.split('\0')
    if (experienceId) {
      const experience = experiencesById.get(experienceId)
      return experience ? new Set(experience.actorIds) : undefined
    }
    const productInterface = interfacesById.get(interfaceId || '')
    return productInterface ? new Set(productInterface.actorIds) : undefined
  }

  const screensById = new Map(model.screens.map(screen => [screen.id, screen]))
  const screensByPair = new Map<string, ReportScreen[]>()
  const experienceScopedInterfaces = new Set(model.experiences.flatMap(experience => experience.interfaceIds))
  const pairForScreen = (screen: ReportScreen): string => {
    const experience = model.experiences.find(item => screen.id.startsWith(`${item.id}::`))
    return pairKey(experience?.interfaceIds[0] || screen.id.split('::')[0] || '', experience?.id || '')
  }
  for (const screen of model.screens) {
    const pair = pairForScreen(screen)
    const siblings = screensByPair.get(pair) || []
    siblings.push(screen)
    screensByPair.set(pair, siblings)
  }

  const resolveProductPlace = (label: string, placeId: string) => {
    const screen = screensById.get(placeId)
    if (screen) return { pair: pairForScreen(screen), screen }
    const experience = experiencesById.get(placeId)
    if (experience) {
      const pair = pairKey(experience.interfaceIds[0] || '', experience.id)
      if ((screensByPair.get(pair) || []).length) {
        issues.push(`${label}: Experience "${placeId}" owns Screens, so the Product Place must name one of its Screens`)
      }
      return { pair, screen: undefined }
    }
    if (interfacesById.has(placeId)) {
      const pair = pairKey(placeId, '')
      if (experienceScopedInterfaces.has(placeId)) {
        issues.push(`${label}: Interface "${placeId}" is divided into Experiences, so the Product Place must name one of them or one of their Screens`)
      } else if ((screensByPair.get(pair) || []).length) {
        issues.push(`${label}: Interface "${placeId}" owns Screens, so the Product Place must name one of its Screens`)
      }
      return { pair, screen: undefined }
    }
    issues.push(`${label}: references missing Product Place "${placeId}"`)
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
    const routePlaces = new Map<string, string[]>(scenario.routes.map(route => [route.id, []]))
    for (const route of scenario.routes) {
      const normalized = route.name.trim().toLocaleLowerCase()
      if (routeNames.has(normalized)) issues.push(`${label}: duplicate route name "${route.name}"`)
      routeNames.add(normalized)
    }

    const derivedActors = new Set<string>()
    const allPairs = new Set<string>()
    const capabilitySteps: Array<{ capabilityId: string, pairs: Set<string> }> = []
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
        capabilitySteps.push({ capabilityId: step.capabilityId, pairs: new Set<string>() })
        if (!capabilityIds.has(step.capabilityId)) {
          issues.push(`${stepLabel}: references missing capability "${step.capabilityId}"`)
        }
      }

      requireUniqueValues(issues, stepLabel, 'routeIds', step.places.map(place => place.routeId))
      if (!step.places.length) continue
      const placedRouteIds = new Set(step.places.map(place => place.routeId))
      if (!sameIds([...placedRouteIds], routeIds)) {
        issues.push(`${stepLabel}: places must assign every declared route or be empty`)
      }
      for (const place of step.places) {
        const placeLabel = `${stepLabel}: route "${place.routeId}"`
        if (!routeIds.has(place.routeId)) issues.push(`${placeLabel}: references undeclared route`)
        routePlaces.get(place.routeId)?.push(place.placeId)
        const resolved = resolveProductPlace(placeLabel, place.placeId)
        if (!resolved) continue
        allPairs.add(resolved.pair)
        if (resolved.screen) screenIds.add(resolved.screen.id)
        const capabilityStep = step.capabilityId ? capabilitySteps.at(-1) : undefined
        capabilityStep?.pairs.add(resolved.pair)
        if (step.capabilityId) {
          const supported = capabilityPairs.get(step.capabilityId) || new Set<string>()
          if (!supported.has(resolved.pair)) {
            issues.push(`${placeLabel}: context "${availabilityLabel(resolved.pair)}" is outside capability "${step.capabilityId}"`)
          }
          if (resolved.screen && !resolved.screen.capabilityIds.includes(step.capabilityId)) {
            issues.push(`${placeLabel}: Screen "${resolved.screen.id}" does not expose capability "${step.capabilityId}"`)
          }
        }
        if (step.kind === 'actor' && step.actorId) {
          const supported = supportedActorsForPair(resolved.pair) || new Set<string>()
          if (!supported.has(step.actorId)) {
            issues.push(`${placeLabel}: Product Place does not support actor "${step.actorId}"`)
          }
        }
      }
    }
    if (!sameIds(scenario.actorIds, derivedActors)) {
      issues.push(`${label}: actorIds must equal the Actor Step union`)
    }
    missingRelation(issues, label, 'actor', scenario.actorIds, actorIds)
    for (const route of scenario.routes) {
      if (!(routePlaces.get(route.id) || []).length) issues.push(`${label}: route "${route.id}" must be placed by at least one Step`)
    }
    const sequences = new Map<string, string>()
    for (const route of scenario.routes) {
      const sequence = (routePlaces.get(route.id) || []).join('\n')
      if (!sequence) continue
      const twin = sequences.get(sequence)
      if (twin) issues.push(`${label}: route "${route.id}" repeats every Product Place of route "${twin}"`)
      else sequences.set(sequence, route.id)
    }
    const supportedSomewhere = new Set<string>()
    for (const pair of allPairs) {
      const supported = supportedActorsForPair(pair) || new Set<string>()
      const participating = scenario.actorIds.filter(actorId => supported.has(actorId))
      if (!participating.length) issues.push(`${label}: context "${availabilityLabel(pair)}" permits none of the Scenario Actors`)
      for (const actorId of participating) supportedSomewhere.add(actorId)
    }
    for (const actorId of scenario.actorIds) {
      if (actorIds.has(actorId) && !supportedSomewhere.has(actorId)) {
        issues.push(`${label}: actor "${actorId}" is not supported by any selected Product Place`)
      }
    }
    if (journeyActors) {
      for (const route of scenario.routes) {
        const firstActorStep = scenario.steps.find(step =>
          step.kind === 'actor' && step.places.some(place => place.routeId === route.id)
        )
        if (!firstActorStep?.actorId || !journeyActors.has(firstActorStep.actorId)) {
          issues.push(`${label}: route "${route.id}" must begin its Actor-owned placed Steps with a Journey Actor`)
        }
      }
    }
    return { allPairs, capabilitySteps, screenIds }
  }

  const capabilityScenariosById = new Map(model.capabilityScenarios.map(item => [item.id, item]))
  const capabilityScenarioPairs = new Map<string, Set<string>>()
  const coveredCapabilityPairs = new Map<string, Set<string>>()
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
    const { allPairs: pairs, screenIds } = validateScenarioShape(scenario, label, scenario.capabilityId)
    capabilityScenarioScreens.set(scenario.id, screenIds)
    capabilityScenarioPairs.set(scenario.id, pairs)
    const covered = coveredCapabilityPairs.get(scenario.capabilityId) || new Set<string>()
    for (const pair of pairs) covered.add(pair)
    coveredCapabilityPairs.set(scenario.capabilityId, covered)
    const supported = capabilityPairs.get(scenario.capabilityId) || new Set<string>()
    for (const pair of pairs) {
      if (!supported.has(pair)) {
        issues.push(`${label}: availability "${availabilityLabel(pair)}" is outside capability "${scenario.capabilityId}"`)
      }
    }
  }
  if (report.coverage.status === 'complete') {
    for (const capability of model.capabilities) {
      const covered = coveredCapabilityPairs.get(capability.id) || new Set<string>()
      for (const pair of capabilityPairs.get(capability.id) || []) {
        if (!covered.has(pair)) {
          issues.push(`capability "${capability.id}": availability "${availabilityLabel(pair)}" needs Capability Scenario coverage`)
        }
      }
    }
  }

  const journeysById = new Map(model.journeys.map(item => [item.id, item]))
  const journeyScenariosById = new Map(model.journeyScenarios.map(item => [item.id, item]))
  const journeyScenarioSteps = new Map<string, Array<{ capabilityId: string, pairs: Set<string> }>>()
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
      ['Intent', 'Information presented', 'Available actions', 'Product states', 'Capability boundary']
    )
    const pairs = availabilityPairs(issues, label, screen.availability, interfaceIds, experiencesById)
    missingRelation(issues, label, 'capability', screen.capabilityIds, capabilityIds)
    missingRelation(issues, label, 'Capability Scenario', screen.capabilityScenarioIds, capabilityScenarioIds)
    missingRelation(issues, label, 'Journey Scenario', screen.journeyScenarioIds, journeyScenarioIds)
    requireEntryPointInterfaces(issues, label, screen.entryPoints, interfaceIdsFromAvailability(screen.availability))
    for (const capabilityId of screen.capabilityIds) {
      const supported = capabilityPairs.get(capabilityId)
      if (!supported) continue
      for (const pair of pairs) {
        if (!supported.has(pair)) issues.push(`${label}: capability "${capabilityId}" is not available in "${availabilityLabel(pair)}"`)
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
      if (stateTitles.has(normalized)) issues.push(`${label}: duplicate product state "${state.title}"`)
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
    for (const [index, target] of rule.appliesTo.entries()) {
      const targetLabel = `${label}: appliesTo item ${index + 1}`
      if (target.type === 'context') {
        const pair = exactContextPair(issues, targetLabel, target, interfaceIds, experiencesById)
        const key = `context\0${pair}`
        if (seenTargets.has(key)) issues.push(`${targetLabel}: duplicate context target "${availabilityLabel(pair)}"`)
        seenTargets.add(key)
        continue
      }
      const key = `${target.type}\0${target.id}`
      if (seenTargets.has(key)) issues.push(`${targetLabel}: duplicate target "${target.type}:${target.id}"`)
      seenTargets.add(key)
      let supported = new Set<string>()
      if (target.type === 'capability') {
        if (!capabilityIds.has(target.id)) issues.push(`${targetLabel}: references missing capability "${target.id}"`)
        capabilityTargets.add(target.id)
        supported = capabilityPairs.get(target.id) || supported
      } else if (target.type === 'capability-scenario') {
        if (!capabilityScenarioIds.has(target.id)) issues.push(`${targetLabel}: references missing Capability Scenario "${target.id}"`)
        capabilityScenarioTargets.push(target.id)
        supported = capabilityScenarioPairs.get(target.id) || supported
      } else if (target.type === 'journey') {
        if (!journeyIds.has(target.id)) issues.push(`${targetLabel}: references missing journey "${target.id}"`)
        journeyTargets.add(target.id)
        for (const scenario of model.journeyScenarios.filter(item => item.journeyId === target.id && item.result === 'achieved')) {
          for (const entry of journeyScenarioSteps.get(scenario.id) || []) {
            for (const pair of entry.pairs) supported.add(pair)
          }
        }
      } else {
        if (!journeyScenarioIds.has(target.id)) issues.push(`${targetLabel}: references missing Journey Scenario "${target.id}"`)
        journeyScenarioTargets.push(target.id)
        for (const entry of journeyScenarioSteps.get(target.id) || []) {
          for (const pair of entry.pairs) supported.add(pair)
        }
      }
      const seenContexts = new Set<string>()
      for (const [contextIndex, context] of target.contexts.entries()) {
        const contextLabel = `${targetLabel}: context ${contextIndex + 1}`
        const pair = exactContextPair(issues, contextLabel, context, interfaceIds, experiencesById)
        if (seenContexts.has(pair)) issues.push(`${contextLabel}: duplicate context "${availabilityLabel(pair)}"`)
        seenContexts.add(pair)
        if (!supported.has(pair)) {
          issues.push(`${contextLabel}: context "${availabilityLabel(pair)}" is outside target "${target.type}:${target.id}"`)
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
export function projectPortableReport(report: ProductReportV9): ProductReportV9 {
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
      capabilities: strip(report.model.capabilities),
      capabilityScenarios: strip(report.model.capabilityScenarios),
      journeys: strip(report.model.journeys),
      journeyScenarios: strip(report.model.journeyScenarios),
      businessRules: strip(report.model.businessRules)
    },
    coverage: { ...report.coverage, sourceAreas: [] }
  }
}

export function parseProductReport(input: unknown): ProductReportV9 {
  const report = ProductReportV9Schema.parse(input)
  const issues = validateProductReport(report)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return report
}

/** Additional publication policy for a Product Report entering the public Blueprint catalog. */
export function validateBlueprintReport(report: ProductReportV9): string[] {
  const issues: string[] = []
  if (!report.category) issues.push('category is required for a public Blueprint')
  if (!report.tags.length) issues.push('at least one tag is required for a public Blueprint')
  if (!report.authors.length) issues.push('at least one author is required for a public Blueprint')
  if (!report.license) issues.push('license is required for a public Blueprint')
  if (!report.model.capabilities.length) issues.push('a public Blueprint needs at least one capability')
  const pairsOf = (availability: ReportAvailability[]): Set<string> => new Set(
    availability.flatMap(item => item.experienceIds.length
      ? item.experienceIds.map(experienceId => pairKey(item.interfaceId, experienceId))
      : [pairKey(item.interfaceId, '')])
  )
  const covered = new Map<string, Set<string>>()
  const reportExperiencesById = new Map(report.model.experiences.map(item => [item.id, item]))
  const placePair = (placeId: string): string => {
    const screen = report.model.screens.find(item => item.id === placeId)
    if (screen) {
      const experience = report.model.experiences.find(item => screen.id.startsWith(`${item.id}::`))
      return pairKey(experience?.interfaceIds[0] || screen.id.split('::')[0] || '', experience?.id || '')
    }
    const experience = reportExperiencesById.get(placeId)
    if (experience) return pairKey(experience.interfaceIds[0] || '', experience.id)
    return pairKey(placeId, '')
  }
  for (const scenario of report.model.capabilityScenarios) {
    const pairs = covered.get(scenario.capabilityId) || new Set<string>()
    for (const place of scenario.steps.flatMap(step => step.places)) pairs.add(placePair(place.placeId))
    covered.set(scenario.capabilityId, pairs)
  }
  for (const capability of report.model.capabilities) {
    const coveredPairs = covered.get(capability.id) || new Set<string>()
    for (const pair of pairsOf(capability.availability)) {
      if (!coveredPairs.has(pair)) {
        issues.push(`capability "${capability.id}" availability "${availabilityLabel(pair)}" needs Capability Scenario coverage for a public Blueprint`)
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
