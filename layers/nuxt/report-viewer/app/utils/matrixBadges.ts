import type { AnyResourceView } from './reportWorkspace'
import type { TopologyMatrixCell } from './topologyProjections'
import type { TopologyAttachment } from './topologyTargets'

export type MatrixBadgeTone = 'neutral' | 'info' | 'violet' | 'creates' | 'changes' | 'removes'
export type MatrixBadgeMode = 'delivery' | 'rules' | 'mutations'
export type RelationshipBadge = { label: string, tone: MatrixBadgeTone } & (
  | { kind: 'delivery', routes: AnyResourceView[] }
  | { kind: 'attachment', attachments: TopologyAttachment[] }
)

/** The badge and its legend share one meaning-to-color mapping. */
export function matrixBadgeTone(label: string, mode: MatrixBadgeMode): MatrixBadgeTone {
  if (mode === 'delivery') return label === 'on screen' ? 'info' : label === 'in experience' ? 'violet' : 'neutral'
  return label === 'creates' || label === 'changes' || label === 'removes' ? label
    : label === 'reads' || label === 'applies here' ? 'info' : 'neutral'
}

/** A badge owns only its matching routes or selectors, never the whole cell. */
export function relationshipBadges(cell: TopologyMatrixCell, mode: 'delivery' | 'rules'): RelationshipBadge[] {
  if (mode === 'delivery') return cell.labels.map(label => ({
    kind: 'delivery', label,
    tone: matrixBadgeTone(label, mode),
    routes: cell.evidence.filter(resource => label === 'on screen' ? resource.kind === 'screen'
      : label === 'in experience' ? resource.kind === 'experience' : false)
  }))
  return cell.labels.map(label => ({
    kind: 'attachment', label,
    tone: matrixBadgeTone(label, mode),
    attachments: (cell.attachments ?? []).filter(attachment => attachment.label === label)
  }))
}
