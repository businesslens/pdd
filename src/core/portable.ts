import * as z from 'zod'
import { parseCodeTarget } from './coderefs.js'

export const REPORT_SCHEMA_VERSION = '7.0.0'

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const ProductIdSchema = IdSchema.max(64)
const SingleLineTextSchema = z.string().min(1)
  .refine(value => value.trim().length > 0, 'Expected non-whitespace text')
  .refine(value => !/[\r\n]/.test(value), 'Expected a single line')

function containsStructuralHeading(value: string): boolean {
  let inFence = false
  for (const line of value.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
    } else if (!inFence && /^#{1,2}\s/.test(line)) {
      return true
    }
  }
  return false
}

const RequiredMarkdownFragmentSchema = z.string().min(1)
  .refine(value => value.trim().length > 0, 'Expected non-whitespace text')
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

const EntityContentSchema = {
  intent: z.string(),
  supportingContent: z.string(),
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
  journeys: z.number().int().min(0),
  scenarios: z.number().int().min(0),
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
  experienceIds: z.array(IdSchema).min(1)
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
  scenarioIds: z.array(IdSchema),
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
  summary: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  capabilityIds: z.array(IdSchema).min(1),
  availability: z.array(ReportAvailabilitySchema).min(1),
  entryPoints: z.array(ReportEntryPointSchema),
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

export const ReportScenarioSchema = z.strictObject({
  id: IdSchema,
  journeyId: IdSchema,
  title: SingleLineTextSchema,
  kindId: IdSchema,
  availability: z.array(ReportAvailabilitySchema),
  trigger: RequiredMarkdownFragmentSchema,
  steps: z.array(SingleLineTextSchema).min(1),
  decisionPoints: z.array(ReportDecisionPointSchema),
  outcome: RequiredMarkdownFragmentSchema,
  edgeCases: z.array(SingleLineTextSchema),
  ...EntityContentSchema
})

export const ReportBusinessRuleSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  statement: RequiredMarkdownFragmentSchema,
  rationale: z.string(),
  domainIds: z.array(IdSchema),
  capabilityIds: z.array(IdSchema),
  journeyIds: z.array(IdSchema),
  scenarioIds: z.array(IdSchema),
  availability: z.array(ReportAvailabilitySchema),
  ...EntityContentSchema
})

export const ReportCoverageSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  unmapped: z.array(z.string()),
  limitations: z.array(z.string()),
  rationale: z.string()
})

export const ProductReportV7Schema = z.strictObject({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  id: ProductIdSchema,
  title: SingleLineTextSchema.max(160),
  summary: SingleLineTextSchema.max(400),
  description: RequiredMarkdownFragmentSchema.max(2000),
  category: IdSchema.max(60).nullable(),
  authors: z.array(ReportAuthorSchema),
  license: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.+-]*$/).max(80).nullable(),
  intent: z.string(),
  supportingContent: z.string(),
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
    experiences: z.array(ReportExperienceSchema).min(1),
    screens: z.array(ReportScreenSchema),
    domains: z.array(ReportDomainSchema),
    capabilities: z.array(ReportCapabilitySchema),
    journeys: z.array(ReportJourneySchema),
    scenarios: z.array(ReportScenarioSchema),
    businessRules: z.array(ReportBusinessRuleSchema)
  }),
  coverage: ReportCoverageSchema
})

export const ProductReportSchema = ProductReportV7Schema

export type ProductReportV7 = z.infer<typeof ProductReportV7Schema>
export type ProductReport = ProductReportV7
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
export type ReportScenario = z.infer<typeof ReportScenarioSchema>
export type ReportBusinessRule = z.infer<typeof ReportBusinessRuleSchema>
export type ReportReference = z.infer<typeof ReportReferenceSchema>

function duplicateIssues(label: string, ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates].sort().map(id => `${label}: duplicate id "${id}"`)
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

function availabilityPairs(
  issues: string[],
  label: string,
  availability: ReportAvailability[],
  interfaceIds: Set<string>,
  experiencesById: Map<string, ReportExperience>
): Set<string> {
  const pairs = new Set<string>()
  const seenInterfaces = new Set<string>()
  for (const item of availability) {
    if (seenInterfaces.has(item.interfaceId)) {
      issues.push(`${label}: duplicate availability interface "${item.interfaceId}"`)
    }
    seenInterfaces.add(item.interfaceId)
    if (!interfaceIds.has(item.interfaceId)) {
      issues.push(`${label}: references missing interface "${item.interfaceId}"`)
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
      if (pairs.has(key)) issues.push(`${label}: duplicate availability pair "${item.interfaceId}/${experienceId}"`)
      pairs.add(key)
    }
  }
  return pairs
}

function interfaceIdsFromAvailability(availability: ReportAvailability[]): Set<string> {
  return new Set(availability.map(item => item.interfaceId))
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
export function validateProductReport(report: ProductReportV7): string[] {
  const issues: string[] = []
  const { model } = report
  const actorIds = new Set(model.actors.map(item => item.id))
  const interfaceIds = new Set(model.interfaces.map(item => item.id))
  const interfacesById = new Map(model.interfaces.map(item => [item.id, item]))
  const experienceIds = new Set(model.experiences.map(item => item.id))
  const experiencesById = new Map(model.experiences.map(item => [item.id, item]))
  const domainIds = new Set(model.domains.map(item => item.id))
  const capabilityIds = new Set(model.capabilities.map(item => item.id))
  const capabilityPairs = new Map<string, Set<string>>()
  const journeyIds = new Set(model.journeys.map(item => item.id))
  const scenarioIds = new Set(model.scenarios.map(item => item.id))
  const kindIds = new Set(model.taxonomies.scenarioKinds.map(item => item.id))

  const collections: Array<[string, string[]]> = [
    ['actors', model.actors.map(item => item.id)],
    ['interfaces', model.interfaces.map(item => item.id)],
    ['experiences', model.experiences.map(item => item.id)],
    ['screens', model.screens.map(item => item.id)],
    ['domains', model.domains.map(item => item.id)],
    ['capabilities', model.capabilities.map(item => item.id)],
    ['journeys', model.journeys.map(item => item.id)],
    ['scenarios', model.scenarios.map(item => item.id)],
    ['businessRules', model.businessRules.map(item => item.id)],
    ['scenarioKinds', model.taxonomies.scenarioKinds.map(item => item.id)]
  ]
  for (const [label, ids] of collections) issues.push(...duplicateIssues(label, ids))

  for (const productInterface of model.interfaces) {
    missingRelation(issues, `interface "${productInterface.id}"`, 'actor', productInterface.actorIds, actorIds)
  }
  for (const experience of model.experiences) {
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
  for (const screen of model.screens) {
    const pairs = availabilityPairs(
      issues,
      `screen "${screen.id}"`,
      screen.availability,
      interfaceIds,
      experiencesById
    )
    missingRelation(issues, `screen "${screen.id}"`, 'capability', screen.capabilityIds, capabilityIds)
    missingRelation(issues, `screen "${screen.id}"`, 'scenario', screen.scenarioIds, scenarioIds)
    requireEntryPointInterfaces(
      issues,
      `screen "${screen.id}"`,
      screen.entryPoints,
      interfaceIdsFromAvailability(screen.availability)
    )
    for (const capabilityId of screen.capabilityIds) {
      const supported = capabilityPairs.get(capabilityId)
      if (!supported) continue
      for (const pair of pairs) {
        if (!supported.has(pair)) {
          const [interfaceId, experienceId] = pair.split('\0')
          issues.push(`screen "${screen.id}": capability "${capabilityId}" is not available in "${interfaceId}/${experienceId}"`)
        }
      }
    }
    const stateTitles = new Set<string>()
    for (const state of screen.states) {
      const normalized = state.title.toLowerCase()
      if (stateTitles.has(normalized)) issues.push(`screen "${screen.id}": duplicate product state "${state.title}"`)
      stateTitles.add(normalized)
    }
  }
  const journeyPairs = new Map<string, Set<string>>()
  for (const journey of model.journeys) {
    missingRelation(issues, `journey "${journey.id}"`, 'actor', journey.actorIds, actorIds)
    missingRelation(issues, `journey "${journey.id}"`, 'capability', journey.capabilityIds, capabilityIds)
    const pairs = availabilityPairs(
      issues,
      `journey "${journey.id}"`,
      journey.availability,
      interfaceIds,
      experiencesById
    )
    journeyPairs.set(journey.id, pairs)
    requireEntryPointInterfaces(
      issues,
      `journey "${journey.id}"`,
      journey.entryPoints,
      interfaceIdsFromAvailability(journey.availability)
    )
    for (const capabilityId of journey.capabilityIds) {
      const supported = capabilityPairs.get(capabilityId)
      if (!supported) continue
      for (const pair of pairs) {
        if (!supported.has(pair)) {
          const [interfaceId, experienceId] = pair.split('\0')
          issues.push(`journey "${journey.id}": capability "${capabilityId}" is not available in "${interfaceId}/${experienceId}"`)
        }
      }
    }
    if (!model.scenarios.some(scenario => scenario.journeyId === journey.id)) {
      issues.push(`journey "${journey.id}": needs at least one scenario`)
    }
  }
  for (const scenario of model.scenarios) {
    if (!journeyIds.has(scenario.journeyId)) {
      issues.push(`scenario "${scenario.id}": references missing journey "${scenario.journeyId}"`)
    }
    if (!kindIds.has(scenario.kindId)) {
      issues.push(`scenario "${scenario.id}": references missing scenario kind "${scenario.kindId}"`)
    }
    if (scenario.availability.length) {
      const pairs = availabilityPairs(
        issues,
        `scenario "${scenario.id}"`,
        scenario.availability,
        interfaceIds,
        experiencesById
      )
      const parentPairs = journeyPairs.get(scenario.journeyId) || new Set<string>()
      for (const pair of pairs) {
        if (!parentPairs.has(pair)) {
          const [interfaceId, experienceId] = pair.split('\0')
          issues.push(`scenario "${scenario.id}": availability "${interfaceId}/${experienceId}" is outside journey "${scenario.journeyId}"`)
        }
      }
    }
  }
  for (const rule of model.businessRules) {
    missingRelation(issues, `business rule "${rule.id}"`, 'domain', rule.domainIds, domainIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'capability', rule.capabilityIds, capabilityIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'journey', rule.journeyIds, journeyIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'scenario', rule.scenarioIds, scenarioIds)
    availabilityPairs(
      issues,
      `business rule "${rule.id}"`,
      rule.availability,
      interfaceIds,
      experiencesById
    )
    if (
      !rule.domainIds.length
      && !rule.capabilityIds.length
      && !rule.journeyIds.length
      && !rule.scenarioIds.length
      && !rule.availability.length
    ) {
      issues.push(`business rule "${rule.id}": must relate to a domain, capability, journey, scenario, or availability pair`)
    }
  }

  const expectedCounts = {
    actors: model.actors.length,
    interfaces: model.interfaces.length,
    experiences: model.experiences.length,
    screens: model.screens.length,
    domains: model.domains.length,
    capabilities: model.capabilities.length,
    journeys: model.journeys.length,
    scenarios: model.scenarios.length,
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
    ...model.journeys,
    ...model.scenarios,
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
    const entryPointHosts = [...model.interfaces, ...model.experiences, ...model.screens, ...model.journeys]
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
export function projectPortableReport(report: ProductReportV7): ProductReportV7 {
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
      journeys: stripWithEntryPoints(report.model.journeys),
      scenarios: strip(report.model.scenarios),
      businessRules: strip(report.model.businessRules)
    },
    coverage: { ...report.coverage, sourceAreas: [] }
  }
}

export function parseProductReport(input: unknown): ProductReportV7 {
  const report = ProductReportV7Schema.parse(input)
  const issues = validateProductReport(report)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return report
}

/** Additional publication policy for a Product Report entering the public Blueprint catalog. */
export function validateBlueprintReport(report: ProductReportV7): string[] {
  const issues: string[] = []
  if (!report.category) issues.push('category is required for a public Blueprint')
  if (!report.tags.length) issues.push('at least one tag is required for a public Blueprint')
  if (!report.authors.length) issues.push('at least one author is required for a public Blueprint')
  if (!report.license) issues.push('license is required for a public Blueprint')
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
