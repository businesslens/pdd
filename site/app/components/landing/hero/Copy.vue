<script setup lang="ts">
import { Motion } from 'motion-v'

import LandingHeroPlateSteps from '~/components/landing/hero/PlateSteps.vue'

const { align = 'left', halo = false } = defineProps<{
  /**
   * `responsive` is centred below `xl` and left-aligned from `xl` up: a
   * left-to-right scrim can only protect the copy while the copy is a small share
   * of the width, which stops being true on a narrow window.
   */
  align?: 'left' | 'center' | 'responsive'
  /**
   * Adds a glow in the page background colour behind the glyphs. Because it
   * tracks `--ui-bg` it reads as cream on light and near-black on dark, which
   * separates type from the chart's ink lines without a heavier veil.
   */
  halo?: boolean
}>()

const { enterMotion } = useLandingMotion()

// Read from the shared source rather than held here, so the hero cannot drift
// from the rest of the page or from the arrangements that build their own hero.
const { hero } = homeContent

const haloClass = computed(() =>
  halo ? '[text-shadow:0_1px_14px_var(--ui-bg),0_0_34px_var(--ui-bg)]' : ''
)

/**
 * Per-slot class sets. `responsive` unsets each centring rule at `xl` rather than
 * swapping whole layouts, so the two states share one DOM tree.
 */
const LAYOUT = {
  left: {
    root: '',
    heading: '',
    sub: 'max-w-lg',
    actions: 'items-start'
  },
  center: {
    root: 'flex flex-col items-center text-center',
    heading: 'mx-auto max-w-4xl',
    sub: 'mx-auto max-w-xl',
    actions: 'items-center justify-center'
  },
  responsive: {
    root: 'flex flex-col items-center text-center xl:block xl:text-left',
    heading: 'mx-auto max-w-4xl xl:mx-0 xl:max-w-none',
    sub: 'mx-auto max-w-xl xl:mx-0 xl:max-w-lg',
    actions: 'items-center justify-center xl:items-start xl:justify-start'
  }
} as const

const slots = computed(() => LAYOUT[align])
</script>

<template>
  <!-- Every hero variant renders this same block. Copy differences between two
    variants would confound a judgement that is only about placement. -->
  <div :class="slots.root">
    <Motion
      as="p"
      v-bind="enterMotion(0.08)"
      class="mb-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary"
      :class="[haloClass, halo ? 'hero-eyebrow-art' : '']"
    >
      {{ hero.eyebrow }}
    </Motion>

    <Motion
      as="h1"
      v-bind="enterMotion(0.18)"
      class="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-highlighted sm:text-6xl lg:text-7xl"
      :class="[haloClass, slots.heading]"
    >
      {{ hero.titleLead }} <span class="inline-block text-primary">{{ hero.titleAccent }}</span>
    </Motion>

    <Motion
      as="p"
      v-bind="enterMotion(0.3)"
      class="mt-6 text-lg leading-relaxed text-default"
      :class="[haloClass, slots.sub]"
    >
      {{ hero.description }}
    </Motion>

    <Motion v-bind="enterMotion(0.42)" class="mt-8 w-full">
      <LandingHeroPlateSteps :align="align" />
    </Motion>
  </div>
</template>
