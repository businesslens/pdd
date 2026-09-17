<script setup lang="ts">
/**
 * The Overview's cross-collection readings.
 *
 * A matrix compares two collections at once, so no single collection's Rows
 * drawing lists its set and no collection's filters narrow it. It keeps its own
 * two controls: which resource types it draws, and one resource whose
 * neighbourhood it draws.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf } from '../utils/reportWorkspace'
import { findProductTopologyView } from '../utils/productTopologyViews'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, sanitizeTopologyReading } from '../utils/topologyState'
import type { MatrixView } from '../composables/useBlrMatrixView'

const props = defineProps<{ workspace: ReportWorkspace, matrixView?: MatrixView }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const view = computed(() => findProductTopologyView(reading.value.view))
const localMatrixView = useBlrMatrixView(() => props.workspace, reading)
const matrix = computed(() => (props.matrixView ?? localMatrixView.value).matrix)
const matrixMode = computed(() => (props.matrixView ?? localMatrixView.value).mode)
const filterKinds = computed(() => view.value.kinds.filter(kind => kind !== 'product'
  && [...props.workspace.byKey.values()].some(item => item.kind === kind)))
/* Every view offers its axes. A type control with one option is not an axis. */
const typesOffered = computed(() => filterKinds.value.length > 1)
/*
  A named view narrows on two unrelated axes: which resource types it draws, and
  which one resource it draws the neighbourhood of. They were stacked in one
  popover behind one `Filter` button, alongside a bare search box and a raw
  `select`. They are two controls, in the shape every other filter uses.
*/
const focusItems = computed(() => [...props.workspace.byKey.values()]
  .filter(resource => view.value.kinds.includes(resource.kind))
  .map(resource => ({
    label: resource.title,
    value: resource.key,
    kind: resource.kind,
    facet: entityFacetOf(resource),
    acts: resource.kind === 'entity' ? resource.acts ?? undefined : undefined,
    interfaceType: resource.kind === 'interface' ? resource.interfaceType : undefined
  })))
const typeItems = computed(() => filterKinds.value.map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind, kind })))
const visibleKinds = computed(() => filterKinds.value.filter(kind => !reading.value.hiddenKinds.includes(kind)))
const filterChips = computed(() => [
  ...reading.value.hiddenKinds.map(kind => ({ key: `hidden:${kind}`, label: 'Hidden type', value: ENTITY_KIND_META[kind].plural })),
  ...reading.value.focus.map((key) => {
    const resource = props.workspace.byKey.get(key)
    return { key: `focus:${key}`, label: 'Focus', value: resource?.title ?? key, kind: resource?.kind }
  })
])

function removeFilter(key: string) {
  if (key.startsWith('hidden:')) update({ hiddenKinds: reading.value.hiddenKinds.filter(kind => `hidden:${kind}` !== key) })
  else update({ focus: reading.value.focus.filter(item => `focus:${item}` !== key) })
}

function showKinds(kinds: string[]) {
  update({ hiddenKinds: filterKinds.value.filter(kind => !kinds.includes(kind)) })
}
// Column navigation changes the horizontal window, keeping the same vertical reading position.
const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, { ...reading.value, column: null }]))
const { element: pane, save, restore } = useBlrTopologyScroll(scrollKey)
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
watch(() => [props.workspace, reading.value] as const, () => {
  const next = sanitizeTopologyReading(reading.value, props.workspace)
  if (JSON.stringify(next) !== JSON.stringify(reading.value)) reading.value = next
}, { immediate: true })
function update(patch: Partial<TopologyReading>) { reading.value = { ...reading.value, ...patch } }
function open(key: string) {
  save()
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('select', resource)
}
</script>
<template>
  <div class="blr-product-topology">
    <div class="blr-topology-toolbar px-5 pt-4">
      <BlrFilterBar :key="view.id" :chips="filterChips" @remove="removeFilter" @clear="update({ focus: [], hiddenKinds: [] })">
        <template #default="{ inSheet }">
          <USelectMenu
            v-if="typesOffered"
            :model-value="visibleKinds"
            :items="typeItems"
            value-key="value"
            multiple
            size="sm"
            variant="outline"
            :class="inSheet ? 'w-full' : 'min-w-44'"
            :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
            :search-input="false"
            aria-label="Which resource types this view draws"
            @update:model-value="showKinds($event as string[])"
          >
            <!-- Not the Entity mark: that glyph names a resource type, and this
                 control names all of them. A reserved mark stays reserved. -->
            <template #leading>
              <UIcon name="i-lucide-layers" class="size-4 shrink-0 text-muted" />
            </template>
            <template #default>
              <span class="truncate">Resource types</span>
              <span v-if="reading.hiddenKinds.length" class="blr-meta">({{ reading.hiddenKinds.length }} hidden)</span>
            </template>
            <!-- BlrKind resolves its colour in script. The menu is portalled out
                 of the shell, where `--blr-slot-*` is defined and would not. -->
            <template #item-leading="{ item }">
              <BlrKind :kind="item.kind" :labelled="false" size="xs" />
            </template>
          </USelectMenu>

          <USelectMenu
            :model-value="reading.focus"
            :items="focusItems"
            value-key="value"
            multiple
            size="sm"
            variant="outline"
            :class="inSheet ? 'w-full' : 'min-w-44'"
            :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
            :virtualize="focusItems.length > 100"
            :search-input="{ placeholder: 'Find a resource…' }"
            aria-label="Focus one resource and its one-hop context"
            @update:model-value="update({ focus: $event as string[] })"
          >
            <template #leading>
              <UIcon name="i-lucide-focus" class="size-4 shrink-0 text-muted" />
            </template>
            <template #default>
              <span class="truncate">Focus</span>
              <span v-if="reading.focus.length" class="blr-meta">({{ reading.focus.length }})</span>
            </template>
            <template #item-leading="{ item }">
              <BlrKind
                :kind="item.kind"
                :interface-type="item.interfaceType"
                :facet="item.facet"
                :acts="item.acts"
                :labelled="false"
                size="xs"
              />
            </template>
          </USelectMenu>
        </template>
      </BlrFilterBar>
      <BlrMatrixLegend v-if="!matrixView" :mode="matrixMode" />
    </div>
    <div ref="pane" class="blr-topology-reading" @scroll.capture.passive="save">
      <BlrTopologyMatrix :workspace="workspace" :matrix="matrix" :column="reading.column" :mode="matrixMode" @column="update({ column: $event })" @open="open" />
    </div>
  </div>
</template>
