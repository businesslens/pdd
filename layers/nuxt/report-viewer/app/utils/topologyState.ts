import type { ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'
import { PRODUCT_TOPOLOGY_VIEWS, DEFAULT_PRODUCT_TOPOLOGY_VIEW } from './productTopologyViews'
import type { ProductTopologyViewId } from './productTopologyViews'
import { OCCURRENCE_SEPARATOR } from './topologyProjections'

export interface TopologyReading {
  query?: string
  view: ProductTopologyViewId
  column: string | null
  focus: string[]
  hiddenKinds: ReportResourceKind[]
  expanded: string[]
  collapsed: string[]
}
export const defaultTopologyReading = (): TopologyReading => ({ query: '', view: DEFAULT_PRODUCT_TOPOLOGY_VIEW, column: null, focus: [], hiddenKinds: [], expanded: [], collapsed: [] })
type Query = Record<string, string | null | (string | null)[] | undefined>
const one = (value: Query[string]) => typeof value === 'string' && value ? value : null
const many = (value: Query[string]): string[] => [...new Set((Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string' && !!item))]
const views = new Set<string>(PRODUCT_TOPOLOGY_VIEWS.map(view => view.id))
const kinds = new Set<string>(PRODUCT_TOPOLOGY_VIEWS.flatMap(view => view.kinds))

export function topologyFromQuery(query: Query): TopologyReading {
  const view = one(query.tv)
  return {
    query: one(query.tq) ?? '',
    view: view && views.has(view) ? view as ProductTopologyViewId : DEFAULT_PRODUCT_TOPOLOGY_VIEW,
    column: one(query.tm),
    focus: many(query.tf), hiddenKinds: many(query.th).filter(kind => kinds.has(kind)) as ReportResourceKind[],
    expanded: many(query.tx), collapsed: many(query.tc)
  }
}

export function topologyToQuery(reading: TopologyReading): Record<string, string | string[] | undefined> {
  return { tq: reading.query || undefined, tv: reading.view === DEFAULT_PRODUCT_TOPOLOGY_VIEW ? undefined : reading.view,
    tm: reading.column ?? undefined,
    tf: reading.focus.length ? reading.focus : undefined, th: reading.hiddenKinds.length ? reading.hiddenKinds : undefined,
    tx: reading.expanded.length ? reading.expanded : undefined, tc: reading.collapsed.length ? reading.collapsed : undefined }
}

export function sanitizeTopologyReading(reading: TopologyReading, workspace: ReportWorkspace): TopologyReading {
  const view = PRODUCT_TOPOLOGY_VIEWS.find(item => item.id === reading.view) ?? PRODUCT_TOPOLOGY_VIEWS[0]!
  const groups = new Set([...workspace.byKey.keys(), ...[...workspace.byKey.values()].map(resource => `kind:${resource.kind}`)])
  groups.add(resourceKey('product', workspace.identity.id))
  groups.add('unassigned')
  /* A reach tree draws occurrences: `parent>child`, every segment a key. */
  const known = (id: string) => id.split(OCCURRENCE_SEPARATOR).every(segment => groups.has(segment))
  return { ...reading, view: view.id,
    column: reading.column && workspace.byKey.has(reading.column) ? reading.column : null,
    focus: reading.focus.filter(id => workspace.byKey.has(id)),
    hiddenKinds: reading.hiddenKinds.filter(kind => view.kinds.includes(kind)),
    expanded: reading.expanded.filter(known),
    collapsed: reading.collapsed.filter(id => known(id) && !reading.expanded.includes(id)) }
}

export function topologyPushesHistory(before: TopologyReading, after: TopologyReading): boolean {
  // Clearing filters or repairing removed IDs must not leave a broken Back entry.
  return before.view !== after.view
    || (after.column !== null && before.column !== after.column)
    || after.focus.some(key => !before.focus.includes(key))
}

export function topologyGroupOpen(reading: TopologyReading, id: string, count: number): boolean {
  return reading.expanded.includes(id) || (!reading.collapsed.includes(id) && count <= 8)
}

export function toggleTopologyGroup(reading: TopologyReading, id: string, open: boolean): TopologyReading {
  return { ...reading, expanded: [...reading.expanded.filter(key => key !== id), ...(open ? [id] : [])],
    collapsed: [...reading.collapsed.filter(key => key !== id), ...(!open ? [id] : [])] }
}
