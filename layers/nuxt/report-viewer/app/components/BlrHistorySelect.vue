<script setup lang="ts">
import type { ReportBaseline } from 'businesslens/report'
import type { ReportChanges } from '../utils/reportChanges'
import { baselineDetail, baselineTitle } from '../utils/reportChanges'

const props = defineProps<{ changes: ReportChanges, modelValue: string | null, label: string }>()
const emit = defineEmits<{ select: [state: string], search: [query: string], more: [] }>()
const open = ref(false)
const search = useTemplateRef('search')
const picker = useTemplateRef<HTMLElement>('picker')
const category = ref('branch')
const tabs = [
  { value: 'branch', label: 'Branches', placeholder: 'Find a branch…' },
  { value: 'commit', label: 'Commits', placeholder: 'Find a commit or enter a SHA…' },
  { value: 'tag', label: 'Tags', placeholder: 'Find a tag…' }
]
const marks = {
  empty: { icon: 'i-lucide-file', label: 'Empty state' },
  working: { icon: 'i-lucide-file-pen-line', label: 'Working state' },
  branch: { icon: 'i-lucide-git-branch', label: 'Branch' },
  commit: { icon: 'i-lucide-git-commit-horizontal', label: 'Commit' },
  committed: { icon: 'i-lucide-git-commit-horizontal', label: 'Commit' },
  tag: { icon: 'i-lucide-tag', label: 'Tag' }
}
const working: ReportBaseline = { id: 'working', kind: 'working', available: true }
const selected = computed(() => [...props.changes.baselines, props.changes.baseState, props.changes.targetState, working]
  .find(state => state?.id === props.modelValue))
const selectedLabel = computed(() => selected.value ? baselineTitle(selected.value) : props.modelValue ?? 'Choose a state')
const selectedMark = computed(() => selected.value ? marks[selected.value.kind] : { icon: 'i-lucide-history', label: 'State' })
const activeTab = computed(() => tabs.find(tab => tab.value === category.value)!)
const items = computed(() => (props.changes.historyStates ?? props.changes.baselines)
  .filter(state => (state.kind === 'committed' || state.kind === 'empty' ? 'commit' : state.kind) === category.value))

function onOpen(value: boolean) {
  if (!value) return
  const kind = selected.value?.kind
  category.value = kind === 'committed' || kind === 'empty' ? 'commit' : kind && kind !== 'working' ? kind : 'branch'
  if (props.changes.historyQuery) emit('search', '')
}
function focusSearch(event: Event) {
  event.preventDefault()
  search.value?.inputRef?.focus()
}
function choose(id: string) {
  emit('select', id)
  open.value = false
}
/** Keep native buttons and tab controls; arrow keys also reach and traverse results. */
function navigate(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const fromSearch = target.tagName === 'INPUT'
  if (!fromSearch && !target.closest('[data-history-option]')) return
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (fromSearch && ['Home', 'End'].includes(event.key)) return
  const buttons = [...picker.value!.querySelectorAll<HTMLButtonElement>('[data-history-option]:not(:disabled)')]
  if (!buttons.length) return
  event.preventDefault()
  const current = buttons.indexOf(target.closest('button') as HTMLButtonElement)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
    : current < 0 ? event.key === 'ArrowDown' ? 0 : buttons.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
  buttons[next]?.focus()
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start', collisionPadding: 12, onOpenAutoFocus: focusSearch }" :ui="{ content: 'w-88 max-w-[calc(100vw-1.5rem)] overflow-hidden' }" @update:open="onOpen">
    <UButton
      :icon="selectedMark.icon"
      trailing-icon="i-lucide-chevron-down"
      color="neutral"
      variant="outline"
      :aria-label="label"
      :aria-description="`${selectedMark.label}: ${selectedLabel}`"
      :title="selectedLabel"
      class="max-w-full sm:max-w-72"
      :ui="{ leadingIcon: 'size-3.5', trailingIcon: 'size-3.5' }"
    >
      <span class="shrink-0 text-muted">{{ label }}:</span>
      <span class="truncate">{{ selectedLabel }}</span>
    </UButton>
    <template #content>
      <div ref="picker" data-history-picker @keydown="navigate">
        <div class="flex items-center justify-between border-b border-default px-3 py-2">
          <p class="text-sm font-semibold">{{ label === 'Base' ? 'Choose a base state' : 'Choose a comparison state' }}</p>
          <UButton icon="i-lucide-x" aria-label="Close state picker" color="neutral" variant="ghost" size="xs" @click="open = false" />
        </div>
        <div class="p-2">
          <UInput ref="search" :model-value="changes.historyQuery ?? ''" :placeholder="activeTab.placeholder" aria-label="Search history" :loading="changes.historyLoading" class="w-full" @update:model-value="emit('search', String($event))" />
        </div>
        <UTabs v-model="category" :items="tabs" :content="false" variant="link" color="neutral" size="sm" aria-label="State type" :ui="{ list: 'w-full justify-between gap-0 p-0', trigger: 'flex-none px-2 py-2 text-xs', indicator: 'h-0.5' }" />
        <div class="max-h-64 overflow-y-auto p-1" :aria-label="activeTab.label" :aria-busy="changes.historyLoading">
          <button
            v-for="state in items"
            :key="state.id"
            type="button"
            data-history-option
            :data-history-state="state.id"
            :disabled="!state.available"
            :aria-pressed="state.id === modelValue"
            :title="`${baselineTitle(state)} · ${baselineDetail(state)}`"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-start hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            @click="choose(state.id)"
          >
            <UIcon :name="marks[state.kind].icon" class="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span class="sr-only">{{ marks[state.kind].label }}:</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm">{{ baselineTitle(state) }}</span>
              <span class="block truncate text-xs text-muted">{{ baselineDetail(state) }}</span>
            </span>
            <span v-if="state.kind === 'branch' && state.isDefault" class="shrink-0 rounded-full border border-default px-1.5 py-0.5 text-xs text-muted">Default</span>
            <span v-if="state.kind === 'branch' && state.isCurrent" class="shrink-0 rounded-full border border-default px-1.5 py-0.5 text-xs text-muted">Current</span>
            <UIcon v-if="state.id === modelValue" name="i-lucide-check" class="size-4 shrink-0" aria-hidden="true" />
          </button>
          <p v-if="!items.length" class="px-3 py-5 text-center text-sm text-muted">{{ changes.historyLoading ? 'Searching…' : `No ${activeTab.label.toLowerCase()} found.` }}</p>
        </div>
        <div v-if="category === 'commit' && changes.historyMore" class="border-t border-default p-1">
          <UButton label="Load more commits" color="neutral" variant="ghost" block :loading="changes.historyLoading" @click="emit('more')" />
        </div>
        <div class="border-t border-default p-1">
          <UButton :icon="marks.working.icon" label="Working state" :trailing-icon="modelValue === 'working' ? 'i-lucide-check' : undefined" color="neutral" variant="ghost" block class="justify-start" data-history-option data-history-state="working" :aria-pressed="modelValue === 'working'" @click="choose('working')" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
