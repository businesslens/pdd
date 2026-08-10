<script setup lang="ts">
/**
 * The BusinessLens lockup, as every host renders it.
 *
 * This is the selected brand, not an audition: the mark and wordmark that won
 * live here beside the palette and type, so a host gets identical chrome from
 * the stable theme alone. `theme-lab` still carries the rejected variants and
 * the controls that swap them; a host that opts into the lab overrides this
 * component with its own audition-aware one.
 *
 * The asset for the active colour mode is the only one requested. Painting
 * light and dark twins and hiding one with CSS downloads both 111 KB
 * wordmarks on every page.
 */
withDefaults(defineProps<{
  /** Drop the wordmark on narrow viewports, keeping the mark as the home link. */
  compactOnMobile?: boolean
}>(), {
  compactOnMobile: false
})

const BRAND_BASE = '/brand/logo/variants'

/* Stamp geometry: the wordmark sets the scale and the mark rides slightly
   taller than the caps so the two optically align. */
const WORDMARK_HEIGHT = 26
const MARK_SCALE = 1.31
const GAP_RATIO = 0.25

const colorMode = useColorMode()
const suffix = computed(() => colorMode.value === 'dark' ? '-dark' : '')

const markSrc = computed(() => `${BRAND_BASE}/mark-10${suffix.value}.svg`)
const wordmarkSrc = computed(() => `${BRAND_BASE}/wordmark-3${suffix.value}.svg`)

const metrics = {
  gap: `${Math.round(WORDMARK_HEIGHT * GAP_RATIO)}px`,
  markHeight: `${Math.round(WORDMARK_HEIGHT * MARK_SCALE)}px`,
  wordmarkHeight: `${WORDMARK_HEIGHT}px`
}
</script>

<template>
  <span class="flex shrink-0 items-center" :style="{ gap: metrics.gap }">
    <img
      :src="markSrc"
      alt=""
      data-logo-mark
      :style="{ height: metrics.markHeight }"
      class="w-auto shrink-0 object-contain"
    >
    <span
      data-logo-wordmark
      :class="compactOnMobile ? 'hidden min-[400px]:contents' : 'contents'"
    >
      <img
        :src="wordmarkSrc"
        alt="BusinessLens"
        :style="{ height: metrics.wordmarkHeight }"
        class="w-auto shrink-0"
      >
    </span>
  </span>
</template>
