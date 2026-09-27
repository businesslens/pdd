<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { variationUsageReferences } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const references = computed(() => variationUsageReferences(props.resource).flatMap(ref => {
  const entity = props.workspace.byKey.get(`entity:${ref.entity}`)
  return entity?.kind === 'entity' ? [{ ...ref, resource: entity }] : []
}))
const explanations = computed(() => {
  const usage = props.resource.variation?.usage
  if (!usage) return []
  return [
    ...('label' in usage ? [{ label: 'Version', text: usage.label }] : []),
    ...('assignmentUnit' in usage && 'description' in usage.assignmentUnit ? [{ label: 'Assignment unit', text: usage.assignmentUnit.description }] : []),
    { label: 'Selected when', text: usage.selectedWhen },
    ...('assignmentMethod' in usage ? [{ label: 'Assignment method', text: usage.assignmentMethod }] : []),
    ...('allocation' in usage && usage.allocation ? [{ label: 'Allocation', text: usage.allocation }] : []),
    { label: 'Takes effect', text: usage.takesEffect },
    { label: 'Stability', text: usage.stability }
  ]
})
</script>

<template>
  <dl class="@container space-y-3 text-sm" data-variation-usage>
    <div v-for="ref in references" :key="`${ref.label}:${ref.entity}:${ref.fact ?? ''}`" class="grid gap-1 @min-sm:grid-cols-[8rem_minmax(0,1fr)] @min-sm:gap-x-4">
      <dt class="flex min-h-6 items-center text-xs font-medium text-muted">{{ ref.label }}</dt>
      <dd class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <BlrEntityChip :entity="ref.resource" class="max-w-full" data-usage-reference @select="emit('open', $event)" />
        <span v-if="ref.fact" class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5" data-usage-field>
          <span class="text-xs text-muted"><BlrTerm slug="information-kept" text="Field" /></span>
          <BlrFactTag :name="ref.fact" class="min-w-0 whitespace-normal [overflow-wrap:anywhere]" />
        </span>
      </dd>
    </div>
    <div v-for="entry in explanations" :key="entry.label" class="grid gap-1 @min-sm:grid-cols-[8rem_minmax(0,1fr)] @min-sm:gap-x-4">
      <dt class="text-xs font-medium text-muted">{{ entry.label }}</dt>
      <dd><BlrProse :text="entry.text" size="sm" /></dd>
    </div>
  </dl>
</template>
