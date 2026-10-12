<script setup lang="ts">
usePddKitThemeHead()

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    // The page background (`--ui-bg` in assets/css/main.css).
    { name: 'theme-color', content: '#f4ecdb' }
  ]
})

// Called here rather than in the default layout so the helper ships in the
// entry chunk: shared by the layout and every page, it would otherwise become a
// chunk of its own and one more module preload on the home page, which
// `pnpm performance:check` holds to a fixed count.
useSiteSeoDefaults()
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
