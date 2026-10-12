<script setup lang="ts">
import { Motion } from 'motion-v'
import type { HomeLoop } from '~/utils/homeContent'
import CommandBlock from '~/components/landing/CommandBlock.vue'
import LoopWheel from '~/components/landing/home/loop/LoopWheel.vue'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/**
 * The working loop: three phases placed around a ring, with the ring between
 * them, and under each phase the thing that runs it.
 *
 * **A 2×3 grid.** The ring spans the middle row and each phase takes the cell
 * its position on the ring points at: Ideate above, Implement and Verify below the
 * two lower cardinals. That is the only arrangement where the text sits *at*
 * its phase rather than in a legend beside the figure.
 *
 * All three blocks are centred in their cells. The two lower ones were aligned
 * to the outer edges first, on the argument that their ticks point at the
 * corners — but a ring is a symmetrical figure and the eye reads the labels as
 * a set, so pushing two of them apart tilted a wheel that is level.
 *
 * **The runner chips are two treatments, not one.** A skill gets a solid
 * hairline and brass monospace; the reader's own workflow gets a dashed one and
 * plain prose type. The point of showing runners at all is that the middle
 * phase has none of ours, and one shared treatment would flatten that into
 * three commands. The dashed chip is a handoff, not a gap: its text is set at
 * full reading contrast so the phase never looks disabled, and the section
 * description says in words what the border only suggests (issue #23).
 *
 * **Below `md` the ring shrinks rather than disappearing.** Removing it and
 * leaving three headings was the old answer, and it threw away the section's
 * whole argument: the order survived, the direction and the return to Ideate did
 * not, so a reader met a list of three things rather than a loop (issue #22).
 *
 * The phone gets a compass instead — the ring at the smallest size its centre
 * plate allows, naming its own three stations, with the phases listed under it
 * as a numbered run and the return written out at the foot. The figure keeps
 * carrying the direction, which is the one thing a list cannot say. Three other
 * arrangements competed and are gone: a vertical stepper, a chip strip naming
 * the circuit, and one card per phase with chevrons between.
 *
 * The step numbers and the return line are declared off and switched on only
 * below `md`, because from `md` up the ring says both things itself and two
 * sources for one fact is how they drift apart.
 */
/* `headless` drops the section head for the docs embed, which is the page the head links to. */
const { loop, headless = false } = defineProps<{ loop: HomeLoop, headless?: boolean }>()

const { scrollMotion } = useLandingMotion()
</script>

<template>
  <Motion
    :id="loop.id"
    v-bind="scrollMotion()"
    as="section"
    class="scroll-mt-(--ui-header-height) overflow-hidden rounded-2xl border border-default bg-default"
  >
    <div v-if="!headless" class="p-6 pb-0 sm:p-8 sm:pb-0">
      <SectionHead
        :title="loop.title"
        :description="loop.description"
        :more="loop.more"
      />
    </div>

    <div class="p-6 sm:p-8">
      <div class="loop">
        <!-- h3 under the section's h2: the phases are the only headings between
          them, so there is no level to skip. -->
        <div
          v-for="(phase, index) in loop.phases"
          :key="phase.id"
          class="loop-node"
          :class="`loop-node--${phase.id}`"
        >
          <!-- The position, not the name. It is `aria-hidden` because DOM order
            already carries it and a screen reader announcing "1 Ideate" is
            reading the ordinal of a list it is already numbering. -->
          <span class="loop-step" aria-hidden="true">{{ index + 1 }}</span>

          <h3 class="text-xl font-semibold tracking-tight text-highlighted">
            {{ phase.name }}
          </h3>

          <!-- A skill is a command, so it is shown the way this site shows
            commands — minus the two things a diagram does not want. `prompt` is
            dropped because these are typed into a coding agent rather than at a
            shell, and the copy control because these are labels for what runs a
            phase, not an offer to take one. -->
          <CommandBlock
            v-if="phase.runner.kind === 'skill'"
            class="loop-runner"
            :command="phase.runner.label"
            :prompt="null"
            :copyable="false"
            size="sm"
            align="center"
          />

          <!-- The same shape, dashed and inert: nothing to copy, because
            nothing here is ours to hand you. The handoff is in the words. -->
          <p v-else class="loop-runner loop-runner--yours">
            {{ phase.runner.label }}
          </p>

          <p class="loop-note text-sm leading-6 text-default">
            {{ phase.note }}
          </p>
        </div>

        <!-- Real text, not a glyph. This is the one part of the figure a screen
          reader has ever been able to receive, and below `md` it is the only
          thing that makes three headings a loop rather than a list. -->
        <p class="loop-return">
          <UIcon name="i-lucide-rotate-cw" class="loop-return-turn" aria-hidden="true" />
          <span>{{ loop.returnNote }}</span>
        </p>

        <!-- The names go to the wheel at every width and are painted below `md`
          alone. They cost nothing where they are not shown — three spans inside
          a figure the accessibility tree already ignores — and passing them
          conditionally would mean deciding on the server how wide the viewport
          receiving this HTML is about to be. -->
        <LoopWheel
          class="loop-wheel-cell"
          :label="loop.centerLabel"
          :mark="loop.centerMark"
          :phases="loop.phases.map(phase => phase.name)"
        />
      </div>
    </div>
  </Motion>
</template>

<style scoped>
/*
  The circle is sized in one place and the row that holds it reads that value,
  so the ring and its track cannot drift apart. 200px is the floor below which
  the centre mark no longer fits inside the ring; the `md` stack takes over
  before the figure ever reaches it.
*/
.loop {
  --loop-circle: clamp(200px, 24vw, 270px);

  display: grid;
  grid-template-rows: auto var(--loop-circle) auto;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.75rem, 2vw, 1.25rem);
  place-items: center;
  /*
    Held to 32rem so the two lower blocks land under the ring rather than out
    at the panel's edges — centred in a half of a wider figure is still centred,
    and still reads as two columns of text with a circle dropped between them.
    Their centres now sit just inside the circle's own width, which is where the
    ticks at 120° and 240° are pointing.
  */
  max-width: 32rem;
  margin: 0 auto;
}

.loop-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 22ch;
  text-align: center;
}

/* Full width of its cell, so the two commands and the slot beside them line up
  as one row of the same object rather than three pills of three lengths. */
.loop-runner {
  width: 100%;
  margin-top: 0.5rem;
}

/*
  The one that is not a command: the point where the loop hands off to the
  reader's own workflow. Dashed says it is filled by something pdd-kit
  neither ships nor prescribes, and matching `CommandBlock`'s small metrics keeps
  it the same slot in the same row. It is set in prose type rather than mono —
  it names a workflow, not something to type — and at toned rather than dimmed
  contrast, because dimmed read as a disabled or missing step.
*/
.loop-runner--yours {
  padding: 0.375rem 0.625rem;
  border: 1px dashed var(--ui-border-accented);
  border-radius: var(--radius-lg);
  color: var(--ui-text-toned);
  font-size: 0.8125rem;
  /* A `CommandBlock`'s line box, so the three chips stay one height. */
  line-height: 1rem;
  /* Where the code sits inside a `CommandBlock` now that neither has a control
    pinning it to one edge, so the three read as one row of the same object. */
  text-align: center;
}

/* Balanced rather than ragged: at this measure a note is two lines and the
  natural break leaves the second one a single word, which around a circle reads
  as a mistake. Unsupported browsers get the ragged wrap, which is what they
  would have had anyway. */
.loop-note {
  margin-top: 0.5rem;
  text-wrap: balance;
}

/*
  The two phone-only parts, off everywhere by default.

  From `md` up the ring carries both facts itself — the order in the positions
  of the three phases, the return in the fact that it is a circle — so a step
  number and a written return line would each be a second source for something
  already on screen. Declared off here and switched on inside the phone block
  below, so the desktop figure cannot inherit either by accident.
*/
.loop-step,
.loop-return {
  display: none;
}

/*
  Placed by id, so the three names in the content and the three cells here are
  checked against each other by eye rather than by index. A fourth phase needs
  this grid and the wheel's ticks and arrows rebuilt, not another rule.
*/
/* The one block with the full width to itself, so it is allowed a little more
  measure than the two that share a row. */
.loop-node--ideate {
  grid-area: 1 / 1 / 2 / 3;
  max-width: 26ch;
}

.loop-node--verify {
  grid-area: 3 / 1;
  align-self: start;
}

.loop-node--implement {
  grid-area: 3 / 2;
  align-self: start;
}

.loop-wheel-cell {
  grid-area: 2 / 1 / 3 / 3;
  place-self: center;
  width: var(--loop-circle);
}

/*
  Wide enough for the ring to have two columns beside it, so Implement and Verify
  move off the floor of the figure and up alongside the ticks that point at
  them — the lower diagonals, at 120° and 240°.

  `align-self: end` sets each block's foot on the circle's, which puts its
  middle within a dozen pixels of its own tick. That is close enough to read as
  a label on the ring, and it needs no measurement to stay true when a note
  wraps to a different number of lines.

  The narrower band keeps the arrangement below the circle: a command block
  wants about 200px, and two of those beside a ring do not fit until `lg`.
*/
@media (min-width: 1024px) {
  .loop {
    grid-template-rows: auto var(--loop-circle);
    grid-template-columns: 1fr var(--loop-circle) 1fr;
    column-gap: 0.75rem;
    max-width: 46rem;
  }

  .loop-node {
    max-width: none;
    width: 100%;
  }

  .loop-node--ideate {
    grid-area: 1 / 2;
    max-width: none;
  }

  .loop-wheel-cell {
    grid-area: 2 / 2;
  }

  .loop-node--verify {
    grid-area: 2 / 1;
    align-self: end;
  }

  .loop-node--implement {
    grid-area: 2 / 3;
    align-self: end;
  }
}

/*
  THE PHONE.

  Flex rather than grid, and that is the change that makes the four treatments
  possible: the desktop figure places three named cells by `grid-area`, which is
  exactly the wrong tool once the arrangement is a sequence with a route strip
  in front of it and a return line after it. In a column, DOM order *is* loop
  order and every treatment gets it for free.

  Everything below is one media query, so the settled `md` and `lg` figures are
  untouched — including the 768–1023px band, which keeps the two-column grid and
  the full-size ring it has today.
*/
@media (max-width: 767px) {
  .loop {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
    max-width: none;
  }

  /* Full width, so the three command slots are one column rather than three
    widths set by whichever note happens to be longest. */
  .loop-node {
    position: relative;
    align-items: flex-start;
    width: 100%;
    max-width: none;
    padding-inline-start: 2rem;
    text-align: left;
  }

  /*
    The dial is sized against the names, not against the panel.

    They ride outside the ring, so the figure is wider than the circle: about
    `0.94 × circle` of ring-to-name spread plus one whole label, since half of
    the widest name hangs off each side. At 320px the panel is 238px — the
    viewport less the page's `px-4`, this section's `p-6` and its border — and a
    200px circle spends 234px of that, which cleared by 2px. That is not a
    margin, it is a coincidence, and the first phase name a word longer would
    have eaten it.

    So the circle gives way instead of the names: 158px at the narrowest, back
    to its full 200px by the time the viewport can pay for it. The floor is set
    by the centre plate rather than by the names — at 158px the ring is still
    145px across and `PDD-KIT` measures about 108px, which is the
    constraint `LoopWheel` documents.

    The block margin is the vertical half of the same overhang. Ideate rides at
    the axial radius, so it clears the cell by roughly its own height — this is
    the space it needs plus a real gap under the section description, which it
    was previously sitting almost on top of.
  */
  .loop-wheel-cell {
    order: -1;
    align-self: center;
    width: clamp(158px, 46vw, 200px);
    margin-block: 1.5rem 1.25rem;
  }

  /*
    The stations, named on the dial.

    This is the one place the ring stands alone — the phases are listed under it
    rather than placed around it — so without these the figure is three
    unlabelled ticks and a signature, and a reader has to match it to the list
    below by counting. Turned on from here because the arrangement owns the
    decision; `LoopWheel` keeps them off by default so the desktop figure, which
    already sets each name in the cell its tick points at, can never inherit a
    second copy.
  */
  .loop-wheel-cell :deep(.loop-wheel-phase) {
    display: block;
  }

  /*
    A hanging ordinal, because the figure above already carries the direction
    and the list underneath only has to carry order. A rail through the three
    would be drawing the loop a second time.
  */
  .loop-step {
    display: flex;
    position: absolute;
    top: 0.1875rem;
    inset-inline-start: 0;
    align-items: center;
    justify-content: center;
    width: 1.375rem;
    height: 1.375rem;
    border: 1px solid var(--ui-border-muted);
    border-radius: 9999px;
    background: var(--ui-bg-elevated);
    color: var(--ui-text-toned);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    line-height: 1;
  }

  /* Real text, not a glyph — the one part of the figure a screen reader has
    ever been able to receive. */
  .loop-return {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--ui-text-toned);
    text-align: center;
  }

  .loop-return-turn {
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--ui-primary);
  }
}
</style>
