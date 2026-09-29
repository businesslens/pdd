<script setup lang="ts">
/**
 * A parent's Scenarios as expandable cards with labelled Steps in authored order.
 * Alternative Scenarios of one Variation are one card, at the first one's place,
 * switched in place from its title; the tab still counts every Scenario.
 */
import type { AnyResourceView, ReportWorkspace, ScenarioView, VariationSetView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { childrenOf } from '../utils/pageSections'
import { resourceOpenerKey } from '../utils/resourceNavigation'
import { collapseVariations } from '../utils/variations'
import type { ColumnChoice } from '../composables/useColumns'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  columns: ColumnChoice
  /** A Scenario reached by URL or search opens its card inside the parent. */
  selectedKey?: string | null
  revealSelected?: boolean
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const opener = inject(resourceOpenerKey, null)

const scenarios = computed(() => childrenOf(props.workspace, props.resource) as ScenarioView[])
interface Card { key: string, set?: VariationSetView, alternatives: ScenarioView[] }
const cards = computed<Card[]>(() => collapseVariations(props.workspace, scenarios.value).map(item => item.kind === 'variation'
  ? { key: item.key, set: item, alternatives: scenarios.value.filter(scenario => scenario.variation?.key === item.key)
      .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.key.localeCompare(b.key, 'en')) }
  : { key: item.key, alternatives: [item as ScenarioView] }))
const selectedCard = computed(() => cards.value.find(card => card.alternatives.some(item => item.key === props.selectedKey))?.key ?? null)

/* The alternative each set card reads: the one the address asked for, the
   reader's last pick, or the first by title — display order, never a default. */
const scope = computed(() => JSON.stringify([props.workspace.identity.id, props.resource.key]))
const picks = useState<Record<string, Record<string, string>>>('blr:scenario-picks', () => ({}))
const picked = computed(() => picks.value[scope.value] ?? {})
function remember(card: string, scenario: string) {
  picks.value = { ...picks.value, [scope.value]: { ...picked.value, [card]: scenario } }
  try { sessionStorage.setItem(`blr:scenario-picks:${location.pathname}:${scope.value}`, JSON.stringify(picks.value[scope.value])) } catch { /* Optional persistence. */ }
}
onMounted(() => {
  if (picks.value[scope.value]) return
  try {
    const saved = JSON.parse(sessionStorage.getItem(`blr:scenario-picks:${location.pathname}:${scope.value}`) ?? 'null')
    if (saved && typeof saved === 'object') picks.value = { ...picks.value, [scope.value]: saved }
  } catch { /* Start from the address or the first alternative. */ }
})
watch(() => props.selectedKey, (key) => {
  const card = cards.value.find(item => item.set && item.alternatives.some(alternative => alternative.key === key))
  if (card && key) remember(card.key, key)
}, { immediate: true })
const current = (card: Card) => card.alternatives.find(item => item.key === picked.value[card.key]) ?? card.alternatives[0]!
/* Switching keeps the parent's reading; an address naming this set follows the pick without a history entry. */
function choose(card: Card, scenario: AnyResourceView) {
  remember(card.key, scenario.key)
  if (opener && props.selectedKey && card.alternatives.some(item => item.key === props.selectedKey)) opener(scenario.key, undefined, { replace: true })
}

/* One expansion opens Steps, decisions and edge cases.
   Scenario cards start closed, as rows do everywhere else. */
const openScenarios = useBlrScenarioExpansion(
  scope,
  computed(() => cards.value.map(item => item.key)),
  selectedCard
)
const scenariosRoot = useTemplateRef('scenariosRoot')

watch([scenariosRoot, selectedCard], async ([root, key], _previous, onCleanup) => {
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

const isOpen = (card: Card) => openScenarios.value.includes(card.key)
function toggleScenario(card: Card) {
  openScenarios.value = isOpen(card) ? openScenarios.value.filter(key => key !== card.key) : [...openScenarios.value, card.key]
}
function toggleAll(open: boolean) {
  openScenarios.value = open ? cards.value.map(item => item.key) : []
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
      <div v-for="card in cards" :key="card.key" class="blr-row-tree" :data-row-key="card.key">
        <!-- The cards drawing: the Scenario itself is read on the card, open
             or closed — what starts it, how it ends, what it touches and where
             it leaves each thing. Opening it adds Steps and details. -->
        <BlrScenarioSummary
          :workspace="workspace"
          :scenario="current(card)"
          :expanded="isOpen(card)"
          :switchable="Boolean(card.set)"
          @toggle="toggleScenario(card)"
          @open="emit('open', $event)"
          @pick="choose(card, $event)"
        >
          <BlrScenarioSteps :workspace="workspace" :scenario="current(card)" @open="emit('open', $event)" />
          <template #details><BlrScenarioDetails :scenario="current(card)" /></template>
        </BlrScenarioSummary>
      </div>
    </div>
  </div>
</template>
