<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf, resourceKey } from '../utils/reportWorkspace'
import { findProductTopologyView } from '../utils/productTopologyViews'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, sanitizeTopologyReading, toggleTopologyGroup } from '../utils/topologyState'
import { deliveryMatrixProjection, entityRelationsProjection, filterBranches, interfaceProjection, journeyCompositionProjection, mutationProjection, productMapProjection, ruleReachProjection, sitemapProjection } from '../utils/topologyProjections'
import { diagramResource } from '../utils/diagram'
import { topologyRelations } from '../utils/topologyRelations'
import type { TopologyMatrix } from '../utils/topologyProjections'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [resource: AnyResourceView], product: [] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const view = computed(() => findProductTopologyView(reading.value.view))
const relations = computed(() => topologyRelations(props.workspace))
const neighbourhood = computed(() => {
  if (!reading.value.focus.length) return null
  const focus = new Set(reading.value.focus)
  const keys = new Set(focus)
  for (const relation of relations.value) if (focus.has(relation.source) || focus.has(relation.target)) { keys.add(relation.source); keys.add(relation.target) }
  if (view.value.id === 'sitemap') {
    const descend = (node: ReturnType<typeof sitemapProjection>, included = false) => {
      const inside = included || focus.has(node.id)
      if (inside) keys.add(node.id)
      node.children.forEach(child => descend(child, inside))
    }
    descend(sitemapProjection(props.workspace))
  }
  if (view.value.id === 'product-map') {
    for (const item of [...props.workspace.capabilities, ...props.workspace.entities]) {
      if (item.domainId && focus.has(resourceKey('domain', item.domainId))) keys.add(item.key)
    }
  }
  return keys
})
const visible = (resource: AnyResourceView) => !reading.value.hiddenKinds.includes(resource.kind) && (!neighbourhood.value || neighbourhood.value.has(resource.key))
const map = computed(() => productMapProjection(props.workspace))
const branches = computed(() => filterBranches(
  view.value.id === 'product-map' ? map.value.groups : interfaceProjection(props.workspace), visible))
const sitemap = computed(() => filterBranches([sitemapProjection(props.workspace)], visible)[0])
const matrixMode = computed(() => view.value.id === 'rule-reach' ? 'rules' as const
  : view.value.id === 'delivery-by-interface' ? 'delivery' as const : 'mutations' as const)
const matrix = computed<TopologyMatrix>(() => {
  const base = view.value.id === 'rule-reach' ? ruleReachProjection(props.workspace)
    : view.value.id === 'delivery-by-interface' ? deliveryMatrixProjection(props.workspace)
      : mutationProjection(props.workspace)
  const selectedRows = base.rows.filter(item => reading.value.focus.includes(item.key))
  const selectedColumns = base.columns.filter(item => reading.value.focus.includes(item.key))
  const rows = base.rows.filter(item => visible(item) && (!selectedRows.length || selectedRows.includes(item)))
  const columns = base.columns.filter(item => visible(item) && (!selectedColumns.length || selectedColumns.includes(item)))
  const rowKeys = new Set(rows.map(row => row.key))
  const columnKeys = new Set(columns.map(column => column.key))
  return { rows, columns, cells: base.cells.filter(cell => rowKeys.has(cell.row) && columnKeys.has(cell.column)) }
})
const diagram = computed(() => {
  const base = entityRelationsProjection(props.workspace)
  const nodes = base.nodes.filter(node => visible(props.workspace.byKey.get(node.id)!)).map(node => ({ ...diagramResource(props.workspace.byKey.get(node.id)!), ...node }))
  const keys = new Set(nodes.map(node => node.id))
  return { ...base, nodes, edges: base.edges.filter(edge => keys.has(edge.source) && keys.has(edge.target)) }
})
const compositions = computed(() => journeyCompositionProjection(props.workspace))
const isGraph = computed(() => view.value.id === 'sitemap' || view.value.id === 'what-it-keeps')
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
const filterCount = computed(() => reading.value.hiddenKinds.length + reading.value.focus.length)

const filterChips = computed(() => [
  ...reading.value.hiddenKinds.length
    ? [{ key: 'hidden', label: 'Hidden types', value: reading.value.hiddenKinds.map(kind => ENTITY_KIND_META[kind].plural).join(', ') }]
    : [],
  ...reading.value.focus.map((key) => {
    const resource = props.workspace.byKey.get(key)
    return { key: `focus:${key}`, label: 'Focus', value: resource?.title ?? key, kind: resource?.kind }
  })
])

function removeFilter(key: string) {
  if (key === 'hidden') update({ hiddenKinds: [] })
  else update({ focus: reading.value.focus.filter(item => `focus:${item}` !== key) })
}

function showKinds(kinds: string[]) {
  update({ hiddenKinds: filterKinds.value.filter(kind => !kinds.includes(kind)) })
}
const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, reading.value]))
const { element: pane, save, restore } = useBlrTopologyScroll(scrollKey)
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
watch(() => [props.workspace, reading.value] as const, () => {
  const next = sanitizeTopologyReading(reading.value, props.workspace)
  if (JSON.stringify(next) !== JSON.stringify(reading.value)) reading.value = next
}, { immediate: true })
function update(patch: Partial<TopologyReading>) { reading.value = { ...reading.value, ...patch } }
function open(key: string) {
  save()
  if (key === resourceKey('product', props.workspace.identity.id)) { emit('product'); return }
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('select', resource)
}
function focus(key: string) { open(key) }
function toggle(id: string, open: boolean) { reading.value = toggleTopologyGroup(reading.value, id, open) }
</script>
<template>
  <div class="blr-product-topology">
    <div class="px-5 pt-4">
      <BlrFilterBar :chips="filterChips" @remove="removeFilter" @clear="update({ focus: [], hiddenKinds: [] })">
        <USelectMenu
          v-if="typesOffered"
          :model-value="visibleKinds"
          :items="typeItems"
          value-key="value"
          multiple
          size="md"
          variant="outline"
          class="min-w-44"
          :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
          :search-input="false"
          aria-label="Which resource types this view draws"
          @update:model-value="showKinds($event as string[])"
        >
          <!-- Not the Entity mark: that glyph names a resource type, and this
               control names all of them. A reserved mark stays reserved. -->
          <template #leading>
            <UIcon name="i-lucide-layers" class="size-5 shrink-0 text-muted" />
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
          size="md"
          variant="outline"
          class="min-w-44"
          :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
          :virtualize="focusItems.length > 100"
          :search-input="{ placeholder: 'Find a resource…' }"
          aria-label="Focus one resource and its one-hop context"
          @update:model-value="update({ focus: $event as string[] })"
        >
          <template #leading>
            <UIcon name="i-lucide-focus" class="size-5 shrink-0 text-muted" />
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
      </BlrFilterBar>
    </div>
    <div ref="pane" class="blr-topology-reading" :class="{ 'blr-topology-reading--graph': isGraph }" @scroll.capture.passive="save">
      <BlrTopologyMatrix v-if="matrixMode !== 'mutations' || view.id === 'what-changes-what'" :matrix="matrix" :column="reading.column" :mode="matrixMode" @column="update({ column: $event })" @open="open" />
      <template v-else-if="view.id === 'sitemap'"><BlrTopologyTree v-if="sitemap" :tree="sitemap" :reading="reading" :viewport-key="scrollKey" @open="open" @toggle="toggle" @ready="restore" /><p v-else class="blr-topology-empty">No resources in this scope.</p></template>
      <BlrTopologyComposition v-else-if="view.id === 'value-paths'" :compositions="compositions" :scenario="reading.scenario" @scenario="update({ scenario: $event })" @open="open" />
      <template v-else-if="view.id === 'what-it-keeps'"><BlrDiagram v-if="diagram.nodes.length" :diagram="diagram" title="Entity relationships" :viewport-key="scrollKey" @open="open" @ready="restore" /><p v-else class="blr-topology-empty">No Entities in this scope.</p></template>
      <template v-else>
        <div class="blr-topology-grid"><BlrTopologyBranch v-for="item in branches" :key="item.id" :branch="item" :reading="reading" @open="open" @toggle="toggle" /></div>
        <p v-if="!branches.length" class="blr-topology-empty">No resources in this scope.</p>
      </template>
      <details class="blr-topology-about"><summary>About this view</summary><p><strong>{{ view.question }}</strong></p><p><strong>{{ view.diagramType }}.</strong> {{ view.note }}</p></details>
    </div>
  </div>
</template>
