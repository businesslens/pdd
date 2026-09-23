<script setup lang="ts">
/** A Scenario Step with named parts and explicit Entity effect phrases. */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import type { ScenarioStep } from '../utils/scenarioSteps'
import { stepActor, stepCapability } from '../utils/scenarioSteps'

const props = defineProps<{ workspace: ReportWorkspace, scenario: ScenarioView, step: ScenarioStep, index: number }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const actor = computed(() => {
  const resource = stepActor(props.workspace, props.step)
  return resource?.kind === 'entity' ? resource : undefined
})
const capability = computed(() => stepCapability(props.workspace, props.scenario, props.step))
const open = (key: string) => { const resource = props.workspace.byKey.get(key); if (resource) emit('open', resource) }
</script>

<template>
  <div class="blr-guided-step min-w-0 flex-1 overflow-hidden rounded-[0.625rem] border border-default bg-(--blr-bg-detail)" data-scenario-step>
    <dl class="blr-guided-fields">
      <div class="blr-guided-field blr-guided-action">
        <dt>{{ step.stepKind === 'condition' ? 'Condition' : 'Action' }}</dt>
        <dd class="blr-guided-sentence">{{ step.text }}</dd>
      </div>

      <div v-if="step.stepKind === 'product' || actor || step.actorId" class="blr-guided-field">
        <dt>Who</dt>
        <dd class="blr-guided-who">
          <span v-if="step.stepKind === 'product'" class="blr-guided-phrase"><span class="blr-guided-cue">Performed by</span><span>the Product</span></span>
          <span v-if="actor || step.actorId" class="blr-guided-phrase">
            <span class="blr-guided-cue">{{ step.stepKind === 'actor' ? 'Performed by' : step.stepKind === 'condition' ? 'Applies to' : 'For' }}</span>
            <BlrEntityChip v-if="actor" :entity="actor" @select="emit('open', $event)" />
            <span v-else>{{ step.actorId }}</span>
          </span>
        </dd>
      </div>

      <div v-if="step.entities.length" class="blr-guided-field">
        <dt>Entity effects</dt>
        <dd>
          <ul class="blr-guided-effects">
            <li v-for="(effect, position) in step.entities" :key="`${position}-${effect.entityId}-${effect.as}`" class="blr-guided-effect" :data-effect="effect.effect">
              <BlrStepEntity :workspace="workspace" :mention="effect" @select="emit('open', $event)" />
            </li>
          </ul>
        </dd>
      </div>

      <div v-if="step.contexts.length" class="blr-guided-field">
        <dt>Where</dt>
        <dd class="blr-guided-places">
          <BlrStepContext
            v-for="context in step.contexts"
            :key="context.routeId"
            :workspace="workspace"
            :context="context.context"
            @select="emit('open', $event)"
          />
        </dd>
      </div>

      <div v-if="capability" class="blr-guided-field">
        <dt>Capability</dt>
        <dd><BlrTopologyResource :resource="capability" @open="open" /></dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.blr-guided-step { container-type: inline-size; padding: 0.75rem 0.875rem; font-size: 0.8125rem; line-height: 1.6; color: var(--ui-text); }
.blr-guided-fields { display: grid; gap: 0.625rem; margin: 0; }
.blr-guided-field { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 0.375rem 1rem; align-items: baseline; min-width: 0; }
.blr-guided-field > dt { font-size: 0.75rem; font-weight: 600; color: var(--ui-text); }
.blr-guided-field > dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
.blr-guided-sentence { font-size: 0.875rem; font-weight: 600; color: var(--ui-text-highlighted); }
.blr-guided-who, .blr-guided-places, .blr-guided-effects { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.blr-guided-phrase, .blr-guided-effect { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.blr-guided-cue { color: var(--ui-text-muted); }
.blr-guided-effect[data-effect='reads'] { color: var(--ui-text-muted); }
.blr-guided-step :deep(.blr-topology-link) { font-size: inherit; line-height: inherit; }
@container (max-width: 26rem) {
  .blr-guided-field { grid-template-columns: minmax(0, 1fr); gap: 0.125rem; }
  .blr-guided-fields { gap: 0.875rem; }
  .blr-guided-effects, .blr-guided-places { flex-direction: column; }
}
</style>
