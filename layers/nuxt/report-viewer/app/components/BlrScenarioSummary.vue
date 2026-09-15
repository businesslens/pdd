<script setup lang="ts">
/** One expandable box for a Scenario's story, Entity results and ordered Steps. */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf, resolveResource } from '../utils/reportWorkspace'
import { scenarioTerm } from '../utils/vocabulary'

const props = defineProps<{
  workspace: ReportWorkspace
  scenario: ScenarioView
  expanded: boolean
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], toggle: [] }>()
const expansionId = useId()
const trigger = computed(() => props.scenario.trigger || props.scenario.lead)
const word = (name: 'trigger' | 'outcome') => scenarioTerm(props.scenario.scenarioType, name)
const results = computed(() => props.scenario.outcomeStates.map(ending => {
  const entity = resolveResource(props.workspace, 'entity', ending.entityId)
  const title = entity?.title ?? ending.entityId
  const result = ending.effect === 'removes' ? 'Removed'
    : ending.effect === 'creates' ? (ending.to ? `Created in ${ending.to}` : 'Created')
      : ending.to ? `In state ${ending.to}` : 'Changed'
  return { ...ending, entity, label: ending.as ? `${title} (${ending.as})` : title, result }
}))
/* These are the Entities the Scenario only reads; changed instances already
   appear once above, with their last creation, change or removal. */
const reads = computed(() => props.scenario.readEntityIds.map(id => ({
  id, entity: resolveResource(props.workspace, 'entity', id)
})))
const detailLabel = computed(() => [
  props.scenario.decisionPoints.length ? `${props.scenario.decisionPoints.length} ${props.scenario.decisionPoints.length === 1 ? 'decision' : 'decisions'}` : '',
  props.scenario.edgeCases.length ? `${props.scenario.edgeCases.length} ${props.scenario.edgeCases.length === 1 ? 'edge case' : 'edge cases'}` : ''
].filter(Boolean).join(' · '))
const expansionLabel = computed(() => [
  `${props.scenario.steps.length} ${props.scenario.steps.length === 1 ? 'step' : 'steps'}`,
  detailLabel.value
].filter(Boolean).join(' · '))
const open = (key: string) => { const resource = props.workspace.byKey.get(key); if (resource) emit('open', resource) }
</script>

<template>
  <div class="blr-scenario-card min-w-0 overflow-hidden rounded-xl border border-default bg-default" data-scenario-card>
  <div class="blr-scenario-summary hover:bg-elevated/40" data-scenario-summary>
    <div class="blr-summary-header">
      <div class="blr-summary-identity">
        <BlrKind :kind="scenario.kind" :labelled="false" class="mt-0.5 shrink-0" />
        <div class="blr-summary-heading">
          <h3 class="blr-summary-title">{{ scenario.title }}</h3>
          <UBadge v-if="scenario.kindName" color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
        </div>
      </div>
      <div class="blr-summary-actions">
        <!-- Stretch this native button over the summary. Resource links and
             definitions sit above it, so they remain independent controls. -->
        <button
          type="button"
          class="blr-summary-toggle"
          :aria-expanded="expanded"
          :aria-controls="expansionId"
          :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${ENTITY_KIND_META[scenario.kind].label} ${scenario.title}, ${expansionLabel}`"
          @click="emit('toggle')"
        >
          <span>{{ expansionLabel }}</span>
          <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 transition-transform" :class="expanded && 'rotate-180'" />
        </button>
      </div>
    </div>

    <dl v-if="trigger || scenario.outcome || scenario.result" class="blr-summary-story">
      <div v-if="trigger">
        <dt class="blr-summary-label"><BlrTerm :slug="word('trigger')" text="Trigger" /></dt>
        <dd>{{ trigger }}</dd>
      </div>
      <div v-if="scenario.outcome || scenario.result">
        <dt class="blr-summary-label blr-summary-outcome-label">
          <BlrTerm :slug="word('outcome')" text="Outcome" />
          <span v-if="scenario.result" class="blr-summary-result">{{ scenario.result === 'achieved' ? 'Goal achieved' : 'Goal not achieved' }}</span>
        </dt>
        <dd v-if="scenario.outcome">{{ scenario.outcome }}</dd>
      </div>
    </dl>

    <dl v-if="results.length || reads.length" class="blr-summary-entities">
      <div v-if="results.length" class="blr-summary-entity-row">
        <dt class="blr-summary-label"><BlrTerm slug="ends-with" /></dt>
        <dd>
          <ul class="blr-summary-endings">
            <li v-for="ending in results" :key="`${ending.entityId}-${ending.as}`" class="blr-summary-ending">
              <button v-if="ending.entity" type="button" class="blr-topology-link" :aria-label="`Open Entity ${ending.label}`" @click="emit('open', ending.entity)">
                <BlrEntityMark :facet="entityFacetOf(ending.entity) ?? 'kept'" :acts="ending.entity.kind === 'entity' ? ending.entity.acts : undefined" size="xs" />
                <span>{{ ending.label }}</span>
              </button>
              <span v-else>{{ ending.label }}</span>
              <span class="blr-summary-ending-result">{{ ending.result }}</span>
            </li>
          </ul>
        </dd>
      </div>
      <div v-if="reads.length" class="blr-summary-entity-row">
        <dt class="blr-summary-label">Reads</dt>
        <dd class="blr-summary-reads">
          <template v-for="read in reads" :key="read.id">
            <BlrTopologyResource v-if="read.entity" :resource="read.entity" @open="open" />
            <span v-else>{{ read.id }}</span>
          </template>
        </dd>
      </div>
    </dl>

  </div>
  <div v-show="expanded" :id="expansionId" class="border-t border-muted" data-scenario-content>
    <template v-if="expanded">
      <div class="p-4" data-scenario-steps><slot /></div>
      <div v-if="detailLabel" class="border-t border-muted p-4 space-y-4" data-scenario-details><slot name="details" /></div>
    </template>
  </div>
  </div>
</template>

<style scoped>
.blr-scenario-summary { position: relative; container-type: inline-size; min-width: 0; padding: 1rem; font-size: 0.875rem; line-height: 1.6; color: var(--ui-text); transition: background-color 150ms; }
.blr-summary-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.blr-summary-toggle { display: inline-flex; align-items: center; gap: 0.375rem; min-height: 1.5rem; font-size: 0.75rem; color: var(--ui-text-muted); }
.blr-summary-toggle::after { content: ''; position: absolute; inset: 0; z-index: 1; cursor: pointer; }
.blr-summary-toggle:focus-visible { outline: none; }
.blr-summary-toggle:focus-visible::after { outline: 2px solid var(--ui-primary); outline-offset: -3px; border-radius: 0.625rem; }
.blr-scenario-summary :deep(button:not(.blr-summary-toggle)) { position: relative; z-index: 2; }
.blr-summary-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.blr-summary-identity { display: flex; align-items: flex-start; gap: 0.75rem; min-width: 0; }
.blr-summary-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem 0.625rem; min-width: 0; }
.blr-summary-heading h3 { min-width: 0; }
.blr-summary-title { min-width: 0; text-align: start; font-size: 1rem; font-weight: 600; line-height: 1.5; color: var(--ui-text-highlighted); overflow-wrap: anywhere; }
.blr-summary-story { display: grid; gap: 1rem 2rem; margin-top: 1rem; }
.blr-summary-story > div { min-width: 0; }
.blr-summary-label { font-size: 0.8125rem; font-weight: 600; color: var(--ui-text-highlighted); }
.blr-summary-story dd { margin-top: 0.25rem; max-width: 75ch; overflow-wrap: anywhere; }
.blr-summary-outcome-label { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; }
.blr-summary-result { font-size: 0.75rem; font-weight: 400; color: var(--ui-text-muted); }
.blr-summary-entities { display: grid; gap: 0.625rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--ui-border-muted); font-size: 0.875rem; }
.blr-summary-entity-row { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 0.25rem 1rem; align-items: start; }
.blr-summary-entity-row > dd { min-width: 0; }
.blr-summary-endings, .blr-summary-reads { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.blr-summary-ending { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.25rem 0.5rem; min-width: 0; max-width: 100%; }
.blr-summary-ending-result { color: var(--ui-text-muted); overflow-wrap: anywhere; }
.blr-summary-entities :deep(.blr-topology-link) { font-size: inherit; line-height: inherit; }
@container (min-width: 48rem) {
  .blr-summary-story:has(> div:nth-child(2)) { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
}
@container (max-width: 26rem) {
  .blr-summary-header { flex-wrap: wrap; gap: 0.625rem; }
  .blr-summary-actions { margin-inline-start: auto; }
  .blr-summary-entity-row { grid-template-columns: minmax(0, 1fr); }
  .blr-summary-endings { flex-direction: column; }
}
</style>
