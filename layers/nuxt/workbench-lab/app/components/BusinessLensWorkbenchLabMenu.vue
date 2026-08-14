<script setup lang="ts">
/**
 * The audition, reachable without opening the theme lab.
 *
 * The background audition is a designer's tool, hidden until asked for. Which
 * *reading* of the model you are looking at is a different kind of choice —
 * it changes what the application is, so a comparison you cannot find is not a
 * comparison anyone will run.
 */
import { WORKBENCH_VARIANTS } from '../utils/workbenchVariants'

const { active, select } = useBusinessLensWorkbenchVariant()
const open = ref(false)

function choose(id: typeof WORKBENCH_VARIANTS[number]['id']) {
  select(id)
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      :icon="active.icon"
      :label="active.name"
      color="neutral"
      variant="ghost"
      size="sm"
      trailing-icon="i-lucide-chevron-down"
      :aria-label="`Reading: ${active.name}. Choose another reading of this model.`"
    />
    <template #content>
      <div class="w-96 p-2">
        <p class="px-2 pb-2 text-xs text-dimmed">
          Five readings of the same model. Nothing about the model changes — only
          what the primary axis is, and what a click means.
        </p>
        <button
          v-for="variant in WORKBENCH_VARIANTS"
          :key="variant.id"
          type="button"
          class="blr-reading"
          :data-current="variant.id === active.id"
          @click="choose(variant.id)"
        >
          <span class="flex items-center gap-2">
            <UIcon :name="variant.icon" class="size-4 shrink-0" />
            <span class="text-sm font-semibold text-highlighted">{{ variant.name }}</span>
            <UIcon
              v-if="variant.id === active.id"
              name="i-lucide-check"
              class="ms-auto size-4 shrink-0 text-primary"
            />
          </span>
          <span class="mt-1 block ps-6 text-xs text-default">{{ variant.premise }}</span>
          <span class="mt-0.5 block ps-6 text-xs text-muted">{{ variant.gesture }}</span>
          <span class="mt-0.5 block ps-6 text-xs text-dimmed">Costs: {{ variant.cost }}</span>
        </button>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.blr-reading {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  text-align: start;
}

.blr-reading:hover {
  background: var(--ui-bg-elevated);
}

.blr-reading[data-current='true'] {
  background: color-mix(in srgb, var(--ui-color-primary-500) 8%, var(--ui-bg-elevated));
}
</style>
