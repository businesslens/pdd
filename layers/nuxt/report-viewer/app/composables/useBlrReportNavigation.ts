import { defaultCoverageReading, coverageFromQuery, coverageToQuery } from '../utils/coverageState'
import { resourceNavigationKey, resourceTrail, nextResourceTrail, type ResourceVisit } from '../utils/resourceNavigation'
import { referenceNavigationKey, referenceTrail, localReferenceHref, type ReferenceNavigation } from '../utils/referenceNavigation'
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
  const resourceState = ref('working')
  const tab = ref('overview')
  const resourceTab = ref('overview')
  const reference = ref<string | null>(null)
  const previousReference = ref<string | null>(null)
  const previous = ref<ResourceVisit | null>(null)
  const scenarioRoute = ref<string | null>(null)
  const routeColumns = ref('auto')
  const coverage = ref(defaultCoverageReading())
  const reviewPath = ref<string | null>(null)
  const reviewTab = ref('')
  const topology = ref(defaultTopologyReading())
  const one = (key: string) => typeof route.query[key] === 'string' && route.query[key] ? route.query[key] as string : null
  const baseSection = () => one(sectionKey) ?? (one('e') ? collectionForKey(one('e')!) : 'overview')
  const read = () => ({ coverage: coverageFromQuery(route.query), reviewPath: one('rp'), reviewTab: one('rv') ?? '', section: baseSection(), resource: one('e'), tab: one(tabKey) ?? 'overview', resourceTab: one('rt') ?? 'overview',
    resourceState: one('v') ?? (one('f') ? new URL(one('f')!, 'http://businesslens.local').searchParams.get('state') : null) ?? 'working',
    reference: localReferenceHref(one('f')), scenarioRoute: one('r'), routeColumns: one('rc') ?? 'auto',
    topology: { ...topologyFromQuery(route.query), view: (destinationForLocation(baseSection(), one(tabKey) ?? 'overview') ?? destinationForSection(one(sectionKey) ?? ''))?.view ?? topologyFromQuery(route.query).view } })
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  watch(() => route.query, () => {
    const next = read()
    section.value = next.section
    reviewPath.value = next.reviewPath
    reviewTab.value = next.reviewTab
    if (!same(coverage.value, next.coverage)) coverage.value = next.coverage
    resource.value = next.resource
    resourceState.value = next.resourceState
    tab.value = next.tab
    resourceTab.value = next.resourceTab
    reference.value = next.reference
    previousReference.value = import.meta.client ? referenceTrail(window.history.state?.blrReferenceTrail).at(-1)?.href ?? null : null
    previous.value = import.meta.client ? resourceTrail(window.history.state?.blrResourceTrail).at(-1) ?? null : null
    scenarioRoute.value = next.scenarioRoute
    routeColumns.value = next.routeColumns
    if (!same(topology.value, next.topology)) topology.value = next.topology
  }, { immediate: true })
  watch([section, resource, resourceState, tab, resourceTab, reference, scenarioRoute, routeColumns, topology, coverage, reviewPath, reviewTab], () => {
    const before = read()
    const next = { coverage: coverage.value, reviewPath: reviewPath.value, reviewTab: reviewTab.value, section: section.value, resource: resource.value, resourceState: resourceState.value, tab: tab.value, resourceTab: resourceTab.value, reference: reference.value, scenarioRoute: scenarioRoute.value, routeColumns: routeColumns.value, topology: topology.value }
    const push = !same(before.coverage, next.coverage) || before.reviewPath !== next.reviewPath || before.reviewTab !== next.reviewTab || before.resourceState !== next.resourceState || before.section !== next.section || before.resource !== next.resource || before.tab !== next.tab || before.resourceTab !== next.resourceTab || before.reference !== next.reference || before.scenarioRoute !== next.scenarioRoute || before.routeColumns !== next.routeColumns || topologyPushesHistory(before.topology, next.topology)
    const query = { ...route.query, ...coverageToQuery(next.coverage), rp: next.reviewPath ?? undefined, rv: next.reviewPath && next.reviewTab ? next.reviewTab : undefined, [sectionKey]: next.section === 'overview' && !next.resource ? undefined : next.section,
      e: next.resource ?? undefined, v: (next.resource || next.reference) && next.resourceState !== 'working' ? next.resourceState : undefined, [tabKey]: next.tab === 'overview' ? undefined : next.tab,
      rt: next.resource && next.resourceTab !== 'overview' ? next.resourceTab : undefined,
      f: next.reference ?? undefined,
      r: next.scenarioRoute ?? undefined, rc: next.routeColumns === 'auto' ? undefined : next.routeColumns,
      ...topologyToQuery(next.topology), tv: destinationForLocation(next.section, next.tab) ? undefined : topologyToQuery(next.topology).tv }
    if (same(before, next) && router.resolve({ query }).fullPath === route.fullPath) return
    const history = import.meta.client ? window.history.state : null
    const trail = nextResourceTrail(resourceTrail(history?.blrResourceTrail),
      before.resource ? { resource: before.resource, tab: before.resourceTab, state: before.resourceState, position: history?.position ?? 0 } : null,
      next.resource, before.section === next.section && before.tab === next.tab, next.resourceState)
    const sameReading = before.section === next.section && before.tab === next.tab && before.resourceState === next.resourceState && before.resource === next.resource && before.resourceTab === next.resourceTab
    const files = next.reference && sameReading ? referenceTrail(history?.blrReferenceTrail) : []
    if (next.reference && before.reference !== next.reference) files.push({ href: sameReading ? before.reference : null, position: history?.position ?? 0 })
    void router[push ? 'push' : 'replace']({ query, state: { blrResourceTrail: trail.map(item => ({ ...item })), blrReferenceTrail: files.map(item => ({ ...item })) } })
  }, { flush: 'post', deep: true, immediate: true })
  provide(resourceNavigationKey, {
    previous,
    href: (key, reading = 'overview', state = 'working') => router.resolve({ query: { ...route.query,
      [sectionKey]: section.value, e: key, v: state === 'working' ? undefined : state, rt: reading === 'overview' ? undefined : reading, f: undefined,
      r: key === resource.value ? scenarioRoute.value ?? undefined : undefined,
      rc: key === resource.value && routeColumns.value !== 'auto' ? routeColumns.value : undefined } }).href,
    back: () => {
      const visit = previous.value
      if (!visit || !import.meta.client) return
      const delta = visit.position - window.history.state.position
      if (delta < 0) router.go(delta)
    }
  })
  const referenceNavigation: ReferenceNavigation = {
    current: reference, previous: previousReference,
    href: href => router.resolve({ query: { ...route.query, f: localReferenceHref(href) ?? undefined } }).href,
    open: href => { reference.value = localReferenceHref(href) },
    back: () => {
      const visit = import.meta.client ? referenceTrail(window.history.state?.blrReferenceTrail).at(-1) : undefined
      const delta = visit ? visit.position - window.history.state.position : 0
      if (delta < 0) router.go(delta)
      else reference.value = null
    }
  }
  provide(referenceNavigationKey, referenceNavigation)
  return { reference, previousReference, backReference: referenceNavigation.back, section, resource, resourceState, tab, resourceTab, scenarioRoute, routeColumns, topology, coverage, reviewPath, reviewTab }
}

/** A direct resource address has a useful closing destination even without s. */
function collectionForKey(key: string) {
  const kind = key.split(':')[0] ?? ''
  if (kind === 'experience' || kind === 'screen') return 'interface'
  if (kind === 'capability-scenario') return 'capability'
  if (kind === 'journey-scenario') return 'journey'
  return ['entity', 'interface', 'domain', 'capability', 'journey', 'rule'].includes(kind) ? kind : 'overview'
}
