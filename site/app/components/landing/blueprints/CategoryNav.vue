<script setup lang="ts">
import type { BlueprintCategoryEntry } from '~/utils/blueprintCategories'

/**
 * The mock's category sidebar: a labelled stack of bordered rows with icons
 * and count pills. The selected row carries a primary-colored left edge so
 * the active filter reads at a glance. Selection is a filter, not
 * navigation, so these are toggles — pressing the active row again returns
 * to the whole catalog.
 */
const props = defineProps<{
  categories: BlueprintCategoryEntry[]
}>()

const category = defineModel<string | undefined>('category', { default: undefined })

const total = computed(() => props.categories.reduce((sum, entry) => sum + entry.count, 0))

function toggle(value: string | undefined) {
  category.value = category.value === value ? undefined : value
}
</script>

<template>
  <nav aria-label="Blueprint categories">
    <p class="font-mono text-xs font-medium uppercase tracking-widest text-toned">
      Categories
    </p>
    <ul class="mt-3 flex flex-col gap-2">
      <li>
        <button
          type="button"
          class="relative flex w-full items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2 text-sm transition-colors"
          :class="category === undefined
            ? 'border-primary/40 bg-primary/5 text-highlighted'
            : 'border-default bg-default text-default hover:bg-elevated/60'"
          :aria-pressed="category === undefined"
          @click="category = undefined"
        >
          <span v-if="category === undefined" class="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden="true" />
          <UIcon name="i-lucide-layout-grid" class="size-4 shrink-0 text-toned" />
          <span class="truncate font-medium">All Blueprints</span>
          <span class="ms-auto rounded-full bg-accented/40 px-1.5 py-0.5 text-xs tabular-nums text-dimmed">{{ total }}</span>
        </button>
      </li>
      <li v-for="entry in categories" :key="entry.value">
        <button
          type="button"
          class="relative flex w-full items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2 text-sm transition-colors"
          :class="category === entry.value
            ? 'border-primary/40 bg-primary/5 text-highlighted'
            : 'border-default bg-default text-default hover:bg-elevated/60'"
          :aria-pressed="category === entry.value"
          @click="toggle(entry.value)"
        >
          <span v-if="category === entry.value" class="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden="true" />
          <UIcon :name="entry.icon" class="size-4 shrink-0" :class="entry.tone.ink" />
          <span class="truncate font-medium">{{ entry.label }}</span>
          <span class="ms-auto rounded-full bg-accented/40 px-1.5 py-0.5 text-xs tabular-nums text-dimmed">{{ entry.count }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
