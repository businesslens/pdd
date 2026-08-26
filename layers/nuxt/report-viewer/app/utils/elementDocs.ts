import type { ReportElementKind } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'

/* Documentation explains an element kind, never one report instance. Scenario
   containment follows the authored docs: Capability Scenarios live with
   Capabilities, and Journey Scenarios with Journeys. */
const DOCS_SLUG: Record<ReportElementKind, string> = {
  product: 'product',
  actor: 'actors',
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  domain: 'domains',
  entity: 'entities',
  capability: 'capabilities',
  journey: 'journeys',
  'capability-scenario': 'capabilities',
  'journey-scenario': 'journeys',
  rule: 'business-rules'
}

const DOCUMENTED_AS: Partial<Record<ReportElementKind, ReportElementKind>> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

export function docsForElementKind(kind: ReportElementKind) {
  const documentedKind = DOCUMENTED_AS[kind] ?? kind
  return {
    url: `https://businesslens.io/docs/${DOCS_SLUG[kind]}`,
    label: `Read ${ENTITY_KIND_META[documentedKind].label} documentation`
  }
}
