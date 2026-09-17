/**
 * `businesslens/report` — strict Product Report v16 contract as a library.
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
  ReportUnmappedAreaSchema,
  ProductReportV16Schema,
  ProductReportSchema,
  validateProductReport,
  validateBlueprintReport,
  parseProductReport,
  projectPortableReport,
  canonicalReportJson
} from './core/portable.js'

export {
  diffReports,
  diffIsEmpty,
  describeValue
} from './core/report-diff.js'

export type { ReferenceFileSnapshot, ReportReferenceFiles } from './core/report-reference-files.js'

export type {
  ChangeKind,
  FieldChange,
  ReportBaseline,
  ReportDiff,
  ResourceChange
} from './core/report-diff.js'

export type {
  ReportCollectionName,
  ProductReportV16,
  ProductReport,
  ReportCoverage,
  ReportUnmappedArea,
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

export type { RepositoryInventory, RepositoryInventoryLoader, CoverageReview, CoverageComparison, CoverageReviewPolicy, CoverageReviewFile, CoverageReviewEntry, CoverageChange } from './core/coverage.js'

export type { RepositoryChange, RepositoryFileChange, RepositoryDiff, RepositoryFileReading, RepositoryFileComparison, RepositoryFileLoader } from './core/repository-diff-types.js'
