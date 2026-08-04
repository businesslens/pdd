/** The Product Report fields used by the shared renderer. */
export interface ProductReportViewInput {
  id: string
  title: string
  summary: string
  description: string
  category: string | null
  authors: Array<{ name: string, url?: string }>
  license: string | null
  intent: string
  limitations?: string[]
  counts: {
    actors: number
    capabilities: number
    journeys: number
    scenarios: number
    businessRules: number
  }
  model: {
    actors: Array<{ id: string, name: string, description: string }>
    capabilities: Array<{ id: string, title: string, description: string }>
    journeys: Array<{ id: string, title: string, summary: string }>
    businessRules: Array<{ id: string, statement: string }>
    scenarios: Array<{ id: string, title: string }>
  }
}

export interface ReportStat {
  key: 'actors' | 'capabilities' | 'journeys' | 'scenarios' | 'rules'
  label: string
  value: number
}

export interface ReportCard {
  id: string
  title: string
  description: string
}

export interface ReportRule {
  id: string
  statement: string
}

export interface ReportScenarioSummary {
  id: string
  title: string
}

export interface ReportViewModel {
  id: string
  title: string
  summary: string
  description: string
  category: string | null
  authors: Array<{ name: string, url?: string }>
  license: string | null
  intent: string | null
  limitations: string[]
  stats: ReportStat[]
  actors: ReportCard[]
  capabilities: ReportCard[]
  journeys: ReportCard[]
  rules: ReportRule[]
  scenarios: ReportScenarioSummary[]
}

/** Render a kebab-case Product category without title-casing conjunctions. */
export function formatReportCategory(category: string): string {
  const label = category.replaceAll('-', ' ')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

/**
 * The stable, host-independent projection rendered by every Product Report UI.
 *
 * Catalog operational metadata deliberately stays out of this shape. The
 * report is the sole source of Product-facing identity and prose; a host may
 * add navigation, actions, or provenance around it without overriding it.
 */
export function projectReportView(report: ProductReportViewInput): ReportViewModel {
  const category = report.category ? formatReportCategory(report.category) : null

  return {
    id: report.id,
    title: report.title,
    summary: report.summary,
    description: report.description,
    category,
    authors: report.authors,
    license: report.license,
    intent: report.intent || null,
    limitations: report.limitations ?? [],
    stats: [
      { key: 'actors', label: 'Actors', value: report.counts.actors },
      { key: 'capabilities', label: 'Capabilities', value: report.counts.capabilities },
      { key: 'journeys', label: 'Journeys', value: report.counts.journeys },
      { key: 'scenarios', label: 'Scenarios', value: report.counts.scenarios },
      { key: 'rules', label: 'Rules', value: report.counts.businessRules }
    ],
    actors: report.model.actors.map(actor => ({
      id: actor.id,
      title: actor.name,
      description: actor.description
    })),
    capabilities: report.model.capabilities.map(capability => ({
      id: capability.id,
      title: capability.title,
      description: capability.description
    })),
    journeys: report.model.journeys.map(journey => ({
      id: journey.id,
      title: journey.title,
      description: journey.summary
    })),
    rules: report.model.businessRules.map(rule => ({
      id: rule.id,
      statement: rule.statement
    })),
    scenarios: report.model.scenarios.map(scenario => ({
      id: scenario.id,
      title: scenario.title
    }))
  }
}
