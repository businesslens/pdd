<script setup lang="ts">
/**
 * A frame: a place drawn around the places it holds. The header is the same
 * card content a leaf shows, compact, and opens the place; the frame itself is
 * only a boundary, so the canvas pans through it.
 */
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { DiagramNode } from '../utils/diagram'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
const props = defineProps<NodeProps<DiagramNode & { dimmed?: boolean, highlighted?: boolean }>>()
const emit = defineEmits<{ open: [key: string], inspect: [key: string], toggle: [id: string, open: boolean], focus: [id: string | null] }>()
/* A Variation's frame wears the color of the type it varies, as its node does in a tree. */
const color = computed(() => `var(--blr-slot-${props.data.colorSlot ?? (props.data.kind === 'variation' && props.data.memberKind ? ENTITY_KIND_META[props.data.memberKind].slot : props.data.kind ? ENTITY_KIND_META[props.data.kind].slot : 0)})`)
function blur(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) emit('focus', null)
}
</script>
<template>
  <div class="blr-flow-group" :class="{ 'blr-flow-group--highlighted': data.highlighted }" :style="{ '--node-color': color, opacity: data.dimmed ? 0.25 : 1 }"
    :data-resource-key="data.resourceKey" data-flow-group @focusin="emit('focus', id)" @focusout="blur">
    <Handle type="target" :position="targetPosition ?? Position.Left" class="blr-flow-handle" />
    <div class="blr-flow-group__header">
      <BlrFlowNodeContent :node="data" :highlighted="data.highlighted" @open="emit('open', $event)" @inspect="emit('inspect', $event)" @toggle="(id, open) => emit('toggle', id, open)" />
    </div>
    <Handle type="source" :position="sourcePosition ?? Position.Right" class="blr-flow-handle" />
  </div>
</template>
<style scoped>
.blr-flow-group { position: relative; width: 100%; height: 100%; box-sizing: border-box; border: 1.5px solid color-mix(in srgb, var(--node-color) 45%, var(--ui-border)); border-radius: 12px; background: color-mix(in srgb, var(--node-color) 4%, transparent); transition: opacity 0.12s, border-color 0.15s ease, box-shadow 0.15s ease; }
.blr-flow-group--highlighted { border-color: var(--node-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color) 25%, transparent); }
.blr-flow-group__header { position: absolute; top: 0; left: 0; max-width: 100%; }
.blr-flow-handle { opacity: 0; pointer-events: none; }
</style>
