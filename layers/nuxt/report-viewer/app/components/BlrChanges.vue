<script setup lang="ts">
/**
 * What changed: the current model against one baseline.
 *
 * A named view like the matrices — one derivation, stated, accountable —
 * comparing two states of the model instead of two collections. The baseline
 * is the one control: the last commit, or a checkpoint the `checkpoint`
 * command or the pin here sealed. Every changed resource is a
 * row that opens its page, grouped by collection in rail order, with the
 * fields that differ under it; a removed resource is named but leads nowhere,
 * since there is nowhere left to go.
 */
import type { FieldChange, ReportBaseline, ResourceChange } from 'businesslens/report'
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import type { ReportChanges } from '../utils/reportChanges'
import { CHANGE_COLLECTIONS, CHANGE_META, COLLECTION_KIND, baselineDetail, baselineTitle, changeKey, changeSummary } from '../utils/reportChanges'

const props = defineProps<{
  workspace: ReportWorkspace
  changes: ReportChanges
}>()

const emit = defineEmits<{
  baseline: [id: string]
  pin: [label: string | null]
  open: [resource: AnyResourceView]
}>()

const chosen = computed(() => props.changes.baselines.find(item => item.id === props.changes.baseline))
const since = computed(() => chosen.value ? baselineTitle(chosen.value) : '')

/* The picker lists what a comparison can be made against. An unavailable
   baseline — a model with no commit yet — stays in the list, disabled, with
   its reason: absent, it would look like a bug rather than a fact. */
const baselineItems = computed(() => props.changes.baselines.map(item => ({
  value: item.id,
  label: baselineTitle(item),
  description: baselineDetail(item),
  icon: item.kind === 'committed' ? 'i-lucide-git-commit-horizontal' : item.source === 'pin' ? 'i-lucide-pin' : 'i-lucide-history',
  disabled: !item.available
})))

const groups = computed(() => {
  const diff = props.changes.diff
  if (!diff) return []
  return CHANGE_COLLECTIONS.flatMap((collection) => {
    const items = diff.resources.filter(change => change.collection === collection)
    if (!items.length) return []
    const kind = COLLECTION_KIND[collection]
    return [{ key: collection, kind, meta: ENTITY_KIND_META[kind], items }]
  })
})

const empty = computed(() => {
  const diff = props.changes.diff
  return Boolean(diff) && !diff!.resources.length && !diff!.product.length
})

/* A model with no commit and no checkpoint lists one disabled baseline. The
   surface says so, with the reason, and names the ways out. */
const noBaseline = computed(() => !props.changes.baselines.some(item => item.available))
const noBaselineReason = computed(() => {
  const committed = props.changes.baselines.find(item => item.kind === 'committed')
  return committed && !committed.available ? committed.reason : ''
})

const resourceOf = (change: ResourceChange) => props.workspace.byKey.get(changeKey(change))

/* Field lists open on request: a Scenario that gained two Steps and lost a
   route says "3 fields" until the reader asks which. */
const openFields = ref<string[]>([])
const fieldsOpen = (key: string) => openFields.value.includes(key)
function toggleFields(key: string, open: boolean) {
  openFields.value = open ? [...openFields.value, key] : openFields.value.filter(item => item !== key)
}
const fieldSummary = (fields: FieldChange[]) => `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`

const pinOpen = ref(false)
const pinLabel = ref('')
function pin() {
  emit('pin', pinLabel.value.trim() || null)
  pinLabel.value = ''
  pinOpen.value = false
}
</script>

<template>
  <div class="space-y-5" data-changes>
    <!-- The one control: what the model is compared against. -->
    <div class="flex flex-wrap items-center gap-2" data-changes-toolbar>
      <USelectMenu
        v-if="baselineItems.length"
        :model-value="changes.baseline ?? undefined"
        :items="baselineItems"
        value-key="value"
        size="md"
        variant="outline"
        class="min-w-64"
        icon="i-lucide-history"
        :search-input="false"
        :ui="{ content: 'blr-filter-menu', item: 'py-2' }"
        aria-label="Compare with"
        data-baseline-control
        @update:model-value="emit('baseline', $event as string)"
      >
        <!-- The item draws its own label and description; only the trigger
             needs the "Since" that makes the chosen name read as a baseline. -->
        <template #default>
          <span class="text-dimmed">Since</span>
          <span class="truncate font-medium text-highlighted">{{ chosen ? baselineTitle(chosen) : 'Choose a baseline' }}</span>
        </template>
      </USelectMenu>
      <UPopover v-if="changes.pinnable" v-model:open="pinOpen">
        <UButton icon="i-lucide-pin" color="neutral" variant="outline" size="md" label="Pin this state" data-pin-control />
        <template #content>
          <form class="flex w-72 flex-col gap-2 p-3" @submit.prevent="pin">
            <p class="text-xs text-muted">Seal the model as it is now, so later edits are read against it.</p>
            <UInput v-model="pinLabel" placeholder="What this state is (optional)" maxlength="120" autofocus />
            <UButton type="submit" label="Pin" color="primary" class="self-end" />
          </form>
        </template>
      </UPopover>
      <span v-if="changes.diff && !empty" class="ms-auto text-xs text-muted" data-changes-summary>{{ changeSummary(changes.diff) }}</span>
    </div>

    <p v-if="changes.referenceFileNotice" class="whitespace-pre-line text-sm text-muted" data-reference-file-notice>
      {{ changes.referenceFileNotice }}
    </p>

    <!-- A dead end names its own way out. -->
    <p v-if="noBaseline" class="text-sm text-muted italic" data-changes-no-baseline>
      <template v-if="noBaselineReason">{{ noBaselineReason }} </template>There is nothing to compare against yet.
      Commit the model, run <code>businesslens checkpoint</code>, or pin this state to mark where you are now.
    </p>
    <UAlert
      v-else-if="changes.error"
      icon="i-lucide-triangle-alert"
      color="warning"
      variant="subtle"
      title="This baseline cannot be compared."
      :description="changes.error"
    />
    <p v-else-if="empty" class="text-sm text-muted italic" data-changes-empty>
      Nothing has changed since {{ since }}.
    </p>

    <template v-else-if="changes.diff">
      <!-- The Product's own fields, when they moved. -->
      <section v-if="changes.diff.product.length" class="overflow-hidden rounded-xl border border-default bg-elevated/20" data-changes-product>
        <div class="flex items-center gap-2 px-3 py-2">
          <UIcon :name="ENTITY_KIND_META.product.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${ENTITY_KIND_META.product.slot})` }" />
          <span class="text-sm font-semibold tracking-tight text-highlighted">Product</span>
          <BlrChangeMark change="changed" />
        </div>
        <dl class="blr-field-changes border-t border-muted">
          <template v-for="field in changes.diff.product" :key="field.field">
            <dt>{{ field.referenceFile ? 'Reference file' : field.field }}</dt>
            <dd>
              <BlrFieldChangeValue :field="field" />
            </dd>
          </template>
        </dl>
      </section>

      <section v-for="group in groups" :key="group.key" class="space-y-2" :data-changes-group="group.kind">
        <h2 class="flex items-center gap-2 px-1">
          <UIcon :name="group.meta.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${group.meta.slot})` }" />
          <span class="text-sm font-semibold tracking-tight text-highlighted">{{ group.meta.plural }}</span>
          <span class="blr-meta">{{ group.items.length }}</span>
        </h2>
        <div class="space-y-2">
          <div v-for="change in group.items" :key="change.id" class="space-y-1" :data-change-row="change.change">
            <BlrResourceCard
              v-if="change.change !== 'removed' && resourceOf(change)"
              :workspace="workspace"
              :resource="resourceOf(change)!"
              :change="change.change"
              @open="emit('open', $event)"
            />
            <!-- A removed resource has no page: its name and its standing, nothing to press. -->
            <div
              v-else
              class="flex items-center gap-3 rounded-[0.625rem] border border-dashed border-default px-4 py-3"
            >
              <UIcon :name="group.meta.icon" class="size-4 shrink-0 text-dimmed" />
              <span class="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-muted line-through decoration-dimmed">{{ change.title }}</span>
              <BlrChangeMark :change="change.change" />
            </div>
            <UCollapsible
              v-if="change.fields.length"
              :open="fieldsOpen(changeKey(change))"
              class="ms-4"
              @update:open="toggleFields(changeKey(change), $event)"
            >
              <template #default="{ open }">
                <button type="button" class="flex items-center gap-1 text-xs text-muted hover:text-highlighted" data-change-fields>
                  <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 transition-transform" :class="open && 'rotate-180'" />
                  {{ fieldSummary(change.fields) }}
                </button>
              </template>
              <template #content>
                <dl class="blr-field-changes mt-1 rounded-lg border border-muted">
                  <template v-for="field in change.fields" :key="field.field">
                    <dt>
                      <UIcon :name="CHANGE_META[field.change].icon" class="size-3 shrink-0" />
                      {{ field.referenceFile ? 'Reference file' : field.field }}
                    </dt>
                    <dd>
                      <BlrFieldChangeValue :field="field" />
                    </dd>
                  </template>
                </dl>
              </template>
            </UCollapsible>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.blr-field-changes {
  display: grid;
  grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
  gap: 0.25rem 1rem;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-xs);
}

.blr-field-changes dt {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  color: var(--ui-text-dimmed);
  word-break: break-all;
}

.blr-field-changes dd {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.125rem;
}

</style>
