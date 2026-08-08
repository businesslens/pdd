<script setup lang="ts">
/**
 * The one Vue Flow surface every report design draws on.
 *
 * Owning the canvas in one place keeps the graphs comparable across designs:
 * the same dotted background, the same controls, the same fit behaviour, the
 * same entity boxes. Designs pass placed nodes and edges (see flowGraph.ts)
 * and listen for selection; nothing here decides what a graph contains.
 */
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { BlrFlowEdge, BlrFlowNode, FlowGroupData, FlowLabelData, FlowNodeData } from '../utils/flowGraph'

const props = withDefaults(defineProps<{
  nodes: BlrFlowNode[]
  edges?: BlrFlowEdge[]
  /** Padding handed to fitView; fraction of the viewport. */
  fitPadding?: number
  maxZoom?: number
  showControls?: boolean
}>(), {
  edges: () => [],
  fitPadding: 0.16,
  maxZoom: 1.35,
  showControls: true
})

const emit = defineEmits<{
  /** A box was clicked; the id is the *entity* id, not the node id. */
  select: [entityId: string]
  /** A box was double-clicked — designs treat this as "make this the focus". */
  focus: [entityId: string]
  /** The empty canvas was clicked. */
  clear: []
  /** An entity box was entered or left; synthetic chrome emits null. */
  hover: [entityId: string | null]
}>()

const flowId = useId()
const {
  fitView,
  onNodeClick,
  onNodeDoubleClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onPaneClick,
  onNodesInitialized
} = useVueFlow(flowId)

const fitParams = computed(() => ({ padding: props.fitPadding, maxZoom: props.maxZoom, duration: 240 }))

onNodeClick(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData
  if (data?.entityId) emit('select', data.entityId)
})
onNodeDoubleClick(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData
  if (data?.entityId) emit('focus', data.entityId)
})
onNodeMouseEnter(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData | FlowLabelData
  emit('hover', data?.entityId || null)
})
onNodeMouseLeave(() => emit('hover', null))
onPaneClick(() => emit('clear'))
onNodesInitialized(() => fitView(fitParams.value))

// The canvas is measured before the page settles — the theme lab bar and the
// surrounding panes mount after the flow, which strands the fitted viewport.
// Refit on every observed size, including the first (the initial fit may
// already be stale by the time the observer attaches), then once more after
// the animation, because a fit started mid-settle measures mid-settle. Any
// newer resize cancels both.
const shellEl = ref<HTMLElement | null>(null)
watch(shellEl, (el, _previous, onCleanup) => {
  if (!el || typeof ResizeObserver === 'undefined') return
  let lastWidth = -1
  let lastHeight = -1
  let timer: ReturnType<typeof setTimeout> | undefined
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  const observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    const { width, height } = entry.contentRect
    if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 1) return
    lastWidth = width
    lastHeight = height
    clearTimeout(timer)
    clearTimeout(settleTimer)
    timer = setTimeout(() => {
      fitView(fitParams.value)
      settleTimer = setTimeout(() => fitView(fitParams.value), 500)
    }, 120)
  })
  observer.observe(el)
  onCleanup(() => {
    observer.disconnect()
    clearTimeout(timer)
    clearTimeout(settleTimer)
  })
}, { immediate: true })

// Refit when the graph's membership or layout changes, not on every emphasis
// toggle — dim/select only rewrite data, and a stable viewport is what makes
// the fade-not-remove filtering readable. Positions are part of the key so a
// design switching between two drawings of the same nodes refits too.
const layoutKey = computed(() => props.nodes
  .map(node => `${node.id}@${Math.round(node.position.x)},${Math.round(node.position.y)}`)
  .sort()
  .join('|'))
watch(layoutKey, async () => {
  await nextTick()
  requestAnimationFrame(() => fitView(fitParams.value))
})
</script>

<template>
  <ClientOnly>
    <div ref="shellEl" class="blr-flow-shell">
      <VueFlow
        :id="flowId"
        class="blr-flow"
      :nodes="nodes"
      :edges="edges"
        :min-zoom="0.12"
        :max-zoom="2"
        :nodes-connectable="false"
        :nodes-draggable="false"
        :edges-updatable="false"
        :zoom-on-double-click="false"
        :prevent-scrolling="true"
        fit-view-on-init
      >
        <template #node-blr="nodeProps">
          <BlrFlowNode v-bind="(nodeProps as any)" />
        </template>
        <template #node-blr-group="nodeProps">
          <BlrFlowGroup v-bind="(nodeProps as any)" />
        </template>
        <template #node-blr-label="nodeProps">
          <BlrFlowLabel v-bind="(nodeProps as any)" />
        </template>
        <Background
          :gap="30"
          :size="2"
          variant="dots"
          :style="{ backgroundColor: 'transparent' }"
          pattern-color="var(--blr-flow-dot)"
        />
        <Controls v-if="showControls" position="bottom-right" :show-interactive="false" :fit-view-params="fitParams" />
        <slot />
      </VueFlow>
    </div>
    <template #fallback>
      <div class="blr-flow blr-flow--loading">
        <span class="blr-field">Drawing map…</span>
      </div>
    </template>
  </ClientOnly>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/controls/dist/style.css';

/*
  Categorical slots for the flow surfaces, mirrored from reportPalette.ts —
  the CSS variable form exists so boxes and edges resolve colour purely in
  CSS and never wait on a colour-mode ref. Slot 9 (product) reuses slot 0,
  matching slotColor()'s modulo.
*/
.blr-flow-shell {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.blr-flow {
  --blr-slot-0: #2a78d6;
  --blr-slot-1: #eb6834;
  --blr-slot-2: #1baf7a;
  --blr-slot-3: #eda100;
  --blr-slot-4: #e87ba4;
  --blr-slot-5: #008300;
  --blr-slot-6: #4a3aa7;
  --blr-slot-7: #e34948;
  --blr-slot-8: #746651;
  --blr-slot-9: #2a78d6;
  --blr-flow-dot: color-mix(in srgb, var(--ui-text-dimmed) 28%, transparent);
  --blr-flow-edge: color-mix(in srgb, var(--ui-text-dimmed) 55%, transparent);
  --blr-flow-edge-emphasis: var(--ui-primary);
  --blr-flow-edge-marker: color-mix(in srgb, var(--ui-text-dimmed) 75%, transparent);
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
}

.dark .blr-flow {
  --blr-slot-0: #3987e5;
  --blr-slot-1: #d95926;
  --blr-slot-2: #199e70;
  --blr-slot-3: #c98500;
  --blr-slot-4: #d55181;
  --blr-slot-5: #008300;
  --blr-slot-6: #9085e9;
  --blr-slot-7: #e66767;
  --blr-slot-8: #ab9d81;
  --blr-slot-9: #3987e5;
}

.blr-flow--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
}

/* Boxes above containment frames, edges beneath both. */
.blr-flow .vue-flow__node-blr {
  z-index: 10 !important;
}

.blr-flow .vue-flow__node-blr-group {
  z-index: 1 !important;
}

.blr-flow .vue-flow__node-blr-label {
  z-index: 20 !important;
}

/* Edges never intercept the pointer — boxes are the interaction surface. */
.blr-flow .vue-flow__edge,
.blr-flow .vue-flow__edge-path,
.blr-flow .vue-flow__edge-interaction,
.blr-flow .vue-flow__edge-textwrapper,
.blr-flow .vue-flow__edge text {
  pointer-events: none !important;
}

.blr-flow .vue-flow__edge-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease;
}

.blr-flow .vue-flow__controls {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--ui-bg) 94%, transparent);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--ui-text) 10%, transparent);
}

.blr-flow .vue-flow__controls-button {
  border: 0;
  border-bottom: 1px solid var(--ui-border);
  background: transparent;
  color: var(--ui-text-muted);
}

.blr-flow .vue-flow__controls-button:last-child {
  border-bottom: 0;
}

.blr-flow .vue-flow__controls-button:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-flow .vue-flow__controls-button svg {
  fill: currentColor;
}
</style>
