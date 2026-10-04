<script setup lang="ts">
/**
 * What an edge label shows: its badges where it names resources, each wearing
 * its type's mark, otherwise its text. The measuring copy and the canvas both
 * draw it, so the box ELK reserves is the box the canvas fills.
 */
import type { DiagramEdge } from '../utils/diagram'
defineProps<{ edge: Pick<DiagramEdge, 'label' | 'badges'> }>()
</script>

<template>
  <span v-if="edge.badges?.length" class="blr-flow-edge-badges">
    <span v-for="(badge, index) in edge.badges" :key="index" class="blr-flow-edge-badge" :data-edge-badge="badge.kind ?? 'mark'">
      <UIcon v-if="badge.varied" name="i-lucide-split" class="size-3 shrink-0" aria-label="Only under some alternatives" />
      <BlrKind v-if="badge.kind" :kind="badge.kind" :labelled="false" size="xs" class="shrink-0" />
      <UIcon v-else-if="badge.icon" :name="badge.icon" class="size-3.5 shrink-0" />
      <span class="min-w-0">{{ badge.text }}</span>
    </span>
  </span>
  <!-- A plain label wears the same chip, so every graph's labels read alike. -->
  <span v-else class="blr-flow-edge-badges"><span class="blr-flow-edge-badge" data-edge-badge="text"><span class="min-w-0">{{ edge.label }}</span></span></span>
</template>
