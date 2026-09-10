<script setup lang="ts">
import type { ElkNode } from 'elkjs/lib/elk-api'
import type { Diagram, DiagramLayout, DiagramSize } from '../utils/diagram'
import { diagramLayoutInput, diagramLayoutResult } from '../utils/diagram'
import { layoutTopologyTree } from '../utils/topologyTree'

const props = defineProps<{ diagram: Diagram, title: string, viewportKey?: string }>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean], ready: [] }>()
const measure = ref<HTMLElement>()
const layout = shallowRef<DiagramLayout | null>(null)
const pending = ref(true)
const placedViewportKey = ref(props.viewportKey ?? props.title)
const failed = ref(false)
let worker: Worker | undefined
let observer: ResizeObserver | undefined
let requestId = 0
let timer: ReturnType<typeof setTimeout> | undefined
let cancelLayout: (() => void) | undefined
let mounted = false
let pendingKey = ''
const cache = new Map<string, DiagramLayout>()

function publish(value: DiagramLayout) {
  placedViewportKey.value = props.viewportKey ?? props.title
  layout.value = value
  pending.value = false
}

function stopWorker() {
  cancelLayout?.()
  cancelLayout = undefined
  worker?.terminate()
  worker = undefined
  clearTimeout(timer)
}

async function arrange() {
  if (!mounted || !measure.value) return
  const id = ++requestId
  stopWorker()
  pending.value = true
  failed.value = false
  await nextTick()
  await document.fonts.ready
  if (!mounted || id !== requestId || !measure.value) return
  const sizes: Record<string, DiagramSize> = {}
  for (const element of measure.value.querySelectorAll<HTMLElement>('[data-measure]')) {
    const rect = element.getBoundingClientRect()
    sizes[element.dataset.measure!] = { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }
  }
  const diagram = props.diagram
  if (diagram.layout === 'tree') {
    const tree = (id: string): import('../utils/topologyTree').TopologyTreeItem => ({ id, children: diagram.edges.filter(edge => edge.source === id).map(edge => tree(edge.target)) })
    const root = diagram.nodes.find(node => !diagram.edges.some(edge => edge.target === node.id))
    // A filtered forest uses ELK; a complete containment tree keeps its parent
    // centred over its children instead of using a generic dependency rank.
    if (root && diagram.edges.length === diagram.nodes.length - 1) {
      const result = layoutTopologyTree(tree(root.id), Object.fromEntries(diagram.nodes.map(node => [node.id, sizes[`node:${node.id}`]! ])))
      const positions = new Map(result.nodes.map(node => [node.id, node]))
      const routes = new Map(result.branches.flatMap(branch => branch.children.map(child => [JSON.stringify([branch.source, child.target]), child.points] as const)))
      publish({ width: result.width, height: result.height,
        nodes: diagram.nodes.map(node => ({ ...node, ...positions.get(node.id)! })),
        edges: diagram.edges.map(edge => ({ ...edge, paths: [routes.get(JSON.stringify([edge.source, edge.target]))!] })) })
      return
    }
  }
  const graph = diagramLayoutInput(diagram, sizes)
  const key = JSON.stringify({ diagram, sizes })
  if (cache.has(key)) {
    publish(cache.get(key)!)
    return
  }
  pendingKey = key
  // Cancel obsolete work as well as ignoring stale responses.
  stopWorker()
  try {
    const { default: ELK } = await import('elkjs/lib/elk-api.js')
    if (id !== requestId || !mounted) return
    worker = new Worker(new URL('../utils/diagram.worker.ts', import.meta.url), { type: 'module' })
    const elk = new ELK({ workerFactory: () => worker!, algorithms: ['layered'] })
    const result: ElkNode = await Promise.race([
      elk.layout(graph),
      new Promise<never>((_resolve, reject) => {
        cancelLayout = () => reject(new Error('Layout superseded'))
        worker!.onerror = event => reject(new Error(event.message))
        timer = setTimeout(() => reject(new Error('Layout timed out')), 15000)
      })
    ])
    if (id !== requestId || !mounted) return
    clearTimeout(timer)
    const placed = diagramLayoutResult(diagram, result)
    if (placed.edges.some(edge => !edge.paths.length)) throw new Error('Layout omitted a relationship')
    cache.set(pendingKey, placed)
    if (cache.size > 8) cache.delete(cache.keys().next().value!)
    publish(placed)
    stopWorker()
  } catch (error) { if (id !== requestId || !mounted) return; console.warn('[BusinessLens] Diagram could not start:', error); failed.value = true; pending.value = false; layout.value = null; stopWorker() }
}

const signature = computed(() => JSON.stringify([props.diagram, props.viewportKey]))
watch([layout, failed], async () => {
  if (layout.value || failed.value) { await nextTick(); if (mounted) emit('ready') }
})
watch(signature, () => { if (mounted) void arrange() })
onMounted(() => {
  mounted = true
  void arrange()
  // Font/text zoom changes actual measurements; hover and container scrolling do not.
  let lastSize = ''
  observer = new ResizeObserver(() => {
    const next = measure.value ? `${measure.value.offsetWidth}:${measure.value.offsetHeight}` : ''
    if (lastSize && next !== lastSize) void arrange()
    lastSize = next
  })
  if (measure.value) observer.observe(measure.value)
})
onBeforeUnmount(() => { mounted = false; requestId++; stopWorker(); observer?.disconnect() })
const titleOf = (id: string) => props.diagram.nodes.find(node => node.id === id)?.title ?? id
</script>

<template>
  <div class="blr-diagram" :aria-label="title" :data-diagram-pending="pending || undefined" :aria-busy="pending || undefined">
    <div ref="measure" class="blr-flow-measure" aria-hidden="true" inert>
      <div v-for="node in diagram.nodes" :key="node.id" :data-measure="`node:${node.id}`" :style="{ width: node.terminal ? '132px' : '236px' }">
        <BlrFlowNodeContent :node="node" />
      </div>
      <div v-for="edge in diagram.edges" :key="edge.id" :data-measure="`edge:${edge.id}`" class="blr-flow-edge-label">{{ edge.label }}</div>
    </div>
    <div v-if="layout" class="blr-diagram-canvas">
      <LazyBlrFlowCanvas :layout="layout" :title="title" :direction="diagram.direction" :quiet="diagram.quiet" :total-nodes="diagram.totalNodes" :viewport-key="placedViewportKey" @open="emit('open', $event)" @toggle="(id, open) => emit('toggle', id, open)" @ready="emit('ready')" />
    </div>
    <div v-else class="blr-diagram-fallback">
      <p class="text-sm text-muted" role="status">{{ failed ? 'Diagram layout is unavailable. The complete reading is below.' : 'Arranging diagram…' }}</p>
      <ul><li v-for="node in diagram.nodes" :key="node.id"><button v-if="node.resourceKey" type="button" class="blr-topology-link" @click="emit('open', node.resourceKey)">{{ node.title }}</button><span v-else>{{ node.title }}</span><span v-if="node.unreached"> · unreached</span></li></ul>
    </div>
    <details v-if="diagram.edges.length" class="blr-diagram-reading" :open="!layout || undefined">
      <summary>Relationships · {{ diagram.edges.length }}</summary>
      <ul><li v-for="edge in diagram.edges" :key="edge.id"><strong>{{ titleOf(edge.source) }}</strong> → <template v-if="edge.label">{{ edge.label }} → </template><strong>{{ titleOf(edge.target) }}</strong></li></ul>
    </details>
  </div>
</template>

<style scoped>
.blr-diagram { position: relative; min-width: 0; height: 100%; display: flex; flex-direction: column; }
:global(.blr-flow-edge-label) { width: max-content; max-width: 200px; box-sizing: border-box; padding: 3px 6px; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; color: var(--ui-text-muted); background: var(--ui-bg-elevated); border-radius: 4px; pointer-events: none; }
.blr-flow-measure { position: absolute; left: -100000px; top: 0; visibility: hidden; width: 276px; }
.blr-diagram-canvas { flex: 1; min-height: 360px; }
.blr-diagram-reading, .blr-diagram-fallback { padding: 12px; font-size: 14px; overflow: auto; }
.blr-diagram-reading { flex-shrink: 0; max-height: 30%; border-top: 1px solid var(--ui-border); }
.blr-diagram-reading summary { cursor: pointer; color: var(--ui-text-muted); }
.blr-diagram-reading li, .blr-diagram-fallback li { padding: 6px 0; }
</style>
