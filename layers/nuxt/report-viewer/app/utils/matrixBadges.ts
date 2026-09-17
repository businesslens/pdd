import type { AnyResourceView } from './reportWorkspace'
import type { TopologyMatrixCell } from './topologyProjections'
import type { TopologyAttachment } from './topologyTargets'

export type MatrixBadgeTone = 'neutral' | 'info' | 'violet' | 'creates' | 'changes' | 'removes'
export type RelationshipBadge = { label: string, tone: MatrixBadgeTone } & (
  | { kind: 'delivery', routes: AnyResourceView[] }
  | { kind: 'attachment', attachments: TopologyAttachment[] }
)

/** A badge owns only its matching routes or selectors, never the whole cell. */
export function relationshipBadges(cell: TopologyMatrixCell, mode: 'delivery' | 'rules'): RelationshipBadge[] {
  if (mode === 'delivery') return cell.labels.map(label => ({
    kind: 'delivery', label,
    tone: label === 'on screen' ? 'info' : label === 'in experience' ? 'violet' : 'neutral',
    routes: cell.evidence.filter(resource => label === 'on screen' ? resource.kind === 'screen'
      : label === 'in experience' ? resource.kind === 'experience' : false)
  }))
  return cell.labels.map(label => ({
    kind: 'attachment', label,
    tone: label === 'creates' || label === 'changes' || label === 'removes' ? label
      : label === 'reads' || label === 'applies here' ? 'info' : 'neutral',
    attachments: (cell.attachments ?? []).filter(attachment => attachment.label === label)
  }))
}
