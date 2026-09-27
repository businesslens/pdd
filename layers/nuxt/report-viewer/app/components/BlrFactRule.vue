<script setup lang="ts">
/**
 * What one Business Rule says about one fact an Entity keeps, opened from the
 * fact's badge: who alone may read or change it, and where; that no one ever may;
 * or, for a Rule that grants nothing, its statement — a derivation or an
 * invariant. The Rule's chip closes the line as its source.
 */
import type { AnyResourceView, ReportWorkspace, RuleView } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace, entityId: string, fact: string, rule: RuleView }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const target = computed(() => props.rule.entityTargets.find(item => item.entityId === props.entityId && item.facts.includes(props.fact))
  ?? props.rule.entityTargets.find(item => item.entityId === props.entityId))
const VERBS: Record<string, string> = { reads: 'Read', changes: 'Changed', creates: 'Created', removes: 'Removed' }
const verb = computed(() => VERBS[target.value?.effect ?? ''] ?? '')
const claim = computed(() => {
  if (props.rule.permits === null) return ''
  if (props.rule.prohibits) return verb.value ? `Never ${verb.value.toLowerCase()}` : 'Never touched'
  return verb.value ? `${verb.value} only by` : 'Only by'
})
const targetId = computed(() => props.rule.entityTargets.length === 1 ? props.rule.entityTargets[0]!.entityId : '')
</script>

<template>
  <div class="blr-fact-rule" data-fact-rule>
    <div v-if="rule.variation" class="basis-full space-y-2"><strong>Applies conditionally</strong><BlrVariationUsage :workspace="workspace" :resource="rule" @open="emit('select', $event)" /></div>
    <template v-if="rule.permits !== null">
      <span class="blr-fact-rule-claim">{{ claim }}</span>
      <template v-if="!rule.prohibits">
        <template v-for="(grant, index) in rule.permits" :key="index">
          <span v-if="index" class="blr-fact-rule-claim">or</span>
          <BlrRuleGrant :workspace="workspace" :grant="grant" :target-id="targetId" @select="emit('select', $event)" />
        </template>
      </template>
      <template v-if="target?.contexts.length">
        <span class="blr-fact-rule-claim">in</span>
        <BlrContextPlace v-for="context in target.contexts" :key="context.key" :workspace="workspace" :context="context" compact hide-interface @select="emit('select', $event)" />
      </template>
    </template>
    <span v-else class="text-default">{{ rule.statement }}</span>
    <BlrResourceLink :resource-key="rule.key" class="blr-chip" :aria-label="`Business Rule: ${rule.title}`" @open="emit('select', rule)">
      <BlrKind kind="rule" :labelled="false" size="xs" class="shrink-0" /><span class="min-w-0 truncate">{{ rule.title }}</span>
    </BlrResourceLink>
  </div>
</template>

<style scoped>
.blr-fact-rule { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; min-width: 0; font-size: 0.8125rem; }
.blr-fact-rule-claim { color: var(--ui-text-muted); }
</style>
