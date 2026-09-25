<script setup lang="ts">
/**
 * One operation a Business Rule governs: the Entity's chip, then what is done
 * to it in the present with the Lifecycle's State badges, then the facts it
 * governs as the fact tags Steps and Screens use, then the places it is
 * narrowed to as the breadcrumb a Step's Where uses. The Entity is left out
 * where the page already is that Entity.
 */
import type { AnyResourceView, ContextView, ReportWorkspace } from '../utils/reportWorkspace'
import type { EntitySelectorLike } from '../utils/entityEffectPhrase'
import { resolveResource } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  target: EntitySelectorLike & { entityId: string, facts: string[] }
  /** The places the Rule narrows the target to, drawn as breadcrumbs. */
  contexts?: ContextView[]
  /** Their titles, where the row is itself a link and a breadcrumb cannot be. */
  places?: string[]
  entity?: boolean
  /** Inside a row that is itself a link: the Entity is drawn as its chip, not as a second link. */
  static?: boolean
}>(), { contexts: () => [], places: () => [], entity: true, static: false })
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const chip = computed(() => {
  const resource = resolveResource(props.workspace, 'entity', props.target.entityId)
  return resource?.kind === 'entity' ? resource : null
})
</script>

<template>
  <span class="blr-rule-operation" data-rule-operation>
    <template v-if="entity">
      <BlrEntityChip v-if="chip" :entity="chip" :static="static" @select="emit('select', $event)" />
      <span v-else class="text-default">{{ target.entityId }}</span>
    </template>
    <BlrEntityEffect :mention="target" selector />
    <template v-if="target.facts.length">
      <span aria-hidden="true" class="text-dimmed">·</span>
      <BlrFactTag v-for="fact in target.facts" :key="fact" :name="fact" />
    </template>
    <template v-if="contexts.length && !static">
      <span class="blr-rule-operation-detail">in</span>
      <BlrContextPlace v-for="context in contexts" :key="context.key" :workspace="workspace" :context="context" compact @select="emit('select', $event)" />
    </template>
    <span v-else-if="places.length" class="blr-rule-operation-detail">in {{ places.join(', ') }}</span>
  </span>
</template>

<style scoped>
.blr-rule-operation { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.5rem; min-width: 0; max-width: 100%; }
.blr-rule-operation-detail { color: var(--ui-text-muted); }
</style>
