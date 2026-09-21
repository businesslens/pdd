<script setup lang="ts">
import type { ComparisonField, ComparisonSide } from '../utils/resourceComparison'
import { comparisonRows, pairedFields } from '../utils/resourceComparison'
import { reviewChangeMeta } from '../utils/reviewModel'

const props = defineProps<{ before?: ComparisonField, after?: ComparisonField, beforeSide: ComparisonSide | null, afterSide: ComparisonSide | null, nested?: boolean }>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
const field = computed(() => props.after ?? props.before!)
const rows = computed(() => comparisonRows(props.before?.items ?? [], props.after?.items ?? [], item => item.value,
  field.value.list && !field.value.ordered ? item => item.identity : undefined))
const changed = computed(() => rows.value.some(row => row.change))
function position(before?: number, after?: number) {
  const first = before === undefined ? '' : String(before + 1)
  const last = after === undefined ? '' : String(after + 1)
  return first && last && first !== last ? `${first} → ${last}` : last || first
}
</script>

<template>
  <section class="min-w-0 space-y-2" :data-comparison-field="field.id" :data-field-changed="changed || undefined">
    <div class="flex flex-wrap items-baseline gap-2">
      <h3 :class="nested ? 'text-sm font-medium' : 'text-base font-semibold'">{{ field.label }}</h3>
      <span v-if="field.derived" class="text-xs text-muted">Derived from the model</span>
    </div>
    <p v-if="field.note" class="text-xs text-muted">{{ field.note }}</p>
    <p v-if="!rows.length" class="text-sm text-muted">None recorded.</p>
    <div v-for="(row, index) in rows" :key="index" class="min-w-0 space-y-3" :class="row.change && 'rounded-lg border border-default p-3'" :data-comparison-change="row.change || undefined">
      <div v-if="row.change || field.itemLabel" class="flex flex-wrap items-center gap-2">
        <span v-if="field.itemLabel" class="text-sm font-medium">{{ field.itemLabel }} {{ position(row.beforeIndex, row.afterIndex) }}</span>
        <span v-if="row.change" class="blr-matrix-tone rounded border px-1.5 py-0.5 text-xs" :data-tone="reviewChangeMeta[row.change].tone">{{ reviewChangeMeta[row.change].symbol }} {{ reviewChangeMeta[row.change].label }}</span>
      </div>
      <template v-if="row.change === 'modified' && row.before?.fields && row.after?.fields && !row.before.reference && !row.after.reference">
        <BlrComparisonField v-for="pair in pairedFields(row.before.fields, row.after.fields)" :key="(pair.after ?? pair.before)!.id" :before="pair.before" :after="pair.after" :before-side="beforeSide" :after-side="afterSide" nested @inspect="(key, state) => emit('inspect', key, state)" />
      </template>
      <div v-else-if="row.change === 'modified' && row.before && row.after && beforeSide && afterSide && !row.before.fields && !row.after.fields && !row.before.prose && !row.after.prose" class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
        <div class="min-w-0 space-y-1"><p class="text-xs font-medium text-muted">Before</p><BlrComparisonValue :node="row.before" :side="beforeSide" @inspect="(key, state) => emit('inspect', key, state)" /></div>
        <span class="pt-5 text-muted" aria-hidden="true">→</span>
        <div class="min-w-0 space-y-1"><p class="text-xs font-medium text-muted">After</p><BlrComparisonValue :node="row.after" :side="afterSide" @inspect="(key, state) => emit('inspect', key, state)" /></div>
      </div>
      <template v-else>
        <div v-if="row.before && beforeSide && row.change" class="min-w-0 space-y-1 border-s-2 ps-3" :class="row.change === 'deleted' || row.change === 'modified' ? 'border-(--ui-color-error-500)' : ''">
          <p class="text-xs font-medium text-muted">Before</p>
          <BlrComparisonValue :node="row.before" :side="beforeSide" @inspect="(key, state) => emit('inspect', key, state)" />
        </div>
        <div v-if="row.after && afterSide" class="min-w-0 space-y-1" :class="row.change && 'border-s-2 border-(--ui-color-success-500) ps-3'">
          <p v-if="row.change" class="text-xs font-medium text-muted">After</p>
          <BlrComparisonValue :node="row.after" :side="afterSide" @inspect="(key, state) => emit('inspect', key, state)" />
        </div>
      </template>
    </div>
    <p v-if="after && !after.items.length && before?.items.length" class="text-sm text-muted">After: none recorded.</p>
  </section>
</template>
