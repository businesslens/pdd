<script setup lang="ts">
import FaqLayout from '~/components/landing/faq/FaqLayout.vue'

/**
 * One arrangement, and with it one answer to the question the five were really
 * arguing about: answers open collapsed. The page is a list of situations to scan
 * for your own, not a document to read through.
 *
 * The copy lives in PDD's `docs/faq.md`, also readable directly on GitHub.
 */

const { data: page, error } = await useAsyncData('faq-page', async () => {
  const source = await queryCollection('faq').first()
  if (!source) throw createError({ statusCode: 500, statusMessage: 'FAQ content unavailable', fatal: true })
  // Project once into the page payload. Load the adapter only when fetching
  // FAQ content, so hydration can reuse the prepared answers.
  const { readFaqContent } = await import('~~/shared/faq-content')
  return {
    title: source.title,
    description: source.description,
    content: readFaqContent(source.body, source.title)
  }
})
// Nuxt clears data when navigation disposes this page before loading finishes.
// Only a completed fetch error should replace the destination with an error page.
if (error.value) throw error.value
const faq = computed(() => page.value?.content)

useSiteSeo({
  title: () => `${page.value?.title ?? 'FAQ'} · pdd-kit`,
  description: () => page.value?.description
})
</script>

<template>
  <FaqLayout v-if="faq" :content="faq" />
</template>
