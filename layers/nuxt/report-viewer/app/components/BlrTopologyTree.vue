<script setup lang="ts">
import type { TopologyBranch } from '../utils/topologyProjections'
import type { TopologyReading } from '../utils/topologyState'
import type { Diagram } from '../utils/diagram'
import { diagramResource } from '../utils/diagram'
import { layoutTopologyTree } from '../utils/topologyTree'
const props = defineProps<{ tree: TopologyBranch, reading: TopologyReading, viewportKey: string }>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean], ready: [] }>()
const isOpen = (node: TopologyBranch) => {
  if (props.reading.expanded.includes(node.id)) return true
  if (props.reading.collapsed.includes(node.id)) return false
  if (node.id === props.tree.id) return true
  return node.children.length <= 8 && depths.value.get(node.id)! < initialDepth.value
}
const visibleTree = computed(() => {
  const prune = (node: TopologyBranch): TopologyBranch => ({ ...node, children: isOpen(node) ? node.children.map(prune) : [] })
  return prune(props.tree)
})
const flatten = (node: TopologyBranch): TopologyBranch[] => [node, ...node.children.flatMap(flatten)]
const all = computed(() => flatten(props.tree))
const parents = computed(() => {
  const result = new Map<string, TopologyBranch>()
  for (const node of all.value) for (const child of node.children) result.set(child.id, node)
  return result
})
const depths = computed(() => {
  const result = new Map([[props.tree.id, 0]])
  for (const node of all.value) for (const child of node.children) result.set(child.id, result.get(node.id)! + 1)
  return result
})
const initialDepth = computed(() => {
  // All boxes share a width, so the opening breadth is known before fonts
  // load. Keep a stable desktop overview on phones as well; panning explores
  // it at readable size. Explicit expansion always overrides this default.
  const sizes = Object.fromEntries(all.value.map(node => [node.id, { width: 200, height: 80 }]))
  const preview = (node: TopologyBranch, depth: number, limit: number): TopologyBranch => ({ ...node,
    children: depth < limit && (!depth || node.children.length <= 8) ? node.children.map(child => preview(child, depth + 1, limit)) : [] })
  for (let limit = Math.max(...depths.value.values()); limit > 1; limit--) {
    if (layoutTopologyTree(preview(props.tree, 0, limit), sizes).width <= 1120) return limit
  }
  return 1
})

const diagram = computed<Diagram>(() => {
  const originals = new Map(all.value.map(node => [node.id, node]))
  const visible = flatten(visibleTree.value)
  return { direction: 'DOWN', layout: 'tree', totalNodes: all.value.length,
    nodes: visible.map(node => ({ ...(node.resource ? diagramResource(node.resource) : { id: node.id, resourceKey: node.id, title: node.title, kind: 'product' as const }),
      description: parents.value.has(node.id) ? `Contained by ${parents.value.get(node.id)!.title}.` : 'Product root.',
      branch: originals.get(node.id)!.children.length ? { id: node.id, count: originals.get(node.id)!.children.length, open: isOpen(node) } : undefined })),
    edges: visible.flatMap(node => node.children.map(child => ({ id: `${node.id}->${child.id}`, source: node.id, target: child.id, label: '', arrow: false }))) }
})
</script>
<template>
  <BlrDiagram :diagram="diagram" :title="`${tree.title} Interface map`" :viewport-key="viewportKey" @open="emit('open', $event)" @toggle="(id, open) => emit('toggle', id, open)" @ready="emit('ready')" />
</template>
