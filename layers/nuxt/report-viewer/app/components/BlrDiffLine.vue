<script setup lang="ts">
import type { DiffLine } from '../utils/fileDiff'
defineProps<{ line: DiffLine | null, side?: 'before' | 'after' }>()
</script>

<template>
  <div v-if="line" class="diff-line grid min-w-0 items-start font-mono text-xs leading-5" :class="[side ? 'grid-cols-[3rem_1rem_minmax(0,1fr)]' : 'grid-cols-[3rem_3rem_1rem_minmax(0,1fr)]', line.kind !== 'context' && 'blr-matrix-tone']" :data-tone="line.kind === 'added' ? 'creates' : line.kind === 'removed' ? 'removes' : undefined" :data-diff-kind="line.kind">
    <span v-if="!side || side === 'before'" class="select-none px-2 text-end opacity-65" aria-hidden="true">{{ line.before }}</span>
    <span v-if="!side || side === 'after'" class="select-none px-2 text-end opacity-65" aria-hidden="true">{{ line.after }}</span>
    <span class="select-none text-center" aria-hidden="true">{{ line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' ' }}</span>
    <code class="min-w-0 whitespace-pre-wrap break-words pe-3 [overflow-wrap:anywhere]"><span class="sr-only">{{ line.kind === 'context' ? '' : `${line.kind} line: ` }}</span><span v-for="(segment, index) in line.segments" :key="index" :class="segment.changed && 'diff-word'" :data-diff-word="segment.changed || undefined">{{ segment.text }}</span><span v-if="line.ending !== 'lf'" class="ms-2 inline-block select-none font-sans text-[10px] opacity-70">{{ line.ending === 'none' ? 'No newline at end of file' : 'CRLF' }}</span></code>
  </div>
  <div v-else class="min-w-0 bg-elevated/40" aria-hidden="true" />
</template>

<style scoped>
.diff-word { background: color-mix(in srgb, var(--blr-badge-ink) 20%, transparent); border-radius: 2px; }
</style>
