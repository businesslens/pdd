<script setup lang="ts">
/**
 * The one Vue Flow surface every Product Report topology view draws on.
 *
 * Owning the canvas in one place keeps the graphs comparable across views:
 * the same dotted background, the same controls, the same fit behaviour, the
 * same element boxes. Views pass placed nodes and edges (see flowGraph.ts)
 * and listen for selection; nothing here decides what a graph contains.
 */
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
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
  /** A box was clicked; the key is the collision-safe element identity. */
  select: [elementKey: string]
  /** A box was double-clicked — views treat this as "make this the focus". */
  focus: [elementKey: string]
  /** The empty canvas was clicked. */
  clear: []
  /** An element box was entered or left; synthetic chrome emits null. */
  hover: [elementKey: string | null]
}>()

const flowId = useId()
const {
  fitView,
  zoomIn,
  zoomOut,
  onNodeClick,
  onNodeDoubleClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onPaneClick,
  onNodesInitialized
} = useVueFlow(flowId)

const canvasWidth = ref(0)
const compactCanvas = computed(() => canvasWidth.value > 0 && canvasWidth.value < 640)
const minimumZoom = computed(() => compactCanvas.value ? 0.72 : 0.12)
const fitParams = computed(() => ({
  padding: props.fitPadding,
  minZoom: minimumZoom.value,
  maxZoom: props.maxZoom,
  duration: 240
}))

onNodeClick(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData
  if (data?.elementKey) emit('select', data.elementKey)
})
onNodeDoubleClick(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData
  if (data?.elementKey) emit('focus', data.elementKey)
})
onNodeMouseEnter(({ node }) => {
  const data = node.data as FlowNodeData | FlowGroupData | FlowLabelData
  emit('hover', data?.elementKey || null)
})
onNodeMouseLeave(() => emit('hover', null))
onPaneClick(() => emit('clear'))
onNodesInitialized(() => fitView(fitParams.value))

// The canvas is measured before the surrounding panes settle, which can strand
// the fitted viewport.
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
    canvasWidth.value = width
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
// view switching between two drawings of the same nodes refits too.
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
        :min-zoom="minimumZoom"
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
        <slot />
      </VueFlow>
      <div v-if="showControls" class="blr-flow-controls" aria-label="Map controls">
        <button type="button" aria-label="Zoom in" title="Zoom in" @click="zoomIn()">+</button>
        <button type="button" aria-label="Zoom out" title="Zoom out" @click="zoomOut()">−</button>
        <button type="button" aria-label="Fit map to view" title="Fit map to view" @click="fitView(fitParams)">□</button>
      </div>
      <span v-if="compactCanvas" class="blr-flow-mobile-hint">Drag to explore</span>
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

/*
  Categorical slots for the flow surfaces, mirrored from reportPalette.ts —
  the CSS variable form exists so boxes and edges resolve colour purely in
  CSS and never wait on a colour-mode ref. Slot 9 (product) reuses slot 0,
  matching slotColor()'s modulo.
*/
.blr-flow-shell {
  position: relative;
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

.blr-flow-controls {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 30;
  display: grid;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--ui-bg) 94%, transparent);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--ui-text) 10%, transparent);
}

.blr-flow-controls button {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border: 0;
  border-bottom: 1px solid var(--ui-border);
  background: transparent;
  color: var(--ui-text-muted);
  font-family: var(--font-mono);
  font-size: 1rem;
  line-height: 1;
}

.blr-flow-controls button:last-child {
  border-bottom: 0;
}

.blr-flow-controls button:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-flow-mobile-hint {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  z-index: 30;
  transform: translateX(-50%);
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-bg) 92%, transparent);
  padding: 0.25rem 0.6rem;
  color: var(--ui-text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  box-shadow: 0 3px 12px color-mix(in srgb, var(--ui-text) 8%, transparent);
  pointer-events: none;
}
</style>
