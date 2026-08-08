<script setup lang="ts">
/**
 * The product-level topology workspace: seven named readings over one model.
 * The host owns the inspector; this component owns view choice, hover and the
 * one Journey selector required by Journey anatomy.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { buildProductTopologyGraph } from '../utils/productTopologyGraphs'
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

const view = computed(() => findProductTopologyView(viewId.value))
const journeyItems = computed(() => props.workspace.journeys.map(journey => ({
  label: journey.title,
  value: journey.id
})))

const graph = computed(() => buildProductTopologyGraph(props.workspace, viewId.value, {
  selectedId: props.selectedId,
  highlightId: hoveredId.value || props.selectedId,
  journeyId: journeyId.value
}))

const entityNodeCount = computed(() => graph.value.nodes.filter(node => node.data?.entityId).length)
const emptyNote = computed(() => {
  if (entityNodeCount.value) return ''
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
  if (props.selectedId && !graph.value.nodes.some(node => node.data?.entityId === props.selectedId)) {
    emit('clear')
  }
})

function setView(next: ProductTopologyViewId) {
  viewId.value = next
}

function selectEntity(entityId: string) {
  const entity = props.workspace.byId.get(entityId)
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
        <div v-if="view.flow.length" class="flex flex-wrap items-center gap-1" :aria-label="`Derivation for ${view.name}`">
          <template v-for="(step, index) in view.flow" :key="`${view.id}:${step.kind}`">
            <span v-if="index" class="px-0.5 text-xs text-dimmed">{{ view.separators[index - 1] }}</span>
            <span class="inline-flex items-center gap-1 rounded-full border border-default bg-default px-2 py-0.5">
              <BlrKind :kind="step.kind" :labelled="false" size="xs" />
              <span class="font-mono text-[10px] uppercase tracking-[0.07em] text-muted">{{ step.label }}</span>
            </span>
          </template>
        </div>
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
          class="ms-auto shrink-0 capitalize"
          :title="view.semantics === 'identity'
            ? 'One node per entity, even when it appears in several contexts.'
            : 'An entity repeats once per context; repetition is part of the answer.'"
        >
          {{ view.semantics }}
        </UBadge>
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
      <p class="max-w-md text-center text-sm italic text-muted">{{ emptyNote }}</p>
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
</style>
