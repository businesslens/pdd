<script setup lang="ts">
import type { CoverageChange } from 'businesslens/report'
import type { CoverageNode } from '../utils/coverageRepository'

defineProps<{ node: CoverageNode, fileStatesOnly?: boolean }>()
const states: Record<CoverageChange, { label: string, icon: string }> = {
  added: { label: 'Added', icon: 'i-lucide-plus' },
  modified: { label: 'Modified', icon: 'i-lucide-file-diff' },
  deleted: { label: 'Deleted', icon: 'i-lucide-minus' },
  unchanged: { label: 'Unchanged', icon: 'i-lucide-check' },
  unreviewed: { label: 'Not reviewed', icon: 'i-lucide-circle-question-mark' },
  unreadable: { label: 'Unreadable', icon: 'i-lucide-eye-off' },
  'outside-policy': { label: 'Outside policy', icon: 'i-lucide-scan' }
}
</script>

<template>
  <span v-if="Object.keys(node.changes).length || (!fileStatesOnly && (node.sources.length || node.exclusions.length || node.owners.length || node.gaps.length))" class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] leading-4" data-coverage-indicators>
    <span v-if="Object.keys(node.changes).length" class="inline-flex shrink-0 items-center gap-1">
      <span v-for="(count, state) in node.changes" :key="state" class="inline-flex items-center gap-1 rounded border border-default bg-elevated px-1 text-default" :data-file-state="state">
        <UIcon :name="states[state].icon" class="size-3 shrink-0" />{{ states[state].label }}<span v-if="node.directory" class="font-mono tabular-nums">{{ count }}</span>
      </span>
    </span>
    <span v-if="!fileStatesOnly && (node.sources.length || node.exclusions.length || node.owners.length || node.gaps.length)" class="inline-flex shrink-0 items-center gap-1">
      <span v-if="node.sources.length" class="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-1 text-primary" data-annotation="source-areas"><UIcon name="i-lucide-scan" class="size-3 shrink-0" />Source areas <span class="font-mono tabular-nums">{{ node.sources.length }}</span></span>
      <span v-if="node.exclusions.length" class="inline-flex items-center gap-1 rounded border border-dashed border-accented px-1 text-muted" data-annotation="exclusions"><UIcon name="i-lucide-ban" class="size-3 shrink-0" />Exclusions <span class="font-mono tabular-nums">{{ node.exclusions.length }}</span></span>
      <span v-if="node.owners.length" class="inline-flex items-center gap-1 rounded border border-info/30 bg-info/5 px-1 text-default" data-annotation="references"><UIcon name="i-lucide-link" class="size-3 shrink-0" />Model references <span class="font-mono tabular-nums">{{ node.owners.length }}</span></span>
      <span v-if="node.gaps.length" class="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1 text-default" data-annotation="unmapped"><UIcon name="i-lucide-circle-dot-dashed" class="size-3 shrink-0" />Unmapped <span class="font-mono tabular-nums">{{ node.gaps.length }}</span></span>
    </span>
  </span>
</template>
