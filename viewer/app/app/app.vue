<script setup lang="ts">
useBusinessLensThemeHead()
useBusinessLensThemeLabHead()

useHead({
  title: 'Local Product Model · BusinessLens',
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Explore a local BusinessLens Product Model and its capabilities, value paths, delivery by Interface, scenarios, and rules.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<template>
  <UApp>
    <!-- The report fills the viewport; only the opened theme lab takes a top row. -->
    <div class="flex h-dvh flex-col overflow-hidden">
      <NuxtLoadingIndicator />
      <BusinessLensThemeLabBar class="shrink-0" />
      <main
        class="businesslens-page-surface min-h-0 flex-1 overflow-hidden"
        :style="{
          '--businesslens-report-chrome':
            'var(--businesslens-theme-lab-height)'
        }"
      >
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
