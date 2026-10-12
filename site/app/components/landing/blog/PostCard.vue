<script setup lang="ts">
import type { BlogPostSummary } from '~/utils/blogFeatured'
import PostMeta from '~/components/landing/blog/PostMeta.vue'
import PostPlate from '~/components/landing/blog/PostPlate.vue'

/**
 * A demoted post — the card the blog index uses for whatever is not leading:
 * its plate in a shared wide frame above the copy, in an even row under the
 * lead.
 *
 * **The whole card is clickable without nesting links.** A wrapping anchor would
 * swallow the author's GitHub link and fail the axe scan on
 * `nested-interactive`, so the title's anchor spreads its own `after` element
 * across the card instead. The two links stay siblings; the card still clicks
 * anywhere. This is why the root is `relative` and why `PostMeta` lifts the
 * author to `z-10`.
 */
const { post } = defineProps<{
  post: BlogPostSummary
}>()

/**
 * These plates are only a few pixels narrower than the shared 16:9 frame.
 * Letting `object-contain` expose that difference creates a pale seam down both
 * sides, while `object-cover` trims less than one source pixel from its printed
 * edge. The Product Model map stays contained because its much wider native
 * ratio needs the full artwork preserved.
 */
const FULL_FRAME_PLATES = new Set([
  '/blog/ai-writing-code-for-products.webp',
  '/blog/pdd-and-spec-driven-development.webp'
])
const fillsGridFrame = FULL_FRAME_PLATES.has(post.image)
</script>

<template>
  <!-- `h-full` and the `mt-auto` on the byline are one mechanism. Grid siblings
    stretch to the tallest card, and without them a short description pulls its
    byline up so two cards side by side sit their bylines at different heights —
    the ragged edge reads as a layout bug rather than as a difference in copy. -->
  <article class="group relative flex h-full flex-col gap-4 rounded-xl transition">
    <div
      class="aspect-video w-full shrink-0 self-start overflow-hidden rounded-lg"
      :class="fillsGridFrame ? '' : 'bg-white'"
    >
      <PostPlate
        :post="post"
        :class="['h-full', fillsGridFrame ? 'object-cover' : 'object-contain']"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="text-lg font-semibold tracking-tight text-pretty text-highlighted">
        <NuxtLink
          :to="post.path"
          class="transition-colors after:absolute after:inset-0 after:rounded-xl group-hover:text-primary focus:outline-none"
        >
          {{ post.title }}
        </NuxtLink>
      </h3>

      <p class="mt-2 text-base leading-relaxed text-pretty text-muted">
        {{ post.description }}
      </p>

      <PostMeta :post="post" class="mt-auto pt-4" />
    </div>
  </article>
</template>
