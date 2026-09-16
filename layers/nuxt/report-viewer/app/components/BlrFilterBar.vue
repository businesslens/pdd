<script setup lang="ts">
/**
 * The filter area of a surface: the controls that narrow it, above what they
 * narrowed it to.
 *
 * One control per axis, inline on wider screens and in a bottom sheet on
 * phones. The selected values stay above the reading at every width.
 *
 * A control says how many values it holds, never which: the chosen values sit
 * on the second row, so the control line stays a fixed, scannable width however
 * much is selected, and every value keeps its own way out.
 */
import type { ReportInterface } from 'businesslens/report'
import type { ActingSide, EntityFacet, ReportResourceKind } from '../utils/reportWorkspace'

export interface BlrFilterChip {
  /** Stable identity for removal; the surface decides what it means. */
  key: string
  label: string
  value: string
  kind?: ReportResourceKind
  facet?: EntityFacet | null
  acts?: ActingSide | null
  interfaceType?: ReportInterface['type'] | null
}

withDefaults(defineProps<{
  chips: BlrFilterChip[]
  filtersOffered?: boolean
}>(), { filtersOffered: true })
const emit = defineEmits<{ remove: [key: string], clear: [] }>()
const sheetOpen = ref(false)
let inlineFilters: MediaQueryList | undefined
function closeSheetOnWideScreen() {
  if (inlineFilters?.matches) sheetOpen.value = false
}
onMounted(() => {
  inlineFilters = window.matchMedia('(min-width: 640px)')
  inlineFilters.addEventListener('change', closeSheetOnWideScreen)
})
onBeforeUnmount(() => inlineFilters?.removeEventListener('change', closeSheetOnWideScreen))
</script>

<template>
  <div data-blr-filter-bar class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <UDrawer
        v-if="filtersOffered || chips.length"
        v-model:open="sheetOpen"
        title="Filters"
        close
        :ui="{
          content: 'blr-report-shell max-h-[85dvh]',
          container: 'min-h-0',
          body: 'overflow-y-auto',
          footer: 'flex-row pb-[max(1rem,env(safe-area-inset-bottom))]'
        }"
      >
        <UButton
          icon="i-lucide-funnel"
          color="neutral"
          variant="outline"
          size="md"
          class="sm:hidden"
          data-mobile-filters
        >
          Filters
          <span v-if="chips.length" class="blr-meta">{{ chips.length }}</span>
        </UButton>
        <template #body>
          <div class="flex flex-col gap-3" data-mobile-filter-controls>
            <slot :mobile="true" />
          </div>
        </template>
        <template #footer>
          <UButton
            color="neutral"
            variant="outline"
            label="Clear all"
            size="md"
            :disabled="!chips.length"
            @click="emit('clear')"
          />
          <UButton label="Show results" size="md" class="flex-1 justify-center" @click="sheetOpen = false" />
        </template>
      </UDrawer>
      <div class="hidden sm:contents">
        <slot :mobile="false" />
      </div>
      <UButton
        v-if="chips.length"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        label="Clear"
        aria-label="Clear every filter"
        class="hidden sm:inline-flex"
        @click="emit('clear')"
      />
      <!-- What is not a filter but belongs on the same line: how the set is
           drawn, and how densely. It sits at the end, clear of the controls. -->
      <div v-if="$slots.end" class="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <slot name="end" />
      </div>
    </div>

    <!-- What the controls narrowed it to. Absent rather than empty. -->
    <div v-if="chips.length" class="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible">
      <button
        v-for="chip in chips"
        :key="chip.key"
        type="button"
        class="blr-chip"
        :title="`Clear this ${chip.label.toLowerCase()} filter`"
        :aria-label="`Remove ${chip.label}: ${chip.value}`"
        @click="emit('remove', chip.key)"
      >
        <BlrKind
          v-if="chip.kind"
          :kind="chip.kind"
          :interface-type="chip.interfaceType"
          :facet="chip.facet"
          :acts="chip.acts"
          :labelled="false"
          size="xs"
        />
        <span class="shrink-0 text-dimmed">{{ chip.label }}</span>
        <span class="min-w-0 truncate font-medium text-highlighted">{{ chip.value }}</span>
        <UIcon name="i-lucide-x" class="size-3 shrink-0 text-dimmed" />
      </button>
    </div>
  </div>
</template>
