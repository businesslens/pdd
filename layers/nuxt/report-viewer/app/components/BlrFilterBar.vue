<script setup lang="ts">
/**
 * The filter area of a surface: the controls that narrow it, above what they
 * narrowed it to.
 *
 * One control per axis, not one popover holding four. A reader should see which
 * axes exist without opening anything, and read the state of each without
 * remembering what they picked — a single `Filter` button hid both, and hid
 * them behind a click.
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

defineProps<{ chips: BlrFilterChip[] }>()
const emit = defineEmits<{ remove: [key: string], clear: [] }>()
</script>

<template>
  <div data-blr-filter-bar class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <slot />
      <UButton
        v-if="chips.length"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        label="Clear"
        aria-label="Clear every filter"
        @click="emit('clear')"
      />
    </div>

    <!-- What the controls narrowed it to. Absent rather than empty. -->
    <div v-if="chips.length" class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="chip in chips"
        :key="chip.key"
        type="button"
        class="blr-chip"
        :title="`Clear this ${chip.label.toLowerCase()} filter`"
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
