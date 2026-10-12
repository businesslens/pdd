<script setup lang="ts">
const heroImageWide = '/brand/heroes/product-model-wide.webp'
const heroImageMobile = '/brand/heroes/product-model-mobile.webp'

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: heroImageMobile,
      type: 'image/webp',
      media: '(max-width: 1279px)',
      fetchpriority: 'high'
    },
    {
      rel: 'preload',
      as: 'image',
      href: heroImageWide,
      type: 'image/webp',
      media: '(min-width: 1280px)',
      fetchpriority: 'high'
    }
  ]
})
</script>

<template>
  <!-- One chart, two treatments, switched at `xl`.

    From `xl` up: the left-aligned original — a left-to-right scrim, copy on the
    left, chart running full-bleed to the right.

    Below `xl`: centred type over a flat wash plus a pool. The original cannot
    simply be scaled down, because its scrim protects a *percentage* of the width
    while the copy keeps its pixel size. As the window narrows the copy grows into
    the uncovered area, which is what made the headline collide with the DOMAINS
    cluster at 768px. -->
  <!-- `#start` is the anchor the closing section sends readers back to: the
    three ways in live here and nowhere else on the page. -->
  <section
    id="start"
    class="relative isolate flex min-h-[calc(100dvh-var(--ui-header-height))] items-center overflow-hidden border-b border-default"
  >
    <!-- Copy comes first in the DOM so the heading is announced before the chart's
      description. Painting order is set by the explicit z-indexes, not by source
      order, so the chart still renders behind. -->
    <!-- `xl:max-w-xl` on the copy is load-bearing, not cosmetic. Unconstrained,
      the headline collapses onto one line and "Product Model." reaches into the
      bright part of the chart where the scrim has already faded — measured at
      1.5:1. Constrained, it wraps to two lines and stays inside the scrim, which
      is also the two-line look of the original. -->
    <!-- The ultrawide offset lives in `.hero-copy-shell` (landing.css) rather than
      a `min-[1920px]:pl-*` utility: `lg:px-8` also sets padding-left, and won the
      generated-CSS ordering, so the utility silently did nothing. -->
    <div class="hero-copy-shell relative z-20 mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8 xl:max-w-7xl">
      <LandingHeroCopy align="responsive" halo class="xl:max-w-xl" />
    </div>

    <!-- Not decorative: this is the page's primary illustration and it carries
      structure the copy does not, so it keeps a real alt rather than aria-hidden. -->
    <picture>
      <!-- This is the same centre crop `object-cover` already exposed on narrow
        screens, encoded separately so phones do not download the unused sides. -->
      <source media="(max-width: 1279px)" :srcset="heroImageMobile">
      <img
        :src="heroImageWide"
        alt="An illustrated product model connecting Product with Entities, Experiences, Domains, Capabilities, Journeys, Scenarios, and Business Rules."
        width="2400"
        height="1019"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        class="absolute inset-0 z-0 size-full object-cover object-center xl:object-[68%_center]"
      >
    </picture>

    <div class="hero-veil-wash absolute inset-0 z-10 xl:hidden" aria-hidden="true" />
    <div class="hero-veil-core absolute inset-0 z-10 xl:hidden" aria-hidden="true" />
    <div class="hero-scrim-wide absolute inset-0 z-10 hidden xl:block" aria-hidden="true" />
  </section>
</template>
