<script setup lang="ts">
import type { RepositoryDiff } from 'businesslens/report'
import { reviewChangeMeta, reviewModelFiles } from '../utils/reviewModel'

const props = defineProps<{ repository?: RepositoryDiff, active: boolean, comparison: string }>()
const emit = defineEmits<{ open: [] }>()
const expanded = ref(false)
const files = computed(() => props.repository ? reviewModelFiles(props.repository) : null)
const counts = computed(() => Object.entries(reviewChangeMeta).map(([kind, meta]) => ({
  kind, ...meta, count: files.value?.filter(file => file.change === kind).length ?? 0
})).filter(item => item.count > 0))
const label = computed(() => files.value === null ? 'Review Product Model changes'
  : `Review Product Model changes: ${files.value.length} changed model ${files.value.length === 1 ? 'file' : 'files'} ${props.comparison}`)
const breakdown = computed(() => counts.value.map(item => `${item.label}: ${item.count}`).join(', ') || 'No changed model files')
</script>

<template>
  <UFieldGroup size="sm">
    <UTooltip :text="label">
      <UButton icon="i-lucide-history" color="neutral" :variant="active ? 'soft' : 'outline'" :aria-label="label" :aria-current="active ? 'page' : undefined" data-header-changes @click="emit('open')">
        <span class="hidden md:inline">Review</span>
      </UButton>
    </UTooltip>
    <UPopover v-if="files !== null" v-model:open="expanded" :content="{ align: 'end', sideOffset: 8, collisionPadding: 16 }" :ui="{ content: 'w-72 max-w-[calc(100vw-2rem)]' }">
      <UButton color="neutral" :variant="active ? 'soft' : 'outline'" :aria-label="`Show model change breakdown: ${breakdown}`" :title="breakdown" data-review-breakdown-trigger>
        <span class="font-mono text-xs tabular-nums md:hidden" aria-hidden="true" data-review-count>{{ files.length }}</span>
        <span class="hidden items-center gap-1 md:inline-flex" aria-hidden="true" data-review-counts>
          <span v-for="item in counts" :key="item.kind" class="blr-matrix-tone rounded border px-1 font-mono text-[10px] leading-4 tabular-nums" :data-tone="item.tone" :data-review-count-kind="item.kind" :title="`${item.count} ${item.label.toLowerCase()} model ${item.count === 1 ? 'file' : 'files'}`">{{ item.symbol }}{{ item.count }}</span>
          <span v-if="!counts.length" class="font-mono text-xs tabular-nums">0</span>
        </span>
      </UButton>
      <template #content>
        <div class="space-y-3 p-3" data-review-breakdown>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-highlighted">Model changes</h2>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close change breakdown" @click="expanded = false" />
          </div>
          <p class="text-xs text-muted">{{ files.length }} changed model {{ files.length === 1 ? 'file' : 'files' }} {{ comparison }}.</p>
          <ul v-if="counts.length" class="space-y-2">
            <li v-for="item in counts" :key="item.kind" class="flex items-center justify-between gap-3 text-sm">
              <span>{{ item.label }}</span>
              <span class="blr-matrix-tone rounded border px-1.5 font-mono text-xs tabular-nums" :data-tone="item.tone">{{ item.symbol }}{{ item.count }}</span>
            </li>
          </ul>
        </div>
      </template>
    </UPopover>
  </UFieldGroup>
</template>
