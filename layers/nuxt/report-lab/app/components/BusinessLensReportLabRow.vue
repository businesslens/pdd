<script setup lang="ts">
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
</script>

<template>
  <div
    data-report-design-row
    class="flex h-(--businesslens-theme-lab-row-height) items-center gap-3 overflow-x-auto px-3 sm:px-4"
  >
    <span class="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-toned uppercase sm:inline-flex">
      <UIcon name="i-lucide-layout-template" class="size-3.5" />
      Report
    </span>

    <div role="group" aria-label="Report design" class="flex shrink-0 items-center gap-1">
      <button
        v-for="design in designs"
        :key="design.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs whitespace-nowrap transition"
        :class="design.id === active.id
          ? 'border-primary bg-primary/10 text-highlighted'
          : 'border-transparent text-toned hover:border-default hover:bg-default/60'"
        :aria-pressed="design.id === active.id"
        :title="`${design.name} — ${design.tagline}`"
        @click="selectDesign(design.id)"
      >
        <UIcon :name="design.icon" class="size-3.5 shrink-0" />
        <span class="font-medium">{{ design.name }}</span>
      </button>
    </div>

    <div class="ms-auto flex shrink-0 items-center gap-1 ps-2">
      <span class="hidden font-mono text-[10px] tracking-[0.12em] text-toned uppercase md:inline">Width</span>
      <button
        v-for="option in widths"
        :key="option.id"
        type="button"
        class="rounded-full border px-2 py-1 text-[11px] whitespace-nowrap transition"
        :class="option.id === widthChoice
          ? 'border-primary bg-primary/10 text-highlighted'
          : 'border-transparent text-toned hover:border-default hover:bg-default/60'"
        :aria-pressed="option.id === widthChoice"
        :title="option.hint"
        @click="selectWidth(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
