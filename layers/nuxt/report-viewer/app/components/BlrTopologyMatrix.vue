<script setup lang="ts">
import type { TopologyMatrix } from '../utils/topologyProjections'
import { ENTITY_KIND_META, entityFacetOf, type ReportWorkspace } from '../utils/reportWorkspace'
import { matrixColumnWindow } from '../utils/matrixColumnWindow'
const props = defineProps<{ workspace: ReportWorkspace, matrix: TopologyMatrix, column: string | null, mode: 'rules' | 'mutations' | 'delivery' }>()

/* Every matrix answers "which of these, against which of those". State each
   reading's nouns and empty-state message once. */
const words = computed(() => ({
  rules: {
    row: 'Business Rule',
    column: 'Target',
    empty: 'No direct Rule attachments in this scope.'
  },
  mutations: {
    row: 'Entity',
    column: 'Capability',
    empty: 'No modeled mutations in this scope.'
  },
  delivery: {
    row: 'Capability',
    column: 'Interface',
    empty: 'No modeled delivery in this scope.'
  }
}[props.mode]))
const emit = defineEmits<{ open: [key: string], column: [key: string] }>()
const { element, width } = useBlrReadingWidth()
const tableId = useId()
const window = computed(() => matrixColumnWindow(width.value, props.matrix.columns.length,
  props.matrix.columns.findIndex(item => item.key === props.column)))
const paged = computed(() => props.matrix.columns.length > window.value.capacity)
const handles = computed(() => paged.value && width.value >= 600)
const columns = computed(() => props.matrix.columns.slice(window.value.renderStart, window.value.renderEnd)
  .map((resource, index) => ({ resource, index: window.value.renderStart + index })))
const columnVisible = (index: number) => index >= window.value.start && index < window.value.end
const columnStyle = (index: number) => ({ '--blr-matrix-column-index': index })
const matrixStyle = computed(() => ({
  '--blr-matrix-offset': `${window.value.offset}px`,
  '--blr-matrix-column-width': `${window.value.columnWidth}px`,
  '--blr-matrix-table-width': `${window.value.tableWidth}px`
}))
const cells = computed(() => new Map(props.matrix.cells.map(cell => [JSON.stringify([cell.row, cell.column]), cell])))
const cellAt = (row: string, column: string) => cells.value.get(JSON.stringify([row, column]))

// CSS animates the shared offset. Vue patches only the new window, never every
// cell on every frame. One buffered column on either side covers a single step.
const moving = ref(false)
let motionTimer: ReturnType<typeof setTimeout> | undefined
function retainRowHeights(reset = false) {
  const rows = [...(matrixViewport.value?.querySelectorAll<HTMLTableRowElement>('tbody tr') ?? [])]
  const heights = reset ? [] : rows.map(row => row.getBoundingClientRect().height)
  rows.forEach((row, index) => { row.style.height = reset ? '' : `${heights[index]}px` })
}
watch([() => window.value.offset, () => window.value.columnWidth, () => props.mode],
  ([next, size, mode], [previous, oldSize, oldMode]) => {
    retainRowHeights(size !== oldSize || mode !== oldMode)
    const singleStep = Math.abs(Math.abs(next - previous) - size) < 0.5
    moving.value = import.meta.client && !moving.value && singleStep && size === oldSize && mode === oldMode
      && !matchMedia('(prefers-reduced-motion: reduce)').matches
    clearTimeout(motionTimer)
    if (moving.value) motionTimer = setTimeout(() => { moving.value = false }, 200)
    void nextTick(clipScrollContent)
  })
watch(() => props.matrix, () => { retainRowHeights(true); void nextTick(clipScrollContent) })
onBeforeUnmount(() => clearTimeout(motionTimer))

function move(index: number | null) {
  const column = index === null ? undefined : props.matrix.columns[index]
  if (column) emit('column', column.key)
}
function onKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || !paged.value) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    move(event.key === 'ArrowLeft' ? window.value.previous : window.value.next)
  }
}

// Horizontal gestures step through columns; vertical wheel/touch scrolling belongs to the reading.
let wheelDistance = 0
let wheelTime = 0
let wheelMoved = false
function onWheel(event: WheelEvent) {
  const horizontal = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX
  if (!paged.value || event.ctrlKey || (!event.shiftKey && Math.abs(horizontal) <= Math.abs(event.deltaY))) return
  event.preventDefault()
  const distance = horizontal * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width.value : 1)
  if (event.timeStamp - wheelTime > 180) { wheelDistance = 0; wheelMoved = false }
  wheelTime = event.timeStamp
  wheelDistance += distance
  if (!wheelMoved && Math.abs(wheelDistance) >= 40) {
    move(wheelDistance > 0 ? window.value.next : window.value.previous)
    wheelMoved = true
  }
}
let touchStart: { x: number, y: number } | null = null
let suppressClickUntil = 0
function onTouchStart(event: TouchEvent) {
  const touch = event.touches.length === 1 ? event.touches[0] : undefined
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null
}
function onTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (touchStart && touch && paged.value) {
    const dx = touchStart.x - touch.clientX
    const dy = touchStart.y - touch.clientY
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      move(dx > 0 ? window.value.next : window.value.previous)
      suppressClickUntil = Date.now() + 400
    }
  }
  touchStart = null
}
function onClick(event: MouseEvent) {
  if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation() }
}

const matrixViewport = useTemplateRef('matrixViewport')
const navigation = useTemplateRef('navigation')
/* The page owns vertical scrolling. Keep rows clear of the translucent sticky
   header, preserving the exact collection-parent background. */
function clipScrollContent() {
  const viewport = matrixViewport.value
  const table = viewport?.querySelector('table')
  const body = table?.tBodies[0]
  const corner = table?.tHead?.rows[0]?.cells[0]
  if (!body || !corner || !element.value) return
  const navigationHeight = navigation.value?.offsetHeight ?? 0
  element.value.style.setProperty('--blr-matrix-navigation-height', `${navigationHeight}px`)
  const clipped = Math.max(0, corner.getBoundingClientRect().bottom - body.getBoundingClientRect().top)
  body.style.clipPath = `inset(${clipped}px 0 0)`
  const pane = viewport?.closest('.blr-topology-reading')
  if (pane && viewport) {
    const rootTop = element.value.getBoundingClientRect().top
    const paneBox = pane.getBoundingClientRect()
    const viewportBox = viewport.getBoundingClientRect()
    const cornerBox = corner.getBoundingClientRect()
    // With a transparent count bar, also keep the table's outer border below it.
    const clippedTop = Math.max(0, cornerBox.top - viewportBox.top)
    viewport.style.clipPath = clippedTop > 1 ? `inset(${clippedTop}px 0 0)` : ''
    const top = Math.max(cornerBox.bottom, paneBox.top)
    const bottom = Math.min(viewportBox.bottom, paneBox.bottom)
    const center = (top + Math.max(top, bottom)) / 2 - rootTop
    element.value.style.setProperty('--blr-matrix-handle-top', `${center}px`)
  }
}
watch([matrixViewport, navigation], ([viewport], _, onCleanup) => {
  if (!viewport) return
  const pane = viewport.closest<HTMLElement>('.blr-topology-reading')
  const resize = new ResizeObserver(clipScrollContent)
  for (const node of viewport.querySelectorAll('table, thead, tbody')) resize.observe(node)
  if (pane) resize.observe(pane)
  if (navigation.value) resize.observe(navigation.value)
  pane?.addEventListener('scroll', clipScrollContent, { passive: true })
  clipScrollContent()
  onCleanup(() => { resize.disconnect(); pane?.removeEventListener('scroll', clipScrollContent) })
}, { flush: 'post' })
</script>
<template>
  <div ref="element" class="blr-topology-matrix" :data-edge-handles="handles" :data-column-motion="moving" :style="matrixStyle">
    <div v-if="paged" ref="navigation" class="blr-matrix-navigation" role="group" aria-label="Column navigation">
      <UButton v-if="!handles" icon="i-lucide-chevron-left" color="neutral" variant="outline" size="sm" aria-label="Previous columns" title="Previous columns" :aria-controls="tableId" :disabled="window.previous === null" @click="move(window.previous)" />
      <span class="blr-matrix-range" role="status" aria-live="polite" aria-atomic="true">Columns {{ window.start + 1 }}–{{ window.end }} of {{ matrix.columns.length }}</span>
      <UButton v-if="!handles" trailing-icon="i-lucide-chevron-right" color="neutral" variant="outline" size="sm" aria-label="Next columns" title="Next columns" :aria-controls="tableId" :disabled="window.next === null" @click="move(window.next)" />
    </div>
    <div v-if="handles" class="blr-matrix-edge-handles" role="group" aria-label="Column navigation">
      <UButton class="blr-matrix-left-handle" icon="i-lucide-chevron-left" color="neutral" variant="outline" size="sm" aria-label="Previous columns" title="Previous columns" :aria-controls="tableId" :disabled="window.previous === null" @click="move(window.previous)" />
      <UButton class="blr-matrix-right-handle" icon="i-lucide-chevron-right" color="neutral" variant="outline" size="sm" aria-label="Next columns" title="Next columns" :aria-controls="tableId" :disabled="window.next === null" @click="move(window.next)" />
    </div>
    <div v-if="matrix.columns.length" ref="matrixViewport" class="blr-matrix-viewport" :tabindex="paged ? 0 : undefined" role="region" aria-label="Relationship table" @keydown="onKeydown" @wheel="onWheel" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd" @touchcancel.passive="touchStart = null" @click.capture="onClick">
      <table :id="tableId" :aria-colcount="matrix.columns.length + 1">
        <colgroup>
          <col :style="{ width: `${window.subjectWidth}px` }">
          <col v-for="item in matrix.columns" :key="item.key" :style="{ width: `${window.columnWidth}px` }">
        </colgroup>
        <thead>
          <tr>
            <th scope="col" class="blr-matrix-corner bg-elevated/20" :aria-label="`Rows: ${words.row}; columns: ${words.column}`">
              <span class="blr-matrix-corner-space" aria-hidden="true" />
              <svg class="blr-matrix-corner-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" />
              </svg>
              <span class="blr-matrix-axis-column" aria-hidden="true">{{ words.column }}</span>
              <span class="blr-matrix-axis-row" aria-hidden="true">{{ words.row }}</span>
            </th>
            <th v-for="(item, index) in matrix.columns" :key="item.key" scope="col" class="blr-matrix-column bg-elevated/20" :style="columnStyle(index)" :inert="!columnVisible(index)" :aria-hidden="!columnVisible(index) || undefined" :aria-colindex="index + 2">
              <span v-if="mode === 'rules'" class="blr-matrix-kind">{{ ENTITY_KIND_META[item.kind].label }}</span>
              <BlrTopologyResource :resource="item" @open="emit('open', $event)" />
            </th>
          </tr>
        </thead>
        <tbody><tr v-for="row in matrix.rows" :key="row.key"><th scope="row"><BlrTopologyResource :resource="row" @open="emit('open', $event)" /></th>
          <td v-if="window.renderStart" :colspan="window.renderStart" class="blr-matrix-spacer" aria-hidden="true" inert />
          <td v-for="{ resource: column, index } in columns" :key="column.key" :data-cell="`${row.key}->${column.key}`" class="blr-matrix-column" :style="columnStyle(index)" :inert="!columnVisible(index)" :aria-hidden="!columnVisible(index) || undefined" :aria-colindex="index + 2">
            <template v-if="cellAt(row.key, column.key)">
              <div class="blr-matrix-effects">
                <template v-if="mode === 'mutations'">
                  <BlrMutationBadge v-for="mutation in cellAt(row.key, column.key)!.mutations" :key="mutation.effect"
                    :mutation="mutation" :entity-title="row.title" :entity-facet="entityFacetOf(row)" :capability-title="column.title"
                    :view-key="`${window.offset}:${window.columnWidth}`" @open="emit('open', $event)" />
                </template>
                <BlrRelationshipBadges v-else :workspace="workspace" :cell="cellAt(row.key, column.key)!" :row="row" :column="column" :mode="mode"
                  :view-key="`${window.offset}:${window.columnWidth}`" @open="emit('open', $event)" />
              </div>
            </template><span v-else aria-label="No modeled relation" class="text-dimmed">—</span>
          </td>
          <td v-if="window.renderEnd < matrix.columns.length" :colspan="matrix.columns.length - window.renderEnd" class="blr-matrix-spacer" aria-hidden="true" inert />
        </tr></tbody>
      </table>
    </div>
    <p v-else class="blr-topology-empty">{{ words.empty }}</p>
  </div>
</template>
