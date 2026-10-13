<script setup lang="ts">
/**
 * One expandable box for a Scenario's story, Entity results and ordered Steps.
 *
 * Alternative Scenarios of one Variation are one card: the Variation is its
 * title, the picker beside it names the Scenario being read and switches it in
 * place, and the condition that selects it leads the card.
 */
import type { AnyResourceView, EntityView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveResource } from '../utils/reportWorkspace'
import { scenarioTerm } from '../utils/vocabulary'
import { variationSetOf } from '../utils/variations'

const props = defineProps<{
  workspace: ReportWorkspace
  scenario: ScenarioView
  expanded: boolean
  /** True where the card holds every alternative of its set and switches between them. */
  switchable?: boolean
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], toggle: [], pick: [resource: AnyResourceView] }>()
const set = computed(() => variationSetOf(props.workspace, props.scenario))
const expansionId = useId()
const trigger = computed(() => props.scenario.trigger || props.scenario.lead)
const word = (name: 'trigger' | 'outcome') => scenarioTerm(props.scenario.scenarioType, name)
const entityOf = (id: string): EntityView | undefined => {
  const resource = resolveResource(props.workspace, 'entity', id)
  return resource?.kind === 'entity' ? resource : undefined
}
/* These are the Entities the Scenario only reads; changed instances already
   appear once above, with their last creation, change or removal. */
const reads = computed(() => props.scenario.readEntityIds.map(id => ({ id, entity: entityOf(id) })))
const detailLabel = computed(() => [
  props.scenario.decisionPoints.length ? `${props.scenario.decisionPoints.length} ${props.scenario.decisionPoints.length === 1 ? 'decision' : 'decisions'}` : '',
  props.scenario.edgeCases.length ? `${props.scenario.edgeCases.length} ${props.scenario.edgeCases.length === 1 ? 'edge case' : 'edge cases'}` : ''
].filter(Boolean).join(' · '))
const expansionLabel = computed(() => [
  `${props.scenario.steps.length} ${props.scenario.steps.length === 1 ? 'step' : 'steps'}`,
  detailLabel.value
].filter(Boolean).join(' · '))
</script>

<template>
  <div class="report-scenario-card min-w-0 overflow-hidden rounded-xl border border-default bg-default" data-scenario-card>
  <div class="report-scenario-summary hover:bg-elevated/40" data-scenario-summary>
    <div class="report-summary-header">
      <div class="report-summary-identity">
        <ReportKind :kind="set ? 'variation' : scenario.kind" :member-kind="set ? scenario.kind : undefined" :labelled="false" class="mt-0.5 shrink-0" />
        <div class="report-summary-heading">
          <h3 v-if="set" class="report-summary-title" data-scenario-title>
            <ReportResourceLink :resource-key="set.key" class="hover:underline" @open="emit('open', set)">{{ set.title }}</ReportResourceLink>
          </h3>
          <h3 v-else class="report-summary-title" data-scenario-title>{{ scenario.title }}</h3>
          <!-- The Scenario being read; its Steps are what differ between the alternatives. -->
          <ReportVariationPicker
            v-if="set"
            :workspace="workspace"
            :resource="scenario"
            :mode="switchable ? 'switch' : 'open'"
            @open="emit('open', $event)"
            @pick="emit('pick', $event)"
          />
          <UBadge v-if="scenario.kindName" color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
        </div>
      </div>
      <div class="report-summary-actions">
        <!-- Stretch this native button over the summary. Resource links and
             definitions sit above it, so they remain independent controls. -->
        <button
          type="button"
          class="report-summary-toggle"
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

    <dl v-if="set && scenario.variation" class="report-summary-selected" data-selected-when>
      <dt class="report-summary-label">Selected when</dt>
      <dd>{{ scenario.variation.selectedWhen }}</dd>
    </dl>

    <dl v-if="trigger || scenario.outcome || scenario.result" class="report-summary-story">
      <div v-if="trigger">
        <dt class="report-summary-label"><ReportTerm :slug="word('trigger')" text="Trigger" /></dt>
        <dd>{{ trigger }}</dd>
      </div>
      <div v-if="scenario.outcome || scenario.result">
        <dt class="report-summary-label report-summary-outcome-label">
          <ReportTerm :slug="word('outcome')" text="Outcome" />
          <span v-if="scenario.result" class="report-summary-result">{{ scenario.result === 'achieved' ? 'Goal achieved' : 'Goal not achieved' }}</span>
        </dt>
        <dd v-if="scenario.outcome">{{ scenario.outcome }}</dd>
      </div>
    </dl>

    <dl v-if="scenario.outcomeStates.length || reads.length" class="report-summary-entities">
      <div v-if="scenario.outcomeStates.length" class="report-summary-entity-row">
        <dt class="report-summary-label"><ReportTerm slug="ends-with" /></dt>
        <dd>
          <ul class="report-summary-endings">
            <li v-for="ending in scenario.outcomeStates" :key="`${ending.entityId}-${ending.as}`" class="report-summary-ending">
              <ReportStepEntity :workspace="workspace" :mention="ending" outcome @select="emit('open', $event)" />
            </li>
          </ul>
        </dd>
      </div>
      <div v-if="reads.length" class="report-summary-entity-row">
        <dt class="report-summary-label">Reads</dt>
        <dd class="report-summary-reads">
          <template v-for="read in reads" :key="read.id">
            <ReportEntityChip v-if="read.entity" :entity="read.entity" muted @select="emit('open', $event)" />
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
      <!-- The Scenario's own attachments: a Scenario is read only on its card. -->
      <div v-if="scenario.references.length" class="border-t border-muted p-4" data-scenario-references>
        <ReportRefs :references="scenario.references" :scope="JSON.stringify([workspace.identity.id, scenario.key])" />
      </div>
    </template>
  </div>
  </div>
</template>

<style scoped>
.report-scenario-summary { position: relative; container-type: inline-size; min-width: 0; padding: 1rem; font-size: 0.875rem; line-height: 1.6; color: var(--ui-text); transition: background-color 150ms; }
.report-summary-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.report-summary-toggle { display: inline-flex; align-items: center; gap: 0.375rem; min-height: 1.5rem; font-size: 0.75rem; color: var(--ui-text-muted); }
.report-summary-toggle::after { content: ''; position: absolute; inset: 0; z-index: 1; cursor: pointer; }
.report-summary-toggle:focus-visible { outline: none; }
.report-summary-toggle:focus-visible::after { outline: 2px solid var(--ui-primary); outline-offset: -3px; border-radius: 0.625rem; }
.report-scenario-summary :deep(button:not(.report-summary-toggle)),
.report-scenario-summary :deep(a) { position: relative; z-index: 2; }
.report-summary-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.report-summary-identity { display: flex; align-items: flex-start; gap: 0.75rem; min-width: 0; }
.report-summary-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem 0.625rem; min-width: 0; }
.report-summary-heading h3 { min-width: 0; }
.report-summary-title { min-width: 0; text-align: start; font-size: 1rem; font-weight: 600; line-height: 1.5; color: var(--ui-text-highlighted); overflow-wrap: anywhere; }
.report-summary-selected { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 0.25rem 1rem; margin-top: 0.75rem; align-items: baseline; }
.report-summary-selected dd { max-width: 75ch; color: var(--ui-text-muted); overflow-wrap: anywhere; }
.report-summary-story { display: grid; gap: 1rem 2rem; margin-top: 1rem; }
.report-summary-story > div { min-width: 0; }
.report-summary-label { font-size: 0.8125rem; font-weight: 600; color: var(--ui-text-highlighted); }
.report-summary-story dd { margin-top: 0.25rem; max-width: 75ch; overflow-wrap: anywhere; }
.report-summary-outcome-label { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; }
.report-summary-result { font-size: 0.75rem; font-weight: 400; color: var(--ui-text-muted); }
.report-summary-entities { display: grid; gap: 0.625rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--ui-border-muted); font-size: 0.875rem; }
.report-summary-entity-row { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 0.25rem 1rem; align-items: start; }
.report-summary-entity-row > dd { min-width: 0; }
.report-summary-endings, .report-summary-reads { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.report-summary-ending { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; min-width: 0; max-width: 100%; }
.report-summary-endings, .report-summary-reads { align-items: center; }
@container (min-width: 48rem) {
  .report-summary-story:has(> div:nth-child(2)) { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
}
@container (max-width: 26rem) {
  .report-summary-header { flex-wrap: wrap; gap: 0.625rem; }
  .report-summary-actions { margin-inline-start: auto; }
  .report-summary-entity-row, .report-summary-selected { grid-template-columns: minmax(0, 1fr); }
  .report-summary-endings { flex-direction: column; }
}
</style>
