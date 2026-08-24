<script setup lang="ts">
/**
 * One authored Context, read through its containing Interface path.
 */
import type { AnyEntityView, ResolvedContextView, ReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  context: ResolvedContextView
  /** A narrow Step keeps one path line and truncates each entity name to fit. */
  compact?: boolean
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()
</script>

<template>
  <BlrContextPlace
    :workspace="workspace"
    :context="context"
    :compact="compact"
    @select="emit('select', $event)"
  />
</template>
