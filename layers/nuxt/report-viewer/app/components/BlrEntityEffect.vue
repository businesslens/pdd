<script setup lang="ts">
/**
 * The words after an Entity chip: a plain verb and the States it names, each
 * a `BlrEntityState` badge. See `entityEffectParts` for the phrasing; the
 * Lifecycle reads its changes through this same component.
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
      <BlrEntityState v-else :name="part.text" :from="part.from" />
    </template>
  </span>
</template>

<style scoped>
.blr-entity-effect { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; font-family: var(--font-sans); }
.blr-entity-effect-verb { color: var(--ui-text-muted); }
.blr-entity-effect-arrow { align-self: center; width: 0.75rem; height: 0.75rem; flex-shrink: 0; color: var(--ui-text-dimmed); }
</style>
