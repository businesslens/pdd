/**
 * What changed, as the report draws it.
 *
 * The host that has a comparison — the local viewer, with its checkpoints and
 * its committed model — hands one in; a host that has none, like the catalog,
 * passes nothing and the report shows no trace of the feature. The diff itself
 * is computed by the CLI; this module only keys it the way the surfaces do.
 */
import type { ChangeKind, ReportBaseline, ReportCollectionName, ReportDiff, ResourceChange } from 'businesslens/report'
import type { ReportResourceKind } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'

export interface ReportChanges {
  /** Every baseline the host can compare against; empty when it has none yet. */
  baselines: ReportBaseline[]
  /** The chosen baseline's id, or null when there is nothing to choose. */
  baseline: string | null
  /** The comparison against the chosen baseline, or null while there is none. */
  diff: ReportDiff | null
  /** Why there is no comparison, when the baseline exists but could not be used. */
  error: string | null
  /** An incomplete file comparison still permits a complete model comparison. */
  referenceFileNotice?: string | null
  /** Whether the host can seal the current state as a checkpoint. */
  pinnable: boolean
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

const SOURCE_LABEL = { checkpoint: 'Checkpoint', pin: 'Pinned' } as const

export function formatCheckpointTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return sameDay ? time : `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`
}

/** The name a baseline wears in the picker and in every "since" phrase. */
export function baselineTitle(baseline: ReportBaseline): string {
  if (baseline.kind === 'committed') return 'Last commit'
  return baseline.label ?? `${SOURCE_LABEL[baseline.source]} ${formatCheckpointTime(baseline.at)}`
}

/**
 * The second line under a baseline: what the first line left out. A labelled
 * checkpoint adds who sealed it and when; an unlabelled one, whose name is
 * already its source and time, adds the full date.
 */
export function baselineDetail(baseline: ReportBaseline): string {
  if (baseline.kind === 'committed') return baseline.available ? baseline.detail : baseline.reason
  if (baseline.label) return `${SOURCE_LABEL[baseline.source]} · ${formatCheckpointTime(baseline.at)}`
  const date = new Date(baseline.at)
  return Number.isNaN(date.getTime()) ? baseline.at : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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

/** The default comparison: the newest checkpoint, else the last commit, else nothing. */
export function defaultBaseline(baselines: ReportBaseline[]): string | null {
  const checkpoint = baselines.find(item => item.kind === 'checkpoint')
  if (checkpoint) return checkpoint.id
  const committed = baselines.find(item => item.kind === 'committed' && item.available)
  return committed?.id ?? null
}
