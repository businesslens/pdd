<script setup lang="ts">
/**
 * A row that opens to what the model files under it.
 *
 * The row is the resource's card, and the whole row opens and closes, the way
 * the group header above it does and with the same count-and-chevron at its
 * end; a dedicated button beside them opens the page, so the reader stays on
 * this surface until they choose to leave it. A row with nothing under it is an
 * ordinary row and opens its page. Children are rows of the same shape,
 * indented once, so a Capability reads as a Capability and then its Scenarios.
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
  /** Narrow rows in a grid stack their metrics under the title. */
  stacked?: boolean
}>(), { badge: true, stacked: false })

const emit = defineEmits<{ open: [resource: AnyResourceView], toggle: [key: string, open: boolean] }>()
const isOpen = computed(() => props.expanded.includes(props.resource.key))
</script>

<template>
  <div class="blr-row-tree" :data-row-key="resource.key">
    <BlrResourceCard
      :workspace="workspace"
      :resource="resource"
      :badge="badge"
      :hook-label="hookLabel"
      :hook="hook"
      :stacked="stacked"
      :expandable="children.length > 0"
      :open="isOpen"
      :count="children.length"
      @open="emit('open', $event)"
      @toggle="emit('toggle', resource.key, !isOpen)"
    />
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
        @open="emit('open', $event)"
        @toggle="(key, open) => emit('toggle', key, open)"
      />
    </div>
  </div>
</template>
