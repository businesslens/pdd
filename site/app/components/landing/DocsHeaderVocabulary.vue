<script setup lang="ts">
const { vocabulary: { show } } = useDocsTools()
const triggerId = useId()
</script>

<template>
  <UTooltip text="Vocabulary" :content="{ side: 'bottom' }">
    <UButton
      :id="triggerId"
      icon="i-lucide-book-a"
      label="Vocabulary"
      aria-label="Vocabulary"
      color="neutral"
      variant="ghost"
      class="min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0"
      :ui="{ label: 'hidden xl:inline' }"
      @click="show(undefined, triggerId)"
    />
  </UTooltip>
</template>
