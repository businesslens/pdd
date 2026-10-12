<script setup lang="ts">
import type { HomeSection } from '~/utils/homeContent'
import HomeCard from '~/components/landing/home/HomeCard.vue'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/**
 * An inventory section: the Product Model, or where the pieces actually live.
 * One component for both, because the page's argument is that they are two
 * answers to the same question and that only reads if they are built the same
 * way.
 *
 * A head and a grid of cards, and nothing else. Three things were stripped from
 * it in one pass, all for the same reason — each was standing in for content
 * rather than carrying any:
 *
 * - **the eyebrow**, which restated the heading a size smaller;
 * - **the column heading** over the grid, which named what the labelled cards
 *   underneath it already showed;
 * - **the tinted ground**, which coloured a plain list green or red before the
 *   reader had been given any reason for it. Colour means before-and-after on
 *   this page, and that belongs to the comparison.
 *
 * No consequences here either — those are the comparison's, beside the answers
 * to them.
 *
 * The filled *Read about the Product Model* button went the same way. The route
 * onward is real, but it existed under one box out of five and was drawn as a
 * call to action, so it read as this section being the one worth continuing and
 * competed with the hero's three doors. Every panel now says where it continues
 * in the same light corner link — see `DocsLink.vue`.
 */
const { section } = defineProps<{ section: HomeSection }>()

const VERDICT = {
  negative: 'border-secondary/30 bg-secondary/5',
  positive: 'border-success/30 bg-success/5'
} as const

/**
 * Today has eight places at four across; the Product Model has seven main
 * collections at four across, the last row three. Both stay at one card below
 * `sm` and two from `sm`, so the narrow layout is unchanged.
 *
 * A grid on twice as many tracks as there are columns, each card spanning two.
 * `auto-rows-fr` gives every row the height of the tallest card in the section,
 * not just in its own row — a wrapping flex row stretched each line separately,
 * so a note that wrapped in the first row left the second shorter. Doubling the
 * tracks is what lets a short last row centre: its first card starts one track
 * in per missing card, so three cards under four sit in the middle six of eight
 * tracks.
 *
 * The class strings are written out rather than composed, because Tailwind
 * scans source text and never sees a class assembled at runtime. The offset
 * itself is a number, so it travels as a custom property the written-out
 * `grid-column-start` utilities read.
 */
const COLUMNS = {
  3: 'sm:grid-cols-4 lg:grid-cols-6',
  4: 'sm:grid-cols-4 lg:grid-cols-8'
} as const

/** The track a short last row's first card starts on, per breakpoint. */
function rowStart(index: number, count: number, columns: number) {
  const short = count % columns
  return short && index === count - short ? columns - short + 1 : undefined
}

function offset(index: number) {
  const { items, columns } = section
  return {
    '--sm-start': rowStart(index, items.length, 2),
    '--lg-start': rowStart(index, items.length, columns)
  }
}
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-(--ui-header-height) overflow-hidden rounded-2xl border border-default bg-default"
  >
    <div class="p-6 pb-0 sm:p-8 sm:pb-0">
      <SectionHead
        :title="section.title"
        :description="section.description"
        :more="section.more"
      />
    </div>

    <div class="p-6 sm:p-8">
      <div
        class="grid grid-cols-1 gap-2.5 sm:auto-rows-fr"
        :class="COLUMNS[section.columns]"
      >
        <HomeCard
          v-for="(item, index) in section.items"
          :key="item.title"
          :item="item"
          class="sm:col-span-2 sm:[grid-column-start:var(--sm-start,auto)] lg:[grid-column-start:var(--lg-start,auto)]"
          :style="offset(index)"
        />
      </div>
    </div>

    <div
      v-if="section.verdict"
      class="border-t border-default p-6 sm:px-8"
    >
      <p
        class="max-w-3xl rounded-xl border p-4 text-base leading-7 text-default"
        :class="VERDICT[section.tone]"
      >
        {{ section.verdict }}
      </p>
    </div>
  </section>
</template>
