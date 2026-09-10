<script setup lang="ts">
import type { ExperienceView, ReportWorkspace } from '../utils/reportWorkspace'
const props = defineProps<{ workspace: ReportWorkspace, resource: ExperienceView }>()
const emit = defineEmits<{ open: [key: string] }>()
const own = computed(() => props.workspace.screens.filter(screen => screen.contexts.some(context => context.experienceId === props.resource.id)))
const shared = computed(() => props.workspace.screens.filter(screen => screen.contexts.some(context => props.resource.interfaceIds.includes(context.interfaceId) && !context.experienceId)))
</script>
<template>
  <section v-if="own.length || shared.length" class="space-y-3">
    <div v-if="own.length" class="space-y-2">
      <h2 class="text-sm font-semibold text-highlighted">Screens</h2>
      <div class="flex flex-wrap gap-2"><BlrTopologyResource v-for="screen in own" :key="screen.key" :resource="screen" @open="emit('open', $event)" /></div>
    </div>
    <div v-if="shared.length" class="space-y-2">
      <h2 class="text-sm font-semibold text-highlighted">Shared Screens</h2>
      <p class="text-xs text-muted">Available across this Interface’s Experiences.</p>
      <div class="flex flex-wrap gap-2"><BlrTopologyResource v-for="screen in shared" :key="screen.key" :resource="screen" @open="emit('open', $event)" /></div>
    </div>
  </section>
</template>
