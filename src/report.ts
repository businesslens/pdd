/**
 * `businesslens/report` — the Product Report contract as a library.
 *
 * The open framework owns the product-model content contract. Anything that
 * ingests, stores, validates, or serves a Product Report — including
 * BusinessLens Platform — consumes this module instead of re-declaring the
 * schema, so the two sides cannot drift.
 *
 * This entry point depends only on `zod` and stays free of Node built-ins so
 * that browser bundles can import it. The digest lives in
 * `businesslens/report/digest`. It must never import the CLI, its prompts, the
 * filesystem, or any command module.
 */

export {
  REPORT_SCHEMA_VERSION,
  SUBMISSION_SCHEMA_VERSION,

  // Report entities
  CodeReferenceSchema,
  EntityLinkSchema,
  TaxonomyEntrySchema,
  ReportSummarySchema,
  ReportGeneratorSchema,
  ReportActorSchema,
  ReportDomainSchema,
  ReportEntryPointSchema,
  ReportExperienceSchema,
  ReportFeatureSchema,
  ReportJourneySchema,
  ReportDecisionPointSchema,
  ReportScenarioSchema,
  ReportBusinessRuleSchema,
  ReportCoverageSchema,
  ProductReportV4Schema,

  // Publish envelope
  GitRepositoryProvenanceSchema,
  SubmissionProvenanceSchema,
  SubmissionRefSchema,
  ProjectSubmissionV4Schema,

  // Semantics shared across repositories
  validateProductReport,
  parseProductReport,
  redactSourceEvidence,
  canonicalReportJson
} from './core/portable.js'

export type {
  ProductReportV4,
  ProjectSubmissionV4,
  SubmissionProvenance,
  GitRepositoryProvenance,
  SubmissionRef,
  ReportCoverage,
  ReportSummary,
  ReportActor,
  ReportExperience,
  ReportDomain,
  ReportFeature,
  ReportJourney,
  ReportScenario,
  ReportBusinessRule,
  ReportDecisionPoint,
  ReportCodeReference,
  ReportEntityLink
} from './core/portable.js'
