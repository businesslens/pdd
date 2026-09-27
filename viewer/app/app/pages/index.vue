<script setup lang="ts">
import type { ProductReportV16 } from 'businesslens/report'

const { data, error, refresh, status } = await useFetch<ProductReportV16>(
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

const { section, resource, tab, resourceTab, scenarioRoute, routeColumns, topology, coverage } = useBlrReportNavigation()
onMounted(() => {
  void refreshLogo()
  events = new EventSource('/_businesslens/events')
  events.addEventListener('open', () => { live.value = { ...live.value, connected: true }; void refresh() })
  events.addEventListener('error', () => { live.value = { ...live.value, connected: false } })
  events.addEventListener('report', (event) => {
    liveError.value = null
    let revision = live.value.revision + 1
    try {
      revision = (JSON.parse((event as MessageEvent).data) as { revision?: number }).revision ?? revision
    } catch { /* The count is a courtesy. */ }
    live.value = { revision, updatedAt: Date.now(), connected: true }
    void refresh()
    void refreshLogo()
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

    <UContainer v-else-if="error && !data" class="min-h-0 flex-1 overflow-y-auto py-8">
      <UAlert
        icon="i-lucide-triangle-alert"
        color="error"
        variant="subtle"
        title="The Product Model is not ready to view."
        :description="errorMessage"
        :ui="{ description: 'max-h-24 overflow-auto break-words' }"
        :actions="[{ label: 'Try again', icon: 'i-lucide-refresh-cw', onClick: () => refresh() }]"
      />
    </UContainer>

    <template v-else-if="data">
      <UContainer v-if="liveError" class="shrink-0 pt-4">
        <UAlert
          icon="i-lucide-triangle-alert"
          color="warning"
          variant="subtle"
          title="The latest model edit is not valid yet."
          :description="liveError"
          :ui="{ description: 'max-h-24 overflow-auto break-words' }"
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
        v-model:coverage="coverage"
        :logo-src="logoSrc"
        class="businesslens-local-report min-h-0 flex-1"
      >
        <!-- The pulse shows the local report's live connection state. -->
        <template #status>
          <LocalLivePulse />
        </template>
        <template #sidebar-header="{ collapsed }"><LocalViewerBrand :collapsed="collapsed" /></template>
        <template #sidebar-footer="{ collapsed }"><LocalViewerTools :collapsed="collapsed" /></template>
      </BusinessLensReportViewer>
    </template>
  </div>
</template>
