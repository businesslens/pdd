<script setup lang="ts">
/**
 * The audition control: three axes, five options each, varied one at a time.
 *
 * Each option states what it costs, because an audition where every option
 * claims to be good at everything decides nothing. The axis states the
 * complaint it exists to answer, so a choice can be judged against the problem
 * rather than against taste.
 */
import { LAB_AXES, LAB_DEFAULTS } from '../utils/labVariants'

const { values, select, reset } = useWorkbenchLab()
const open = ref(false)

const changed = computed(() => LAB_AXES.some(axis =>
  values.value[axis.id] !== LAB_DEFAULTS[axis.id as keyof typeof LAB_DEFAULTS]))

const summary = computed(() => LAB_AXES
  .map(axis => axis.options.find(option => option.id === values.value[axis.id])?.name ?? '')
  .join(' · '))
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      icon="i-lucide-flask-conical"
      color="neutral"
      :variant="changed ? 'soft' : 'ghost'"
      size="sm"
      label="Variations"
      trailing-icon="i-lucide-chevron-down"
      :aria-label="`Workbench variations: ${summary}`"
    />
    <template #content>
      <div class="w-[30rem] max-w-[92vw] p-3">
        <div class="mb-3 flex items-baseline gap-2">
          <p class="text-xs text-dimmed">
            Three parts of the Workbench, five options each. Everything else stays as it ships.
          </p>
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

        <section v-for="axis in LAB_AXES" :key="axis.id" class="mb-3 last:mb-0">
          <header class="mb-1.5 flex items-baseline gap-2">
            <UIcon :name="axis.icon" class="size-3.5 shrink-0 translate-y-0.5 text-dimmed" />
            <span class="text-sm font-semibold text-highlighted">{{ axis.name }}</span>
            <span class="min-w-0 flex-1 truncate text-xs text-dimmed">{{ axis.problem }}</span>
          </header>
          <div class="flex flex-wrap gap-1">
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
      </div>
    </template>
  </UPopover>
</template>
