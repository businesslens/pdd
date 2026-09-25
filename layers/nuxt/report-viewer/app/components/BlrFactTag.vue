<script setup lang="ts">
/**
 * One fact an Entity keeps, named beside its Entity: what a Screen presents, a
 * Step cites, or a Business Rule governs. Plain and squared, so it never reads
 * as a resource of its own.
 */
defineProps<{ name: string }>()
</script>

<template>
  <UBadge color="neutral" variant="outline" size="sm" class="max-w-full font-normal" data-fact>{{ name }}</UBadge>
</template>
