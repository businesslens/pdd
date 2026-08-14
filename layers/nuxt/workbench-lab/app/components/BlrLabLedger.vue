<script setup lang="ts">
/**
 * Ledger — every entity is a row, and kind is just a column.
 *
 * Premise: a Product Model is a dataset. The Workbench asks you to pick a
 * collection before you can look at anything, which is the right question only
 * when you already know which kind holds your answer. "What in this model
 * mentions publishing" crosses every collection, and a per-kind surface cannot
 * take that question at all.
 *
 * So: one flat table over all sixty-eight entities, a query language instead of
 * controls, expansion in place instead of a panel or a page, and the keyboard
 * as the primary input — j/k or arrows to move, Enter to expand, / to query.
 *
 * The stated cost is shape. A table cannot show what a Journey feels like, and
 * this variation does not pretend otherwise.
 */
import type { AnyEntityView, ReportEntityKind, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, entitiesOfKind, relatedIds, resolveEntity } from '../utils/model'
import type { WorkbenchVariant } from '../utils/workbenchVariants'

const props = defineProps<{
  workspace: ReportWorkspace
  variant: WorkbenchVariant
  logoSrc?: string | null
}>()

const query = ref('')
const expandedKey = ref<string | null>(null)
const cursor = ref(0)
const sortKey = ref<'kind' | 'title' | 'parent' | 'links'>('kind')
const sortDescending = ref(false)
const queryInput = useTemplateRef<HTMLInputElement>('queryInput')

const KINDS = REPORT_ENTITY_KINDS.map(meta => meta.kind)

/** Every entity in the model, flattened once. */
const allEntities = computed<AnyEntityView[]>(() =>
  KINDS.flatMap(kind => entitiesOfKind(props.workspace, kind)))

/*
  A query language, not a filter bar.

  `kind:screen` narrows by kind, `in:reader-web` matches any relation or id
  fragment, and bare words match the title and lead. Terms are ANDed, which is
  what a reader typing two words means. It is deliberately tiny — the point of
  the audition is whether typing beats clicking, not whether a full grammar can
  be built.
*/
interface Term {
  field: 'kind' | 'in' | 'text'
  value: string
}

const terms = computed<Term[]>(() => query.value
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((token) => {
    const [head, ...rest] = token.split(':')
    if (rest.length && (head === 'kind' || head === 'in')) {
      return { field: head, value: rest.join(':').toLowerCase() }
    }
    return { field: 'text' as const, value: token.toLowerCase() }
  }))

function relationText(entity: AnyEntityView): string {
  return KINDS
    .flatMap(kind => relatedIds(entity, kind))
    .join(' ')
    .toLowerCase()
}

function matches(entity: AnyEntityView): boolean {
  return terms.value.every((term) => {
    if (term.field === 'kind') {
      return entity.kind.includes(term.value) || ENTITY_KIND_META[entity.kind].plural.toLowerCase().includes(term.value)
    }
    if (term.field === 'in') {
      return entity.id.toLowerCase().includes(term.value) || relationText(entity).includes(term.value)
    }
    return `${entity.title} ${entity.lead}`.toLowerCase().includes(term.value)
  })
}

/** The one relation that identifies a row: its parent, or its scope. */
function parentOf(entity: AnyEntityView): string {
  if (entity.kind === 'capability-scenario') return (entity as { capabilityTitle: string }).capabilityTitle
  if (entity.kind === 'journey-scenario') return (entity as { journeyTitle: string }).journeyTitle
  if (entity.kind === 'capability') {
    const id = (entity as { domainId: string }).domainId
    return id ? resolveEntity(props.workspace, 'domain', id)?.title ?? id : ''
  }
  if ('availability' in entity) {
    const [first] = (entity as { availability: Array<{ interfaceTitle: string, experienceTitle: string }> }).availability
    if (first) return first.experienceTitle ? `${first.interfaceTitle} › ${first.experienceTitle}` : first.interfaceTitle
  }
  if (entity.kind === 'experience') {
    const [id] = (entity as { interfaceIds: string[] }).interfaceIds
    return id ? resolveEntity(props.workspace, 'interface', id)?.title ?? id : ''
  }
  return ''
}

function linkCount(entity: AnyEntityView): number {
  return KINDS.reduce((total, kind) => total + relatedIds(entity, kind).length, 0)
}

const rows = computed(() => {
  const filtered = allEntities.value.filter(matches)
  const direction = sortDescending.value ? -1 : 1
  return [...filtered].sort((left, right) => {
    if (sortKey.value === 'links') return (linkCount(left) - linkCount(right)) * direction
    const value = sortKey.value === 'kind'
      ? `${KINDS.indexOf(left.kind)}${left.title}`.localeCompare(`${KINDS.indexOf(right.kind)}${right.title}`)
      : sortKey.value === 'parent'
        ? parentOf(left).localeCompare(parentOf(right))
        : left.title.localeCompare(right.title)
    return value * direction
  })
})

/** Counts per kind, so a query shows what it removed rather than just fewer rows. */
const spread = computed(() => REPORT_ENTITY_KINDS
  .map(meta => ({
    meta,
    total: entitiesOfKind(props.workspace, meta.kind).length,
    shown: rows.value.filter(row => row.kind === meta.kind).length
  }))
  .filter(item => item.total > 0))

const expanded = computed(() => rows.value.find(row => row.key === expandedKey.value) ?? null)

watch(rows, () => {
  cursor.value = Math.min(cursor.value, Math.max(rows.value.length - 1, 0))
})

function sortBy(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortDescending.value = !sortDescending.value
    return
  }
  sortKey.value = key
  sortDescending.value = false
}

function toggle(entity: AnyEntityView) {
  expandedKey.value = expandedKey.value === entity.key ? null : entity.key
}

function move(delta: number) {
  if (!rows.value.length) return
  cursor.value = Math.min(Math.max(cursor.value + delta, 0), rows.value.length - 1)
  const row = rows.value[cursor.value]
  if (row && expandedKey.value) expandedKey.value = row.key
  document.querySelector(`[data-ledger-row="${cursor.value}"]`)?.scrollIntoView({ block: 'nearest' })
}

function onKey(event: KeyboardEvent) {
  const typing = event.target instanceof HTMLInputElement
  if (event.key === '/' && !typing) {
    event.preventDefault()
    queryInput.value?.focus()
    return
  }
  if (typing && event.key !== 'Escape' && event.key !== 'Enter') return
  if (event.key === 'Escape') {
    if (typing) (event.target as HTMLInputElement).blur()
    else expandedKey.value = null
    return
  }
  if (event.key === 'j' || event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
    return
  }
  if (event.key === 'k' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
    return
  }
  if (event.key === 'Enter') {
    const row = rows.value[cursor.value]
    if (row) {
      event.preventDefault()
      toggle(row)
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function jump(entity: AnyEntityView) {
  const index = rows.value.findIndex(row => row.key === entity.key)
  if (index >= 0) {
    cursor.value = index
    expandedKey.value = entity.key
    return
  }
  /* Outside the current query: clearing it is more honest than silently
     widening, so the reader sees why the row was not there. */
  query.value = ''
  void nextTick(() => {
    const position = rows.value.findIndex(row => row.key === entity.key)
    if (position >= 0) {
      cursor.value = position
      expandedKey.value = entity.key
    }
  })
}

const status = computed(() => `${rows.value.length} of ${allEntities.value.length} rows`)
</script>

<template>
  <BlrLabFrame :workspace="workspace" :variant="variant" :logo-src="logoSrc" :status="status" @select="jump">
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2">
        <UIcon name="i-lucide-terminal" class="size-4 shrink-0 text-dimmed" />
        <input
          ref="queryInput"
          v-model="query"
          type="text"
          class="min-w-0 flex-1 bg-transparent font-mono text-sm text-highlighted outline-none placeholder:text-dimmed"
          placeholder="kind:screen in:reader-web publish   —   / to focus, j/k to move, Enter to expand"
          spellcheck="false"
        >
        <UButton
          v-if="query"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Clear the query"
          @click="query = ''"
        />
      </div>

      <!-- What the query kept, per kind. A count that went to zero is the
           most useful thing a query can tell you. -->
      <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default bg-elevated/20 px-4 py-1.5">
        <button
          v-for="item in spread"
          :key="item.meta.kind"
          type="button"
          class="blr-ledger-spread"
          :data-empty="item.shown === 0"
          :title="`Query for ${item.meta.plural}`"
          @click="query = `kind:${item.meta.kind}`"
        >
          <UIcon :name="item.meta.icon" class="size-3 shrink-0" :style="{ color: `var(--blr-slot-${item.meta.slot})` }" />
          {{ item.meta.plural }}
          <span class="font-mono">{{ item.shown }}<span v-if="item.shown !== item.total" class="text-dimmed">/{{ item.total }}</span></span>
        </button>
      </div>

      <div class="blr-pane min-h-0 flex-1">
        <table class="w-full border-collapse text-sm">
          <thead class="sticky top-0 z-10 bg-default/95 backdrop-blur">
            <tr class="border-b border-default text-start">
              <th class="w-40 px-4 py-2 text-start"><button type="button" class="blr-ledger-th" @click="sortBy('kind')">Kind</button></th>
              <th class="px-2 py-2 text-start"><button type="button" class="blr-ledger-th" @click="sortBy('title')">Entity</button></th>
              <th class="hidden w-64 px-2 py-2 text-start lg:table-cell"><button type="button" class="blr-ledger-th" @click="sortBy('parent')">Parent or scope</button></th>
              <th class="w-20 px-4 py-2 text-end"><button type="button" class="blr-ledger-th" @click="sortBy('links')">Links</button></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, index) in rows" :key="row.key">
              <tr
                :data-ledger-row="index"
                class="blr-ledger-row"
                :data-cursor="index === cursor"
                :data-open="row.key === expandedKey"
                @click="cursor = index; toggle(row)"
              >
                <td class="px-4 py-1.5">
                  <span class="inline-flex items-center gap-1.5 text-xs text-muted">
                    <BlrKind :kind="row.kind" :labelled="false" size="xs" />
                    {{ ENTITY_KIND_META[row.kind].label }}
                  </span>
                </td>
                <td class="min-w-0 px-2 py-1.5">
                  <span class="flex min-w-0 items-baseline gap-2">
                    <span class="truncate font-medium text-highlighted">{{ row.title }}</span>
                    <span class="hidden truncate font-mono text-[11px] text-dimmed xl:inline">{{ row.id }}</span>
                  </span>
                </td>
                <td class="hidden truncate px-2 py-1.5 text-muted lg:table-cell">{{ parentOf(row) || '—' }}</td>
                <td class="px-4 py-1.5 text-end font-mono text-xs text-muted">{{ linkCount(row) }}</td>
              </tr>
              <tr v-if="row.key === expandedKey">
                <td colspan="4" class="border-y border-default bg-elevated/25 p-0">
                  <!-- In place: the row you were on stays exactly where it was. -->
                  <div class="max-h-[32rem] overflow-y-auto">
                    <BlrLabReading
                      :workspace="workspace"
                      :entity="expanded"
                      :header="false"
                      @select="jump"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <p v-if="!rows.length" class="p-8 text-center text-sm text-muted italic">
          No entity matches <code class="font-mono">{{ query }}</code>.
        </p>
      </div>
    </div>
  </BlrLabFrame>
</template>

<style scoped>
.blr-ledger-th {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-ledger-th:hover {
  color: var(--ui-text-highlighted);
}

.blr-ledger-row {
  cursor: pointer;
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 45%, transparent);
}

.blr-ledger-row:hover {
  background: var(--ui-bg-elevated);
}

/* The cursor is a keyboard position, so it has to read at a glance even when
   the mouse is somewhere else entirely. */
.blr-ledger-row[data-cursor='true'] {
  background: color-mix(in srgb, var(--blr-slot-9) 8%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-slot-9);
}

.blr-ledger-row[data-open='true'] {
  background: color-mix(in srgb, var(--blr-slot-9) 12%, var(--ui-bg-elevated));
}

.blr-ledger-spread {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 11px;
  color: var(--ui-text-muted);
}

.blr-ledger-spread:hover {
  color: var(--ui-text-highlighted);
}

.blr-ledger-spread[data-empty='true'] {
  opacity: 0.35;
}
</style>
