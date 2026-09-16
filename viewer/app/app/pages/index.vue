<script setup lang="ts">
import type { ProductReportV13, ReportBaseline, ReportDiff } from 'businesslens/report'
import type { ReportChanges } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'
import { defaultBaseline } from '../../../../layers/nuxt/report-viewer/app/utils/reportChanges'

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

/* ------------------------------------------------------------------ */
/* What changed: the local server reads baselines and computes diffs;  */
/* the page requests a comparison and remembers the baseline choice.   */
/* ------------------------------------------------------------------ */

const baselines = ref<ReportBaseline[]>([])
const diff = ref<ReportDiff | null>(null)
const changesError = ref<string | null>(null)
const referenceFileNotice = ref<string | null>(null)
/* The choice outlives a refresh and a recompile; a baseline that has since
   left the ring falls back to the newest one. */
const chosenBaseline = useCookie<string | null>('blr-baseline', { default: () => null, sameSite: 'lax', path: '/' })

const baseline = computed(() => {
  const chosen = chosenBaseline.value
  if (chosen && baselines.value.some(item => item.id === chosen && item.available)) return chosen
  return defaultBaseline(baselines.value)
})

async function refreshChanges() {
  try {
    const listing = await $fetch<{ baselines: ReportBaseline[] }>('/_businesslens/changes', { cache: 'no-store' })
    baselines.value = listing.baselines
  } catch {
    baselines.value = []
  }
  await refreshDiff()
}

async function refreshDiff() {
  const base = baseline.value
  if (!base) {
    diff.value = null
    changesError.value = null
    referenceFileNotice.value = null
    return
  }
  try {
    const result = await $fetch<{ diff: ReportDiff, referenceFileNotice?: string }>('/_businesslens/changes/diff', { query: { base }, cache: 'no-store' })
    diff.value = result.diff
    referenceFileNotice.value = result.referenceFileNotice ?? null
    changesError.value = null
  } catch (failure) {
    diff.value = null
    referenceFileNotice.value = null
    const detail = failure as { data?: { message?: string }, message?: string }
    changesError.value = detail.data?.message ?? detail.message ?? 'The comparison could not be made.'
  }
}

function chooseBaseline(id: string) {
  chosenBaseline.value = id
  void refreshDiff()
}

const toast = useToast()
async function pin(label: string | null) {
  try {
    await $fetch('/_businesslens/checkpoints', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-businesslens-pin': '1' },
      body: { label }
    })
    toast.add({ title: label ? `Pinned: ${label}` : 'Pinned this state.', icon: 'i-lucide-pin', color: 'success' })
  } catch (failure) {
    const detail = failure as { data?: { message?: string }, message?: string }
    toast.add({ title: 'Could not pin this state.', description: detail.data?.message ?? detail.message, icon: 'i-lucide-triangle-alert', color: 'error' })
  }
}

const changes = computed<ReportChanges>(() => ({
  baselines: baselines.value,
  baseline: baseline.value,
  diff: diff.value,
  error: changesError.value,
  referenceFileNotice: referenceFileNotice.value,
  pinnable: true
}))

onMounted(() => {
  void refreshLogo()
  events = new EventSource('/_businesslens/events')
  events.addEventListener('open', () => {
    live.value = { ...live.value, connected: true }
    // Read after subscribing, including on reconnect, so no baseline update
    // can fall between the initial listing and the live stream.
    void refreshChanges()
  })
  events.addEventListener('error', () => { live.value = { ...live.value, connected: false } })
  events.addEventListener('report', (event) => {
    liveError.value = null
    let revision = live.value.revision + 1
    try {
      revision = (JSON.parse((event as MessageEvent).data) as { revision?: number }).revision ?? revision
    } catch { /* The count is a courtesy. */ }
    live.value = { revision, updatedAt: Date.now(), connected: true }
    void refresh().then(refreshDiff)
    void refreshLogo()
  })
  events.addEventListener('baselines', () => {
    void refreshChanges()
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

onBeforeUnmount(() => events?.close())

const errorMessage = computed(() => {
  const failure = error.value as { data?: { message?: string }, message?: string } | null
  return failure?.data?.message ?? failure?.message ?? 'The Product Model could not be compiled.'
})

const { section, resource, tab, resourceTab, scenarioRoute, routeColumns, topology } = useBlrReportNavigation()
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
        v-model:tab="tab" v-model:resource-tab="resourceTab"
        v-model:scenario-route="scenarioRoute"
        v-model:route-columns="routeColumns"
        v-model:topology="topology"
        :report="data"
        :logo-src="logoSrc"
        :changes="changes"
        tools-target="#businesslens-report-tools"
        class="businesslens-local-report min-h-0 flex-1"
        @baseline="chooseBaseline"
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
