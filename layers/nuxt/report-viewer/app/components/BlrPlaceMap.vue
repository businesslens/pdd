<script setup lang="ts">
/**
 * A place's own UI map: the derived map of Scenario moves, focused on this
 * Interface, Experience or Screen — what it holds, and the places one move in
 * or out. Movement is read one place at a time; the Interfaces collection
 * draws the delivery map instead.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const focused = (): TopologyReading => ({ ...defaultTopologyReading(), view: 'ui-map', focus: [props.resource.key] })
const reading = ref<TopologyReading>(focused())
watch(() => props.resource.key, () => { reading.value = focused() })
const keys = computed(() => props.workspace.interfaces.map(item => item.key))
</script>

<template>
  <div class="blr-place-map" data-place-map>
  <BlrCollectionGraph
    v-model:reading="reading"
    :workspace="workspace"
    kind="interface"
    view="ui-map"
    :visible-keys="keys"
    :narrowed="false"
    @select="emit('open', $event)"
  />
  </div>
</template>

<style scoped>
/* The slideover renders outside the report shell, so the drawing's height chain is set here. */
.blr-place-map { display: flex; flex-direction: column; height: 100%; min-height: 28rem; }
.blr-place-map :deep(.blr-product-topology) { display: flex; flex: 1; flex-direction: column; min-height: 0; min-width: 0; }
</style>
