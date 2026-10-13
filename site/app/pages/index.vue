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
 * The home page is `HomeLayout`: the hero, then the sections in the order
 * `docs/brand.md` sets. Its copy lives in `utils/homeContent.ts` rather than in
 * any template, so the words stay reviewable on their own.
 *
 * The description is the hero's subhead, word for word; the social card carries
 * the h1. See docs/adr/0002-the-home-page.md.
 */
useSiteSeo({
  title: 'pdd-kit | Product-Driven Development for coding agents',
  socialTitle: 'Product-Driven Development for coding agents',
  description: 'Every coding agent reconstructs your product\'s definition from scratch, and differently each time. PDD gives agents and humans a shared product model that is git-tracked, reviewable, and verifiable.'
})
</script>

<template>
  <HomeLayout />
</template>
