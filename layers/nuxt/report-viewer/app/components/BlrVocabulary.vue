<script setup lang="ts">
/**
 * The documented vocabulary, in one searchable panel.
 *
 * A reader can browse the list or search a word and its meaning here. The panel
 * stays over the reading so looking up a word preserves the resource page.
 *
 * It defines nothing of its own. Each row is one generated line and a way out
 * to the documentation page that owns the term.
 *
 * A word inside a definition that is itself defined is followable, and following
 * one moves the mark down the list rather than opening anything: chasing a word
 * is the reason a reader is here, and it should never cost them their place.
 */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { definitionSegments, vocabularySections, vocabularyTerm } from '../utils/vocabulary'

/*
  The panel is shared state, not a prop: a term rendered ten components deep can
  ask for it, and the reader means the same panel every time.
*/
const { open, lookup, returnFocusId, show } = useVocabularyPanel()

const query = ref('')
const sections = computed(() => vocabularySections(query.value))
const count = computed(() => sections.value.reduce((total, section) => total + section.items.length, 0))
const listEl = ref<HTMLElement | null>(null)
const searchInput = ref<{ inputRef: HTMLInputElement | null } | null>(null)
const marked = ref<VocabularySlug | null>(null)

interface VocabularyVisit {
  query: string
  marked: VocabularySlug | null
  scrollTop: number
  source: VocabularySlug
}

const history = ref<VocabularyVisit[]>([])
const backLabel = computed(() => {
  const previous = history.value.at(-1)
  return previous ? `Back to ${vocabularyTerm(previous.source).term}` : null
})

function follow(slug: VocabularySlug, source: VocabularySlug) {
  history.value.push({
    query: query.value,
    marked: marked.value,
    scrollTop: listEl.value?.scrollTop ?? 0,
    source
  })
  show(slug)
}

async function goBack() {
  const previous = history.value.pop()
  if (!previous) return
  lookup.value = null
  query.value = previous.query
  marked.value = previous.marked
  await nextTick()
  const row = listEl.value?.querySelector<HTMLElement>(`[data-term="${previous.source}"]`)
  row?.focus({ preventScroll: true })
  if (listEl.value) listEl.value.scrollTop = previous.scrollTop
}

// Only a reader's edit starts a new search. Restoring a visit above must retain
// its position and history rather than firing a query watcher that erases them.
async function search(value: string | number | null | undefined) {
  query.value = String(value ?? '')
  lookup.value = null
  marked.value = null
  history.value = []
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = 0
}

function clearSearch() {
  void search('')
  searchInput.value?.inputRef?.focus()
}

/* Arriving by name outranks whatever was typed here last: the reader asked for
   one word, and a stale filter that hides it would be the panel's own doing. */
watch([open, lookup], async ([isOpen, request]) => {
  if (!isOpen || !request) return
  query.value = ''
  marked.value = request.slug
  await nextTick()
  focusTerm()
}, { immediate: true })

function focusTerm() {
  if (!open.value || !lookup.value) return
  const row = listEl.value?.querySelector<HTMLElement>(`[data-term="${lookup.value.slug}"]`)
  row?.focus({ preventScroll: true })
  row?.scrollIntoView({ block: 'center' })
}

// A lookup arriving from a popover should receive focus when the dialog mounts,
// before its default autofocus can choose the close button instead.
function onOpenAutoFocus(event: Event) {
  if (lookup.value) {
    event.preventDefault()
    focusTerm()
  } else if (window.matchMedia('(min-width: 640px) and (pointer: fine)').matches) {
    event.preventDefault()
    searchInput.value?.inputRef?.focus()
  }
}

function onCloseAutoFocus(event: Event) {
  const origin = returnFocusId.value ? document.getElementById(returnFocusId.value) : null
  returnFocusId.value = null
  if (!origin) return
  event.preventDefault()
  origin.focus({ preventScroll: true })
}

watch(open, (isOpen) => {
  if (isOpen) return
  lookup.value = null
  marked.value = null
  history.value = []
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Vocabulary"
    description="Definitions and links to the full documentation."
    :content="{ onOpenAutoFocus, onCloseAutoFocus }"
    :ui="{
      content: 'w-full max-w-[480px]',
      header: 'px-4 py-4 sm:px-5',
      title: 'pe-10 text-lg leading-6',
      body: 'min-h-0 overflow-hidden p-0 sm:p-0',
      overlay: 'bg-black/14 dark:bg-black/30',
      close: 'top-1.5 end-1.5 size-11 justify-center sm:top-4 sm:end-4 sm:size-7'
    }"
  >
    <template #body>
      <div class="flex h-full min-h-0 flex-col">
        <div class="shrink-0 border-b border-default px-4 py-3 sm:px-5">
          <UInput
            ref="searchInput"
            :model-value="query"
            icon="i-lucide-search"
            size="sm"
            variant="outline"
            class="w-full"
            :ui="{ base: 'h-11 text-base sm:h-9 sm:text-sm md:text-sm' }"
            placeholder="Find a word, or what it means…"
            aria-label="Filter the vocabulary"
            @update:model-value="search"
          >
            <template v-if="query" #trailing>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="link"
                size="xs"
                aria-label="Clear the filter"
                @click="clearSearch"
              />
            </template>
          </UInput>
          <UButton
            v-if="backLabel"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            class="-ms-2 mt-2 min-h-11 max-w-full sm:min-h-9"
            :label="backLabel"
            @click="goBack"
          />
        </div>

        <div ref="listEl" data-vocabulary-list class="min-h-0 flex-1 overflow-y-auto">
          <p v-if="!count" class="p-4 text-sm text-muted">
            No word matches “{{ query }}”.
          </p>

          <section v-for="section in sections" :key="section.group">
            <p class="blr-vocab-group">{{ section.group }}</p>
            <dl>
              <div
                v-for="item in section.items"
                :key="item.slug"
                :data-term="item.slug"
                class="blr-vocab-row"
                :data-marked="marked === item.slug"
                tabindex="-1"
              >
                <dt class="flex items-baseline gap-2">
                  <span class="text-[15px] font-semibold text-highlighted">{{ item.term }}</span>
                  <a
                    :href="item.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="blr-meta ms-auto shrink-0 hover:text-primary"
                  >{{ item.pageTitle }}</a>
                </dt>
                <dd class="mt-1 text-[15px] leading-[23px] text-muted">
                  <template v-for="(segment, index) in definitionSegments(item.slug)" :key="index">
                    <button
                      v-if="segment.slug"
                      type="button"
                      class="blr-term-mention"
                      :aria-label="`Go to ${segment.text}`"
                      @click="follow(segment.slug, item.slug)"
                    >{{ segment.text }}</button>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.blr-vocab-group {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.5rem 1rem 0.375rem;
  background: var(--ui-bg);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  border-bottom: 1px solid var(--ui-border);
}

.blr-vocab-row {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--ui-border-muted);
}

.blr-vocab-row[data-marked='true'] {
  background: color-mix(in srgb, var(--ui-color-primary-500) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--ui-color-primary-500);
}

@media (min-width: 640px) {
  .blr-vocab-group,
  .blr-vocab-row {
    padding-inline: 1.25rem;
  }
}
</style>
