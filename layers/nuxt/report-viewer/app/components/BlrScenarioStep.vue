<script setup lang="ts">
/** A Scenario Step with named parts and explicit Entity effect phrases. */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { entityFacetOf, resolveResource } from '../utils/reportWorkspace'
import type { ScenarioStep } from '../utils/scenarioSteps'
import { stepActor, stepCapability, stepRoutes } from '../utils/scenarioSteps'

const props = defineProps<{ workspace: ReportWorkspace, scenario: ScenarioView, step: ScenarioStep, index: number }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const actor = computed(() => stepActor(props.workspace, props.step))
const capability = computed(() => stepCapability(props.workspace, props.scenario, props.step))
const routes = computed(() => stepRoutes(props.workspace, props.scenario, props.step))
const effects = computed(() => props.step.entities.map(mention => {
  const entity = resolveResource(props.workspace, 'entity', mention.entityId)
  const title = entity?.title ?? mention.entityId
  return { ...mention, entity, label: mention.as ? `${title} (${mention.as})` : title }
}))
const effectVerb = { creates: 'Creates', changes: 'Changes', removes: 'Removes', reads: 'Reads' } as const
const open = (key: string) => { const resource = props.workspace.byKey.get(key); if (resource) emit('open', resource) }
</script>

<template>
  <div class="blr-guided-step min-w-0 flex-1 overflow-hidden rounded-[0.625rem] border border-default bg-default" data-scenario-step>
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
            <BlrTopologyResource v-if="actor" :resource="actor" @open="open" />
            <span v-else>{{ step.actorId }}</span>
          </span>
        </dd>
      </div>

      <div v-if="effects.length" class="blr-guided-field">
        <dt>Entity effects</dt>
        <dd>
          <ul class="blr-guided-effects">
            <li v-for="(effect, position) in effects" :key="`${position}-${effect.entityId}-${effect.as}`" class="blr-guided-effect" :data-effect="effect.effect">
              <span class="blr-guided-verb">{{ effectVerb[effect.effect] }}</span>
              <button v-if="effect.entity" type="button" class="blr-topology-link" :aria-label="`Open Entity ${effect.label}`" @click="emit('open', effect.entity)">
                <BlrEntityMark :facet="entityFacetOf(effect.entity) ?? 'kept'" :acts="effect.entity.kind === 'entity' ? effect.entity.acts : undefined" size="xs" />
                <span>{{ effect.label }}</span>
              </button>
              <span v-else>{{ effect.label }}</span>
              <span v-if="effect.effect === 'reads'" class="blr-guided-cue">without changing it</span>
              <template v-else-if="effect.effect === 'creates' && effect.to">
                <span class="blr-guided-state-phrase"><span class="blr-guided-cue">in state</span><span class="blr-guided-state">{{ effect.to }}</span></span>
              </template>
              <template v-else-if="effect.effect === 'removes' && effect.from">
                <span class="blr-guided-state-phrase"><span class="blr-guided-cue">from state</span><span>{{ effect.from }}</span></span>
              </template>
              <template v-else-if="effect.effect === 'changes' && effect.from && effect.to">
                <span class="blr-guided-state-phrase"><span class="blr-guided-cue">from</span><span>{{ effect.from }}</span></span>
                <span class="blr-guided-state-phrase"><span class="blr-guided-cue">to</span><span class="blr-guided-state">{{ effect.to }}</span></span>
              </template>
            </li>
          </ul>
        </dd>
      </div>

      <div v-if="routes.length" class="blr-guided-field">
        <dt>Where</dt>
        <dd>
          <dl class="blr-guided-places">
            <div v-for="(route, position) in routes" :key="route.routeId" class="blr-guided-phrase">
              <dt>{{ route.routeName }}:</dt>
              <dd>
                <BlrTopologyResource v-if="route.place" :resource="route.place" @open="open" />
                <span v-else>{{ step.contexts[position]?.context.id }}</span>
              </dd>
            </div>
          </dl>
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
.blr-guided-field { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 0.375rem 1rem; align-items: start; min-width: 0; }
.blr-guided-field > dt { font-size: 0.75rem; font-weight: 600; color: var(--ui-text); }
.blr-guided-field > dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
.blr-guided-sentence { font-size: 0.875rem; font-weight: 600; color: var(--ui-text-highlighted); }
.blr-guided-who, .blr-guided-places, .blr-guided-effects { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.blr-guided-phrase, .blr-guided-effect { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.25rem 0.375rem; min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.blr-guided-state-phrase { display: inline-flex; align-items: flex-start; gap: 0.375rem; min-width: 0; max-width: 100%; }
.blr-guided-state-phrase > span { min-width: 0; overflow-wrap: anywhere; }
.blr-guided-state-phrase > .blr-guided-cue { flex-shrink: 0; white-space: nowrap; }
.blr-guided-cue, .blr-guided-places dt { color: var(--ui-text-muted); }
.blr-guided-places dd { min-width: 0; max-width: 100%; }
.blr-guided-verb, .blr-guided-state { font-weight: 500; color: var(--ui-text-highlighted); }
.blr-guided-effect[data-effect='reads'] { color: var(--ui-text-muted); }
.blr-guided-effect[data-effect='reads'] .blr-guided-verb { color: inherit; }
.blr-guided-step :deep(.blr-topology-link) { font-size: inherit; line-height: inherit; }
@container (max-width: 26rem) {
  .blr-guided-field { grid-template-columns: minmax(0, 1fr); gap: 0.125rem; }
  .blr-guided-fields { gap: 0.875rem; }
  .blr-guided-effects, .blr-guided-places { flex-direction: column; }
}
</style>
