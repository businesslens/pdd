<script setup lang="ts">
const { shown } = useTooltips()
</script>

<template>
  <UPopover v-if="shown" :content="{ collisionPadding: 16 }" :ui="{ content: 'w-84 max-w-[calc(100vw-2rem)]' }">
    <button
      type="button"
      class="blr-history-help"
      aria-label="About History"
    >
      <UIcon name="i-lucide-circle-question-mark" class="size-3.5 shrink-0" aria-hidden="true" />
    </button>
    <template #content>
      <div class="space-y-2 p-4">
        <p class="text-sm font-semibold text-highlighted">History</p>
        <p class="text-sm leading-relaxed text-muted">Compare two states of the Product Model and its local References. Added and removed are measured from Base to Compare to.</p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.blr-history-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  min-height: 1.5rem;
  color: var(--ui-text-muted);
  cursor: pointer;
}
.blr-history-help:hover,
.blr-history-help:focus-visible {
  color: var(--ui-primary);
}
.blr-history-help:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 3px;
}
@media (pointer: coarse) {
  .blr-history-help {
    width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
