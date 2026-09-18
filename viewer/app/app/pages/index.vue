<script setup lang="ts">
import type { ProductReportV16, ReportBaseline, ReportDiff, RepositoryDiff, RepositoryInventory, RepositoryFileLoader } from 'businesslens/report'
import type { ReportChanges } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'
import { projectReportWorkspace, resolveResourceKey } from '../../../../layers/nuxt/report-viewer/app/utils/reportWorkspace'
import { baselineTitle } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'

const { data, error, refresh, status } = await useFetch<ProductReportV16>(
  '/_businesslens/report.json',
  { server: false, cache: 'no-store' }
)

async function loadRepository(includeIgnored: boolean): Promise<RepositoryInventory> {
  try {
    return await $fetch('/_businesslens/repository.json', { query: { includeIgnored }, cache: 'no-store' })
  } catch (failure) { throw new Error(message(failure)) }
}
const loadRepositoryFile: RepositoryFileLoader = async (base, target, path) => {
  try {
    return await $fetch('/_businesslens/review/file', { query: { base, target, path }, cache: 'no-store' })
  } catch (failure) { throw new Error(message(failure)) }
}

const liveError = ref<string | null>(null)
const logoSrc = ref<string | null>(null)
let logoRevision = 0
let events: EventSource | undefined

/* The header's pulse: which revision is on screen, and when it arrived. */
const live = useLocalLive()

async function refreshLogo() {
  logoRevision += 1
  const candidate = `/_businesslens/logo.svg?v=${logoRevision}`
  try {
    const response = await fetch(candidate, { method: 'HEAD', cache: 'no-store' })
    logoSrc.value = response.ok ? candidate : null
  } catch {
    logoSrc.value = null
  }
}

const { reference, previousReference, backReference, section, resource, resourceState, tab, resourceTab, scenarioRoute, routeColumns, topology, coverage, reviewPath } = useBlrReportNavigation()
const route = useRoute()
const router = useRouter()
const queryState = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : null
const baselines = ref<ReportBaseline[]>([])
const historyStates = ref<ReportBaseline[]>([])
const initialBaseline = ref<string | null>(null)
const defaultsReady = ref(!!queryState('base'))
const defaultsError = ref<string | null>(null)
const emptyReason = ref<ReportChanges['emptyReason']>(null)
let defaultsRequest = 0
const baseline = computed(() => queryState('base') ?? initialBaseline.value)
const target = computed(() => queryState('target') ?? 'working')
type Comparison = { base: ReportBaseline, target: ReportBaseline, before: ProductReportV16 | null, after: ProductReportV16 | null, diff: ReportDiff | null, repository?: RepositoryDiff, modelNotice?: string }
const comparison = shallowRef<Comparison | null>(null)
const changesError = ref<string | null>(null)
const historyQuery = ref('')
const historyLoading = ref(false)
const historyMore = ref(false)
const diffLoading = ref(false)
let repositoryTimer: ReturnType<typeof setInterval> | undefined
let nextOffset = 0
let listingRequest = 0
let diffRequest = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined
const message = (failure: unknown) => {
  const detail = failure as { data?: { message?: string }, message?: string }
  return detail.data?.message ?? detail.message ?? 'The selected state is unavailable.'
}
async function refreshDefaults() {
  if (queryState('base') || initialBaseline.value) { defaultsReady.value = true; defaultsError.value = null; return }
  const request = ++defaultsRequest
  try {
    const defaults = await $fetch<{ base: string | null, emptyReason: ReportChanges['emptyReason'] }>('/_businesslens/history/defaults', { cache: 'no-store' })
    if (request !== defaultsRequest || queryState('base') || initialBaseline.value) return
    initialBaseline.value = defaults.base
    emptyReason.value = defaults.emptyReason
    defaultsError.value = null
  } catch (failure) {
    if (request === defaultsRequest && !queryState('base')) defaultsError.value = message(failure)
  } finally { if (request === defaultsRequest) defaultsReady.value = true }
}
async function refreshChanges(append = false) {
  const request = ++listingRequest
  historyLoading.value = true
  const previousBase = baseline.value
  try {
    const listing = await $fetch<{ states: ReportBaseline[], more: boolean, nextOffset: number }>('/_businesslens/history', {
      query: { q: historyQuery.value, offset: append ? nextOffset : 0 }, cache: 'no-store'
    })
    if (request !== listingRequest) return
    historyStates.value = append ? [...historyStates.value, ...listing.states] : listing.states
    const keep = append ? baselines.value : baselines.value.filter(item => [baseline.value, target.value].includes(item.id))
    baselines.value = [...new Map([...keep, ...listing.states].map(item => [item.id, item])).values()]
    historyMore.value = listing.more
    nextOffset = listing.nextOffset
    if (previousBase === baseline.value) await refreshDiff()
  } catch (failure) {
    if (request === listingRequest) changesError.value = message(failure)
  } finally { if (request === listingRequest) historyLoading.value = false }
}
async function refreshDiff() {
  const request = ++diffRequest
  diffLoading.value = true
  const base = baseline.value
  const to = target.value
  if (!base) { comparison.value = null; changesError.value = null; diffLoading.value = false; return }
  try {
    const result = await $fetch<Comparison>('/_businesslens/history/diff', { query: { base, target: to }, cache: 'no-store' })
    if (request !== diffRequest || base !== baseline.value || to !== target.value) return
    comparison.value = result
    changesError.value = null
  } catch (failure) {
    if (request !== diffRequest) return
    comparison.value = null
    changesError.value = message(failure)
  } finally { if (request === diffRequest) diffLoading.value = false }
}
watch([baseline, target], () => {
  comparison.value = null
  changesError.value = null
  void refreshDiff()
}, { flush: 'sync' })
function chooseComparison(base: string, target: string) {
  defaultsRequest += 1
  defaultsReady.value = true
  defaultsError.value = null
  return router.push({ query: { ...route.query, base, target } })
}
function searchHistory(query: string) {
  listingRequest += 1
  historyQuery.value = query
  historyLoading.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => void refreshChanges(), 250)
}
const readingReport = shallowRef<ProductReportV16 | null>(null)
const readingLabel = ref('')
const readingError = ref<string | null>(null)
let readingRequest = 0
watch([resourceState, comparison], async () => {
  const request = ++readingRequest
  const id = resourceState.value
  readingReport.value = null
  readingError.value = null
  readingLabel.value = ''
  if (id === 'working') return
  const known = comparison.value
  const side = known?.base.id === id ? { report: known.before, state: known.base }
    : known?.target.id === id ? { report: known.after, state: known.target } : null
  if (side?.report) { readingReport.value = side.report; readingLabel.value = baselineTitle(side.state); return }
  try {
    const result = await $fetch<{ id: string, report: ProductReportV16, state: ReportBaseline }>('/_businesslens/state', { query: { state: id }, cache: 'no-store' })
    if (request !== readingRequest) return
    readingReport.value = result.report
    resourceState.value = result.id
    readingLabel.value = baselineTitle(result.state)
  } catch (failure) { if (request === readingRequest) readingError.value = message(failure) }
}, { immediate: true })
const fallbackWorkspace = computed(() => readingReport.value ? projectReportWorkspace(readingReport.value) : null)
const fallbackResource = computed(() => fallbackWorkspace.value && resource.value ? resolveResourceKey(fallbackWorkspace.value, resource.value) ?? null : null)
function inspectHistorical(key: string, state: string) {
  resourceState.value = state
  resource.value = key
  resourceTab.value = 'overview'
}
const changes = computed<ReportChanges>(() => ({
  baselines: baselines.value, historyStates: historyStates.value, baseline: baseline.value, target: target.value,
  diff: comparison.value?.diff ?? null, before: comparison.value?.before, after: comparison.value?.after,
  baseState: comparison.value?.base, targetState: comparison.value?.target,
  error: defaultsError.value ?? changesError.value,
  initializing: !defaultsReady.value, emptyReason: emptyReason.value,
  historyLoading: historyLoading.value, historyMore: historyMore.value, historyQuery: historyQuery.value,
  repository: comparison.value?.repository, modelNotice: comparison.value?.modelNotice
}))

watch(section, value => { if (value === 'review') void refreshDiff() })
onMounted(() => {
  repositoryTimer = setInterval(() => {
    if (section.value === 'review' && (baseline.value === 'working' || target.value === 'working') && !diffLoading.value && document.visibilityState === 'visible') void refreshDiff()
  }, 3000)
  void refreshLogo()
  events = new EventSource('/_businesslens/events')
  events.addEventListener('open', () => {
    live.value = { ...live.value, connected: true }
    // Read after subscribing, including on reconnect, so no baseline update
    // can fall between the initial listing and the live stream.
    void Promise.all([refreshChanges(), refreshDefaults()])
  })
  events.addEventListener('error', () => { live.value = { ...live.value, connected: false } })
  events.addEventListener('report', (event) => {
    liveError.value = null
    let revision = live.value.revision + 1
    try {
      revision = (JSON.parse((event as MessageEvent).data) as { revision?: number }).revision ?? revision
    } catch { /* The count is a courtesy. */ }
    live.value = { revision, updatedAt: Date.now(), connected: true }
    void refresh().then(() => Promise.all([refreshChanges(), refreshDefaults()]))
    void refreshLogo()
  })
  events.addEventListener('baselines', () => {
    void Promise.all([refreshChanges(), refreshDefaults()])
  })
  events.addEventListener('references', () => {
    live.value = { ...live.value, updatedAt: Date.now(), connected: true }
    void refreshDiff()
  })
  events.addEventListener('compile-error', (event) => {
    try {
      const update = JSON.parse((event as MessageEvent).data) as { message?: string }
      liveError.value = update.message ?? 'The Product Model could not be compiled.'
    } catch {
      liveError.value = 'The Product Model could not be compiled.'
    }
  })
})

onBeforeUnmount(() => {
  events?.close()
  if (repositoryTimer) clearInterval(repositoryTimer)
  listingRequest += 1
  defaultsRequest += 1
  diffRequest += 1
  readingRequest += 1
  if (searchTimer) clearTimeout(searchTimer)
})

const errorMessage = computed(() => {
  if (liveError.value) return liveError.value
  const failure = error.value as { data?: { message?: string }, message?: string } | null
  return failure?.data?.message ?? failure?.message ?? 'The Product Model could not be compiled.'
})

</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <UContainer v-if="status === 'pending' && !data" class="py-16">
      <div class="flex items-center gap-3 text-sm text-dimmed">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Compiling the Product Model…
      </div>
    </UContainer>

    <UContainer v-else-if="error && !data" class="py-16">
      <UAlert
        icon="i-lucide-triangle-alert"
        color="error"
        variant="subtle"
        title="The Product Model is not ready to view."
        :description="errorMessage"
        :actions="[{ label: 'Try again', icon: 'i-lucide-refresh-cw', onClick: () => refresh() }]"
      />
      <h1 class="mt-8 mb-4 flex items-center gap-2 text-2xl font-semibold">Review <span v-if="changes.repository" class="text-sm font-normal text-muted">{{ changes.repository.files.length }} {{ changes.repository.files.length === 1 ? 'file' : 'files' }}</span><BlrHistoryHelp /></h1>
      <BlrChanges v-model:path="reviewPath" :load-repository-file="loadRepositoryFile" :changes="changes" :resource-reading-open="Boolean(resource || reference)" @compare="chooseComparison" @search="searchHistory" @more="refreshChanges(true)" @inspect="inspectHistorical" />
      <BlrResourceSlideover v-if="fallbackWorkspace" v-model:tab="resourceTab" :workspace="fallbackWorkspace" :resource="fallbackResource" :state-label="readingLabel" :state-id="resourceState" :reference="reference" :previous-reference="previousReference" @reference-open="reference = $event" @reference-back="backReference" @open="resource = $event.key; reference = null" @close="resource = null; reference = null; resourceState = 'working'" />
      <UAlert v-if="readingError" class="mt-4" title="Historical state unavailable" :description="readingError" />
    </UContainer>

    <template v-else-if="data">
      <UContainer v-if="liveError" class="pt-6">
        <UAlert
          icon="i-lucide-triangle-alert"
          color="warning"
          variant="subtle"
          title="The latest model edit is not valid yet."
          :description="liveError"
        />
      </UContainer>
      <BusinessLensReportViewer
        v-model:section="section"
        v-model:resource="resource"
        v-model:resource-state="resourceState"
        :reading-report="readingReport"
        :reading-label="readingLabel"
        :reading-error="readingError"
        v-model:tab="tab" v-model:resource-tab="resourceTab"
        v-model:scenario-route="scenarioRoute"
        v-model:route-columns="routeColumns"
        v-model:topology="topology"
        :report="data"
        v-model:coverage="coverage" v-model:review-path="reviewPath"
        :load-repository="loadRepository" :load-repository-file="loadRepositoryFile"
        :logo-src="logoSrc"
        :changes="changes"
        class="businesslens-local-report min-h-0 flex-1"
        @compare="chooseComparison"
        @history-search="searchHistory"
        @history-more="refreshChanges(true)"
      >
        <!-- The pulse sits with the report's other state facts, beside Coverage. -->
        <template #status>
          <LocalLivePulse />
        </template>
        <template #sidebar-header="{ collapsed }"><LocalViewerBrand :collapsed="collapsed" /></template>
        <template #sidebar-footer="{ collapsed }"><LocalViewerTools :collapsed="collapsed" /></template>
      </BusinessLensReportViewer>
    </template>
  </div>
</template>
