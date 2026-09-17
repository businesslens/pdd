import type { TopologyReading } from './topologyState'
import type { TopologyMatrix } from './topologyProjections'
import type { ReportResourceKind } from './reportWorkspace'

/** Keep selections on the matrix's actual axes, including after report edits. */
export function sanitizeMatrixReading(reading: TopologyReading, source: TopologyMatrix): TopologyReading {
  const kinds = new Set<ReportResourceKind>(source.columns.map(resource => resource.kind))
  const hiddenKinds = reading.view === 'rule-attachments' ? reading.hiddenKinds.filter(kind => kinds.has(kind)) : []
  const columns = source.columns.filter(resource => !hiddenKinds.includes(resource.kind))
  const keys = new Set([...source.rows, ...columns].map(resource => resource.key))
  const focus = reading.focus.filter(key => keys.has(key))
  const selectedColumns = columns.filter(resource => focus.includes(resource.key))
  const visibleColumns = selectedColumns.length ? selectedColumns : columns
  return { ...reading, focus, hiddenKinds,
    column: visibleColumns.some(resource => resource.key === reading.column) ? reading.column : null }
}
