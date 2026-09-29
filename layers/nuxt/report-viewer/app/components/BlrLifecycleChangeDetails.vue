<script setup lang="ts">
/**
 * One change, read in the order its graph label wears it: what makes it, then
 * what describes it. The Rules governing it are read on the Steps they select,
 * never here — except a Rule forbidding the change, which no Capability makes.
 * Each part is headed and wears its badge's chip, so a reader who clicked a
 * badge finds that badge's part — the one `highlight` names, briefly marked.
 */
import type { AnyResourceView, EntityArcView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'
import { lifecycleArcCondition, lifecycleArcLabel, lifecycleConditionNote } from '../utils/entityLifecycle'
import { variationChoiceLabel } from '../utils/variations'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: EntityView
  change: EntityArcView
  /** The part the reader reached for from the graph label, marked for a moment. */
  highlight?: 'capability' | 'rule' | null
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const arc = computed(() => ({ ...props.change, ...lifecycleArcLabel(props.workspace, props.resource, props.resource.arcs.findIndex(item => item.key === props.change.key)) }))
/* Under which alternatives the change is made; its Scenarios are read grouped by them whenever any needs one. */
const condition = computed(() => lifecycleArcCondition(props.workspace, props.resource, props.change))
const grouped = computed(() => condition.value.groups.some(group => group.choices.length))
const idsOf = (resources: AnyResourceView[], kind: 'capability-scenario' | 'journey-scenario') => resources.filter(item => item.kind === kind).map(item => item.id)
function open(kind: 'capability' | 'rule', id: string) {
  const resource = resolveResource(props.workspace, kind, id)
  if (resource) emit('open', resource)
}
</script>

<template>
  <div class="space-y-4 text-sm" data-lifecycle-change-details>
    <p v-if="condition.conditional" class="flex items-center gap-1.5 font-medium text-highlighted" data-change-condition>
      <UIcon name="i-lucide-split" class="size-3.5 shrink-0" />{{ lifecycleConditionNote([condition]) }}
    </p>
    <section v-if="arc.capabilityIds.length" class="blr-change-part space-y-2" :class="highlight === 'capability' && 'is-highlighted'" data-change-part="capability">
      <h4 class="blr-field">Made through</h4>
      <div class="flex flex-wrap gap-2">
        <BlrResourceLink v-for="id in arc.capabilityIds" :key="id" :resource-key="`capability:${id}`" class="blr-chip" @open="open('capability', id)">
          <BlrKind kind="capability" :labelled="false" size="xs" class="shrink-0" /><span class="min-w-0 truncate">{{ resolveResource(workspace, 'capability', id)?.title ?? id }}</span>
        </BlrResourceLink>
      </div>
    </section>
    <p v-if="arc.effect === 'changes' && !arc.to" class="text-muted">This change has no specified states.</p>
    <section v-if="arc.forbiddenByRuleIds.length" class="blr-change-part space-y-2" :class="highlight === 'rule' && 'is-highlighted'" data-change-part="rule">
      <h4 class="blr-field">Forbidden by</h4>
      <div class="flex flex-wrap gap-2">
        <BlrResourceLink v-for="id in arc.forbiddenByRuleIds" :key="id" :resource-key="`rule:${id}`" class="blr-chip" @open="open('rule', id)">
          <BlrKind kind="rule" :labelled="false" size="xs" class="shrink-0" /><span class="min-w-0 truncate">{{ resolveResource(workspace, 'rule', id)?.title ?? id }}</span>
        </BlrResourceLink>
      </div>
    </section>
    <ul v-if="arc.coEffects.length" class="space-y-1 text-muted">
      <li v-for="co in arc.coEffects" :key="co">{{ co }}</li>
    </ul>
    <section v-if="arc.capabilityScenarioIds.length || arc.journeyScenarioIds.length" class="space-y-2">
      <h4 class="blr-field">Described by</h4>
      <template v-if="grouped">
        <div v-for="group in condition.groups" :key="group.key" class="space-y-1.5" data-change-group>
          <p class="flex items-center gap-1.5 text-xs font-medium text-muted">
            <UIcon v-if="group.choices.length" name="i-lucide-split" class="size-3 shrink-0" />{{ group.choices.length ? variationChoiceLabel(group.choices) : 'Always' }}
          </p>
          <BlrLinks :workspace="workspace" :ids="idsOf(group.resources, 'capability-scenario')" kind="capability-scenario" interactive @select="emit('open', $event)" />
          <BlrLinks :workspace="workspace" :ids="idsOf(group.resources, 'journey-scenario')" kind="journey-scenario" interactive @select="emit('open', $event)" />
        </div>
      </template>
      <template v-else>
        <BlrLinks :workspace="workspace" :ids="arc.capabilityScenarioIds" kind="capability-scenario" interactive @select="emit('open', $event)" />
        <BlrLinks :workspace="workspace" :ids="arc.journeyScenarioIds" kind="journey-scenario" interactive @select="emit('open', $event)" />
      </template>
    </section>
  </div>
</template>

<style scoped>
/* The part a graph badge reached for is marked for a moment, then settles. */
.blr-change-part {
  border-radius: 0.5rem;
  transition: background-color 400ms ease, box-shadow 400ms ease;
}
.blr-change-part.is-highlighted {
  background: color-mix(in srgb, var(--ui-primary) 10%, transparent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--ui-primary) 10%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .blr-change-part { transition: none; }
}
</style>
