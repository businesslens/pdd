import type { ReportEntityKind } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'

/* Documentation explains an entity kind, never one report instance. Scenario
   containment follows the authored docs: Capability Scenarios live with
   Capabilities, and Journey Scenarios with Journeys. */
const DOCS_SLUG: Record<ReportEntityKind, string> = {
  product: 'product',
  actor: 'actors',
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  domain: 'domains',
  object: 'objects',
  capability: 'capabilities',
  journey: 'journeys',
  'capability-scenario': 'capabilities',
  'journey-scenario': 'journeys',
  rule: 'business-rules'
}

const DOCUMENTED_AS: Partial<Record<ReportEntityKind, ReportEntityKind>> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

export function docsForEntityKind(kind: ReportEntityKind) {
  const documentedKind = DOCUMENTED_AS[kind] ?? kind
  return {
    url: `https://businesslens.io/docs/${DOCS_SLUG[kind]}`,
    label: `Read ${ENTITY_KIND_META[documentedKind].label} documentation`
  }
}
