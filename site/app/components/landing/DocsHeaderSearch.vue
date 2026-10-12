<script setup lang="ts">
const { searchKeys } = useDocsTools()
</script>

<template>
  <UTooltip
    text="Search documentation"
    :kbds="searchKeys"
    ignore-non-keyboard-focus
  >
    <UContentSearchButton :kbds="searchKeys" label="Search documentation" />
  </UTooltip>
</template>
