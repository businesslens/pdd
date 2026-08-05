<script setup lang="ts">
import type { ReportWidth } from '../utils/reportDesigns'

/**
 * Audition control for the report designs, built to sit in the theme lab bar.
 *
 * Shift+← / Shift+→ steps through the designs so a reviewer can flick between
 * them against the same model without reaching for the mouse.
 */
const { designs, widths, active, widthChoice, selectDesign, selectWidth, step } = useBusinessLensReportDesign()

defineShortcuts({
  shift_arrowright: () => step(1),
  shift_arrowleft: () => step(-1)
})

const widthItems = widths.map(option => ({ value: option.id, label: option.label }))

const widthModel = computed<string>({
  get: () => widthChoice.value,
  set: value => selectWidth(value as ReportWidth | 'auto')
})
</script>

<template>
  <div
    data-report-design-row
    class="flex h-(--businesslens-theme-lab-row-height) items-center gap-3 overflow-x-auto px-3 sm:px-4"
  >
    <span class="blr-field hidden shrink-0 items-center gap-1.5 sm:inline-flex">
      <UIcon name="i-lucide-layout-template" class="size-3.5" />
      Report
    </span>

    <div role="group" aria-label="Report design" class="flex shrink-0 items-center gap-1">
      <UButton
        v-for="design in designs"
        :key="design.id"
        :icon="design.icon"
        :label="design.name"
        size="xs"
        :color="design.id === active.id ? 'primary' : 'neutral'"
        :variant="design.id === active.id ? 'soft' : 'ghost'"
        :aria-pressed="design.id === active.id"
        :title="`${design.name} — ${design.tagline}`"
        class="rounded-full"
        @click="selectDesign(design.id)"
      />
    </div>

    <div class="ms-auto flex shrink-0 items-center gap-2 ps-2">
      <span class="blr-field hidden md:inline">Width</span>
      <UTabs
        v-model="widthModel"
        :items="widthItems"
        :content="false"
        color="neutral"
        size="xs"
        aria-label="Report width"
      />
    </div>
  </div>
</template>
