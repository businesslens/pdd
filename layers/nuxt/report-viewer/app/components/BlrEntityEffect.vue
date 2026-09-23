<script setup lang="ts">
/**
 * The words after an Entity chip: a plain verb and the States it names, each
 * State a squarer badge wearing the Lifecycle's ring so it never reads as a
 * second Entity. See `entityEffectParts` for the phrasing.
 */
import type { EntityEffectLike } from '../utils/entityEffectPhrase'
import { entityEffectParts } from '../utils/entityEffectPhrase'

const props = defineProps<{ mention: EntityEffectLike, outcome?: boolean }>()
const parts = computed(() => entityEffectParts(props.mention, props.outcome))
</script>

<template>
  <span class="blr-entity-effect" :data-effect="mention.effect">
    <template v-for="(part, index) in parts" :key="index">
      <span v-if="part.t === 'verb'" class="blr-entity-effect-verb">{{ part.text }}</span>
      <UIcon v-else-if="part.t === 'arrow'" name="i-lucide-arrow-right" class="blr-entity-effect-arrow" aria-label="to" />
      <span v-else class="blr-entity-effect-state" :data-from="part.from || undefined" data-effect-state><span class="blr-entity-effect-state-mark" aria-hidden="true" />{{ part.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.blr-entity-effect { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; font-family: var(--font-sans); }
.blr-entity-effect-verb { color: var(--ui-text-muted); }
.blr-entity-effect-state {
  display: inline-flex; align-items: baseline; gap: 0.3125rem; min-width: 0; max-width: 100%;
  padding: 0.125rem 0.4375rem; border: 1px solid var(--ui-border-accented); border-radius: 0.3125rem;
  background: var(--ui-bg); font-size: 0.75rem; line-height: 1.125rem; font-weight: 500; color: var(--ui-text-highlighted);
  overflow-wrap: anywhere;
}
.blr-entity-effect-state[data-from] { font-weight: 400; color: var(--ui-text-muted); border-color: var(--ui-border); background: transparent; }
.blr-entity-effect-state-mark { align-self: center; width: 0.5rem; height: 0.5rem; flex-shrink: 0; border: 1.5px solid currentColor; border-radius: 999px; opacity: 0.55; }
.blr-entity-effect-arrow { align-self: center; width: 0.75rem; height: 0.75rem; flex-shrink: 0; color: var(--ui-text-dimmed); }
</style>
