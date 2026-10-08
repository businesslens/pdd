<script setup lang="ts">
import type { NuxtError } from '#app'

/* A failure outside the report's own boundary still gets the overlay, never a bare 500 page. */
const props = defineProps<{ error: NuxtError }>()
useBusinessLensThemeHead()
const message = computed(() => props.error.message || props.error.statusMessage || 'Unknown error')
</script>

<template>
  <UApp>
    <div class="relative h-dvh">
      <LocalBuildOverlay :crash="message" />
    </div>
  </UApp>
</template>
