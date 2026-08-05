<script setup lang="ts">
import type { AvailabilityPair, EntryPointView } from '../utils/reportWorkspace'

withDefaults(defineProps<{
  pairs: AvailabilityPair[]
  entryPoints?: EntryPointView[]
  label?: string
  /** Shown when the list is empty because the entity inherits its parent's scope. */
  inheritedNote?: string
}>(), {
  entryPoints: () => [],
  label: 'Available in',
  inheritedNote: ''
})
</script>

<template>
  <div v-if="pairs.length || inheritedNote || entryPoints.length" class="space-y-2">
    <p v-if="label" class="blr-field">
      {{ label }}
    </p>
    <div v-if="pairs.length" class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="pair in pairs"
        :key="pair.key"
        color="neutral"
        variant="outline"
        size="sm"
      >
        <span class="text-default">{{ pair.interfaceTitle }}</span>
        <template v-if="pair.experienceTitle">
          <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
          <span class="text-muted">{{ pair.experienceTitle }}</span>
        </template>
      </UBadge>
    </div>
    <p v-else-if="inheritedNote" class="text-sm text-muted italic">
      {{ inheritedNote }}
    </p>
    <ul v-if="entryPoints.length" class="space-y-1">
      <li
        v-for="point in entryPoints"
        :key="`${point.interfaceId}-${point.path}`"
        class="blr-meta flex items-baseline gap-2"
      >
        <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 self-center" />
        <span>{{ point.interfaceTitle }}</span>
        <span class="truncate text-default">{{ point.path }}</span>
      </li>
    </ul>
  </div>
</template>
