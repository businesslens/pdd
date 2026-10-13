<script setup lang="ts">
import type { AnyResourceView } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
defineProps<{ resource: AnyResourceView }>()
const emit = defineEmits<{ open: [key: string] }>()
</script>
<template>
  <ReportResourceLink :resource-key="resource.key" class="report-topology-link" :data-resource-key="resource.key" @open="emit('open', resource.key)">
    <ReportKind :kind="resource.kind" :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined" :facet="entityFacetOf(resource)" :labelled="false" size="xs" /><span>{{ resource.title }}</span>
  </ReportResourceLink>
</template>
