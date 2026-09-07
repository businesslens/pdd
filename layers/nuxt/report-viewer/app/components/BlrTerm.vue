<script setup lang="ts">
/**
 * A word the report renders, answerable where it stands.
 *
 * The reader's question is local — they are looking at "Arcs 4" and do not know
 * what an arc is — so the answer is local too, and costs no row until it is
 * asked for. A question mark identifies the definition action; the popover
 * holds the answer and a way out to the page that argues it.
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
 *
 * A reader who has finished learning turns the tooltips off, here or in the
 * panel, and the word becomes the plain text the surface always read as. Beside
 * a label that already names the term, nothing is left at all.
 */
import { h } from 'vue'
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{
  slug: VocabularySlug
  /** What this surface calls the term, when that is not the term itself. */
  text?: string
  /** Beside a navigable label, the definition gets its own sibling button. */
  iconOnly?: boolean
}>()

const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const plain = ref<HTMLElement | null>(null)
const entry = computed(() => vocabularyTerm(props.slug))
const label = computed(() => props.text ?? entry.value.term)

const panel = useVocabularyPanel()
const { shown, hide, restore } = useTooltips()
const toast = useToast()
/* Set between the reader asking and the popover finishing its close. */
let hiding = false

function follow(slug: VocabularySlug) {
  panel.show(slug, trigger.value?.id)
  open.value = false
}

/**
 * Hiding from inside the popover destroys the button the popover belongs to, so
 * the request is recorded and acted on once that popover has closed. Flipping
 * it on the click instead unmounts the trigger mid-close, and focus lands on
 * the document body with the reader's place on the page lost.
 */
function requestHide() {
  hiding = true
  open.value = false
}

function onCloseAutoFocus(event: Event) {
  // The panel owns focus during a handoff; the closing popover must not take it back.
  if (panel.open.value) event.preventDefault()
  if (!hiding) return
  hiding = false
  // There is no trigger to return to: it goes with the tooltip.
  event.preventDefault()
  void completeHide()
}

/* The word stays where it stood, so focus goes to it rather than to nothing. */
async function completeHide() {
  const anchor = trigger.value?.parentElement ?? null
  hide()
  await nextTick()
  const landing = plain.value ?? anchor
  if (landing) {
    if (landing !== plain.value) landing.tabIndex = -1
    landing.focus({ preventScroll: true })
  }
  /*
    The sentence names the way back, and the name is the way: a reader who has
    just lost an affordance should not have to go and find the panel that
    restores it. The word is rendered rather than written, because the toast is
    mounted outside this component and a slot cannot reach it.
  */
  let raised: string | number | undefined
  const opened = toast.add({
    title: 'Tooltips hidden',
    description: () => h('span', [
      'Turn them back on in ',
      h('button', {
        type: 'button',
        class: 'blr-toast-link',
        onClick: () => {
          panel.show()
          if (raised !== undefined) toast.remove(raised)
        }
      }, 'Vocabulary'),
      '.'
    ]),
    icon: 'i-lucide-eye-off',
    color: 'neutral',
    actions: [{ label: 'Undo', color: 'neutral', variant: 'outline', onClick: () => restore() }]
  })
  raised = opened.id
}
</script>

<template>
  <!-- Tooltips off: the word again, and beside an icon-only mark, nothing. -->
  <span
    v-if="!shown && !iconOnly"
    ref="plain"
    tabindex="-1"
    class="blr-term-plain"
  >{{ label }}</span>

  <UPopover
    v-else-if="shown"
    v-model:open="open"
    :content="{ collisionPadding: 16, onCloseAutoFocus }"
    :ui="{ content: 'w-84 max-w-[calc(100vw-2rem)]' }"
  >
    <button
      ref="trigger"
      type="button"
      class="blr-term"
      :class="{ 'blr-term--icon-only': iconOnly }"
      :aria-label="`${label} — what ${entry.term} means`"
    >
      <span v-if="!iconOnly" class="blr-term-label">{{ label }}</span>
      <UIcon name="i-lucide-circle-question-mark" class="blr-term-mark size-3.5 shrink-0" aria-hidden="true" />
    </button>

    <template #content>
      <BlrTermDefinition :slug="slug" @follow="follow" @hide="requestHide" />
    </template>
  </UPopover>
</template>

<style scoped>
/*
  The word, keeping whatever truncation the surface asked of the button — and
  its casing. A button carries `text-transform: none` from the user agent, so a
  breadcrumb's uppercase eyebrow never reached the term while it was one. The
  span it becomes would inherit it, and turn Entities into ENTITIES the moment
  the tooltips went away.
*/
.blr-term-plain {
  display: inline-block;
  min-width: 0;
  max-width: 100%;
  text-transform: none;
}

.blr-term {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  max-width: 100%;
  min-height: 1.5rem;
  text-align: start;
  vertical-align: middle;
  cursor: pointer;
}

.blr-term-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blr-term-mark {
  color: var(--ui-text-muted);
}

.blr-term--icon-only {
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
}

.blr-term:hover,
.blr-term:focus-visible {
  color: var(--ui-text-highlighted);
}

.blr-term:hover .blr-term-mark,
.blr-term:focus-visible .blr-term-mark {
  color: var(--ui-primary);
}

.blr-term:focus-visible {
  outline: 2px solid var(--ui-text-highlighted);
  outline-offset: 3px;
}

@media (pointer: coarse) {
  .blr-term {
    min-height: 2rem;
  }

  .blr-term--icon-only {
    width: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
