import type { ProductReport } from 'businesslens/report'

/** One problem with the authored model, as the CLI serves it. */
export interface LocalIssue {
  severity: 'error' | 'warning'
  message: string
  file?: string
  line?: number
  column?: number
  resource?: string
  incomplete?: boolean
  excerpt?: Array<{ line: number, text: string }>
}

/**
 * Where the local viewer stands: `degraded` shows the current report with
 * errors beside it, `stale` shows the last report that built, and `blocked`
 * has no report to show yet.
 */
export type LocalBuildState = 'waiting' | 'ready' | 'degraded' | 'stale' | 'blocked'

export interface LocalStatus {
  state: LocalBuildState
  revision: number
  issues: LocalIssue[]
  builtAt: number | null
  request: string | null
}

/** The status the CLI last announced; `null` until the first one arrives. */
export function useLocalProblems() {
  return useState<LocalStatus | null>('businesslens-local-problems', () => null)
}

/** Issues grouped under their file, in the order they were reported. */
export function issuesByFile(issues: LocalIssue[]): Array<{ file: string | null, resource?: string, issues: LocalIssue[] }> {
  const groups = new Map<string, { file: string | null, resource?: string, issues: LocalIssue[] }>()
  for (const issue of issues) {
    const key = issue.file ?? ''
    const group = groups.get(key) ?? { file: issue.file ?? null, resource: issue.resource, issues: [] }
    group.issues.push(issue)
    groups.set(key, group)
  }
  return [...groups.values()]
}

const COLLECTIONS: Record<string, keyof ProductReport['model']> = {
  interface: 'interfaces',
  experience: 'experiences',
  screen: 'screens',
  domain: 'domains',
  entity: 'entities',
  capability: 'capabilities',
  journey: 'journeys',
  'capability-scenario': 'capabilityScenarios',
  'journey-scenario': 'journeyScenarios',
  rule: 'businessRules',
  variation: 'variations'
}

/** The title a resource key has in `report`, or `null` when the report does not have it. */
export function resourceTitle(report: ProductReport | null | undefined, key: string | undefined): string | null {
  if (!report || !key) return null
  const separator = key.indexOf(':')
  const collection = COLLECTIONS[key.slice(0, separator)]
  const id = key.slice(separator + 1)
  const items = collection ? report.model[collection] as Array<{ id: string, title?: string, name?: string }> : []
  const item = items.find(candidate => candidate.id === id)
  return item ? item.title ?? item.name ?? item.id : null
}

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`
