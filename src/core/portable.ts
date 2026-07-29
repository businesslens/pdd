import * as z from 'zod'

export const REPORT_SCHEMA_VERSION = '4.0.0'
export const SUBMISSION_SCHEMA_VERSION = '1.0.0'

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

export const CodeReferenceSchema = z.strictObject({
  path: z.string().min(1),
  symbol: z.string().min(1).optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional()
}).superRefine((reference, context) => {
  if (reference.endLine !== undefined && reference.startLine === undefined) {
    context.addIssue({ code: 'custom', path: ['endLine'], message: 'endLine requires startLine' })
  } else if (
    reference.startLine !== undefined
    && reference.endLine !== undefined
    && reference.endLine < reference.startLine
  ) {
    context.addIssue({ code: 'custom', path: ['endLine'], message: 'endLine must be greater than or equal to startLine' })
  }
})

export const EntityLinkSchema = z.strictObject({
  rel: z.enum(['spec', 'proposal', 'doc', 'adr']),
  href: z.string().min(1),
  title: z.string().min(1).optional()
})

const EntityContentSchema = {
  intent: z.string(),
  supportingContent: z.string(),
  codeRefs: z.array(CodeReferenceSchema),
  links: z.array(EntityLinkSchema)
}

export const TaxonomyEntrySchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: z.string(),
  colorSlot: z.number().int().optional()
})

const ReportEntityCountShape = {
  actors: z.number().int().min(0),
  experiences: z.number().int().min(0),
  domains: z.number().int().min(0),
  features: z.number().int().min(0),
  journeys: z.number().int().min(0),
  scenarios: z.number().int().min(0),
  businessRules: z.number().int().min(0)
}

export const ReportSummarySchema = z.strictObject(ReportEntityCountShape)

export const ReportGeneratorSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().min(1)
})

export const ReportActorSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  ...EntityContentSchema
})

export const ReportDomainSchema = z.strictObject({
  id: IdSchema,
  name: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  colorSlot: z.number().int().optional(),
  ...EntityContentSchema
})

export const ReportEntryPointSchema = z.strictObject({
  type: SingleLineTextSchema,
  path: SingleLineTextSchema
})

export const ReportExperienceSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  actorIds: z.array(IdSchema).min(1),
  accessMode: z.enum(['public', 'authenticated', 'restricted']),
  capabilities: z.string(),
  entryPoints: z.array(ReportEntryPointSchema),
  exitContract: z.string(),
  ...EntityContentSchema
})

export const ReportFeatureSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  domainId: IdSchema,
  actorIds: z.array(IdSchema),
  experienceIds: z.array(IdSchema),
  businessRuleIds: z.array(IdSchema),
  ...EntityContentSchema
})

export const ReportJourneySchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  summary: RequiredMarkdownFragmentSchema,
  domainId: IdSchema,
  actorIds: z.array(IdSchema),
  experienceIds: z.array(IdSchema),
  featureIds: z.array(IdSchema),
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
  trigger: RequiredMarkdownFragmentSchema,
  steps: z.array(SingleLineTextSchema).min(1),
  decisionPoints: z.array(ReportDecisionPointSchema),
  outcome: RequiredMarkdownFragmentSchema,
  edgeCases: z.array(SingleLineTextSchema),
  businessRuleIds: z.array(IdSchema),
  ...EntityContentSchema
})

export const ReportBusinessRuleSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  statement: RequiredMarkdownFragmentSchema,
  rationale: z.string(),
  domainIds: z.array(IdSchema),
  featureIds: z.array(IdSchema),
  journeyIds: z.array(IdSchema),
  scenarioIds: z.array(IdSchema),
  ...EntityContentSchema
})

export const ReportCoverageSchema = z.strictObject({
  status: z.enum(['complete', 'partial', 'draft']),
  method: z.array(z.string()),
  sourceAreas: z.array(z.string()),
  counts: z.record(z.string(), z.number().int().min(0)),
  mapped: z.record(z.string(), z.number().int().min(0)),
  unmapped: z.array(z.string()),
  limitations: z.array(z.string()),
  rationale: z.string()
})

export const ProductReportV4Schema = z.strictObject({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  id: ProductIdSchema,
  title: SingleLineTextSchema.max(160),
  description: RequiredMarkdownFragmentSchema.max(2000),
  intent: z.string(),
  supportingContent: z.string(),
  links: z.array(EntityLinkSchema),
  tags: z.array(z.string().min(1).max(48)).max(24),
  generatedAt: z.iso.date(),
  generator: ReportGeneratorSchema,
  summary: ReportSummarySchema,
  limitations: z.array(z.string()),
  model: z.strictObject({
    taxonomies: z.strictObject({
      scenarioKinds: z.array(TaxonomyEntrySchema)
    }),
    actors: z.array(ReportActorSchema),
    experiences: z.array(ReportExperienceSchema).min(1),
    domains: z.array(ReportDomainSchema),
    features: z.array(ReportFeatureSchema),
    journeys: z.array(ReportJourneySchema),
    scenarios: z.array(ReportScenarioSchema),
    businessRules: z.array(ReportBusinessRuleSchema)
  }),
  coverage: ReportCoverageSchema
})

const SubmissionDateSchema = z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Expected a parseable date')

export const GitRepositoryProvenanceSchema = z.strictObject({
  kind: z.literal('git-repository'),
  name: z.string().min(1),
  url: z.url().refine(value => value.startsWith('https://'), 'Repository URL must use HTTPS'),
  logoUrl: z.url().optional(),
  branch: z.string().min(1),
  commit: z.string().regex(/^[a-f0-9]{7,64}$/),
  commitMessage: z.string().trim().min(1).max(500).optional(),
  committedAt: SubmissionDateSchema
})

export const SubmissionProvenanceSchema = z.strictObject({
  resources: z.array(GitRepositoryProvenanceSchema).length(1),
  analyzedAt: SubmissionDateSchema
})

export const SubmissionRefSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('branch'), name: z.string().min(1).max(200) }),
  z.strictObject({ type: z.literal('tag'), name: z.string().min(1).max(200) }),
  z.strictObject({
    type: z.literal('pull-request'),
    number: z.number().int().positive(),
    baseBranch: z.string().min(1).max(200),
    title: z.string().trim().min(1).max(200).optional(),
    url: z.url().optional()
  })
])

export const ProjectSubmissionV4Schema = z.strictObject({
  submissionVersion: z.literal(SUBMISSION_SCHEMA_VERSION),
  target: z.strictObject({
    projectSlug: IdSchema.max(64),
    ref: SubmissionRefSchema.optional()
  }),
  provenance: SubmissionProvenanceSchema,
  report: ProductReportV4Schema
})

export type ProductReportV4 = z.infer<typeof ProductReportV4Schema>
export type ProjectSubmissionV4 = z.infer<typeof ProjectSubmissionV4Schema>
export type ReportDecisionPoint = z.infer<typeof ReportDecisionPointSchema>
export type SubmissionProvenance = z.infer<typeof SubmissionProvenanceSchema>
export type GitRepositoryProvenance = z.infer<typeof GitRepositoryProvenanceSchema>
export type SubmissionRef = z.infer<typeof SubmissionRefSchema>
export type ReportCoverage = z.infer<typeof ReportCoverageSchema>
export type ReportSummary = z.infer<typeof ReportSummarySchema>
export type ReportActor = z.infer<typeof ReportActorSchema>
export type ReportExperience = z.infer<typeof ReportExperienceSchema>
export type ReportDomain = z.infer<typeof ReportDomainSchema>
export type ReportFeature = z.infer<typeof ReportFeatureSchema>
export type ReportJourney = z.infer<typeof ReportJourneySchema>
export type ReportScenario = z.infer<typeof ReportScenarioSchema>
export type ReportBusinessRule = z.infer<typeof ReportBusinessRuleSchema>
export type ReportCodeReference = z.infer<typeof CodeReferenceSchema>
export type ReportEntityLink = z.infer<typeof EntityLinkSchema>

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

/** Cross-entity and computed-field validation shared with Platform fixtures. */
export function validateProductReport(report: ProductReportV4): string[] {
  const issues: string[] = []
  const { model } = report
  const actorIds = new Set(model.actors.map(item => item.id))
  const experienceIds = new Set(model.experiences.map(item => item.id))
  const domainIds = new Set(model.domains.map(item => item.id))
  const featureIds = new Set(model.features.map(item => item.id))
  const journeyIds = new Set(model.journeys.map(item => item.id))
  const scenarioIds = new Set(model.scenarios.map(item => item.id))
  const ruleIds = new Set(model.businessRules.map(item => item.id))
  const kindIds = new Set(model.taxonomies.scenarioKinds.map(item => item.id))

  const collections: Array<[string, string[]]> = [
    ['actors', model.actors.map(item => item.id)],
    ['experiences', model.experiences.map(item => item.id)],
    ['domains', model.domains.map(item => item.id)],
    ['features', model.features.map(item => item.id)],
    ['journeys', model.journeys.map(item => item.id)],
    ['scenarios', model.scenarios.map(item => item.id)],
    ['businessRules', model.businessRules.map(item => item.id)],
    ['scenarioKinds', model.taxonomies.scenarioKinds.map(item => item.id)]
  ]
  for (const [label, ids] of collections) issues.push(...duplicateIssues(label, ids))

  for (const experience of model.experiences) {
    missingRelation(issues, `experience "${experience.id}"`, 'actor', experience.actorIds, actorIds)
  }
  for (const feature of model.features) {
    if (!feature.experienceIds.length) issues.push(`feature "${feature.id}": needs at least one experience`)
    if (!domainIds.has(feature.domainId)) issues.push(`feature "${feature.id}": references missing domain "${feature.domainId}"`)
    missingRelation(issues, `feature "${feature.id}"`, 'actor', feature.actorIds, actorIds)
    missingRelation(issues, `feature "${feature.id}"`, 'experience', feature.experienceIds, experienceIds)
    missingRelation(issues, `feature "${feature.id}"`, 'business rule', feature.businessRuleIds, ruleIds)
  }
  for (const journey of model.journeys) {
    if (!journey.actorIds.length) issues.push(`journey "${journey.id}": needs at least one actor`)
    if (!journey.experienceIds.length) issues.push(`journey "${journey.id}": needs at least one experience`)
    if (!journey.featureIds.length) issues.push(`journey "${journey.id}": needs at least one feature`)
    if (!domainIds.has(journey.domainId)) issues.push(`journey "${journey.id}": references missing domain "${journey.domainId}"`)
    missingRelation(issues, `journey "${journey.id}"`, 'actor', journey.actorIds, actorIds)
    missingRelation(issues, `journey "${journey.id}"`, 'experience', journey.experienceIds, experienceIds)
    missingRelation(issues, `journey "${journey.id}"`, 'feature', journey.featureIds, featureIds)
    if (!model.scenarios.some(scenario => scenario.journeyId === journey.id)) {
      issues.push(`journey "${journey.id}": needs at least one scenario`)
    }
  }
  for (const scenario of model.scenarios) {
    if (!journeyIds.has(scenario.journeyId)) issues.push(`scenario "${scenario.id}": references missing journey "${scenario.journeyId}"`)
    if (!kindIds.has(scenario.kindId)) issues.push(`scenario "${scenario.id}": references missing scenario kind "${scenario.kindId}"`)
    missingRelation(issues, `scenario "${scenario.id}"`, 'business rule', scenario.businessRuleIds, ruleIds)
    for (const decision of scenario.decisionPoints) {
      if (decision.branches.length < 2) issues.push(`scenario "${scenario.id}": decision "${decision.title}" needs at least two branches`)
    }
  }
  for (const rule of model.businessRules) {
    missingRelation(issues, `business rule "${rule.id}"`, 'domain', rule.domainIds, domainIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'feature', rule.featureIds, featureIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'journey', rule.journeyIds, journeyIds)
    missingRelation(issues, `business rule "${rule.id}"`, 'scenario', rule.scenarioIds, scenarioIds)
    if (!rule.domainIds.length && !rule.featureIds.length && !rule.journeyIds.length && !rule.scenarioIds.length) {
      issues.push(`business rule "${rule.id}": must relate to a domain, feature, journey, or scenario`)
    }
  }

  const expectedSummary = {
    actors: model.actors.length,
    experiences: model.experiences.length,
    domains: model.domains.length,
    features: model.features.length,
    journeys: model.journeys.length,
    scenarios: model.scenarios.length,
    businessRules: model.businessRules.length
  }
  const expectedMapped = {
    actors: model.actors.filter(item => item.codeRefs.length > 0).length,
    experiences: model.experiences.filter(item => item.codeRefs.length > 0).length,
    domains: model.domains.filter(item => item.codeRefs.length > 0).length,
    features: model.features.filter(item => item.codeRefs.length > 0).length,
    journeys: model.journeys.filter(item => item.codeRefs.length > 0).length,
    scenarios: model.scenarios.filter(item => item.codeRefs.length > 0).length,
    businessRules: model.businessRules.filter(item => item.codeRefs.length > 0).length
  }
  for (const key of Object.keys(expectedSummary) as Array<keyof typeof expectedSummary>) {
    const value = expectedSummary[key]
    if (report.summary[key] !== value) {
      issues.push(`summary.${key} must equal ${value}`)
    }
    if (
      report.coverage.counts[key] !== undefined
      && report.coverage.counts[key] !== value
    ) {
      issues.push(`coverage.counts.${key} must equal ${value}`)
    }
    const mapped = expectedMapped[key as keyof typeof expectedMapped]
    if (
      report.coverage.mapped[key] !== undefined
      && report.coverage.mapped[key] !== mapped
    ) {
      issues.push(`coverage.mapped.${key} must equal ${mapped}`)
    }
  }

  return issues
}

export function parseProductReport(input: unknown): ProductReportV4 {
  const report = ProductReportV4Schema.parse(input)
  const issues = validateProductReport(report)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return report
}

/**
 * Key-sorted JSON used for report digests. Every consumer that computes or
 * verifies `x-businesslens-report-digest` must use this exact serialization.
 */
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
