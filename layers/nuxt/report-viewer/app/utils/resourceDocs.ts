import type { ReportResourceKind } from './reportWorkspace'
import { ENTITY_KIND_META } from './reportWorkspace'

/** Where the documentation lives. The vocabulary links out to the same pages. */
export const DOCS_ORIGIN = 'https://businesslens.io/docs'

/* Child resources link to their owning documentation's relevant section. */
const DOCS_SLUG: Record<ReportResourceKind, string> = {
  product: 'product',
  interface: 'interfaces',
  experience: 'interfaces#experiences',
  screen: 'interfaces#screens',
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
    url: `${DOCS_ORIGIN}/${DOCS_SLUG[kind]}`,
    label: `Read ${ENTITY_KIND_META[documentedKind].label} documentation`
  }
}
