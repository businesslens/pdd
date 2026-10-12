<script setup lang="ts">
import type { HomeLink } from '~/utils/homeContent'
import MoreLink from '~/components/landing/home/MoreLink.vue'

/**
 * The centred heading block all three sections share.
 *
 * Centring is what survived a full-bleed arrangement that otherwise lost: what
 * sits below a section head here is either a grid or two symmetrical columns,
 * and a heading pinned to the left edge sits over one part of that rather than
 * over the whole of it.
 *
 * There was an eyebrow above the title, tinted with the section's signal, and it
 * went from every section at once: each restated its own heading a size smaller,
 * and four of them down the page read as furniture. The Product Model since
 * turned that pair the other way up — the heading names the artifact and the
 * sentence describing it moved into the subhead — which is a different move from
 * an eyebrow, because nothing is said twice.
 *
 * Takes loose fields rather than a section object so the comparison and the
 * close can use it too; the three do not share a type and should not be forced
 * to.
 *
 * The corner link is required rather than optional, and that is what makes it a
 * standard rather than a decision taken per section: a panel with a head is a
 * box of information, and every box of information on this page says where it
 * continues.
 */
const { title, description, more, width = 'wide' } = defineProps<{
  title: string
  description: string
  /** Where this section continues. See `MoreLink.vue`. */
  more: HomeLink
  /** `tight` for a head sitting inside a narrower panel. */
  width?: 'wide' | 'tight'
}>()

/**
 * The centred block's measure, and the room the corner link needs beside it.
 *
 * From `lg` the link sits on the heading's own line, so the two share a row and
 * a heading wide enough to reach the panel's edge would run under it. The second
 * cap reserves the link's width on *both* sides — the block is centred, so only
 * a symmetrical reserve leaves the heading centred on the panel rather than
 * nudged off it — and it binds only where a heading is long enough to need it:
 * at the widths this page is actually read the caps are the same number, and the
 * one heading long enough to notice wraps to two balanced lines instead of
 * colliding.
 */
const MEASURE = {
  wide: 'max-w-3xl lg:max-w-[min(48rem,calc(100%_-_18rem))]',
  tight: 'max-w-2xl lg:max-w-[min(42rem,calc(100%_-_18rem))]'
} as const
</script>

<template>
  <div class="relative">
    <!--
      Right-aligned to the panel's own padding rather than to the centred block
      beside it, which is what puts it in the corner of the box.

      `top-3` sets its middle on the middle of the heading's first line — the
      heading is 2.5rem of leading and the link one rem tall — so the two read as
      one row. Below `lg` it takes a line of its own above the heading: at those
      widths a balanced heading fills the panel, and there is no corner left to
      sit in.
    -->
    <MoreLink :link="more" class="mb-4 lg:absolute lg:end-0 lg:top-3 lg:mb-0" />

    <div class="mx-auto text-center" :class="MEASURE[width]">
      <h2 class="text-balance text-3xl font-semibold tracking-[-0.035em] text-highlighted sm:text-4xl">
        {{ title }}
      </h2>
      <p class="mt-4 text-balance text-base leading-7 text-default">
        {{ description }}
      </p>
    </div>
  </div>
</template>
