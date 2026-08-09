<script setup lang="ts">
import type { AnyEntityView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { resolveEntity } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace, entity: AnyEntityView }>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const scenarios = computed<ScenarioView[]>(() => {
  const entity = props.entity
  if (entity.kind !== 'capability' && entity.kind !== 'journey') return []
  return entity.scenarioIds
    .map(id => resolveEntity(props.workspace, 'scenario', id, entity.kind))
    .filter((item): item is ScenarioView => item?.kind === 'scenario' && item.scenarioType === entity.kind)
})

</script>

<template>
  <section v-if="entity.kind === 'capability' || entity.kind === 'journey'" class="border-t border-default py-6">
    <header class="mb-4 flex items-center gap-2">
      <h3 class="flex-1 text-base font-semibold text-highlighted">{{ entity.kind === 'capability' ? 'Capability' : 'Journey' }} Scenarios</h3>
      <UBadge color="neutral" variant="subtle">{{ scenarios.length }}</UBadge>
    </header>

    <p v-if="!scenarios.length" class="text-sm text-muted italic">No Scenarios name this {{ entity.kind }}.</p>

    <div v-else class="divide-y divide-default rounded-xl border border-default">
      <UCollapsible v-for="scenario in scenarios" :key="scenario.key">
        <template #default="{ open }">
          <button
            type="button"
            class="flex w-full items-start gap-3 p-4 text-start hover:bg-elevated/45"
            :aria-expanded="open"
          >
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-highlighted">{{ scenario.title }}</span>
                <UBadge color="neutral" variant="subtle">{{ scenario.kindName }}</UBadge>
                <UBadge v-if="scenario.result" color="neutral" variant="outline">{{ scenario.result }}</UBadge>
              </span>
              <span class="mt-1 block text-xs text-muted">
                {{ scenario.steps.length }} steps
                <template v-if="scenario.flow.length"> · {{ scenario.flow.length }} flow stages</template>
              </span>
            </span>
            <UIcon
              name="i-lucide-chevron-down"
              class="mt-0.5 size-4 text-dimmed transition-transform"
              :class="open && 'rotate-180'"
            />
          </button>
        </template>

        <template #content>
          <div class="border-t border-muted bg-elevated/20 px-5 pt-5">
            <BlrInspectorDetail :workspace="workspace" :entity="scenario" @select="emit('select', $event)" />
          </div>
        </template>
      </UCollapsible>
    </div>
  </section>
</template>
