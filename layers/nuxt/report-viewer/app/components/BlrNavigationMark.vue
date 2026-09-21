<script setup lang="ts">
/**
 * The navigation mark: this Screen is named in its container's `navigation`,
 * so it is reachable from every place inside. It is structure, not movement —
 * the report never draws it as an edge — and the glyph is unreserved: no kind
 * wears an anchor.
 */
defineProps<{ labelled?: boolean }>()
</script>

<template>
  <UTooltip text="Always reachable — named in its container's navigation, so it can be reached from every place inside" :delay-duration="150">
    <UBadge color="neutral" variant="outline" size="sm" class="gap-1 font-normal" data-navigation-mark aria-label="Always reachable">
      <UIcon name="i-lucide-anchor" class="size-3 shrink-0 text-muted" aria-hidden="true" />
      <span v-if="labelled !== false" class="text-xs"><BlrTerm slug="navigation" text="Always reachable" /></span>
    </UBadge>
  </UTooltip>
</template>
