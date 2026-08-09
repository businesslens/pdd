<script setup lang="ts">
/**
 * Every authored field of one entity, whatever its kind.
 *
 * This is the completeness guarantee the lab is built around: if a field
 * survives compilation into the Product Report, it is rendered here. Designs
 * differ in how a reader *reaches* an entity, not in how much of it they see.
 */
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  /** `full` shows relations and supporting content; `brief` stops at the prose. */
  depth?: 'full' | 'brief'
}>(), {
  depth: 'full'
})

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const asActor = computed(() => props.entity as ActorView)
const asDomain = computed(() => props.entity as DomainView)
const asInterface = computed(() => props.entity as InterfaceView)
const asExperience = computed(() => props.entity as ExperienceView)
const asScreen = computed(() => props.entity as ScreenView)
const asCapability = computed(() => props.entity as CapabilityView)
const asJourney = computed(() => props.entity as JourneyView)
const asScenario = computed(() => props.entity as ScenarioView)
const asRule = computed(() => props.entity as RuleView)

const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}
</script>

<template>
  <article class="space-y-5">
    <header class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <BlrKind :kind="entity.kind" />
        <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ entity.id }}</code>
        <UBadge
          v-if="entity.kind === 'scenario'"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ asScenario.kindName }}
        </UBadge>
        <UBadge
          v-if="entity.kind === 'scenario' && asScenario.result"
          color="neutral"
          variant="outline"
          size="sm"
        >
          {{ asScenario.result }}
        </UBadge>
        <UBadge
          v-if="entity.kind === 'experience'"
          :color="ACCESS_TONE[asExperience.accessMode] || 'neutral'"
          variant="subtle"
          size="sm"
        >
          {{ asExperience.accessMode }}
        </UBadge>
        <UBadge
          v-if="entity.kind === 'actor'"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ asActor.actorKind }} · {{ asActor.relationship }}
        </UBadge>
      </div>
      <h3 class="text-xl font-semibold tracking-tight text-highlighted">
        {{ entity.title }}
      </h3>
      <p v-if="entity.kind === 'scenario'" class="text-sm text-muted">
        {{ asScenario.scenarioType === 'capability' ? 'For capability' : 'In journey' }}
        <button type="button" class="text-primary underline underline-offset-2" @click="emit('select', workspace.byId.get(asScenario.scenarioType === 'capability' ? asScenario.capabilityId : asScenario.journeyId)!)">
          {{ asScenario.scenarioType === 'capability' ? asScenario.capabilityTitle : asScenario.journeyTitle }}
        </button>
      </p>
    </header>

    <!-- Lead prose: description, summary, or the rule statement itself. -->
    <section v-if="entity.kind === 'rule'" class="rounded-lg border-s-2 border-primary bg-elevated/40 p-3">
      <BlrProse :text="asRule.statement" />
    </section>
    <BlrProse v-else :text="entity.lead" />

    <section v-if="entity.intent" class="space-y-1.5">
      <h4 class="blr-field">
        Intent
      </h4>
      <BlrProse :text="entity.intent" />
    </section>

    <section v-if="entity.kind === 'rule' && asRule.rationale" class="space-y-1.5">
      <h4 class="blr-field">
        Rationale
      </h4>
      <BlrProse :text="asRule.rationale" />
    </section>

    <section v-if="entity.kind === 'journey'" class="space-y-1.5">
      <h4 class="blr-field">
        Success criterion
      </h4>
      <BlrProse :text="asJourney.successCriterion" />
    </section>

    <!-- Scenario body: the acceptance contract, in authored order. -->
    <template v-if="entity.kind === 'scenario'">
      <section class="space-y-1.5">
        <h4 class="blr-field">
          Trigger
        </h4>
        <BlrProse :text="asScenario.trigger" />
      </section>

      <section class="space-y-2">
        <h4 class="blr-field">
          Steps · {{ asScenario.steps.length }}
        </h4>
        <ol class="space-y-1.5">
          <li
            v-for="(step, index) in asScenario.steps"
            :key="index"
            class="flex gap-3 text-sm leading-relaxed"
          >
            <span class="blr-meta mt-0.5 w-5 shrink-0 text-end">{{ index + 1 }}</span>
            <span class="text-default">{{ step }}</span>
          </li>
        </ol>
      </section>

      <section v-if="asScenario.flow.length" class="space-y-2">
        <h4 class="blr-field">
          Flow · {{ asScenario.flow.length }}
        </h4>
        <ol class="space-y-2">
          <li v-for="(item, index) in asScenario.flow" :key="`${item.capabilityId}-${index}`" class="rounded-md border border-default p-2.5">
            <p class="text-sm font-medium text-highlighted">{{ index + 1 }}. {{ item.operation }}</p>
            <BlrLinks :workspace="workspace" :ids="[item.capabilityId]" kind="capability" label="Capability" interactive @select="emit('select', $event)" />
            <BlrAvail :pairs="item.availability" label="Contexts" />
          </li>
        </ol>
      </section>

      <section v-if="asScenario.decisionPoints.length" class="space-y-3">
        <h4 class="blr-field">
          Decision points · {{ asScenario.decisionPoints.length }}
        </h4>
        <div
          v-for="(point, index) in asScenario.decisionPoints"
          :key="index"
          class="rounded-lg border border-dashed border-default p-3"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ point.title }}
          </p>
          <BlrProse :text="point.question" class="mt-1 text-dimmed" />
          <ul class="mt-2.5 space-y-1.5">
            <li
              v-for="(branch, branchIndex) in point.branches"
              :key="branchIndex"
              class="flex flex-wrap items-baseline gap-1.5 text-xs"
            >
              <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-default">{{ branch.condition }}</span>
              <UIcon name="i-lucide-arrow-right" class="size-3 self-center text-dimmed" />
              <span class="text-dimmed">{{ branch.outcome }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="space-y-1.5">
        <h4 class="blr-field">
          Outcome
        </h4>
        <BlrProse :text="asScenario.outcome" />
      </section>

      <section v-if="asScenario.edgeCases.length" class="space-y-1.5">
        <h4 class="blr-field">
          Edge cases · {{ asScenario.edgeCases.length }}
        </h4>
        <ul class="list-disc space-y-1 ps-5 text-sm text-dimmed marker:text-dimmed">
          <li v-for="(item, index) in asScenario.edgeCases" :key="index">
            {{ item }}
          </li>
        </ul>
      </section>
    </template>

    <!-- Screen body: what it presents, what can be done, and its states. -->
    <template v-if="entity.kind === 'screen'">
      <section class="space-y-1.5">
        <h4 class="blr-field">
          Information presented · {{ asScreen.information.length }}
        </h4>
        <ul class="list-disc space-y-1 ps-5 text-sm text-default marker:text-dimmed">
          <li v-for="(item, index) in asScreen.information" :key="index">
            {{ item }}
          </li>
        </ul>
      </section>
      <section v-if="asScreen.actions.length" class="space-y-1.5">
        <h4 class="blr-field">
          Available actions · {{ asScreen.actions.length }}
        </h4>
        <ul class="space-y-1 text-sm text-default">
          <li v-for="(item, index) in asScreen.actions" :key="index" class="flex items-start gap-2">
            <UIcon name="i-lucide-mouse-pointer-click" class="mt-0.5 size-3.5 shrink-0 text-dimmed" />
            {{ item }}
          </li>
        </ul>
      </section>
      <section v-if="asScreen.states.length" class="space-y-2">
        <h4 class="blr-field">
          Product states · {{ asScreen.states.length }}
        </h4>
        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="state in asScreen.states"
            :key="state.title"
            class="rounded-md border border-default bg-elevated/40 p-2.5"
          >
            <p class="text-xs font-medium text-highlighted">
              {{ state.title }}
            </p>
            <BlrProse :text="state.description" class="mt-1 text-xs text-dimmed" />
          </div>
        </div>
      </section>
    </template>

    <section
      v-if="['interface', 'experience', 'screen'].includes(entity.kind)"
      class="space-y-1.5"
    >
      <h4 class="blr-field">
        Capability boundary
      </h4>
      <BlrProse
        :text="entity.kind === 'interface'
          ? asInterface.capabilityBoundary
          : entity.kind === 'experience' ? asExperience.capabilityBoundary : asScreen.capabilityBoundary"
      />
    </section>

    <template v-if="depth === 'full'">
      <BlrAvail
        v-if="entity.kind === 'capability'"
        :pairs="asCapability.availability"
      />
      <BlrAvail
        v-else-if="entity.kind === 'journey'"
        :pairs="asJourney.availability"
        :entry-points="asJourney.entryPoints"
      />
      <BlrAvail
        v-else-if="entity.kind === 'screen'"
        :pairs="asScreen.availability"
        :entry-points="asScreen.entryPoints"
      />
      <BlrAvail
        v-else-if="entity.kind === 'scenario'"
        :pairs="asScenario.availability"
      />
      <BlrAvail
        v-else-if="entity.kind === 'rule'"
        :pairs="asRule.availability"
        label="Scoped to"
        inherited-note="Not narrowed to specific Interface availability scopes."
      />
      <BlrAvail
        v-else-if="entity.kind === 'interface'"
        :pairs="[]"
        :entry-points="asInterface.entryPoints"
        label="Entry points"
      />
      <BlrAvail
        v-else-if="entity.kind === 'experience'"
        :pairs="[]"
        :entry-points="asExperience.entryPoints"
        label="Entry points"
      />

      <section class="space-y-1.5 border-t border-default pt-4">
        <template v-if="entity.kind === 'actor'">
          <BlrLinks :workspace="workspace" :ids="asActor.interfaceIds" kind="interface" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asActor.experienceIds" kind="experience" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asActor.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'interface'">
          <BlrLinks :workspace="workspace" :ids="asInterface.actorIds" kind="actor" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asInterface.experienceIds" kind="experience" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asInterface.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asInterface.screenIds" kind="screen" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asInterface.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'experience'">
          <BlrLinks :workspace="workspace" :ids="asExperience.actorIds" kind="actor" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asExperience.interfaceIds" kind="interface" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asExperience.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asExperience.screenIds" kind="screen" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asExperience.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'screen'">
          <BlrLinks :workspace="workspace" :ids="asScreen.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asScreen.capabilityScenarioIds" kind="scenario" label="Capability Scenarios" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asScreen.journeyScenarioIds" kind="scenario" label="Journey Scenarios" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asScreen.journeyIds" kind="journey" label="Reached from" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'domain'">
          <BlrLinks :workspace="workspace" :ids="asDomain.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asDomain.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asDomain.ruleIds" kind="rule" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'capability'">
          <BlrLinks v-if="asCapability.domainId" :workspace="workspace" :ids="[asCapability.domainId]" kind="domain" label="Domain" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asCapability.scenarioIds" kind="scenario" label="Capability Scenarios" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asCapability.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asCapability.screenIds" kind="screen" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asCapability.ruleIds" kind="rule" label="Constrained by" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'journey'">
          <BlrLinks :workspace="workspace" :ids="asJourney.actorIds" kind="actor" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.failureOnlyCapabilityIds" kind="capability" label="Failure-only Capabilities" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.scenarioIds" kind="scenario" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.screenIds" kind="screen" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'scenario'">
          <BlrLinks :workspace="workspace" :ids="asScenario.actorIds" kind="actor" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asScenario.screenIds" kind="screen" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asScenario.ruleIds" kind="rule" label="Constrained by" interactive @select="emit('select', $event)" />
        </template>
        <template v-else-if="entity.kind === 'rule'">
          <BlrLinks :workspace="workspace" :ids="asRule.domainIds" kind="domain" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asRule.capabilityIds" kind="capability" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asRule.journeyIds" kind="journey" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asRule.capabilityScenarioIds" kind="scenario" label="Capability Scenarios" interactive @select="emit('select', $event)" />
          <BlrLinks :workspace="workspace" :ids="asRule.journeyScenarioIds" kind="scenario" label="Journey Scenarios" interactive @select="emit('select', $event)" />
        </template>
      </section>

      <section v-if="entity.supportingContent" class="space-y-1.5 border-t border-default pt-4">
        <h4 class="blr-field">
          Supporting context
        </h4>
        <BlrProse :text="entity.supportingContent" />
      </section>

      <BlrRefs :references="entity.references" variant="list" />
    </template>
  </article>
</template>
