<script setup lang="ts">
defineProps<{ inHeader?: boolean }>()
const emit = defineEmits<{ search: [], vocabulary: [originId: string] }>()
const vocabularyId = useId()
</script>

<template>
  <template v-if="inHeader">
    <UTooltip text="Search Product Model" :kbds="['meta', 'k']" ignore-non-keyboard-focus>
      <UButton
        icon="i-lucide-search"
        color="neutral"
        variant="ghost"
        aria-label="Search Product Model"
        class="min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0"
        @click="emit('search')"
      />
    </UTooltip>
    <UTooltip text="Vocabulary" :content="{ side: 'bottom' }">
      <UButton
        :id="vocabularyId"
        icon="i-lucide-book-a"
        label="Vocabulary"
        aria-label="Vocabulary"
        color="neutral"
        variant="ghost"
        class="min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0"
        :ui="{ label: 'hidden xl:inline' }"
        @click="emit('vocabulary', vocabularyId)"
      />
    </UTooltip>
  </template>
  <template v-else>
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="outline"
      size="xs"
      label="Search"
      class="hidden rounded-full sm:inline-flex"
      @click="emit('search')"
    >
      <template #trailing>
        <span class="hidden items-center gap-0.5 sm:flex">
          <UKbd value="meta" />
          <UKbd value="K" />
        </span>
      </template>
    </UButton>
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="ghost"
      size="xs"
      class="sm:hidden"
      aria-label="Search Product Model"
      @click="emit('search')"
    />
    <!-- The same offer as Docs, which is the other way out of a word you
         do not know: a bordered neutral button, in the pill of its row. -->
    <UTooltip text="Look up Product Model terms">
      <UButton
        :id="vocabularyId"
        icon="i-lucide-book-a"
        color="neutral"
        variant="outline"
        size="xs"
        label="Vocabulary"
        class="hidden rounded-full lg:inline-flex"
        @click="emit('vocabulary', vocabularyId)"
      />
    </UTooltip>
    <UTooltip text="Look up Product Model terms" class="lg:hidden">
      <UButton
        icon="i-lucide-book-a"
        color="neutral"
        variant="ghost"
        size="xs"
        :id="`${vocabularyId}-compact`"
        aria-label="Open the vocabulary"
        @click="emit('vocabulary', `${vocabularyId}-compact`)"
      />
    </UTooltip>
  </template>
</template>
