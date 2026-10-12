<script setup lang="ts">
import { Motion } from 'motion-v'
import type { HomeComparison } from '~/utils/homeContent'
import ComparisonCard from '~/components/landing/home/comparison/ComparisonCard.vue'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/**
 * The before-and-after: one row per claim, two columns, the row's subject in a
 * centre gutter.
 *
 * The shape is settled — four other arrangements competed and this one won,
 * because a pair the reader associates across a gutter is the only form that
 * stays scannable as two columns while still reading as one row. So is the
 * signal: the answer is raised and the problem lies flat, which `ComparisonCard`
 * owns.
 *
 * **The gutter names the row, in a word, under the glyph.** It used to carry the
 * glyph alone, which said *these two cards are one subject* without ever saying
 * which — six rows in, a reader who had not decoded `i-lucide-siren` could read
 * any single row and still not scan the set. Four other places to put the word
 * competed: beside the glyph, alone in a stamped pill, and in a titled band over
 * each pair. The stack won on the same argument the section's own shape won on —
 * it is the only one that names the row without stopping being a table.
 *
 * The mark belongs to neither half. That is why no treatment moved it into a
 * card, and why the gutter is a column of its own rather than a label hung off
 * one side.
 *
 * The word costs 56px of gutter, which comes out of the two cards. The titles
 * pay it back: each is a predicate of the subject rather than a sentence
 * restating it — see `ComparisonSide.title`.
 *
 * **None of that survives below `lg`, and the `.cmp-*` rules are what replaces
 * it.** Stacked, the gutter stops being a column and the two headings go with
 * it, leaving a reader to tell the problem from the answer by a shadow and by
 * which card came first. So the row becomes one bordered object
 * with the subject on a band across its head and both claims named in words
 * inside it: the same argument the gutter makes at `lg`, made by a border
 * instead of a column. The subject belongs to neither claim, which is why it
 * sits above both rather than on top of one.
 *
 * Four arrangements competed for this and the other three are gone — a stack
 * with label chips, a flat ledger, and a left rail with the turn marked between
 * the two stations. This one won because it is the only one that restores the
 * grouping without spending a line of type on the label.
 *
 * The labels are the section's own `beforeLabel`/`afterLabel`, so the words a
 * phone reads are the words the table's headings use. They are `lg:hidden` and
 * the headings are `hidden lg:grid`, which means exactly one of the two is in
 * the accessibility tree at any width — never both, never neither.
 */
const { comparison } = defineProps<{ comparison: HomeComparison }>()

const { scrollMotion, staggerMotion } = useLandingMotion()
</script>

<template>
  <Motion
    :id="comparison.id"
    v-bind="scrollMotion()"
    as="section"
    class="scroll-mt-(--ui-header-height) overflow-hidden rounded-2xl border border-default bg-default"
  >
    <div class="p-6 pb-0 sm:p-8 sm:pb-0">
      <SectionHead
        :title="comparison.title"
        :description="comparison.description"
        :more="comparison.more"
      />
    </div>

    <div class="p-6 sm:p-8">
      <div class="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid">
        <!-- Both neutral. They were terracotta and green, which put the colour
          code in two places at once and left it in the headings even for the
          treatments that carry no hue at all. The cards mark themselves.

          Centred on the column rather than pinned to its inner edge, and set at
          the body's own size rather than a caption's: these are the table's two
          column headings, and a label tucked small against the gutter read as a
          note about the cards instead of the axis the whole section turns on.
          The `me-3`/`ms-3` match the cards' gutter offsets below, so each label
          is centred on its card and not on the bare grid track. -->
        <h3 class="me-3 text-center font-mono text-sm tracking-[0.18em] uppercase text-toned">
          {{ comparison.beforeLabel }}
        </h3>
        <span class="lg:w-28" aria-hidden="true" />
        <h3 class="ms-3 text-center font-mono text-sm tracking-[0.18em] uppercase text-toned">
          {{ comparison.afterLabel }}
        </h3>
      </div>

      <!-- Rows sit close from `lg`, where the gutter reads as a table column and
        the mark between two cards ties them together on its own. Once the halves
        stack, the mark becomes a heading over its pair — and a heading with as
        much air under it as over it belongs to neither, so the rows are pulled
        apart until the separation between them beats the separation inside
        one. -->
      <ul class="cmp-rows mt-5 grid list-none gap-7 p-0 lg:gap-2.5">
        <Motion
          v-for="(row, index) in comparison.rows"
          :key="row.subject"
          v-bind="staggerMotion(index)"
          as="li"
          class="cmp-row grid items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0"
        >
          <!-- First in the DOM, and explicitly placed into the middle column
            from `lg`. That is what keeps a linear read — a screen reader, or a
            narrow window — hearing *Definition, spread across many places,
            written in one Product Model* rather than meeting a predicate before
            the thing it is predicated of.

            Not a heading element: six subjects at `h4` would push every card
            title to `h5`, and the mark indexes the row while the cards carry its
            claims. The glyph is hidden from the accessibility tree, because the
            word beside it says the same thing in words. -->
          <div class="cmp-subject flex flex-col items-center justify-center gap-1.5 lg:col-start-2 lg:row-start-1 lg:w-28">
            <span
              aria-hidden="true"
              class="cmp-mark flex size-9 shrink-0 items-center justify-center rounded-full border border-default bg-elevated text-primary"
            >
              <UIcon :name="row.icon" class="size-4" />
            </span>
            <span class="cmp-word text-center font-mono text-xs leading-tight tracking-[0.14em] uppercase text-toned">
              {{ row.subject }}
            </span>
          </div>

          <!-- The label is a paragraph rather than a heading on purpose. Six
            rows would put twelve more headings between the section's `h2` and
            the card titles at `h4`, and a screen reader would meet the whole
            comparison as an outline before it met a single claim. -->
          <div class="cmp-half lg:col-start-1 lg:row-start-1 lg:me-3" data-side="before">
            <p class="cmp-label lg:hidden">
              {{ comparison.beforeLabel }}
            </p>
            <ComparisonCard side="before" :item="row.before" />
          </div>

          <div class="cmp-half lg:col-start-3 lg:row-start-1 lg:ms-3" data-side="after">
            <p class="cmp-label lg:hidden">
              {{ comparison.afterLabel }}
            </p>
            <ComparisonCard side="after" :item="row.after" />
          </div>
        </Motion>
      </ul>
    </div>
  </Motion>
</template>

<style scoped>
/*
  Everything here is below `lg` and nothing here runs at `lg`. The wide table is
  settled, so the whole block is one media query and the desktop grid is left
  exactly as the Tailwind classes above describe it.

  1023px rather than `md`: the grid's own switch is `lg:grid-cols-…`, and a
  treatment that started one breakpoint early would fight it for 256px.
*/
@media (max-width: 1023px) {
  /*
    The row becomes one bordered object with a titled band.

    Self-contained, so the 1.75rem that separates bare stacks is dead space in
    it — the border already says where a row begins and ends.
  */
  .cmp-rows {
    gap: 1rem;
  }

  .cmp-row {
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: var(--radius-xl);
  }

  .cmp-subject {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-bg-elevated);
  }

  .cmp-mark {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* A centred word inside a left-aligned band reads as a mistake at any measure
    where it does not happen to fill the row. */
  .cmp-word {
    text-align: start;
  }

  .cmp-half {
    padding: 0.875rem;
  }

  /*
    The answer keeps a raised ground where it can no longer keep a raised edge.
    `shadow-lg` between two stacked cards reads as depth between rows, not as
    depth between claims, so the shell is flattened below and the distinction
    moves to the label and this wash.
  */
  [data-side="after"] {
    border-top: 1px solid var(--ui-border-muted);
    background: color-mix(in srgb, var(--ui-bg-elevated) 55%, transparent);
  }

  /* One face, and the same voice the gutter word and the desktop headings use —
    this is that label moved, not a new one. */
  .cmp-label {
    margin-bottom: 0.375rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    line-height: 1.4;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ui-text-toned);
    /* `Without a Product Model` is 24 characters and the narrowest phone this
      section supports is 320px. It wraps rather than clips, and it is allowed
      to. */
    text-wrap: balance;
  }

  [data-side="after"] .cmp-label {
    color: var(--ui-text-highlighted);
  }

  /*
    The row now holds the claims inside a boundary of its own, so the card's
    border, radius and shadow would be a second frame drawn 12px inside the
    first. Flattened here rather than behind a prop on `ComparisonCard`: the
    card's own rule is that elevation is its only signal, and a prop asking it
    to stop signalling would be arguing with that instead of scoping it.
  */
  .cmp-half :deep(.cmp-card) {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
}
</style>
