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
import { vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{
  slug: VocabularySlug
  /** What this surface calls the term, when that is not the term itself. */
  text?: string
}>()

const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const entry = computed(() => vocabularyTerm(props.slug))
const label = computed(() => props.text ?? entry.value.term)

const panel = useVocabularyPanel()

function follow(slug: VocabularySlug) {
  panel.show(slug, trigger.value?.id)
  open.value = false
}

function onCloseAutoFocus(event: Event) {
  // The panel owns focus during a handoff; the closing popover must not take it back.
  if (panel.open.value) event.preventDefault()
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ collisionPadding: 16, onCloseAutoFocus }"
    :ui="{ content: 'w-84 max-w-[calc(100vw-2rem)]' }"
  >
    <button
      ref="trigger"
      type="button"
      class="blr-term"
      :aria-label="`${label} — what ${entry.term} means`"
    >{{ label }}</button>

    <template #content>
      <BlrTermDefinition :slug="slug" @follow="follow" />
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
