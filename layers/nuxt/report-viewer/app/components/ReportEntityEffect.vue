<script setup lang="ts">
/**
 * The words after an Entity chip: a plain verb and the States it names, each
 * a `ReportEntityState` badge. See `entityEffectParts` for the phrasing; the
 * Lifecycle reads its changes through this same component.
 */
import type { EntityEffectLike, EntitySelectorLike } from '../utils/entityEffectPhrase'
import { entityEffectParts, entitySelectorParts } from '../utils/entityEffectPhrase'

const props = defineProps<{
  mention: EntityEffectLike | EntitySelectorLike
  outcome?: boolean
  /** A Rule's selector: the operation it governs, in the present, with the same badges. */
  selector?: boolean
}>()
const parts = computed(() => props.selector
  ? entitySelectorParts(props.mention as EntitySelectorLike)
  : entityEffectParts(props.mention as EntityEffectLike, props.outcome))
</script>

<template>
  <span class="report-entity-effect" :data-effect="mention.effect || 'any'">
    <template v-for="(part, index) in parts" :key="index">
      <span v-if="part.t === 'verb'" class="report-entity-effect-verb">{{ part.text }}</span>
      <UIcon v-else-if="part.t === 'arrow'" name="i-lucide-arrow-right" class="report-entity-effect-arrow" aria-label="to" />
      <ReportEntityState v-else :name="part.text" :from="part.from" />
    </template>
  </span>
</template>

<style scoped>
.report-entity-effect { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; font-family: var(--font-sans); }
.report-entity-effect-verb { color: var(--ui-text-muted); }
.report-entity-effect-arrow { align-self: center; width: 0.75rem; height: 0.75rem; flex-shrink: 0; color: var(--ui-text-dimmed); }
</style>
