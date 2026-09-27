<script setup lang="ts">
/**
 * Shared hierarchy rows: chevrons expand, resource links open readings.
 *
 * A closed row says what opening it would find, faded after its name, as the
 * Coverage tree does for a folder: navigation, never the row's own meaning, so
 * it disappears the moment the row opens. It is a larger pointer target for
 * the chevron, which carries it in its label, so a row keeps one tab stop.
 */
import type { TreeItem } from '@nuxt/ui'
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
import type { InsideCount, TreeCardNode } from '../utils/collectionChildren'
import { insideLabel, insideSummary } from '../utils/collectionChildren'

const props = defineProps<{
  workspace: ReportWorkspace
  nodes: TreeCardNode[]
  label: string
  rootKey?: string
  /** Capability ids a filter selected: those items are marked wherever they sit. */
  highlight?: string[]
}>()
const expanded = defineModel<string[]>('expanded', { required: true })
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
interface Node extends TreeItem { value: string, label: string, source: TreeCardNode, inside: InsideCount[], children?: Node[] }
const toggle = (key: string) => {
  expanded.value = expanded.value.includes(key) ? expanded.value.filter(value => value !== key) : [...expanded.value, key]
}
const toNode = (source: TreeCardNode): Node => ({
  value: source.id, label: source.title, source, inside: insideSummary(source),
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
const toggleLabel = (item: Node, open: boolean) => open
  ? `Collapse ${item.label}`
  : `Expand ${item.label}${item.inside.length ? `: ${insideLabel(item.inside)} inside` : ''}`
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
    :ui="{ link: 'cursor-pointer items-start gap-2 rounded-md bg-transparent transition hover:bg-elevated/40 hover:before:bg-transparent', linkLabel: 'min-w-0 font-medium' }"
    @update:expanded="expanded = $event"
  >
    <template #item-leading="{ item, expanded: isExpanded }">
      <button
        v-if="item.children?.length"
        type="button"
        class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="toggleLabel(item, isExpanded)"
        :aria-expanded="isExpanded"
        @click.stop="toggle(item.value)"
        @keydown.stop
      >
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="isExpanded && 'rotate-90'" />
      </button>
      <span v-else aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
      <BlrKind v-if="item.source.groupKind" :kind="item.source.groupKind" :labelled="false" size="xs" class="mt-0.5" />
      <BlrKind
        v-else-if="item.source.resource"
        :kind="item.source.resource.kind"
        :interface-type="item.source.resource.kind === 'interface' ? item.source.resource.interfaceType : undefined"
        :facet="entityFacetOf(item.source.resource)"
        :acts="item.source.resource.kind === 'entity' ? item.source.resource.acts ?? undefined : undefined"
        :member-kind="item.source.resource.kind === 'variation' ? item.source.resource.memberKind : undefined"
        :labelled="false"
        size="xs"
        class="mt-0.5"
      />
    </template>
    <template #item-label="{ item, expanded: isExpanded }">
      <!-- The summary follows the name where it fits and wraps beneath it where it does not; it never shortens the name. -->
      <span class="flex min-w-0 flex-wrap items-center gap-x-2">
        <span class="flex min-w-0 max-w-full items-center">
          <BlrResourceLink
            v-if="item.source.resource"
            :resource-key="item.source.resource.key"
            class="min-w-0 truncate text-highlighted"
            :class="[item.value === rootKey && 'font-semibold', highlight?.includes(item.source.resource.id) && item.source.resource.kind === 'capability' && 'rounded-sm bg-primary/12 px-1 text-primary']"
            :data-highlighted="(highlight?.includes(item.source.resource.id) && item.source.resource.kind === 'capability') || undefined"
            @keydown.stop
            @open="emit('open', item.source.resource)"
          >{{ item.label }}</BlrResourceLink>
          <span v-else class="min-w-0 truncate" :class="item.value === rootKey ? 'font-semibold text-highlighted' : 'text-muted'">{{ item.label }} <span v-if="item.source.groupKind" class="ms-1.5 text-xs text-dimmed">{{ item.source.count ?? item.source.children.length }}</span></span>
          <BlrNavigationMark v-if="item.source.resource?.kind === 'screen' && item.source.resource.alwaysReachable" class="ms-1.5 shrink-0" />
        </span>
        <!-- The Variation on the title row; an alternative under its set's node has it said already. -->
        <BlrVariationPill
          v-if="item.source.resource && !item.source.inSet && (item.source.resource.kind === 'variation' || item.source.resource.variation)"
          :workspace="workspace"
          :resource="item.source.resource"
          class="font-normal"
          @open="emit('open', $event)"
        />
        <!-- Only while closed: what opening this row would find. The chevron is its control. -->
        <span
          v-if="!isExpanded && item.inside.length"
          aria-hidden="true"
          class="blr-tree-inside inline-flex max-w-full cursor-pointer flex-wrap items-center gap-x-2.5 rounded-md px-1 font-normal transition-colors hover:bg-elevated/60"
          data-tree-inside
          @click.stop="toggle(item.value)"
        >
          <BlrKind
            v-for="entry in item.inside"
            :key="entry.kind"
            :kind="entry.kind"
            :count="entry.count"
            :labelled="false"
            size="xs"
            :data-tree-inside-kind="entry.kind"
          />
        </span>
      </span>
      <span v-if="item.source.note" class="block whitespace-normal text-xs font-normal text-muted" data-tree-note>{{ item.source.note }}</span>
      <span v-if="item.source.sharedFrom" class="block whitespace-normal text-xs font-normal text-muted">
        From <BlrResourceLink :resource-key="item.source.sharedFrom.key" @keydown.stop @open="emit('open', item.source.sharedFrom)">{{ item.source.sharedFrom.title }}</BlrResourceLink>
      </span>
    </template>
    <template #item-trailing><span /></template>
  </UTree>
</template>

<style scoped>
/* Faded: found below, not here. */
.blr-tree-inside {
  opacity: 0.6;
}

.blr-tree-inside:hover {
  opacity: 1;
}
</style>
