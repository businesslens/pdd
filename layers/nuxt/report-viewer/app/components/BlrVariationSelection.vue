<script setup lang="ts">
/**
 * How one alternative is chosen, written once for the set: the Entities and
 * facts it chooses by, the assignment where it is an Experiment, and when the
 * choice takes effect and how long it holds. `only` narrows it to the part an
 * alternative's own reading needs.
 */
import type { AnyResourceView, ReportWorkspace, VariationSetView } from '../utils/reportWorkspace'
import { variationSelectionReferences } from '../utils/variations'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  set: VariationSetView
  /** `mechanism` draws only what chooses, for an alternative's own reading. */
  only?: 'mechanism' | null
}>(), { only: null })
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const references = computed(() => variationSelectionReferences(props.set).flatMap(ref => {
  const entity = props.workspace.byKey.get(`entity:${ref.entity}`)
  return entity?.kind === 'entity' ? [{ ...ref, resource: entity }] : []
}))
const explanations = computed(() => {
  const set = props.set
  const unit = set.assignmentUnit
  return [
    ...(unit && 'description' in unit ? [{ label: 'Assignment unit', text: unit.description }] : []),
    ...(set.assignmentMethod ? [{ label: 'Assignment method', text: set.assignmentMethod }] : []),
    ...(set.allocation ? [{ label: 'Allocation', text: set.allocation }] : []),
    ...(props.only === 'mechanism' ? [] : [
      { label: 'Takes effect', text: set.takesEffect },
      { label: 'Stability', text: set.stability }
    ])
  ]
})
</script>

<template>
  <dl class="@container space-y-3 text-sm" data-variation-selection>
    <div v-for="ref in references" :key="`${ref.label}:${ref.entity}:${ref.fact ?? ''}`" class="grid gap-1 @min-sm:grid-cols-[9rem_minmax(0,1fr)] @min-sm:gap-x-4">
      <dt class="flex min-h-6 items-center text-xs font-medium text-muted">{{ ref.label }}</dt>
      <dd class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <BlrEntityChip :entity="ref.resource" class="max-w-full" data-selection-reference @select="emit('open', $event)" />
        <span v-if="ref.fact" class="flex min-w-0 max-w-full flex-wrap items-center gap-1.5" data-selection-field>
          <span class="text-xs text-muted"><BlrTerm slug="information-kept" text="Field" /></span>
          <BlrFactTag :name="ref.fact" class="min-w-0 whitespace-normal [overflow-wrap:anywhere]" />
        </span>
      </dd>
    </div>
    <div v-for="entry in explanations" :key="entry.label" class="grid gap-1 @min-sm:grid-cols-[9rem_minmax(0,1fr)] @min-sm:gap-x-4">
      <dt class="text-xs font-medium text-muted">{{ entry.label }}</dt>
      <dd><BlrProse :text="entry.text" size="sm" /></dd>
    </div>
    <slot />
  </dl>
</template>
