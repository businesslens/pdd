/**
 * `businesslens/report` — strict Product Report v6 contract as a library.
 *
 * This entry point depends only on `zod` and stays free of Node built-ins so
 * browser consumers can validate, project, and digest reports consistently.
 */

export {
  REPORT_SCHEMA_VERSION,
  ReportReferenceSchema,
  TaxonomyEntrySchema,
  ReportSummarySchema,
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
  ProductReportV6Schema,
  ProductReportSchema,
  validateProductReport,
  parseProductReport,
  projectPortableReport,
  canonicalReportJson
} from './core/portable.js'

export type {
  ProductReportV6,
  ProductReport,
  ReportCoverage,
  ReportSummary,
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
