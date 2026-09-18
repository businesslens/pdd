import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import type { TopologyMatrix } from '../utils/topologyProjections'
import type { MatrixBadgeMode } from '../utils/matrixBadges'
import { deliveryMatrixProjection, mutationProjection, ruleAttachmentsProjection } from '../utils/topologyProjections'
import { sanitizeMatrixReading } from '../utils/matrixFilters'

export interface MatrixView {
  mode: MatrixBadgeMode
  source: TopologyMatrix
  matrix: TopologyMatrix
}

/** Keep the projection stable while independently narrowing its two axes. */
export function useBlrMatrixView(workspace: MaybeRefOrGetter<ReportWorkspace>, reading: MaybeRefOrGetter<TopologyReading>) {
  const mode = computed<MatrixBadgeMode>(() => toValue(reading).view === 'rule-attachments' ? 'rules'
    : toValue(reading).view === 'delivery-by-interface' ? 'delivery' : 'mutations')
  const base = computed(() => mode.value === 'rules' ? ruleAttachmentsProjection(toValue(workspace))
    : mode.value === 'delivery' ? deliveryMatrixProjection(toValue(workspace)) : mutationProjection(toValue(workspace)))
  // Paging changes the reading object, but must not rebuild cells or evidence.
  const scope = computed<Pick<TopologyReading, 'focus' | 'hiddenKinds'>>(previous => {
    const { focus, hiddenKinds } = sanitizeMatrixReading(toValue(reading), base.value)
    if (previous && JSON.stringify([focus, hiddenKinds]) === JSON.stringify([previous.focus, previous.hiddenKinds])) return previous
    return { focus, hiddenKinds }
  })
  return computed<MatrixView>(() => {
    const { focus, hiddenKinds } = scope.value
    const selectedRows = new Set(base.value.rows.filter(item => focus.includes(item.key)))
    const selectedColumns = new Set(base.value.columns.filter(item => focus.includes(item.key)))
    const rows = base.value.rows.filter(item => !selectedRows.size || selectedRows.has(item))
    const columns = base.value.columns.filter(item => !hiddenKinds.includes(item.kind) && (!selectedColumns.size || selectedColumns.has(item)))
    const rowKeys = new Set(rows.map(row => row.key))
    const columnKeys = new Set(columns.map(column => column.key))
    return { mode: mode.value, source: base.value, matrix: { rows, columns, cells: base.value.cells.filter(cell => rowKeys.has(cell.row) && columnKeys.has(cell.column)) } }
  })
}
