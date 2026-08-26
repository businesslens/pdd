<script setup lang="ts">
/**
 * One authored Context, read through its containing Interface path.
 */
import type { AnyElementView, ResolvedContextView, ReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  context: ResolvedContextView
  /** A narrow Step keeps one path line and truncates each element name to fit. */
  compact?: boolean
}>()

const emit = defineEmits<{ select: [element: AnyElementView] }>()
</script>

<template>
  <BlrContextPlace
    :workspace="workspace"
    :context="context"
    :compact="compact"
    @select="emit('select', $event)"
  />
</template>
