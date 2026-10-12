<script setup lang="ts">
const themeLabEnabled = useThemeLabEnabled()
</script>

<template>
  <PddKitThemeLabBar v-if="themeLabEnabled" data-preview-bar :row-count="1" />
</template>
