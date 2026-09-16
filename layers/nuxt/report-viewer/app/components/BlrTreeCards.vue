<script setup lang="ts">
/**
 * One card per subject, each a tree of what the model files under it.
 *
 * This is the Rows drawing of Domains and Interfaces: the shape the Domain map
 * had, with Nuxt UI's Tree inside each card. A Domain card branches into its
 * Capabilities and its Entities; an Interface card into its Experiences, each
 * with its Screens, and the Screens it holds directly. The subject itself is
 * the tree's expandable root. Branches only open and close; resource branches
 * start with an Overview link, and resource leaves open their pages directly.
 */
import type { TreeItem } from '@nuxt/ui'
import type { ResourceChange } from 'businesslens/report'
import type { AnyResourceView, ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
import type { TreeCard, TreeCardNode } from '../utils/collectionChildren'
import { treeCards } from '../utils/collectionChildren'

const props = defineProps<{
  workspace: ReportWorkspace
  kind: ReportResourceKind
  /** The subjects the filters left in the set. */
  resources: AnyResourceView[]
  /** True when a filter narrowed the set, so an unassigned bucket is not implied. */
  narrowed: boolean
  /** Trees whose root is closed, by card key. */
  closed: string[]
  /** Expanded node values per card, where the reader has chosen; else the default. */
  expansion: Record<string, string[]>
  /** Each resource's standing against the host's baseline, by key, where the host has one. */
  changes?: Map<string, ResourceChange>
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], close: [key: string, closed: boolean], expand: [key: string, values: string[]] }>()

interface Node extends TreeItem { value: string, label: string, resource?: AnyResourceView, groupKind?: ReportResourceKind, overview?: boolean, count?: number, children?: Node[] }

const cards = computed(() => treeCards(props.workspace, props.kind, props.resources, props.narrowed))

/* All branches only toggle. Their resource is reached through an icon-free
   Overview leaf, including roots with no contained resources. */
const toNode = (node: TreeCardNode, card: TreeCard, overview = false): Node => {
  const children = node.children.map(child => toNode(child, card))
  if (node.resource && !overview && (children.length || node.id === card.key)) {
    children.unshift(toNode({ id: `${node.id}:overview`, title: 'Overview', resource: node.resource, children: [] }, card, true))
  }
  return {
    value: node.id,
    label: node.title,
    resource: node.resource,
    groupKind: node.groupKind,
    overview,
    count: node.resource ? node.children.length || undefined : node.children.length,
    children: children.length ? children : undefined,
    onSelect: (event: Event) => {
      event.preventDefault()
      if (children.length) {
        const expanded = expandedOf(card)
        setExpanded(card, expanded.includes(node.id) ? expanded.filter(value => value !== node.id) : [...expanded, node.id])
      } else if (node.resource) emit('open', node.resource)
    },
    onToggle: (event) => {
      // Selection handles click, Enter and Space. Keep native arrow-key toggles.
      if (event.detail.originalEvent.type === 'click') event.preventDefault()
    }
  }
}
/* The root count excludes Overview links and folder groups. */
const itemsOf = (card: TreeCard): Node[] => [
  { ...toNode({ id: card.key, title: card.title, resource: card.resource, children: card.children }, card), count: total(card) }
]

/* Open by default where a glance can take it in; larger groups open on request. */
const defaultsOf = (card: TreeCard): string[] => {
  const open: string[] = []
  const walk = (node: TreeCardNode) => { if (node.children.length && node.children.length <= 8) open.push(node.id); node.children.forEach(walk) }
  card.children.forEach(walk)
  return open
}
/* Keep root closure separate from descendant expansion so existing saved state
   and Expand/Collapse all still apply, and closing a root keeps its folders. */
const expandedOf = (card: TreeCard) => [
  ...(props.closed.includes(card.key) ? [] : [card.key]),
  ...(props.expansion[card.key] ?? defaultsOf(card))
]
const setExpanded = (card: TreeCard, values: string[]) => {
  const closed = !values.includes(card.key)
  if (closed !== props.closed.includes(card.key)) emit('close', card.key, closed)
  emit('expand', card.key, values.filter(value => value !== card.key))
}
const total = (card: TreeCard) => card.children.reduce((sum, group) => sum + (group.resource ? 1 : group.children.length), 0)
</script>

<template>
  <div
    v-for="card in cards"
    :key="card.key"
    class="relative overflow-hidden rounded-xl border border-default bg-elevated/20 px-3 py-2"
    data-tree-card
    :data-card-key="card.key"
  >
    <UTree
      class="blr-tree-card-tree"
      :aria-label="card.title"
      :as="{ link: 'div' }"
      :items="itemsOf(card)"
      :get-key="(item: Node) => item.value"
      :expanded="expandedOf(card)"
      color="neutral"
      size="md"
      :ui="{ link: 'cursor-pointer gap-2 rounded-md bg-transparent transition hover:bg-elevated/40 hover:before:bg-transparent', linkLabel: 'font-medium' }"
      @update:expanded="setExpanded(card, $event)"
    >
      <template #item-leading="{ item, expanded, handleToggle }">
        <button
          v-if="item.children?.length"
          type="button"
          class="flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${item.label}`"
          :aria-expanded="expanded"
          @click.stop="handleToggle()"
          @keydown.stop
        >
          <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="expanded && 'rotate-90'" />
        </button>
        <BlrKind
          v-if="item.groupKind"
          :kind="item.groupKind"
          :labelled="false"
          size="xs"
        />
        <BlrKind
          v-else-if="item.resource && !item.overview"
          :kind="item.resource.kind"
          :interface-type="item.resource.kind === 'interface' ? item.resource.interfaceType : undefined"
          :facet="entityFacetOf(item.resource)"
          :acts="item.resource.kind === 'entity' ? item.resource.acts ?? undefined : undefined"
          :labelled="false"
          size="xs"
        />
      </template>
      <template #item-label="{ item }">
        <BlrResourceLink v-if="item.resource && !item.children?.length" :resource-key="item.resource.key" class="text-highlighted" @open="emit('open', item.resource)">{{ item.label }}</BlrResourceLink>
        <span v-else :class="item.value === card.key ? 'font-semibold text-highlighted' : item.resource ? 'text-highlighted' : 'text-muted'">{{ item.label }}</span>
        <BlrChangeMark
          v-if="item.resource && changes?.get(item.resource.key)"
          :change="changes!.get(item.resource.key)!.change"
          class="ms-2"
        />
      </template>
      <template #item-trailing="{ item }">
        <span v-if="item.count !== undefined" class="blr-meta">{{ item.count }}</span>
      </template>
    </UTree>
  </div>
</template>
