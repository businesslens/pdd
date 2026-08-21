/**
 * One import path from the lab to the model projection.
 *
 * The variations sit in their own layer, so every one of them would otherwise
 * reach across with the same `../../../report-viewer/app/utils/…` prefix. This
 * is that reach, written once, and it doubles as the list of what an audition
 * is allowed to depend on: the projection and its lookups, never the shipped
 * Workbench's own state.
 */
export type {
  ActorView,
  AnyEntityView,
  AvailabilityPair,
  CapabilityView,
  DomainView,
  EntryPointView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from '../../../report-viewer/app/utils/reportWorkspace'

export {
  ENTITY_KIND_META,
  INTERFACE_TYPE_META,
  REPORT_ENTITY_KINDS,
  counterpartsOf,
  isScenarioKind,
  projectReportWorkspace,
  resolveEntities,
  resolveEntity,
  resolveEntityKey
} from '../../../report-viewer/app/utils/reportWorkspace'

export {
  entitiesOfKind,
  facetKindsFor,
  groupEntities,
  relatedIds
} from '../../../report-viewer/app/utils/entityFacets'

export { entityCardPresentation } from '../../../report-viewer/app/utils/entityCards'
export { docsForEntityKind } from '../../../report-viewer/app/utils/entityDocs'
export { firstSentence } from '../../../report-viewer/app/utils/reportMarkdown'
export { slotColor } from '../../../report-viewer/app/utils/reportPalette'
export { buildProductTopologyGraph } from '../../../report-viewer/app/utils/productTopologyGraphs'
export { filterProductTopologyGraph } from '../../../report-viewer/app/utils/productTopologyFilters'
