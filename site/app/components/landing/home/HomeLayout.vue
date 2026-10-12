<script setup lang="ts">
import LandingHeroMap from '~/components/landing/hero/MapHero.vue'
import LandingHomeLoopPanel from '~/components/landing/home/loop/LoopPanel.vue'
import MissingPiecePanel from '~/components/landing/home/MissingPiecePanel.vue'

/**
 * The home page: a hero, then six sections with one job each.
 *
 * 1. **The Product Model** — the seven main resource collections, four to a row. What the
 *    artifact is, and nothing about how this product implements one.
 * 2. **Where is your product model today?** — the eight places the pieces are actually
 *    scattered across.
 * 3. **The missing piece** — the Product Model at the centre, with every
 *    information source focused on its own concern. The selected illustration
 *    sits beside a table of the five sources it connects.
 * 4. **What changes with a Product Model** — six practical questions following
 *    one change from where its definition lives through what remains after it
 *    ships.
 * 5. **The working loop** — the three phases that repeat, drawn as a wheel,
 *    each naming what runs it.
 * 6. **Get started** — the principle, and one link back to the doors.
 *
 * The missing-piece section bridges Today's scattered state and the comparison's
 * payoff: the reader has just been told the definition is scattered, and this
 * names the thing that fills the gap before the comparison shows what changes.
 */
const { sections, missingPiece, comparison, loop } = homeContent
</script>

<template>
  <div class="landing-page overflow-hidden bg-elevated/30">
    <LandingHeroMap />

    <div
      class="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:space-y-20 sm:px-6 sm:py-20 lg:px-8"
    >
      <LazyLandingHomeSectionPanel
        v-for="section in sections"
        :key="section.id"
        :section="section"
        hydrate-on-visible
      />
      <MissingPiecePanel
        :data="missingPiece"
      />
      <LazyLandingHomeComparisonLedgerComparison
        :comparison="comparison"
        hydrate-on-visible
      />
      <!-- Nuxt's generated lazy wrapper omitted this nested component from
        prerendered HTML until the viewport reached it. Keep the loop in SSR so
        the page's argument, links, and search content are never client-only. -->
      <LandingHomeLoopPanel
        :loop="loop"
      />
      <LazyLandingHomeClosePanel hydrate-on-visible />
    </div>
  </div>
</template>
