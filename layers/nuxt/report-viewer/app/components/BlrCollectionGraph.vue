<script setup lang="ts">
/**
 * A collection's second drawing.
 *
 * It draws the same set the Rows drawing lists — the facet-filtered subjects
 * come in as keys — so nothing here narrows on its own. The one extra input is
 * focus: a resource page hands the graph "this one and its neighbourhood", a
 * narrowing the rows cannot express, which the shell shows as a chip beside
 * the filters so it can be cleared like any other.
 *
 * Entities draw their authored relations; every other collection draws a tree
 * rooted at the Product — containment for Interfaces, reach for the rest.
 */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { resourceKey } from '../utils/reportWorkspace'
import { findProductTopologyView } from '../utils/productTopologyViews'
import type { ProductTopologyViewId } from '../utils/productTopologyViews'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, sanitizeTopologyReading, toggleTopologyGroup } from '../utils/topologyState'
import { entityRelationsProjection, filterBranches, reachTreeProjection, sitemapProjection } from '../utils/topologyProjections'
import type { ReachKind, TopologyBranch } from '../utils/topologyProjections'
import { diagramResource } from '../utils/diagram'
import { topologyNeighbourhood } from '../utils/topologyFocus'

const props = defineProps<{
  workspace: ReportWorkspace
  /** The collection whose set is drawn. */
  kind: ReportResourceKind
  view: ProductTopologyViewId
  /** The keys of the subjects the filters left in the set. */
  visibleKeys: string[]
  /** True when a filter narrowed the set, so an unassigned bucket is not implied. */
  narrowed: boolean
}>()
const emit = defineEmits<{ select: [resource: AnyResourceView], product: [] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const view = computed(() => findProductTopologyView(props.view))
const subjects = computed(() => new Set(props.visibleKeys))
const inSet = (resource: AnyResourceView) => resource.kind !== props.kind || subjects.value.has(resource.key)

/* Subjects the filters removed take their subtrees with them; a child of a
   visible subject is never dropped for being of another kind. */
const keepSubjects = (branches: TopologyBranch[]): TopologyBranch[] => branches
  .filter(item => item.resource ? inSet(item.resource) : !(item.id === 'unassigned' && props.narrowed))
  .map(item => ({ ...item, children: keepSubjects(item.children) }))

const isTree = computed(() => view.value.id !== 'what-it-keeps')
const tree = computed(() => {
  if (!isTree.value) return null
  const full = view.value.id === 'sitemap' ? sitemapProjection(props.workspace) : reachTreeProjection(props.workspace, props.kind as ReachKind)
  return keepSubjects([full])[0]!
})
const neighbourhood = computed(() => topologyNeighbourhood(props.workspace, reading.value.focus, tree.value ? [tree.value] : []))
const visible = (resource: AnyResourceView) => inSet(resource) && (!neighbourhood.value || neighbourhood.value.has(resource.key))
const shown = computed(() => tree.value ? filterBranches([tree.value], visible)[0] : undefined)
const diagram = computed(() => {
  const base = entityRelationsProjection(props.workspace)
  const nodes = base.nodes.filter(node => visible(props.workspace.byKey.get(node.id)!)).map(node => ({ ...diagramResource(props.workspace.byKey.get(node.id)!), ...node }))
  const keys = new Set(nodes.map(node => node.id))
  return { ...base, nodes, edges: base.edges.filter(edge => keys.has(edge.source) && keys.has(edge.target)) }
})
const treeWords = computed(() => view.value.id === 'sitemap'
  ? { label: 'Interface map', relation: 'Contained by' }
  : { label: view.value.name, relation: 'Reached from' })

const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, props.kind, props.visibleKeys, reading.value]))
const { element: pane, save, restore } = useBlrTopologyScroll(scrollKey)
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
watch(() => [props.workspace, props.view, reading.value] as const, () => {
  const next = sanitizeTopologyReading({ ...reading.value, view: props.view, hiddenKinds: [] }, props.workspace)
  if (JSON.stringify(next) !== JSON.stringify(reading.value)) reading.value = next
}, { immediate: true })
function open(key: string) {
  save()
  if (key === resourceKey('product', props.workspace.identity.id)) { emit('product'); return }
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('select', resource)
}
function toggle(id: string, open: boolean) { reading.value = toggleTopologyGroup(reading.value, id, open) }
function toggleAll(open: boolean, ids: string[]) {
  reading.value = { ...reading.value, expanded: open ? ids : [], collapsed: open ? [] : ids }
}
</script>
<template>
  <div class="blr-product-topology" data-collection-graph>
    <div ref="pane" class="blr-topology-reading blr-topology-reading--graph" @scroll.capture.passive="save">
      <template v-if="isTree"><BlrTopologyTree v-if="shown && shown.children.length" :tree="shown" :reading="reading" :viewport-key="scrollKey" :label="treeWords.label" :relation="treeWords.relation" @open="open" @toggle="toggle" @toggle-all="toggleAll" @ready="restore" /><p v-else class="blr-topology-empty">No resources in this scope.</p></template>
      <template v-else><BlrDiagram v-if="diagram.nodes.length" :diagram="diagram" title="Entity relationships" :viewport-key="scrollKey" @open="open" @ready="restore" /><p v-else class="blr-topology-empty">No Entities in this scope.</p></template>
      <details class="blr-topology-about"><summary>About this view</summary><p><strong>{{ view.question }}</strong></p><p><strong>{{ view.diagramType }}.</strong> {{ view.note }}</p></details>
    </div>
  </div>
</template>
