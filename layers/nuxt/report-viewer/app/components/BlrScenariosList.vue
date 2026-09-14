<script setup lang="ts">
/**
 * A parent's Scenarios as rows that open to their Steps.
 *
 * An audition beside the Scenarios tab, in the grammar every collection now
 * uses: one row per Scenario, laid out one to four per line, opening in place
 * to its Steps in authored order. Two drawings of the Steps are auditioned:
 * `cards`, each Step with explicit field labels, and `table`, one row per
 * Step and one column per fact — what it says,
 * what kind of Step it is, who acts, which Capability it exercises, what it
 * does to which Entities, and where each route reaches it — so every piece of
 * information has a labelled place to sit.
 */
import type { AnyResourceView, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, entityFacetOf, resolveResource, resourceKey } from '../utils/reportWorkspace'
import { childrenOf } from '../utils/pageSections'
import { COLUMN_CHOICES } from '../composables/useColumns'
import type { ColumnChoice } from '../composables/useColumns'
import { scenarioTerm } from '../utils/vocabulary'

const props = withDefaults(defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView, steps?: 'cards' | 'table' }>(), { steps: 'cards' })
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()

const scenarios = computed(() => childrenOf(props.workspace, props.resource) as ScenarioView[])
const scenarioKind = computed(() => props.resource.kind === 'journey' ? 'journey-scenario' as const : 'capability-scenario' as const)

/* Which Scenarios are open to their Steps, and which show their further
   details — decisions and edge cases — inside the card. Both start closed, as
   rows do everywhere else. */
const openScenarios = ref<string[]>([])
const openDetails = ref<string[]>([])
const isOpen = (scenario: ScenarioView) => openScenarios.value.includes(scenario.key)
const detailsOpen = (scenario: ScenarioView) => openDetails.value.includes(scenario.key)
const hasDetails = (scenario: ScenarioView) => scenario.decisionPoints.length > 0 || scenario.edgeCases.length > 0
function toggleScenario(scenario: ScenarioView) {
  openScenarios.value = isOpen(scenario) ? openScenarios.value.filter(key => key !== scenario.key) : [...openScenarios.value, scenario.key]
}
function toggleDetails(scenario: ScenarioView) {
  openDetails.value = detailsOpen(scenario) ? openDetails.value.filter(key => key !== scenario.key) : [...openDetails.value, scenario.key]
}
function toggleAll(open: boolean) {
  openScenarios.value = open ? scenarios.value.map(item => item.key) : []
  openDetails.value = open ? scenarios.value.filter(hasDetails).map(item => item.key) : []
}

const { columnsFor, setColumns } = useColumns()
const columns = computed(() => columnsFor(scenarioKind.value, 1))
const columnItems = COLUMN_CHOICES.map(value => ({ value, label: `${value} per row` }))
const rowGrid = computed(() => columns.value > 1
  ? { display: 'grid', gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`, gap: '0.5rem', alignItems: 'start' }
  : undefined)

/* What a Step is read by: the Capability it exercises where it has one, else
   what kind of Step it is. */
const STEP_KIND_LABEL = { actor: 'Actor action', product: 'Product action', condition: 'Condition' } as const
const capabilityOf = (step: ScenarioView['steps'][number]) => step.capabilityId ? resolveResource(props.workspace, 'capability', step.capabilityId) : undefined
const actorOf = (step: ScenarioView['steps'][number]) => step.actorId ? resolveResource(props.workspace, 'entity', step.actorId) : undefined
const actorActs = (step: ScenarioView['steps'][number]) => { const actor = actorOf(step); return actor?.kind === 'entity' ? actor.acts ?? undefined : undefined }
function routesOf(scenario: ScenarioView, step: ScenarioView['steps'][number]) {
  return step.contexts.map(context => ({
    routeId: context.routeId,
    routeName: scenario.routes.find(route => route.id === context.routeId)?.name ?? context.routeId,
    place: props.workspace.byKey.get(resourceKey(context.context.kind, context.context.id))
  }))
}
const summary = (scenario: ScenarioView) => scenario.trigger || scenario.lead
/* The vocabulary slug for a Scenario word, as the page resolves it. */
const scenarioWord = (word: 'trigger' | 'outcome' | 'decision-point' | 'edge-case') =>
  scenarioTerm(scenarioKind.value === 'journey-scenario' ? 'journey' : 'capability', word)

/* The table: its columns exist only where some Step fills them. */
type Step = ScenarioView['steps'][number]
const STEP_KIND_ICON = { actor: 'i-lucide-hand', product: 'i-lucide-cog', condition: 'i-lucide-circle-dot-dashed' } as const
const contextLabel = (context: { screenTitle: string, experienceTitle: string, interfaceTitle: string }) =>
  context.screenTitle || context.experienceTitle || context.interfaceTitle
const placeOf = (context: { kind: 'interface' | 'experience' | 'screen', id: string }) => props.workspace.byKey.get(resourceKey(context.kind, context.id))
function tableOf(scenario: ScenarioView) {
  const steps = scenario.steps
  const routes = scenario.routes.filter(route => steps.some(step => step.contexts.some(context => context.routeId === route.id)))
  const cell = (step: Step, routeId: string) => step.contexts.find(context => context.routeId === routeId)?.context
  return {
    routes,
    actors: steps.some(step => actorOf(step)),
    /* Only a Journey Step names a Capability; a Capability Scenario's Steps
       carry their parent on the wire, which the row above already says. */
    capabilities: scenario.scenarioType === 'journey' && steps.some(step => capabilityOf(step)),
    entities: steps.some(step => step.entities.length),
    rows: steps.map((step, index) => ({
      step,
      index,
      cells: routes.map((route) => {
        const context = cell(step, route.id)
        /* The last earlier Step this route reached somewhere: a change of place is worth a note. */
        const previous = steps.slice(0, index).reverse().map(item => cell(item, route.id)).find(Boolean)
        return { routeId: route.id, routeName: route.name, context, movedFrom: context && previous && previous.id !== context.id ? contextLabel(previous) : '' }
      })
    }))
  }
}
</script>

<template>
  <p v-if="!scenarios.length" class="text-sm text-muted italic">
    No Scenarios name this {{ ENTITY_KIND_META[resource.kind].label }}.
  </p>
  <div v-else class="space-y-3" data-scenarios-v2>
    <!-- The same controls a collection wears: open and close everything, and
         how many rows share a line. -->
    <div class="flex flex-wrap items-center justify-end gap-2">
      <UFieldGroup size="md">
        <UTooltip text="Expand all">
          <UButton icon="i-lucide-chevrons-up-down" color="neutral" variant="outline" aria-label="Expand all" @click="toggleAll(true)" />
        </UTooltip>
        <UTooltip text="Collapse all">
          <UButton icon="i-lucide-chevrons-down-up" color="neutral" variant="outline" aria-label="Collapse all" @click="toggleAll(false)" />
        </UTooltip>
      </UFieldGroup>
      <USelect
        :model-value="columns"
        :items="columnItems"
        value-key="value"
        size="md"
        variant="outline"
        class="w-36"
        icon="i-lucide-layout-grid"
        aria-label="Rows per line"
        @update:model-value="setColumns(scenarioKind, $event as ColumnChoice)"
      />
    </div>

    <div class="space-y-2" :style="rowGrid">
      <div v-for="scenario in scenarios" :key="scenario.key" class="blr-row-tree" :data-row-key="scenario.key">
        <!-- The cards drawing: the Scenario itself is read on the card, open
             or closed — what starts it, how it ends, what it touches and where
             it leaves each thing. Opening it adds only the Steps. -->
        <BlrScenarioSummary
          v-if="steps === 'cards'"
          :workspace="workspace"
          :scenario="scenario"
          :expanded="isOpen(scenario)"
          :details-expanded="detailsOpen(scenario)"
          @toggle="toggleScenario(scenario)"
          @details="toggleDetails(scenario)"
          @open="emit('open', $event)"
        >
          <template #details>
            <section v-if="scenario.decisionPoints.length" class="space-y-2">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('decision-point')" text="Decision points" /> <span class="blr-meta">{{ scenario.decisionPoints.length }}</span></h3>
              <div class="grid gap-3 lg:grid-cols-2">
                <div v-for="point in scenario.decisionPoints" :key="point.title" class="rounded-xl border border-dashed border-accented p-4">
                  <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
                    <UIcon name="i-lucide-git-branch" class="size-4 text-muted" />{{ point.title }}
                  </p>
                  <BlrProse :text="point.question" class="mt-2" />
                  <ul class="mt-3 space-y-2">
                    <li v-for="branch in point.branches" :key="branch.condition" class="flex items-start gap-2 text-sm">
                      <code class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-highlighted">{{ branch.condition }}</code>
                      <UIcon name="i-lucide-arrow-right" class="mt-1 size-3 shrink-0 text-dimmed" />
                      <span class="text-default">{{ branch.outcome }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
            <section v-if="scenario.edgeCases.length" class="space-y-1">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('edge-case')" text="Edge cases" /> <span class="blr-meta">{{ scenario.edgeCases.length }}</span></h3>
              <ul class="max-w-3xl space-y-1.5 text-sm text-default">
                <li v-for="edgeCase in scenario.edgeCases" :key="edgeCase" class="flex gap-2">
                  <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
                </li>
              </ul>
            </section>
          </template>
        </BlrScenarioSummary>
        <BlrResourceCard
          v-else
          :workspace="workspace"
          :resource="scenario"
          :stacked="columns > 1"
          expandable
          :open="isOpen(scenario)"
          :count="scenario.steps.length"
          unit="step"
          hook-label="Trigger"
          :hook="summary(scenario)"
          @open="emit('open', $event)"
          @toggle="toggleScenario(scenario)"
        />
        <div v-if="isOpen(scenario)" :class="steps === 'table' ? 'blr-row-children' : 'mt-3 ms-1'">
          <!-- The table drawing keeps the Scenario's own facts around its
               Steps; the cards drawing already said them on the card, and its
               Steps hang from one line as the Composition drew them. -->
          <div :class="steps === 'table' ? 'space-y-5 rounded-[0.625rem] border border-default bg-elevated/20 p-4' : 'space-y-4'" :data-scenario-facts="steps === 'table' ? '' : undefined">
            <template v-if="steps === 'table'">
              <div v-if="scenario.entityIds.length || scenario.readEntityIds.length" class="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
                <BlrLinks :workspace="workspace" :ids="scenario.entityIds" kind="entity" label="Changes" interactive @select="emit('open', $event)" />
                <BlrLinks :workspace="workspace" :ids="scenario.readEntityIds" kind="entity" label="Reads" interactive @select="emit('open', $event)" />
              </div>
              <section v-if="scenario.trigger" class="space-y-1">
                <h3 class="blr-field"><BlrTerm :slug="scenarioWord('trigger')" text="Trigger" /></h3>
                <BlrProse :text="scenario.trigger" class="max-w-3xl" />
              </section>
            </template>

          <div v-if="steps === 'table'" class="overflow-hidden rounded-[0.625rem] border border-default bg-default" data-scenario-steps>
            <table class="blr-steps-table">
              <!-- Fixed layout: the narrow columns take their width, the wide
                   ones share the rest, and nothing pushes past the page. -->
              <colgroup>
                <col style="width: 2.75rem">
                <col>
                <col style="width: 9rem">
                <col v-if="tableOf(scenario).actors" style="width: 8.5rem">
                <col v-if="tableOf(scenario).capabilities" style="width: 11rem">
                <col v-if="tableOf(scenario).entities">
                <col v-if="tableOf(scenario).routes.length" style="width: 12rem">
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Step</th>
                  <th scope="col">Kind</th>
                  <th v-if="tableOf(scenario).actors" scope="col">Actor</th>
                  <th v-if="tableOf(scenario).capabilities" scope="col">Capability</th>
                  <th v-if="tableOf(scenario).entities" scope="col">Entities</th>
                  <th v-if="tableOf(scenario).routes.length" scope="col">Where</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tableOf(scenario).rows" :key="row.index" :data-step="row.index + 1">
                  <td>{{ row.index + 1 }}</td>
                  <td class="blr-steps-text font-semibold text-highlighted">{{ row.step.text }}</td>
                  <td>
                    <span class="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-xs text-muted">
                      <UIcon :name="STEP_KIND_ICON[row.step.stepKind]" class="size-3.5 shrink-0" />{{ STEP_KIND_LABEL[row.step.stepKind] }}
                    </span>
                  </td>
                  <td v-if="tableOf(scenario).actors">
                    <BlrTopologyResource v-if="actorOf(row.step)" :resource="actorOf(row.step)!" @open="emit('open', workspace.byKey.get($event)!)" />
                  </td>
                  <td v-if="tableOf(scenario).capabilities">
                    <BlrTopologyResource v-if="capabilityOf(row.step)" :resource="capabilityOf(row.step)!" @open="emit('open', workspace.byKey.get($event)!)" />
                  </td>
                  <td v-if="tableOf(scenario).entities" class="blr-steps-wrap">
                    <span v-if="row.step.entities.length" class="flex flex-wrap gap-1.5">
                      <BlrStepEntity
                        v-for="mention in row.step.entities"
                        :key="`${mention.effect}-${mention.entityId}-${mention.as}`"
                        :workspace="workspace"
                        :mention="mention"
                        @select="emit('open', $event)"
                      />
                    </span>
                  </td>
                  <!-- Routes stack, one under the other, so the table never
                       scrolls sideways: a route names itself, then its place. -->
                  <td v-if="tableOf(scenario).routes.length" class="blr-steps-wrap">
                    <div v-if="row.cells.some(cell => cell.context)" class="space-y-2">
                      <template v-for="cell in row.cells" :key="cell.routeId">
                        <div v-if="cell.context">
                          <span class="mb-0.5 flex items-center gap-1.5 text-xs text-dimmed"><UIcon name="i-lucide-git-fork" class="size-3" />{{ cell.routeName }}</span>
                          <!-- The place itself, as the Composition drew it; the full path is one click away on its page. -->
                          <BlrTopologyResource v-if="placeOf(cell.context)" :resource="placeOf(cell.context)!" @open="emit('open', workspace.byKey.get($event)!)" />
                          <span v-if="cell.movedFrom" class="mt-0.5 block font-mono text-xs text-dimmed">↳ from {{ cell.movedFrom }}</span>
                        </div>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ol v-else class="blr-steps-list">
          <li v-for="(step, index) in scenario.steps" :key="index" :data-step="index + 1">
            <span class="blr-steps-number">{{ index + 1 }}</span>
            <BlrScenarioStep :workspace="workspace" :scenario="scenario" :step="step" :index="index" @open="emit('open', $event)" />
          </li>
          </ol>

            <section v-if="steps === 'table' && scenario.decisionPoints.length" class="space-y-2">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('decision-point')" text="Decision points" /> <span class="blr-meta">{{ scenario.decisionPoints.length }}</span></h3>
              <div class="grid gap-3 lg:grid-cols-2">
                <div v-for="point in scenario.decisionPoints" :key="point.title" class="rounded-xl border border-dashed border-accented p-4">
                  <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
                    <UIcon name="i-lucide-git-branch" class="size-4 text-muted" />{{ point.title }}
                  </p>
                  <BlrProse :text="point.question" class="mt-2" />
                  <ul class="mt-3 space-y-2">
                    <li v-for="branch in point.branches" :key="branch.condition" class="flex items-start gap-2 text-sm">
                      <code class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-highlighted">{{ branch.condition }}</code>
                      <UIcon name="i-lucide-arrow-right" class="mt-1 size-3 shrink-0 text-dimmed" />
                      <span class="text-default">{{ branch.outcome }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
            <section v-if="steps === 'table' && (scenario.outcome || scenario.outcomeStates.length)" class="space-y-1">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('outcome')" text="Outcome" /></h3>
              <BlrProse v-if="scenario.outcome" :text="scenario.outcome" class="max-w-3xl" />
              <div v-if="scenario.outcomeStates.length" class="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1">
                <span class="blr-field"><BlrTerm slug="ends-with" /></span>
                <BlrStepEntity v-for="ending in scenario.outcomeStates" :key="`${ending.entityId}-${ending.as}`" :workspace="workspace" :mention="ending" outcome @select="emit('open', $event)" />
              </div>
            </section>
            <section v-if="steps === 'table' && scenario.edgeCases.length" class="space-y-1">
              <h3 class="blr-field"><BlrTerm :slug="scenarioWord('edge-case')" text="Edge cases" /> <span class="blr-meta">{{ scenario.edgeCases.length }}</span></h3>
              <ul class="max-w-3xl space-y-1.5 text-sm text-default">
                <li v-for="edgeCase in scenario.edgeCases" :key="edgeCase" class="flex gap-2">
                  <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
