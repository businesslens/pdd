<script setup lang="ts">
import { Motion } from 'motion-v'
import { BLUEPRINT_FEED_PATH } from '~~/shared/utils/blueprintFeed'

/**
 * The catalog masthead from the design mock: eyebrow, a two-line title with
 * the closing phrase highlighted, and a plain statement of what a Blueprint is. Left-aligned because
 * every arrangement sets the listing directly beneath it — a centered hero
 * over a left-ragged grid reads as two pages.
 */
const { enterMotion } = useLandingMotion()
</script>

<template>
  <header>
    <Motion
      as="div"
      v-bind="enterMotion(0.1)"
      class="flex flex-wrap items-center gap-3"
    >
      <p class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-primary">
        Blueprints
      </p>
      <UTooltip text="Follow via RSS">
        <UButton
          :to="BLUEPRINT_FEED_PATH"
          external
          icon="i-lucide-rss"
          aria-label="Follow via RSS"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </UTooltip>
    </Motion>
    <!-- Type matches the FAQ and blog mastheads: 4xl/5xl, semibold, the same
      leading and tracking. Only the alignment is this page's own. -->
    <h1 class="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-highlighted sm:text-5xl">
      <Motion as="span" v-bind="enterMotion(0.2)" class="inline-block">
        Start from a Product Model<br>
        that is <span class="landing-shimmer-text">yours to change.</span>
      </Motion>
    </h1>
    <Motion
      as="p"
      v-bind="enterMotion(0.35)"
      class="mt-4 max-w-xl text-lg leading-relaxed text-default"
    >
      Each Blueprint is a reviewed Product Model of a common product, open to
      contributions. Pull one into your repository with one command and change
      it freely.
    </Motion>
  </header>
</template>
