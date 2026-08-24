<script setup lang="ts">
import type { ContextView, EntryPointView } from '../utils/reportWorkspace'

withDefaults(defineProps<{
  contexts: ContextView[]
  entryPoints?: EntryPointView[]
  label?: string
  /** Shown when the list is empty because the entity inherits its parent's context. */
  inheritedNote?: string
}>(), {
  entryPoints: () => [],
  label: 'Available in',
  inheritedNote: ''
})
</script>

<template>
  <div v-if="contexts.length || inheritedNote || entryPoints.length" class="space-y-2">
    <p v-if="label" class="blr-field">
      {{ label }}
    </p>
    <div v-if="contexts.length" class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="context in contexts"
        :key="context.key"
        color="neutral"
        variant="outline"
        size="sm"
      >
        <span class="text-default">{{ context.interfaceTitle }}</span>
        <template v-if="context.experienceTitle">
          <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
          <span class="text-muted">{{ context.experienceTitle }}</span>
        </template>
        <template v-if="context.screenTitle">
          <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
          <span class="text-muted">{{ context.screenTitle }}</span>
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
