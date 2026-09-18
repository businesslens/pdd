<script setup lang="ts">
import { EdgeLabelRenderer } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'
import type { DiagramLayout } from '../utils/diagram'
defineProps<EdgeProps<DiagramLayout['edges'][number] & { dimmed?: boolean, quiet?: boolean, selected?: boolean }>>()
const emit = defineEmits<{ inspect: [key: string] }>()
</script>
<template>
  <g :opacity="data?.dimmed ? 0.08 : data?.quiet ? 0.25 : 1">
    <path v-for="(points, index) in data?.paths" :key="index" class="vue-flow__edge-path blr-flow-route"
      :d="points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')"
      fill="none" :style="data?.selected ? { stroke: 'var(--ui-primary)', strokeWidth: 2.5 } : undefined" :stroke-dasharray="data?.forbidden ? '5 4' : undefined" :marker-end="markerEnd" />
    <template v-if="data?.inspectionKey">
      <path v-for="(points, index) in data.paths" :key="`hit:${index}`" class="blr-flow-edge-hit nodrag nopan"
        :d="points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')"
        fill="none" stroke="transparent" stroke-width="16" @click.stop="emit('inspect', data.inspectionKey!)" />
    </template>
  </g>
  <EdgeLabelRenderer v-if="data?.labelBox && !data?.quiet && !data?.dimmed">
    <component :is="data.inspectionKey ? 'button' : 'div'" :type="data.inspectionKey ? 'button' : undefined"
      class="blr-flow-edge-label nodrag nopan" :class="data.inspectionKey && 'blr-flow-edge-button'" :data-edge-id="id"
      :aria-label="data.inspectionKey ? `Inspect ${data.inspectionLabel || data.label}` : undefined" :aria-pressed="data.inspectionKey ? Boolean(data.selected) : undefined"
      :style="{ position: 'absolute', transform: `translate(${data.labelBox.x}px, ${data.labelBox.y}px)`, width: `${data.labelBox.width}px`, minHeight: `${data.labelBox.height}px` }"
      @click.stop="data.inspectionKey && emit('inspect', data.inspectionKey)">{{ data.label }}</component>
  </EdgeLabelRenderer>
</template>

<style scoped>
.blr-flow-edge-hit { pointer-events: stroke; cursor: pointer; }
.blr-flow-edge-button { pointer-events: all; cursor: pointer; text-align: start; }
.blr-flow-edge-button:hover, .blr-flow-edge-button[aria-pressed='true'] { color: var(--ui-text-highlighted); box-shadow: 0 0 0 1px var(--ui-primary); }
.blr-flow-edge-button:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 3px; }
</style>
