<script setup lang="ts">
/**
 * The Steps drawing of one Scenario: the ordered list, with a Steps /
 * Storyboard selector beside the route selector. Storyboard adds the selected
 * route's frames above the same list — the set on screen is unchanged — and
 * selecting a frame scrolls the list to that Step, and vice versa. The choice
 * and the selected Step are remembered per Scenario, as Lifecycle remembers
 * its drawing, so they survive refresh, Back and route changes.
 */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { storyboard as storyboardOf } from '../utils/sketch'

const props = defineProps<{ workspace: ReportWorkspace, scenario: ScenarioView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })

interface StepsReading { drawing: 'steps' | 'storyboard', selected: number | null }
const reading = ref<StepsReading>({ drawing: 'steps', selected: null })
const storageKey = computed(() => `blr:steps:${import.meta.client ? location.pathname : ''}:${JSON.stringify([props.workspace.identity.id, props.scenario.key])}`)
watch(storageKey, () => {
  reading.value = { drawing: 'steps', selected: null }
  if (!import.meta.client) return
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey.value) ?? 'null')
    if (saved) reading.value = {
      drawing: saved.drawing === 'storyboard' ? 'storyboard' : 'steps',
      selected: Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < props.scenario.steps.length ? saved.selected : null
    }
  } catch { /* Optional persistence. */ }
}, { immediate: true })
watch(reading, (value) => {
  if (import.meta.client) try { sessionStorage.setItem(storageKey.value, JSON.stringify(value)) } catch { /* Reading works without storage. */ }
}, { deep: true })

/* The route the Storyboard draws: the host's, where this Scenario has it, else the first. */
const route = computed(() => props.scenario.routes.find(item => item.id === scenarioRoute.value) ?? props.scenario.routes[0] ?? null)
const routeItems = computed(() => props.scenario.routes.map(item => ({ label: item.name, value: item.id, icon: 'i-lucide-split' })))
const board = computed(() => reading.value.drawing === 'storyboard' && route.value ? storyboardOf(props.workspace, props.scenario.id, route.value.id) : null)
const canStoryboard = computed(() => props.scenario.routes.length > 0)

const list = useTemplateRef('list')
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
function revealStep(index: number | null) {
  if (index === null) return
  const item = list.value?.querySelector<HTMLElement>(`:scope > li[data-step="${index + 1}"]`)
  item?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })
}
/* From the storyboard: the list follows. From the list: the storyboard follows through its own model. */
function selectFromBoard(index: number | null) {
  reading.value.selected = index
  void nextTick(() => revealStep(index))
}
function selectFromList(index: number) {
  reading.value.selected = reading.value.selected === index ? null : index
}
function draw(drawing: 'steps' | 'storyboard') { reading.value.drawing = drawing }
</script>

<template>
  <div class="space-y-3" data-scenario-steps-drawing :data-drawing="reading.drawing">
    <div v-if="canStoryboard" class="flex flex-wrap items-center justify-end gap-2" data-steps-controls>
      <USelect
        v-if="reading.drawing === 'storyboard' && scenario.routes.length > 1"
        :model-value="route?.id"
        :items="routeItems"
        value-key="value"
        size="sm"
        variant="outline"
        icon="i-lucide-split"
        class="min-w-40 max-w-full"
        aria-label="Route to draw"
        data-route-select
        @update:model-value="scenarioRoute = String($event)"
      />
      <UFieldGroup size="sm" aria-label="Steps drawing">
        <UTooltip text="Steps"><UButton icon="i-lucide-rows-3" :color="reading.drawing === 'steps' ? 'primary' : 'neutral'" :variant="reading.drawing === 'steps' ? 'soft' : 'outline'" :aria-pressed="reading.drawing === 'steps'" aria-label="Draw as steps" @click="draw('steps')" /></UTooltip>
        <UTooltip text="Storyboard"><UButton icon="i-lucide-gallery-horizontal" :color="reading.drawing === 'storyboard' ? 'primary' : 'neutral'" :variant="reading.drawing === 'storyboard' ? 'soft' : 'outline'" :aria-pressed="reading.drawing === 'storyboard'" aria-label="Draw as storyboard" @click="draw('storyboard')" /></UTooltip>
      </UFieldGroup>
    </div>

    <BlrStoryboard v-if="board" :workspace="workspace" :storyboard="board" :selected="reading.selected" @update:selected="selectFromBoard" @open="emit('open', $event)" />

    <ol ref="list" class="blr-steps-list">
      <li v-for="(step, index) in scenario.steps" :key="index" :data-step="index + 1" :data-selected="board && reading.selected === index || undefined">
        <button v-if="board" type="button" class="blr-steps-number" :aria-pressed="reading.selected === index" :aria-label="`Show step ${index + 1} in the storyboard`" @click="selectFromList(index)">{{ index + 1 }}</button>
        <span v-else class="blr-steps-number">{{ index + 1 }}</span>
        <BlrScenarioStep :workspace="workspace" :scenario="scenario" :step="step" :index="index" @open="emit('open', $event)" />
      </li>
    </ol>
  </div>
</template>
