<script setup lang="ts">
import LandingFooter from '~/components/landing/Footer.vue'
import LandingHeader from '~/components/landing/Header.vue'

const {
  enabled: themeLabEnabled,
  visible: previewBarVisible
} = usePddKitThemeLab()
</script>

<template>
  <div class="landing-shell min-h-dvh">
    <LazyPreviewBar v-if="themeLabEnabled && previewBarVisible" />
    <LandingHeader />
    <main class="min-h-[calc(100dvh-var(--ui-header-height))]">
      <slot />
    </main>
    <LandingFooter />
    <ClientOnly>
      <LazyLandingDocsToolsDialogs />
    </ClientOnly>
  </div>
</template>

<style src="~/assets/css/landing.css"></style>
