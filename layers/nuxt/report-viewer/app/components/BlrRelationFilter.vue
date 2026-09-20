<script setup lang="ts">
import type { AnyResourceView, ReportResourceKind } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf } from '../utils/reportWorkspace'

const props = defineProps<{
  label: string
  resources: AnyResourceView[]
  grouped: boolean
  inSheet: boolean
  showParents?: boolean
  kind?: ReportResourceKind
}>()
const selected = defineModel<string[]>({ required: true })
function parentNames(resource: AnyResourceView) {
  if (!props.showParents || (resource.kind !== 'screen' && resource.kind !== 'experience')) return undefined
  const keys = [...resource.interfaceIds.map(id => `interface:${id}`),
    ...(resource.kind === 'screen' ? resource.experienceIds.map(id => `experience:${id}`) : [])]
  return keys.flatMap(key => {
    const parent = props.resources.find(item => item.key === key)
    return parent ? [parent.title] : []
  }).join(' · ')
}
const items = computed(() => {
  const kinds = [...new Set(props.resources.map(resource => resource.kind))]
  return kinds.map(kind => [
    ...(props.grouped ? [
      { type: 'label' as const, label: ENTITY_KIND_META[kind].plural, value: `label:${kind}`, kind },
      { label: `Any ${ENTITY_KIND_META[kind].label}`, value: `type:${kind}`, kind }
    ] : []),
    ...props.resources.filter(resource => resource.kind === kind).map(resource => ({
      label: resource.title, description: parentNames(resource), value: resource.key, kind, facet: entityFacetOf(resource),
      acts: resource.kind === 'entity' ? resource.acts : undefined,
      interfaceType: resource.kind === 'interface' ? resource.interfaceType : undefined
    }))
  ])
})
</script>
<template>
  <USelectMenu v-model="selected" :items="items" value-key="value" multiple size="sm" variant="outline"
    :class="inSheet ? 'w-full' : 'min-w-44'" :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
    :virtualize="resources.length > 100" :filter-fields="['label', 'description']" :search-input="{ placeholder: 'Find a resource or type…' }" :aria-label="label">
    <template #leading>
      <BlrKind v-if="kind" :kind="kind" :labelled="false" size="xs" />
      <UIcon v-else name="i-lucide-funnel" class="size-4 shrink-0 text-muted" />
    </template>
    <template #default><span class="truncate">{{ label }}</span><span v-if="selected.length" class="blr-meta">({{ selected.length }})</span></template>
    <template #item-leading="{ item }">
      <BlrKind :kind="item.kind" :facet="'facet' in item ? item.facet : undefined" :acts="'acts' in item ? item.acts : undefined"
        :interface-type="'interfaceType' in item ? item.interfaceType : undefined" :labelled="false" size="xs" />
    </template>
  </USelectMenu>
</template>
