<script setup lang="ts">
import type { ProductReportV13, ReportBaseline, ReportDiff } from 'businesslens/report'
import type { ReportChanges } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'
import { projectReportWorkspace, resolveResourceKey } from '../../../../layers/nuxt/report-viewer/app/utils/reportWorkspace'
import { baselineTitle } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'

const { data, error, refresh, status } = await useFetch<ProductReportV13>(
  '/_businesslens/report.json',
  { server: false, cache: 'no-store' }
)

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

const { reference, previousReference, backReference, section, resource, resourceState, tab, resourceTab, scenarioRoute, routeColumns, topology } = useBlrReportNavigation()
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
type Comparison = { base: ReportBaseline, target: ReportBaseline, before: ProductReportV13, after: ProductReportV13, diff: ReportDiff, referenceFileNotice?: string }
const comparison = shallowRef<Comparison | null>(null)
const changesError = ref<string | null>(null)
const historyQuery = ref('')
const historyLoading = ref(false)
const historyMore = ref(false)
const checkpointLimit = ref(50)
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
    const listing = await $fetch<{ states: ReportBaseline[], more: boolean, nextOffset: number, checkpointLimit: number }>('/_businesslens/history', {
      query: { q: historyQuery.value, offset: append ? nextOffset : 0 }, cache: 'no-store'
    })
    if (request !== listingRequest) return
    historyStates.value = append ? [...historyStates.value, ...listing.states] : listing.states
    const keep = append ? baselines.value : baselines.value.filter(item => [baseline.value, target.value].includes(item.id))
    baselines.value = [...new Map([...keep, ...listing.states].map(item => [item.id, item])).values()]
    checkpointLimit.value = listing.checkpointLimit
    historyMore.value = listing.more
    nextOffset = listing.nextOffset
    if (previousBase === baseline.value) await refreshDiff()
  } catch (failure) {
    if (request === listingRequest) changesError.value = message(failure)
  } finally { if (request === listingRequest) historyLoading.value = false }
}
async function refreshDiff() {
  const request = ++diffRequest
  const base = baseline.value
  const to = target.value
  if (!base) { comparison.value = null; changesError.value = null; return }
  try {
    const result = await $fetch<Comparison>('/_businesslens/history/diff', { query: { base, target: to }, cache: 'no-store' })
    if (request !== diffRequest || base !== baseline.value || to !== target.value) return
    comparison.value = result
    changesError.value = null
  } catch (failure) {
    if (request !== diffRequest) return
    comparison.value = null
    changesError.value = message(failure)
  }
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
const toast = useToast()
async function pin(label: string | null) {
  try {
    const { checkpoint } = await $fetch<{ checkpoint: { id: string } }>('/_businesslens/checkpoints', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-businesslens-pin': '1' }, body: { label }
    })
    await chooseComparison(checkpoint.id, target.value)
    toast.add({ title: label ? `Checkpoint created: ${label}` : 'Checkpoint created.', icon: 'i-lucide-history', color: 'success' })
    await refreshChanges()
  } catch (failure) {
    toast.add({ title: 'Could not create a checkpoint.', description: message(failure), icon: 'i-lucide-triangle-alert', color: 'error' })
  }
}
const readingReport = shallowRef<ProductReportV13 | null>(null)
const readingLabel = ref('')
const readingError = ref<string | null>(null)
let readingRequest = 0
let loadedReadingState: string | undefined
watch([resourceState, comparison], async () => {
  const request = ++readingRequest
  const id = resourceState.value
  if (id !== 'working' && loadedReadingState === id && readingReport.value) return
  loadedReadingState = undefined
  readingReport.value = null
  readingError.value = null
  readingLabel.value = ''
  if (id === 'working') return
  const known = comparison.value
  const side = known?.base.id === id ? { report: known.before, state: known.base }
    : known?.target.id === id ? { report: known.after, state: known.target } : null
  if (side) { loadedReadingState = id; readingReport.value = side.report; readingLabel.value = baselineTitle(side.state); return }
  try {
    const result = await $fetch<{ id: string, report: ProductReportV13, state: ReportBaseline }>('/_businesslens/state', { query: { state: id }, cache: 'no-store' })
    if (request !== readingRequest) return
    loadedReadingState = result.id
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
  error: defaultsError.value ?? changesError.value, referenceFileNotice: comparison.value?.referenceFileNotice,
  initializing: !defaultsReady.value, emptyReason: emptyReason.value,
  historyLoading: historyLoading.value, historyMore: historyMore.value, historyQuery: historyQuery.value,
  checkpointLimit: checkpointLimit.value, pinnable: true
}))

onMounted(() => {
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
      <h1 class="mt-8 mb-4 flex items-center gap-2 text-2xl font-semibold">History <BlrHistoryHelp /></h1>
      <BlrChanges :changes="changes" @compare="chooseComparison" @search="searchHistory" @more="refreshChanges(true)" @pin="pin" @inspect="inspectHistorical" />
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
        :logo-src="logoSrc"
        :changes="changes"
        tools-target="#businesslens-report-tools"
        class="businesslens-local-report min-h-0 flex-1"
        @compare="chooseComparison"
        @history-search="searchHistory"
        @history-more="refreshChanges(true)"
        @pin="pin"
      >
        <!-- The pulse sits with the report's other state facts, beside Coverage. -->
        <template #status>
          <LocalLivePulse />
        </template>
      </BusinessLensReportViewer>
    </template>
  </div>
</template>
