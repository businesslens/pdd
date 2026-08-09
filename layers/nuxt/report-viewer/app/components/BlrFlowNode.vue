<script setup lang="ts">
/**
 * The entity box every Workbench graph is built from.
 *
 * One box, nine kinds: colour, icon and the kind label do the identifying, the
 * geometry does the state — focused boxes are larger with a standing glow,
 * selection is a ring, and dimming is fade-not-remove so the layout never
 * jumps while a reader filters.
 *
 * Besides the default pair, every box carries an invisible handle per side so
 * the radial sitemap can attach a spoke to whichever side faces the centre.
 * Edges without a handle id keep binding to the default pair, which renders
 * first.
 */
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import type { FlowNodeData } from '../utils/flowGraph'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const SIDE_HANDLES = [
  { id: 't-top', type: 'target', position: Position.Top },
  { id: 't-right', type: 'target', position: Position.Right },
  { id: 't-bottom', type: 'target', position: Position.Bottom },
  { id: 't-left', type: 'target', position: Position.Left },
  { id: 's-top', type: 'source', position: Position.Top },
  { id: 's-right', type: 'source', position: Position.Right },
  { id: 's-bottom', type: 'source', position: Position.Bottom },
  { id: 's-left', type: 'source', position: Position.Left }
] as const

const props = defineProps<NodeProps<FlowNodeData>>()

const meta = computed(() => ENTITY_KIND_META[props.data.kind])
const colorVar = computed(() => {
  if (props.data.scenarioType === 'capability') return `var(--blr-slot-${ENTITY_KIND_META.capability.slot})`
  if (props.data.scenarioType === 'journey') return `var(--blr-slot-${ENTITY_KIND_META.journey.slot})`
  return `var(--blr-slot-${meta.value.slot})`
})
</script>

<template>
  <div class="blr-flow-node-wrap">
    <Handle type="target" :position="targetPosition ?? Position.Left" class="blr-flow-handle" />
    <div
      class="blr-flow-node"
      :class="{
        'is-focus': data.focus,
        'is-selected': data.selected,
        'is-dimmed': data.dimmed
      }"
      :style="{ '--node-color': colorVar }"
    >
      <span class="blr-flow-node__icon">
        <UIcon :name="meta.icon" />
      </span>
      <span class="blr-flow-node__text">
        <span class="blr-flow-node__title">{{ data.title }}</span>
        <span class="blr-flow-node__sub">{{ data.sublabel }}</span>
      </span>
      <span v-if="data.count !== null" class="blr-flow-node__count">{{ data.count }}</span>
    </div>
    <Handle type="source" :position="sourcePosition ?? Position.Right" class="blr-flow-handle" />
    <Handle
      v-for="side in SIDE_HANDLES"
      :id="side.id"
      :key="side.id"
      :type="side.type"
      :position="side.position"
      class="blr-flow-handle blr-flow-handle--side"
    />
  </div>
</template>

<style scoped>
.blr-flow-node-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.blr-flow-node {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  height: 100%;
  padding: 0.45rem 0.65rem;
  border: 2px solid color-mix(in srgb, var(--node-color) 65%, var(--ui-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--node-color) 6%, var(--ui-bg));
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
}

.blr-flow-node:hover {
  transform: translateY(-1px);
  border-color: var(--node-color);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--node-color) 25%, transparent);
}

.blr-flow-node.is-focus {
  border-color: var(--node-color);
  background: color-mix(in srgb, var(--node-color) 11%, var(--ui-bg));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--node-color) 45%, transparent),
    0 0 22px color-mix(in srgb, var(--node-color) 28%, transparent);
}

.blr-flow-node.is-selected {
  border-color: var(--node-color);
  box-shadow: 0 0 0 2px var(--node-color),
    0 0 18px color-mix(in srgb, var(--node-color) 45%, transparent);
}

.blr-flow-node.is-dimmed {
  opacity: 0.28;
  filter: grayscale(35%);
}

.blr-flow-node__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 8px;
  background: color-mix(in srgb, var(--node-color) 18%, transparent);
  color: var(--node-color);
  font-size: 1rem;
}

.blr-flow-node.is-focus .blr-flow-node__icon {
  width: 2rem;
  height: 2rem;
  font-size: 1.15rem;
}

.blr-flow-node__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.blr-flow-node__title {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--ui-text-highlighted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blr-flow-node.is-focus .blr-flow-node__title {
  font-size: 0.8rem;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.blr-flow-node__sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blr-flow-node__count {
  flex-shrink: 0;
  min-width: 1.15rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--node-color) 16%, transparent);
  color: var(--node-color);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.15rem;
  text-align: center;
}

.blr-flow-handle {
  width: 6px !important;
  height: 6px !important;
  min-width: 0 !important;
  min-height: 0 !important;
  border: none !important;
  background: color-mix(in srgb, var(--ui-text-dimmed) 45%, transparent) !important;
}

/* Spoke anchors for the radial sitemap — geometry only, never drawn. */
.blr-flow-handle--side {
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>
