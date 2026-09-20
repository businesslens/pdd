import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyMatrix } from '../utils/topologyProjections'
import type { MatrixBadgeMode } from '../utils/matrixBadges'
import { collectionRelation, collectionRelationDrawing } from '../utils/collectionRelations'

export interface MatrixView {
  mode: MatrixBadgeMode
  source: TopologyMatrix
  matrix: TopologyMatrix
  label: string
}

/** Collection scope is independent of drawing, paging and graph focus. */
export function useBlrMatrixView(workspace: MaybeRefOrGetter<ReportWorkspace>, kind: MaybeRefOrGetter<ReportResourceKind>,
  selections: MaybeRefOrGetter<string[]> = []) {
  const relation = computed(() => collectionRelation(toValue(workspace), toValue(kind)))
  return computed<MatrixView | undefined>(() => {
    const current = relation.value
    if (!current) return undefined
    return { ...current, matrix: collectionRelationDrawing(current, toValue(selections)) }
  })
}
