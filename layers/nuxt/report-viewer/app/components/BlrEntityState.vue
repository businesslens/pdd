<script setup lang="ts">
/**
 * One State an Entity holds: a squarer badge wearing the Lifecycle's ring, so
 * it never reads as a second Entity. A starting State is drawn quieter than
 * the one a change lands in. The same badge names a State wherever it stands:
 * inside a change phrase, on its own, and heading its Lifecycle group.
 */
defineProps<{ name: string, from?: boolean }>()
</script>

<template>
  <span class="blr-entity-state" :data-from="from || undefined" data-effect-state><span class="blr-entity-state-mark" aria-hidden="true" />{{ name }}</span>
</template>

<style scoped>
.blr-entity-state {
  display: inline-flex; align-items: baseline; gap: 0.3125rem; min-width: 0; max-width: 100%;
  padding: 0.125rem 0.4375rem; border: 1px solid var(--ui-border-accented); border-radius: 0.3125rem;
  background: var(--ui-bg); font-size: 0.75rem; line-height: 1.125rem; font-weight: 500; color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}
.blr-entity-state[data-from] { font-weight: 400; color: var(--ui-text-muted); border-color: var(--ui-border); background: transparent; }
.blr-entity-state-mark { align-self: center; width: 0.5rem; height: 0.5rem; flex-shrink: 0; border: 1.5px solid currentColor; border-radius: 999px; opacity: 0.55; }
</style>
