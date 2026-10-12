<script setup lang="ts">
import type { BlogCollectionItem } from '@nuxt/content'
import ArticleCta from '~/components/landing/blog/ArticleCta.vue'
import ArticleShare from '~/components/landing/blog/ArticleShare.vue'

/**
 * The article page. One arrangement, not five — the comparison the blog was
 * running is settled, and the arrangements that lost were deleted rather than
 * left behind a cookie nobody flips.
 *
 * The order of the masthead is the argument it makes: title, then the sentence
 * that says whether to keep reading, then the cover image, then attribution.
 * Byline last means the rule under it opens the prose instead of separating two
 * pieces of page furniture, and a reader who has already decided never has to
 * scroll past a date to reach the first paragraph.
 *
 * Headings track in the right rail, which is why the measure is a column of a
 * grid rather than a centred container: a table of contents that pushes the
 * prose off-centre when it appears is worse than one that always has its lane.
 */
const { post } = defineProps<{ post: BlogCollectionItem }>()

const shareUrl = computed(() => new URL(post.path, SITE_ORIGIN).href)
const minutes = computed(() => readingMinutes(post.body))
</script>

<template>
  <div class="landing-page">
    <UContainer class="py-8 sm:py-12">
      <UPage
        :ui="{
          root: 'lg:grid-cols-12 lg:gap-12',
          center: 'lg:col-span-9',
          right: 'lg:col-span-3'
        }"
      >
        <article class="mx-auto max-w-3xl">
          <UButton
            to="/blog"
            icon="i-lucide-arrow-left"
            label="Back to blog"
            color="neutral"
            variant="link"
            class="-ml-2.5"
          />

          <header class="mt-6">
            <h1 class="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-highlighted sm:text-5xl">
              {{ post.title }}
            </h1>
            <p class="mt-5 text-pretty text-lg leading-relaxed text-muted">
              {{ post.description }}
            </p>

            <!-- Empty alt because the title is the heading just above; high fetch
              priority because the cover is the article's largest element. Three
              quarters of the measure on wider screens, so the art introduces the
              piece without pushing its first paragraph below the fold; a phone
              is too narrow to give any of it up. -->
            <img
              v-if="post.image"
              :src="post.image"
              alt=""
              fetchpriority="high"
              class="mt-10 aspect-[1200/630] w-full rounded-xl border border-default object-cover sm:w-3/4"
            >

            <!-- The rule is `border-b-2 border-primary`, the one place on an
              article where the accent is a structural line rather than a tint.
              It is the seam between the masthead and the piece. -->
            <div class="mt-8 flex flex-col gap-4 border-b-2 border-primary pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <!-- Name and handle sit on one line rather than stacked, which
                    is what `wrapper` overrides. The separator is a real node and
                    not a `before:content-['·']` utility: Tailwind's scanner does
                    not reliably find an arbitrary value whose quotes are escaped
                    inside a Vue attribute, and it silently rendered nothing. -->
                  <UUser
                    v-for="author in post.authors"
                    :key="author.name"
                    v-bind="author"
                    external
                    target="_blank"
                    size="sm"
                    :ui="{
                      root: 'gap-2.5',
                      wrapper: 'flex flex-wrap items-baseline gap-x-2',
                      name: 'font-semibold',
                      description: 'text-dimmed'
                    }"
                  >
                    <template #description>
                      <span aria-hidden="true" class="mr-2">·</span>{{ author.description }}
                    </template>
                  </UUser>
                </div>
                <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.12em] text-dimmed">
                  <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
                  <span aria-hidden="true" class="text-muted/60">|</span>
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-clock" class="size-3.5" />
                    {{ minutes }} {{ minutes === 1 ? 'minute' : 'minutes' }}
                  </span>
                </p>
              </div>

              <ArticleShare :url="shareUrl" :title="post.title" />
            </div>
          </header>

          <UPageBody class="docs-prose">
            <ContentRenderer :value="post" />
          </UPageBody>

          <USeparator class="my-10" />
          <ArticleCta align="start" />
        </article>

        <template #right>
          <!-- `UContentToc`'s root is a `<nav>`, and the page already has two
            others. Its visible title is a `<p>`, so without `aria-label` the
            three landmarks are indistinguishable to anyone listing them. -->
          <UContentToc
            v-if="post.body?.toc?.links?.length"
            :links="post.body.toc.links"
            highlight
            title="In this article"
            aria-label="In this article"
          />
        </template>
      </UPage>
    </UContainer>
  </div>
</template>
