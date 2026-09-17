<script setup lang="ts">
/** Each comparison filters its row and column resources independently. */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, sanitizeTopologyReading } from '../utils/topologyState'
import { sanitizeMatrixReading } from '../utils/matrixFilters'
import type { MatrixView } from '../composables/useBlrMatrixView'

const props = defineProps<{ workspace: ReportWorkspace, matrixView?: MatrixView }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const localMatrixView = useBlrMatrixView(() => props.workspace, reading)
const current = computed(() => props.matrixView ?? localMatrixView.value)
const source = computed(() => current.value.source)
const matrix = computed(() => current.value.matrix)
const matrixMode = computed(() => current.value.mode)
const rowAxis = computed(() => ({
  mutations: { label: 'Entities', kind: 'entity' },
  delivery: { label: 'Capabilities', kind: 'capability' },
  rules: { label: 'Rules', kind: 'rule' }
} as const)[matrixMode.value])
// Offer only the resource kinds represented by actual target columns. Keep
// their options available when another filter narrows the visible columns.
const targetTypes = computed<ReportResourceKind[]>(() => [...new Set(source.value.columns.map(resource => resource.kind))])
const typeItems = computed(() => targetTypes.value.map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind, kind })))
const visibleTypes = computed(() => targetTypes.value.filter(kind => matrixMode.value !== 'rules' || !reading.value.hiddenKinds.includes(kind)))
const columnFilters = computed(() => visibleTypes.value.map(kind => {
  const resources = source.value.columns.filter(resource => resource.kind === kind)
  return { kind, label: ENTITY_KIND_META[kind].plural, resources,
    selected: resources.filter(resource => reading.value.focus.includes(resource.key)).map(resource => resource.key) }
}))
const rowSelection = computed({
  get: () => source.value.rows.filter(resource => reading.value.focus.includes(resource.key)).map(resource => resource.key),
  set: (keys: string[]) => selectAxis(source.value.rows, keys)
})
const filterChips = computed(() => [
  ...reading.value.hiddenKinds.map(kind => ({ key: `hidden:${kind}`, label: 'Hidden type', value: ENTITY_KIND_META[kind].plural, kind })),
  ...reading.value.focus.flatMap(key => {
    const resource = props.workspace.byKey.get(key)
    return resource ? [{ key: `resource:${key}`, label: ENTITY_KIND_META[resource.kind].label, value: resource.title,
      kind: resource.kind, facet: entityFacetOf(resource),
      acts: resource.kind === 'entity' ? resource.acts : undefined,
      interfaceType: resource.kind === 'interface' ? resource.interfaceType : undefined }] : []
  })
])

function selectAxis(resources: AnyResourceView[], keys: string[], resetColumn = false) {
  const axisKeys = new Set(resources.map(resource => resource.key))
  update({ focus: [...reading.value.focus.filter(key => !axisKeys.has(key)), ...keys],
    ...(resetColumn ? { column: null } : {}) })
}
function removeFilter(key: string) {
  if (key.startsWith('hidden:')) update({ hiddenKinds: reading.value.hiddenKinds.filter(kind => `hidden:${kind}` !== key), column: null })
  else update({ focus: reading.value.focus.filter(item => `resource:${item}` !== key) })
}
function showTypes(kinds: ReportResourceKind[]) {
  update({ hiddenKinds: targetTypes.value.filter(kind => !kinds.includes(kind)), column: null })
}
function clearFilters() { update({ focus: [], hiddenKinds: [], column: null }) }

// Column navigation keeps the same vertical reading position.
const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, { ...reading.value, column: null }]))
const { element: pane, save, restore } = useBlrTopologyScroll(scrollKey)
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
watch(() => [props.workspace, reading.value, source.value] as const, () => {
  const next = sanitizeMatrixReading(sanitizeTopologyReading(reading.value, props.workspace), source.value)
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
      <BlrFilterBar :key="reading.view" :chips="filterChips" :filters-offered="!!(source.rows.length || source.columns.length)"
        @remove="removeFilter" @clear="clearFilters">
        <template #default="{ inSheet }">
          <BlrMatrixResourceFilter v-if="source.rows.length" v-model="rowSelection" :label="rowAxis.label" :kind="rowAxis.kind"
            :resources="source.rows" :in-sheet="inSheet" />
          <USelectMenu v-if="matrixMode === 'rules' && typeItems.length" :model-value="visibleTypes"
            :items="typeItems" value-key="value" multiple size="sm" variant="outline"
            :class="inSheet ? 'w-full' : 'min-w-44'" :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
            :search-input="false" aria-label="Resource types" @update:model-value="showTypes($event as ReportResourceKind[])">
            <template #leading><UIcon name="i-lucide-layers" class="size-4 shrink-0 text-muted" /></template>
            <template #default>
              <span class="truncate">Resource types</span>
              <span v-if="reading.hiddenKinds.length" class="blr-meta">({{ reading.hiddenKinds.length }} hidden)</span>
            </template>
            <template #item-leading="{ item }"><BlrKind :kind="item.kind" :labelled="false" size="xs" /></template>
          </USelectMenu>
          <BlrMatrixResourceFilter v-for="filter in columnFilters" :key="filter.kind"
            :model-value="filter.selected" :label="filter.label" :kind="filter.kind"
            :resources="filter.resources" :in-sheet="inSheet"
            @update:model-value="selectAxis(filter.resources, $event, true)" />
        </template>
      </BlrFilterBar>
      <BlrMatrixLegend v-if="!matrixView" :mode="matrixMode" />
    </div>
    <div ref="pane" class="blr-topology-reading" @scroll.capture.passive="save">
      <BlrTopologyMatrix :workspace="workspace" :matrix="matrix" :column="reading.column" :mode="matrixMode" @column="update({ column: $event })" @open="open" />
    </div>
  </div>
</template>
