<script setup lang="ts">
/** Collection cards and resource Structure readings use the same tree rows. */
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import type { TreeCard } from '../utils/collectionChildren'
import { treeCards, treeBranchKeys } from '../utils/collectionChildren'

const props = defineProps<{
  workspace: ReportWorkspace
  kind: ReportResourceKind
  resources: AnyResourceView[]
  narrowed: boolean
  closed: string[]
  expansion: Record<string, string[]>
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], close: [key: string, closed: boolean], expand: [key: string, values: string[]] }>()
const cards = computed(() => treeCards(props.workspace, props.kind, props.resources, props.narrowed))
// Closing a root keeps its descendants' expansion choices.
const expandedOf = (card: TreeCard) => [
  ...(props.closed.includes(card.key) ? [] : [card.key]),
  ...(props.expansion[card.key] ?? treeBranchKeys(card.children, true))
]
const setExpanded = (card: TreeCard, values: string[]) => {
  const closed = !values.includes(card.key)
  if (closed !== props.closed.includes(card.key)) emit('close', card.key, closed)
  emit('expand', card.key, values.filter(value => value !== card.key))
}
</script>

<template>
  <div
    v-for="card in cards"
    :key="card.key"
    class="relative overflow-hidden rounded-xl border border-default bg-elevated/20 px-3 py-2"
    data-tree-card
    :data-card-key="card.key"
  >
    <BlrResourceTree
      :nodes="[{ id: card.key, title: card.title, resource: card.resource, children: card.children }]"
      :label="card.title"
      :root-key="card.key"
      :expanded="expandedOf(card)"
      @update:expanded="setExpanded(card, $event)"
      @open="emit('open', $event)"
    />
  </div>
</template>
