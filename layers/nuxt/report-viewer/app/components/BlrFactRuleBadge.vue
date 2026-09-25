<script setup lang="ts">
/**
 * The signal a fact carries on its Entity's Overview: what kind of claim one
 * Business Rule makes about it — who may read or change it, that no one may,
 * or a constraint it must satisfy — as one small badge. The claim itself is a
 * click away, in a popover, so a long list of facts stays a list of facts.
 */
import type { AnyResourceView, ReportWorkspace, RuleView } from '../utils/reportWorkspace'

const props = defineProps<{ workspace: ReportWorkspace, entityId: string, fact: string, rule: RuleView }>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
const open = ref(false)
const effect = computed(() => (props.rule.entityTargets.find(item => item.entityId === props.entityId && item.facts.includes(props.fact))
  ?? props.rule.entityTargets.find(item => item.entityId === props.entityId))?.effect ?? '')
const NOUNS: Record<string, string> = { reads: 'Read', changes: 'Change', creates: 'Creation', removes: 'Removal' }
const PAST: Record<string, string> = { reads: 'read', changes: 'changed', creates: 'created', removes: 'removed' }
const badge = computed(() => {
  if (props.rule.permits === null) return { icon: 'i-lucide-shield-check', label: 'Constraint' }
  if (props.rule.prohibits) return { icon: 'i-lucide-ban', label: PAST[effect.value] ? `Never ${PAST[effect.value]}` : 'Never touched' }
  return { icon: 'i-lucide-lock', label: NOUNS[effect.value] ? `${NOUNS[effect.value]} restricted` : 'Restricted' }
})
function select(resource: AnyResourceView) {
  open.value = false
  emit('select', resource)
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start', sideOffset: 4, collisionPadding: 12 }"
    :ui="{ content: 'blr-report-shell w-max max-w-[min(34rem,calc(100vw-1.5rem))] p-3' }">
    <button type="button" class="blr-chip cursor-pointer" :aria-label="`${badge.label}: ${rule.title}`" :aria-expanded="open" data-fact-rule-badge>
      <UIcon :name="badge.icon" class="size-3.5 shrink-0 text-muted" />{{ badge.label }}
    </button>
    <template #content>
      <BlrFactRule :workspace="workspace" :entity-id="entityId" :fact="fact" :rule="rule" @select="select" />
    </template>
  </UPopover>
</template>
