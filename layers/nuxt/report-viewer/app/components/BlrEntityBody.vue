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
  AnyEntityView,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import { isScenarioKind, resolveEntity, scenarioStepMatrix } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

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

const stepActor = (actorId: string | undefined) => actorId
  ? resolveEntity(props.workspace, 'actor', actorId)
  : undefined

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
      <section v-if="stepMatrix" class="space-y-3">
        <h2 class="blr-page-heading">Steps <span class="blr-meta ms-1">{{ stepMeta }}</span></h2>
        <div class="overflow-x-auto rounded-xl border border-default">
          <table
            class="w-full border-collapse text-left"
            :style="{ minWidth: `${320 + stepMatrix.routes.length * 310}px` }"
          >
            <thead>
              <tr class="border-b border-default bg-elevated/35">
                <th
                  scope="col"
                  class="blr-field sticky left-0 z-20 w-80 min-w-80 border-e border-default bg-elevated px-4 py-2.5 font-normal"
                >
                  Step
                </th>
                <th
                  v-for="route in stepMatrix.routes"
                  :key="route.id"
                  scope="col"
                  class="w-[310px] min-w-[310px] px-4 py-2.5"
                >
                  <div class="flex items-center gap-2 whitespace-nowrap">
                    <UTooltip text="Named route — one way this Scenario can run" :delay-duration="150">
                      <UIcon name="i-lucide-route" class="size-3.5 text-dimmed" />
                    </UTooltip>
                    <span class="text-xs font-medium text-default">{{ route.name }}</span>
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
                  class="sticky left-0 z-10 w-80 min-w-80 border-e border-default bg-default px-4 py-3 font-normal"
                >
                  <p class="text-sm font-medium text-highlighted">{{ step.index + 1 }}. {{ step.text }}</p>
                  <UTooltip :text="stepKindDescription(step.stepKind)" :delay-duration="150">
                    <span class="blr-meta mt-1 inline-flex items-center gap-1.5">
                      <UIcon :name="stepKindIcon(step.stepKind)" class="size-3.5 shrink-0" />
                      <template v-if="step.stepKind === 'actor' && stepActor(step.actorId)">
                        <button
                          type="button"
                          class="text-default underline decoration-(--ui-border-accented) underline-offset-3 transition-colors hover:text-highlighted hover:decoration-(--ui-text-dimmed)"
                          @click="selectStepActor(step.actorId)"
                        >
                          {{ stepActor(step.actorId)?.title }}
                        </button>
                        action
                      </template>
                      <template v-else>{{ stepKindLabel(step.stepKind) }}</template>
                    </span>
                  </UTooltip>
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
                  :colspan="stepMatrix.routes.length"
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
                <td v-for="cell in step.routeNeutral ? [] : step.cells" :key="cell.routeId" class="px-4 py-3">
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
