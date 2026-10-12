<script setup lang="ts">
import { Motion } from 'motion-v'

/**
 * The closing hero: the principle, and one link back to the doors.
 *
 * Everything above has already made the argument, so this owes a conclusion and
 * a way to act on it — not a recap, and not a second copy of the offer. One
 * headline, one sentence, one button.
 *
 * Two heavier versions were tried and both put the whole offer on the page
 * twice: a row of three buttons that competed with the hero's doors, and then
 * the hero's own CTA block rendered again in full. The way in is where the
 * reader came in; this points at it.
 *
 * **It is the one panel with no corner link.** Every box of information on the
 * page says where it continues, and this is not one — it is a sub-hero, and its
 * whole job is the single button under it. A second route out of a block that
 * exists to make one offer is the same mistake the three buttons made, in
 * smaller type.
 */
const { close } = homeContent
const { scrollMotion } = useLandingMotion()
</script>

<template>
  <Motion
    id="get-started"
    v-bind="scrollMotion()"
    as="section"
    class="scroll-mt-(--ui-header-height) rounded-2xl border border-primary/30 bg-default p-6 text-center sm:p-10"
  >
    <div class="mx-auto max-w-3xl">
      <h2 class="text-balance text-3xl font-semibold tracking-[-0.04em] text-highlighted sm:text-4xl">
        {{ close.title }}
      </h2>
      <p class="mt-5 text-balance text-base leading-7 text-default">
        {{ close.description }}
      </p>
      <UButton
        :label="close.action.label"
        :to="close.action.to"
        size="lg"
        trailing-icon="i-lucide-arrow-up"
        class="mt-8"
      />
    </div>
  </Motion>
</template>
