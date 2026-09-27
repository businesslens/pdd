<script setup lang="ts">
/**
 * An alternative's own part of its Variation: what chooses between the
 * alternatives, and the condition that selects this one. The title's pill
 * already names the set; timing and stability are the set's, one link away.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { variationSetOf } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const set = computed(() => variationSetOf(props.workspace, props.resource))
</script>

<template>
  <section v-if="set && resource.variation" class="space-y-2" data-variation-choice>
    <p class="blr-block-heading">How this one is chosen
      <span class="ms-2 font-normal text-dimmed"><BlrTerm :slug="set.variationKind" /></span>
    </p>
    <div class="space-y-3 rounded-lg border border-default p-4">
      <BlrVariationSelection :workspace="workspace" :set="set" only="mechanism" @open="emit('open', $event)">
        <div v-if="resource.variation.label" class="grid gap-1 @min-sm:grid-cols-[9rem_minmax(0,1fr)] @min-sm:gap-x-4">
          <dt class="text-xs font-medium text-muted">Version</dt>
          <dd class="font-mono text-sm text-highlighted">{{ resource.variation.label }}</dd>
        </div>
        <div class="grid gap-1 @min-sm:grid-cols-[9rem_minmax(0,1fr)] @min-sm:gap-x-4" data-selected-when>
          <dt class="text-xs font-medium text-muted">Selected when</dt>
          <dd><BlrProse :text="resource.variation.selectedWhen" size="sm" /></dd>
        </div>
      </BlrVariationSelection>
      <BlrResourceLink :resource-key="set.key" class="text-xs text-muted underline underline-offset-2 hover:text-highlighted" data-variation-set-link @open="emit('open', set)">
        Timing and stability are on {{ set.title }}
      </BlrResourceLink>
    </div>
  </section>
</template>

<style scoped>
.blr-block-heading {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}
</style>
