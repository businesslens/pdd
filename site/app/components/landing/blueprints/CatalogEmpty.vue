<script setup lang="ts">
/**
 * What renders where the grid would be when there is nothing to put in it.
 *
 * An empty filter result and an empty catalog are different states: one is a
 * query that came up short, answered with a way back to everything, the other is
 * a shelf that is bare, answered with the two ways to fill it. A filter result
 * clears in place — no reload — because the catalog it narrows is already here.
 */
const props = defineProps<{
  /** Size of the unfiltered catalog, deciding which of the states this is. */
  total: number
}>()

const emit = defineEmits<{
  clear: []
}>()

const state = computed(() => {
  if (!props.total) {
    return {
      icon: 'i-lucide-package-open',
      title: 'No Blueprints yet.',
      description: 'The catalog is being curated. Request the one you need, or contribute a Product Model you already have.'
    }
  }
  return {
    icon: 'i-lucide-search-x',
    title: 'Nothing matches that.',
    description: 'Try another word, or clear the filters to see every Blueprint.'
  }
})
</script>

<template>
  <UEmpty
    :icon="state.icon"
    :title="state.title"
    :description="state.description"
    variant="outline"
    size="lg"
    :ui="{ root: 'rounded-xl border-dashed bg-default/60' }"
    data-catalog-empty
  >
    <template #actions>
      <template v-if="total">
        <UButton
          label="Clear filters"
          icon="i-lucide-x"
          color="neutral"
          variant="outline"
          @click="emit('clear')"
        />
      </template>
      <template v-else>
        <UButton label="Request a Blueprint" to="/contact" />
        <UButton
          label="Submit a Blueprint"
          to="/docs/cli-contribute"
          color="neutral"
          variant="outline"
        />
      </template>
    </template>
  </UEmpty>
</template>
