import type { ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import { resourceKey } from './reportWorkspace'
import { PRODUCT_TOPOLOGY_VIEWS, DEFAULT_PRODUCT_TOPOLOGY_VIEW } from './productTopologyViews'
import type { ProductTopologyViewId } from './productTopologyViews'

export interface TopologyReading {
  query?: string
  view: ProductTopologyViewId
  journey: string | null
  scenario: string | null
  column: string | null
  focus: string[]
  hiddenKinds: ReportResourceKind[]
  expanded: string[]
  collapsed: string[]
}
export const defaultTopologyReading = (): TopologyReading => ({ query: '', view: DEFAULT_PRODUCT_TOPOLOGY_VIEW, journey: null, scenario: null, column: null, focus: [], hiddenKinds: [], expanded: [], collapsed: [] })
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
    journey: one(query.tj), scenario: one(query.ts), column: one(query.tm),
    focus: many(query.tf), hiddenKinds: many(query.th).filter(kind => kinds.has(kind)) as ReportResourceKind[],
    expanded: many(query.tx), collapsed: many(query.tc)
  }
}

export function topologyToQuery(reading: TopologyReading): Record<string, string | string[] | undefined> {
  return { tq: reading.query || undefined, tv: reading.view === DEFAULT_PRODUCT_TOPOLOGY_VIEW ? undefined : reading.view,
    tj: reading.journey ?? undefined, ts: reading.scenario ?? undefined, tm: reading.column ?? undefined,
    tf: reading.focus.length ? reading.focus : undefined, th: reading.hiddenKinds.length ? reading.hiddenKinds : undefined,
    tx: reading.expanded.length ? reading.expanded : undefined, tc: reading.collapsed.length ? reading.collapsed : undefined }
}

export function sanitizeTopologyReading(reading: TopologyReading, workspace: ReportWorkspace): TopologyReading {
  const view = PRODUCT_TOPOLOGY_VIEWS.find(item => item.id === reading.view) ?? PRODUCT_TOPOLOGY_VIEWS[0]!
  const journey = workspace.journeys.find(item => item.id === reading.journey)
  const scenarios = workspace.scenariosByJourney.get(journey?.id ?? workspace.journeys[0]?.id ?? '') ?? []
  const groups = new Set([...workspace.byKey.keys(), ...[...workspace.byKey.values()].map(resource => `kind:${resource.kind}`)])
  groups.add(resourceKey('product', workspace.identity.id))
  groups.add('unassigned')
  for (const id of [...workspace.domains.map(item => item.key), 'unassigned']) { groups.add(`${id}:capabilities`); groups.add(`${id}:entities`) }
  return { ...reading, view: view.id, journey: journey?.id ?? null,
    scenario: scenarios.some(item => item.id === reading.scenario) ? reading.scenario : null,
    column: reading.column && workspace.byKey.has(reading.column) ? reading.column : null,
    focus: reading.focus.filter(id => workspace.byKey.has(id)),
    hiddenKinds: reading.hiddenKinds.filter(kind => view.kinds.includes(kind)),
    expanded: reading.expanded.filter(id => groups.has(id)),
    collapsed: reading.collapsed.filter(id => groups.has(id) && !reading.expanded.includes(id)) }
}

export function topologyPushesHistory(before: TopologyReading, after: TopologyReading): boolean {
  // Clearing filters or repairing removed IDs must not leave a broken Back entry.
  return before.view !== after.view
    || (['journey', 'scenario', 'column'] as const).some(key => after[key] !== null && before[key] !== after[key])
    || after.focus.some(key => !before.focus.includes(key))
}

export function topologyGroupOpen(reading: TopologyReading, id: string, count: number): boolean {
  return reading.expanded.includes(id) || (!reading.collapsed.includes(id) && count <= 8)
}

export function toggleTopologyGroup(reading: TopologyReading, id: string, open: boolean): TopologyReading {
  return { ...reading, expanded: [...reading.expanded.filter(key => key !== id), ...(open ? [id] : [])],
    collapsed: [...reading.collapsed.filter(key => key !== id), ...(!open ? [id] : [])] }
}
