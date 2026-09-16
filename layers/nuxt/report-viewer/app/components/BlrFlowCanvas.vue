<script setup lang="ts">
import { VueFlow, MarkerType, Position, getTransformForBounds, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'
import type { DiagramLayout, DiagramNode } from '../utils/diagram'
import { diagramBounds, diagramContext } from '../utils/diagramInteraction'

const props = defineProps<{ layout: DiagramLayout, title: string, viewportKey: string, tree?: boolean, direction?: 'RIGHT' | 'DOWN', quiet?: boolean, totalNodes?: number, branches?: boolean }>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean], toggleAll: [open: boolean], ready: [] }>()
const id = useId()
const viewerId = inject<string>('businesslens:viewer', '')
const shell = ref<HTMLElement>()
const ready = ref(false)
const active = ref<string | null>(null)
let hovered: string | null = null
let focused: string | null = null
const { zoomIn, zoomOut, viewport, setViewport, onNodesInitialized, onViewportChangeStart, onViewportChangeEnd } = useVueFlow(id)
let resize: ResizeObserver | undefined
let width = 0, height = 0
let restoring = false
let initialized = ''
let mounted = false
let centerAfterLayout = false
let centeringFrame: number | undefined
let centering = false
let centerRequest = 0
const signature = computed(() => JSON.stringify([props.viewportKey, props.layout.nodes.map(node => [node.id, node.x, node.y, node.width, node.height])]))
const storageKey = () => `businesslens:flow:${location.pathname}:${viewerId}:${props.viewportKey}`
const context = computed(() => diagramContext({ ...props.layout, layout: props.tree ? 'tree' : undefined }, active.value))
const nodes = computed<Node<DiagramNode & { dimmed: boolean, highlighted: boolean }>[]>(() => {
  return props.layout.nodes.map(node => {
    return { id: node.id, type: 'blr', position: { x: node.x, y: node.y },
      width: node.width, height: node.height, style: { width: `${node.width}px`, height: `${node.height}px` },
      sourcePosition: props.direction === 'DOWN' ? Position.Bottom : Position.Right,
      targetPosition: props.direction === 'DOWN' ? Position.Top : Position.Left,
      selectable: false, draggable: false, connectable: false, focusable: false, zIndex: 10,
      data: { ...node, dimmed: Boolean(context.value && !context.value.nodes.has(node.id)), highlighted: Boolean(context.value?.occurrences.has(node.id)) } }
  })
})
const edges = computed<Edge[]>(() => props.layout.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target, type: 'blr-routed',
  markerEnd: edge.arrow === false ? undefined : { type: MarkerType.ArrowClosed, color: 'var(--ui-text-muted)', width: 14, height: 14 },
  selectable: false, focusable: false, data: { ...edge,
    dimmed: Boolean(context.value && !context.value.edges.has(edge.id)), quiet: Boolean(props.quiet && !context.value) } })))

function hoverNode(id: string | null) {
  hovered = id
  active.value = id ?? focused
}
function focusNode(id: string | null) {
  focused = id
  active.value = id ?? hovered
}
function toggle(id: string, open: boolean) {
  save()
  centerAfterLayout = true
  emit('toggle', id, open)
}
function toggleAll(open: boolean) {
  save()
  centerAfterLayout = true
  emit('toggleAll', open)
}

function save() {
  if (!mounted || !ready.value || restoring) return
  try { sessionStorage.setItem(storageKey(), JSON.stringify({ ...viewport.value, width: width || shell.value?.clientWidth, height: height || shell.value?.clientHeight })) } catch { /* Reading works without storage. */ }
}
async function zoom(inward: boolean) {
  cancelCentering()
  await (inward ? zoomIn({ duration: 0 }) : zoomOut({ duration: 0 }))
  save()
}
function fittedViewport(minZoom = 0.08) {
  return getTransformForBounds(diagramBounds(props.layout), shell.value!.clientWidth, shell.value!.clientHeight, minZoom, 1, 0.12)
}
function cancelCentering() {
  centerRequest++
  centering = false
  if (centeringFrame !== undefined) cancelAnimationFrame(centeringFrame)
  centeringFrame = undefined
}
function fit() {
  cancelCentering()
  centering = true
  const request = centerRequest
  // Root collapse also removes the Relationships footer. Let that resize settle
  // before centering, and keep the resize observer from interrupting this move.
  centeringFrame = requestAnimationFrame(() => {
    centeringFrame = requestAnimationFrame(() => {
      centeringFrame = undefined
      if (!mounted || request !== centerRequest) return
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500
      // Programmatic moves do not emit viewport-change-end. Save on completion;
      // superseded animations never resolve and must not hold layout readiness.
      void setViewport(fittedViewport(), { duration }).then(() => {
        if (!mounted || request !== centerRequest) return
        centering = false
        save()
      })
    })
  })
}
async function initialize() {
  if (!mounted || initialized === signature.value || !shell.value?.clientWidth) return
  const current = signature.value
  initialized = current
  restoring = true
  await nextTick()
  if (!mounted || signature.value !== current) return
  const shouldCenter = centerAfterLayout
  centerAfterLayout = false
  let saved: ViewportTransform | undefined
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey()) ?? 'null')
    if (value && [value.x, value.y, value.zoom].every(Number.isFinite) && value.zoom >= 0.08 && value.zoom <= 2) {
      saved = { x: value.x, y: value.y, zoom: value.zoom }
      if ([value.width, value.height].every(Number.isFinite)) {
        saved.x += (shell.value.clientWidth - value.width) / 2
        saved.y += (shell.value.clientHeight - value.height) / 2
      }
    }
  } catch { /* Ignore stale storage. */ }
  if (shouldCenter) fit()
  else {
    cancelCentering()
    if (saved) await setViewport(saved)
    else await setViewport(fittedViewport(shell.value.clientWidth < 640 ? 0.85 : 0.08))
  }
  if (!mounted || signature.value !== current) return
  ready.value = true
  restoring = false
  save()
  emit('ready')
}
onNodesInitialized(initialize)
// Vue Flow emits this hook for user gestures, which take over from auto-centering.
onViewportChangeStart(cancelCentering)
onViewportChangeEnd(save)
watch(signature, () => { ready.value = false; void nextTick().then(initialize) })
onMounted(() => {
  mounted = true
  window.addEventListener('pagehide', save)
  resize = new ResizeObserver(([entry]) => {
    if (!entry) return
    // Use the same integer dimensions as initialize() so reload does not drift
    // by subpixels when restoring a previously measured viewport.
    const next = { width: shell.value?.clientWidth ?? 0, height: shell.value?.clientHeight ?? 0 }
    if (width && height && ready.value && (Math.abs(next.width - width) > 1 || Math.abs(next.height - height) > 1)) {
      // Finish centering against the new size. Ordinary resizing preserves the
      // reader's zoom and the graph point under the viewport centre.
      if (centering) fit()
      else if (!centerAfterLayout) void setViewport({ ...viewport.value, x: viewport.value.x + (next.width - width) / 2, y: viewport.value.y + (next.height - height) / 2 })
    }
    width = next.width; height = next.height
  })
  if (shell.value) resize.observe(shell.value)
})
onBeforeUnmount(() => { save(); mounted = false; cancelCentering(); resize?.disconnect(); window.removeEventListener('pagehide', save) })
</script>

<template>
  <div ref="shell" class="blr-flow-shell" :data-flow-ready="ready || undefined" :aria-label="title">
    <VueFlow :id="id" class="blr-flow" :nodes="nodes" :edges="edges" :min-zoom="0.08" :max-zoom="2"
      :nodes-connectable="false" :nodes-draggable="false" :edges-updatable="false" :zoom-on-double-click="false"
      :prevent-scrolling="true" @node-mouse-enter="hoverNode($event.node.id)" @node-mouse-leave="hoverNode(null)">
      <template #node-blr="nodeProps"><BlrFlowNode v-bind="nodeProps" @open="save(); emit('open', $event)" @toggle="toggle" @focus="focusNode" /></template>
      <template #edge-blr-routed="edgeProps"><BlrFlowRoutedEdge v-bind="edgeProps" /></template>
      <Background :gap="30" :size="1.5" variant="dots" pattern-color="var(--blr-flow-dot)" />
    </VueFlow>
    <div class="blr-flow-controls" role="group" aria-label="Map controls">
      <button type="button" aria-label="Zoom in" title="Zoom in" @click="zoom(true)">+</button>
      <button type="button" aria-label="Zoom out" title="Zoom out" @click="zoom(false)">−</button>
      <button type="button" aria-label="Fit map to view" title="Fit map to view" @click="fit"><UIcon name="i-lucide-scan" class="size-4" /></button>
      <!-- A tree opens and closes as a whole from the same controls it is zoomed with. -->
      <button v-if="branches" type="button" aria-label="Expand all branches" title="Expand all" @click="toggleAll(true)"><UIcon name="i-lucide-maximize-2" class="size-4" /></button>
      <button v-if="branches" type="button" aria-label="Collapse all branches" title="Collapse all" @click="toggleAll(false)"><UIcon name="i-lucide-minimize-2" class="size-4" /></button>
    </div>
    <div class="blr-flow-summary">{{ layout.nodes.length }}<template v-if="totalNodes && totalNodes !== layout.nodes.length"> of {{ totalNodes }}</template> boxes · {{ layout.edges.length }} connections<span> · Drag to explore</span></div>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
.blr-flow-shell { position: relative; width: 100%; height: 100%; min-height: 360px; }
.blr-flow, .blr-flow-measure {
  --blr-slot-0: #2a78d6; --blr-slot-1: #eb6834; --blr-slot-2: #1baf7a; --blr-slot-3: #eda100; --blr-slot-4: #e87ba4;
  --blr-slot-5: #008300; --blr-slot-6: #4a3aa7; --blr-slot-7: #e34948; --blr-slot-8: #746651; --blr-slot-9: #2a78d6;
  --blr-flow-dot: color-mix(in srgb, var(--ui-text-dimmed) 28%, transparent);
}
.dark .blr-flow, .dark .blr-flow-measure { --blr-slot-0: #3987e5; --blr-slot-1: #d95926; --blr-slot-2: #199e70; --blr-slot-3: #c98500; --blr-slot-4: #d55181; --blr-slot-5: #008300; --blr-slot-6: #9085e9; --blr-slot-7: #e66767; --blr-slot-8: #ab9d81; --blr-slot-9: #3987e5; }
.blr-flow .vue-flow__edge { pointer-events: none; }
.blr-flow .blr-flow-route { stroke: var(--ui-text-muted); stroke-width: 1.5; }
.blr-flow-controls { position: absolute; right: 12px; bottom: 12px; z-index: 30; display: grid; border: 1px solid var(--ui-border); border-radius: 8px; background: var(--ui-bg); overflow: hidden; }
.blr-flow-controls button { display: grid; place-items: center; width: 36px; height: 36px; border-bottom: 1px solid var(--ui-border); color: var(--ui-text); font: 18px var(--font-mono); cursor: pointer; }
.blr-flow-controls button:last-child { border-bottom: 0; }
.blr-flow-controls button:hover { background: var(--ui-bg-elevated); }
.blr-flow-controls button:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: -3px; }
.blr-flow-summary { position: absolute; bottom: 12px; left: 12px; padding: 5px 8px; max-width: calc(100% - 68px); border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-bg); color: var(--ui-text-muted); font-size: 12px; pointer-events: none; }
.blr-flow-edge-label { width: max-content; max-width: 200px; box-sizing: border-box; padding: 3px 6px; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; color: var(--ui-text-muted); background: var(--ui-bg-elevated); border-radius: 4px; pointer-events: none; }
@media (max-width: 640px) { .blr-flow-summary span { display: none; } }
</style>
