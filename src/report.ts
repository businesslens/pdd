/**
 * `businesslens/report` — strict Product Report v13 contract as a library.
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
  ReportInterfaceSchema,
  ReportExperienceSchema,
  ReportDomainSchema,
  ReportEntitySchema,
  ReportEntityStateSchema,
  ReportEntityFactSchema,
  ReportEntityRelationSchema,
  ReportCapabilitySchema,
  ReportScreenStateSchema,
  ReportScreenSchema,
  ReportJourneySchema,
  ReportDecisionPointSchema,
  ReportScenarioRouteSchema,
  ReportScenarioStepContextSchema,
  ReportScenarioStepEntitySchema,
  ReportGrantSchema,
  ReportGrantConditionSchema,
  GRANT_OPERATORS,
  STEP_EFFECTS,
  ReportScenarioStepSchema,
  ReportCapabilityScenarioSchema,
  ReportJourneyScenarioSchema,
  ReportBusinessRuleTargetSchema,
  ReportBusinessRuleSchema,
  ReportCoverageSchema,
  ProductReportV13Schema,
  ProductReportSchema,
  validateProductReport,
  validateBlueprintReport,
  parseProductReport,
  projectPortableReport,
  canonicalReportJson
} from './core/portable.js'

export type {
  ProductReportV13,
  ProductReport,
  ReportCoverage,
  ReportCounts,
  ReportAuthor,
  ReportInterface,
  ReportExperience,
  ReportDomain,
  ReportEntity,
  ReportEntityState,
  ReportEntityFact,
  ReportEntityRelation,
  ReportCapability,
  ReportContext,
  ReportScreen,
  ReportScreenState,
  ReportJourney,
  ReportCapabilityScenario,
  ReportScenarioRoute,
  ReportScenarioStepContext,
  ReportScenarioStep,
  ReportScenarioStepEntity,
  ReportGrant,
  ReportGrantCondition,
  ReportJourneyScenario,
  ReportBusinessRule,
  ReportBusinessRuleTarget,
  ReportDecisionPoint,
  ReportReference,
  ReportSupportingSection
} from './core/portable.js'
