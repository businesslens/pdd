<script setup lang="ts">
/**
 * A Business Rule's Applies to tab: what it governs, drawn as the report's
 * other trees are. A target holds only the places the Rule itself names, so
 * every row opens a reading that lists this Rule too.
 */
import type { AnyResourceView, ReportWorkspace, RuleView } from '../utils/reportWorkspace'
import { ruleScope, treeBranchKeys } from '../utils/collectionChildren'

const props = defineProps<{ workspace: ReportWorkspace, resource: RuleView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const nodes = computed(() => ruleScope(props.workspace, props.resource))
const keys = computed(() => treeBranchKeys(nodes.value))
/* Groups open, targets folded: each closed target already says what it holds. */
const defaults = computed(() => nodes.value.map(node => node.id))
const scope = computed(() => JSON.stringify([props.workspace.identity.id, props.resource.key, 'applies-to']))
const expanded = useBlrStructureExpansion(scope, keys, defaults)
</script>

<template>
  <section class="space-y-3" aria-label="Applies to" data-rule-scope>
    <div class="flex justify-end">
      <BlrDrawingRowTools :columns="1" :expands-anything="keys.length > 0" compact @toggle-all="expanded = $event ? [...keys] : []" />
    </div>
    <div class="overflow-hidden rounded-xl border border-default bg-elevated/20 px-3 py-2">
      <BlrResourceTree v-model:expanded="expanded" :nodes="nodes" :label="`${resource.title}: Applies to`" @open="emit('open', $event)" />
    </div>
  </section>
</template>
