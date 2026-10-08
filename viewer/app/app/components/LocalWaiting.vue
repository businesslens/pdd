<script setup lang="ts">
/** Nothing is wrong yet: there is simply no model to show. */
const props = defineProps<{ message?: string }>()
/* The CLI names the folders it watches; the advice around them is already on screen. */
const watching = computed(() => props.message?.match(/appear when (.+?) is created/)?.[1] ?? null)
</script>

<template>
  <div class="grid h-full place-items-center p-6" data-local-waiting>
    <div class="grid max-w-lg justify-items-center gap-3 text-center">
      <UIcon name="i-lucide-file-text" class="size-8 text-dimmed" />
      <h2 class="text-lg font-semibold text-highlighted">No Product Model yet</h2>
      <p class="text-sm text-muted">
        The report appears here by itself once <code class="font-mono">.businesslens/</code> is created.
        Ask your agent to map this repository with <code class="font-mono">/businesslens-map</code>,
        or describe a new product with <code class="font-mono">/businesslens-ideate</code>.
      </p>
      <p v-if="watching" class="text-xs text-dimmed [overflow-wrap:anywhere]">Watching for {{ watching }}</p>
    </div>
  </div>
</template>
