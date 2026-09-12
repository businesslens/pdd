<script setup lang="ts">
/**
 * A row that opens to what the model files under it.
 *
 * The row is the resource's card, and clicking it opens the page as every row
 * does. The toggle at its end is a separate control — a button cannot hold a
 * button — and it says how many children wait below, the way a branch in the
 * Interface map does. Children are rows of the same shape, indented once, so a
 * Domain reads as a Domain and then its Capabilities and Entities, an Interface
 * as an Interface and then its Experiences and their Screens.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { RowChild } from '../utils/collectionChildren'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  children: RowChild[]
  hookLabel?: string
  hook?: string
  badge?: boolean
  /** Which rows are open, by resource key; nested rows share the one list. */
  expanded: string[]
  /** Whether a row with no children still reserves the toggle's width. */
  aligned?: boolean
  /** Narrow rows in a grid stack their metrics under the title. */
  stacked?: boolean
}>(), { badge: true, aligned: true, stacked: false })

const emit = defineEmits<{ open: [resource: AnyResourceView], toggle: [key: string, open: boolean] }>()
const isOpen = computed(() => props.expanded.includes(props.resource.key))
</script>

<template>
  <div class="blr-row-tree" :data-row-key="resource.key">
    <div class="flex items-stretch gap-2">
      <BlrResourceCard
        class="min-w-0 flex-1"
        :workspace="workspace"
        :resource="resource"
        :badge="badge"
        :hook-label="hookLabel"
        :hook="hook"
        :stacked="stacked"
        @open="emit('open', $event)"
      />
      <button
        v-if="children.length"
        type="button"
        class="blr-row-toggle"
        :aria-expanded="isOpen"
        :aria-label="`${isOpen ? 'Collapse' : 'Expand'} ${resource.title}, ${children.length} ${children.length === 1 ? 'item' : 'items'}`"
        @click="emit('toggle', resource.key, !isOpen)"
      >
        <span class="font-mono text-xs tabular-nums">{{ children.length }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 transition-transform" :class="isOpen && 'rotate-180'" />
      </button>
      <span v-else-if="aligned" class="blr-row-toggle invisible" aria-hidden="true" />
    </div>
    <div v-if="children.length && isOpen" class="blr-row-children">
      <BlrExpandableRow
        v-for="child in children"
        :key="child.resource.key"
        :workspace="workspace"
        :resource="child.resource"
        :children="child.children"
        :hook-label="child.hookLabel"
        :hook="child.hook"
        :badge="resource.kind !== 'domain'"
        :stacked="stacked"
        :expanded="expanded"
        :aligned="children.some(item => item.children.length)"
        @open="emit('open', $event)"
        @toggle="(key, open) => emit('toggle', key, open)"
      />
    </div>
  </div>
</template>
