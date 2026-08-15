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
import { isScenarioKind, journeyStepMatrix } from '../utils/reportWorkspace'

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

/* One authored Journey sequence, with route contexts projected into columns. */
const stepMatrix = computed(() => (isScenario.value ? journeyStepMatrix(asScenario.value) : null))

/** One route needs no column heading to tell it apart, so its id rides the heading. */
const stepMeta = computed(() => {
  const matrix = stepMatrix.value
  if (!matrix) return ''
  const steps = `${matrix.steps.length} ${matrix.steps.length === 1 ? 'step' : 'steps'}`
  return matrix.routeIds.length === 1
    ? `${steps} · route ${matrix.routeIds[0]}`
    : `${steps} · ${matrix.routeIds.length} routes`
})

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

      <!-- One authored Journey sequence: prose, Capability and route stay in one row. -->
      <section v-if="stepMatrix" class="space-y-3">
        <h2 class="blr-page-heading">Steps <span class="blr-meta ms-1">{{ stepMeta }}</span></h2>
        <div class="overflow-x-auto rounded-xl border border-default">
          <table class="w-full border-collapse text-left">
            <thead v-if="stepMatrix.routeIds.length > 1">
              <tr class="border-b border-default bg-elevated/35">
                <th scope="col" class="blr-field px-4 py-2.5 font-normal">Step</th>
                <th v-for="routeId in stepMatrix.routeIds" :key="routeId" scope="col" class="px-4 py-2.5">
                  <code class="rounded bg-muted px-2 py-1 font-mono text-xs text-muted">{{ routeId }}</code>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="step in stepMatrix.steps"
                :key="step.index"
                class="border-b border-default align-top last:border-b-0"
              >
                <th scope="row" class="max-w-sm px-4 py-3 font-normal">
                  <p class="text-sm font-medium text-highlighted">{{ step.index + 1 }}. {{ step.text }}</p>
                  <BlrLinks
                    v-if="step.capabilityId"
                    :workspace="workspace"
                    :ids="[step.capabilityId]"
                    kind="capability"
                    label="Capability"
                    interactive
                    @select="emit('select', $event)"
                  />
                </th>
                <td v-for="cell in step.cells" :key="cell.routeId" class="px-4 py-3">
                  <p v-if="cell.handoff" class="blr-meta mb-1.5 flex items-center gap-1 text-primary">
                    <UIcon name="i-lucide-corner-down-right" class="size-3" />handoff
                  </p>
                  <BlrAvail :pairs="cell.context ? [cell.context] : []" label="" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else class="space-y-3">
        <h2 class="blr-page-heading">Steps</h2>
        <ol class="max-w-3xl list-decimal space-y-2 ps-5 marker:font-mono marker:text-xs marker:text-dimmed">
          <li v-for="(step, index) in asScenario.steps" :key="index" class="ps-1 text-sm leading-6 text-default">
            {{ step.text }}
          </li>
        </ol>
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
