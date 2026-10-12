<script setup lang="ts">
import type { ContentSurroundLink } from '@nuxt/ui'

definePageMeta({ layout: 'docs' })

const route = useRoute()

const { data: page } = await useAsyncData(`docs-page-${route.path}`, () =>
  queryCollection('docs').path(route.path).first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { docs } = await useDocsNavigation()

const surround = computed(() => {
  const ordered = docs.value ?? []
  const index = ordered.findIndex(doc => doc.path === route.path)
  if (index === -1) return [null, null] as unknown as ContentSurroundLink[]
  return [ordered[index - 1] ?? null, ordered[index + 1] ?? null] as unknown as ContentSurroundLink[]
})

const title = computed(() => page.value ? `${page.value.title} · pdd-kit docs` : 'pdd-kit docs')

useSiteSeo({
  title,
  description: () => page.value?.description,
  // The docs index is the Docs crumb itself, so only its children get a trail.
  structuredData: () => page.value && page.value.path !== '/docs'
    ? [breadcrumbList([
        { name: 'Home', path: '/' },
        { name: 'Docs', path: '/docs' },
        { name: page.value.title, path: page.value.path }
      ])]
    : []
})
</script>

<template>
  <!--
    Nested inside the layout's `UPage`, which already spent 2 of its 10 columns on
    the sidebar. Re-gridding on the 8 that remain — with the same gap — keeps the
    2/6/2 split the docs had when one grid held all three columns.
  -->
  <UPage :ui="{ root: 'lg:grid-cols-8', center: 'lg:col-span-6' }">
    <UPageBody class="docs-prose">
      <ContentRenderer v-if="page" :value="page" />
      <USeparator class="my-10" />
      <UContentSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UContentToc
        v-if="page?.body?.toc?.links?.length"
        :links="page.body.toc.links"
        highlight
        title="On this page"
      />
    </template>
  </UPage>
</template>
