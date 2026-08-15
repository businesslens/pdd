<script setup lang="ts">
/** The header every page layout keeps: identity, parent, and the way to the map. */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'

defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()
</script>

<template>
  <header class="space-y-3">
    <div class="flex flex-wrap items-center gap-2.5">
      <BlrKind :kind="entity.kind" />
      <h1 class="text-2xl font-semibold tracking-[-0.02em] text-highlighted">{{ entity.title }}</h1>
      <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ entity.id }}</code>
      <UButton
        icon="i-lucide-waypoints"
        color="neutral"
        variant="outline"
        size="xs"
        label="Neighbourhood"
        class="ms-auto"
        title="Show this entity on the topology canvas"
        @click="emit('focus', entity)"
      />
    </div>
    <BlrChildNav :workspace="workspace" :entity="entity" @open="emit('open', $event)" />
  </header>
</template>
