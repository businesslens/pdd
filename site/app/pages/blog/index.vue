<script setup lang="ts">
import type { BlogPostSummary } from '~/utils/blogFeatured'
import type { ButtonProps } from '@nuxt/ui'
import { Motion } from 'motion-v'
import PlateLayout from '~/components/landing/blog/PlateLayout.vue'
import { splitFeatured } from '~/utils/blogFeatured'

const { enterMotion } = useLandingMotion()

useSiteSeo({
  title: 'Blog · pdd-kit',
  description: BLOG_DESCRIPTION
})

// Absolute, so a reader that saves the feed from this page saves the public URL
// rather than whichever host served the HTML.
useHead({
  link: [{
    rel: 'alternate',
    type: 'application/rss+xml',
    title: BLOG_FEED_TITLE,
    href: BLOG_FEED_URL
  }]
})

const { data: posts } = await useAsyncData('blog-posts', () =>
  queryCollection('blog').order('date', 'DESC').all())

/**
 * The lead is pinned rather than newest — see `blogFeatured.ts`. Splitting here
 * and passing both halves down means the five arrangements under comparison
 * cannot disagree about which post leads.
 */
const split = computed(() => splitFeatured((posts.value ?? []) as BlogPostSummary[]))

// In script rather than inline: @vue/language-core 3.3.12+ reads the `//` of a
// URL inside a multi-line template expression as a comment and fails the
// typecheck (vuejs/language-tools#6240).
const ctaLinks: ButtonProps[] = [
  { label: 'Star on GitHub', to: 'https://github.com/itai-gendler/pdd-kit', external: true, target: '_blank', icon: 'i-simple-icons-github', color: 'neutral', variant: 'outline', size: 'lg' },
  { label: 'Read the docs', to: '/docs', trailingIcon: 'i-lucide-arrow-right', size: 'lg' }
]
</script>

<template>
  <div class="landing-page overflow-hidden">
    <UPageHero
      class="landing-hero relative"
      :ui="{
        container: 'relative z-10 py-8 sm:py-10 lg:py-10',
        wrapper: 'flex flex-col items-center'
      }"
    >
      <!-- The page name is the title. The RSS link sits beside the heading rather
        inside it, so the heading's accessible name stays "Blog". -->
      <template #header>
        <Motion
          as="div"
          v-bind="enterMotion(0.1)"
          class="relative"
        >
          <h1 class="text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl">
            Blog
          </h1>
          <!-- Nitro serves the feed as XML, so use a full navigation. The button
            hangs outside the heading's box so "Blog" centers like every other
            page title instead of sharing the center with its icon. -->
          <UTooltip text="Follow via RSS">
            <UButton
              class="absolute top-1/2 left-full ml-3 -translate-y-1/2"
              :to="BLOG_FEED_PATH"
              external
              icon="i-lucide-rss"
              aria-label="Follow via RSS"
              color="neutral"
              variant="ghost"
              size="sm"
            />
          </UTooltip>
        </Motion>
      </template>
    </UPageHero>

    <!-- Wider than the `max-w-5xl` the rest of the marketing surface uses. The
      posts are carried by engravings, and a plate has a size below which its
      interior hatching stops resolving and it reads as a smudge — the index is
      the one page whose job is showing them. -->
    <UPageSection :ui="{ container: 'max-w-6xl pt-4 pb-8 sm:pt-5 sm:pb-10 lg:pt-6 lg:pb-12' }">
      <!-- No per-post enter animation. It belonged to a list of equal cards; a
        lead that fades in after the page has settled reads as arriving late,
        which is the opposite of what promoting it is for. -->
      <PlateLayout
        v-if="split.featured"
        :featured="split.featured"
        :rest="split.rest"
      />
    </UPageSection>

    <UPageCTA
      variant="naked"
      title="Try it on your own product."
      description="Star the repository to follow the project, or map your own product and open an issue wherever the model falls short."
      :links="ctaLinks"
      :ui="{
        root: 'relative',
        container: 'max-w-3xl text-center py-16 sm:py-20 lg:py-20',
        title: 'tracking-tight',
        description: 'mx-auto max-w-xl leading-relaxed text-dimmed'
      }"
    />
  </div>
</template>
