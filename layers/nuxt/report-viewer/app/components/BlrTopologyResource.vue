<script setup lang="ts">
import type { AnyResourceView } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
defineProps<{ resource: AnyResourceView }>()
const emit = defineEmits<{ open: [key: string] }>()
</script>
<template>
  <button type="button" class="blr-topology-link" :data-resource-key="resource.key" @click="emit('open', resource.key)">
    <BlrKind :kind="resource.kind" :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined" :facet="entityFacetOf(resource)" :labelled="false" size="xs" /><span>{{ resource.title }}</span>
  </button>
</template>
