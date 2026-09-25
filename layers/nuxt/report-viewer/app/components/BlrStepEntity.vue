<script setup lang="ts">
/**
 * What one Step does to one Entity.
 *
 * This is the most specific thing the model says about an Entity, and the only
 * place it can be said: the Scenario's own `entityIds` is this set deduped, so
 * it answers *what* the reading touches and never *which Step does it*.
 *
 * Both ends of a move are authored on the Step — nothing is inferred from a
 * neighbour — so it reads `[Item] changed [Unread] → [Read]` exactly as
 * written. An alias tells two instances of one thing apart:
 * `Collection (source)`.
 *
 * The Entity comes first, as the shared chip that opens it — exactly as the
 * Step's Actor is drawn — and the effect follows outside it, so the same
 * phrase reads the same in a Step, Changes made here, Ends with and Leaves
 * behind. States are not resources, so they are badges, never second chips.
 * The facts a read or change cites follow as small marks; an end-state
 * summary says where a thing was left and names none.
 */
import type { AnyResourceView, EntityView, ReportWorkspace, ScenarioStepEntityView } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  mention: ScenarioStepEntityView
  /** An end-state summary states where a thing was left, not what a Step did. */
  outcome?: boolean
}>()

const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

const entity = computed<EntityView | undefined>(() => {
  const resource = resolveResource(props.workspace, 'entity', props.mention.entityId)
  return resource?.kind === 'entity' ? resource : undefined
})

/* A read is a mention, not a claim about what can alter the thing. It reads at
   a lower weight than a change so a row of both cannot be misread as a row of
   changes — absence of a read means nothing, and it must not look like it does. */
const isRead = computed(() => props.mention.effect === 'reads')

const label = computed(() => {
  const title = entity.value?.title ?? props.mention.entityId
  return props.mention.as ? `${title} (${props.mention.as})` : title
})

const facts = computed(() => props.outcome ? [] : props.mention.facts ?? [])

const description = computed(() => {
  const name = label.value
  if (props.mention.effect === 'reads') return `This Step reads ${name} without changing it`
  if (props.outcome) {
    if (props.mention.effect === 'removes') return `The Scenario ends ${name}`
    return props.mention.to
      ? `The Scenario leaves ${name} in "${props.mention.to}"`
      : `The Scenario changes ${name}`
  }
  if (props.mention.effect === 'removes') {
    return props.mention.from ? `This Step ends ${name}, which was "${props.mention.from}"` : `This Step ends ${name}`
  }
  if (props.mention.effect === 'creates') {
    return props.mention.to
      ? `This Step brings ${name} into being, in the state "${props.mention.to}"`
      : `This Step brings ${name} into being`
  }
  if (!props.mention.to) return `This Step changes ${name}`
  return `This Step moves ${name} from "${props.mention.from}" to "${props.mention.to}"`
})

const factsDescription = computed(() => facts.value.length
  ? `${description.value}; the facts it ${props.mention.effect === 'reads' ? 'reads' : 'edits'}: ${facts.value.join(', ')}`
  : description.value)
</script>

<template>
  <UTooltip :text="factsDescription" :delay-duration="150">
    <span class="blr-step-entity" :data-effect="mention.effect" data-step-entity>
      <BlrEntityChip v-if="entity" :entity="entity" :label="label" :muted="isRead" @select="emit('select', $event)" />
      <span v-else>{{ label }}</span>
      <BlrEntityEffect :mention="mention" :outcome="outcome" />
      <template v-if="facts.length">
        <span aria-hidden="true" class="text-dimmed">·</span>
        <BlrFactTag v-for="fact in facts" :key="fact" :name="fact" data-step-fact />
      </template>
    </span>
  </UTooltip>
</template>

<style scoped>
.blr-step-entity { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; font-family: var(--font-sans); }
</style>
