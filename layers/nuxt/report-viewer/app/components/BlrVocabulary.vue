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
 * one reveals its owning page and marks the term. Back restores the previous
 * reading, including which pages were expanded.
 */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { vocabularyMatches, vocabularyPages, vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{ context?: VocabularySlug }>()

/*
  The panel is shared state, not a prop: a term rendered ten components deep can
  ask for it, and the reader means the same panel every time.
*/
const { open, lookup, returnFocusId, show } = useVocabularyPanel()

const query = ref('')
const searching = computed(() => Boolean(query.value.trim()))
const items = computed(() => vocabularyMatches(query.value))
const pages = computed(() => vocabularyPages(items.value))
const listEl = ref<HTMLElement | null>(null)
const searchInput = ref<{ inputRef: HTMLInputElement | null } | null>(null)
const marked = ref<VocabularySlug | null>(null)
const expandedPages = ref<string[]>([])
const pageId = useId()

function revealPage(page: string) {
  if (!expandedPages.value.includes(page)) expandedPages.value.push(page)
}

function togglePage(page: string) {
  expandedPages.value = expandedPages.value.includes(page)
    ? expandedPages.value.filter(current => current !== page)
    : [...expandedPages.value, page]
}

function contextPage() {
  return vocabularyTerm(props.context ?? 'product-model').page
}

interface VocabularyVisit {
  query: string
  marked: VocabularySlug | null
  scrollTop: number
  source: VocabularySlug
  expandedPages: string[]
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
    source,
    expandedPages: [...expandedPages.value]
  })
  show(slug)
}

async function goBack() {
  const previous = history.value.pop()
  if (!previous) return
  lookup.value = null
  query.value = previous.query
  marked.value = previous.marked
  expandedPages.value = previous.expandedPages
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
  revealPage(vocabularyTerm(request.slug).page)
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
  } else {
    listEl.value?.querySelector<HTMLElement>(`[data-vocabulary-page="${contextPage()}"]`)
      ?.scrollIntoView({ block: 'start' })
    if (window.matchMedia('(min-width: 640px) and (pointer: fine)').matches) {
      event.preventDefault()
      searchInput.value?.inputRef?.focus({ preventScroll: true })
    }
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
  if (isOpen) {
    // Each opening starts with the reading the reader came from. A named
    // lookup wins; a header opening must not inherit a search from another page.
    expandedPages.value = [lookup.value ? vocabularyTerm(lookup.value.slug).page : contextPage()]
    if (!lookup.value) {
      query.value = ''
      marked.value = null
    }
    return
  }
  lookup.value = null
  marked.value = null
  history.value = []
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Vocabulary"
    description="Explore terms by page, or search for a word."
    :content="{ onOpenAutoFocus, onCloseAutoFocus }"
    :ui="{
      content: 'w-full max-w-full sm:max-w-[480px] lg:max-w-[560px] xl:max-w-[640px] 2xl:max-w-[720px]',
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
          <p v-if="!items.length" class="p-4 text-sm text-muted">
            No word matches “{{ query }}”.
          </p>

          <div v-if="searching" class="space-y-3 p-4 sm:px-5">
            <article
              v-for="item in items"
              :key="item.slug"
              :data-term="item.slug"
              class="blr-vocab-row"
              :data-marked="marked === item.slug"
              tabindex="-1"
            >
              <BlrTermDefinition :slug="item.slug" :heading-level="3" @follow="follow($event, item.slug)" />
            </article>
          </div>
          <section
            v-for="page in searching ? [] : pages"
            :key="page.page"
            :data-vocabulary-page="page.page"
            class="blr-vocab-page"
          >
            <h3 class="sticky top-0 z-10 bg-default">
              <button
                type="button"
                class="flex min-h-12 w-full items-center gap-2 px-4 py-3 text-start text-highlighted hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-5"
                :aria-expanded="expandedPages.includes(page.page)"
                :aria-controls="`${pageId}-${page.page}`"
                @click="togglePage(page.page)"
              >
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 shrink-0 text-dimmed"
                  :class="{ 'rotate-90': expandedPages.includes(page.page) }"
                />
                <span class="text-[15px] font-semibold">{{ page.title }}</span>
                <span class="ms-auto text-xs text-dimmed">{{ page.items.length }} {{ page.items.length === 1 ? 'term' : 'terms' }}</span>
              </button>
            </h3>
            <div
              v-show="expandedPages.includes(page.page)"
              :id="`${pageId}-${page.page}`"
              class="ms-5 me-4 mb-4 space-y-3 border-s border-default ps-3 sm:ms-6 sm:me-5 sm:ps-4"
            >
              <article
                v-for="item in page.items"
                :key="item.slug"
                :data-term="item.slug"
                class="blr-vocab-row"
                :data-marked="marked === item.slug"
                tabindex="-1"
              >
                <BlrTermDefinition :slug="item.slug" :heading-level="4" @follow="follow($event, item.slug)" />
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.blr-vocab-row {
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
  background: var(--ui-bg);
}

.blr-vocab-page {
  border-bottom: 1px solid var(--ui-border-muted);
}

.blr-vocab-row[data-marked='true'] {
  background: color-mix(in srgb, var(--ui-color-primary-500) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--ui-color-primary-500);
}
</style>
