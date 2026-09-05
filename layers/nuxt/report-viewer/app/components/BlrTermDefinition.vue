<script setup lang="ts">
/** The same reading in a local popover and a vocabulary entry. */
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { definitionSegments, termHref, vocabularyTerm } from '../utils/vocabulary'

const props = defineProps<{
  slug: VocabularySlug
  /** Vocabulary heading depth; a local popover uses a plain title. */
  headingLevel?: 3 | 4
}>()

const emit = defineEmits<{ follow: [slug: VocabularySlug] }>()
const entry = computed(() => vocabularyTerm(props.slug))
const segments = computed(() => definitionSegments(props.slug))
</script>

<template>
  <div class="space-y-2 p-4">
    <component :is="headingLevel ? `h${headingLevel}` : 'p'" class="text-sm font-semibold text-highlighted">{{ entry.term }}</component>
    <p class="text-sm leading-relaxed text-muted">
      <template v-for="(segment, index) in segments" :key="index">
        <button
          v-if="segment.slug"
          type="button"
          class="blr-term-mention"
          :aria-label="headingLevel ? `Go to ${segment.text}` : `${segment.text} — show definition`"
          @click="emit('follow', segment.slug)"
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
