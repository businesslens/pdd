<script setup lang="ts">
import type { StateItem } from '~/utils/homeContent'

/**
 * One item in an inventory: a place the product is defined today, or a resource type
 * a Product Model contains.
 *
 * Both sections render this, and within a section every card is one height —
 * rows equalise to the tallest in their grid, so that only holds while the notes
 * wrap to the same number of lines, capped in
 * `tests/integration/homeContent.test.ts` rather than left to whoever writes the
 * next one.
 *
 * The two sections are no longer the same height as each other. They were, and
 * that was the point of the card for four rounds; the plate band deliberately
 * gave it up. See `docs/brand.md`.
 *
 * It carries no tone. It used to, back when this card was also the outcome card
 * and the Product Model's resource types showed their nesting here as an edge rule.
 * The comparison owns outcomes now, and containment belongs to the Product
 * Model documentation.
 *
 * What it does carry is the one thing that separates the two inventories.
 * Today's places are real products, so they get brand marks on the title's line;
 * no vendor ships a resource type, so the Product Model answers with an engraved plate
 * across the top of the card and a route into the documentation underneath it.
 *
 * **The two are mutually exclusive, and the markup depends on it.** A resource type
 * card is one link over its whole face; a Today card holds up to three links of
 * its own. Nesting those would be invalid, and it cannot happen: a place has
 * `logos` and no `to`, a resource type has `to` and no `logos`, which
 * `tests/integration/homeContent.test.ts` asserts in both directions.
 */
const { item } = defineProps<{ item: StateItem }>()

// Native `loading="lazy"` starts several viewports ahead, which meant all seven
// decorative plates still competed with the hero on a phone. Their
// parent section is visibility-hydrated, so attach the real source only when
// that section mounts near the viewport while retaining the fixed-size slot in
// prerendered HTML.
const emblemSrc = shallowRef<string>()
onMounted(() => {
  emblemSrc.value = item.emblem
})

/**
 * The brand marks drawn in one near-black ink, which is the only thing the
 * `logos` collection gets wrong against the dark canvas: GitHub's Octocat is
 * `#161614` and Linear's is `#222326`, so both sink into a panel two shades off
 * black.
 *
 * Turning a mark over is right only where it is drawn in a single ink — the
 * result is the white-on-dark lockup its owner publishes for exactly this
 * ground. A coloured mark inverted is a different brand, so this list stays
 * short and every addition has to be checked against the dark page.
 */
const INK_MARKS = new Set(['i-logos-github-icon', 'i-logos-linear-icon'])
</script>

<template>
  <!-- The floor clears a two-line note, which is what the 50-character cap in
    `homeContent.test.ts` allows at the width Today's four columns are read.
    It is what holds Today's own cards level now that the two sections run at
    the same four-column layout: every card clears the same floor. -->
  <article
    class="relative flex min-h-[6.25rem] flex-col rounded-xl border border-default bg-default p-4"
    :class="item.to && 'transition-colors hover:border-primary/50 focus-within:border-primary/50'"
  >
    <!-- Decorative: the plate draws the resource type the title names, so a screen
      reader that announced it would read the card twice — and the link that
      covers it is already named by that title.

      `object-cover` rather than `contain`: the plate carries its own parchment,
      so covering makes the paper reach the card's edges. The plates are drawn
      on 16:9 sheets, which is the ratio cut here, so nothing is cropped at all.
      A different ratio would crop, and the amount has to be measured against
      the tallest drawing before it is chosen — see `docs/brand.md`.

      The parchment is left alone in dark mode, exactly as the hero's plates
      are — inverting an engraving makes ink of the paper and paper of the ink. -->
    <img
      v-if="item.emblem"
      :src="emblemSrc"
      :data-src="item.emblem"
      alt=""
      width="768"
      height="428"
      loading="lazy"
      fetchpriority="low"
      decoding="async"
      class="mb-3 block aspect-video w-full shrink-0 rounded-lg border border-default object-cover"
    >

    <!-- A resource type whose plate has not been drawn yet still reserves the
      band. `landing.desktop.spec.ts` holds every card in a section to one
      height, and a card that skipped the band would sit short among the seven
      engravings — a drawing that does not exist would read as a broken card.

      Empty rather than borrowed: standing another type's plate in here would say
      the two are the same thing, which is what the plate set exists to deny. See
      `docs/adr/0002-the-home-page.md`. -->
    <div
      v-else-if="item.to && !item.logos"
      aria-hidden="true"
      class="mb-3 block aspect-video w-full shrink-0 rounded-lg border border-dashed border-default bg-elevated"
    />

    <div class="flex items-start justify-between gap-3">
      <!-- h3: the column heading that used to sit between these and the
        section's h2 is gone, and skipping a level to h4 would leave a hole
        in the outline. -->
      <h3 class="min-w-0 text-base font-semibold tracking-tight text-highlighted">
        <!-- The raw link inherits the heading's color instead of taking
          `ULink`'s muted inactive-link treatment, so a resource type title looks the
          same as a Today title. It is stretched over the card by `after`,
          rather than wrapped around everything. That keeps `<article>` as the
          card's root — which the grid and `landing.desktop.spec.ts` both
          address — gives the link the title as its accessible name instead of
          the whole card read aloud, and leaves the plate out of the tab order
          where a decorative image belongs. -->
        <ULink
          v-if="item.to"
          :to="item.to"
          raw
          class="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-solid focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
        >
          {{ item.title }}
        </ULink>
        <template v-else>
          {{ item.title }}
        </template>
      </h3>

      <!-- `text-dimmed` is only for People's glyph, which is the one mark
        here drawn in `currentColor`. Every other mark carries its own
        colours and ignores it. -->
      <div class="flex shrink-0 items-center gap-1.5 pt-px text-dimmed">
        <UTooltip
          v-for="mark in item.logos"
          :key="mark.icon"
          :text="mark.name"
        >
          <!-- `aria-label` rather than the tooltip: a tooltip is
            `aria-describedby`, which describes a link that would otherwise
            have no name at all. New tab because a reader checking what
            Coda is has not finished with this page. -->
          <ULink
            v-if="mark.to"
            :to="mark.to"
            :aria-label="mark.name"
            external
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-xs opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          >
            <UIcon
              :name="mark.icon"
              mode="svg"
              class="size-4"
              :class="INK_MARKS.has(mark.icon) && 'dark:invert'"
            />
          </ULink>

          <!-- The one mark with nowhere to go stays a picture: not
            focusable, and hidden from a screen reader that would otherwise
            read the card's own title back to it. -->
          <UIcon
            v-else
            :name="mark.icon"
            mode="svg"
            aria-hidden="true"
            class="size-4 opacity-80"
          />
        </UTooltip>
      </div>
    </div>

    <p class="mt-1.5 text-sm leading-6 text-default">
      {{ item.note }}
    </p>
    <!-- One example per line, so every card's examples take the same three
      lines whatever their length. Badges wrapped into a row left short sets
      like Domains on one line beside two-line neighbours.

      The bullet is the list's own marker rather than an icon: an inline SVG
      per example is 21 copies in the prerendered home page, which pushed it
      over its HTML budget. -->
    <ul
      v-if="item.examples?.length"
      class="mt-3 list-disc ps-4 text-sm leading-6 text-toned marker:text-primary"
    >
      <li v-for="example in item.examples" :key="example">
        {{ example }}
      </li>
    </ul>
  </article>
</template>
