<script setup lang="ts">
/**
 * The pdd-kit lockup, as every host renders it.
 *
 * This is the selected brand, not an audition: the approved mark and the name
 * live here beside the palette and type, so every host gets identical chrome
 * from the stable theme alone. The name is live text in the heading face, so
 * it needs no asset of its own.
 *
 * The mark for the active colour mode is the only one requested. Painting
 * light and dark twins and hiding one with CSS downloads both on every page.
 */
const props = withDefaults(defineProps<{
  /** Drop the name on narrow viewports, keeping the mark as the home link. */
  compactOnMobile?: boolean
  /** Scale the lockup proportionally to fit its host. */
  wordmarkHeight?: number
  /** Keep just the mark in a collapsed navigation rail. */
  markOnly?: boolean
}>(), {
  compactOnMobile: false,
  wordmarkHeight: 26,
  markOnly: false
})

const BRAND_BASE = '/brand/logo'

/* Stamp geometry: the name sets the scale and the mark rides slightly
   taller than the letters so the two optically align. */
const MARK_SCALE = 1.31
const GAP_RATIO = 0.25

const colorMode = useColorMode()
const suffix = computed(() => colorMode.value === 'dark' ? '-dark' : '')

const markSrc = computed(() => `${BRAND_BASE}/mark${suffix.value}.svg`)

const metrics = computed(() => ({
  gap: `${Math.round(props.wordmarkHeight * GAP_RATIO)}px`,
  markHeight: `${Math.round(props.wordmarkHeight * MARK_SCALE)}px`,
  wordmarkHeight: `${props.wordmarkHeight}px`
}))
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
      v-if="!markOnly"
      data-logo-wordmark
      :class="compactOnMobile ? 'hidden min-[400px]:contents' : 'contents'"
    >
      <span
        :style="{ fontSize: metrics.wordmarkHeight, lineHeight: 1 }"
        class="shrink-0 font-[family-name:var(--pdd-kit-font-heading)] font-semibold tracking-tight text-highlighted"
      >pdd-kit</span>
    </span>
  </span>
</template>
