<script setup lang="ts">
import type { ProductReportV9 } from 'businesslens/report'

const { data, error, refresh, status } = await useFetch<ProductReportV9>(
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

const errorMessage = computed(() => {
  const failure = error.value as { data?: { message?: string }, message?: string } | null
  return failure?.data?.message ?? failure?.message ?? 'The Product Model could not be compiled.'
})

/*
  Where you are, in the address bar.

  The viewer keeps the report's two navigation facts — the open section and the
  open entity page — in the query string, which is what makes a link to a
  Capability a link, back and forward mean what they say, and a refresh land
  where it left instead of at the Overview.

  Both directions are guarded on inequality, so the URL and the workbench never
  push each other in a loop, and one reader gesture is one history entry even
  when it changes both values.
*/
const route = useRoute()
const router = useRouter()

const section = ref('overview')
const entity = ref<string | null>(null)

const readQuery = () => ({
  section: typeof route.query.s === 'string' && route.query.s ? route.query.s : 'overview',
  entity: typeof route.query.e === 'string' && route.query.e ? route.query.e : null
})

watch(() => route.query, () => {
  const next = readQuery()
  if (next.section !== section.value) section.value = next.section
  if (next.entity !== entity.value) entity.value = next.entity
}, { immediate: true })

watch([section, entity], () => {
  const current = readQuery()
  if (current.section === section.value && current.entity === entity.value) return
  const query = { ...route.query }
  if (section.value === 'overview') delete query.s
  else query.s = section.value
  if (entity.value) query.e = entity.value
  else delete query.e
  void router.push({ query })
})
</script>

<template>
  <div>
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
      <!--
        The lab renders the shipped viewer for the `workbench` reading and an
        alternative shell for the other four. Auditions stay in the local
        viewer; nothing here reaches the packaged layer.
      -->
      <BusinessLensReportLab
        v-model:section="section"
        v-model:entity="entity"
        :report="data"
        :logo-src="logoSrc"
      />
    </template>
  </div>
</template>
