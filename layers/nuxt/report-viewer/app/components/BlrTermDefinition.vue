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
   * keeps the term's own anchor but drops the words: "Read more in Interfaces"
   * under all ten of a page's terms is the page's name, ten times.
   */
  iconLink?: boolean
  /** Root-relative docs prefix for a host that reads documentation in this tab. */
  docsBase?: string
}>()

const emit = defineEmits<{ follow: [slug: VocabularySlug], read: [event: MouseEvent] }>()
const entry = computed(() => vocabularyTerm(props.slug))
const segments = computed(() => definitionSegments(props.slug))
/* In the panel a mention navigates; in a popover it reveals another reading. */
const navigates = computed(() => Boolean(props.headingLevel) || Boolean(props.lead))
/* An icon says where it goes to a pointer; this says it to everything else. */
const documentation = computed(() => `Read more in ${entry.value.pageTitle}`)
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
    <UButton
      v-if="!iconLink"
      v-bind="documentationLink"
      icon="i-lucide-book-open"
      color="neutral"
      variant="link"
      size="xs"
      class="-mx-1.5"
      :label="documentation"
      @click="emit('read', $event)"
    />
  </div>
</template>
