<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'
import { normalizeCoveragePath } from '../utils/coveragePaths'

defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ selectKey: [key: string] }>()
const reading = defineModel<CoverageReading>('reading', { default: defaultCoverageReading })
const overview = useTemplateRef<HTMLElement>('overview')
const detailsOpen = computed({
  get: () => Boolean(reading.value.path),
  set: (open: boolean) => { if (!open) reading.value = { ...reading.value, path: null } }
})
let returnFocus: HTMLElement | null = null
function selectPath(path: string) {
  if (!detailsOpen.value) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  reading.value = { path: normalizeCoveragePath(path) }
}
function onCloseAutoFocus(event: Event) {
  const target = returnFocus?.isConnected ? returnFocus : overview.value?.querySelector<HTMLElement>('[role="treeitem"]')
  if (target) { event.preventDefault(); target.focus({ preventScroll: true }) }
}
</script>

<template>
  <section ref="overview" class="@container/coverage min-w-0 space-y-5 pb-4" aria-label="Coverage" data-product-coverage>
    <BlrCoverageDetails :workspace="workspace" />
    <BlrCoverageSources :workspace="workspace" :path="reading.path" @select-path="selectPath" />
    <USlideover
      v-model:open="detailsOpen"
      :title="reading.path ?? 'Path details'"
      description="Recorded model context at this path and beneath it."
      :content="{ onCloseAutoFocus }"
      :ui="{ content: 'w-full max-w-full sm:max-w-xl', wrapper: 'min-w-0', title: 'break-all pe-8 font-mono text-sm', body: 'min-w-0' }"
    >
      <template #close="{ ui }">
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close path details" :class="ui.close()" />
      </template>
      <template #body>
        <BlrCoveragePathDetails v-if="reading.path" :key="reading.path" :path="reading.path" :workspace="workspace" @select-path="selectPath" @select-key="emit('selectKey', $event)" />
      </template>
    </USlideover>
  </section>
</template>
