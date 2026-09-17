<script setup lang="ts">
import type { CoverageComparison } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace, review?: CoverageComparison, comparisonAvailable?: boolean, error?: string, loading?: boolean }>()
const emit = defineEmits<{ focus: [section: 'scope' | 'review' | 'unmapped' | 'exclusions'] }>()
const recorded = computed(() => props.review?.pending?.entries.reduce((count, entry) => count + entry.paths.length, 0) ?? 0)
const unlocated = computed(() => [
  { key: 'unmapped' as const, label: 'Unmapped', count: props.workspace.coverage.unmapped.filter(area => !area.paths.length).length },
  { key: 'exclusions' as const, label: 'Exclusions', count: props.workspace.coverage.exclusions.filter(area => !area.paths.length).length }
].filter(field => field.count))
const completed = computed(() => props.review?.baseline?.completedAt)
const date = computed(() => completed.value ? new Date(completed.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '')
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-xs" data-coverage-root-indicators @keydown.stop>
    <button type="button" class="inline-flex items-center gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-primary" aria-label="Read model scope" @click.stop="emit('focus', 'scope')">
      <span class="text-muted">Model:</span><BlrCoverageBadge :status="workspace.coverage.status" size="sm" />
    </button>
    <button type="button" class="inline-flex items-center gap-1 rounded border border-default px-1.5 py-0.5 text-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" aria-label="Read repository review" @click.stop="emit('focus', 'review')">
      <UIcon name="i-lucide-clipboard-list" class="size-3" />
      <template v-if="completed">Reviewed <time :datetime="completed">{{ date }}</time></template>
      <template v-else>{{ loading ? 'Checking review…' : 'No completed review' }}</template>
    </button>
    <button v-if="review?.modelChanged" type="button" class="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-default" @click.stop="emit('focus', 'review')">Model changed</button>
    <button v-if="review?.pending" type="button" class="rounded border border-info/30 bg-info/5 px-1.5 py-0.5 text-default" @click.stop="emit('focus', 'review')">Review in progress · {{ recorded }}/{{ review.pending.files.length }} files recorded</button>
    <button v-if="error || (!loading && !comparisonAvailable)" type="button" class="rounded border border-dashed border-accented px-1.5 py-0.5 text-muted" @click.stop="emit('focus', 'review')">{{ error ? 'Review status unavailable' : 'Live comparison unavailable' }}</button>
    <button v-for="field in unlocated" :key="field.key" type="button" class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 focus-visible:outline-2 focus-visible:outline-primary" :class="field.key === 'unmapped' ? 'border-warning/30 bg-warning/10 text-default' : 'border-dashed border-accented text-muted'" :data-unlocated="field.key" @click.stop="emit('focus', field.key)">
      <UIcon :name="field.key === 'unmapped' ? 'i-lucide-circle-dot-dashed' : 'i-lucide-ban'" class="size-3" />{{ field.label }} without paths · {{ field.count }}
    </button>
  </span>
</template>
