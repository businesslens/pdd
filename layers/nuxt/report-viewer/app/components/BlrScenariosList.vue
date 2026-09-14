<script setup lang="ts">
/** A parent's Scenarios as expandable cards with labelled Steps in authored order. */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { childrenOf } from '../utils/pageSections'
import type { ColumnChoice } from '../composables/useColumns'
import { scenarioTerm } from '../utils/vocabulary'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView, columns: ColumnChoice }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()

const scenarios = computed(() => childrenOf(props.workspace, props.resource) as ScenarioView[])
const scenarioKind = computed(() => props.resource.kind === 'journey' ? 'journey-scenario' as const : 'capability-scenario' as const)

/* Which Scenarios are open to their Steps, and which show their further
   details — decisions and edge cases — inside the card. Both start closed, as
   rows do everywhere else. */
const openScenarios = ref<string[]>([])
const openDetails = ref<string[]>([])
const isOpen = (scenario: ScenarioView) => openScenarios.value.includes(scenario.key)
const detailsOpen = (scenario: ScenarioView) => openDetails.value.includes(scenario.key)
const hasDetails = (scenario: ScenarioView) => scenario.decisionPoints.length > 0 || scenario.edgeCases.length > 0
function toggleScenario(scenario: ScenarioView) {
  openScenarios.value = isOpen(scenario) ? openScenarios.value.filter(key => key !== scenario.key) : [...openScenarios.value, scenario.key]
}
function toggleDetails(scenario: ScenarioView) {
  openDetails.value = detailsOpen(scenario) ? openDetails.value.filter(key => key !== scenario.key) : [...openDetails.value, scenario.key]
}
function toggleAll(open: boolean) {
  openScenarios.value = open ? scenarios.value.map(item => item.key) : []
  openDetails.value = open ? scenarios.value.filter(hasDetails).map(item => item.key) : []
}

/* The page places the list controls beside its tabs. Expansion stays local
   to this reading, including the additional details opened by Expand all. */
defineExpose({ toggleAll })
const rowGrid = computed(() => props.columns > 1
  ? { display: 'grid', gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`, gap: '0.5rem', alignItems: 'start' }
  : undefined)

/* The vocabulary slug for a Scenario word, as the page resolves it. */
const scenarioWord = (word: 'trigger' | 'outcome' | 'decision-point' | 'edge-case') =>
  scenarioTerm(scenarioKind.value === 'journey-scenario' ? 'journey' : 'capability', word)

</script>

<template>
  <p v-if="!scenarios.length" class="text-sm text-muted italic">
    No Scenarios name this {{ ENTITY_KIND_META[resource.kind].label }}.
  </p>
  <div v-else data-scenarios-v2>
    <div class="space-y-2" :style="rowGrid" data-collection-rows>
      <div v-for="scenario in scenarios" :key="scenario.key" class="blr-row-tree" :data-row-key="scenario.key">
        <!-- The cards drawing: the Scenario itself is read on the card, open
             or closed — what starts it, how it ends, what it touches and where
             it leaves each thing. Opening it adds only the Steps. -->
        <BlrScenarioSummary
          :workspace="workspace"
          :scenario="scenario"
          :expanded="isOpen(scenario)"
          :details-expanded="detailsOpen(scenario)"
          @toggle="toggleScenario(scenario)"
          @details="toggleDetails(scenario)"
          @open="emit('open', $event)"
        >
          <ol class="blr-steps-list">
            <li v-for="(step, index) in scenario.steps" :key="index" :data-step="index + 1">
              <span class="blr-steps-number">{{ index + 1 }}</span>
              <BlrScenarioStep :workspace="workspace" :scenario="scenario" :step="step" :index="index" @open="emit('open', $event)" />
            </li>
          </ol>
          <template #details>
            <section v-if="scenario.decisionPoints.length" class="space-y-2">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('decision-point')" text="Decision points" /> <span class="blr-meta">{{ scenario.decisionPoints.length }}</span></h3>
              <div class="grid gap-3 lg:grid-cols-2">
                <div v-for="point in scenario.decisionPoints" :key="point.title" class="rounded-xl border border-dashed border-accented p-4">
                  <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
                    <UIcon name="i-lucide-git-branch" class="size-4 text-muted" />{{ point.title }}
                  </p>
                  <BlrProse :text="point.question" class="mt-2" />
                  <ul class="mt-3 space-y-2">
                    <li v-for="branch in point.branches" :key="branch.condition" class="flex items-start gap-2 text-sm">
                      <code class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-highlighted">{{ branch.condition }}</code>
                      <UIcon name="i-lucide-arrow-right" class="mt-1 size-3 shrink-0 text-dimmed" />
                      <span class="text-default">{{ branch.outcome }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
            <section v-if="scenario.edgeCases.length" class="space-y-1">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('edge-case')" text="Edge cases" /> <span class="blr-meta">{{ scenario.edgeCases.length }}</span></h3>
              <ul class="max-w-3xl space-y-1.5 text-sm text-default">
                <li v-for="edgeCase in scenario.edgeCases" :key="edgeCase" class="flex gap-2">
                  <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
                </li>
              </ul>
            </section>
          </template>
        </BlrScenarioSummary>
      </div>
    </div>
  </div>
</template>
