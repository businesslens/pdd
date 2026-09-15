<script setup lang="ts">
import type { FieldChange } from 'businesslens/report'

defineProps<{ field: FieldChange }>()
</script>

<template>
  <div v-if="field.referenceFile" class="min-w-0 space-y-2" data-reference-file-diff>
    <code class="block break-all text-highlighted">{{ field.referenceFile }}</code>
    <p class="text-muted">Local file {{ field.change }}.</p>
    <div class="grid min-w-0 gap-2 lg:grid-cols-2">
      <div v-for="side in (['before', 'after'] as const)" :key="side" class="min-w-0 rounded-md border border-muted">
        <p class="border-b border-muted px-2 py-1 font-medium text-muted">{{ side === 'before' ? 'Before' : 'After' }}</p>
        <pre
          v-if="field[side] !== null"
          class="max-h-96 overflow-auto whitespace-pre-wrap break-words p-2 font-mono text-xs"
          :class="side === 'before' ? 'bg-error/5 text-muted' : 'bg-success/5 text-highlighted'"
          :data-reference-side="side"
        >{{ field[side] }}</pre>
        <p v-else class="p-2 text-dimmed italic">File missing</p>
      </div>
    </div>
  </div>
  <div v-else class="flex min-w-0 flex-col gap-0.5">
    <span v-if="field.before !== null" class="blr-field-before">{{ field.before }}</span>
    <span v-if="field.after !== null" class="blr-field-after">{{ field.after }}</span>
  </div>
</template>

<style scoped>
.blr-field-before {
  color: var(--ui-text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--ui-text-dimmed);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.blr-field-after {
  color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
