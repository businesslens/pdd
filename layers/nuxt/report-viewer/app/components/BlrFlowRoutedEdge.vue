<script setup lang="ts">
import { EdgeLabelRenderer } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'
import type { DiagramLayout } from '../utils/diagram'
defineProps<EdgeProps<DiagramLayout['edges'][number] & { dimmed?: boolean, quiet?: boolean, selected?: boolean }>>()
const emit = defineEmits<{ open: [key: string], inspect: [key: string, part?: string], hover: [id: string | null], focus: [id: string | null] }>()
/* The label opens what the edge stands for: a Capability page, or a local
   inspection — which also says which badge was reached for, so the reading
   can show that part of it. */
function activate(data: { resourceKey?: string, inspectionKey?: string }, event?: Event) {
  if (data.resourceKey) emit('open', data.resourceKey)
  else if (data.inspectionKey) {
    const badge = (event?.target as Element | null)?.closest?.('[data-edge-badge]')?.getAttribute('data-edge-badge') ?? undefined
    emit('inspect', data.inspectionKey, badge)
  }
}
</script>
<template>
  <g :opacity="data?.dimmed ? 0.08 : data?.quiet ? 0.25 : data?.faint ? 0.55 : 1">
    <path v-for="(points, index) in data?.paths" :key="index" class="vue-flow__edge-path blr-flow-route"
      :d="points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')"
      fill="none" :style="data?.selected ? { stroke: 'var(--ui-primary)', strokeWidth: 2.5 } : undefined" :stroke-dasharray="data?.forbidden ? '5 4' : data?.conditional || data?.alternative ? '8 4' : data?.faint ? '2 4' : undefined" :marker-end="markerEnd" />
    <template v-if="data?.inspectionKey || data?.resourceKey">
      <path v-for="(points, index) in data.paths" :key="`hit:${index}`" class="blr-flow-edge-hit nodrag nopan"
        :d="points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')"
        fill="none" stroke="transparent" stroke-width="16" @click.stop="activate(data)" @mouseenter="emit('hover', id)" @mouseleave="emit('hover', null)"><title v-if="data.note">{{ data.note }}</title></path>
    </template>
  </g>
  <EdgeLabelRenderer v-if="data?.labelBox && !data?.quiet && !data?.dimmed">
    <component :is="data.inspectionKey || data.resourceKey ? 'button' : 'div'" :type="data.inspectionKey || data.resourceKey ? 'button' : undefined"
      class="blr-flow-edge-label nodrag nopan" :class="[(data.inspectionKey || data.resourceKey) && 'blr-flow-edge-button', { 'blr-flow-edge-label--badges': data.badges?.length || data.label }]" :data-edge-id="id" :title="data.note"
      :aria-label="data.resourceKey ? `Open ${data.label}` : data.inspectionKey ? `Inspect ${data.inspectionLabel || data.label}` : undefined" :aria-pressed="data.inspectionKey ? Boolean(data.selected) : undefined"
      :style="{ position: 'absolute', transform: `translate(${data.labelBox.x}px, ${data.labelBox.y}px)`, width: `${data.labelBox.width}px`, minHeight: `${data.labelBox.height}px` }"
      @click.stop="activate(data, $event)" @mouseenter="emit('hover', id)" @mouseleave="emit('hover', null)" @focus="emit('focus', id)" @blur="emit('focus', null)"><BlrFlowEdgeLabel :edge="data" /></component>
  </EdgeLabelRenderer>
</template>

<style scoped>
.blr-flow-edge-hit { pointer-events: stroke; cursor: pointer; }
.blr-flow-edge-button { pointer-events: all; cursor: pointer; text-align: start; }
.blr-flow-edge-button:hover, .blr-flow-edge-button[aria-pressed='true'] { color: var(--ui-text-highlighted); box-shadow: 0 0 0 1px var(--ui-primary); }
.blr-flow-edge-button:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 3px; }
/* A label of badges has no box of its own to ring: hover and selection mark the badges themselves. */
.blr-flow-edge-button.blr-flow-edge-label--badges:hover, .blr-flow-edge-button.blr-flow-edge-label--badges[aria-pressed='true'] { box-shadow: none; }
.blr-flow-edge-button.blr-flow-edge-label--badges:hover :deep(.blr-flow-edge-badge),
.blr-flow-edge-button.blr-flow-edge-label--badges[aria-pressed='true'] :deep(.blr-flow-edge-badge) { border-color: var(--ui-primary); }
</style>
