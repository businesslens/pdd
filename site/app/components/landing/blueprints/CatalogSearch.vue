<script setup lang="ts">
import type { BlueprintCategoryEntry } from '~/utils/blueprintCategories'

/**
 * The catalog toolbar: search and, where nothing else offers categories, a
 * category select. Only a catalog large enough to need filtering renders it —
 * see `catalogShape`.
 *
 * The select stands in for the category sidebar. With a sidebar it is `lg:hidden`,
 * appearing exactly where the sidebar is gone; with one category there is
 * nothing to choose between, so it does not appear at all.

 */
const props = defineProps<{
  categories: BlueprintCategoryEntry[]
  /** Whether the category sidebar is rendered beside the listing from `lg`. */
  sidebar: boolean
}>()

const search = defineModel<string>('search', { default: '' })
const category = defineModel<string | undefined>('category', { default: undefined })

// The undefined-valued head entry is the way back to the whole catalog for a
// reader whose only category picker is this select.
const items = computed(() => [
  { label: 'All categories', value: undefined, icon: 'i-lucide-layout-grid' },
  ...props.categories.map(entry => ({
    label: entry.label,
    value: entry.value,
    icon: entry.icon
  }))
])
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <UInput
      v-model="search"
      name="blueprint-search"
      icon="i-lucide-search"
      placeholder="Search Blueprints…"
      size="xl"
      class="w-full sm:max-w-xl sm:flex-1"
      :ui="{ base: 'rounded-xl' }"
      aria-label="Search Blueprints"
    >
      <template v-if="search" #trailing>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="link"
          size="sm"
          aria-label="Clear search"
          @click="search = ''"
        />
      </template>
    </UInput>
    <USelectMenu
      v-if="categories.length > 1"
      v-model="category"
      :items="items"
      value-key="value"
      :search-input="false"
      placeholder="All categories"
      aria-label="Filter by category"
      size="xl"
      class="w-full sm:w-56"
      :class="sidebar ? 'lg:hidden' : undefined"
      :ui="{ base: 'rounded-xl' }"
    />
  </div>
</template>
