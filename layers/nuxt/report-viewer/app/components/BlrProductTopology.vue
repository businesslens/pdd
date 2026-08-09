<script setup lang="ts">
/**
 * The product-level topology workspace: seven named readings over one model.
 * The host owns the inspector; this component owns view choice, graph-local
 * visibility and focus, hover, and the Journey selector required by Journey
 * anatomy. None of this state reaches the Workbench navigation rail.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveEntityKey } from '../utils/reportWorkspace'
import { buildProductTopologyGraph } from '../utils/productTopologyGraphs'
import { filterProductTopologyGraph } from '../utils/productTopologyFilters'
import type { ProductTopologyViewId } from '../utils/productTopologyViews'
import {
  DEFAULT_PRODUCT_TOPOLOGY_VIEW,
  PRODUCT_TOPOLOGY_VIEWS,
  findProductTopologyView
} from '../utils/productTopologyViews'

const props = defineProps<{
  workspace: ReportWorkspace
  selectedId?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  clear: []
}>()

const viewId = ref<ProductTopologyViewId>(DEFAULT_PRODUCT_TOPOLOGY_VIEW)
const hoveredId = ref<string | null>(null)
const journeyId = ref(props.workspace.journeys[0]?.id ?? '')
const hiddenKinds = ref<ReportEntityKind[]>([])
const focusIds = ref<string[]>([])
const filtersOpen = ref(false)

const view = computed(() => findProductTopologyView(viewId.value))
const kindSteps = computed(() => view.value.flow.length
  ? view.value.flow
  : view.value.kinds.map(kind => ({ kind, label: ENTITY_KIND_META[kind].plural })))
const visibleKinds = computed(() => view.value.kinds.filter(kind => !hiddenKinds.value.includes(kind)))
const journeyItems = computed(() => props.workspace.journeys.map(journey => ({
  label: journey.title,
  value: journey.id
})))

const baseGraph = computed(() => buildProductTopologyGraph(props.workspace, viewId.value, {
  selectedId: props.selectedId,
  highlightId: hoveredId.value || props.selectedId,
  journeyId: journeyId.value
}))
const graph = computed(() => filterProductTopologyGraph(baseGraph.value, {
  visibleKinds: visibleKinds.value,
  focusEntityIds: focusIds.value
}))

const baseEntityIds = computed(() => new Set(baseGraph.value.nodes
  .map(node => node.data?.entityKey)
  .filter((id): id is string => Boolean(id))))
const focusItems = computed(() => view.value.kinds.flatMap((kind) => {
  if (kind === 'product' || hiddenKinds.value.includes(kind)) return []
  const entities = [...props.workspace.byKey.values()]
    .filter(entity => entity.kind === kind && baseEntityIds.value.has(entity.key))
  if (!entities.length) return []
  return [
    { type: 'label' as const, label: ENTITY_KIND_META[kind].plural, value: `blr-kind-${kind}` },
    ...entities.map(entity => ({
      label: entity.title,
      value: entity.key,
      icon: ENTITY_KIND_META[kind].icon,
      description: entity.id
    }))
  ]
}))
const activeFilterCount = computed(() => hiddenKinds.value.length + focusIds.value.length)
const filtersActive = computed(() => activeFilterCount.value > 0)

const entityNodeCount = computed(() => graph.value.nodes.filter(node => node.type !== 'blr-label').length)
const baseEntityNodeCount = computed(() => baseGraph.value.nodes.filter(node => node.type !== 'blr-label').length)
const emptyNote = computed(() => {
  if (entityNodeCount.value) return ''
  if (filtersActive.value && baseEntityNodeCount.value) return 'No entities match these topology filters.'
  switch (viewId.value) {
    case 'sitemap': return 'This model declares no Interfaces, so there is no visible surface to map.'
    case 'journey-anatomy': return 'This model declares no Journeys to unfold.'
    case 'domain-anatomy': return 'This model declares no Domains or Capabilities.'
    case 'rule-reach': return 'This model declares no Business Rules with reach to draw.'
    default: return 'This model has no entities in this view.'
  }
})

watch(viewId, () => {
  hoveredId.value = null
  hiddenKinds.value = []
  const compatible = baseEntityIds.value
  focusIds.value = focusIds.value.filter(id => compatible.has(id))
  if (props.selectedId && !graph.value.nodes.some(node => node.data?.entityKey === props.selectedId)) {
    emit('clear')
  }
})

watch(journeyId, () => {
  const compatible = baseEntityIds.value
  focusIds.value = focusIds.value.filter(id => compatible.has(id))
})

function setView(next: ProductTopologyViewId) {
  viewId.value = next
}

function separatorAt(index: number): string {
  return view.value.flow.length ? (view.value.separators[index - 1] ?? '·') : '·'
}

function kindVisible(kind: ReportEntityKind): boolean {
  return !hiddenKinds.value.includes(kind)
}

function toggleKind(kind: ReportEntityKind) {
  if (hiddenKinds.value.includes(kind)) {
    hiddenKinds.value = hiddenKinds.value.filter(item => item !== kind)
    return
  }
  if (visibleKinds.value.length === 1) return
  hiddenKinds.value = [...hiddenKinds.value, kind]
  focusIds.value = focusIds.value.filter((id) => {
    const entity = resolveEntityKey(props.workspace, id)
    return entity?.kind !== kind
  })
}

function setFocus(ids: string[]) {
  const compatible = new Set(focusItems.value
    .filter(item => !('type' in item && item.type === 'label'))
    .map(item => item.value))
  focusIds.value = ids.filter(id => compatible.has(id))
}

function resetFilters() {
  hiddenKinds.value = []
  focusIds.value = []
}

function selectEntity(entityId: string) {
  const entity = resolveEntityKey(props.workspace, entityId)
  if (entity) emit('select', entity)
}
</script>

<template>
  <div class="blr-product-topology flex h-full min-h-0 flex-col">
    <div class="shrink-0 border-b border-default px-2 pt-2">
      <div class="overflow-x-auto pb-2">
        <div class="inline-flex min-w-max items-center gap-0.5 rounded-lg bg-elevated p-0.5" role="tablist" aria-label="Product topology views">
          <button
            v-for="item in PRODUCT_TOPOLOGY_VIEWS"
            :key="item.id"
            type="button"
            role="tab"
            class="blr-topology-tab"
            :data-current="item.id === viewId"
            :aria-selected="item.id === viewId"
            @click="setView(item.id)"
          >
            {{ item.name }}
          </button>
        </div>
      </div>

      <div class="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 border-t border-muted py-2">
        <p class="text-sm text-muted">{{ view.question }}</p>
        <div class="flex flex-wrap items-center gap-1" :aria-label="`Entity visibility for ${view.name}`">
          <template v-for="(step, index) in kindSteps" :key="`${view.id}:${step.kind}`">
            <span v-if="index" class="px-0.5 text-xs text-dimmed">{{ separatorAt(index) }}</span>
            <button
              type="button"
              class="blr-topology-kind"
              :data-visible="kindVisible(step.kind)"
              :aria-pressed="kindVisible(step.kind)"
              :disabled="visibleKinds.length === 1 && kindVisible(step.kind)"
              :aria-label="`${kindVisible(step.kind) ? 'Hide' : 'Show'} ${step.label} in ${view.name}`"
              :title="visibleKinds.length === 1 && kindVisible(step.kind)
                ? 'At least one entity type must remain visible.'
                : `${kindVisible(step.kind) ? 'Hide' : 'Show'} ${step.label} in this graph`"
              @click="toggleKind(step.kind)"
            >
              <BlrKind :kind="step.kind" :labelled="false" size="xs" />
              <span class="font-mono text-[10px] uppercase tracking-[0.07em] text-muted">{{ step.label }}</span>
            </button>
          </template>
        </div>
        <div class="ms-auto flex shrink-0 items-center gap-1.5">
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            class="capitalize"
            :title="view.semantics === 'identity'
              ? 'One node per entity, even when it appears in several contexts.'
              : 'An entity repeats once per context; repetition is part of the answer.'"
          >
            {{ view.semantics }}
          </UBadge>
          <UButton
            icon="i-lucide-list-filter"
            color="neutral"
            :variant="filtersOpen ? 'soft' : 'ghost'"
            size="xs"
            :label="activeFilterCount ? `Filters ${activeFilterCount}` : 'Filters'"
            :aria-expanded="filtersOpen"
            @click="filtersOpen = !filtersOpen"
          />
          <UButton
            v-if="filtersActive"
            icon="i-lucide-filter-x"
            color="neutral"
            variant="ghost"
            size="xs"
            label="Reset"
            @click="resetFilters"
          />
        </div>
      </div>

      <div v-if="filtersOpen" class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 border-t border-muted py-2">
        <span class="blr-field">Focus entities</span>
        <USelectMenu
          :model-value="focusIds"
          :items="focusItems"
          value-key="value"
          multiple
          size="xs"
          variant="outline"
          icon="i-lucide-focus"
          class="min-w-72 max-w-full"
          placeholder="Choose entities"
          :search-input="{ placeholder: 'Search entities in this view…' }"
          @update:model-value="setFocus($event as string[])"
        >
          <template #default>
            <span class="truncate">{{ focusIds.length ? `${focusIds.length} focused` : 'Choose entities' }}</span>
          </template>
        </USelectMenu>
        <p class="min-w-52 flex-1 text-xs text-dimmed">
          Focus keeps each match and its directly connected context.
        </p>
        <UButton
          v-if="focusIds.length"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          label="Clear focus"
          @click="focusIds = []"
        />
      </div>

      <div v-if="view.note || viewId === 'journey-anatomy'" class="flex min-h-9 flex-wrap items-center gap-2 border-t border-muted py-2">
        <template v-if="viewId === 'journey-anatomy'">
          <span class="blr-field">Journey</span>
          <USelect
            v-model="journeyId"
            :items="journeyItems"
            value-key="value"
            size="xs"
            class="min-w-60"
            icon="i-lucide-route"
            placeholder="Choose a Journey"
          />
        </template>
        <p v-if="view.note" class="min-w-0 flex-1 text-xs italic text-dimmed">{{ view.note }}</p>
      </div>
    </div>

    <div v-if="!emptyNote" class="relative min-h-0 flex-1">
      <BlrFlowCanvas
        :nodes="graph.nodes"
        :edges="graph.edges"
        :fit-padding="viewId === 'everything' ? 0.08 : 0.14"
        :max-zoom="viewId === 'everything' ? 0.9 : 1.25"
        @select="selectEntity"
        @focus="selectEntity"
        @hover="hoveredId = $event"
        @clear="emit('clear')"
      />
      <span class="pointer-events-none absolute bottom-3 left-3 rounded-md border border-default bg-default/90 px-2 py-1 font-mono text-[10px] text-dimmed shadow-sm backdrop-blur">
        {{ entityNodeCount }} boxes · {{ graph.edges.length }} relations
      </span>
    </div>
    <div v-else class="grid min-h-0 flex-1 place-items-center p-8">
      <div class="flex max-w-md flex-col items-center gap-3 text-center">
        <p class="text-sm italic text-muted">{{ emptyNote }}</p>
        <UButton
          v-if="filtersActive"
          icon="i-lucide-filter-x"
          color="neutral"
          variant="outline"
          size="xs"
          label="Reset filters"
          @click="resetFilters"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.blr-topology-tab {
  padding: 0.38rem 0.72rem;
  border-radius: 0.45rem;
  color: var(--ui-text-muted);
  font-size: var(--text-sm);
  line-height: 1.2;
  transition: background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
}

.blr-topology-tab:hover {
  color: var(--ui-text-highlighted);
}

.blr-topology-tab[data-current='true'] {
  background: var(--ui-bg);
  color: var(--ui-text-highlighted);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--ui-text) 12%, transparent);
  font-weight: 600;
}

.blr-topology-kind {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-bg);
  transition: opacity 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.blr-topology-kind:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-elevated);
}

.blr-topology-kind[data-visible='false'] {
  opacity: 0.38;
  background: transparent;
}

.blr-topology-kind:disabled {
  cursor: not-allowed;
}
</style>
