/**
 * `businesslens/report` — strict Product Report v8 contract as a library.
 *
 * This entry point depends only on `zod` and stays free of Node built-ins so
 * browser consumers can validate, project, and digest reports consistently.
 */

export {
  REPORT_SCHEMA_VERSION,
  ReportSupportingSectionSchema,
  ReportReferenceSchema,
  TaxonomyEntrySchema,
  ReportCountsSchema,
  ReportAuthorSchema,
  ReportGeneratorSchema,
  ReportEntryPointSchema,
  ReportAvailabilitySchema,
  ReportExactContextSchema,
  ReportActorSchema,
  ReportInterfaceSchema,
  ReportExperienceSchema,
  ReportDomainSchema,
  ReportCapabilitySchema,
  ReportScreenStateSchema,
  ReportScreenSchema,
  ReportJourneySchema,
  ReportDecisionPointSchema,
  ReportCapabilityScenarioSchema,
  ReportJourneyFlowItemSchema,
  ReportJourneyRouteContextSchema,
  ReportJourneyRouteSchema,
  ReportJourneyScenarioSchema,
  ReportBusinessRuleTargetSchema,
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
  ReportExactContext,
  ReportScreen,
  ReportScreenState,
  ReportJourney,
  ReportCapabilityScenario,
  ReportJourneyFlowItem,
  ReportJourneyRouteContext,
  ReportJourneyRoute,
  ReportJourneyScenario,
  ReportBusinessRule,
  ReportBusinessRuleTarget,
  ReportDecisionPoint,
  ReportReference,
  ReportSupportingSection
} from './core/portable.js'
