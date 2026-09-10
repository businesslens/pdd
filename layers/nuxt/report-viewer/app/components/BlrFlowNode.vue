<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { DiagramNode } from '../utils/diagram'
defineProps<NodeProps<DiagramNode & { dimmed?: boolean }>>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean] }>()
</script>
<template>
  <div class="blr-flow-node-wrap" :style="{ opacity: data.dimmed ? 0.25 : 1 }">
    <Handle type="target" :position="targetPosition ?? Position.Left" class="blr-flow-handle" />
    <BlrFlowNodeContent :node="data" @open="emit('open', $event)" @toggle="(id, open) => emit('toggle', id, open)" />
    <Handle type="source" :position="sourcePosition ?? Position.Right" class="blr-flow-handle" />
  </div>
</template>
<style scoped>
.blr-flow-node-wrap { width: 100%; height: 100%; position: relative; transition: opacity 0.12s; }
.blr-flow-handle { opacity: 0; pointer-events: none; }
</style>
