<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ selectPath: [path: string] }>()
const areas = computed(() => [
  { key: 'exclusions', label: 'Exclusions', description: 'Approved omissions from this model’s scope.', items: props.workspace.coverage.exclusions },
  { key: 'unmapped', label: 'Unmapped', description: 'Known missing behavior within the declared scope.', items: props.workspace.coverage.unmapped }
])
const fields = computed(() => [
  { key: 'limitations', label: 'Limitations', description: 'What could not be established while authoring the model.', items: props.workspace.coverage.limitations },
  { key: 'method', label: 'Method', description: 'How the model was created or expanded.', items: props.workspace.coverage.method }
])
const statusDescriptions = {
  draft: 'The model itself is still being authored or reviewed.',
  partial: 'The model has known gaps within its declared scope.',
  complete: 'The declared model scope is modeled. Exclusions are listed below.'
}
</script>

<template>
  <section class="space-y-7" aria-label="Model scope" data-coverage-details data-coverage-field="scope">
    <h3 class="text-base font-semibold text-highlighted">Model scope</h3>
    <section class="space-y-2" aria-label="Status">
      <div class="flex items-center gap-2"><h4 class="text-sm font-semibold text-highlighted">Status</h4><BlrCoverageBadge :status="workspace.coverage.status" size="md" /></div>
      <p class="text-sm text-muted">{{ statusDescriptions[workspace.coverage.status] }}</p>
    </section>
    <section class="space-y-2" aria-label="Scope">
      <h4 class="text-sm font-semibold text-highlighted">Scope</h4>
      <BlrProse :text="workspace.coverage.scope" />
    </section>
    <section class="space-y-2" aria-label="Rationale">
      <h4 class="text-sm font-semibold text-highlighted">Rationale</h4>
      <BlrProse v-if="workspace.coverage.rationale" :text="workspace.coverage.rationale" />
      <p v-else class="text-sm text-muted">Not recorded.</p>
    </section>
    <section v-for="field in areas" :key="field.key" class="space-y-3" :aria-label="field.label" :data-coverage-field="field.key">
      <h4 class="text-sm font-semibold text-highlighted">{{ field.label }} <span class="blr-meta ms-1">{{ field.items.length }}</span></h4>
      <p class="text-xs text-muted">{{ field.description }}</p>
      <ul v-if="field.items.length" class="space-y-4">
        <li v-for="(area, index) in field.items" :key="index" class="space-y-2" :data-unmapped-entry="field.key === 'unmapped' ? '' : undefined">
          <BlrProse :text="area.description" />
          <ul v-if="area.paths.length" class="flex flex-wrap gap-x-3 gap-y-1">
            <li v-for="path in area.paths" :key="path"><button type="button" class="break-all text-start font-mono text-xs text-primary underline decoration-dotted underline-offset-4" @click="emit('selectPath', path)">{{ path }}</button></li>
          </ul>
          <p v-else class="text-xs text-muted">No repository paths recorded.</p>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">None recorded.</p>
    </section>
    <section class="space-y-2" aria-label="Source areas" data-coverage-field="sourceAreas">
      <h4 class="text-sm font-semibold text-highlighted">Source areas <span class="blr-meta ms-1">{{ workspace.coverage.sourceAreas.length }}</span></h4>
      <p class="text-xs text-muted">Broad inspection context; these paths do not establish file-level completeness.</p>
      <ul v-if="workspace.coverage.sourceAreas.length" class="flex flex-wrap gap-x-4 gap-y-2">
        <li v-for="path in workspace.coverage.sourceAreas" :key="path"><button type="button" class="break-all text-start font-mono text-xs text-primary underline decoration-dotted underline-offset-4" @click="emit('selectPath', path)">{{ path }}</button></li>
      </ul>
      <p v-else class="text-sm text-muted">None recorded.</p>
    </section>
    <div class="grid gap-7 @3xl:grid-cols-2">
      <section v-for="field in fields" :key="field.key" class="min-w-0 space-y-2" :aria-label="field.label" :data-coverage-field="field.key">
        <h4 class="text-sm font-semibold text-highlighted">{{ field.label }} <span class="blr-meta ms-1">{{ field.items.length }}</span></h4>
        <p class="text-xs text-muted">{{ field.description }}</p>
        <ul v-if="field.items.length" class="list-disc space-y-2 ps-4"><li v-for="(item, index) in field.items" :key="index"><BlrProse :text="item" /></li></ul>
        <p v-else class="text-sm text-muted">None recorded.</p>
      </section>
    </div>
    <p class="border-t border-default pt-4 text-xs text-muted">Source: <code>.businesslens/coverage.json</code></p>
  </section>
</template>
