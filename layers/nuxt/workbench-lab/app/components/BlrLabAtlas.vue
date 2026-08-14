<script setup lang="ts">
/**
 * Atlas — the map is the application.
 *
 * Premise: a Product Model is a territory, and position carries meaning. There
 * is no collection to choose and no list to scroll, because a list throws away
 * the one thing a graph has: what sits next to what.
 *
 * The Workbench treats topology as a destination you visit. Atlas inverts that
 * — the canvas is where you always are, kinds are layers you switch on and off,
 * and reading an entity docks beside the map rather than replacing it. Your
 * place is literal: the viewport does not move when you read.
 *
 * The honest cost is stated in the variant registry: finding something you
 * cannot already see, and reading two thousand pixels of authored body in a
 * dock. ⌘K answers the first. The second is the question this audition asks.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, resolveEntityKey } from '../utils/model'
import type { WorkbenchVariant } from '../utils/workbenchVariants'
import {
  DEFAULT_PRODUCT_TOPOLOGY_VIEW,
  PRODUCT_TOPOLOGY_VIEWS,
  findProductTopologyView,
  type ProductTopologyViewId
} from '../../../report-viewer/app/utils/productTopologyViews'
import { buildProductTopologyGraph, filterProductTopologyGraph } from '../utils/model'

const props = defineProps<{
  workspace: ReportWorkspace
  variant: WorkbenchVariant
  logoSrc?: string | null
}>()

const viewId = ref<ProductTopologyViewId>(DEFAULT_PRODUCT_TOPOLOGY_VIEW)
const selected = ref<AnyEntityView | null>(null)
const hiddenKinds = ref<ReportEntityKind[]>([])
const journeyId = ref(props.workspace.journeys[0]?.id ?? '')
/** Empty means the whole territory; one key means one hop around it. */
const focusKey = ref<string | null>(null)

const view = computed(() => findProductTopologyView(viewId.value))
const visibleKinds = computed(() => view.value.kinds.filter(kind => !hiddenKinds.value.includes(kind)))

const baseGraph = computed(() => buildProductTopologyGraph(props.workspace, viewId.value, {
  selectedId: selected.value?.key ?? null,
  highlightId: selected.value?.key ?? null,
  journeyId: journeyId.value
}))

const graph = computed(() => filterProductTopologyGraph(baseGraph.value, {
  visibleKinds: visibleKinds.value,
  focusEntityIds: focusKey.value ? [focusKey.value] : []
}))

const boxCount = computed(() => graph.value.nodes.filter(node => node.type !== 'blr-label').length)

/* Layers, in the order the view reads them, each with what it would remove. */
const layers = computed(() => view.value.kinds
  .filter(kind => kind !== 'product')
  .map(kind => ({
    kind,
    meta: ENTITY_KIND_META[kind],
    on: !hiddenKinds.value.includes(kind),
    count: baseGraph.value.nodes.filter(node => node.data?.kind === kind && node.type !== 'blr-label').length
  }))
  .filter(layer => layer.count > 0))

function toggleLayer(kind: ReportEntityKind) {
  if (hiddenKinds.value.includes(kind)) {
    hiddenKinds.value = hiddenKinds.value.filter(item => item !== kind)
    return
  }
  /* One layer must remain, or the map is a blank page with controls. */
  if (visibleKinds.value.length <= 1) return
  hiddenKinds.value = [...hiddenKinds.value, kind]
}

function selectKey(key: string) {
  const entity = resolveEntityKey(props.workspace, key)
  if (entity) selected.value = entity
}

function pick(entity: AnyEntityView) {
  selected.value = entity
  /* Landing from ⌘K on something outside the current view would otherwise
     select an entity the map cannot draw. Widen rather than fail. */
  if (!baseGraph.value.nodes.some(node => node.data?.entityKey === entity.key)) {
    viewId.value = 'everything'
    hiddenKinds.value = []
  }
}

watch(viewId, () => {
  hiddenKinds.value = []
  focusKey.value = null
})

const status = computed(() => `${view.value.name} · ${boxCount.value} boxes`)
</script>

<template>
  <BlrLabFrame :workspace="workspace" :variant="variant" :logo-src="logoSrc" :status="status" @select="pick">
    <div class="flex min-h-0 flex-1 flex-col">
      <!-- The question this map answers, then the layers that draw it. -->
      <div class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-default px-4 py-2">
        <USelect
          v-model="viewId"
          :items="PRODUCT_TOPOLOGY_VIEWS.map(item => ({ label: item.name, value: item.id }))"
          size="xs"
          variant="outline"
          icon="i-lucide-map"
          class="min-w-40"
        />
        <p class="min-w-0 flex-1 truncate text-sm text-muted">{{ view.question }}</p>
        <USelect
          v-if="viewId === 'value-paths' && workspace.journeys.length"
          v-model="journeyId"
          :items="workspace.journeys.map(journey => ({ label: journey.title, value: journey.id }))"
          size="xs"
          variant="outline"
          icon="i-lucide-route"
          class="min-w-44"
        />
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default bg-elevated/20 px-4 py-2">
        <span class="blr-atlas-label me-1">Layers</span>
        <button
          v-for="layer in layers"
          :key="layer.kind"
          type="button"
          class="blr-atlas-layer"
          :data-on="layer.on"
          :style="{ '--kind-color': `var(--blr-slot-${layer.meta.slot})` }"
          :title="layer.on ? `Hide ${layer.meta.plural}` : `Show ${layer.meta.plural}`"
          @click="toggleLayer(layer.kind)"
        >
          <UIcon :name="layer.meta.icon" class="size-3.5 shrink-0" />
          {{ layer.meta.plural }}
          <span class="font-mono text-[10px] opacity-60">{{ layer.count }}</span>
        </button>

        <span class="ms-auto flex items-center gap-1.5">
          <UButton
            v-if="focusKey"
            icon="i-lucide-maximize-2"
            color="neutral"
            variant="outline"
            size="xs"
            label="Whole map"
            @click="focusKey = null"
          />
          <UButton
            v-else-if="selected"
            icon="i-lucide-crosshair"
            color="neutral"
            variant="outline"
            size="xs"
            label="Focus here"
            @click="focusKey = selected.key"
          />
        </span>
      </div>

      <div class="min-h-0 flex-1">
        <BlrFlowCanvas
          :key="viewId"
          :nodes="graph.nodes"
          :edges="graph.edges"
          @select="selectKey"
        />
      </div>
    </div>

    <!--
      The dock, not a slideover: reading never covers the map, because the map is
      the thing you would lose your place in.
    -->
    <aside class="hidden w-[26rem] shrink-0 flex-col border-s border-default xl:flex">
      <div v-if="selected" class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2.5">
        <BlrKind :kind="selected.kind" :labelled="false" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-highlighted">{{ selected.title }}</span>
        <UButton
          icon="i-lucide-crosshair"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Focus the map here"
          title="Narrow the map to this entity and one hop around it"
          @click="focusKey = selected.key"
        />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Close"
          @click="selected = null"
        />
      </div>
      <div class="blr-pane min-h-0 flex-1">
        <BlrLabReading
          :workspace="workspace"
          :entity="selected"
          :header="false"
          empty-note="Select a box on the map to read it here. The map never moves while you read."
          @select="pick"
        />
      </div>
    </aside>
  </BlrLabFrame>
</template>

<style scoped>
.blr-atlas-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-atlas-layer {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--ui-text-dimmed);
  transition: color 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.blr-atlas-layer[data-on='true'] {
  border-color: color-mix(in srgb, var(--kind-color) 45%, var(--ui-border));
  background: color-mix(in srgb, var(--kind-color) 8%, transparent);
  color: var(--ui-text-highlighted);
}

.blr-atlas-layer[data-on='false'] {
  text-decoration: line-through;
  opacity: 0.55;
}
</style>
