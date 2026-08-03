import * as z from 'zod'

export const REPORT_SCHEMA_VERSION = '5.0.0'
export const LEGACY_REPORT_SCHEMA_VERSION = '4.0.0'
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
  rel: z.enum(['spec', 'proposal', 'doc', 'adr', 'visual', 'research']),
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

const ReportEntityCountV4Shape = {
  actors: z.number().int().min(0),
  experiences: z.number().int().min(0),
  domains: z.number().int().min(0),
  features: z.number().int().min(0),
  journeys: z.number().int().min(0),
  scenarios: z.number().int().min(0),
  businessRules: z.number().int().min(0)
}

const ReportSummaryV4Schema = z.strictObject(ReportEntityCountV4Shape)

const ReportEntityCountShape = {
  actors: z.number().int().min(0),
  experiences: z.number().int().min(0),
  screens: z.number().int().min(0),
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

export const ReportScreenStateSchema = z.strictObject({
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema
})

export const ReportScreenSchema = z.strictObject({
  id: IdSchema,
  title: SingleLineTextSchema,
  description: RequiredMarkdownFragmentSchema,
  experienceIds: z.array(IdSchema).min(1),
  featureIds: z.array(IdSchema).min(1),
  scenarioIds: z.array(IdSchema),
  entryPoints: z.array(ReportEntryPointSchema),
  information: z.array(SingleLineTextSchema).min(1),
  actions: z.array(SingleLineTextSchema),
  states: z.array(ReportScreenStateSchema),
  capabilities: RequiredMarkdownFragmentSchema,
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
  rationale: z.string(),
  // Set only by `redactSourceEvidence`. Marks a report whose `codeRefs` were
  // removed for delivery, so `mapped` describes the origin repository rather
  // than the evidence still present in this document.
  evidenceRedacted: z.boolean().optional()
})

export const ProductReportV4Schema = z.strictObject({
  schemaVersion: z.literal(LEGACY_REPORT_SCHEMA_VERSION),
  id: ProductIdSchema,
  title: SingleLineTextSchema.max(160),
  description: RequiredMarkdownFragmentSchema.max(2000),
  intent: z.string(),
  supportingContent: z.string(),
  links: z.array(EntityLinkSchema),
  tags: z.array(z.string().min(1).max(48)).max(24),
  generatedAt: z.iso.date(),
  generator: ReportGeneratorSchema,
  summary: ReportSummaryV4Schema,
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

export const ProductReportV5Schema = z.strictObject({
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
    screens: z.array(ReportScreenSchema),
    domains: z.array(ReportDomainSchema),
    features: z.array(ReportFeatureSchema),
    journeys: z.array(ReportJourneySchema),
    scenarios: z.array(ReportScenarioSchema),
    businessRules: z.array(ReportBusinessRuleSchema)
  }),
  coverage: ReportCoverageSchema
})

export const ProductReportSchema = z.union([ProductReportV5Schema, ProductReportV4Schema])

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
export type ProductReportV5 = z.infer<typeof ProductReportV5Schema>
export type ProductReport = ProductReportV5
export type ProjectSubmissionV4 = z.infer<typeof ProjectSubmissionV4Schema>
export type ReportDecisionPoint = z.infer<typeof ReportDecisionPointSchema>
export type ReportScreenState = z.infer<typeof ReportScreenStateSchema>
export type SubmissionProvenance = z.infer<typeof SubmissionProvenanceSchema>
export type GitRepositoryProvenance = z.infer<typeof GitRepositoryProvenanceSchema>
export type SubmissionRef = z.infer<typeof SubmissionRefSchema>
export type ReportCoverage = z.infer<typeof ReportCoverageSchema>
export type ReportSummary = z.infer<typeof ReportSummarySchema>
export type ReportActor = z.infer<typeof ReportActorSchema>
export type ReportExperience = z.infer<typeof ReportExperienceSchema>
export type ReportDomain = z.infer<typeof ReportDomainSchema>
export type ReportFeature = z.infer<typeof ReportFeatureSchema>
export type ReportScreen = z.infer<typeof ReportScreenSchema>
export type ReportJourney = z.infer<typeof ReportJourneySchema>
export type ReportScenario = z.infer<typeof ReportScenarioSchema>
export type ReportBusinessRule = z.infer<typeof ReportBusinessRuleSchema>
export type ReportCodeReference = z.infer<typeof CodeReferenceSchema>
export type ReportEntityLink = z.infer<typeof EntityLinkSchema>

/** Normalize a historical v4 report into the current in-memory v5 shape. */
export function upgradeProductReportV4(report: ProductReportV4): ProductReportV5 {
  return ProductReportV5Schema.parse({
    ...report,
    schemaVersion: REPORT_SCHEMA_VERSION,
    summary: { ...report.summary, screens: 0 },
    model: { ...report.model, screens: [] },
    coverage: {
      ...report.coverage,
      counts: { ...report.coverage.counts, screens: 0 },
      mapped: { ...report.coverage.mapped, screens: 0 }
    }
  })
}

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

/** Cross-entity and computed-field validation, shared with the catalog. */
export function validateProductReport(report: ProductReportV4 | ProductReportV5): string[] {
  if (report.schemaVersion === LEGACY_REPORT_SCHEMA_VERSION) {
    return validateProductReport(upgradeProductReportV4(report))
  }
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
    ['screens', model.screens.map(item => item.id)],
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
  for (const screen of model.screens) {
    missingRelation(issues, `screen "${screen.id}"`, 'experience', screen.experienceIds, experienceIds)
    missingRelation(issues, `screen "${screen.id}"`, 'feature', screen.featureIds, featureIds)
    missingRelation(issues, `screen "${screen.id}"`, 'scenario', screen.scenarioIds, scenarioIds)
    const stateTitles = new Set<string>()
    for (const state of screen.states) {
      const normalized = state.title.toLowerCase()
      if (stateTitles.has(normalized)) issues.push(`screen "${screen.id}": duplicate product state "${state.title}"`)
      stateTitles.add(normalized)
    }
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
    screens: model.screens.length,
    domains: model.domains.length,
    features: model.features.length,
    journeys: model.journeys.length,
    scenarios: model.scenarios.length,
    businessRules: model.businessRules.length
  }
  const expectedMapped = {
    actors: model.actors.filter(item => item.codeRefs.length > 0).length,
    experiences: model.experiences.filter(item => item.codeRefs.length > 0).length,
    screens: model.screens.filter(item => item.codeRefs.length > 0).length,
    domains: model.domains.filter(item => item.codeRefs.length > 0).length,
    features: model.features.filter(item => item.codeRefs.length > 0).length,
    journeys: model.journeys.filter(item => item.codeRefs.length > 0).length,
    scenarios: model.scenarios.filter(item => item.codeRefs.length > 0).length,
    businessRules: model.businessRules.filter(item => item.codeRefs.length > 0).length
  }
  // A redacted report carries no `codeRefs`, so `mapped` describes the origin
  // repository and can no longer be recomputed from this document. It stays
  // bounded by the entity counts instead.
  const redacted = report.coverage.evidenceRedacted === true
  if (redacted) {
    const carriers = Object.values(expectedMapped).reduce((total, count) => total + count, 0)
    if (carriers > 0) {
      issues.push('coverage.evidenceRedacted is true but entities still carry codeRefs')
    }
    if (report.coverage.sourceAreas.length) {
      issues.push('coverage.evidenceRedacted is true but coverage.sourceAreas names repository areas')
    }
    const entryPointHosts = [...model.experiences, ...model.screens, ...model.journeys]
    for (const host of entryPointHosts) {
      for (const point of host.entryPoints) {
        if (isRepositoryEntryPoint(point.path)) {
          issues.push(`"${host.id}": redacted report still exposes the repository entry point "${point.path}"`)
        }
      }
    }
    const linkHosts = [
      { id: 'product', links: report.links },
      ...model.actors, ...model.experiences, ...model.domains,
      ...model.screens, ...model.features, ...model.journeys, ...model.scenarios, ...model.businessRules
    ]
    for (const host of linkHosts) {
      for (const link of host.links) {
        if (isRepositoryLink(link.href)) {
          issues.push(`"${host.id}": redacted report still exposes the repository link "${link.href}"`)
        }
      }
    }
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
    const declaredMapped = report.coverage.mapped[key]
    if (declaredMapped === undefined) continue
    if (redacted) {
      if (declaredMapped > value) {
        issues.push(`coverage.mapped.${key} must be at most ${value}`)
      }
    } else if (declaredMapped !== expectedMapped[key]) {
      issues.push(`coverage.mapped.${key} must equal ${expectedMapped[key]}`)
    }
  }

  return issues
}

/**
 * Local filesystem values that must not leave the owning workspace.
 *
 * The report contract is browser-portable, so this deliberately avoids Node
 * path helpers. It recognizes Windows separators and drive/UNC paths, local
 * file URLs, and standard POSIX filesystem roots. Rooted product routes are
 * handled separately because `/checkout` is meaningful outside a repository.
 */
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

function isRepositoryLink(value: string): boolean {
  const href = value.trim()
  return isAbsoluteFilesystemPath(href) || !isHttpUrl(href)
}

/**
 * Remove source evidence for delivery.
 *
 * An authored Product Model keeps full evidence inside its own repository, but
 * a downloadable or public Blueprint report must not disclose the origin
 * repository's layout, file paths, or symbol names. Every consumer that serves
 * a report outside its own repository applies this exact projection, so the
 * redaction cannot drift between the framework and the catalog.
 *
 * Redacted, because each is structurally a repository reference:
 * `codeRefs`, `entryPoints` that name a repository path, `links` to
 * repository-relative documents, and `coverage.sourceAreas`.
 *
 * Not redacted: author-written prose (`method`, `unmapped`, `limitations`,
 * `rationale`, `intent`, `supportingContent`). Those carry product meaning and
 * are the author's to control — authors must keep repository internals out of
 * them.
 *
 * `coverage.mapped` is preserved for Product Report compatibility: it
 * counts entities that carried implementation-linked bookmarks upstream.
 * It is navigation metadata, not proof or model completeness. `evidenceRedacted`
 * records that those counts can no longer be recomputed from the document.
 * The projection is idempotent and does not mutate its input.
 */
export function redactSourceEvidence(report: ProductReportV4 | ProductReportV5): ProductReportV5 {
  const normalized = report.schemaVersion === LEGACY_REPORT_SCHEMA_VERSION
    ? upgradeProductReportV4(report)
    : report
  const publicLinks = <T extends { href: string }>(items: T[]): T[] =>
    items.filter(link => !isRepositoryLink(link.href))
  const publicEntryPoints = <T extends { path: string }>(items: T[]): T[] =>
    items.filter(point => !isRepositoryEntryPoint(point.path))

  const strip = <T extends { codeRefs: unknown[], links: Array<{ href: string }> }>(items: T[]): T[] =>
    items.map(item => ({ ...item, codeRefs: [], links: publicLinks(item.links) }))
  const stripWithEntryPoints = <
    T extends { codeRefs: unknown[], links: Array<{ href: string }>, entryPoints: Array<{ path: string }> }
  >(items: T[]): T[] =>
    items.map(item => ({
      ...item,
      codeRefs: [],
      links: publicLinks(item.links),
      entryPoints: publicEntryPoints(item.entryPoints)
    }))

  return {
    ...normalized,
    links: publicLinks(normalized.links),
    model: {
      ...normalized.model,
      actors: strip(normalized.model.actors),
      experiences: stripWithEntryPoints(normalized.model.experiences),
      screens: stripWithEntryPoints(normalized.model.screens),
      domains: strip(normalized.model.domains),
      features: strip(normalized.model.features),
      journeys: stripWithEntryPoints(normalized.model.journeys),
      scenarios: strip(normalized.model.scenarios),
      businessRules: strip(normalized.model.businessRules)
    },
    coverage: { ...normalized.coverage, sourceAreas: [], evidenceRedacted: true }
  }
}

export function parseProductReport(input: unknown): ProductReportV5 {
  const parsed = ProductReportSchema.parse(input)
  const report = parsed.schemaVersion === LEGACY_REPORT_SCHEMA_VERSION
    ? upgradeProductReportV4(parsed)
    : parsed
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
