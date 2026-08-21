<script setup lang="ts">
/**
 * The entity page, under audition.
 *
 * Shadows the shipped `BlrEntityPage` by name — Nuxt resolves a component from
 * the topmost layer that defines it, and the local viewer extends this lab
 * above `report-viewer`. Not a line of the shipped layer changes.
 *
 * The page is a container now: `BlrEntityReading` is the reading, and the
 * slideover renders the same component. A Scenario has no page of its own, so
 * one reached by URL renders its parent with that Scenario chosen.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'

defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
</script>

<template>
  <!-- Consume the Workbench page frame's top inset so top: 0 is the tabs'
       initial position, not a destination reached after 20px of scrolling. -->
  <BlrEntityReading
    v-model:scenario-route="scenarioRoute"
    v-model:route-columns="routeColumns"
    class="-mt-5"
    :workspace="workspace"
    :entity="entity"
    :selected-key="selectedKey"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
    @focus="emit('focus', $event)"
  />
</template>
