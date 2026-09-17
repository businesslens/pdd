<script setup lang="ts">
import type { AnyResourceView, EntityArcView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'
import { lifecycleArcLabel } from '../utils/entityLifecycle'

const props = defineProps<{ workspace: ReportWorkspace, resource: EntityView, change: EntityArcView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const arc = computed(() => ({ ...props.change, ...lifecycleArcLabel(props.workspace, props.resource, props.resource.arcs.findIndex(item => item.key === props.change.key)) }))
function open(kind: 'capability' | 'rule', id: string) {
  const resource = resolveResource(props.workspace, kind, id)
  if (resource) emit('open', resource)
}
</script>

<template>
  <div class="space-y-4 text-sm" data-lifecycle-change-details>
    <div class="flex flex-wrap gap-2">
      <BlrResourceLink v-for="id in arc.capabilityIds" :key="id" :resource-key="`capability:${id}`" class="blr-chip" @open="open('capability', id)">
        <BlrKind kind="capability" :labelled="false" size="xs" />{{ resolveResource(workspace, 'capability', id)?.title ?? id }}
      </BlrResourceLink>
    </div>
    <p v-if="arc.effect === 'changes' && !arc.to" class="text-muted">This change has no specified states.</p>
    <div v-if="arc.forbiddenByRuleIds.length" class="space-y-1">
      <p class="font-medium text-highlighted">Forbidden by Rule</p>
      <BlrResourceLink v-for="id in arc.forbiddenByRuleIds" :key="id" :resource-key="`rule:${id}`" class="block underline decoration-dotted underline-offset-2" @open="open('rule', id)">{{ resolveResource(workspace, 'rule', id)?.title ?? id }}</BlrResourceLink>
    </div>
    <section v-if="arc.rules.length" class="space-y-2">
      <h4 class="blr-field">Who may make this change</h4>
      <ul class="space-y-3">
        <li v-for="rule in arc.rules" :key="rule.id">
          <BlrResourceLink :resource-key="`rule:${rule.id}`" class="font-medium text-highlighted underline decoration-dotted underline-offset-2" @open="open('rule', rule.id)">{{ rule.title }}</BlrResourceLink>
          <p class="mt-1 text-default">
            <template v-for="(grant, index) in rule.grants" :key="index">
              <span v-if="index" class="blr-meta"> or </span><span>{{ grant }}</span>
            </template>
          </p>
        </li>
      </ul>
      <p v-if="arc.rules.length > 1" class="blr-meta">Each Rule must permit it; within a Rule, any one grant does.</p>
    </section>
    <ul v-if="arc.coEffects.length" class="space-y-1 text-muted">
      <li v-for="co in arc.coEffects" :key="co">{{ co }}</li>
    </ul>
    <section v-if="arc.capabilityScenarioIds.length || arc.journeyScenarioIds.length" class="space-y-2">
      <h4 class="blr-field">Described by</h4>
      <BlrLinks :workspace="workspace" :ids="arc.capabilityScenarioIds" kind="capability-scenario" interactive @select="emit('open', $event)" />
      <BlrLinks :workspace="workspace" :ids="arc.journeyScenarioIds" kind="journey-scenario" interactive @select="emit('open', $event)" />
    </section>
  </div>
</template>
