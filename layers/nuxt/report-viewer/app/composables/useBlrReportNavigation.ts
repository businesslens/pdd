import { destinationForSection, destinationForLocation } from '../utils/reportDestinations'
import { defaultTopologyReading, topologyFromQuery, topologyPushesHistory, topologyToQuery } from '../utils/topologyState'

/** One gesture, one history entry, shared by the CLI and catalog hosts. */
export function useBlrReportNavigation(options: { sectionKey?: string, tabKey?: string } = {}) {
  const route = useRoute()
  const router = useRouter()
  const sectionKey = options.sectionKey ?? 's'
  const tabKey = options.tabKey ?? 't'
  const section = ref('overview')
  const resource = ref<string | null>(null)
  const tab = ref('overview')
  const scenarioRoute = ref<string | null>(null)
  const routeColumns = ref('auto')
  const topology = ref(defaultTopologyReading())
  const one = (key: string) => typeof route.query[key] === 'string' && route.query[key] ? route.query[key] as string : null
  const read = () => ({ section: one(sectionKey) ?? 'overview', resource: one('e'), tab: one(tabKey) ?? 'overview',
    scenarioRoute: one('r'), routeColumns: one('rc') ?? 'auto',
    topology: { ...topologyFromQuery(route.query), view: (destinationForLocation(one(sectionKey) ?? 'overview', one(tabKey) ?? 'overview', one('e')) ?? destinationForSection(one(sectionKey) ?? ''))?.view ?? topologyFromQuery(route.query).view } })
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  watch(() => route.query, () => {
    const next = read()
    section.value = next.section
    resource.value = next.resource
    tab.value = next.tab
    scenarioRoute.value = next.scenarioRoute
    routeColumns.value = next.routeColumns
    if (!same(topology.value, next.topology)) topology.value = next.topology
  }, { immediate: true })
  watch([section, resource, tab, scenarioRoute, routeColumns, topology], () => {
    const before = read()
    const next = { section: section.value, resource: resource.value, tab: tab.value, scenarioRoute: scenarioRoute.value, routeColumns: routeColumns.value, topology: topology.value }
    const push = !destinationForSection(before.section) && (before.section !== next.section || before.resource !== next.resource || before.tab !== next.tab || before.scenarioRoute !== next.scenarioRoute || before.routeColumns !== next.routeColumns || topologyPushesHistory(before.topology, next.topology))
    const query = { ...route.query, [sectionKey]: next.section === 'overview' ? undefined : next.section,
      e: next.resource ?? undefined, [tabKey]: next.tab === 'overview' ? undefined : next.tab,
      r: next.scenarioRoute ?? undefined, rc: next.routeColumns === 'auto' ? undefined : next.routeColumns,
      ...topologyToQuery(next.topology), tv: destinationForLocation(next.section, next.tab, next.resource) ? undefined : topologyToQuery(next.topology).tv }
    if (same(before, next) && router.resolve({ query }).fullPath === route.fullPath) return
    void router[push ? 'push' : 'replace']({ query })
  }, { flush: 'post', deep: true, immediate: true })
  return { section, resource, tab, scenarioRoute, routeColumns, topology }
}
