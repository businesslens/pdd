import * as z from 'zod'
import { parseCodeTarget } from './coderefs.js'
import { containsStructuralHeading } from './markdown.js'

export const REPORT_SCHEMA_VERSION = '8.0.0'

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
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
  title: SingleLineTextSchema.optional()
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
  interfaceId: IdSchema,
  experienceIds: z.array(IdSchema)
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
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  entryPoints: z.array(ReportEntryPointSchema),
  capabilityBoundary: RequiredMarkdownFragmentSchema,
  ...EntityContentSchema
})

export const ReportExperienceSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  interfaceIds: z.array(IdSchema).min(1),
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
  id: IdSchema,
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

const ReportScenarioContentShape = {
  title: SingleLineTextSchema,
  kindId: IdSchema,
  actorIds: z.array(IdSchema).min(1),
  trigger: RequiredMarkdownFragmentSchema,
  steps: z.array(SingleLineTextSchema).min(1),
  decisionPoints: z.array(ReportDecisionPointSchema),
  outcome: RequiredMarkdownFragmentSchema,
  edgeCases: z.array(SingleLineTextSchema),
  ...EntityContentSchema
}

export const ReportCapabilityScenarioSchema = z.strictObject({
  id: IdSchema,
  capabilityId: IdSchema,
  availability: z.array(ReportAvailabilitySchema).min(1),
  ...ReportScenarioContentShape
})

export const ReportJourneyFlowItemSchema = z.strictObject({
  capabilityId: IdSchema,
  operation: SingleLineTextSchema,
  availability: z.array(ReportAvailabilitySchema).min(1)
})

export const ReportJourneyScenarioSchema = z.strictObject({
  id: IdSchema,
  journeyId: IdSchema,
  result: z.enum(['achieved', 'not-achieved']),
  flow: z.array(ReportJourneyFlowItemSchema).min(1),
  ...ReportScenarioContentShape
})

export const ReportBusinessRuleSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  statement: RequiredMarkdownFragmentSchema,
  rationale: MarkdownFragmentSchema,
  domainIds: z.array(IdSchema),
  capabilityIds: z.array(IdSchema),
  journeyIds: z.array(IdSchema),
  capabilityScenarioIds: z.array(IdSchema),
  journeyScenarioIds: z.array(IdSchema),
  availability: z.array(ReportAvailabilitySchema),
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

export const ProductReportV8Schema = z.strictObject({
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

export const ProductReportSchema = ProductReportV8Schema

export type ProductReportV8 = z.infer<typeof ProductReportV8Schema>
export type ProductReport = ProductReportV8
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
export type ReportJourneyFlowItem = z.infer<typeof ReportJourneyFlowItemSchema>
export type ReportJourneyScenario = z.infer<typeof ReportJourneyScenarioSchema>
export type ReportBusinessRule = z.infer<typeof ReportBusinessRuleSchema>
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

function availabilityLabel(key: string): string {
  const [interfaceId, experienceId] = key.split('\0')
  return experienceId ? `${interfaceId}/${experienceId}` : (interfaceId || '')
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

function interfaceIdsFromAvailability(availability: ReportAvailability[]): Set<string> {
  return new Set(availability.map(item => item.interfaceId))
}

function intersects(left: Set<string>, right: Set<string>): boolean {
  for (const value of left) if (right.has(value)) return true
  return false
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
export function validateProductReport(report: ProductReportV8): string[] {
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
  const validateScenarioActors = (label: string, scenarioActors: string[], pairs: Set<string>) => {
    missingRelation(issues, label, 'actor', scenarioActors, actorIds)
    const supportedSomewhere = new Set<string>()
    for (const pair of pairs) {
      const supported = supportedActorsForPair(pair)
      if (!supported) continue
      const participating = scenarioActors.filter(actorId => supported.has(actorId))
      if (!participating.length) issues.push(`${label}: context "${availabilityLabel(pair)}" permits none of the Scenario Actors`)
      for (const actorId of participating) supportedSomewhere.add(actorId)
    }
    for (const actorId of scenarioActors) {
      if (actorIds.has(actorId) && !supportedSomewhere.has(actorId)) {
        issues.push(`${label}: actor "${actorId}" is not supported by any selected context`)
      }
    }
  }

  const capabilityScenariosById = new Map(model.capabilityScenarios.map(item => [item.id, item]))
  const capabilityScenarioPairs = new Map<string, Set<string>>()
  const coveredCapabilities = new Set<string>()
  for (const scenario of model.capabilityScenarios) {
    const label = `capability scenario "${scenario.id}"`
    requireUniqueValues(issues, label, 'actorIds', scenario.actorIds)
    validateSupportingSections(
      issues,
      label,
      scenario.supportingSections,
      ['Intent', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases', 'Goal', 'Success criterion']
    )
    if (!kindIds.has(scenario.kindId)) issues.push(`${label}: references missing scenario kind "${scenario.kindId}"`)
    if (!capabilityIds.has(scenario.capabilityId)) {
      issues.push(`${label}: references missing capability "${scenario.capabilityId}"`)
    } else {
      coveredCapabilities.add(scenario.capabilityId)
    }
    const pairs = availabilityPairs(issues, label, scenario.availability, interfaceIds, experiencesById)
    capabilityScenarioPairs.set(scenario.id, pairs)
    const supported = capabilityPairs.get(scenario.capabilityId) || new Set<string>()
    for (const pair of pairs) {
      if (!supported.has(pair)) {
        issues.push(`${label}: availability "${availabilityLabel(pair)}" is outside capability "${scenario.capabilityId}"`)
      }
    }
    validateScenarioActors(label, scenario.actorIds, pairs)
  }
  if (report.coverage.status === 'complete') {
    for (const capabilityId of capabilityIds) {
      if (!coveredCapabilities.has(capabilityId)) {
        issues.push(`capability "${capabilityId}": needs at least one Capability Scenario`)
      }
    }
  }

  const journeysById = new Map(model.journeys.map(item => [item.id, item]))
  const journeyScenariosById = new Map(model.journeyScenarios.map(item => [item.id, item]))
  const journeyScenarioFlow = new Map<string, Array<{ capabilityId: string, pairs: Set<string> }>>()
  for (const scenario of model.journeyScenarios) {
    const label = `journey scenario "${scenario.id}"`
    requireUniqueValues(issues, label, 'actorIds', scenario.actorIds)
    validateSupportingSections(
      issues,
      label,
      scenario.supportingSections,
      ['Intent', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases', 'Goal', 'Success criterion']
    )
    const journey = journeysById.get(scenario.journeyId)
    if (!journey) issues.push(`${label}: references missing journey "${scenario.journeyId}"`)
    if (!kindIds.has(scenario.kindId)) issues.push(`${label}: references missing scenario kind "${scenario.kindId}"`)
    if (journey && !scenario.actorIds.some(actorId => journey.actorIds.includes(actorId))) {
      issues.push(`${label}: actors must include at least one actor from journey "${scenario.journeyId}"`)
    }
    const allPairs = new Set<string>()
    const flowEntries: Array<{ capabilityId: string, pairs: Set<string> }> = []
    for (const [index, item] of scenario.flow.entries()) {
      const flowLabel = `${label}: flow item ${index + 1}`
      if (!capabilityIds.has(item.capabilityId)) {
        issues.push(`${flowLabel}: references missing capability "${item.capabilityId}"`)
      }
      const pairs = availabilityPairs(issues, flowLabel, item.availability, interfaceIds, experiencesById)
      flowEntries.push({ capabilityId: item.capabilityId, pairs })
      for (const pair of pairs) allPairs.add(pair)
      const supported = capabilityPairs.get(item.capabilityId) || new Set<string>()
      for (const pair of pairs) {
        if (!supported.has(pair)) {
          issues.push(`${flowLabel}: availability "${availabilityLabel(pair)}" is outside capability "${item.capabilityId}"`)
        }
      }
    }
    journeyScenarioFlow.set(scenario.id, flowEntries)
    validateScenarioActors(label, scenario.actorIds, allPairs)
    if (scenario.result === 'achieved' && new Set(scenario.flow.map(item => item.capabilityId)).size < 2) {
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
    const achievedCapabilities = new Set(achieved.flatMap(scenario => scenario.flow.map(item => item.capabilityId)))
    const failedCapabilities = new Set(
      scenarios.filter(scenario => scenario.result === 'not-achieved').flatMap(scenario => scenario.flow.map(item => item.capabilityId))
    )
    const failureOnly = new Set([...failedCapabilities].filter(capabilityId => !achievedCapabilities.has(capabilityId)))
    const domains = new Set(
      [...achievedCapabilities].map(capabilityId => model.capabilities.find(item => item.id === capabilityId)?.domainId).filter(Boolean) as string[]
    )
    missingRelation(issues, label, 'capability', journey.capabilityIds, capabilityIds)
    missingRelation(issues, label, 'failure-only capability', journey.failureOnlyCapabilityIds, capabilityIds)
    missingRelation(issues, label, 'domain', journey.domainIds, domainIds)
    if (!sameIds(journey.capabilityIds, achievedCapabilities)) issues.push(`${label}: capabilityIds must equal the achieved-flow Capability union`)
    if (!sameIds(journey.failureOnlyCapabilityIds, failureOnly)) issues.push(`${label}: failureOnlyCapabilityIds must equal the failure-only Capability set`)
    if (!sameIds(journey.domainIds, domains)) issues.push(`${label}: domainIds must equal the Domains derived from achieved-flow Capabilities`)
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
    for (const scenarioId of screen.capabilityScenarioIds) {
      const scenario = capabilityScenariosById.get(scenarioId)
      if (!scenario) continue
      if (!screen.capabilityIds.includes(scenario.capabilityId)) {
        issues.push(`${label}: Capability Scenario "${scenarioId}" uses capability "${scenario.capabilityId}" outside the Screen capability list`)
      }
      if (!intersects(pairs, capabilityScenarioPairs.get(scenarioId) || new Set<string>())) {
        issues.push(`${label}: Capability Scenario "${scenarioId}" shares no exact context with the Screen`)
      }
    }
    for (const scenarioId of screen.journeyScenarioIds) {
      if (!journeyScenariosById.has(scenarioId)) continue
      const participates = (journeyScenarioFlow.get(scenarioId) || []).some(item =>
        screen.capabilityIds.includes(item.capabilityId) && intersects(pairs, item.pairs)
      )
      if (!participates) issues.push(`${label}: Journey Scenario "${scenarioId}" has no flow item matching a Screen capability and exact context`)
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
    requireUniqueValues(issues, label, 'domainIds', rule.domainIds)
    requireUniqueValues(issues, label, 'capabilityIds', rule.capabilityIds)
    requireUniqueValues(issues, label, 'journeyIds', rule.journeyIds)
    requireUniqueValues(issues, label, 'capabilityScenarioIds', rule.capabilityScenarioIds)
    requireUniqueValues(issues, label, 'journeyScenarioIds', rule.journeyScenarioIds)
    validateSupportingSections(issues, label, rule.supportingSections, ['Intent', 'Rationale'])
    missingRelation(issues, label, 'domain', rule.domainIds, domainIds)
    missingRelation(issues, label, 'capability', rule.capabilityIds, capabilityIds)
    missingRelation(issues, label, 'journey', rule.journeyIds, journeyIds)
    missingRelation(issues, label, 'Capability Scenario', rule.capabilityScenarioIds, capabilityScenarioIds)
    missingRelation(issues, label, 'Journey Scenario', rule.journeyScenarioIds, journeyScenarioIds)
    availabilityPairs(issues, label, rule.availability, interfaceIds, experiencesById)
    if (
      !rule.domainIds.length
      && !rule.capabilityIds.length
      && !rule.journeyIds.length
      && !rule.capabilityScenarioIds.length
      && !rule.journeyScenarioIds.length
      && !rule.availability.length
    ) {
      issues.push(`${label}: must relate to a domain, capability, journey, Scenario, or availability scope`)
    }
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
export function projectPortableReport(report: ProductReportV8): ProductReportV8 {
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

export function parseProductReport(input: unknown): ProductReportV8 {
  const report = ProductReportV8Schema.parse(input)
  const issues = validateProductReport(report)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return report
}

/** Additional publication policy for a Product Report entering the public Blueprint catalog. */
export function validateBlueprintReport(report: ProductReportV8): string[] {
  const issues: string[] = []
  if (!report.category) issues.push('category is required for a public Blueprint')
  if (!report.tags.length) issues.push('at least one tag is required for a public Blueprint')
  if (!report.authors.length) issues.push('at least one author is required for a public Blueprint')
  if (!report.license) issues.push('license is required for a public Blueprint')
  const covered = new Set(report.model.capabilityScenarios.map(scenario => scenario.capabilityId))
  for (const capability of report.model.capabilities) {
    if (!covered.has(capability.id)) {
      issues.push(`capability "${capability.id}" needs at least one Capability Scenario for a public Blueprint`)
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
