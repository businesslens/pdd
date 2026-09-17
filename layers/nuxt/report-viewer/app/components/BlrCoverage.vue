<script setup lang="ts">
import type { RepositoryInventoryLoader, CoverageComparison } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'

const props = defineProps<{ workspace: ReportWorkspace, loadRepository?: RepositoryInventoryLoader }>()
const emit = defineEmits<{ selectKey: [key: string] }>()
const reading = defineModel<CoverageReading>('reading', { default: defaultCoverageReading })
const paths = shallowRef<string[]>([])
const comparison = shallowRef<CoverageComparison>()
const review = computed<CoverageComparison | undefined>(() => comparison.value ?? (props.workspace.coverage.review ? {
  policy: props.workspace.coverage.review.policy, baseline: props.workspace.coverage.review, pending: null,
  modelChanged: null, pendingChanged: null, files: []
} : undefined))
const reviewError = ref('')
const inventoryError = ref('')
const includeIgnored = ref(false)
const pending = ref(false)
const hasInventory = ref(false)
let request = 0
async function refreshInventory() {
  if (!props.loadRepository) return
  const current = ++request
  pending.value = true
  inventoryError.value = ''
  try {
    const inventory = await props.loadRepository(includeIgnored.value)
    if (current !== request) return
    paths.value = inventory.paths
    comparison.value = inventory.coverage
    reviewError.value = inventory.coverageError ?? ''
    hasInventory.value = true
  } catch (error) {
    if (current !== request) return
    inventoryError.value = (error as Error).message || 'The repository files could not be listed.'
    paths.value = []
    comparison.value = undefined
    reviewError.value = ''
    hasInventory.value = false
  } finally {
    if (current === request) pending.value = false
  }
}
onMounted(refreshInventory)
watch(includeIgnored, refreshInventory)
watch(() => props.workspace, refreshInventory)
onBeforeUnmount(() => { request++ })

const selectedPath = computed({
  get: () => reading.value.path,
  set: (path: string | null) => { reading.value = { path } }
})
</script>

<template>
  <section class="@container/coverage pb-4" aria-label="Coverage" data-product-coverage>
    <BlrCoverageRepository v-model:path="selectedPath" :workspace="workspace" :paths="paths" :review="review" :comparison-available="Boolean(comparison)" :loading="pending" :review-error="reviewError || inventoryError" @select-key="emit('selectKey', $event)">
      <template #controls>
        <UCheckbox v-if="loadRepository" v-model="includeIgnored" label="Include ignored files" class="shrink-0 whitespace-nowrap" />
        <UButton v-if="loadRepository" icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="sm" class="shrink-0 whitespace-nowrap" :loading="pending" @click="refreshInventory">Refresh files</UButton>
      </template>
      <template #inventory-count>
        <span v-if="hasInventory" class="shrink-0 whitespace-nowrap text-xs text-muted">{{ paths.length }} current {{ paths.length === 1 ? 'file' : 'files' }}</span>
      </template>
      <template #inventory-status>
        <p v-if="!loadRepository" class="text-xs text-muted">Showing recorded paths. Live repository comparison is unavailable.</p>
        <p v-else-if="inventoryError" role="status" class="text-xs text-muted">{{ inventoryError }} Recorded paths remain available.</p>
        <p v-else-if="pending && !hasInventory" role="status" class="text-xs text-muted">Loading repository files…</p>
        <p v-else-if="includeIgnored" class="text-xs text-muted">Ignored files are included for browsing; the review policy is unchanged.</p>
      </template>
      <template #review-controls>
        <UButton v-if="loadRepository" icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="sm" :loading="pending" @click="refreshInventory">Refresh review</UButton>
      </template>
    </BlrCoverageRepository>
  </section>
</template>
