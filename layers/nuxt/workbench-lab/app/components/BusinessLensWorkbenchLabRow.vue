<script setup lang="ts">
/**
 * The audition control: five readings, one click apart.
 *
 * Each variation states its premise and what it is bad at, because a comparison
 * where every option claims to be good at everything is not a comparison.
 */
import { WORKBENCH_VARIANTS } from '../utils/workbenchVariants'

const { active, select } = useBusinessLensWorkbenchVariant()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
    <span class="blr-lab-label">Reading</span>
    <div class="flex flex-wrap items-center gap-1">
      <UTooltip
        v-for="variant in WORKBENCH_VARIANTS"
        :key="variant.id"
        :delay-duration="200"
        :ui="{ content: 'h-auto max-w-sm items-start p-3' }"
      >
        <UButton
          :icon="variant.icon"
          :label="variant.name"
          size="xs"
          :color="variant.id === active.id ? 'primary' : 'neutral'"
          :variant="variant.id === active.id ? 'soft' : 'outline'"
          :aria-pressed="variant.id === active.id"
          class="rounded-full"
          @click="select(variant.id)"
        />
        <template #content>
          <span class="block space-y-1.5 text-start">
            <span class="block text-sm font-semibold text-highlighted">{{ variant.name }}</span>
            <span class="block text-xs text-default">{{ variant.premise }}</span>
            <span class="block text-xs text-muted">{{ variant.gesture }}</span>
            <span class="block text-xs text-dimmed">Costs: {{ variant.cost }}</span>
          </span>
        </template>
      </UTooltip>
    </div>
    <p class="min-w-0 flex-1 truncate text-xs text-muted">{{ active.premise }}</p>
  </div>
</template>

<style scoped>
.blr-lab-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
</style>
