<script setup lang="ts">
/**
 * A row in the experimentation bar, beside the background audition.
 *
 * There is already one place auditions live and one control that reveals it;
 * a second entry point in the header would have been a second concept for the
 * same idea.
 */
import { LAB_AXES, LAB_DEFAULTS } from '../utils/labVariants'

const { values, select, reset } = useWorkbenchLab()

const changed = computed(() => LAB_AXES.some(axis =>
  values.value[axis.id] !== LAB_DEFAULTS[axis.id as keyof typeof LAB_DEFAULTS]))
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
    <section v-for="axis in LAB_AXES" :key="axis.id" class="flex min-w-0 items-center gap-2">
      <UTooltip :text="axis.question" :delay-duration="200">
        <span class="blr-lab-label">
          <UIcon :name="axis.icon" class="size-3 translate-y-px" />
          {{ axis.name }}
        </span>
      </UTooltip>
      <div class="flex flex-wrap items-center gap-1">
        <UTooltip
          v-for="option in axis.options"
          :key="option.id"
          :delay-duration="150"
          :ui="{ content: 'h-auto max-w-xs items-start p-3' }"
        >
          <UButton
            :label="option.name"
            size="xs"
            :color="values[axis.id] === option.id ? 'primary' : 'neutral'"
            :variant="values[axis.id] === option.id ? 'soft' : 'outline'"
            :aria-pressed="values[axis.id] === option.id"
            class="rounded-full"
            @click="select(axis.id, option.id)"
          />
          <template #content>
            <span class="block space-y-1 text-start">
              <span class="block text-xs text-default">{{ option.premise }}</span>
              <span class="block text-xs text-dimmed">Costs: {{ option.cost }}</span>
            </span>
          </template>
        </UTooltip>
      </div>
    </section>

    <UButton
      v-if="changed"
      color="neutral"
      variant="ghost"
      size="xs"
      label="Reset"
      class="ms-auto shrink-0"
      @click="reset()"
    />
  </div>
</template>

<style scoped>
.blr-lab-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
</style>
