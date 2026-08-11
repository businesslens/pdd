<script setup lang="ts">
/**
 * The inspector reading of an entity: complete, sectioned and relation-aware.
 * Cards deliberately omit this depth; this component is where every authored
 * field and every resolved connection becomes available.
 */
import type {
  ActorView,
  AnyEntityView,
  CapabilityView,
  DomainView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  RuleView,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import { ENTITY_KIND_META, isScenarioKind, resolveEntity } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

interface Fact {
  label: string
  value: string | number
}

interface RelationRow {
  label: string
  kind: ReportEntityKind
  ids: string[]
}

interface RelationGroup {
  label: 'Authored' | 'Derived'
  rows: RelationRow[]
}

const asActor = computed(() => props.entity as ActorView)
const asInterface = computed(() => props.entity as InterfaceView)
const asExperience = computed(() => props.entity as ExperienceView)
const asScreen = computed(() => props.entity as ScreenView)
const asDomain = computed(() => props.entity as DomainView)
const asCapability = computed(() => props.entity as CapabilityView)
const asJourney = computed(() => props.entity as JourneyView)
const asScenario = computed(() => props.entity as ScenarioView)
const asRule = computed(() => props.entity as RuleView)
const isScenario = computed(() => isScenarioKind(props.entity.kind))

const badge = computed(() => {
  switch (props.entity.kind) {
    case 'actor': return `${asActor.value.actorKind} · ${asActor.value.relationship}`
    case 'experience': return asExperience.value.accessMode
    case 'capability-scenario': return asScenario.value.kindName
    case 'journey-scenario': return `${asScenario.value.kindName} · ${asScenario.value.result}`
    case 'capability': {
      const id = asCapability.value.domainId
      return id ? resolveEntity(props.workspace, 'domain', id)?.title ?? id : ''
    }
    default: return ''
  }
})

const facts = computed<Fact[]>(() => {
  switch (props.entity.kind) {
    case 'actor': return [
      { label: 'Kind', value: asActor.value.actorKind },
      { label: 'Relationship', value: asActor.value.relationship },
      { label: 'Journeys', value: asActor.value.journeyIds.length }
    ]
    case 'interface': return [
      { label: 'Actors', value: asInterface.value.actorIds.length },
      { label: 'Experiences', value: asInterface.value.experienceIds.length },
      { label: 'Entry points', value: asInterface.value.entryPoints.length }
    ]
    case 'experience': return [
      { label: 'Access', value: asExperience.value.accessMode },
      { label: 'Interfaces', value: asExperience.value.interfaceIds.length },
      { label: 'Entry points', value: asExperience.value.entryPoints.length }
    ]
    case 'screen': return [
      { label: 'Contexts', value: asScreen.value.availability.length },
      { label: 'Entry points', value: asScreen.value.entryPoints.length },
      { label: 'States', value: asScreen.value.states.length }
    ]
    case 'domain': return [
      { label: 'Capabilities', value: asDomain.value.capabilityIds.length },
      { label: 'Journeys reached', value: asDomain.value.journeyIds.length },
      { label: 'Rules', value: asDomain.value.ruleIds.length }
    ]
    case 'capability': return [
      { label: 'Domain', value: badge.value || 'None' },
      { label: 'Contexts', value: asCapability.value.availability.length },
      { label: 'Scenarios', value: asCapability.value.scenarioIds.length }
    ]
    case 'journey': return [
      { label: 'Actors', value: asJourney.value.actorIds.length },
      { label: 'Scenarios', value: asJourney.value.scenarioIds.length },
      { label: 'Steps', value: asJourney.value.stepCount }
    ]
    case 'capability-scenario':
    case 'journey-scenario': return [
      {
        label: asScenario.value.scenarioType === 'capability' ? 'Capability' : 'Journey',
        value: asScenario.value.scenarioType === 'capability'
          ? asScenario.value.capabilityTitle
          : asScenario.value.journeyTitle
      },
      { label: 'Type', value: asScenario.value.scenarioType === 'capability' ? 'Capability Scenario' : 'Journey Scenario' },
      ...(asScenario.value.result ? [{ label: 'Result', value: asScenario.value.result }] : []),
      { label: 'Steps', value: asScenario.value.steps.length },
      { label: 'Decision points', value: asScenario.value.decisionPoints.length }
    ]
    case 'rule': return [
      {
        label: 'Explicit bindings',
        value: asRule.value.appliesTo.length
      },
      { label: 'Scopes', value: asRule.value.availability.length },
      { label: 'References', value: asRule.value.references.length }
    ]
  }
})

const entryPoints = computed(() => 'entryPoints' in props.entity ? props.entity.entryPoints : [])
const availability = computed(() => 'availability' in props.entity ? props.entity.availability : [])
const accessNote = computed(() => {
  if (props.entity.kind === 'rule' && !availability.value.length) {
    return 'Not narrowed to specific Interface or Experience scopes.'
  }
  return ''
})
const hasAccess = computed(() => entryPoints.value.length > 0 || availability.value.length > 0 || Boolean(accessNote.value))

const capabilityBoundary = computed(() => {
  if (props.entity.kind === 'interface') return asInterface.value.capabilityBoundary
  if (props.entity.kind === 'experience') return asExperience.value.capabilityBoundary
  if (props.entity.kind === 'screen') return asScreen.value.capabilityBoundary
  return ''
})

const row = (label: string, kind: ReportEntityKind, ids: string[]): RelationRow => ({ label, kind, ids })
const group = (label: RelationGroup['label'], rows: RelationRow[]): RelationGroup | null => {
  const present = rows.filter(item => item.ids.length)
  return present.length ? { label, rows: present } : null
}

const relationGroups = computed<RelationGroup[]>(() => {
  const groups: Array<RelationGroup | null> = []
  switch (props.entity.kind) {
    case 'actor':
      groups.push(group('Derived', [
        row('Interfaces entered', 'interface', asActor.value.interfaceIds),
        row('Experiences entered', 'experience', asActor.value.experienceIds),
        row('Journeys performed', 'journey', asActor.value.journeyIds)
      ]))
      break
    case 'interface':
      groups.push(group('Authored', [row('Actors', 'actor', asInterface.value.actorIds)]))
      groups.push(group('Derived', [
        row('Experiences within', 'experience', asInterface.value.experienceIds),
        row('Capabilities available', 'capability', asInterface.value.capabilityIds),
        row('Screens available', 'screen', asInterface.value.screenIds),
        row('Journeys available', 'journey', asInterface.value.journeyIds)
      ]))
      break
    case 'experience':
      groups.push(group('Authored', [
        row('Actors', 'actor', asExperience.value.actorIds),
        row('Interfaces', 'interface', asExperience.value.interfaceIds)
      ]))
      groups.push(group('Derived', [
        row('Capabilities available', 'capability', asExperience.value.capabilityIds),
        row('Screens available', 'screen', asExperience.value.screenIds),
        row('Journeys available', 'journey', asExperience.value.journeyIds)
      ]))
      break
    case 'screen':
      groups.push(group('Authored', [
        row('Capabilities', 'capability', asScreen.value.capabilityIds),
        row('Capability Scenarios', 'capability-scenario', asScreen.value.capabilityScenarioIds),
        row('Journey Scenarios', 'journey-scenario', asScreen.value.journeyScenarioIds)
      ]))
      groups.push(group('Derived', [
        row('Journeys via linked Journey Scenarios', 'journey', asScreen.value.scenarioJourneyIds),
        row('Journeys via exposed Capabilities', 'journey', asScreen.value.capabilityJourneyIds)
      ]))
      break
    case 'domain':
      groups.push(group('Derived', [
        row('Capabilities', 'capability', asDomain.value.capabilityIds),
        row('Journeys reached', 'journey', asDomain.value.journeyIds),
        row('Screens reached', 'screen', asDomain.value.screenIds),
        row('Rules', 'rule', asDomain.value.ruleIds)
      ]))
      break
    case 'capability':
      groups.push(group('Authored', [row('Domain', 'domain', asCapability.value.domainId ? [asCapability.value.domainId] : [])]))
      groups.push(group('Derived', [
        row('Capability Scenarios', 'capability-scenario', asCapability.value.scenarioIds),
        row('Exercised by Journey Scenarios', 'journey-scenario', asCapability.value.journeyScenarioIds),
        row('Used by Journeys', 'journey', asCapability.value.journeyIds),
        row('Exposed by Screens', 'screen', asCapability.value.screenIds),
        row('Constrained by Rules', 'rule', asCapability.value.ruleIds)
      ]))
      break
    case 'journey':
      groups.push(group('Authored', [row('Actors', 'actor', asJourney.value.actorIds)]))
      groups.push(group('Derived', [
        row('Primary Capabilities', 'capability', asJourney.value.capabilityIds),
        row('Failure-only Capabilities', 'capability', asJourney.value.failureOnlyCapabilityIds),
        row('Domains', 'domain', asJourney.value.domainIds),
        row('Scenarios', 'journey-scenario', asJourney.value.scenarioIds),
        row('Screens', 'screen', asJourney.value.screenIds),
        row('Constrained by Rules', 'rule', asJourney.value.ruleIds)
      ]))
      break
    case 'capability-scenario':
    case 'journey-scenario':
      groups.push(group('Authored', [
        row('Actors', 'actor', asScenario.value.actorIds),
        asScenario.value.scenarioType === 'capability'
          ? row('Capability', 'capability', [asScenario.value.capabilityId])
          : row('Journey', 'journey', [asScenario.value.journeyId])
      ]))
      groups.push(group('Derived', [
        row('Shown on Screens', 'screen', asScenario.value.screenIds),
        row('Constrained by Rules', 'rule', asScenario.value.ruleIds)
      ]))
      break
    case 'rule':
      groups.push(group('Authored', [
        row('Capabilities', 'capability', asRule.value.capabilityIds),
        row('Journeys', 'journey', asRule.value.journeyIds),
        row('Capability Scenarios', 'capability-scenario', asRule.value.capabilityScenarioIds),
        row('Journey Scenarios', 'journey-scenario', asRule.value.journeyScenarioIds)
      ]))
      {
        const reachedCapabilities = new Set([...asRule.value.capabilityIds, ...asRule.value.derivedCapabilityIds])
        const reachedJourneys = new Set([...asRule.value.journeyIds, ...asRule.value.derivedJourneyIds])
        const derivedScreens = props.workspace.screens
          .filter(screen => screen.capabilityIds.some(id => reachedCapabilities.has(id))
            || screen.scenarioIds.some(id => asRule.value.scenarioIds.includes(id))
            || screen.journeyIds.some(id => reachedJourneys.has(id)))
          .map(screen => screen.id)
        groups.push(group('Derived', [
          row('Domains through targets', 'domain', asRule.value.domainIds),
          row('Parent Capabilities', 'capability', asRule.value.derivedCapabilityIds),
          row('Parent Journeys', 'journey', asRule.value.derivedJourneyIds),
          row('Screens reached', 'screen', derivedScreens)
        ]))
      }
      break
  }
  return groups.filter((item): item is RelationGroup => Boolean(item))
})

function selectId(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}

function relationTitle(kind: ReportEntityKind, id: string): string {
  return resolveEntity(props.workspace, kind, id)?.title ?? id
}

function routeStageTitle(stageId: string): string {
  return asScenario.value.flow.find(item => item.id === stageId)?.operation ?? stageId
}
</script>

<template>
  <article class="space-y-8 pb-8">
    <section class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <code class="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted">{{ entity.id }}</code>
        <UBadge v-if="badge" color="neutral" variant="subtle" size="sm">{{ badge }}</UBadge>
      </div>

      <BlrProse
        v-if="!isScenario && entity.kind !== 'rule'"
        :text="entity.lead"
        size="base"
        class="max-w-2xl text-default"
      />

      <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-default bg-default sm:grid-cols-3">
        <div v-for="fact in facts" :key="fact.label" class="min-w-0 bg-elevated/35 px-3.5 py-3">
          <dt class="text-xs font-medium text-muted">{{ fact.label }}</dt>
          <dd class="mt-1 truncate text-sm font-medium text-highlighted" :title="String(fact.value)">{{ fact.value }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="entity.kind === 'rule'" class="space-y-3">
      <h3 class="blr-inspector-heading">Rule statement</h3>
      <div class="rounded-xl border-s-3 border-primary bg-elevated/45 p-4">
        <BlrProse :text="asRule.statement" size="base" />
      </div>
      <div v-if="asRule.rationale" class="space-y-2">
        <h4 class="text-sm font-semibold text-highlighted">Rationale</h4>
        <BlrProse :text="asRule.rationale" />
      </div>
    </section>

    <section v-if="entity.intent" class="space-y-2">
      <h3 class="blr-inspector-heading">Intent</h3>
      <BlrProse :text="entity.intent" />
    </section>

    <section v-if="capabilityBoundary" class="space-y-2">
      <h3 class="blr-inspector-heading">Capability boundary</h3>
      <div class="rounded-xl border border-default bg-elevated/35 p-4 text-default">
        <BlrProse :text="capabilityBoundary" />
      </div>
    </section>

    <section v-if="entity.kind === 'journey'" class="space-y-2">
      <h3 class="blr-inspector-heading">Success criterion</h3>
      <BlrProse :text="asJourney.successCriterion" />
    </section>

    <section v-if="isScenario" class="space-y-5">
      <div class="space-y-2">
        <h3 class="blr-inspector-heading">Trigger</h3>
        <BlrProse :text="asScenario.trigger" size="base" />
      </div>

      <div v-if="asScenario.flow.length" class="space-y-3">
        <h3 class="blr-inspector-heading">Flow <span class="blr-meta ms-1">{{ asScenario.flow.length }}</span></h3>
        <ol class="space-y-2">
          <li v-for="(item, index) in asScenario.flow" :key="`${item.capabilityId}-${index}`" class="rounded-lg border border-default px-3.5 py-3">
            <p class="text-sm font-medium text-highlighted">{{ index + 1 }}. {{ item.operation }}</p>
            <BlrLinks :workspace="workspace" :ids="[item.capabilityId]" kind="capability" label="Capability" interactive @select="emit('select', $event)" />
            <BlrAvail :pairs="item.availability" label="Contexts" />
          </li>
        </ol>
      </div>

      <div v-if="asScenario.routes.length" class="space-y-3">
        <h3 class="blr-inspector-heading">Routes <span class="blr-meta ms-1">{{ asScenario.routes.length }}</span></h3>
        <div v-for="route in asScenario.routes" :key="route.id" class="rounded-xl border border-default p-4">
          <code class="rounded bg-muted px-2 py-1 font-mono text-xs text-muted">{{ route.id }}</code>
          <ol class="mt-3 space-y-2">
            <li v-for="(item, index) in route.contexts" :key="item.stageId" class="rounded-lg bg-elevated/35 px-3 py-2.5">
              <p class="text-sm font-medium text-highlighted">{{ index + 1 }}. {{ routeStageTitle(item.stageId) }}</p>
              <BlrAvail :pairs="[item.context]" label="Context" />
            </li>
          </ol>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="blr-inspector-heading">Steps <span class="blr-meta ms-1">{{ asScenario.steps.length }}</span></h3>
        <ol class="space-y-2">
          <li v-for="(step, index) in asScenario.steps" :key="index" class="flex gap-3 rounded-lg border border-default px-3.5 py-3">
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-muted">{{ index + 1 }}</span>
            <span class="pt-0.5 text-sm leading-5 text-default">{{ step }}</span>
          </li>
        </ol>
      </div>

      <div v-if="asScenario.decisionPoints.length" class="space-y-3">
        <h3 class="blr-inspector-heading">Decision points <span class="blr-meta ms-1">{{ asScenario.decisionPoints.length }}</span></h3>
        <div v-for="point in asScenario.decisionPoints" :key="point.title" class="rounded-xl border border-dashed border-accented p-4">
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

      <div class="space-y-2">
        <h3 class="blr-inspector-heading">Outcome</h3>
        <BlrProse :text="asScenario.outcome" />
      </div>

      <div v-if="asScenario.edgeCases.length" class="space-y-2">
        <h3 class="blr-inspector-heading">Edge cases <span class="blr-meta ms-1">{{ asScenario.edgeCases.length }}</span></h3>
        <ul class="space-y-2 text-sm text-default">
          <li v-for="edgeCase in asScenario.edgeCases" :key="edgeCase" class="flex gap-2">
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
          </li>
        </ul>
      </div>
    </section>

    <section v-if="entity.kind === 'screen'" class="space-y-5">
      <div class="space-y-2">
        <h3 class="blr-inspector-heading">Information presented <span class="blr-meta ms-1">{{ asScreen.information.length }}</span></h3>
        <ul class="grid gap-2 sm:grid-cols-2">
          <li v-for="item in asScreen.information" :key="item" class="rounded-lg border border-default px-3 py-2.5 text-sm text-default">{{ item }}</li>
        </ul>
      </div>
      <div v-if="asScreen.actions.length" class="space-y-2">
        <h3 class="blr-inspector-heading">Available actions <span class="blr-meta ms-1">{{ asScreen.actions.length }}</span></h3>
        <ul class="space-y-2">
          <li v-for="item in asScreen.actions" :key="item" class="flex items-start gap-2 text-sm text-default">
            <UIcon name="i-lucide-mouse-pointer-click" class="mt-0.5 size-4 shrink-0 text-muted" />{{ item }}
          </li>
        </ul>
      </div>
      <div v-if="asScreen.states.length" class="space-y-2">
        <h3 class="blr-inspector-heading">Product states <span class="blr-meta ms-1">{{ asScreen.states.length }}</span></h3>
        <div class="grid gap-2 sm:grid-cols-2">
          <div v-for="state in asScreen.states" :key="state.title" class="rounded-xl border border-default bg-elevated/30 p-3.5">
            <p class="text-sm font-semibold text-highlighted">{{ state.title }}</p>
            <BlrProse :text="state.description" class="mt-1.5" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="hasAccess" class="space-y-3">
      <h3 class="blr-inspector-heading">Access and placement</h3>
      <div v-if="availability.length" class="space-y-2">
        <p class="text-xs font-medium text-muted">Available in</p>
        <div class="divide-y divide-default overflow-hidden rounded-xl border border-default">
          <div v-for="pair in availability" :key="pair.key" class="flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-sm">
            <button type="button" class="font-medium text-highlighted hover:text-primary" @click="selectId('interface', pair.interfaceId)">{{ pair.interfaceTitle }}</button>
            <template v-if="pair.experienceId">
              <UIcon name="i-lucide-chevron-right" class="size-3.5 text-dimmed" />
              <button type="button" class="text-default hover:text-primary" @click="selectId('experience', pair.experienceId)">{{ pair.experienceTitle }}</button>
            </template>
            <span v-else class="text-xs text-muted">Direct</span>
          </div>
        </div>
      </div>
      <p v-else-if="accessNote" class="rounded-xl border border-dashed border-default px-3.5 py-3 text-sm text-muted">
        {{ accessNote }}
      </p>
      <div v-if="entryPoints.length" class="space-y-2">
        <p class="text-xs font-medium text-muted">Entry points</p>
        <div class="divide-y divide-default overflow-hidden rounded-xl border border-default">
          <div v-for="point in entryPoints" :key="`${point.interfaceId}-${point.path}`" class="grid gap-1 px-3.5 py-2.5 sm:grid-cols-[11rem_1fr] sm:items-center">
            <button type="button" class="truncate text-start text-sm font-medium text-highlighted hover:text-primary" @click="selectId('interface', point.interfaceId)">{{ point.interfaceTitle }}</button>
            <code class="truncate font-mono text-xs text-default" :title="point.path">{{ point.path }}</code>
          </div>
        </div>
      </div>
    </section>

    <section v-if="relationGroups.length" class="space-y-4 border-t border-default pt-6">
      <h3 class="blr-inspector-heading">Connections</h3>
      <div v-for="relationGroup in relationGroups" :key="relationGroup.label" class="space-y-3">
        <div class="flex items-center gap-2">
          <p class="text-xs font-semibold text-muted">{{ relationGroup.label }}</p>
          <UBadge v-if="relationGroup.label === 'Derived'" color="neutral" variant="outline" size="sm">Computed</UBadge>
        </div>
        <div v-for="relation in relationGroup.rows" :key="relation.label" class="space-y-2">
          <p class="flex items-center gap-2 text-xs font-medium text-muted">
            <UIcon :name="ENTITY_KIND_META[relation.kind].icon" class="size-3.5" />
            {{ relation.label }}
            <span class="font-mono text-dimmed">{{ relation.ids.length }}</span>
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="id in relation.ids"
              :key="id"
              type="button"
              class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-default bg-elevated/35 px-2.5 py-1.5 text-sm text-default transition hover:border-accented hover:bg-elevated hover:text-highlighted"
              @click="selectId(relation.kind, id)"
            >
              <BlrKind :kind="relation.kind" :labelled="false" size="xs" />
              <span class="truncate">{{ relationTitle(relation.kind, id) }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="entity.supportingContent" class="space-y-2 border-t border-default pt-6">
      <h3 class="blr-inspector-heading">Supporting context</h3>
      <BlrProse :text="entity.supportingContent" />
    </section>

    <section v-if="entity.references.length" class="border-t border-default pt-6">
      <BlrRefs :references="entity.references" variant="list" />
    </section>
  </article>
</template>

<style scoped>
.blr-inspector-heading {
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}
</style>
