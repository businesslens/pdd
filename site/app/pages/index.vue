<script setup lang="ts">
import HomeLayout from '~/components/landing/home/HomeLayout.vue'

// Route rules mark the documentation and blog as prerendered, so Nuxt expects
// every client-side navigation to have a matching `_payload.json`. Dynamic
// content routes are not known to the file-system router, and links inside lazy
// sections are not guaranteed to be visible to Nitro's initial crawl. Discover
// them from the same content collections that render the pages and explicitly
// add them to the prerender queue while the homepage is being generated.
if (import.meta.prerender) {
  const [docs, blogPosts] = await Promise.all([
    queryCollection('docs').select('path').all(),
    queryCollection('blog').select('path').all()
  ])

  prerenderRoutes([
    ...docs.map(doc => doc.path),
    ...blogPosts.map(post => post.path)
  ])
}

/**
 * One argument, five arrangements of it. The body is two sections that mirror
 * each other — Today, and With a Product Model — each read left to right, and
 * `HomeLayout` picks which arrangement renders them from the preview bar's Story
 * row.
 *
 * The copy lives in `utils/homeContent.ts` rather than in any template. That
 * separation is what makes the comparison honest — no arrangement can win by
 * quietly rewording — and it outlives it: the words stay reviewable on their own.
 */

// The social card keeps the earlier headline on purpose: it is still an endorsed
// claim, and a card carries the hook rather than mirroring the h1. See
// docs/adr/0002-the-home-page.md.
useSiteSeo({
  title: 'pdd-kit | Product-Driven Development for coding agents',
  socialTitle: 'Product-Driven Development for coding agents',
  description: 'Your AI agent is guessing what the product is. PDD gives agents and humans a shared product model that is git-tracked, reviewable, and verifiable.'
})
</script>

<template>
  <HomeLayout />
</template>
