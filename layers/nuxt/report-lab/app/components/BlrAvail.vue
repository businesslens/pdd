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
    <p v-if="label" class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
      {{ label }}
    </p>
    <div v-if="pairs.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="pair in pairs"
        :key="pair.key"
        class="inline-flex items-center gap-1 rounded-full border border-default px-2 py-0.5 text-[11px]"
      >
        <span class="text-toned">{{ pair.interfaceTitle }}</span>
        <template v-if="pair.experienceTitle">
          <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
          <span class="text-dimmed">{{ pair.experienceTitle }}</span>
        </template>
      </span>
    </div>
    <p v-else-if="inheritedNote" class="text-xs text-dimmed italic">
      {{ inheritedNote }}
    </p>
    <ul v-if="entryPoints.length" class="space-y-1">
      <li
        v-for="point in entryPoints"
        :key="`${point.interfaceId}-${point.path}`"
        class="flex items-baseline gap-2 font-mono text-[11px]"
      >
        <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 self-center text-dimmed" />
        <span class="text-dimmed">{{ point.interfaceTitle }}</span>
        <span class="truncate text-toned">{{ point.path }}</span>
      </li>
    </ul>
  </div>
</template>
