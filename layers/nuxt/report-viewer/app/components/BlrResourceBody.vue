<script setup lang="ts">

import type {
  AnyResourceView,
  CapabilityView,
  JourneyView,
  ReportWorkspace,
  RuleView,
  ScenarioStepCell,
  ScenarioStepRow,
  ScenarioView,
  EntityView,
  ScreenView
} from '../utils/reportWorkspace'
import { isScenarioKind, resolveResource, scenarioStepMatrix } from '../utils/reportWorkspace'
import { scenarioTerm } from '../utils/vocabulary'
import { joinStateMoves } from '../utils/entityEffectPhrase'
import { hasAuthoredBody } from '../utils/pageSections'
import {
  SCENARIO_ROUTE_INLINE_WIDTH,
  scenarioRouteCapacity,
  scenarioRouteColumnCount,
  scenarioRouteWindow
} from '../utils/scenarioRouteWindow'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
}>()

const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

/* The host may bind these into its URL. With no host binding they remain local
   component state, which keeps the report layer usable on its own. */
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const asScreen = computed(() => props.resource as ScreenView)
const asEntity = computed(() => props.resource as EntityView)
const asCapability = computed(() => props.resource as CapabilityView)
const asJourney = computed(() => props.resource as JourneyView)
const asScenario = computed(() => props.resource as ScenarioView)
const asRule = computed(() => props.resource as RuleView)
const isScenario = computed(() => isScenarioKind(props.resource.kind))

/* The resolved Entity behind an id, for the shared chip that names it. */
function entityChip(id: string) {
  const resource = resolveResource(props.workspace, 'entity', id)
  return resource?.kind === 'entity' ? resource : undefined
}

/* Trigger, Outcome and the rest are explained once per Scenario type, and a
   reader on a Journey Scenario asking what a Trigger is means that one. */
const scenarioWord = (word: 'trigger' | 'outcome' | 'route' | 'decision-point' | 'edge-case') =>
  scenarioTerm(asScenario.value.scenarioType, word)

/* DELIVERY: what is available in this container, and on which Screen. The
   model holds it once — availability on the Capability, capabilities on the
   Screen — and this is the same fact read from the place's side. */

/* PRESENTS: each Entity with the facts on screen. A bare entry names the Entity alone. */
const presents = computed(() => props.resource.kind !== 'screen'
  ? []
  : asScreen.value.entities.map(entry => ({
      ...entry,
      entity: entityChip(entry.entityId),
      title: resolveResource(props.workspace, 'entity', entry.entityId)?.title ?? entry.entityId
    })))


function openRule(id: string) {
  const rule = resolveResource(props.workspace, 'rule', id)
  if (rule) emit('select', rule)
}
const factRuleTitles = (ruleIds: string[]) =>
  ruleIds.map(id => resolveResource(props.workspace, 'rule', id)?.title ?? id).join(', ')

/* One line per Entity a Capability touches, never a lifecycle fragment each. */
const capabilityEffects = computed(() => props.resource.kind !== 'capability'
  ? []
  : asCapability.value.entityEffects.map(line => ({
      ...line,
      title: resolveResource(props.workspace, 'entity', line.entityId)?.title ?? line.entityId,
      /* Moves that meet join into one run, so no State is named twice in a row. */
      effects: joinStateMoves(line.effects)
    })))

/* The Entities a Capability only reads, as one row beneath the changes; and
   how many of its Scenarios — its own, or a Journey's Steps naming it — read
   any of them, counted the way each change row counts its Scenarios. */
const capabilityReads = computed(() => props.resource.kind !== 'capability'
  ? []
  : asCapability.value.readEntityIds.map(id => ({ id, entity: entityChip(id) })))
const readScenarioCount = computed(() => {
  if (props.resource.kind !== 'capability' || !capabilityReads.value.length) return 0
  const capabilityId = asCapability.value.id
  const readIds = new Set(capabilityReads.value.map(read => read.id))
  return props.workspace.scenarios.filter(scenario => scenario.steps.some(step =>
    (scenario.scenarioType === 'journey' ? step.capabilityId : scenario.capabilityId) === capabilityId
    && step.entities.some(entry => entry.effect === 'reads' && readIds.has(entry.entityId)))).length
})
/* One authored Scenario sequence, with named Context routes as columns. */
const stepMatrix = computed(() => (isScenario.value ? scenarioStepMatrix(asScenario.value) : null))

/* Route columns are a window over authored order. Measure the reading itself:
   a rail and the Scenario split can leave little room inside a wide viewport. */
const routeShellEl = ref<HTMLElement | null>(null)
const routeShellWidth = ref(0)

watch(routeShellEl, (resource, _previous, onCleanup) => {
  if (!resource || typeof ResizeObserver === 'undefined') return
  const measure = () => { routeShellWidth.value = resource.getBoundingClientRect().width }
  const observer = new ResizeObserver(([entry]) => {
    if (entry) routeShellWidth.value = entry.contentRect.width
  })
  measure()
  observer.observe(resource)
  onCleanup(() => observer.disconnect())
}, { immediate: true })

const routeCapacity = computed(() => scenarioRouteCapacity(
  routeShellWidth.value,
  stepMatrix.value?.routes.length ?? 0
))

const visibleRouteCount = computed(() => scenarioRouteColumnCount(
  routeShellWidth.value,
  stepMatrix.value?.routes.length ?? 0,
  routeColumns.value
))

const routeInline = computed(() => routeShellWidth.value > 0
  && routeShellWidth.value < SCENARIO_ROUTE_INLINE_WIDTH)

const visibleRouteWindow = computed(() => scenarioRouteWindow(
  stepMatrix.value?.routes ?? [],
  scenarioRoute.value,
  visibleRouteCount.value
))

const visibleRoutes = computed(() => visibleRouteWindow.value.routes)
const visibleRouteIds = computed(() => new Set(visibleRoutes.value.map(route => route.id)))

const visibleCells = (step: ScenarioStepRow): ScenarioStepCell[] =>
  step.cells.filter(cell => visibleRouteIds.value.has(cell.routeId))

const selectedCell = (step: ScenarioStepRow): ScenarioStepCell | undefined => visibleCells(step)[0]

const routeItems = computed(() => (stepMatrix.value?.routes ?? []).map(route => ({
  label: route.name,
  value: route.id,
  icon: 'i-lucide-split'
})))

const routeWindowItems = computed(() => {
  const routes = stepMatrix.value?.routes ?? []
  const count = visibleRouteCount.value
  const lastStart = Math.max(0, routes.length - count)
  return routes.slice(0, lastStart + 1).map((route, index) => ({
    value: route.id,
    label: routes.slice(index, index + count).map(item => item.name).join(' · '),
    icon: 'i-lucide-split'
  }))
})

const routeColumnItems = computed(() => [
  { label: `Auto (${routeCapacity.value})`, value: 'auto' },
  ...Array.from({ length: routeCapacity.value }, (_, index) => ({
    label: `${index + 1} ${index ? 'routes' : 'route'}`,
    value: String(index + 1)
  }))
])

function setRouteWindow(startId: string) {
  const normalized = scenarioRouteWindow(
    stepMatrix.value?.routes ?? [],
    startId,
    visibleRouteCount.value
  )
  scenarioRoute.value = normalized.routes[0]?.id ?? null
}

function moveRouteWindow(delta: number) {
  const routes = stepMatrix.value?.routes ?? []
  const next = routes[visibleRouteWindow.value.start + delta]
  if (next) setRouteWindow(next.id)
}

async function setRouteColumnPreference(value: string) {
  routeColumns.value = value
  await nextTick()
  const first = visibleRouteWindow.value.routes[0]
  if (first) scenarioRoute.value = first.id
}

/**
 * Both Scenario types use the same named-route model and the same table.
 */
const stepMeta = computed(() => {
  const matrix = stepMatrix.value
  const stepCount = asScenario.value.steps.length
  const steps = `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}`
  if (!matrix) return steps
  return `${steps} · ${matrix.routes.length} ${matrix.routes.length === 1 ? 'route' : 'routes'}`
})

/* These name a kind of Step, not a resource, so none wears a resource's mark:
   `user-round` is the Person facet and `cpu` the System facet, and an Actor Step
   can be performed by either. */
const stepKindIcon = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'i-lucide-hand',
  product: 'i-lucide-cog',
  condition: 'i-lucide-circle-dot-dashed'
})[kind]

const stepKindLabel = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'Actor action',
  product: 'Product action',
  condition: 'Condition'
})[kind]

const stepKindDescription = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'Performed by the named Actor',
  product: 'Performed by the Product — for the named Actor, when one is named',
  condition: 'An observable fact or state; nobody performs it'
})[kind]

/*
 * A Step that changes thirteen things must not fill its row with thirteen
 * chips. The overflow names the rest rather than hiding them — where this
 * reading omits, it says where the omitted material is.
 */
const STEP_MENTION_LIMIT = 4
const shownMentions = (step: ScenarioStepRow) => step.mentions.slice(0, STEP_MENTION_LIMIT)
const restMentions = (step: ScenarioStepRow) => step.mentions
  .slice(STEP_MENTION_LIMIT)
  .map(mention => resolveResource(props.workspace, 'entity', mention.entityId)?.title ?? mention.entityId)

const stepActor = (actorId: string | undefined): EntityView | undefined => {
  if (!actorId) return undefined
  const resource = resolveResource(props.workspace, 'entity', actorId)
  return resource?.kind === 'entity' && resource.acts ? resource : undefined
}

const contextLabel = (context: { screenTitle: string, experienceTitle: string, interfaceTitle: string }) =>
  context.screenTitle || context.experienceTitle || context.interfaceTitle

/**
 * The operation a permission's grants permit, where the Rule selects exactly
 * one: "change Collection to Published". Otherwise the heading stays "Who may"
 * and the Applies to tab says what is selected.
 */
const permittedOperation = computed(() => {
  if (props.resource.kind !== 'rule' || asRule.value.appliesTo.length !== 1) return ''
  const [target] = asRule.value.appliesTo
  if (target?.type !== 'entity') return ''
  const verbs: Record<string, string> = { creates: 'create', changes: 'change', removes: 'remove', reads: 'read' }
  const entity = resolveResource(props.workspace, 'entity', target.entityId)
  return [
    target.effect ? verbs[target.effect] ?? target.effect : 'act on',
    entity?.title ?? target.entityId,
    target.facts.length ? `(${target.facts.join(', ')})` : '',
    target.from ? `from ${target.from}` : '',
    target.to ? `to ${target.to}` : ''
  ].filter(Boolean).join(' ')
})

/** True when this component would render nothing at all. One predicate, shared
    with the page composer, so the two can never disagree about a kind again. */
const empty = computed(() => !hasAuthoredBody(props.resource))
</script>

<template>
  <div v-if="!empty" class="space-y-10">
    <!--
      A Rule's lead is its statement; what it applies to is its own tab.
      Permission is a kind of Rule, and its grants restate the statement in
      structured form, so they follow it here under a heading naming the
      operation they permit. They are read back as sentences so a reader who
      never saw the format can tell one is wrong; an empty list is a claim of
      its own, and says so.
    -->
    <section v-if="resource.kind === 'rule' && asRule.permits !== null" class="space-y-2" data-rule-grants>
      <h2 class="blr-page-heading"><BlrTerm slug="who-may" :text="permittedOperation ? `Who may ${permittedOperation}` : undefined" /></h2>
      <p v-if="asRule.prohibits" class="rounded-lg border border-dashed border-accented px-3.5 py-3 text-sm text-default">
        <UIcon name="i-lucide-ban" class="me-1.5 inline size-4 align-text-bottom text-muted" />
        Nobody. This operation is forbidden to everyone.
      </p>
      <ul v-else class="space-y-1.5">
        <li
          v-for="(grant, index) in asRule.grants"
          :key="index"
          class="flex items-start gap-2 rounded-lg border border-default bg-elevated/25 px-3.5 py-2.5 text-sm text-default"
        >
          <UIcon name="i-lucide-key-round" class="mt-0.5 size-4 shrink-0 text-muted" />
          <span>{{ grant.sentence }}</span>
        </li>
      </ul>
      <p v-if="asRule.grants.length > 1" class="blr-meta">Any one grant permits it. Every Rule selecting the same operation must also permit it.</p>
    </section>

    <section v-if="resource.kind === 'rule' && asRule.rationale" class="space-y-2">
      <h2 class="blr-page-heading">Rationale</h2>
      <BlrProse :text="asRule.rationale" class="max-w-3xl" />
    </section>

    <section v-if="resource.intent" class="space-y-2">
      <h2 class="blr-page-heading"><BlrTerm slug="intent" /></h2>
      <BlrProse :text="resource.intent" class="max-w-3xl" />
    </section>

    <section v-if="resource.kind === 'journey'" class="space-y-2">
      <h2 class="blr-page-heading"><BlrTerm slug="success-criterion" /></h2>
      <BlrProse :text="asJourney.successCriterion" class="max-w-3xl" />
      <!-- What the achieved paths leave behind — derived from their last Step
           naming each thing, beside the prose that says it in words. -->
      <div v-if="asJourney.leavesBehind.length" class="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1">
        <span class="blr-field"><BlrTerm slug="leaves-behind" /></span>
        <BlrStepEntity
          v-for="ending in asJourney.leavesBehind"
          :key="`${ending.entityId}-${ending.as}`"
          :workspace="workspace"
          :mention="ending"
          outcome
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <!-- CAPABILITY: what it does to each thing, one line per Entity. -->
    <section v-if="resource.kind === 'capability' && (capabilityEffects.length || capabilityReads.length)" class="space-y-2">
      <h2 class="blr-page-heading">
        <BlrTerm slug="operation" text="What it changes" />
        <span class="blr-meta ms-1">{{ capabilityEffects.length + (capabilityReads.length ? 1 : 0) }}</span>
      </h2>
      <ul class="space-y-1.5">
        <li
          v-for="line in capabilityEffects"
          :key="line.entityId"
          class="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm"
        >
          <BlrEntityChip v-if="entityChip(line.entityId)" :entity="entityChip(line.entityId)!" @select="emit('select', $event)" />
          <span v-else class="text-default">{{ line.title }}</span>
          <template v-for="(effect, index) in line.effects" :key="`${effect.effect}-${(effect.path ?? [effect.from, effect.to]).join('>')}`">
            <span v-if="index" aria-hidden="true" class="text-dimmed">·</span>
            <BlrEntityEffect :mention="effect" />
          </template>
          <span class="blr-meta ms-auto">{{ line.scenarioIds.length }} {{ line.scenarioIds.length === 1 ? 'Scenario' : 'Scenarios' }}</span>
        </li>
        <!-- Reads share the list's shape: one left edge, the chips first, the
             reading where the changes put theirs. Dashed, so a row of reads
             is never mistaken for a row of changes. -->
        <li
          v-if="capabilityReads.length"
          class="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm"
          data-capability-reads
        >
          <template v-for="read in capabilityReads" :key="read.id">
            <BlrEntityChip v-if="read.entity" :entity="read.entity" muted @select="emit('select', $event)" />
            <span v-else class="text-default">{{ read.id }}</span>
          </template>
          <BlrEntityEffect :mention="{ effect: 'reads', from: '', to: '' }" />
          <span v-if="readScenarioCount" class="blr-meta ms-auto">{{ readScenarioCount }} {{ readScenarioCount === 1 ? 'Scenario' : 'Scenarios' }}</span>
        </li>
      </ul>
    </section>

    <!-- SCENARIO: the ordered reading, in the order it happens. -->
    <template v-if="isScenario">
      <!--
        What the reading is about, before the prose that says it in words.
        Changes and reads stay separate rows: one answers what can alter a
        thing and the other never does, and a single merged row would quietly
        promote every read into the first answer.
      -->
      <section
        v-if="asScenario.entityIds.length || asScenario.readEntityIds.length"
        class="flex flex-wrap items-baseline gap-x-6 gap-y-1.5"
      >
        <BlrLinks
          :workspace="workspace"
          :ids="asScenario.entityIds"
          kind="entity"
          label="Changes"
          interactive
          @select="emit('select', $event)"
        />
        <BlrLinks
          :workspace="workspace"
          :ids="asScenario.readEntityIds"
          kind="entity"
          label="Reads"
          interactive
          @select="emit('select', $event)"
        />
      </section>

      <section class="space-y-2">
        <h2 class="blr-page-heading"><BlrTerm :slug="scenarioWord('trigger')" text="Trigger" /></h2>
        <BlrProse :text="asScenario.trigger" size="base" class="max-w-3xl" />
      </section>

      <!-- One authored Scenario sequence: meaning and Contexts stay together. -->
      <section v-if="stepMatrix" ref="routeShellEl" class="space-y-3">
        <header class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 class="blr-page-heading">
            <BlrTerm slug="step" text="Steps" />
            <span class="blr-meta ms-1">{{ stepMeta }}</span>
          </h2>

          <!-- A narrow reading chooses one route. A wider reading pages an
               authored-order window and lets the reader choose its width. -->
          <div v-if="stepMatrix.routes.length > 1" class="ms-auto flex min-w-0 flex-wrap items-center gap-1.5">
            <template v-if="routeInline">
              <span class="blr-field me-1"><BlrTerm :slug="scenarioWord('route')" text="Route" /></span>
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="visibleRouteWindow.start === 0"
                aria-label="Show previous route"
                @click="moveRouteWindow(-1)"
              />
              <USelect
                :model-value="visibleRoutes[0]?.id"
                :items="routeItems"
                value-key="value"
                size="sm"
                variant="outline"
                icon="i-lucide-split"
                class="min-w-44 max-w-full"
                aria-label="Route to show"
                @update:model-value="setRouteWindow(String($event))"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="visibleRouteWindow.end >= stepMatrix.routes.length"
                aria-label="Show next route"
                @click="moveRouteWindow(1)"
              />
              <span class="blr-meta whitespace-nowrap">
                {{ visibleRouteWindow.start + 1 }} of {{ stepMatrix.routes.length }}
              </span>
            </template>

            <template v-else>
              <template v-if="routeWindowItems.length > 1">
                <span class="blr-field me-1"><BlrTerm :slug="scenarioWord('route')" text="Routes" /></span>
                <UButton
                  icon="i-lucide-chevron-left"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="visibleRouteWindow.start === 0"
                  aria-label="Show previous route"
                  @click="moveRouteWindow(-1)"
                />
                <USelect
                  :model-value="visibleRoutes[0]?.id"
                  :items="routeWindowItems"
                  value-key="value"
                  size="sm"
                  variant="outline"
                  icon="i-lucide-split"
                  class="w-48 max-w-full"
                  aria-label="Visible route window"
                  @update:model-value="setRouteWindow(String($event))"
                />
                <UButton
                  icon="i-lucide-chevron-right"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="visibleRouteWindow.end >= stepMatrix.routes.length"
                  aria-label="Show next route"
                  @click="moveRouteWindow(1)"
                />
                <span class="blr-meta whitespace-nowrap">
                  {{ visibleRouteWindow.start + 1 }}–{{ visibleRouteWindow.end }} of {{ stepMatrix.routes.length }}
                </span>
              </template>
              <span class="blr-field" :class="routeWindowItems.length > 1 && 'ms-2'">Show</span>
              <USelect
                :model-value="routeColumns === 'auto' ? 'auto' : String(visibleRouteCount)"
                :items="routeColumnItems"
                value-key="value"
                size="sm"
                variant="outline"
                class="min-w-28"
                aria-label="Number of route columns"
                @update:model-value="setRouteColumnPreference(String($event))"
              />
            </template>
          </div>
        </header>

        <!-- Wide reading: one fluid Step column and the chosen route window. -->
        <div v-if="!routeInline" class="overflow-hidden rounded-xl border border-default">
          <table class="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col :style="{ width: visibleRoutes.length === 1 ? '42%' : '300px' }">
              <col v-for="route in visibleRoutes" :key="route.id">
            </colgroup>
            <thead>
              <tr class="border-b border-default bg-elevated/35">
                <th
                  context="col"
                  class="blr-field border-e border-default px-4 py-2.5 font-normal"
                >
                  Step
                </th>
                <th
                  v-for="route in visibleRoutes"
                  :key="route.id"
                  context="col"
                  class="min-w-0 px-4 py-2.5"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <UTooltip text="Named route — one way this Scenario can run" :delay-duration="150">
                      <UIcon name="i-lucide-split" class="size-3.5 shrink-0 text-dimmed" />
                    </UTooltip>
                    <span class="truncate text-xs font-medium text-default" :title="route.name">{{ route.name }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="step in stepMatrix.steps"
                :key="step.index"
                class="border-b border-default align-top last:border-b-0"
              >
                <th
                  context="row"
                  class="border-e border-default bg-default px-4 py-3 font-normal"
                >
                  <div class="blr-numbered-step">
                  <span class="blr-numbered-step__number">{{ step.index + 1 }}.</span>
                  <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">{{ step.text }}</p>

                  <span class="blr-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <template v-if="stepActor(step.actorId)">
                      <UTooltip v-if="step.stepKind !== 'actor'" :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                        <span class="inline-flex items-center gap-1.5">
                          <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                          {{ stepKindLabel(step.stepKind) }}
                        </span>
                      </UTooltip>
                      <span v-if="step.stepKind !== 'actor'">for</span>
                      <BlrEntityChip :entity="stepActor(step.actorId)!" @select="emit('select', $event)" />
                      <UTooltip v-if="step.stepKind === 'actor'" :text="stepKindDescription('actor')" :delay-duration="150">
                        <span>action</span>
                      </UTooltip>
                    </template>
                    <UTooltip v-else :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                      <span class="inline-flex items-center gap-1.5">
                        <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                        {{ stepKindLabel(step.stepKind) }}
                      </span>
                    </UTooltip>
                    <BlrStepEntity
                      v-for="mention in shownMentions(step)"
                      :key="`${mention.effect}-${mention.entityId}-${mention.as}`"
                      :workspace="workspace"
                      :mention="mention"
                      @select="emit('select', $event)"
                    />
                    <UTooltip
                      v-if="restMentions(step).length"
                      :text="restMentions(step).join(', ')"
                      :delay-duration="150"
                    >
                      <span class="blr-meta rounded-full border border-dashed border-muted px-2 py-0.5">
                        +{{ restMentions(step).length }}
                      </span>
                    </UTooltip>
                  </span>
                  <BlrLinks
                    v-if="asScenario.scenarioType === 'journey' && step.capabilityId"
                    :workspace="workspace"
                    :ids="[step.capabilityId]"
                    kind="capability"
                    label="Capability"
                    interactive
                    @select="emit('select', $event)"
                  />
                  </div>
                  </div>
                </th>
                <td
                  v-if="step.routeNeutral"
                  :colspan="visibleRoutes.length"
                  class="px-4 py-3 align-middle"
                >
                  <UTooltip
                    text="This Step is shared by every route and is not assigned to an Interface, Experience, or Screen"
                    :delay-duration="150"
                  >
                    <p class="blr-meta flex items-center gap-1.5">
                      <UIcon name="i-lucide-align-justify" class="size-3.5" />
                      No Context — same Step on every route
                    </p>
                  </UTooltip>
                </td>
                <td
                  v-for="cell in step.routeNeutral ? [] : visibleCells(step)"
                  :key="cell.routeId"
                  class="min-w-0 px-4 py-3"
                >
                  <UTooltip
                    v-if="cell.contextChanged && cell.previousContext"
                    text="This route continues in a different Context than its previous contextualized Step"
                    :delay-duration="150"
                  >
                    <p class="blr-meta mb-1.5 flex items-center gap-1 text-primary">
                      <UIcon name="i-lucide-corner-down-right" class="size-3" />
                      Moved from {{ contextLabel(cell.previousContext) }}
                    </p>
                  </UTooltip>
                  <BlrStepContext
                    v-if="cell.context"
                    :workspace="workspace"
                    :context="cell.context"
                    @select="emit('select', $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Narrow reading: preserve the ordered Steps and put the selected
             route's Context beneath each one. -->
        <div v-else class="divide-y divide-default overflow-hidden rounded-xl border border-default">
          <article v-for="step in stepMatrix.steps" :key="step.index">
            <div class="bg-default px-4 py-3">
              <div class="blr-numbered-step">
              <span class="blr-numbered-step__number">{{ step.index + 1 }}.</span>
              <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted">{{ step.text }}</p>

              <span class="blr-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <template v-if="stepActor(step.actorId)">
                  <UTooltip v-if="step.stepKind !== 'actor'" :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                    <span class="inline-flex items-center gap-1.5">
                      <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                      {{ stepKindLabel(step.stepKind) }}
                    </span>
                  </UTooltip>
                  <span v-if="step.stepKind !== 'actor'">for</span>
                  <BlrEntityChip :entity="stepActor(step.actorId)!" @select="emit('select', $event)" />
                  <UTooltip v-if="step.stepKind === 'actor'" :text="stepKindDescription('actor')" :delay-duration="150">
                    <span>action</span>
                  </UTooltip>
                </template>
                <UTooltip v-else :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                    {{ stepKindLabel(step.stepKind) }}
                  </span>
                </UTooltip>
                <BlrStepEntity
                  v-for="mention in shownMentions(step)"
                  :key="`${mention.effect}-${mention.entityId}-${mention.as}`"
                  :workspace="workspace"
                  :mention="mention"
                  @select="emit('select', $event)"
                />
                <UTooltip
                  v-if="restMentions(step).length"
                  :text="restMentions(step).join(', ')"
                  :delay-duration="150"
                >
                  <span class="blr-meta rounded-full border border-dashed border-muted px-2 py-0.5">
                    +{{ restMentions(step).length }}
                  </span>
                </UTooltip>
              </span>
              <BlrLinks
                v-if="asScenario.scenarioType === 'journey' && step.capabilityId"
                :workspace="workspace"
                :ids="[step.capabilityId]"
                kind="capability"
                label="Capability"
                interactive
                @select="emit('select', $event)"
              />
              </div>
              </div>
            </div>

            <div class="border-t border-muted bg-elevated/20 px-4 py-3">
              <UTooltip
                v-if="step.routeNeutral"
                text="This Step is shared by every route and is not assigned to an Interface, Experience, or Screen"
                :delay-duration="150"
              >
                <p class="blr-meta flex items-center gap-1.5">
                  <UIcon name="i-lucide-align-justify" class="size-3.5" />
                  No Context — same Step on every route
                </p>
              </UTooltip>

              <template v-else-if="selectedCell(step)">
                <p
                  v-if="selectedCell(step)?.contextChanged && selectedCell(step)?.previousContext"
                  class="blr-meta mb-2 flex items-center gap-1 text-primary"
                >
                  <UIcon name="i-lucide-corner-down-right" class="size-3" />
                  Moved from {{ contextLabel(selectedCell(step)!.previousContext!) }}
                </p>
                <BlrStepContext
                  v-if="selectedCell(step)?.context"
                  :workspace="workspace"
                  :context="selectedCell(step)!.context!"
                  compact
                  @select="emit('select', $event)"
                />
              </template>
            </div>
          </article>
        </div>
      </section>

      <section v-if="asScenario.decisionPoints.length" class="space-y-3">
        <h2 class="blr-page-heading">
          <BlrTerm :slug="scenarioWord('decision-point')" text="Decision points" />
          <span class="blr-meta ms-1">{{ asScenario.decisionPoints.length }}</span>
        </h2>
        <div class="grid gap-3 @min-[640px]:grid-cols-2">
          <div
            v-for="point in asScenario.decisionPoints"
            :key="point.title"
            class="rounded-xl border border-dashed border-accented p-4"
          >
            <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
              <UIcon name="i-lucide-git-branch" class="size-4 text-muted" />{{ point.title }}
            </p>
            <BlrProse :text="point.question" class="mt-2" />
            <ul class="mt-3 space-y-2">
              <li v-for="branch in point.branches" :key="branch.condition" class="flex items-start gap-2 text-sm">
                <code class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-highlighted">
                  {{ branch.condition }}
                </code>
                <UIcon name="i-lucide-arrow-right" class="mt-1 size-3 shrink-0 text-dimmed" />
                <span class="text-default">{{ branch.outcome }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="blr-page-heading"><BlrTerm :slug="scenarioWord('outcome')" text="Outcome" /></h2>
        <BlrProse :text="asScenario.outcome" class="max-w-3xl" />
        <!--
          Where the Scenario leaves each thing it changed — the last change
          naming it, in Step order. The prose says this in words; the reader who
          only wants the answer should not have to parse the sentence for it.
        -->
        <div v-if="asScenario.outcomeStates.length" class="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1">
          <span class="blr-field"><BlrTerm slug="ends-with" /></span>
          <BlrStepEntity
            v-for="ending in asScenario.outcomeStates"
            :key="`${ending.entityId}-${ending.as}`"
            :workspace="workspace"
            :mention="ending"
            outcome
            @select="emit('select', $event)"
          />
        </div>
      </section>

      <section v-if="asScenario.edgeCases.length" class="space-y-2">
        <h2 class="blr-page-heading">
          <BlrTerm :slug="scenarioWord('edge-case')" text="Edge cases" />
          <span class="blr-meta ms-1">{{ asScenario.edgeCases.length }}</span>
        </h2>
        <ul class="max-w-3xl space-y-2 text-sm text-default">
          <li v-for="edgeCase in asScenario.edgeCases" :key="edgeCase" class="flex gap-2">
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
          </li>
        </ul>
      </section>
    </template>

    <!-- SCREEN: what it presents, and what changes here. -->
    <template v-if="resource.kind === 'screen'">
      <!--
        "Presents" means the fact is on screen, read or entered. The Entity is
        named before its facts so the list reads as the narrower thing it is:
        what this Screen shows of the thing, never what the Product keeps.
      -->
      <section v-if="presents.length" class="space-y-2" data-screen-presents>
        <h2 class="blr-page-heading">
          Presents
          <span class="blr-meta ms-1">{{ presents.length }}</span>
        </h2>
        <ul class="space-y-1.5">
          <li
            v-for="entry in presents"
            :key="entry.entityId"
            class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm"
            :data-entity-id="entry.entityId"
          >
            <BlrEntityChip v-if="entry.entity" :entity="entry.entity" @select="emit('select', $event)" />
            <span v-else class="text-default">{{ entry.title }}</span>
            <template v-if="entry.facts">
              <UBadge v-for="fact in entry.facts" :key="fact" color="neutral" variant="outline" size="sm" class="font-normal" data-screen-fact>{{ fact }}</UBadge>
            </template>
            <span v-else class="blr-meta">no facts named</span>
          </li>
        </ul>
      </section>

    </template>

    <!-- ENTITY: what the Product keeps. States and their changes are in Lifecycle. -->
    <template v-if="resource.kind === 'entity'">
      <section v-if="asEntity.acts" class="flex flex-wrap items-center gap-2 text-sm text-default">
        <BlrEntityMark :facet="asEntity.entityKind!" :acts="asEntity.acts" size="xs" />
        <span>
          Acts on the Product as {{ asEntity.acts === 'external' ? 'an external' : 'an internal' }} {{ asEntity.entityKind }}.
        </span>
      </section>

      <section v-if="asEntity.informationKept.length" class="space-y-2">
        <h2 class="blr-page-heading">
          <BlrTerm slug="information-kept" text="Information kept" />
          <span class="blr-meta ms-1">{{ asEntity.informationKept.length }}</span>
        </h2>
        <ul class="grid gap-2 @min-[480px]:grid-cols-2">
          <li
            v-for="fact in asEntity.informationKept"
            :key="fact.name"
            class="flex flex-col gap-1.5 rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm"
          >
            <p class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="font-medium text-highlighted">{{ fact.name }}</span>
              <span class="text-default">{{ fact.description }}</span>
            </p>
            <!--
              A fact a Rule governs names each Rule on a chip of its own, on
              its own line under the fact and nothing more; the Rule page is
              the reading. Several Rules wrap as several chips, all named.
            -->
            <div v-if="fact.ruleIds.length" class="flex flex-wrap gap-1.5" data-fact-rules>
              <BlrResourceLink
                v-for="id in fact.ruleIds"
                :key="id"
                :resource-key="`rule:${id}`"
                class="blr-chip"
                :aria-label="`Business Rule: ${factRuleTitles([id])}`"
                data-fact-rule
                @open="openRule(id)"
              >
                <BlrKind kind="rule" :labelled="false" size="xs" class="shrink-0" /><span class="min-w-0 truncate">{{ factRuleTitles([id]) }}</span>
              </BlrResourceLink>
            </div>
          </li>
        </ul>
      </section>

    </template>

  </div>
</template>

<style scoped>
.blr-page-heading {
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: var(--ui-text-highlighted);
}
</style>
