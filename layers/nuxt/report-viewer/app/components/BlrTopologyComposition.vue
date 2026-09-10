<script setup lang="ts">
/**
 * Every Journey's Scenarios, as columns of the Capabilities they compose.
 *
 * The reading belongs to the Journeys collection rather than to one Journey's
 * page: the question is how Journeys compare, and a page that shows one of them
 * cannot answer it. Each Journey keeps its own window, so scrolling one does not
 * move the others.
 */
import type { journeyCompositionProjection } from '../utils/topologyProjections'

type Composition = ReturnType<typeof journeyCompositionProjection>[number]

const props = defineProps<{ compositions: Composition[], scenario: string | null }>()
const emit = defineEmits<{ open: [key: string], scenario: [id: string] }>()
const { element, width } = useBlrReadingWidth()
const capacity = computed(() => Math.max(1, Math.min(4, Math.floor((width.value + 20) / 300))))

/* One window per Journey, seeded from the Scenario the URL names. */
const starts = ref<Record<string, number>>({})

function startFor(composition: Composition): number {
  const id = composition.journey?.id ?? ''
  const limit = Math.max(0, composition.scenarios.length - capacity.value)
  const named = composition.scenarios.findIndex(item => item.resource.id === props.scenario)
  const chosen = starts.value[id] ?? (named >= 0 ? named : 0)
  return Math.max(0, Math.min(limit, chosen))
}

function visibleFor(composition: Composition) {
  const start = startFor(composition)
  return composition.scenarios.slice(start, start + capacity.value)
}

function move(composition: Composition, delta: number) {
  const id = composition.journey?.id ?? ''
  const next = Math.max(0, Math.min(composition.scenarios.length - 1, startFor(composition) + delta))
  starts.value = { ...starts.value, [id]: next }
  const scenario = composition.scenarios[next]
  if (scenario) emit('scenario', scenario.resource.id)
}
</script>
<template>
  <div ref="element" class="blr-composition-set">
    <section v-for="composition in compositions" :key="composition.journey?.key ?? 'none'" class="blr-composition-journey">
      <header v-if="composition.journey" class="blr-composition-journey-header">
        <BlrTopologyResource :resource="composition.journey" @open="emit('open', $event)" />
        <span class="blr-composition-result">{{ composition.scenarios.length }} {{ composition.scenarios.length === 1 ? 'Scenario' : 'Scenarios' }}</span>
        <div v-if="composition.scenarios.length > capacity" class="blr-topology-window" aria-label="Scenario window">
          <UButton icon="i-lucide-chevron-left" aria-label="Previous Scenario" color="neutral" variant="outline" :disabled="startFor(composition) === 0" @click="move(composition, -1)" />
          <span>{{ startFor(composition) + 1 }}–{{ startFor(composition) + visibleFor(composition).length }} of {{ composition.scenarios.length }}</span>
          <UButton icon="i-lucide-chevron-right" aria-label="Next Scenario" color="neutral" variant="outline" :disabled="startFor(composition) + visibleFor(composition).length >= composition.scenarios.length" @click="move(composition, 1)" />
        </div>
      </header>
      <div class="blr-composition-columns" :style="{ gridTemplateColumns: `repeat(${Math.max(1, visibleFor(composition).length)}, minmax(0, 1fr))` }">
        <section v-for="scenario in visibleFor(composition)" :key="scenario.resource.key" class="blr-composition-column" :data-scenario-id="scenario.resource.id">
          <header>
            <BlrTopologyResource :resource="scenario.resource" @open="emit('open', $event)" />
            <span class="blr-composition-result">{{ scenario.resource.result === 'not-achieved' ? 'Not achieved' : 'Achieved' }} · {{ scenario.steps.length }} Capability Steps</span>
          </header>
          <div>
            <ol class="blr-composition-steps">
              <li v-for="step in scenario.steps" :key="step.id" :data-occurrence-id="step.id">
                <span class="blr-composition-step-number">{{ step.number }}</span>
                <div class="blr-composition-step">
                  <BlrTopologyResource :resource="step.resource" @open="emit('open', $event)" />
                  <p>{{ step.text }}</p>
                  <ul v-if="step.contexts.length" class="blr-composition-contexts">
                    <li v-for="context in step.contexts" :key="`${context.routeId}:${context.context.id}`">
                      <span v-if="context.routeName">{{ context.routeName }}</span>
                      <BlrTopologyResource v-if="context.resource" :resource="context.resource" @open="emit('open', $event)" />
                      <span v-else>{{ context.context.id }}</span>
                    </li>
                  </ul>
                </div>
              </li>
            </ol>
            <p v-if="!scenario.steps.length" class="blr-topology-note">This Scenario has no Capability-bearing Steps. Open it to read its complete sequence.</p>
          </div>
        </section>
      </div>
      <p v-if="!composition.scenarios.length" class="blr-topology-note">No Scenarios are modeled for this Journey.</p>
    </section>
    <p v-if="!compositions.length" class="blr-topology-empty">No Journeys are modeled.</p>
  </div>
</template>
