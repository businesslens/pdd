import type { ReportResourceKind } from './reportWorkspace'
import type { ColumnChoice } from '../composables/useColumns'

export type CollectionDrawing = 'rows' | 'graph' | 'matrix'
export interface CollectionControlsProps {
  kind: ReportResourceKind
  drawing: CollectionDrawing
  columns: ColumnChoice
  expandsAnything: boolean
}
