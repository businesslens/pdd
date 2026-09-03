<script setup lang="ts">
/**
 * The Lifecycle tab of an Entity that declares States.
 *
 * States and the machine are read together here, apart from the Overview,
 * because they answer one question the Overview does not: how the thing
 * moves. The machine is drawn from every Scenario in the model — nothing on
 * the Entity says how it moves — the list under it carries what an edge label
 * cannot (who may, and what else the same Step does), and each state says what
 * actually leaves a thing in it.
 */
import type { AnyResourceView, EntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'
import { LIFECYCLE_RANK_GAP, LIFECYCLE_STATE_HEIGHT, buildEntityLifecycle, lifecycleArcLabel } from '../utils/entityLifecycle'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: EntityView
}>()

const emit = defineEmits<{ open: [resource: AnyResourceView] }>()

const states = computed(() => props.resource.states)
const lifecycle = computed(() => buildEntityLifecycle(props.workspace, props.resource))
/* The column's own height, so the machine draws at full size; a very long
   lifecycle fits by scaling rather than by growing without end. */
const canvasHeight = computed(() => Math.min(720, Math.max(280, lifecycle.value.nodes.length * (LIFECYCLE_STATE_HEIGHT + LIFECYCLE_RANK_GAP) + 96)))
const arcs = computed(() => props.resource.arcs.map((arc, index) => ({
  ...arc,
  ...lifecycleArcLabel(props.workspace, props.resource, index),
  ruleTitles: arc.ruleIds.map(id => resolveResource(props.workspace, 'rule', id)?.title ?? id),
  forbiddenBy: arc.forbiddenByRuleIds.map(id => resolveResource(props.workspace, 'rule', id)?.title ?? id)
})))
const prohibitions = computed(() => props.resource.prohibitions.map(prohibition => ({
  ...prohibition,
  ruleTitle: resolveResource(props.workspace, 'rule', prohibition.ruleId)?.title ?? prohibition.ruleId,
  operation: prohibition.effect === 'reads'
    ? 'read it'
    : prohibition.effect === 'creates'
      ? `create it${prohibition.to ? ` as ${prohibition.to}` : ''}`
      : prohibition.effect === 'removes'
        ? `remove it${prohibition.from ? ` from ${prohibition.from}` : ''}`
        : prohibition.from || prohibition.to
          ? `move it${prohibition.from ? ` from ${prohibition.from}` : ''}${prohibition.to ? ` to ${prohibition.to}` : ''}`
          : 'change it'
})))

function open(kind: 'capability' | 'rule', id: string) {
  const resource = resolveResource(props.workspace, kind, id)
  if (resource) emit('open', resource)
}
</script>

<template>
  <div class="min-w-0 space-y-6">
    <section class="space-y-3">
      <h2 class="blr-page-heading">
        Machine <span class="blr-meta ms-1">{{ states.length }} {{ states.length === 1 ? 'state' : 'states' }} · {{ arcs.length }} {{ arcs.length === 1 ? 'arc' : 'arcs' }}</span>
      </h2>
      <div
        v-if="lifecycle.edges.length"
        class="overflow-hidden rounded-xl border border-default bg-elevated/20"
        :style="{ height: `${canvasHeight}px` }"
      >
        <BlrFlowCanvas :nodes="lifecycle.nodes" :edges="lifecycle.edges" :fit-padding="0.2" :show-controls="false" />
      </div>
      <p v-else class="text-sm text-muted">No Step moves it between its states yet, so there is no machine to draw.</p>
      <ul v-if="arcs.length" class="space-y-1.5">
        <li
          v-for="arc in arcs"
          :key="arc.key"
          class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm"
          :class="arc.forbidden && 'border-dashed'"
        >
          <template v-if="arc.effect === 'creates'">
            <span class="blr-meta">created</span>
            <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-muted" />
            <span class="font-medium text-highlighted">{{ arc.to }}</span>
          </template>
          <template v-else-if="arc.effect === 'removes'">
            <span class="font-medium text-highlighted">{{ arc.from }}</span>
            <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-muted" />
            <span class="blr-meta">removed</span>
          </template>
          <template v-else-if="arc.to">
            <span class="font-medium text-highlighted">{{ arc.from }}</span>
            <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-muted" />
            <span class="font-medium text-highlighted">{{ arc.to }}</span>
          </template>
          <span v-else class="font-medium text-highlighted">information changed</span>
          <span class="blr-meta">·</span>
          <button
            v-for="id in arc.capabilityIds"
            :key="id"
            type="button"
            class="blr-chip"
            @click="open('capability', id)"
          >
            <UIcon name="i-lucide-zap" class="size-3.5" />{{ resolveResource(workspace, 'capability', id)?.title ?? id }}
          </button>
          <span v-if="arc.restriction" class="blr-meta" :title="arc.ruleTitles.join(', ')">· {{ arc.restriction }}</span>
          <span v-for="co in arc.coEffects" :key="co" class="blr-meta">· {{ co }}</span>
          <span v-if="arc.forbidden" class="blr-meta ms-auto text-primary" :title="arc.forbiddenBy.join(', ')">forbidden by Rule</span>
        </li>
      </ul>
      <!-- Prohibitions are arcs no Step draws, and notes are what the composition is missing. Neither is a fault. -->
      <ul v-if="prohibitions.length || resource.noCreation || resource.noTermination" class="space-y-1 blr-meta">
        <li v-for="prohibition in prohibitions" :key="`${prohibition.ruleId}-${prohibition.from}-${prohibition.to}`">
          <UIcon name="i-lucide-ban" class="me-1 inline size-3.5 align-text-bottom" />
          Nobody may {{ prohibition.operation }} —
          <button type="button" class="underline decoration-dotted underline-offset-2" @click="open('rule', prohibition.ruleId)">{{ prohibition.ruleTitle }}</button>
        </li>
        <li v-if="resource.noCreation">No Step creates it; its instances exist before the model begins.</li>
        <li v-if="resource.noTermination">No Step removes it.</li>
      </ul>
    </section>

    <section class="space-y-2">
      <h2 class="blr-page-heading">
        States <span class="blr-meta ms-1">{{ states.length }}</span>
      </h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="state in states"
          :key="state.name"
          class="rounded-xl border border-default bg-elevated/30 p-4"
          :class="!state.reached && 'border-dashed'"
        >
          <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
            {{ state.name }}
            <span v-if="!state.reached" class="blr-meta font-normal">unreached</span>
          </p>
          <BlrProse :text="state.content" class="mt-1.5" />
          <!--
            The machine says what a thing can be and the arcs say what moves it.
            Neither says what actually puts it here, which is the question a
            reader arrives at a state with.
          -->
          <div
            v-if="state.capabilityScenarioIds.length || state.journeyScenarioIds.length"
            class="mt-2.5 space-y-1.5"
          >
            <p class="blr-field">Left here by</p>
            <BlrLinks
              :workspace="workspace"
              :ids="state.capabilityScenarioIds"
              kind="capability-scenario"
              interactive
              @select="emit('open', $event)"
            />
            <BlrLinks
              :workspace="workspace"
              :ids="state.journeyScenarioIds"
              kind="journey-scenario"
              interactive
              @select="emit('open', $event)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
