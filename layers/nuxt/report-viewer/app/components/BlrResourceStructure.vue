<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { structureChildren, structureLabel, treeBranchKeys } from '../utils/collectionChildren'
const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const nodes = computed(() => structureChildren(props.workspace, props.resource))
const label = computed(() => structureLabel(props.resource))
const keys = computed(() => treeBranchKeys(nodes.value))
const defaults = computed(() => treeBranchKeys(nodes.value, true))
const scope = computed(() => JSON.stringify([props.workspace.identity.id, props.resource.key]))
const expanded = useBlrStructureExpansion(scope, keys, defaults)
</script>

<template>
  <section class="space-y-3" :aria-label="label" data-resource-structure>
    <div class="flex justify-end">
      <BlrDrawingRowTools :columns="1" :expands-anything="keys.length > 0" compact @toggle-all="expanded = $event ? [...keys] : []" />
    </div>
    <div class="overflow-hidden rounded-xl border border-default bg-elevated/20 px-3 py-2">
      <BlrResourceTree v-model:expanded="expanded" :nodes="nodes" :label="`${resource.title}: ${label}`" @open="emit('open', $event)" />
    </div>
  </section>
</template>
