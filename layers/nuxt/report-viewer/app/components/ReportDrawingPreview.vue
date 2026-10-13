<script setup lang="ts">
import type { CollectionDrawing } from '../utils/collectionControls'
defineProps<{ drawing: CollectionDrawing }>()
</script>
<template>
  <span class="report-drawing-preview" :data-preview="drawing" aria-hidden="true">
    <i v-for="n in (drawing === 'matrix' ? 9 : 3)" :key="n" />
  </span>
</template>
