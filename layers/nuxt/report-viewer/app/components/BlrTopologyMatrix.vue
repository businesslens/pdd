<script setup lang="ts">
import type { TopologyMatrix } from '../utils/topologyProjections'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
const props = defineProps<{ matrix: TopologyMatrix, column: string | null, mode: 'rules' | 'mutations' | 'delivery' }>()

/* Every matrix answers "which of these, against which of those". State each
   reading's nouns and empty-state message once. */
const words = computed(() => ({
  rules: {
    row: 'Business Rule',
    column: 'Target',
    empty: 'No direct Rule attachments in this scope.',
    evidence: ['supporting Scenario', 'supporting Scenarios']
  },
  mutations: {
    row: 'Entity',
    column: 'Capability',
    empty: 'No modeled mutations in this scope.',
    evidence: ['supporting Scenario', 'supporting Scenarios']
  },
  delivery: {
    row: 'Capability',
    column: 'Interface',
    empty: 'No modeled delivery in this scope.',
    evidence: ['route', 'routes']
  }
}[props.mode]))
const emit = defineEmits<{ open: [key: string], column: [key: string] }>()
const { element, width } = useBlrReadingWidth()
const selectedColumn = computed(() => props.matrix.columns.find(item => item.key === props.column) ?? props.matrix.columns[0])
// Entity mutations and Rule attachments keep every column in one scrollable table.
const capacity = computed(() => props.mode === 'delivery' ? width.value < 640 ? 1 : 8 : props.matrix.columns.length)
const start = computed(() => Math.max(0, Math.min(props.matrix.columns.length - capacity.value, props.matrix.columns.findIndex(item => item.key === selectedColumn.value?.key))))
const columns = computed(() => props.matrix.columns.slice(start.value, start.value + capacity.value))
const cells = computed(() => new Map(props.matrix.cells.map(cell => [JSON.stringify([cell.row, cell.column]), cell])))
const cellAt = (row: string, column: string) => cells.value.get(JSON.stringify([row, column]))

const matrixScroll = useTemplateRef('matrixScroll')
/* Keep the list parents' translucent surface: clip scrolling content out from
   behind the fixed headers, so their background remains the page itself. */
function clipScrollContent() {
  const viewport = matrixScroll.value
  const table = viewport?.querySelector('table')
  if (!viewport || !table?.tHead || !table.tBodies[0]) return
  const headers = [...table.tHead.rows[0]!.cells]
  const cornerRight = headers[0]!.getBoundingClientRect().right
  const clips = headers.slice(1).map(header => {
    const box = header.getBoundingClientRect()
    return Math.max(0, Math.min(box.width, cornerRight - box.left))
  })
  viewport.style.setProperty('--blr-matrix-header-height', `${table.tHead.offsetHeight}px`)
  table.tBodies[0].style.clipPath = `inset(${viewport.scrollTop}px 0 0)`
  headers.slice(1).forEach((header, index) => {
    header.style.clipPath = `inset(0 0 0 ${clips[index]}px)`
  })
}
watch([matrixScroll, columns], ([viewport], _, onCleanup) => {
  if (!viewport) return
  const resize = new ResizeObserver(clipScrollContent)
  for (const node of viewport.querySelectorAll('table, thead th')) resize.observe(node)
  clipScrollContent()
  onCleanup(() => resize.disconnect())
}, { flush: 'post' })
</script>
<template>
  <div ref="element" class="blr-topology-matrix">
    <label v-if="matrix.columns.length > capacity" class="blr-topology-window">{{ words.column }}
      <select :value="selectedColumn?.key" aria-label="Matrix column" @change="emit('column', ($event.target as HTMLSelectElement).value)"><option v-for="item in matrix.columns" :key="item.key" :value="item.key">{{ item.title }}</option></select>
      <span>Columns {{ start + 1 }}–{{ start + columns.length }} of {{ matrix.columns.length }}</span>
    </label>
    <div v-if="matrix.columns.length" ref="matrixScroll" class="blr-matrix-scroll" tabindex="0" aria-label="Scroll relationship table" @scroll.passive="clipScrollContent">
      <table>
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
            <th v-for="item in columns" :key="item.key" scope="col" class="bg-elevated/20">
              <span v-if="mode === 'rules'" class="blr-matrix-kind">{{ ENTITY_KIND_META[item.kind].label }}</span>
              <BlrTopologyResource :resource="item" @open="emit('open', $event)" />
            </th>
          </tr>
        </thead>
        <tbody><tr v-for="row in matrix.rows" :key="row.key"><th scope="row"><BlrTopologyResource :resource="row" @open="emit('open', $event)" /></th>
          <td v-for="column in columns" :key="column.key" :data-cell="`${row.key}->${column.key}`">
            <template v-if="cellAt(row.key, column.key)">
              <div class="blr-matrix-effects"><span v-for="label in cellAt(row.key, column.key)!.labels" :key="label" :data-effect="label">{{ label }}</span></div>
              <details v-if="cellAt(row.key, column.key)!.attachments?.some(attachment => attachment.details.length || attachment.contexts.length)"><summary>Attachment details</summary>
                <div v-for="attachment in cellAt(row.key, column.key)!.attachments" :key="attachment.id" class="blr-matrix-detail">
                  <p>{{ attachment.label }}<template v-for="detail in attachment.details" :key="detail"> · {{ detail }}</template></p>
                  <template v-if="attachment.contexts.length"><span>Only in</span><BlrTopologyResource v-for="context in attachment.contexts" :key="context.key" :resource="context" @open="emit('open', $event)" /></template>
                </div>
              </details>
              <details v-if="cellAt(row.key, column.key)!.evidence.length"><summary>{{ cellAt(row.key, column.key)!.evidence.length }} {{ cellAt(row.key, column.key)!.evidence.length === 1 ? words.evidence[0] : words.evidence[1] }}</summary>
                <p v-for="detail in cellAt(row.key, column.key)!.details" :key="detail">{{ detail }}</p>
                <BlrTopologyResource v-for="evidence in cellAt(row.key, column.key)!.evidence" :key="evidence.key" :resource="evidence" @open="emit('open', $event)" />
              </details>
            </template><span v-else aria-label="No modeled relation" class="text-dimmed">—</span>
          </td>
        </tr></tbody>
      </table>
    </div>
    <p v-else class="blr-topology-empty">{{ words.empty }}</p>
  </div>
</template>
