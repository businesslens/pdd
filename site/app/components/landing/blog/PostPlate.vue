<script setup lang="ts">
import type { BlogPostSummary } from '~/utils/blogFeatured'

/**
 * A post's artwork, which is an engraving rather than a photograph.
 *
 * These plates carry their own drawn border and cream ground, so they have to
 * arrive whole: `object-cover` into a fixed box slices the last row off the
 * drawing, and a masked plate loses the interior hatching that is the point.
 * The image therefore keeps its own ratio and whatever contains it takes its
 * height from that.
 *
 * `rounded-lg` and not more: the plate's printed border is already a frame, and
 * a heavy radius reads as a second one fighting it.
 *
 * A plain `img` because `@nuxt/image` is not installed — these are pre-sized
 * webp files in `public/`, so there is nothing to transform anyway.
 */
defineProps<{
  post: BlogPostSummary
  /** Loaded eagerly for the lead, which is above the fold on every viewport. */
  priority?: boolean
}>()
</script>

<template>
  <!-- Empty alt: the post's title sits directly beside every plate, so naming
    the plate after it made screen readers announce each title twice. -->
  <img
    :src="post.image"
    alt=""
    class="w-full rounded-lg"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : 'auto'"
  >
</template>
