<script setup lang="ts">
defineProps<{ inHeader?: boolean, collapsed?: boolean, tool?: 'search' | 'vocabulary' }>()
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
    <UTooltip v-if="tool !== 'vocabulary'" text="Search Product Model" :kbds="['meta', 'k']" :content="{ side: 'right' }">
      <UButton
        icon="i-lucide-search"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        aria-label="Search Product Model"
        class="min-h-8 min-w-8 justify-center text-muted hover:text-highlighted"
        :class="{ 'w-full': collapsed }"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        @click="emit('search')"
      />
    </UTooltip>
    <UTooltip v-if="tool !== 'search'" text="Vocabulary" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :id="vocabularyId"
        icon="i-lucide-book-a"
        color="neutral"
        variant="ghost"
        size="sm"
        :label="collapsed ? undefined : 'Vocabulary'"
        :square="collapsed"
        aria-label="Vocabulary"
        class="w-full gap-2.5 text-sm font-normal text-muted hover:text-highlighted"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        @click="emit('vocabulary', vocabularyId)"
      />
    </UTooltip>
  </template>
</template>
