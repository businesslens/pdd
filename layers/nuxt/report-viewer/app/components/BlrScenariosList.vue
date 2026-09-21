<script setup lang="ts">
/** A parent's Scenarios as expandable cards with labelled Steps in authored order. */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import type { ResourceChange } from 'businesslens/report'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { childrenOf } from '../utils/pageSections'
import type { ColumnChoice } from '../composables/useColumns'
import { resourceReviewKey, reviewResource, reviewRows, reviewStepValue } from '../utils/resourceReview'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  changes?: ReadonlyMap<string, ResourceChange>
  columns: ColumnChoice
  /** A Scenario reached by URL or search opens its card inside the parent. */
  selectedKey?: string | null
  revealSelected?: boolean
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()

const review = inject(resourceReviewKey, computed(() => null))
const beforeParent = computed(() => reviewResource(review.value, 'before', props.resource.key))
const afterParent = computed(() => reviewResource(review.value, 'after', props.resource.key))
const scenarioRows = computed(() => reviewRows(
  beforeParent.value && review.value?.before ? childrenOf(review.value.before.workspace, beforeParent.value) as ScenarioView[] : [],
  review.value ? afterParent.value && review.value.after ? childrenOf(review.value.after.workspace, afterParent.value) as ScenarioView[] : [] : childrenOf(props.workspace, props.resource) as ScenarioView[],
  !!review.value, scenario => ({ title: scenario.title, trigger: scenario.trigger, outcome: scenario.outcome, steps: scenario.steps.map(reviewStepValue), decisionPoints: scenario.decisionPoints, edgeCases: scenario.edgeCases, result: scenario.result }), scenario => scenario.key))
const scenarios = computed(() => scenarioRows.value.map(row => (row.after ?? row.before)!))
const changeKind = (change?: 'added' | 'modified' | 'deleted' | null) => change === 'modified' ? 'changed' as const : change === 'deleted' ? 'removed' as const : change ?? undefined
const scenarioRow = (key: string) => scenarioRows.value.find(row => (row.after ?? row.before)!.key === key)
const detailsValue = (scenario?: ScenarioView) => scenario && (scenario.decisionPoints.length || scenario.edgeCases.length) ? [scenario.decisionPoints, scenario.edgeCases] : undefined
const stepsFor = (scenario: ScenarioView) => reviewRows(scenarioRow(scenario.key)?.before?.steps, scenarioRow(scenario.key)?.after?.steps ?? [], !!review.value, reviewStepValue)
function openStepResource(resource: AnyResourceView, removed: boolean) {
  if (removed && review.value?.before) review.value.inspect(resource.key, review.value.before.state)
  else emit('open', resource)
}
const scenarioKind = computed(() => props.resource.kind === 'journey' ? 'journey-scenario' as const : 'capability-scenario' as const)

/* One expansion opens Steps, decisions and edge cases.
   Scenario cards start closed, as rows do everywhere else. */
const openScenarios = useBlrScenarioExpansion(
  computed(() => JSON.stringify([props.workspace.identity.id, props.resource.key])),
  computed(() => scenarios.value.map(item => item.key)),
  computed(() => props.selectedKey ?? null)
)
const scenariosRoot = useTemplateRef('scenariosRoot')

watch([scenariosRoot, () => props.selectedKey], async ([root, key], _previous, onCleanup) => {
  if (!root || !key || props.revealSelected === false) return
  let cancelled = false
  onCleanup(() => { cancelled = true })
  await nextTick()
  await document.fonts.ready
  // Let the host restore its pane before bringing the requested card into view.
  requestAnimationFrame(() => {
    if (cancelled) return
    const row = [...root.querySelectorAll<HTMLElement>('[data-row-key]')].find(item => item.dataset.rowKey === key)
    row?.querySelector<HTMLElement>('[data-scenario-summary]')?.scrollIntoView({ block: 'start' })
  })
}, { flush: 'post' })

const isOpen = (scenario: ScenarioView) => openScenarios.value.includes(scenario.key)
function toggleScenario(scenario: ScenarioView) {
  openScenarios.value = isOpen(scenario) ? openScenarios.value.filter(key => key !== scenario.key) : [...openScenarios.value, scenario.key]
}
function toggleAll(open: boolean) {
  openScenarios.value = open ? scenarios.value.map(item => item.key) : []
}

/* The page places the list controls beside its tabs. Expansion is remembered
   for this parent, including the additional details opened by Expand all. */
defineExpose({ toggleAll })
const rowGrid = computed(() => props.columns > 1
  ? { display: 'grid', gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`, gap: '0.5rem', alignItems: 'start' }
  : undefined)

</script>

<template>
  <p v-if="!scenarios.length" class="text-sm text-muted italic">
    No Scenarios name this {{ ENTITY_KIND_META[resource.kind].label }}.
  </p>
  <div v-else ref="scenariosRoot" data-scenarios>
    <div class="space-y-2" :style="rowGrid" data-collection-rows>
      <div v-for="scenario in scenarios" :key="scenario.key" class="blr-row-tree" :data-row-key="scenario.key">
        <!-- The cards drawing: the Scenario itself is read on the card, open
             or closed — what starts it, how it ends, what it touches and where
             it leaves each thing. Opening it adds Steps and details. -->
        <BlrScenarioSummary
          :workspace="workspace"
          :scenario="scenario"
          :change="review ? changeKind(scenarioRow(scenario.key)?.change) : changes?.get(scenario.key)?.change"
          :expanded="isOpen(scenario)"
          @toggle="toggleScenario(scenario)"
          @open="emit('open', $event)"
        >
          <ol class="blr-steps-list">
            <li v-for="(row, index) in stepsFor(scenario)" :key="index" :data-step="(row.afterIndex ?? row.beforeIndex ?? 0) + 1">
              <span class="blr-steps-number">{{ (row.afterIndex ?? row.beforeIndex ?? 0) + 1 }}</span>
              <BlrReviewValue class="min-w-0 flex-1" :before="row.before ? 'Step' : undefined" :after="row.after ? 'Step' : undefined" label="Step">
                <BlrReviewSnapshot :side="!row.after ? review?.before : null">
                  <BlrScenarioStep :workspace="!row.after && review?.before ? review.before.workspace : workspace" :scenario="scenario" :step="(row.after ?? row.before)!" :index="index" :previous="row.before" :compared="row.change === 'modified'" @open="openStepResource($event, !row.after)" />
                </BlrReviewSnapshot>
              </BlrReviewValue>
            </li>
          </ol>
          <template #details>
            <BlrReviewValue :before="detailsValue(scenarioRow(scenario.key)?.before)" :after="detailsValue(scenarioRow(scenario.key)?.after)" label="Scenario details">
              <BlrScenarioDetails :scenario="detailsValue(scenario) ? scenario : scenarioRow(scenario.key)?.before ?? scenario" />
              <template #before><BlrScenarioDetails v-if="scenarioRow(scenario.key)?.before" :scenario="scenarioRow(scenario.key)!.before!" /></template>
            </BlrReviewValue>
          </template>
        </BlrScenarioSummary>
      </div>
    </div>
  </div>
</template>
