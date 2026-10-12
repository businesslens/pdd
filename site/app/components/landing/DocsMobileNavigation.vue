<script setup lang="ts">
const { navigation } = await useDocsNavigation()
</script>

<template>
  <UContentNavigation
    :navigation="navigation"
    highlight
  />
</template>
