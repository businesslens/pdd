<script setup lang="ts">
import type { ProductReportV7 } from 'businesslens/report'
import type { ReportViewModel } from 'businesslens/report/view-model'
import { projectReportView } from 'businesslens/report/view-model'

type ReportSection = 'overview' | 'journeys' | 'rules'

const route = useRoute()
const sections: ReportSection[] = ['overview', 'journeys', 'rules']
const section = computed<ReportSection>({
  get: () => sections.includes(route.query.tab as ReportSection)
    ? route.query.tab as ReportSection
    : 'overview',
  set: value => navigateTo({ query: { tab: value === 'overview' ? undefined : value } })
})

const { data, error, refresh, status } = await useFetch<ProductReportV7>(
  '/_businesslens/report.json',
  { server: false, cache: 'no-store' }
)

const liveError = ref<string | null>(null)
const logoSrc = ref<string | null>(null)
let logoRevision = 0
let events: EventSource | undefined

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

onMounted(() => {
  void refreshLogo()
  events = new EventSource('/_businesslens/events')
  events.addEventListener('report', () => {
    liveError.value = null
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

onBeforeUnmount(() => events?.close())

const report = computed<ReportViewModel | null>(() => data.value
  ? projectReportView(data.value)
  : null)

const errorMessage = computed(() => {
  const failure = error.value as { data?: { message?: string }, message?: string } | null
  return failure?.data?.message ?? failure?.message ?? 'The Product Model could not be compiled.'
})
</script>

<template>
  <div>
    <UContainer v-if="status === 'pending' && !report" class="py-16">
      <div class="flex items-center gap-3 text-sm text-dimmed">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        Compiling the Product Model…
      </div>
    </UContainer>

    <UContainer v-else-if="error && !report" class="py-16">
      <UAlert
        icon="i-lucide-triangle-alert"
        color="error"
        variant="subtle"
        title="The Product Model is not ready to view."
        :description="errorMessage"
        :actions="[{ label: 'Try again', icon: 'i-lucide-refresh-cw', onClick: () => refresh() }]"
      />
    </UContainer>

    <template v-else-if="report">
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
        :report="report"
        :logo-src="logoSrc"
      />
    </template>
  </div>
</template>
