<script setup lang="ts">
/**
 * Every word the report uses, in one panel.
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
import { definitionSegments, vocabularySections } from '../utils/vocabulary'

/*
  The panel is shared state, not a prop: a term rendered ten components deep can
  ask for it, and the reader means the same panel every time.
*/
const { open, lookup, show } = useVocabularyPanel()

const query = ref('')
const sections = computed(() => vocabularySections(query.value))
const count = computed(() => sections.value.reduce((total, section) => total + section.items.length, 0))
const listEl = ref<HTMLElement | null>(null)
const marked = ref<string | null>(null)

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
  if (!lookup.value) return
  event.preventDefault()
  focusTerm()
}

watch(open, (isOpen) => {
  if (isOpen) return
  lookup.value = null
  marked.value = null
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Vocabulary"
    description="Every word the model and this report use, with the page that defines each one."
    :content="{ onOpenAutoFocus }"
    :ui="{ content: 'w-full max-w-md', body: 'p-0' }"
  >
    <template #body>
      <div class="flex h-full min-h-0 flex-col">
        <div class="border-b border-default p-3">
          <UInput
            v-model="query"
            icon="i-lucide-search"
            size="sm"
            variant="outline"
            class="w-full"
            placeholder="Find a word, or what it means…"
            aria-label="Filter the vocabulary"
          >
            <template v-if="query" #trailing>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="link"
                size="xs"
                aria-label="Clear the filter"
                @click="query = ''"
              />
            </template>
          </UInput>
        </div>

        <div ref="listEl" class="min-h-0 flex-1 overflow-y-auto">
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
                  <span class="text-sm font-semibold text-highlighted">{{ item.term }}</span>
                  <a
                    :href="item.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="blr-meta ms-auto shrink-0 hover:text-primary"
                  >{{ item.pageTitle }}</a>
                </dt>
                <dd class="mt-1 text-sm leading-relaxed text-muted">
                  <template v-for="(segment, index) in definitionSegments(item.slug)" :key="index">
                    <button
                      v-if="segment.slug"
                      type="button"
                      class="blr-term-mention"
                      :aria-label="`Go to ${segment.text}`"
                      @click="show(segment.slug as VocabularySlug)"
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
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
  border-bottom: 1px solid var(--ui-border);
}

.blr-vocab-row {
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--ui-border-muted);
}

.blr-vocab-row[data-marked='true'] {
  background: color-mix(in srgb, var(--ui-color-primary-500) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--ui-color-primary-500);
}
</style>
