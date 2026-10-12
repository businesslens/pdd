<script setup lang="ts">
import ArticleLayout from '~/components/landing/blog/ArticleLayout.vue'

/**
 * One post, one arrangement. The five that competed for this slot behind the
 * preview bar's Layout row are gone, and so is the row — the FAQ settled the
 * same way. The home page body is the one comparison still running, from the
 * Compare row, and it does not reach this page.
 */
const route = useRoute()

const { data: post } = await useAsyncData(`blog-post-${route.path}`, () =>
  queryCollection('blog').path(route.path).first())

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useSiteSeo({
  title: () => post.value ? `${post.value.title} · pdd-kit blog` : 'pdd-kit blog',
  description: () => post.value?.description,
  // The cover's own alt is empty because the heading above it says the same
  // thing; a preview card has no heading, so it is named by the title instead.
  image: () => post.value ? { src: post.value.image, alt: post.value.title } : undefined,
  article: () => post.value
    ? {
        publishedTime: post.value.date,
        authors: (post.value.authors ?? []).flatMap(author => author.to ? [author.to] : [])
      }
    : undefined,
  structuredData: () => post.value
    ? [
        blogPosting({
          path: post.value.path,
          headline: post.value.title,
          description: post.value.description,
          image: post.value.image,
          datePublished: post.value.date,
          authors: post.value.authors ?? []
        }),
        breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.value.title, path: post.value.path }
        ])
      ]
    : []
})

// An article is where a reader arrives from search and decides to follow the
// blog, so the feed is advertised here as well as on the index.
useHead({
  link: [{
    rel: 'alternate',
    type: 'application/rss+xml',
    title: BLOG_FEED_TITLE,
    href: BLOG_FEED_URL
  }]
})
</script>

<template>
  <ArticleLayout v-if="post" :post="post" />
</template>
