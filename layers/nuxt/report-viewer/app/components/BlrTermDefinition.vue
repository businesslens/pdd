<script setup lang="ts">
/** The same reading in a local popover and a vocabulary entry. */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { definitionSegments, termHref, vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{
  slug: VocabularySlug
  /** Vocabulary heading depth; a local popover uses a plain title. */
  headingLevel?: 3 | 4
  /**
   * The vocabulary section head already names this term, so the reading here is
   * the meaning and the way out — never the word a second time.
   */
  lead?: boolean
  /**
   * Inside a section, where the head has already named the page. The way out
   * keeps the term's own anchor but drops the words: the same sentence under
   * all ten of a page's terms is one sentence, ten times.
   */
  iconLink?: boolean
  /** Root-relative docs prefix for a host that reads documentation in this tab. */
  docsBase?: string
}>()

const emit = defineEmits<{ follow: [slug: VocabularySlug], read: [event: MouseEvent], hide: [] }>()
const entry = computed(() => vocabularyTerm(props.slug))
const segments = computed(() => definitionSegments(props.slug))
/* Only a tooltip can put itself away; a panel row was never a tooltip. */
const inPopover = computed(() => !props.headingLevel && !props.lead)
/* In the panel a mention navigates; in a popover it reveals another reading. */
const navigates = computed(() => !inPopover.value)
/*
  The destination, not the page: which documentation page a term is argued on is
  the documentation's business, and naming it here spends the row on a word the
  reader did not ask for. An icon says where it goes to a pointer; this says it
  to everything else, and the icon-only form adds the term it lands on.
*/
const documentation = 'Read more in docs'
const documentationLink = computed(() => ({
  to: termHref(props.slug, props.docsBase),
  external: !props.docsBase,
  target: props.docsBase ? undefined : '_blank',
  rel: props.docsBase ? undefined : 'noopener noreferrer'
}))
</script>

<template>
  <div class="space-y-2" :class="headingLevel || lead ? '' : 'p-4'">
    <div v-if="!lead" class="flex items-start gap-2">
      <component
        :is="headingLevel ? `h${headingLevel}` : 'p'"
        class="text-sm font-semibold text-highlighted"
      >{{ entry.term }}</component>
      <UButton
        v-if="iconLink"
        v-bind="documentationLink"
        icon="i-lucide-book-open"
        color="neutral"
        variant="link"
        size="xs"
        class="-my-1 -me-1.5 ms-auto shrink-0"
        :aria-label="`${documentation}, at ${entry.term}`"
        :title="documentation"
        @click="emit('read', $event)"
      />
    </div>
    <p class="text-sm leading-relaxed text-muted">
      <template v-for="(segment, index) in segments" :key="index">
        <button
          v-if="segment.slug"
          type="button"
          class="blr-term-mention"
          :aria-label="navigates ? `Go to ${segment.text}` : `${segment.text} — show definition`"
          @click="emit('follow', segment.slug)"
        >{{ segment.text }}</button>
        <template v-else>{{ segment.text }}</template>
      </template>
    </p>
    <!--
      In a tooltip the two are a matched pair of pills — go and read, or put
      these away — and they sit on the text's own edges. In the panel the way out
      is a trailing reference rather than an offered action, so it stays the
      quiet link it was, pulled back into line by its own padding. They wrap
      rather than compete if a label ever outgrows the row.
    -->
    <div
      v-if="!iconLink"
      class="flex flex-wrap items-center gap-x-2 gap-y-1"
      :class="inPopover ? '' : '-mx-1.5'"
    >
      <UButton
        v-bind="documentationLink"
        icon="i-lucide-book-open"
        color="neutral"
        :variant="inPopover ? 'outline' : 'link'"
        size="xs"
        :ui="inPopover ? { leadingIcon: 'size-3.5' } : undefined"
        :class="inPopover ? 'shrink-0 rounded-full' : ''"
        :label="documentation"
        @click="emit('read', $event)"
      />
      <!--
        The exit stands where the annoyance is, and it is bordered because it is
        a command, not a link: the row reads as "go and read" beside "do this",
        which is what the two halves actually are. The report's own quiet
        controls are this same pill, so it is already the word for "pressable".
      -->
      <UButton
        v-if="inPopover"
        icon="i-lucide-eye-off"
        label="Hide tooltips"
        color="neutral"
        variant="outline"
        size="xs"
        :ui="{ leadingIcon: 'size-3.5' }"
        class="ms-auto shrink-0 rounded-full"
        title="Hide tooltips in the report"
        @click="emit('hide')"
      />
    </div>
  </div>
</template>
