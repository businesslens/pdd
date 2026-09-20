/** Read-only model and repository comparisons supplied by the host. */
import type { ChangeKind, ProductReportV16, ReportBaseline, ReportCollectionName, ReportDiff, ResourceChange, RepositoryDiff } from 'businesslens/report'
import type { ReportResourceKind } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export interface ReportChanges {
  mode?: 'uncommitted' | 'compare'
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

/** The selected Git state, used wherever its contents are read. */
export function baselineTitle(baseline: ReportBaseline): string {
  if (baseline.kind === 'empty') return 'Before first commit'
  if (baseline.kind === 'working') return 'Working state'
  if (baseline.kind === 'committed') return 'Last commit'
  return baseline.label
}

export function baselineDetail(baseline: ReportBaseline): string {
  if (baseline.kind === 'empty') return 'An empty model and repository'
  if (baseline.kind === 'working') return 'Current files, including uncommitted edits'
  if (baseline.kind === 'committed') return baseline.available ? baseline.detail : baseline.reason
  return baseline.detail
}
