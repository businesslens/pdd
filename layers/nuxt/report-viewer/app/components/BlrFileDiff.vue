<script setup lang="ts">
import { diffBlocks, fileDiff, splitDiffLines } from '../utils/fileDiff'

const props = defineProps<{ before: string, after: string, beforeLabel: string, afterLabel: string, beforeExists: boolean, afterExists: boolean }>()
const drawing = defineModel<string>('drawing', { default: 'unified' })
const expanded = defineModel<Set<number>>('expanded', { default: () => new Set() })
const limits = defineModel<Record<number, number>>('limits', { default: () => ({}) })
const diff = computed(() => fileDiff(props.before, props.after))
const blocks = computed(() => diffBlocks(diff.value.lines).map(block => ({ ...block,
  rows: drawing.value === 'split' ? splitDiffLines(block.lines) : block.lines.map(line => ({ before: line, after: null })),
  limit: limits.value[block.key] ?? 500
})))
watch(() => [props.before, props.after], () => { expanded.value = new Set(); limits.value = {} })
function toggle(key: number) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key); else next.add(key)
  expanded.value = next
}
</script>

<template>
  <section class="min-w-0 space-y-3" aria-label="File diff" data-file-diff>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="text-muted">{{ beforeLabel }} → {{ afterLabel }}</span>
        <span class="blr-matrix-tone rounded border px-1" data-tone="creates">+{{ diff.added }} {{ diff.added === 1 ? 'line' : 'lines' }}</span>
        <span class="blr-matrix-tone rounded border px-1" data-tone="removes">−{{ diff.removed }} {{ diff.removed === 1 ? 'line' : 'lines' }}</span>
      </div>
      <UFieldGroup size="sm" aria-label="Diff layout">
        <UButton label="Unified" color="neutral" :variant="drawing === 'unified' ? 'solid' : 'outline'" :aria-pressed="drawing === 'unified'" @click="drawing = 'unified'" />
        <UButton label="Side by side" color="neutral" :variant="drawing === 'split' ? 'solid' : 'outline'" :aria-pressed="drawing === 'split'" @click="drawing = 'split'" />
      </UFieldGroup>
    </div>
    <p v-if="!diff.added && !diff.removed" class="text-sm text-muted">{{ !beforeExists ? 'Empty file added.' : !afterExists ? 'Empty file deleted.' : 'File contents are unchanged.' }}</p>
    <p v-if="diff.coarse" class="text-xs text-muted">Large rewrite: showing complete removed and added blocks.</p>
    <div v-if="diff.lines.length" class="overflow-hidden rounded-lg border border-default" :data-diff-layout="drawing">
      <div v-if="drawing === 'split'" class="grid grid-cols-2 divide-x divide-default border-b border-default bg-elevated px-0 text-xs font-medium">
        <div class="p-2">{{ beforeLabel }}</div><div class="p-2">{{ afterLabel }}</div>
      </div>
      <template v-for="block in blocks" :key="block.key">
        <button v-if="block.hidden" type="button" class="block w-full cursor-pointer border-y border-default bg-elevated/60 px-3 py-2 text-start text-xs text-muted hover:text-highlighted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-expanded="expanded.has(block.key)" data-diff-context @click="toggle(block.key)">
          <UIcon :name="expanded.has(block.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="me-1 inline-block size-3 align-middle" />{{ expanded.has(block.key) ? 'Hide' : 'Show' }} {{ block.lines.length }} unchanged {{ block.lines.length === 1 ? 'line' : 'lines' }}
        </button>
        <template v-if="!block.hidden || expanded.has(block.key)">
          <div v-for="(row, index) in block.rows.slice(0, block.limit)" :key="index" :class="drawing === 'split' && 'grid grid-cols-2 divide-x divide-default'">
            <BlrDiffLine :line="row.before" :side="drawing === 'split' ? 'before' : undefined" />
            <BlrDiffLine v-if="drawing === 'split'" :line="row.after" side="after" />
          </div>
          <UButton v-if="block.rows.length > block.limit" label="Show more lines" color="neutral" variant="ghost" block @click="limits[block.key] = block.limit + 500" />
        </template>
      </template>
    </div>
  </section>
</template>
