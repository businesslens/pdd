<script setup lang="ts">
/**
 * One card per subject, each a tree of what the model files under it.
 *
 * This is the Rows drawing of Domains and Interfaces: the shape the Domain map
 * had, with Nuxt UI's Tree inside each card. A Domain card branches into its
 * Capabilities and its Entities; an Interface card into its Experiences, each
 * with its Screens, and the Screens it holds directly. Every node that is a
 * resource opens its page; a group node only opens and closes.
 */
import type { TreeItem } from '@nuxt/ui'
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
  /** Cards whose body is closed, by card key. */
  closed: string[]
  /** Expanded node values per card, where the reader has chosen; else the default. */
  expansion: Record<string, string[]>
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], close: [key: string, closed: boolean], expand: [key: string, values: string[]] }>()

interface Node extends TreeItem { value: string, label: string, resource?: AnyResourceView, count?: number, children?: Node[] }

const cards = computed(() => treeCards(props.workspace, props.kind, props.resources, props.narrowed))

/* A resource node opens its page rather than becoming "selected"; a group node
   only toggles, so neither leaves a highlighted row behind. */
const toNode = (node: TreeCardNode): Node => ({
  value: node.id,
  label: node.title,
  resource: node.resource,
  count: node.children.length || undefined,
  children: node.children.length ? node.children.map(toNode) : undefined,
  onSelect: (event: Event) => { event.preventDefault(); if (node.resource) emit('open', node.resource) }
})
const itemsOf = (card: TreeCard) => card.children.map(toNode)

/* Open by default where a glance can take it in; larger groups open on request. */
const defaultsOf = (card: TreeCard): string[] => {
  const open: string[] = []
  const walk = (node: TreeCardNode) => { if (node.children.length && node.children.length <= 8) open.push(node.id); node.children.forEach(walk) }
  card.children.forEach(walk)
  return open
}
const expandedOf = (card: TreeCard) => props.expansion[card.key] ?? defaultsOf(card)
const isClosed = (card: TreeCard) => props.closed.includes(card.key)
const total = (card: TreeCard) => card.children.reduce((sum, group) => sum + (group.resource ? 1 : group.children.length), 0)
</script>

<template>
  <section
    v-for="card in cards"
    :key="card.key"
    class="blr-topology-group blr-tree-card"
    data-tree-card
    :data-card-key="card.key"
    :style="card.colorSlot != null ? { '--blr-group-color': `var(--blr-slot-${card.colorSlot})` } : undefined"
  >
    <div class="blr-topology-branch-heading">
      <BlrTopologyResource v-if="card.resource" :resource="card.resource" @open="emit('open', card.resource!)" />
      <h3 v-else>{{ card.title }}</h3>
      <button
        type="button"
        class="blr-topology-toggle"
        :aria-expanded="!isClosed(card)"
        :aria-label="`${isClosed(card) ? 'Expand' : 'Collapse'} ${card.title}, ${total(card)} ${total(card) === 1 ? 'item' : 'items'}`"
        @click="emit('close', card.key, !isClosed(card))"
      >
        {{ total(card) }} <UIcon :name="isClosed(card) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="size-4" />
      </button>
    </div>
    <p v-if="card.note" class="blr-topology-note">{{ card.note }}</p>
    <UTree
      v-if="!isClosed(card) && card.children.length"
      class="blr-tree-card-tree mt-3"
      :items="itemsOf(card)"
      :get-key="(item: Node) => item.value"
      :expanded="expandedOf(card)"
      color="neutral"
      size="md"
      :ui="{ link: 'gap-2', linkLabel: 'font-medium' }"
      @update:expanded="emit('expand', card.key, $event)"
    >
      <template #item-leading="{ item }">
        <BlrKind
          v-if="item.resource"
          :kind="item.resource.kind"
          :interface-type="item.resource.kind === 'interface' ? item.resource.interfaceType : undefined"
          :facet="entityFacetOf(item.resource)"
          :acts="item.resource.kind === 'entity' ? item.resource.acts ?? undefined : undefined"
          :labelled="false"
          size="xs"
        />
      </template>
      <template #item-label="{ item }">
        <span :class="item.resource ? 'text-highlighted' : 'text-muted'">{{ item.label }}</span>
      </template>
      <template #item-trailing="{ item, expanded }">
        <span v-if="item.count" class="blr-tree-card-count">
          {{ item.count }} <UIcon :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5" />
        </span>
      </template>
    </UTree>
  </section>
</template>
