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
const open = ref(false)
const title = computed(() => `${{ creates: 'Creates', changes: 'Changes', removes: 'Removes' }[props.mutation.effect]} ${props.entityTitle}`)
let handingOffFocus = false

watch(open, value => { if (value) handingOffFocus = false })
// Columns remain mounted while paging; their portaled popovers must not remain
// open when the table moves or its filtered evidence changes.
watch([() => props.viewKey, () => props.mutation], () => {
  handingOffFocus = true
  open.value = false
})
function follow(key: string) {
  handingOffFocus = true
  open.value = false
  emit('open', key)
}
function onCloseAutoFocus(event: Event) {
  if (handingOffFocus) event.preventDefault()
}
</script>

<template>
  <UPopover v-model:open="open"
    :content="{ align: 'start', collisionPadding: 16, onCloseAutoFocus }"
    :ui="{ content: 'blr-mutation-popover' }">
    <button type="button" class="blr-mutation-badge" :data-effect="mutation.effect"
      :aria-label="`${title} · ${capabilityTitle}: show scenarios`">
      {{ mutation.effect }}<UIcon name="i-lucide-chevron-down" aria-hidden="true" />
    </button>
    <template #content>
      <div class="blr-mutation-heading">
        <h3 class="blr-mutation-resource"><BlrKind kind="capability" :labelled="false" size="xs" /><span>{{ capabilityTitle }}</span></h3>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close effect details" @click="open = false" />
      </div>
      <div class="blr-mutation-variants">
        <section v-for="(variant, index) in mutation.variants" :key="JSON.stringify([variant.from, variant.to])" class="blr-mutation-variant">
          <h4 v-if="index === 0" class="blr-mutation-resource blr-mutation-entity"><BlrKind kind="entity" :facet="entityFacet" :labelled="false" size="xs" /><span>{{ entityTitle }}</span></h4>
          <p v-if="mutation.effect === 'creates' && variant.to" class="blr-mutation-state">Created in state: <strong>{{ variant.to }}</strong></p>
          <p v-else-if="mutation.effect === 'removes' && variant.from" class="blr-mutation-state">Removed from state: <strong>{{ variant.from }}</strong></p>
          <p v-else-if="mutation.effect === 'changes'" class="blr-mutation-state">
            <template v-if="variant.from && variant.to"><strong>{{ variant.from }}</strong> <span aria-label="to">→</span> <strong>{{ variant.to }}</strong></template>
            <template v-else>Changes information</template>
          </p>
          <p class="blr-mutation-count">{{ variant.evidence.length }} {{ variant.evidence.length === 1 ? 'Scenario' : 'Scenarios' }}</p>
          <ul><li v-for="scenario in variant.evidence" :key="scenario.key"><BlrTopologyResource :resource="scenario" @open="follow" /></li></ul>
        </section>
      </div>
    </template>
  </UPopover>
</template>
