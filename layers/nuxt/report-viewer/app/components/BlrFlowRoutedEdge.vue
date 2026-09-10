<script setup lang="ts">
import { EdgeLabelRenderer } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'
import type { DiagramLayout } from '../utils/diagram'
defineProps<EdgeProps<DiagramLayout['edges'][number] & { dimmed?: boolean, quiet?: boolean }>>()
</script>
<template>
  <g :opacity="data?.dimmed ? 0.08 : data?.quiet ? 0.25 : 1">
    <path v-for="(points, index) in data?.paths" :key="index" class="vue-flow__edge-path blr-flow-route"
      :d="points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')"
      fill="none" stroke="var(--ui-text-muted)" stroke-width="1.5" :stroke-dasharray="data?.forbidden ? '5 4' : undefined" :marker-end="markerEnd" />
  </g>
  <EdgeLabelRenderer v-if="data?.labelBox && !data?.quiet && !data?.dimmed">
    <div class="blr-flow-edge-label nodrag nopan" :data-edge-id="id" :style="{ position: 'absolute', transform: `translate(${data.labelBox.x}px, ${data.labelBox.y}px)`, width: `${data.labelBox.width}px`, minHeight: `${data.labelBox.height}px` }">{{ data.label }}</div>
  </EdgeLabelRenderer>
</template>
