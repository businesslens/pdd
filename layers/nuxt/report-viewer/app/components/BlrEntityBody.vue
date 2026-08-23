<script setup lang="ts">
/**
 * The authored body of one entity: everything the model states in prose, steps,
 * branches and states.
 *
 * This is page material. It used to render inside a 672px drawer, where a
 * Journey Scenario ran to two and a half screens of scrolling and every heading
 * carried the same weight as every other, so nothing was ranked and nothing was
 * skippable. Here it has the width its tables and grids were drawn for, and a
 * real heading hierarchy the eye can skim.
 */
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  RuleView,
  ScenarioStepCell,
  ScenarioStepRow,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import { isScenarioKind, resolveEntity, scenarioStepMatrix } from '../utils/reportWorkspace'
import {
  SCENARIO_ROUTE_INLINE_WIDTH,
  scenarioRouteCapacity,
  scenarioRouteColumnCount,
  scenarioRouteWindow
} from '../utils/scenarioRouteWindow'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

/* The host may bind these into its URL. With no host binding they remain local
   component state, which keeps the report layer usable on its own. */
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const asScreen = computed(() => props.entity as ScreenView)
const asJourney = computed(() => props.entity as JourneyView)
const asScenario = computed(() => props.entity as ScenarioView)
const asRule = computed(() => props.entity as RuleView)
const isScenario = computed(() => isScenarioKind(props.entity.kind))

const capabilityBoundary = computed(() => {
  if (props.entity.kind === 'interface') return (props.entity as InterfaceView).capabilityBoundary
  if (props.entity.kind === 'experience') return (props.entity as ExperienceView).capabilityBoundary
  if (props.entity.kind === 'screen') return asScreen.value.capabilityBoundary
  return ''
})

const domainId = computed(() => props.entity.kind === 'capability'
  ? (props.entity as CapabilityView).domainId
  : '')

/* One authored Scenario sequence, with named Product Place routes as columns. */
const stepMatrix = computed(() => (isScenario.value ? scenarioStepMatrix(asScenario.value) : null))

/* Route columns are a window over authored order. Measure the reading itself:
   a rail and the Scenario split can leave little room inside a wide viewport. */
const routeShellEl = ref<HTMLElement | null>(null)
const routeShellWidth = ref(0)

watch(routeShellEl, (element, _previous, onCleanup) => {
  if (!element || typeof ResizeObserver === 'undefined') return
  const measure = () => { routeShellWidth.value = element.getBoundingClientRect().width }
  const observer = new ResizeObserver(([entry]) => {
    if (entry) routeShellWidth.value = entry.contentRect.width
  })
  measure()
  observer.observe(element)
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
  icon: 'i-lucide-route'
})))

const routeWindowItems = computed(() => {
  const routes = stepMatrix.value?.routes ?? []
  const count = visibleRouteCount.value
  const lastStart = Math.max(0, routes.length - count)
  return routes.slice(0, lastStart + 1).map((route, index) => ({
    value: route.id,
    label: routes.slice(index, index + count).map(item => item.name).join(' · '),
    icon: 'i-lucide-route'
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

const stepKindIcon = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'i-lucide-user-round',
  product: 'i-lucide-cpu',
  condition: 'i-lucide-circle-dot-dashed'
})[kind]

const stepKindLabel = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'Actor action',
  product: 'Product action',
  condition: 'Condition'
})[kind]

const stepKindDescription = (kind: 'actor' | 'product' | 'condition') => ({
  actor: 'Performed by the named Actor',
  product: 'Performed by the Product; no Actor is assigned',
  condition: 'An observable fact or state; nobody performs it'
})[kind]

const stepActor = (actorId: string | undefined): ActorView | undefined => {
  if (!actorId) return undefined
  const entity = resolveEntity(props.workspace, 'actor', actorId)
  return entity?.kind === 'actor' ? entity : undefined
}

const selectStepActor = (actorId: string | undefined) => {
  const actor = stepActor(actorId)
  if (actor) emit('select', actor)
}

const placeLabel = (place: { screenTitle: string, experienceTitle: string, interfaceTitle: string }) =>
  place.screenTitle || place.experienceTitle || place.interfaceTitle

/** True when this component would render nothing at all. */
const empty = computed(() => !props.entity.intent
  && !capabilityBoundary.value
  && !isScenario.value
  && props.entity.kind !== 'screen'
  && props.entity.kind !== 'rule'
  && props.entity.kind !== 'journey')
</script>

<template>
  <div v-if="!empty" class="space-y-10">
    <section v-if="entity.kind === 'rule'" class="space-y-3">
      <h2 class="blr-page-heading">Rule statement</h2>
      <div class="rounded-xl border-s-3 border-primary bg-elevated/45 p-5">
        <BlrProse :text="asRule.statement" size="base" />
      </div>
      <div v-if="asRule.rationale" class="space-y-2">
        <h3 class="text-sm font-semibold text-highlighted">Rationale</h3>
        <BlrProse :text="asRule.rationale" />
      </div>
    </section>

    <section v-if="entity.intent" class="space-y-2">
      <h2 class="blr-page-heading">Intent</h2>
      <BlrProse :text="entity.intent" class="max-w-3xl" />
    </section>

    <section v-if="entity.kind === 'journey'" class="space-y-2">
      <h2 class="blr-page-heading">Success criterion</h2>
      <BlrProse :text="asJourney.successCriterion" class="max-w-3xl" />
    </section>

    <section v-if="capabilityBoundary" class="space-y-2">
      <h2 class="blr-page-heading">Capability boundary</h2>
      <div class="max-w-3xl rounded-xl border border-default bg-elevated/35 p-4 text-default">
        <BlrProse :text="capabilityBoundary" />
      </div>
    </section>

    <!-- SCENARIO: the ordered reading, in the order it happens. -->
    <template v-if="isScenario">
      <section class="space-y-2">
        <h2 class="blr-page-heading">Trigger</h2>
        <BlrProse :text="asScenario.trigger" size="base" class="max-w-3xl" />
      </section>

      <!-- One authored Scenario sequence: meaning and exact Product Places stay together. -->
      <section v-if="stepMatrix" ref="routeShellEl" class="space-y-3">
        <header class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 class="blr-page-heading">Steps <span class="blr-meta ms-1">{{ stepMeta }}</span></h2>

          <!-- A narrow reading chooses one route. A wider reading pages an
               authored-order window and lets the reader choose its width. -->
          <div v-if="stepMatrix.routes.length > 1" class="ms-auto flex min-w-0 flex-wrap items-center gap-1.5">
            <template v-if="routeInline">
              <span class="blr-field me-1">Route</span>
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="visibleRouteWindow.start === 0"
                aria-label="Show previous route"
                @click="moveRouteWindow(-1)"
              />
              <USelect
                :model-value="visibleRoutes[0]?.id"
                :items="routeItems"
                value-key="value"
                size="xs"
                variant="outline"
                icon="i-lucide-route"
                class="min-w-44 max-w-full"
                aria-label="Route to show"
                @update:model-value="setRouteWindow(String($event))"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                size="xs"
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
                <span class="blr-field me-1">Routes</span>
                <UButton
                  icon="i-lucide-chevron-left"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="visibleRouteWindow.start === 0"
                  aria-label="Show previous route"
                  @click="moveRouteWindow(-1)"
                />
                <USelect
                  :model-value="visibleRoutes[0]?.id"
                  :items="routeWindowItems"
                  value-key="value"
                  size="xs"
                  variant="outline"
                  icon="i-lucide-route"
                  class="w-48 max-w-full"
                  aria-label="Visible route window"
                  @update:model-value="setRouteWindow(String($event))"
                />
                <UButton
                  icon="i-lucide-chevron-right"
                  color="neutral"
                  variant="ghost"
                  size="xs"
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
                size="xs"
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
                  scope="col"
                  class="blr-field border-e border-default px-4 py-2.5 font-normal"
                >
                  Step
                </th>
                <th
                  v-for="route in visibleRoutes"
                  :key="route.id"
                  scope="col"
                  class="min-w-0 px-4 py-2.5"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <UTooltip text="Named route — one way this Scenario can run" :delay-duration="150">
                      <UIcon name="i-lucide-route" class="size-3.5 shrink-0 text-dimmed" />
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
                  scope="row"
                  class="border-e border-default bg-default px-4 py-3 font-normal"
                >
                  <p class="text-sm font-medium text-highlighted">{{ step.index + 1 }}. {{ step.text }}</p>
                  <!--
                    A named Actor is a reference to an entity, so it is drawn as one: the
                    Actor's own mark inside a chip that opens it. A dimmed generic glyph
                    beside plain text read as narration, at the weight of the Condition
                    rows around it. The boundary axis is not repeated here — the question a
                    Step answers is who performs it, and the chip carries it in its tooltip.
                  -->
                  <span class="blr-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <template v-if="step.stepKind === 'actor' && stepActor(step.actorId)">
                      <button
                        type="button"
                        class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-default bg-elevated/60 py-0.5 pe-2 ps-1 font-sans text-xs font-medium text-highlighted transition hover:border-accented hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        :aria-label="`Open Actor ${stepActor(step.actorId)!.title}`"
                        @click="selectStepActor(step.actorId)"
                      >
                        <BlrActorType
                          :actor-kind="stepActor(step.actorId)!.actorKind"
                          :relationship="stepActor(step.actorId)!.relationship"
                          size="xs"
                        />
                        <span class="min-w-0 truncate">{{ stepActor(step.actorId)!.title }}</span>
                      </button>
                      <UTooltip :text="stepKindDescription('actor')" :delay-duration="150">
                        <span>action</span>
                      </UTooltip>
                    </template>
                    <UTooltip v-else :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                      <span class="inline-flex items-center gap-1.5">
                        <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                        {{ stepKindLabel(step.stepKind) }}
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
                      No Product Place — same Step on every route
                    </p>
                  </UTooltip>
                </td>
                <td
                  v-for="cell in step.routeNeutral ? [] : visibleCells(step)"
                  :key="cell.routeId"
                  class="min-w-0 px-4 py-3"
                >
                  <UTooltip
                    v-if="cell.placeChanged && cell.previousPlace"
                    text="This route continues at a different Product Place than its previous placed Step"
                    :delay-duration="150"
                  >
                    <p class="blr-meta mb-1.5 flex items-center gap-1 text-primary">
                      <UIcon name="i-lucide-corner-down-right" class="size-3" />
                      Moved from {{ placeLabel(cell.previousPlace) }}
                    </p>
                  </UTooltip>
                  <BlrStepContext
                    v-if="cell.place"
                    :workspace="workspace"
                    :place="cell.place"
                    @select="emit('select', $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Narrow reading: preserve the ordered Steps and put the selected
             route's Product Place beneath each one. -->
        <div v-else class="divide-y divide-default overflow-hidden rounded-xl border border-default">
          <article v-for="step in stepMatrix.steps" :key="step.index">
            <div class="bg-default px-4 py-3">
              <p class="text-sm font-medium text-highlighted">{{ step.index + 1 }}. {{ step.text }}</p>
              <!--
                A named Actor is a reference to an entity, so it is drawn as one: the
                Actor's own mark inside a chip that opens it. A dimmed generic glyph
                beside plain text read as narration, at the weight of the Condition
                rows around it. The boundary axis is not repeated here — the question a
                Step answers is who performs it, and the chip carries it in its tooltip.
              -->
              <span class="blr-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <template v-if="step.stepKind === 'actor' && stepActor(step.actorId)">
                  <button
                    type="button"
                    class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-default bg-elevated/60 py-0.5 pe-2 ps-1 font-sans text-xs font-medium text-highlighted transition hover:border-accented hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :aria-label="`Open Actor ${stepActor(step.actorId)!.title}`"
                    @click="selectStepActor(step.actorId)"
                  >
                    <BlrActorType
                      :actor-kind="stepActor(step.actorId)!.actorKind"
                      :relationship="stepActor(step.actorId)!.relationship"
                      size="xs"
                    />
                    <span class="min-w-0 truncate">{{ stepActor(step.actorId)!.title }}</span>
                  </button>
                  <UTooltip :text="stepKindDescription('actor')" :delay-duration="150">
                    <span>action</span>
                  </UTooltip>
                </template>
                <UTooltip v-else :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                    {{ stepKindLabel(step.stepKind) }}
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

            <div class="border-t border-muted bg-elevated/20 px-4 py-3">
              <UTooltip
                v-if="step.routeNeutral"
                text="This Step is shared by every route and is not assigned to an Interface, Experience, or Screen"
                :delay-duration="150"
              >
                <p class="blr-meta flex items-center gap-1.5">
                  <UIcon name="i-lucide-align-justify" class="size-3.5" />
                  No Product Place — same Step on every route
                </p>
              </UTooltip>

              <template v-else-if="selectedCell(step)">
                <p
                  v-if="selectedCell(step)?.placeChanged && selectedCell(step)?.previousPlace"
                  class="blr-meta mb-2 flex items-center gap-1 text-primary"
                >
                  <UIcon name="i-lucide-corner-down-right" class="size-3" />
                  Moved from {{ placeLabel(selectedCell(step)!.previousPlace!) }}
                </p>
                <BlrStepContext
                  v-if="selectedCell(step)?.place"
                  :workspace="workspace"
                  :place="selectedCell(step)!.place!"
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
          Decision points <span class="blr-meta ms-1">{{ asScenario.decisionPoints.length }}</span>
        </h2>
        <div class="grid gap-3 lg:grid-cols-2">
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
        <h2 class="blr-page-heading">Outcome</h2>
        <BlrProse :text="asScenario.outcome" class="max-w-3xl" />
      </section>

      <section v-if="asScenario.edgeCases.length" class="space-y-2">
        <h2 class="blr-page-heading">Edge cases <span class="blr-meta ms-1">{{ asScenario.edgeCases.length }}</span></h2>
        <ul class="max-w-3xl space-y-2 text-sm text-default">
          <li v-for="edgeCase in asScenario.edgeCases" :key="edgeCase" class="flex gap-2">
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
          </li>
        </ul>
      </section>
    </template>

    <!-- SCREEN: what it shows, what can be done, what states it has. -->
    <template v-if="entity.kind === 'screen'">
      <section v-if="asScreen.information.length" class="space-y-2">
        <h2 class="blr-page-heading">
          Information presented <span class="blr-meta ms-1">{{ asScreen.information.length }}</span>
        </h2>
        <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="item in asScreen.information"
            :key="item"
            class="rounded-lg border border-default px-3 py-2.5 text-sm text-default"
          >
            {{ item }}
          </li>
        </ul>
      </section>
      <section v-if="asScreen.actions.length" class="space-y-2">
        <h2 class="blr-page-heading">
          Available actions <span class="blr-meta ms-1">{{ asScreen.actions.length }}</span>
        </h2>
        <ul class="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <li v-for="item in asScreen.actions" :key="item" class="flex items-start gap-2 text-sm text-default">
            <UIcon name="i-lucide-mouse-pointer-click" class="mt-0.5 size-4 shrink-0 text-muted" />{{ item }}
          </li>
        </ul>
      </section>
      <section v-if="asScreen.states.length" class="space-y-2">
        <h2 class="blr-page-heading">Product states <span class="blr-meta ms-1">{{ asScreen.states.length }}</span></h2>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="state in asScreen.states"
            :key="state.title"
            class="rounded-xl border border-default bg-elevated/30 p-4"
          >
            <p class="text-sm font-semibold text-highlighted">{{ state.title }}</p>
            <BlrProse :text="state.description" class="mt-1.5" />
          </div>
        </div>
      </section>
    </template>

    <section v-if="domainId" class="space-y-2">
      <h2 class="blr-page-heading">Subject</h2>
      <BlrLinks
        :workspace="workspace"
        :ids="[domainId]"
        kind="domain"
        label="Domain"
        interactive
        @select="emit('select', $event)"
      />
    </section>
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
