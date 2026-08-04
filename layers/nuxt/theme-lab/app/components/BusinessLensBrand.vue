<script setup lang="ts">
import { businessLensLogoSrc } from '../utils/businesslensThemeLabVariants'

withDefaults(defineProps<{
  compactOnMobile?: boolean
}>(), {
  compactOnMobile: false
})

const { activeMark, activeLockup, display } = useBusinessLensLogoVariant()

const lockup = computed(() => {
  const treatment = activeLockup.value
  return {
    direction: treatment.direction,
    gap: `${Math.round(treatment.wordmarkHeight * treatment.gapRatio)}px`,
    markHeight: `${Math.round(treatment.wordmarkHeight * treatment.symbolScale)}px`,
    wordmarkHeight: `${treatment.wordmarkHeight}px`
  }
})
</script>

<template>
  <span
    v-if="display === 'lockup'"
    class="flex shrink-0"
    :class="lockup.direction === 'column' ? 'flex-col items-start' : 'items-center'"
    :style="{ gap: lockup.gap }"
  >
    <img
      :src="businessLensLogoSrc(activeMark)"
      alt=""
      :style="{ height: lockup.markHeight }"
      data-logo-mark
      class="w-auto shrink-0 object-contain dark:hidden"
    >
    <img
      :src="businessLensLogoSrc(activeMark, true)"
      alt=""
      :style="{ height: lockup.markHeight }"
      data-logo-mark
      class="hidden w-auto shrink-0 object-contain dark:block"
    >
    <span
      data-logo-wordmark
      :class="compactOnMobile ? 'hidden min-[400px]:contents' : 'contents'"
    >
      <img
        :src="businessLensLogoSrc(activeLockup)"
        alt="BusinessLens"
        :style="{ height: lockup.wordmarkHeight }"
        class="w-auto shrink-0 dark:hidden"
      >
      <img
        :src="businessLensLogoSrc(activeLockup, true)"
        alt="BusinessLens"
        :style="{ height: lockup.wordmarkHeight }"
        class="hidden w-auto shrink-0 dark:block"
      >
    </span>
  </span>
  <span
    v-else
    class="flex shrink-0 items-center gap-1.5"
  >
    <img
      :src="businessLensLogoSrc(activeMark)"
      alt=""
      data-logo-mark
      class="size-8 shrink-0 object-contain dark:hidden"
    >
    <img
      :src="businessLensLogoSrc(activeMark, true)"
      alt=""
      data-logo-mark
      class="hidden size-8 shrink-0 object-contain dark:block"
    >
    <span
      data-logo-wordmark
      class="businesslens-theme-lab-gradient-text text-base font-bold tracking-tight text-highlighted"
      :class="compactOnMobile ? 'hidden min-[400px]:inline' : undefined"
    >Business<span>Lens</span></span>
  </span>
</template>
