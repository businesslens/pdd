import type { ReportResourceKind } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'

/* Documentation explains a resource kind, never one report instance. Scenario
   containment follows the authored docs: Capability Scenarios live with
   Capabilities, and Journey Scenarios with Journeys. */
const DOCS_SLUG: Record<ReportResourceKind, string> = {
  product: 'product',
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

const DOCUMENTED_AS: Partial<Record<ReportResourceKind, ReportResourceKind>> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

export function docsForResourceKind(kind: ReportResourceKind) {
  const documentedKind = DOCUMENTED_AS[kind] ?? kind
  return {
    url: `https://businesslens.io/docs/${DOCS_SLUG[kind]}`,
    label: `Read ${ENTITY_KIND_META[documentedKind].label} documentation`
  }
}
