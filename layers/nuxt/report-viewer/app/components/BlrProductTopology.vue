<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resourceKey } from '../utils/reportWorkspace'
import { findProductTopologyView } from '../utils/productTopologyViews'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, sanitizeTopologyReading, toggleTopologyGroup } from '../utils/topologyState'
import { entityRelationsProjection, filterBranches, interfaceProjection, journeyCompositionProjection, mutationProjection, productMapProjection, ruleReachProjection, sitemapProjection } from '../utils/topologyProjections'
import { diagramResource } from '../utils/diagram'
import { topologyRelations } from '../utils/topologyRelations'
import type { TopologyMatrix } from '../utils/topologyProjections'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ select: [resource: AnyResourceView], product: [] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const filtersOpen = ref(false)
const search = ref('')
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
  view.value.id === 'product-map' ? map.value.groups : interfaceProjection(props.workspace, view.value.id === 'delivery-by-interface'), visible))
const sitemap = computed(() => filterBranches([sitemapProjection(props.workspace)], visible)[0])
const matrix = computed<TopologyMatrix>(() => {
  const base = view.value.id === 'rule-reach' ? ruleReachProjection(props.workspace) : mutationProjection(props.workspace)
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
const filtersOffered = computed(() => props.workspace.byKey.size > 8 && filterKinds.value.length > 1)
const focusItems = computed(() => [...props.workspace.byKey.values()].filter(resource => view.value.kinds.includes(resource.kind) && resource.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())))
const filterCount = computed(() => reading.value.hiddenKinds.length + reading.value.focus.length)
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
    <header v-if="filtersOffered || filterCount" class="flex flex-wrap items-center gap-2 px-4 py-2">
      <UPopover v-if="filtersOffered" v-model:open="filtersOpen">
        <UButton icon="i-lucide-list-filter" color="neutral" :variant="filterCount ? 'soft' : 'outline'" size="xs" label="Filter" trailing-icon="i-lucide-chevron-down">
          <template v-if="filterCount" #trailing>
            <UBadge color="primary" variant="solid" size="sm">{{ filterCount }}</UBadge>
          </template>
        </UButton>
        <template #content>
          <div class="blr-topology-filters w-80 space-y-3 p-3">
            <fieldset><legend>Resource types</legend><label v-for="kind in filterKinds" :key="kind"><input type="checkbox" :checked="!reading.hiddenKinds.includes(kind)" @change="update({ hiddenKinds: reading.hiddenKinds.includes(kind) ? reading.hiddenKinds.filter(item => item !== kind) : [...reading.hiddenKinds, kind] })">{{ ENTITY_KIND_META[kind].plural }}</label></fieldset>
            <label>Focus with one-hop context <input v-model="search" type="search" placeholder="Find a resource" aria-label="Find a resource to focus"></label>
            <select aria-label="Focus resource" :value="''" @change="update({ focus: [...new Set([...reading.focus, ($event.target as HTMLSelectElement).value])] })"><option value="" disabled>Choose a resource</option><option v-for="resource in focusItems" :key="resource.key" :value="resource.key">{{ ENTITY_KIND_META[resource.kind].label }} · {{ resource.title }}</option></select>
          </div>
        </template>
      </UPopover>
      <div v-if="filterCount" class="flex min-w-0 flex-wrap items-center gap-1.5">
        <button v-for="key in reading.focus" :key="key" type="button" class="blr-chip" title="Stop focusing this resource" @click="update({ focus: reading.focus.filter(item => item !== key) })">
          <span class="text-dimmed">Focus</span>
          <span class="truncate font-medium text-highlighted">{{ workspace.byKey.get(key)?.title }}</span>
          <UIcon name="i-lucide-x" class="size-3 shrink-0 text-dimmed" />
        </button>
        <button v-if="reading.hiddenKinds.length" type="button" class="blr-chip" title="Show every resource type" @click="update({ hiddenKinds: [] })">
          <span class="text-dimmed">Hidden types</span>
          <span class="truncate font-medium text-highlighted">{{ reading.hiddenKinds.length }}</span>
          <UIcon name="i-lucide-x" class="size-3 shrink-0 text-dimmed" />
        </button>
      </div>
    </header>
    <div ref="pane" class="blr-topology-reading" :class="{ 'blr-topology-reading--graph': isGraph }" @scroll.capture.passive="save">
      <BlrTopologyMatrix v-if="view.id === 'rule-reach' || view.id === 'what-changes-what'" :matrix="matrix" :column="reading.column" :mode="view.id === 'rule-reach' ? 'rules' : 'mutations'" @column="update({ column: $event })" @open="open" />
      <template v-else-if="view.id === 'sitemap'"><BlrTopologyTree v-if="sitemap" :tree="sitemap" :reading="reading" :viewport-key="scrollKey" @open="open" @toggle="toggle" @ready="restore" /><p v-else class="blr-topology-empty">No resources in this scope.</p></template>
      <BlrTopologyComposition v-else-if="view.id === 'value-paths'" :compositions="compositions" :scenario="reading.scenario" @scenario="update({ scenario: $event })" @open="open" />
      <template v-else-if="view.id === 'what-it-keeps'"><BlrDiagram v-if="diagram.nodes.length" :diagram="diagram" title="Entity relationships" :viewport-key="scrollKey" @open="open" @ready="restore" /><p v-else class="blr-topology-empty">No Entities in this scope.</p></template>
      <template v-else>
        <div class="blr-topology-grid"><BlrTopologyBranch v-for="item in branches" :key="item.id" :branch="item" :reading="reading" @open="open" @toggle="toggle" /></div>
        <p v-if="!branches.length" class="blr-topology-empty">No resources in this scope.</p>
      </template>
      <details class="blr-topology-about"><summary>About this view</summary><p><strong>{{ view.diagramType }}.</strong> {{ view.note }}</p></details>
    </div>
  </div>
</template>
