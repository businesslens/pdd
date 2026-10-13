<script setup lang="ts">
usePddKitThemeHead()
usePddKitThemeLabHead()

useHead({
  title: 'Local Product Model · pdd-kit',
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Explore a local pdd-kit Product Model: its Capabilities, Journeys, Interfaces, Scenarios, and Business Rules. Product-Driven Development for coding agents.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<template>
  <UApp>
    <!-- The report fills the viewport; only the opened theme lab takes a top row. -->
    <div class="flex h-dvh flex-col overflow-hidden">
      <NuxtLoadingIndicator />
      <PddKitThemeLabBar class="shrink-0" />
      <main
        class="pdd-kit-page-surface min-h-0 flex-1 overflow-hidden"
        :style="{
          '--pdd-kit-report-chrome':
            'var(--pdd-kit-theme-lab-height)'
        }"
      >
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
