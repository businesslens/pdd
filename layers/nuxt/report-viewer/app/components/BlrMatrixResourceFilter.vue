<script setup lang="ts">
import type { AnyResourceView, ReportResourceKind } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'

const props = defineProps<{
  label: string
  kind: ReportResourceKind
  resources: AnyResourceView[]
  inSheet: boolean
}>()
const selected = defineModel<string[]>({ required: true })
const items = computed(() => props.resources.map(resource => ({
  label: resource.title, value: resource.key, kind: resource.kind,
  facet: entityFacetOf(resource),
  acts: resource.kind === 'entity' ? resource.acts : undefined,
  interfaceType: resource.kind === 'interface' ? resource.interfaceType : undefined
})))
</script>

<template>
  <USelectMenu v-model="selected" :items="items" value-key="value" multiple size="sm" variant="outline"
    :class="inSheet ? 'w-full' : 'min-w-44'" :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
    :virtualize="resources.length > 100" :search-input="{ placeholder: `Find ${label.toLowerCase()}…` }"
    :aria-label="label">
    <template #leading>
      <BlrKind :kind="kind" :labelled="false" size="xs" />
    </template>
    <template #default>
      <span class="truncate">{{ label }}</span>
      <span v-if="selected.length" class="blr-meta">({{ selected.length }})</span>
    </template>
    <template #item-leading="{ item }">
      <BlrKind :kind="item.kind" :facet="item.facet" :acts="item.acts"
        :interface-type="item.interfaceType" :labelled="false" size="xs" />
    </template>
  </USelectMenu>
</template>
