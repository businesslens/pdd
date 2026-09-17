<script setup lang="ts">
import type { ResourceChange, RepositoryFileLoader } from 'businesslens/report'
import { ENTITY_KIND_META, projectReportWorkspace } from '../utils/reportWorkspace'
import type { ReportChanges } from '../utils/reportChanges'
import { referenceFile } from '../utils/coverageRepository'
import { CHANGE_COLLECTIONS, COLLECTION_KIND, changeKey, changeSummary } from '../utils/reportChanges'

const props = defineProps<{ changes: ReportChanges, loadRepositoryFile?: RepositoryFileLoader, resourceReadingOpen?: boolean }>()
const path = defineModel<string | null>('path', { default: null })
const emit = defineEmits<{
  compare: [base: string, target: string]
  search: [query: string]
  more: []
  inspect: [key: string, state: string]
}>()
const target = computed(() => props.changes.target ?? 'working')
const before = computed(() => props.changes.before ? projectReportWorkspace(props.changes.before) : null)
const after = computed(() => props.changes.after ? projectReportWorkspace(props.changes.after) : null)
const beforeReferences = computed(() => before.value?.references.map(item => item.reference))
const afterReferences = computed(() => after.value?.references.map(item => item.reference))
const groups = computed(() => CHANGE_COLLECTIONS.flatMap(collection => {
  const items = props.changes.diff?.resources.filter(change => change.collection === collection) ?? []
  return items.length ? [{ key: collection, meta: ENTITY_KIND_META[COLLECTION_KIND[collection]], items }] : []
}))
const empty = computed(() => props.changes.diff && !props.changes.diff.resources.length && !props.changes.diff.product.length)
const baseId = computed(() => props.changes.baseState?.id ?? props.changes.baseline ?? '')
const targetId = computed(() => props.changes.targetState?.id ?? target.value)
function inspect(change: ResourceChange, side: 'before' | 'after') {
  emit('inspect', changeKey(change), side === 'before' ? baseId.value : targetId.value)
}
function relatedFiles(change: ResourceChange) {
  const key = changeKey(change)
  return [...new Set([before.value, after.value].flatMap(workspace => workspace?.references
    .filter(reference => reference.ownerKey === key).flatMap(reference => referenceFile(reference) ?? []) ?? []))]
    .filter(path => props.changes.repository?.paths.includes(path))
}
</script>

<template>
  <div class="space-y-5" data-changes data-history>
    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-default p-3" data-changes-toolbar>
      <BlrHistorySelect :changes="changes" :model-value="changes.baseline" label="Base" data-baseline-control @select="emit('compare', $event, target)" @search="emit('search', $event)" @more="emit('more')" />
      <UButton icon="i-lucide-arrow-left-right" aria-label="Swap comparison sides" color="neutral" variant="outline" :disabled="!changes.baseline" @click="emit('compare', target, changes.baseline!)" />
      <BlrHistorySelect :changes="changes" :model-value="target" label="Compare to" data-target-control @select="changes.baseline && emit('compare', changes.baseline, $event)" @search="emit('search', $event)" @more="emit('more')" />

    </div>
    <UAlert v-if="changes.error" color="warning" icon="i-lucide-triangle-alert" title="These states cannot be compared." :description="changes.error" />
    <p v-else-if="changes.initializing" class="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">Loading history…</p>
    <div v-else-if="!changes.baseline" class="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-5 text-center" data-history-empty>
      <UIcon name="i-lucide-history" class="size-9 text-muted" aria-hidden="true" />
      <h2 class="text-lg font-semibold">{{ changes.emptyReason === 'choose-state' ? 'Choose a state to compare' : 'Nothing to compare yet' }}</h2>
      <p v-if="changes.emptyReason === 'choose-state'" class="max-w-md text-sm leading-relaxed text-muted">No initial comparison could be selected. Choose an earlier commit or another branch as your base, to inspect its changes.</p>
      <p v-else class="max-w-md text-sm leading-relaxed text-muted">There isn’t an earlier saved Git state. Commit your model and relevant source files to make a saved state available.</p>
    </div>
    <p v-else-if="!changes.diff && !changes.repository && !changes.modelNotice" class="text-sm text-muted" role="status">Comparing states…</p>
    <UAlert v-if="changes.modelNotice" color="warning" icon="i-lucide-triangle-alert" title="Product Model comparison unavailable" :description="changes.modelNotice" />
    <p v-if="changes.referenceFileNotice" class="whitespace-pre-line text-xs text-muted">{{ changes.referenceFileNotice }}</p>
    <section v-if="changes.diff" class="space-y-4" data-model-changes>
      <h2 class="text-base font-semibold">Product model changes</h2>
      <div v-if="empty" class="rounded-lg border border-default p-4" data-changes-empty>
        <p class="text-sm text-muted">No Product Model changes between these states.</p>
      </div>
      <p v-else class="text-sm text-muted" data-changes-summary>{{ changeSummary(changes.diff) }}</p>
      <section v-if="changes.diff.product.length" class="rounded-lg border border-default p-3">
        <h2 class="mb-3 font-semibold">Product</h2>
        <dl class="space-y-3">
          <div v-for="field in changes.diff.product" :key="field.field">
            <dt class="mb-1 text-xs text-muted">{{ field.referenceFile ? 'Reference file' : field.field }}</dt>
            <dd><BlrFieldChangeValue :field="field" :base="baseId" :target="targetId" :before-references="beforeReferences" :after-references="afterReferences" /></dd>
          </div>
        </dl>
      </section>
      <section v-for="group in groups" :key="group.key" class="space-y-2" :data-changes-group="group.key">
        <h2 class="text-sm font-semibold">{{ group.meta.plural }} <span class="ms-1 text-muted">{{ group.items.length }}</span></h2>
        <div v-for="change in group.items" :key="change.id" class="rounded-lg border border-default p-3" :data-change-row="change.change">
          <div class="flex flex-wrap items-center gap-2">
            <span class="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{{ change.title }}</span>
            <BlrChangeMark :change="change.change" />
            <UButton v-if="before?.byKey.has(changeKey(change))" label="Base" :aria-label="`Open ${change.title} at base`" color="neutral" variant="outline" size="xs" @click="inspect(change, 'before')" />
            <UButton v-if="after?.byKey.has(changeKey(change))" label="Compare to" :aria-label="`Open ${change.title} at comparison state`" color="neutral" variant="outline" size="xs" @click="inspect(change, 'after')" />
          </div>
          <div v-if="relatedFiles(change).length" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span class="text-muted">Repository files</span><button v-for="file in relatedFiles(change)" :key="file" class="break-all font-mono text-primary underline" @click="path = file">{{ file }}</button>
          </div>
          <details v-if="change.fields.length" class="mt-2">
            <summary class="cursor-pointer text-xs text-muted" data-change-fields>{{ change.fields.length }} {{ change.fields.length === 1 ? 'field' : 'fields' }}</summary>
            <dl class="mt-3 space-y-3">
              <div v-for="field in change.fields" :key="field.field">
                <dt class="mb-1 text-xs text-muted">{{ field.referenceFile ? 'Reference file' : field.field }}</dt>
                <dd><BlrFieldChangeValue :field="field" :base="baseId" :target="targetId" :before-references="beforeReferences" :after-references="afterReferences" /></dd>
              </div>
            </dl>
          </details>
        </div>
      </section>
    </section>
    <BlrReviewRepository v-if="changes.repository" v-model:path="path" :diff="changes.repository" :base="baseId" :target="targetId" :before="before" :after="after" :load-file="loadRepositoryFile" :resource-reading-open="resourceReadingOpen" @inspect="(key, state) => emit('inspect', key, state)" />
  </div>
</template>
