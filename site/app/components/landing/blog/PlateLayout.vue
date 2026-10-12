<script setup lang="ts">
import type { BlogPostSummary } from '~/utils/blogFeatured'
import PostCard from '~/components/landing/blog/PostCard.vue'
import PostMeta from '~/components/landing/blog/PostMeta.vue'
import PostPlate from '~/components/landing/blog/PostPlate.vue'

/**
 * The blog index: the engraving leads, and the copy is set beside it.
 *
 * The plate is not an illustration attached to a headline: the drawing is the
 * largest object on the page, sits on its own cream ground, and the title is
 * what accompanies it.
 * Reversed at `lg` so the plate takes the optically heavier right side and the
 * reader meets the picture before the words.
 *
 * It is specific to this site and therefore not portable — it only works while
 * the artwork is genuinely worth looking at. A
 * post that ships with a screenshot instead of a plate would fall apart here,
 * which is a real constraint on the blog rather than only on the layout.
 */
const { featured } = defineProps<{
  featured: BlogPostSummary
  rest: BlogPostSummary[]
}>()

/**
 * A lead title with a colon breaks after it, so the name it introduces reads as
 * one line — "Introducing pdd-kit:" — instead of whichever words happen to
 * fit. The space stays in the text, so the link's accessible name is unchanged.
 */
const featuredTitle = computed(() => {
  const colon = featured.title.indexOf(': ')
  return colon === -1
    ? { lead: featured.title, rest: '' }
    : { lead: featured.title.slice(0, colon + 1), rest: featured.title.slice(colon + 2) }
})
</script>

<template>
  <div class="space-y-14 lg:space-y-20">
    <article class="group relative grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
      <!-- `order` and not `direction`: the plate must still come first in the
        source, so a screen reader meets the post's own image before its title. -->
      <!-- The ground is thin on purpose. It exists to separate a cream plate
        from a cream page in light mode, and nothing else — every millimetre of
        it is millimetres the drawing does not get, and the plate already
        carries its own printed border. -->
      <!-- Seven and five rather than eight and four. At four columns the copy is
        under 340px wide, which cannot hold a 30px "Introducing pdd-kit:" on
        one line; five holds it from 1024px up, and the plate is still the
        larger object. -->
      <div class="lg:order-2 lg:col-span-7">
        <div class="rounded-2xl bg-elevated/40 p-2 ring-1 ring-default sm:p-3">
          <PostPlate :post="featured" priority />
        </div>
      </div>

      <div class="lg:order-1 lg:col-span-5">
        <h2 class="text-2xl leading-tight font-semibold tracking-[-0.03em] text-pretty text-highlighted sm:text-3xl">
          <NuxtLink
            :to="featured.path"
            class="transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-primary focus:outline-none"
          >
            <span class="block">{{ featuredTitle.lead }}</span>
            <template v-if="featuredTitle.rest">
              {{ ' ' }}{{ featuredTitle.rest }}
            </template>
          </NuxtLink>
        </h2>

        <p class="mt-4 text-base leading-relaxed text-pretty text-muted">
          {{ featured.description }}
        </p>

        <PostMeta :post="featured" size="sm" class="mt-6" />
      </div>
    </article>

    <!-- The secondary posts borrow the banner arrangement: artwork above copy
      in an even row. `items-stretch` gives both cards the same height, and
      `PostCard` pushes their bylines to the bottom. -->
    <div class="grid items-stretch gap-8 border-t border-default pt-10 sm:grid-cols-2 lg:gap-12">
      <PostCard
        v-for="post in rest"
        :key="post.path"
        :post="post"
      />
    </div>
  </div>
</template>
