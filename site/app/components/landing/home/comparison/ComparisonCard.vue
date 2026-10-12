<script setup lang="ts">
import type { ComparisonSide } from '~/utils/homeContent'

/**
 * One half of a comparison row.
 *
 * **The signal is elevation, and nothing else.** The half the page argues for is
 * raised — `shadow-lg` tinted with `--ui-border-accented`, so the shadow is the
 * page's own border colour rather than a black the parchment does not contain —
 * and the half it argues against sits flat behind a fainter border.
 *
 * Three rounds of colour were tried and abandoned first: filled cards in
 * terracotta and green, then those two hues as edges, glyphs and struck lines.
 * Neither is in this palette — `secondary` is a rust and `success` a cool green,
 * and a page of brass, umber and parchment reads that pair as borrowed from a
 * form validation state. Elevation says the same thing with no hue at all and
 * survives a greyscale print, which the hues never did.
 *
 * The column headings say `Before` and `After` in neutral ink, so nothing
 * depends on the depth being perceived.
 *
 * **Elevation is a `lg` signal only.** Below that the headings are gone and the
 * two cards stack, where a shadow separating a card from the one above it says
 * nothing about which is which. `LedgerComparison`
 * renders a worded label beside each half there and restyles this shell through
 * `.cmp-card`, which is the only reason that class exists.
 */
const { side } = defineProps<{
  side: 'before' | 'after'
  item: ComparisonSide
}>()

const shell = computed(() =>
  side === 'before'
    ? 'border-default/60'
    : 'border-default shadow-lg shadow-(color:--ui-border-accented)')
</script>

<template>
  <div class="cmp-card h-full rounded-xl border bg-default p-4" :class="shell">
    <h4 class="text-base font-semibold tracking-tight text-highlighted">
      {{ item.title }}
    </h4>
    <p class="mt-1.5 text-sm leading-6 text-default">
      {{ item.description }}
    </p>
  </div>
</template>
