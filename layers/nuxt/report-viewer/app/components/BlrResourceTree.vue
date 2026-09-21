<script setup lang="ts">
/** Shared hierarchy rows: chevrons expand, resource links open readings. */
import type { ResourceChange } from 'businesslens/report'
import type { TreeItem } from '@nuxt/ui'
import type { AnyResourceView } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
import type { TreeCardNode } from '../utils/collectionChildren'

const props = defineProps<{ nodes: TreeCardNode[], label: string, rootKey?: string, changes?: ReadonlyMap<string, ResourceChange> }>()
const expanded = defineModel<string[]>('expanded', { required: true })
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
interface Node extends TreeItem { value: string, label: string, source: TreeCardNode, children?: Node[] }
const toggle = (key: string) => {
  expanded.value = expanded.value.includes(key) ? expanded.value.filter(value => value !== key) : [...expanded.value, key]
}
const toNode = (source: TreeCardNode): Node => ({
  value: source.id, label: source.title, source,
  children: source.children.length ? source.children.map(toNode) : undefined,
  onSelect: (event: Event) => {
    event.preventDefault()
    if (source.resource) emit('open', source.resource)
    else if (source.children.length) toggle(source.id)
  },
  onToggle: (event) => {
    // Selection handles click/Enter/Space; arrows retain native tree navigation.
    if (event.detail.originalEvent.type === 'click') event.preventDefault()
  }
})
const items = computed(() => props.nodes.map(toNode))
</script>

<template>
  <UTree
    class="blr-tree-card-tree"
    :aria-label="label"
    :as="{ link: 'div' }"
    :items="items"
    :get-key="(item: Node) => item.value"
    :expanded="expanded"
    color="neutral"
    size="md"
    :ui="{ link: 'cursor-pointer gap-2 rounded-md bg-transparent transition hover:bg-elevated/40 hover:before:bg-transparent', linkLabel: 'min-w-0 font-medium' }"
    @update:expanded="expanded = $event"
  >
    <template #item-leading="{ item, expanded: isExpanded }">
      <button
        v-if="item.children?.length"
        type="button"
        class="flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`"
        :aria-expanded="isExpanded"
        @click.stop="toggle(item.value)"
        @keydown.stop
      >
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="isExpanded && 'rotate-90'" />
      </button>
      <span v-else aria-hidden="true" class="size-4 shrink-0" />
      <BlrKind v-if="item.source.groupKind" :kind="item.source.groupKind" :labelled="false" size="xs" />
      <BlrKind
        v-else-if="item.source.resource"
        :kind="item.source.resource.kind"
        :interface-type="item.source.resource.kind === 'interface' ? item.source.resource.interfaceType : undefined"
        :facet="entityFacetOf(item.source.resource)"
        :acts="item.source.resource.kind === 'entity' ? item.source.resource.acts ?? undefined : undefined"
        :labelled="false"
        size="xs"
      />
    </template>
    <template #item-label="{ item }">
      <BlrResourceLink
        v-if="item.source.resource"
        :resource-key="item.source.resource.key"
        class="text-highlighted"
        :class="item.value === rootKey && 'font-semibold'"
        @keydown.stop
        @open="emit('open', item.source.resource)"
      >{{ item.label }}</BlrResourceLink>
      <span v-else :class="item.value === rootKey ? 'font-semibold text-highlighted' : 'text-muted'">{{ item.label }} <span v-if="item.source.groupKind" class="ms-1.5 text-xs text-dimmed">{{ item.source.children.length }}</span></span>
      <BlrChangeMark v-if="item.source.resource && changes?.get(item.source.resource.key)" :change="changes!.get(item.source.resource.key)!.change" class="ms-2" />
      <span v-if="item.source.sharedFrom" class="block whitespace-normal text-xs font-normal text-muted">
        From <BlrResourceLink :resource-key="item.source.sharedFrom.key" @keydown.stop @open="emit('open', item.source.sharedFrom)">{{ item.source.sharedFrom.title }}</BlrResourceLink>
      </span>
    </template>
    <template #item-trailing><span /></template>
  </UTree>
</template>
