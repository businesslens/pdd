<script setup lang="ts">
/**
 * The peek: four zones, and never a fifth.
 *
 * It answers one question — *is this the entity I meant?* — without costing the
 * list you asked it from. It is not a reading of the entity; that is the page.
 *
 * The container it replaces rendered every authored field of every kind, which
 * ranged from 570px for an Actor to 2264px for a Journey Scenario inside the
 * same 672px panel. Nothing that varies by 4× fits one container, so this one
 * stops at a fixed set of facts and hands the rest to a page.
 *
 * Every relation here navigates. Re-targeting the panel forever is what made
 * depth confusing: three entities deep there was no trail, and the list behind
 * had nothing to do with what was on screen.
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
import { ENTITY_KIND_META, INTERFACE_TYPE_META, resolveEntity } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

interface Fact {
  label: string
  value: string
  /** A name, not a number: it gets a row of its own rather than a third of one. */
  wide?: boolean
}

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])

const contextOf = (entity: { contexts: Array<{ interfaceTitle: string, experienceTitle: string, screenTitle?: string }> }) => {
  const [first] = entity.contexts
  if (!first) return '—'
  const rest = entity.contexts.length - 1
  const name = [first.interfaceTitle, first.experienceTitle, first.screenTitle].filter(Boolean).join(' › ')
  return rest > 0 ? `${name} +${rest}` : name
}

/*
  Three facts, and they must *discriminate*.

  Not what the header already says (a Scenario panel titled "Capability
  Scenario" does not need a Type row), not what the badge already says, and not
  a count a reader can get from the connections below. For a Screen that means
  its context, which is the only thing telling two counterparts apart.
*/
const facts = computed<Fact[]>(() => {
  const entity = props.entity
  switch (entity.kind) {
    case 'actor': {
      const actor = entity as ActorView
      return [
        { label: 'Kind', value: actor.actorKind },
        { label: 'Relationship', value: actor.relationship },
        { label: 'Journeys', value: String(actor.journeyIds.length) }
      ]
    }
    case 'interface': {
      const item = entity as InterfaceView
      return [
        { label: 'Type', value: INTERFACE_TYPE_META[item.interfaceType].label },
        { label: 'Experiences', value: String(item.experienceIds.length) },
        { label: 'Screens', value: String(item.screenIds.length) },
      ]
    }
    case 'experience': {
      const item = entity as ExperienceView
      return [
        {
          label: 'Interface',
          value: resolveEntity(props.workspace, 'interface', item.interfaceIds[0] ?? '')?.title ?? '—',
          wide: true
        },
        { label: 'Access', value: item.accessMode },
        { label: 'Screens', value: String(item.screenIds.length) }
      ]
    }
    case 'screen': {
      const screen = entity as ScreenView
      return [
        { label: 'Context', value: contextOf(screen), wide: true },
        { label: 'States', value: String(screen.states.length) },
        { label: 'Actions', value: String(screen.actions.length) }
      ]
    }
    case 'domain': {
      const domain = entity as DomainView
      return [
        { label: 'Capabilities', value: String(domain.capabilityIds.length) },
        { label: 'Journeys reached', value: String(domain.journeyIds.length) },
        { label: 'Rules', value: String(domain.ruleIds.length) }
      ]
    }
    case 'capability': {
      const capability = entity as CapabilityView
      return [
        { label: 'Context', value: contextOf(capability), wide: true },
        { label: 'Scenarios', value: String(capability.scenarioIds.length) },
        { label: 'Journeys', value: String(capability.journeyIds.length) }
      ]
    }
    case 'journey': {
      const journey = entity as JourneyView
      return [
        {
          label: 'Actor',
          value: resolveEntity(props.workspace, 'actor', journey.actorIds[0] ?? '')?.title ?? '—',
          wide: true
        },
        { label: 'Scenarios', value: String(journey.scenarioIds.length) },
        { label: 'Steps', value: String(journey.stepCount) }
      ]
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = entity as ScenarioView
      const parent: Fact = scenario.scenarioType === 'capability'
        ? { label: 'Capability', value: scenario.capabilityTitle, wide: true }
        : { label: 'Journey', value: scenario.journeyTitle, wide: true }
      return [
        parent,
        { label: 'Steps', value: String(scenario.steps.length) },
        scenario.result
          ? { label: 'Result', value: scenario.result }
          : { label: 'Screens', value: String(scenario.screenIds.length) }
      ]
    }
    case 'rule': {
      const rule = entity as RuleView
      return [
        { label: 'Bindings', value: String(rule.appliesTo.length) },
        { label: 'Contexts', value: String(rule.contexts.length) },
        { label: 'References', value: String(rule.references.length) }
      ]
    }
    default:
      return []
  }
})

const badge = computed(() => {
  const entity = props.entity
  switch (entity.kind) {
    case 'actor': return `${(entity as ActorView).actorKind} · ${(entity as ActorView).relationship}`
    case 'experience': return (entity as ExperienceView).accessMode
    case 'capability-scenario': return (entity as ScenarioView).kindName
    case 'journey-scenario': return `${(entity as ScenarioView).kindName} · ${(entity as ScenarioView).result}`
    case 'capability': {
      const id = (entity as CapabilityView).domainId
      return id ? resolveEntity(props.workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
})

/* The badge and the facts must not say the same thing twice. */
const shownFacts = computed(() => facts.value.filter(fact => fact.value && fact.value !== badge.value))
const wideFacts = computed(() => shownFacts.value.filter(fact => fact.wide))
const gridFacts = computed(() => shownFacts.value.filter(fact => !fact.wide))

/* Written out rather than interpolated: Tailwind only sees literal classes. */
const GRID_COLUMNS = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3']
const gridColumns = computed(() => GRID_COLUMNS[Math.min(gridFacts.value.length, 3)])
</script>

<template>
  <div class="flex min-h-full flex-col gap-5">
    <!-- 1. Identity. The qualified id is what tells counterparts apart. -->
    <div class="shrink-0 space-y-2">
      <code class="inline-block max-w-full truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted">
        {{ entity.id }}
      </code>
      <UBadge v-if="badge" color="neutral" variant="subtle" size="sm" class="ms-2">{{ badge }}</UBadge>
    </div>

    <!-- 2. One sentence. -->
    <BlrProse
      v-if="entity.lead"
      :text="entity.lead"
      size="base"
      class="shrink-0 text-default"
    />

    <!-- 3. Three discriminating facts. A name gets a row; counts share one. -->
    <dl v-if="shownFacts.length" class="shrink-0 overflow-hidden rounded-xl border border-default bg-default">
      <div v-for="fact in wideFacts" :key="fact.label" class="min-w-0 border-b border-default bg-elevated/35 px-3.5 py-3">
        <dt class="text-xs font-medium text-muted">{{ fact.label }}</dt>
        <dd class="text-sm font-medium text-highlighted" :title="fact.value">{{ fact.value }}</dd>
      </div>
      <div v-if="gridFacts.length" class="grid gap-px bg-default" :class="gridColumns">
        <div v-for="fact in gridFacts" :key="fact.label" class="min-w-0 bg-elevated/35 px-3.5 py-3">
          <dt class="text-xs font-medium text-muted">{{ fact.label }}</dt>
          <dd class="mt-1 truncate text-sm font-medium text-highlighted" :title="fact.value">{{ fact.value }}</dd>
        </div>
      </div>
    </dl>

    <!--
      4. What it touches. Capped at four rows and four chips, because the page
      has the rest and says so. The zone is not clipped: a clipped list looks
      like a complete one, and on a short viewport that would quietly hide
      relations rather than admit they are there.
    -->
    <div class="shrink-0">
      <p class="blr-field mb-2">Connects to</p>
      <BlrConnections
        :workspace="workspace"
        :entity="entity"
        :max="4"
        :max-rows="3"
        @select="emit('select', $event)"
      />
    </div>

    <UButton
      class="mt-auto shrink-0"
      color="primary"
      variant="solid"
      size="md"
      block
      trailing-icon="i-lucide-arrow-right"
      :label="`Open ${meta.label} page`"
      @click="emit('open', entity)"
    />
  </div>
</template>
