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
 * A section's own term — Experience, on Experiences — is its meaning, not
 * a row inside it: the head states it once, and the rows beneath are the words
 * grouped beside it. Product also carries the Model overview terms. A section
 * whose only term is its lead has nothing to disclose, so it carries no control.
 *
 * A word inside a definition that is itself defined is followable, and following
 * one reveals its browsing section and marks the term. Back restores the previous
 * reading, including which pages were expanded.
 */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { VOCABULARY_PAGES, vocabularyMatches, vocabularySection, vocabularyTerm } from '../utils/vocabulary'
import type { ReportResourceKind } from '../utils/reportWorkspace'

const pageKinds: Partial<Record<string, ReportResourceKind>> = {
  product: 'product',
  entities: 'entity',
  interfaces: 'interface',
  experiences: 'experience',
  screens: 'screen',
  domains: 'domain',
  capabilities: 'capability',
  journeys: 'journey',
  'business-rules': 'rule'
}

const props = defineProps<{
  context?: VocabularySlug
  /** Root-relative docs prefix. Omit to open public documentation in a new tab. */
  docsBase?: string
  /** Stable state namespace when the host also embeds a report's own panel. */
  stateKey?: string
}>()

/*
  The panel is shared state, not a prop: a term rendered ten components deep can
  ask for it, and the reader means the same panel every time.
*/
const { open, lookup, returnFocusId, show } = useVocabularyPanel(props.stateKey)

const query = ref('')
const searching = computed(() => Boolean(query.value.trim()))
const items = computed(() => vocabularyMatches(query.value))
const listEl = ref<HTMLElement | null>(null)
const searchInput = ref<{ inputRef: HTMLInputElement | null } | null>(null)
const marked = ref<VocabularySlug | null>(null)
const expandedPages = ref<string[]>([])
const pageId = useId()
let leavingForDocs = false

function readDocumentation(event: MouseEvent) {
  if (!props.docsBase || event.defaultPrevented || event.button !== 0
    || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  leavingForDocs = true
  open.value = false
}

function revealPage(page: string) {
  if (!expandedPages.value.includes(page)) expandedPages.value.push(page)
}

/* A section owning nothing but its lead has nothing to hide, and reads as open. */
function opened(page: VocabularyPage) {
  return !page.items.length || expandedPages.value.includes(page.page)
}

function togglePage(page: string) {
  expandedPages.value = expandedPages.value.includes(page)
    ? expandedPages.value.filter(current => current !== page)
    : [...expandedPages.value, page]
}

function contextPage() {
  return vocabularySection(props.context ?? 'product')
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
  revealPage(vocabularySection(request.slug))
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
    const row = listEl.value?.querySelector<HTMLElement>(`[data-term="${props.context ?? 'product'}"]`)
    row?.scrollIntoView({ block: 'start' })
    // A nested term must start below its sticky section heading. Measure the
    // overlap so wrapped headings and rows near the list's end also work.
    const heading = row?.closest('[data-vocabulary-page]')?.querySelector('h3')
    if (row && heading && !heading.contains(row) && listEl.value) {
      const overlap = heading.getBoundingClientRect().bottom - row.getBoundingClientRect().top
      if (overlap > 0) listEl.value.scrollTop -= overlap
    }
    if (window.matchMedia('(min-width: 640px) and (pointer: fine)').matches) {
      event.preventDefault()
      searchInput.value?.inputRef?.focus({ preventScroll: true })
    }
  }
}

function onCloseAutoFocus(event: Event) {
  const origin = returnFocusId.value ? document.getElementById(returnFocusId.value) : null
  returnFocusId.value = null
  if (leavingForDocs) {
    leavingForDocs = false
    event.preventDefault()
    return
  }
  if (!origin) return
  event.preventDefault()
  origin.focus({ preventScroll: true })
}

watch(open, (isOpen) => {
  if (isOpen) {
    // Each opening starts with the reading the reader came from. A named
    // lookup wins; a header opening must not inherit a search from another page.
    expandedPages.value = [lookup.value ? vocabularySection(lookup.value.slug) : contextPage()]
    if (!lookup.value) {
      query.value = ''
      marked.value = null
    }
    return
  }
  lookup.value = null
  marked.value = null
  history.value = []
}, { immediate: true })

// A host change must not carry an open docs panel into a report, or vice versa.
onBeforeUnmount(() => {
  open.value = false
  lookup.value = null
  returnFocusId.value = null
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Vocabulary"
    description="Explore terms by category, or search for a word."
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

          <div v-if="searching">
            <article
              v-for="item in items"
              :key="item.slug"
              :data-term="item.slug"
              class="blr-vocab-row px-4 py-3 first:border-t-0 sm:px-5"
              :data-marked="marked === item.slug"
              tabindex="-1"
            >
              <BlrTermDefinition
                :slug="item.slug"
                :heading-level="3"
                :docs-base="docsBase"
                @follow="follow($event, item.slug)"
                @read="readDocumentation"
              />
            </article>
          </div>
          <section
            v-for="page in searching ? [] : VOCABULARY_PAGES"
            :key="page.page"
            :data-vocabulary-page="page.page"
          >
            <h3 class="sticky top-0 z-10 bg-default">
              <component
                :is="page.items.length ? 'button' : 'div'"
                v-bind="page.items.length
                  ? {
                    type: 'button',
                    'aria-expanded': expandedPages.includes(page.page),
                    'aria-controls': `${pageId}-${page.page}`,
                    onClick: () => togglePage(page.page)
                  }
                  : { tabindex: -1 }"
                :data-term="page.lead.slug"
                :data-marked="marked === page.lead.slug"
                class="blr-vocab-head flex min-h-12 w-full items-center gap-2 border-b border-default px-4 py-3 text-start text-highlighted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-5"
                :class="[opened(page) ? 'bg-accented' : 'bg-muted', page.items.length ? 'hover:bg-accented' : '']"
              >
                <UIcon
                  v-if="page.items.length"
                  name="i-lucide-chevron-right"
                  class="size-4 shrink-0 text-dimmed"
                  :class="{ 'rotate-90': opened(page) }"
                />
                <!-- One list, one column: a section with nothing to disclose keeps the type icons aligned. -->
                <span v-else aria-hidden="true" class="size-4 shrink-0" />
                <span aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center">
                  <BlrKind v-if="pageKinds[page.page]" :kind="pageKinds[page.page]!" :labelled="false" size="xs" />
                  <BlrReferenceIcon v-else-if="page.page === 'references'" class="size-4" />
                </span>
                <span class="text-[15px] font-semibold">{{ page.title }}</span>
                <span v-if="page.items.length" class="ms-auto text-xs text-dimmed">
                  {{ page.items.length }} more {{ page.items.length === 1 ? 'term' : 'terms' }}
                </span>
              </component>
            </h3>
            <div v-show="opened(page)" :id="`${pageId}-${page.page}`" class="pb-2">
              <BlrTermDefinition
                :slug="page.lead.slug"
                :docs-base="docsBase"
                lead
                class="ps-10 pe-4 py-3 sm:ps-11 sm:pe-5"
                @follow="follow($event, page.lead.slug)"
                @read="readDocumentation"
              />
              <article
                v-for="item in page.items"
                :key="item.slug"
                :data-term="item.slug"
                class="blr-vocab-row ps-10 pe-4 py-3 sm:ps-11 sm:pe-5"
                :data-marked="marked === item.slug"
                tabindex="-1"
              >
                <BlrTermDefinition
                  :slug="item.slug"
                  :docs-base="docsBase"
                  :heading-level="4"
                  icon-link
                  @follow="follow($event, item.slug)"
                  @read="readDocumentation"
                />
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
/* One rule between words, so nothing encloses a meaning two lines long. */
.blr-vocab-row {
  border-top: 1px solid var(--ui-border-muted);
}

/* A followed term is marked where it is read: a row, or the head that states it. */
.blr-vocab-row[data-marked='true'],
.blr-vocab-head[data-marked='true'] {
  background: color-mix(in srgb, var(--ui-color-primary-500) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--ui-color-primary-500);
}
</style>
