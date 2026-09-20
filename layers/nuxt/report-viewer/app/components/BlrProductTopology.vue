<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import type { MatrixView } from '../composables/useBlrMatrixView'

const props = defineProps<{ workspace: ReportWorkspace, matrixView: MatrixView }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const reading = defineModel<TopologyReading>('reading', { default: defaultTopologyReading })
const matrix = computed(() => props.matrixView.matrix)
// Column navigation keeps the same vertical reading position.
const scrollKey = computed(() => JSON.stringify([props.workspace.identity.id, reading.value.view,
  matrix.value.rows.map(row => row.key), matrix.value.columns.map(column => column.key)]))
const { element: pane, save, restore } = useBlrTopologyScroll(scrollKey)
watch(() => props.workspace, () => { save(); void restore() }, { flush: 'pre' })
watch(() => matrix.value.columns, columns => {
  if (reading.value.column && !columns.some(column => column.key === reading.value.column)) update({ column: null })
}, { immediate: true })
function update(patch: Partial<TopologyReading>) { reading.value = { ...reading.value, ...patch } }
function open(key: string) {
  save()
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('select', resource)
}
</script>
<template>
  <div class="blr-product-topology">
    <div ref="pane" class="blr-topology-reading" @scroll.capture.passive="save">
      <BlrTopologyMatrix :workspace="workspace" :matrix="matrix" :column="reading.column" :mode="matrixView.mode" @column="update({ column: $event })" @open="open" />
    </div>
  </div>
</template>
