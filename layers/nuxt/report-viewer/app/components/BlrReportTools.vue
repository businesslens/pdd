<script setup lang="ts">
defineProps<{ inHeader?: boolean, collapsed?: boolean }>()
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
    <UTooltip text="Search Product Model" :kbds="['meta', 'k']" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        icon="i-lucide-search"
        color="neutral"
        :variant="collapsed ? 'ghost' : 'outline'"
        size="sm"
        :label="collapsed ? undefined : 'Search'"
        :square="collapsed"
        aria-label="Search Product Model"
        class="w-full"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        @click="emit('search')"
      >
        <template v-if="!collapsed" #trailing>
          <span class="ms-auto flex items-center gap-0.5">
            <UKbd value="meta" />
            <UKbd value="K" />
          </span>
        </template>
      </UButton>
    </UTooltip>
    <UTooltip text="Vocabulary" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :id="vocabularyId"
        icon="i-lucide-book-a"
        color="neutral"
        variant="ghost"
        size="sm"
        :label="collapsed ? undefined : 'Vocabulary'"
        :square="collapsed"
        aria-label="Vocabulary"
        class="w-full"
        :class="collapsed ? 'min-h-8 justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
        @click="emit('vocabulary', vocabularyId)"
      />
    </UTooltip>
  </template>
</template>
