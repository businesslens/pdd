<script setup lang="ts">
import type { TopologyBranch } from '../utils/topologyProjections'
import type { TopologyReading } from '../utils/topologyState'
import { topologyGroupOpen } from '../utils/topologyState'
defineProps<{ branch: TopologyBranch, reading: TopologyReading, depth?: number }>()
const emit = defineEmits<{ open: [key: string], toggle: [id: string, open: boolean] }>()
</script>
<template>
  <section class="blr-topology-branch" :class="{ 'blr-topology-group': !depth, 'blr-topology-leaf': !branch.children.length }" :data-group-id="branch.id" :style="branch.colorSlot != null ? { '--blr-group-color': `var(--blr-slot-${branch.colorSlot})` } : undefined">
    <div class="blr-topology-branch-heading">
      <BlrTopologyResource v-if="branch.resource" :resource="branch.resource" @open="emit('open', $event)" />
      <h3 v-else>{{ branch.title }}</h3>
      <button v-if="branch.children.length" type="button" class="blr-topology-toggle" :aria-expanded="topologyGroupOpen(reading, branch.id, branch.children.length)" :aria-label="`${topologyGroupOpen(reading, branch.id, branch.children.length) ? 'Collapse' : 'Expand'} ${branch.title}, ${branch.children.length} items`" @click="emit('toggle', branch.id, !topologyGroupOpen(reading, branch.id, branch.children.length))">
        {{ branch.children.length }} <UIcon :name="topologyGroupOpen(reading, branch.id, branch.children.length) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4" />
      </button>
    </div>
    <p v-if="branch.note" class="blr-topology-note">{{ branch.note }}</p>
    <div v-if="branch.references.length" class="blr-topology-references">
      <span>{{ branch.referenceLabel }}</span>
      <BlrTopologyResource v-if="branch.references.length === 1" :resource="branch.references[0]!" @open="emit('open', $event)" />
      <details v-else><summary>{{ branch.references.length }} {{ branch.referenceLabel === 'Entered by' ? 'Actors' : ['Exposes', 'Delivers'].includes(branch.referenceLabel ?? '') ? 'Capabilities' : 'Interfaces' }}</summary><BlrTopologyResource v-for="reference in branch.references" :key="reference.key" :resource="reference" @open="emit('open', $event)" /></details>
    </div>
    <details v-if="branch.contexts?.length" class="blr-topology-contexts"><summary>Availability · {{ branch.contexts.length }} {{ branch.contexts.length === 1 ? 'Context' : 'Contexts' }}</summary><ul><li v-for="context in branch.contexts" :key="context.key">{{ [context.interfaceTitle, context.experienceTitle, context.screenTitle].filter(Boolean).join(' / ') }}</li></ul></details>
    <div v-if="branch.children.length && topologyGroupOpen(reading, branch.id, branch.children.length)" class="blr-topology-children">
      <BlrTopologyBranch v-for="child in branch.children" :key="child.id" :branch="child" :reading="reading" :depth="(depth ?? 0) + 1" @open="emit('open', $event)" @toggle="(id, open) => emit('toggle', id, open)" />
    </div>
  </section>
</template>
