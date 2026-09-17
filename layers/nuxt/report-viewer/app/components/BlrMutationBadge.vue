<script setup lang="ts">
import type { TopologyMutation } from '../utils/topologyProjections'
import type { EntityFacet } from '../utils/reportWorkspace'

const props = defineProps<{
  mutation: TopologyMutation
  entityTitle: string
  entityFacet?: EntityFacet | null
  capabilityTitle: string
  viewKey: string
}>()
const emit = defineEmits<{ open: [key: string] }>()
const title = computed(() => `${{ creates: 'Creates', changes: 'Changes', removes: 'Removes' }[props.mutation.effect]} ${props.entityTitle}`)
</script>

<template>
  <BlrMatrixBadge :label="mutation.effect" :tone="mutation.effect"
    :accessible-label="`${title} · ${capabilityTitle}: show scenarios`"
    :view-key="viewKey" :content-key="mutation" @open="emit('open', $event)">
    <template #heading><BlrKind kind="capability" :labelled="false" size="xs" /><span>{{ capabilityTitle }}</span></template>
    <template #default="{ follow }">
      <section v-for="(variant, index) in mutation.variants" :key="JSON.stringify([variant.from, variant.to])" class="blr-matrix-popover-section">
        <h4 v-if="index === 0" class="blr-matrix-popover-resource blr-matrix-popover-subject"><BlrKind kind="entity" :facet="entityFacet" :labelled="false" size="xs" /><span>{{ entityTitle }}</span></h4>
        <p v-if="mutation.effect === 'creates' && variant.to" class="blr-matrix-popover-state">Created in state: <strong>{{ variant.to }}</strong></p>
        <p v-else-if="mutation.effect === 'removes' && variant.from" class="blr-matrix-popover-state">Removed from state: <strong>{{ variant.from }}</strong></p>
        <p v-else-if="mutation.effect === 'changes'" class="blr-matrix-popover-state">
          <template v-if="variant.from && variant.to"><strong>{{ variant.from }}</strong> <span aria-label="to">→</span> <strong>{{ variant.to }}</strong></template>
          <template v-else>Changes information</template>
        </p>
        <p class="blr-matrix-popover-caption">{{ variant.evidence.length }} {{ variant.evidence.length === 1 ? 'Scenario' : 'Scenarios' }}</p>
        <ul class="blr-matrix-popover-links"><li v-for="scenario in variant.evidence" :key="scenario.key"><BlrTopologyResource :resource="scenario" @open="follow" /></li></ul>
      </section>
    </template>
  </BlrMatrixBadge>
</template>
