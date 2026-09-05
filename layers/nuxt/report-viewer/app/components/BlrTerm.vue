<script setup lang="ts">
/**
 * A word the report renders, answerable where it stands.
 *
 * The reader's question is local — they are looking at "Arcs 4" and do not know
 * what an arc is — so the answer is local too, and costs no row until it is
 * asked for. A dotted underline is the whole of the chrome; the popover holds
 * one line and a way out to the page that argues it.
 *
 * It opens on click rather than hover so a touch reader and a keyboard reader
 * both have it, and it never replaces the word it explains: the surface still
 * reads as a heading or a field label with the term inside it.
 *
 * A definition that leans on another word makes that word followable. Following
 * one opens the vocabulary panel rather than swapping this popover's contents:
 * the popover answers for the word the reader is *pointing at*, and once they
 * are two words deep they have left the page's sentence for the list that was
 * built to be read down.
 */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { definitionSegments, termHref, vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{
  slug: VocabularySlug
  /** What this surface calls the term, when that is not the term itself. */
  text?: string
}>()

const open = ref(false)
const entry = computed(() => vocabularyTerm(props.slug))
const label = computed(() => props.text ?? entry.value.term)
const segments = computed(() => definitionSegments(props.slug))

const panel = useVocabularyPanel()

function follow(slug: VocabularySlug) {
  open.value = false
  panel.show(slug)
}
</script>

<template>
  <UPopover v-model:open="open" :ui="{ content: 'w-72' }">
    <button
      type="button"
      class="blr-term"
      :aria-label="`${label} — what ${entry.term} means`"
    >{{ label }}</button>

    <template #content>
      <div class="space-y-2 p-3">
        <p class="text-sm font-semibold text-highlighted">{{ entry.term }}</p>
        <p class="text-sm leading-relaxed text-muted">
          <template v-for="(segment, index) in segments" :key="index">
            <button
              v-if="segment.slug"
              type="button"
              class="blr-term-mention"
              :aria-label="`${segment.text} — show definition`"
              @click="follow(segment.slug)"
            >{{ segment.text }}</button>
            <template v-else>{{ segment.text }}</template>
          </template>
        </p>
        <UButton
          :to="termHref(slug)"
          external
          target="_blank"
          rel="noopener noreferrer"
          icon="i-lucide-book-open"
          color="neutral"
          variant="link"
          size="xs"
          class="-mx-1.5"
          :label="`Read more in ${entry.pageTitle}`"
        />
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/*
  The affordance rides under the word rather than beside it: an icon per label
  would put a mark on every heading and fact on the page, which is the chrome
  this report spends its budget avoiding.
*/
.blr-term {
  text-align: start;
  border-bottom: 1px dotted var(--ui-border-accented);
  cursor: help;
}

.blr-term:hover,
.blr-term:focus-visible {
  border-bottom-color: var(--ui-color-primary-500);
  border-bottom-style: solid;
  color: var(--ui-text-highlighted);
}

.blr-term:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 3px;
}
</style>
