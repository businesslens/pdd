<script setup lang="ts">
/**
 * The peek, under audition.
 *
 * This component shadows the shipped `BlrEntityPeek` by name — Nuxt resolves a
 * component from the topmost layer that defines it, and the local viewer
 * extends this lab above `report-viewer`. Nothing in the shipped Workbench
 * changes, and nothing in the shipped layer knows this exists.
 *
 * `zones` renders the shipped component itself, by path, so the baseline in the
 * comparison is the thing that actually ships rather than a copy of it that can
 * drift.
 */
import ShippedPeek from '../../../report-viewer/app/components/BlrEntityPeek.vue'
import type { AnyEntityView, ReportWorkspace } from '../utils/model'

defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

const { peek } = useWorkbenchLab()
</script>

<template>
  <ShippedPeek
    v-if="peek === 'zones'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
  <BlrPeekProse
    v-else-if="peek === 'prose'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
  <BlrPeekSpec
    v-else-if="peek === 'spec'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
  <BlrPeekMap
    v-else-if="peek === 'map'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
  <BlrPeekBars
    v-else
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />
</template>
