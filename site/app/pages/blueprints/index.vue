<script setup lang="ts">
import { BLUEPRINT_FEED_TITLE, BLUEPRINT_FEED_URL } from '~~/shared/utils/blueprintFeed'
import CatalogHero from '~/components/landing/blueprints/CatalogHero.vue'
import CatalogLayout from '~/components/landing/blueprints/CatalogLayout.vue'

useSiteSeo({
  title: 'Blueprints · pdd-kit',
  description: 'Complete Product Models you can pull with one command and hand straight to a coding agent. No account needed.'
})

useHead({
  link: [{
    rel: 'alternate',
    type: 'application/rss+xml',
    title: BLUEPRINT_FEED_TITLE,
    href: BLUEPRINT_FEED_URL
  }]
})

// Generated with the site from the repository's blueprints/, so the list is in
// the page itself. Cards wear their engraved cover, or the Product logo when
// there is none (ADR-0021).
const { data, error } = await useFetch('/_data/blueprints.json')
const blueprints = computed(() => data.value?.blueprints ?? [])

// Search and category are read from and written to the URL; see the composable.
const { search, category, clear } = useCatalogFilters()
</script>

<template>
  <div class="landing-page overflow-hidden">
    <!-- The catalog is the one page that earns the whole viewport: with fifteen
      Blueprints the grid fills it, and only the gutters are kept (ADR-0019). -->
    <UPageSection :ui="{ container: 'max-w-none pt-10 pb-16 sm:pt-12 lg:pt-14 sm:pb-20' }">
      <template v-if="error">
        <CatalogHero />
        <UAlert
          class="mt-8"
          icon="i-lucide-plug-zap"
          color="warning"
          variant="subtle"
          title="The Blueprints could not be loaded."
          description="Everything else on the site still works."
          data-catalog-unavailable
        />
      </template>

      <CatalogLayout
        v-else
        v-model:search="search"
        v-model:category="category"
        :blueprints="blueprints"
        @clear="clear"
      />
    </UPageSection>
  </div>
</template>
