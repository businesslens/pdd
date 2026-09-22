<script setup lang="ts">
/**
 * What one Step does to one Entity.
 *
 * This is the most specific thing the model says about an Entity, and the only
 * place it can be said: the Scenario's own `entityIds` is this set deduped, so
 * it answers *what* the reading touches and never *which Step does it*.
 *
 * Both ends of a move are authored on the Step — nothing is inferred from a
 * neighbour — so the chip reads `Unread → Read` exactly as written. An alias
 * tells two instances of one thing apart: `Collection (source)`.
 *
 * Drawn as a reference to a resource, exactly as the Step's Actor is — the
 * shared Entity chip, which opens it. States are not resources, so they stay
 * plain terminal readings inside the chip rather than second targets competing
 * with the first. The facts a read or change cites follow as small marks; an
 * end-state summary says where a thing was left and names none.
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

/* `changes` is the default and the ordinary case, so it is the one effect that
   costs no word — a label on every chip would separate nothing. */
const effectLabel = computed(() => ({
  creates: 'created',
  changes: '',
  removes: 'removed',
  /* Past participle, as the others are: the label says what happened to the
     thing, not what the Step does. "Collection reads" read as the Collection
     doing the reading. */
  reads: 'read'
}[props.mention.effect]))

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
  <UTooltip v-if="entity" :text="factsDescription" :delay-duration="150">
    <BlrEntityChip :entity="entity" :label="label" :muted="isRead" @select="emit('select', $event)">
      <span v-if="effectLabel" class="shrink-0 font-normal text-muted">{{ effectLabel }}</span>
      <template v-if="mention.to">
        <span v-if="mention.from && !outcome" class="min-w-0 truncate font-normal text-muted">{{ mention.from }}</span>
        <UIcon v-if="mention.from && !outcome" name="i-lucide-arrow-right" class="size-3 shrink-0 text-dimmed" />
        <span class="min-w-0 truncate text-default">{{ mention.to }}</span>
      </template>
      <span v-else-if="mention.from && !outcome" class="min-w-0 truncate font-normal text-muted">{{ mention.from }}</span>
      <template v-if="facts.length">
        <span aria-hidden="true" class="shrink-0 text-dimmed">·</span>
        <span v-for="fact in facts" :key="fact" class="shrink-0 rounded-sm bg-muted px-1 font-normal text-muted" data-step-fact>{{ fact }}</span>
      </template>
    </BlrEntityChip>
  </UTooltip>
</template>
