<script setup lang="ts">
import type { ResourceChange } from 'businesslens/report'
import { ENTITY_KIND_META, projectReportWorkspace } from '../utils/reportWorkspace'
import type { ReportChanges } from '../utils/reportChanges'
import { CHANGE_COLLECTIONS, COLLECTION_KIND, changeKey, changeSummary } from '../utils/reportChanges'

const props = defineProps<{ changes: ReportChanges }>()
const emit = defineEmits<{
  compare: [base: string, target: string]
  search: [query: string]
  more: []
  pin: [label: string | null]
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
const checkpointOpen = ref(false)
const checkpointLabel = ref('')
function checkpoint() {
  emit('pin', checkpointLabel.value.trim() || null)
  checkpointLabel.value = ''
  checkpointOpen.value = false
}
</script>

<template>
  <div class="space-y-5" data-changes data-history>
    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-default p-3" data-changes-toolbar>
      <BlrHistorySelect :changes="changes" :model-value="changes.baseline" label="Base" data-baseline-control @select="emit('compare', $event, target)" @search="emit('search', $event)" @more="emit('more')" />
      <UButton icon="i-lucide-arrow-left-right" aria-label="Swap comparison sides" color="neutral" variant="outline" :disabled="!changes.baseline" @click="emit('compare', target, changes.baseline!)" />
      <BlrHistorySelect :changes="changes" :model-value="target" label="Compare to" data-target-control @select="changes.baseline && emit('compare', changes.baseline, $event)" @search="emit('search', $event)" @more="emit('more')" />
      <UPopover v-if="changes.pinnable" v-model:open="checkpointOpen">
        <UButton icon="i-lucide-bookmark-plus" color="neutral" variant="outline" label="Create a checkpoint" class="sm:ms-auto" data-pin-control />
        <template #content>
          <form class="flex w-80 flex-col gap-3 p-4" @submit.prevent="checkpoint">
            <p class="text-sm text-muted">Save the current working model and its local References, regardless of the states selected here.</p>
            <UInput v-model="checkpointLabel" aria-label="Checkpoint label" placeholder="Label (optional)" maxlength="120" autofocus />
            <UButton type="submit" label="Create checkpoint" class="self-end" />
          </form>
        </template>
      </UPopover>
    </div>
    <UAlert v-if="changes.error" color="warning" icon="i-lucide-triangle-alert" title="These states cannot be compared." :description="changes.error" />
    <p v-else-if="changes.initializing" class="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">Loading history…</p>
    <div v-else-if="!changes.baseline" class="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-5 text-center" data-history-empty>
      <UIcon name="i-lucide-history" class="size-9 text-muted" aria-hidden="true" />
      <h2 class="text-lg font-semibold">{{ changes.emptyReason === 'choose-state' ? 'Choose a state to compare' : 'Nothing to compare yet' }}</h2>
      <p v-if="changes.emptyReason === 'choose-state'" class="max-w-md text-sm leading-relaxed text-muted">The current and default branches have no saved Product Model. Choose an earlier commit or another branch as your base, or create a checkpoint.</p>
      <p v-else class="max-w-md text-sm leading-relaxed text-muted">There isn’t an earlier saved Product Model. Create a checkpoint or commit your model, then make changes to see what’s different.</p>
    </div>
    <p v-else-if="!changes.diff" class="text-sm text-muted" role="status">Comparing states…</p>
    <template v-if="changes.diff">
      <div v-if="empty" class="flex min-h-[40vh] items-center justify-center px-5 text-center" data-changes-empty>
        <p class="text-sm text-muted">No differences between these states.</p>
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
    </template>
  </div>
</template>
