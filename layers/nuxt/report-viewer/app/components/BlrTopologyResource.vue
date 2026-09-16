<script setup lang="ts">
import type { AnyResourceView } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
defineProps<{ resource: AnyResourceView }>()
const emit = defineEmits<{ open: [key: string] }>()
</script>
<template>
  <BlrResourceLink :resource-key="resource.key" class="blr-topology-link" :data-resource-key="resource.key" @open="emit('open', resource.key)">
    <BlrKind :kind="resource.kind" :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined" :facet="entityFacetOf(resource)" :labelled="false" size="xs" /><span>{{ resource.title }}</span>
  </BlrResourceLink>
</template>
