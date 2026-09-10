<script setup lang="ts">
import type { InterfaceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading, toggleTopologyGroup } from '../utils/topologyState'
import { interfaceProjection } from '../utils/topologyProjections'
const props = defineProps<{ workspace: ReportWorkspace, resource: InterfaceView }>()
const emit = defineEmits<{ open: [key: string] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const delivery = computed(() => interfaceProjection(props.workspace, true).find(branch => branch.id === props.resource.key))
</script>
<template>
  <section v-if="delivery" class="space-y-3" aria-label="Interface delivery" data-interface-delivery>
    <h2 class="text-sm font-semibold text-highlighted">Delivery</h2>
    <div v-if="delivery.references.length" class="flex flex-wrap items-center gap-2">
      <span class="text-xs text-muted">Entered by</span>
      <BlrTopologyResource v-for="actor in delivery.references" :key="actor.key" :resource="actor" @open="emit('open', $event)" />
    </div>
    <div class="blr-topology-grid">
      <BlrTopologyBranch v-for="branch in delivery.children" :key="branch.id" :branch="branch" :reading="reading" @open="emit('open', $event)" @toggle="(id, open) => reading = toggleTopologyGroup(reading, id, open)" />
    </div>
    <p v-if="!delivery.children.length" class="text-sm text-muted">No contained resources or delivered Capabilities are modeled.</p>
  </section>
</template>
