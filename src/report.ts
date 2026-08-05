/**
 * `businesslens/report` — strict Product Report v8 contract as a library.
 *
 * This entry point depends only on `zod` and stays free of Node built-ins so
 * browser consumers can validate, project, and digest reports consistently.
 */

export {
  REPORT_SCHEMA_VERSION,
  ReportReferenceSchema,
  TaxonomyEntrySchema,
  ReportCountsSchema,
  ReportAuthorSchema,
  ReportGeneratorSchema,
  ReportEntryPointSchema,
  ReportAvailabilitySchema,
  ReportActorSchema,
  ReportInterfaceSchema,
  ReportExperienceSchema,
  ReportDomainSchema,
  ReportCapabilitySchema,
  ReportScreenStateSchema,
  ReportScreenSchema,
  ReportJourneySchema,
  ReportDecisionPointSchema,
  ReportScenarioSchema,
  ReportBusinessRuleSchema,
  ReportCoverageSchema,
  ProductReportV8Schema,
  ProductReportSchema,
  validateProductReport,
  validateBlueprintReport,
  parseProductReport,
  projectPortableReport,
  canonicalReportJson
} from './core/portable.js'

export type {
  ProductReportV8,
  ProductReport,
  ReportCoverage,
  ReportCounts,
  ReportAuthor,
  ReportActor,
  ReportInterface,
  ReportExperience,
  ReportDomain,
  ReportCapability,
  ReportAvailability,
  ReportScreen,
  ReportScreenState,
  ReportJourney,
  ReportScenario,
  ReportBusinessRule,
  ReportDecisionPoint,
  ReportReference
} from './core/portable.js'
