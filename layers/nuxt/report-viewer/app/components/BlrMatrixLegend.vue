<script setup lang="ts">
import type { TopologyMatrix } from '../utils/topologyProjections'
import { matrixBadgeTone, type MatrixBadgeMode } from '../utils/matrixBadges'

const props = defineProps<{ matrix: TopologyMatrix, mode: MatrixBadgeMode }>()
const open = ref(false)
const meanings: Record<MatrixBadgeMode, Record<string, string>> = {
  delivery: {
    direct: 'Available directly through the Interface.',
    'on screen': 'Available on one or more Screens.',
    'in experience': 'Available at the Experience level.'
  },
  mutations: {
    creates: 'Creates an Entity.',
    changes: 'Changes an Entity’s information or State.',
    removes: 'Removes an Entity.'
  },
  rules: {
    attached: 'The Rule is attached to this resource.',
    'applies here': 'The Rule applies in this Interface, Experience or Screen.',
    creates: 'The Rule applies when the Entity is created.',
    changes: 'The Rule applies when the Entity changes.',
    removes: 'The Rule applies when the Entity is removed.',
    reads: 'The Rule applies when the Entity is read.'
  }
}
// Read the whole filtered matrix, independent of the visible column window.
const entries = computed(() => {
  const present = new Set(props.matrix.cells.flatMap(cell => cell.labels))
  return Object.entries(meanings[props.mode]).filter(([label]) => present.has(label))
    .map(([label, description]) => ({ label, description, tone: matrixBadgeTone(label, props.mode) }))
})
watch([() => props.mode, () => entries.value.map(entry => entry.label).join('|')], () => { open.value = false })
</script>

<template>
  <div v-if="entries.length" class="blr-matrix-legend">
    <UPopover v-model:open="open" :content="{ align: 'end', sideOffset: 8, collisionPadding: 16 }"
      :ui="{ content: 'blr-matrix-legend-popover' }">
      <UButton label="Legend" trailing-icon="i-lucide-chevron-down" color="neutral"
        variant="outline" size="sm" />
      <template #content>
        <div class="blr-matrix-legend-heading">
          <h3>Legend</h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close legend" @click="open = false" />
        </div>
        <ul class="blr-matrix-legend-entries" aria-label="Badge color legend">
          <li v-for="entry in entries" :key="entry.label" :data-legend-label="entry.label">
            <span class="blr-matrix-legend-badge blr-matrix-tone" :data-tone="entry.tone">{{ entry.label }}</span>
            <p>{{ entry.description }}</p>
          </li>
        </ul>
      </template>
    </UPopover>
  </div>
</template>
