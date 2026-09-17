/** Read-only model and repository comparisons supplied by the host. */
import type { ChangeKind, ProductReportV16, ReportBaseline, ReportCollectionName, ReportDiff, ResourceChange, RepositoryDiff } from 'businesslens/report'
import type { ReportResourceKind } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export interface ReportChanges {
  /** Every baseline the host can compare against; empty when it has none yet. */
  baselines: ReportBaseline[]
  /** The chosen baseline's id, or null when there is nothing to choose. */
  baseline: string | null
  target?: string
  baseState?: ReportBaseline | null
  targetState?: ReportBaseline | null
  before?: ProductReportV16 | null
  after?: ProductReportV16 | null
  historyStates?: ReportBaseline[]
  historyLoading?: boolean
  historyMore?: boolean
  historyQuery?: string
  repository?: RepositoryDiff
  modelNotice?: string | null
  initializing?: boolean
  emptyReason?: 'no-saved-model' | 'choose-state' | null
  /** The comparison against the chosen baseline, or null while there is none. */
  diff: ReportDiff | null
  /** Why there is no comparison, when the baseline exists but could not be used. */
  error: string | null
  /** An incomplete file comparison still permits a complete model comparison. */
  referenceFileNotice?: string | null
}

export const COLLECTION_KIND: Record<ReportCollectionName, ReportResourceKind> = {
  interfaces: 'interface',
  experiences: 'experience',
  screens: 'screen',
  domains: 'domain',
  entities: 'entity',
  capabilities: 'capability',
  capabilityScenarios: 'capability-scenario',
  journeys: 'journey',
  journeyScenarios: 'journey-scenario',
  businessRules: 'rule'
}

/** The diff's collections in the order the rail lists their kinds. */
export const CHANGE_COLLECTIONS: ReportCollectionName[] = [
  'entities', 'interfaces', 'experiences', 'screens', 'domains',
  'capabilities', 'capabilityScenarios', 'journeys', 'journeyScenarios', 'businessRules'
]

export const CHANGE_META: Record<ChangeKind, { label: string, icon: string, color: 'success' | 'warning' | 'error' }> = {
  added: { label: 'Added', icon: 'i-lucide-plus', color: 'success' },
  changed: { label: 'Changed', icon: 'i-lucide-pencil', color: 'warning' },
  removed: { label: 'Removed', icon: 'i-lucide-minus', color: 'error' }
}

export function changeKey(change: ResourceChange): string {
  return resourceKey(COLLECTION_KIND[change.collection], change.id)
}

/** Every changed resource by the key the surfaces address resources with. */
export function changesByKey(diff: ReportDiff | null | undefined): Map<string, ResourceChange> {
  const map = new Map<string, ResourceChange>()
  for (const change of diff?.resources ?? []) map.set(changeKey(change), change)
  return map
}

/** How many things the comparison found different, Product included. */
export function changeCount(diff: ReportDiff | null | undefined): number {
  if (!diff) return 0
  return diff.resources.length + (diff.product.length ? 1 : 0)
}

/** The selected Git state, used wherever its contents are read. */
export function baselineTitle(baseline: ReportBaseline): string {
  if (baseline.kind === 'working') return 'Working state'
  if (baseline.kind === 'committed') return 'Last commit'
  return baseline.label
}

export function baselineDetail(baseline: ReportBaseline): string {
  if (baseline.kind === 'working') return 'Current files, including uncommitted edits'
  if (baseline.kind === 'committed') return baseline.available ? baseline.detail : baseline.reason
  return baseline.detail
}

/** "3 added · 1 removed · 5 changed", only the parts that are non-zero. */
export function changeSummary(diff: ReportDiff): string {
  const parts: string[] = []
  if (diff.counts.added) parts.push(`${diff.counts.added} added`)
  if (diff.counts.changed) parts.push(`${diff.counts.changed} changed`)
  if (diff.counts.removed) parts.push(`${diff.counts.removed} removed`)
  if (diff.product.length) parts.push('Product changed')
  return parts.join(' · ')
}
