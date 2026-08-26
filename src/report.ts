/**
 * `businesslens/report` — strict Product Report v10 contract as a library.
 *
 * This entry point depends only on `zod` and stays free of Node built-ins so
 * browser consumers can validate, project, and digest reports consistently.
 */

export {
  INTERFACE_TYPES,
} from './core/interface-types.js'

export type {
  InterfaceType,
} from './core/interface-types.js'

export {
  REPORT_SCHEMA_VERSION,
  ReportSupportingSectionSchema,
  ReportReferenceSchema,
  TaxonomyEntrySchema,
  ReportCountsSchema,
  ReportAuthorSchema,
  ReportGeneratorSchema,
  ReportEntryPointSchema,
  ReportContextSchema,
  ReportActorSchema,
  ReportInterfaceSchema,
  ReportExperienceSchema,
  ReportDomainSchema,
  ReportEntitySchema,
  ReportEntityStateSchema,
  ReportEntityTransitionSchema,
  ReportCapabilitySchema,
  ReportScreenStateSchema,
  ReportScreenSchema,
  ReportJourneySchema,
  ReportDecisionPointSchema,
  ReportScenarioRouteSchema,
  ReportScenarioStepContextSchema,
  ReportScenarioStepSchema,
  ReportCapabilityScenarioSchema,
  ReportJourneyScenarioSchema,
  ReportBusinessRuleTargetSchema,
  ReportBusinessRuleSchema,
  ReportCoverageSchema,
  ProductReportV11Schema,
  ProductReportSchema,
  validateProductReport,
  validateBlueprintReport,
  parseProductReport,
  projectPortableReport,
  canonicalReportJson
} from './core/portable.js'

export type {
  ProductReportV11,
  ProductReport,
  ReportCoverage,
  ReportCounts,
  ReportAuthor,
  ReportActor,
  ReportInterface,
  ReportExperience,
  ReportDomain,
  ReportEntity,
  ReportEntityState,
  ReportEntityTransition,
  ReportCapability,
  ReportContext,
  ReportScreen,
  ReportScreenState,
  ReportJourney,
  ReportCapabilityScenario,
  ReportScenarioRoute,
  ReportScenarioStepContext,
  ReportScenarioStep,
  ReportJourneyScenario,
  ReportBusinessRule,
  ReportBusinessRuleTarget,
  ReportDecisionPoint,
  ReportReference,
  ReportSupportingSection
} from './core/portable.js'
