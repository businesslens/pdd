<script setup lang="ts">
/**
 * One grant of a permission, read from its parts rather than flattened into a
 * sentence: who — acting Entities as chips, a `related` path ("[Reader] who
 * owns it", or the format's own arrows past one hop), the thing itself, the
 * Product's schedule, whoever a settings Entity configures — then each
 * condition: a State as its badge, a fact as its Entity's chip, the fact, the
 * operator and the value. Keys within a grant hold together.
 */
import type { ReportGrant } from 'businesslens/report'
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  grant: ReportGrant
  /** The Rule's one Entity target, where it has exactly one: what "it" is. */
  targetId: string
}>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const entity = (id: string | null | undefined): EntityView | null => {
  const resource = id ? resolveResource(props.workspace, 'entity', id) : undefined
  return resource?.kind === 'entity' ? resource : null
}

/* Each hop keeps the direction the relation is declared in, as the format's own notation does. */
const path = computed(() => {
  let current = entity(props.targetId)
  return props.grant.related.map((segment) => {
    const direction = current?.relations.some(relation => relation.entityId === segment.entityId && relation.verb === segment.verb) ? 'forward'
      : current?.inboundRelations.some(relation => relation.entityId === segment.entityId && relation.verb === segment.verb) ? 'inverse' : 'either'
    current = entity(segment.entityId)
    return { ...segment, direction, resource: current }
  })
})
const OPERATORS: Record<string, string> = { over: 'over', under: 'under', 'at-least': 'at least', 'at-most': 'at most', is: 'is', 'is-not': 'is not', present: 'is present', absent: 'is absent' }
const conditions = computed(() => props.grant.when.map(condition => ({
  condition,
  subject: entity(condition.entityId ?? props.targetId),
  operator: condition.operator ? OPERATORS[condition.operator] ?? condition.operator : '',
  threshold: condition.value !== null && typeof condition.value === 'object' ? entity(condition.value.configuredByEntityId) : null,
  value: condition.value !== null && typeof condition.value !== 'object' ? String(condition.value) : ''
})))
</script>

<template>
  <div class="blr-rule-grant" data-rule-grant>
    <p class="blr-rule-grant-line">
      <template v-for="(id, index) in grant.actorIds" :key="`actor:${id}`">
        <span v-if="index" class="blr-rule-grant-word">or</span>
        <BlrEntityChip v-if="entity(id)" :entity="entity(id)!" @select="emit('select', $event)" />
        <span v-else>{{ id }}</span>
      </template>
      <template v-if="grant.related.length">
        <span v-if="grant.actorIds.length" class="blr-rule-grant-word">and</span>
        <!-- One hop reads as words; a longer path keeps the format's own arrows, where English would tangle. -->
        <span v-if="path.length === 1" class="blr-rule-grant-path" data-rule-grant-path>
          <span v-if="path[0]!.direction !== 'inverse'" class="blr-rule-grant-word">the</span>
          <BlrEntityChip v-if="path[0]!.resource" :entity="path[0]!.resource" @select="emit('select', $event)" />
          <span v-else>{{ path[0]!.entityId }}</span>
          <span class="blr-rule-grant-word">{{ path[0]!.direction === 'inverse' ? `who ${path[0]!.verb} it` : path[0]!.direction === 'forward' ? `it ${path[0]!.verb}` : `related to it by ${path[0]!.verb}` }}</span>
        </span>
        <span v-else class="blr-rule-grant-path" data-rule-grant-path>
          <span class="blr-rule-grant-word">it</span>
          <template v-for="(hop, index) in path" :key="`${index}:${hop.verb}`">
            <span class="blr-rule-grant-hop">{{ hop.direction === 'inverse' ? `←${hop.verb}—` : hop.direction === 'forward' ? `—${hop.verb}→` : `—${hop.verb}—` }}</span>
            <BlrEntityChip v-if="hop.resource" :entity="hop.resource" @select="emit('select', $event)" />
            <span v-else>{{ hop.entityId }}</span>
          </template>
        </span>
      </template>
      <template v-if="grant.self">
        <span v-if="grant.actorIds.length || grant.related.length" class="blr-rule-grant-word">and</span>
        <span class="blr-rule-grant-word">the</span>
        <BlrEntityChip v-if="entity(targetId)" :entity="entity(targetId)!" @select="emit('select', $event)" />
        <span class="blr-rule-grant-word">itself</span>
      </template>
      <template v-if="grant.unattended">
        <span v-if="grant.actorIds.length || grant.related.length || grant.self" class="blr-rule-grant-word">and</span>
        <span class="inline-flex items-center gap-1.5"><UIcon name="i-lucide-clock" class="size-3.5 shrink-0 text-muted" />the Product's own schedule</span>
      </template>
      <template v-if="grant.configuredByEntityId">
        <span v-if="grant.actorIds.length || grant.related.length || grant.self || grant.unattended" class="blr-rule-grant-word">and</span>
        <span class="blr-rule-grant-word">whoever</span>
        <BlrEntityChip v-if="entity(grant.configuredByEntityId)" :entity="entity(grant.configuredByEntityId)!" @select="emit('select', $event)" />
        <span class="blr-rule-grant-word">configures</span>
      </template>
    </p>
    <ul v-if="conditions.length" class="blr-rule-grant-conditions">
      <li v-for="(item, index) in conditions" :key="index" class="blr-rule-grant-line" data-rule-grant-condition>
        <span class="blr-rule-grant-word">{{ item.condition.state !== null ? 'while' : index ? 'and' : 'when' }}</span>
        <BlrEntityState v-if="item.condition.state !== null" :name="item.condition.state" />
        <template v-else>
          <BlrEntityChip v-if="item.subject" :entity="item.subject" @select="emit('select', $event)" />
          <span class="font-medium text-highlighted">{{ item.condition.fact }}</span>
          <span class="blr-rule-grant-word">{{ item.operator }}</span>
          <template v-if="item.threshold">
            <span class="blr-rule-grant-word">the</span>
            <BlrEntityChip :entity="item.threshold" @select="emit('select', $event)" />
            <span class="blr-rule-grant-word">threshold</span>
          </template>
          <span v-else-if="item.value" class="font-mono text-xs text-highlighted">{{ item.value }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.blr-rule-grant { display: grid; gap: 0.375rem; min-width: 0; }
.blr-rule-grant-line { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; margin: 0; min-width: 0; }
.blr-rule-grant-path { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.375rem; }
.blr-rule-grant-hop { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ui-text-muted); white-space: nowrap; }
.blr-rule-grant-word { color: var(--ui-text-muted); }
.blr-rule-grant-conditions { display: grid; gap: 0.25rem; margin: 0; padding: 0 0 0 0.25rem; list-style: none; }
</style>
