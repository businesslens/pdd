<script setup lang="ts">
/**
 * What one entity touches.
 *
 * The rows are grouped by the kind on the other end, because that is the
 * question a reader arrives with — "what Screens does this reach" — and not by
 * whether the model authored the link or derived it. That distinction is real
 * and stays visible on the row, but it is a property of the connection, not the
 * heading a reader should have to read past first.
 *
 * A relation label is kept whole rather than merged into its kind: "Journeys
 * via linked Journey Scenarios" and "Journeys via exposed Capabilities" reach
 * the same kind by different derivations, and collapsing them would be exactly
 * the ambiguity the named views exist to avoid.
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
import { ENTITY_KIND_META, resolveEntity } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  /** Cap the chips per row; the overflow becomes a count. 0 shows everything. */
  max?: number
  /** Cap the rows themselves, so a peek stays one screen whatever it is on. */
  maxRows?: number
}>(), { max: 0, maxRows: 0 })

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

interface RelationRow {
  label: string
  kind: ReportEntityKind
  ids: string[]
  derived: boolean
}

const row = (label: string, kind: ReportEntityKind, ids: string[], derived: boolean): RelationRow =>
  ({ label, kind, ids, derived })

const rows = computed<RelationRow[]>(() => {
  const entity = props.entity
  const all: RelationRow[] = []
  switch (entity.kind) {
    case 'actor': {
      const actor = entity as ActorView
      all.push(
        row('Interfaces entered', 'interface', actor.interfaceIds, true),
        row('Experiences entered', 'experience', actor.experienceIds, true),
        row('Journeys performed', 'journey', actor.journeyIds, true)
      )
      break
    }
    case 'interface': {
      const item = entity as InterfaceView
      all.push(
        row('Actors', 'actor', item.actorIds, false),
        row('Experiences within', 'experience', item.experienceIds, true),
        row('Capabilities available', 'capability', item.capabilityIds, true),
        row('Screens available', 'screen', item.screenIds, true),
        row('Journeys available', 'journey', item.journeyIds, true)
      )
      break
    }
    case 'experience': {
      const item = entity as ExperienceView
      all.push(
        row('Actors', 'actor', item.actorIds, false),
        row('Interfaces', 'interface', item.interfaceIds, false),
        row('Capabilities available', 'capability', item.capabilityIds, true),
        row('Screens available', 'screen', item.screenIds, true),
        row('Journeys available', 'journey', item.journeyIds, true)
      )
      break
    }
    case 'screen': {
      const screen = entity as ScreenView
      all.push(
        row('Capabilities', 'capability', screen.capabilityIds, false),
        row('Capability Scenarios', 'capability-scenario', screen.capabilityScenarioIds, false),
        row('Journey Scenarios', 'journey-scenario', screen.journeyScenarioIds, false),
        row('Journeys via linked Journey Scenarios', 'journey', screen.scenarioJourneyIds, true),
        row('Journeys via exposed Capabilities', 'journey', screen.capabilityJourneyIds, true)
      )
      break
    }
    case 'domain': {
      const domain = entity as DomainView
      all.push(
        row('Capabilities', 'capability', domain.capabilityIds, true),
        row('Journeys reached', 'journey', domain.journeyIds, true),
        row('Screens reached', 'screen', domain.screenIds, true),
        row('Rules', 'rule', domain.ruleIds, true)
      )
      break
    }
    case 'capability': {
      const capability = entity as CapabilityView
      all.push(
        row('Domain', 'domain', capability.domainId ? [capability.domainId] : [], false),
        row('Capability Scenarios', 'capability-scenario', capability.scenarioIds, true),
        row('Exercised by Journey Scenarios', 'journey-scenario', capability.journeyScenarioIds, true),
        row('Used by Journeys', 'journey', capability.journeyIds, true),
        row('Exposed by Screens', 'screen', capability.screenIds, true),
        row('Constrained by Rules', 'rule', capability.ruleIds, true)
      )
      break
    }
    case 'journey': {
      const journey = entity as JourneyView
      all.push(
        row('Actors', 'actor', journey.actorIds, false),
        row('Primary Capabilities', 'capability', journey.capabilityIds, true),
        row('Failure-only Capabilities', 'capability', journey.failureOnlyCapabilityIds, true),
        row('Domains', 'domain', journey.domainIds, true),
        row('Scenarios', 'journey-scenario', journey.scenarioIds, true),
        row('Screens', 'screen', journey.screenIds, true),
        row('Constrained by Rules', 'rule', journey.ruleIds, true)
      )
      break
    }
    case 'capability-scenario':
    case 'journey-scenario': {
      const scenario = entity as ScenarioView
      all.push(
        row('Actors', 'actor', scenario.actorIds, false),
        scenario.scenarioType === 'capability'
          ? row('Capability', 'capability', [scenario.capabilityId], false)
          : row('Journey', 'journey', [scenario.journeyId], false),
        row('Shown on Screens', 'screen', scenario.screenIds, true),
        row('Constrained by Rules', 'rule', scenario.ruleIds, true)
      )
      break
    }
    case 'rule': {
      const rule = entity as RuleView
      const reachedCapabilities = new Set([...rule.capabilityIds, ...rule.derivedCapabilityIds])
      const reachedJourneys = new Set([...rule.journeyIds, ...rule.derivedJourneyIds])
      const derivedScreens = props.workspace.screens
        .filter(screen => screen.capabilityIds.some(id => reachedCapabilities.has(id))
          || screen.scenarioIds.some(id => rule.scenarioIds.includes(id))
          || screen.journeyIds.some(id => reachedJourneys.has(id)))
        .map(screen => screen.id)
      all.push(
        row('Capabilities', 'capability', rule.capabilityIds, false),
        row('Journeys', 'journey', rule.journeyIds, false),
        row('Capability Scenarios', 'capability-scenario', rule.capabilityScenarioIds, false),
        row('Journey Scenarios', 'journey-scenario', rule.journeyScenarioIds, false),
        row('Domains through targets', 'domain', rule.domainIds, true),
        row('Parent Capabilities', 'capability', rule.derivedCapabilityIds, true),
        row('Parent Journeys', 'journey', rule.derivedJourneyIds, true),
        row('Screens reached', 'screen', derivedScreens, true)
      )
      break
    }
  }
  return all.filter(item => item.ids.length)
})

/* Authored rows first when the list is capped: a derived reach is the thing a
   reader is most willing to open a page for. */
const ordered = computed(() => [...rows.value].sort((left, right) =>
  Number(left.derived) - Number(right.derived)))

const shownRows = computed(() => props.maxRows ? ordered.value.slice(0, props.maxRows) : ordered.value)
const hiddenRows = computed(() => ordered.value.length - shownRows.value.length)

function shown(item: RelationRow): string[] {
  return props.max ? item.ids.slice(0, props.max) : item.ids
}

function overflow(item: RelationRow): number {
  return props.max ? Math.max(0, item.ids.length - props.max) : 0
}

/*
  Two counterparts reaching the same entity produce two chips with one name.

  "Source list, Source list" reads as a rendering bug rather than as the true
  statement that this Capability is exposed on both surfaces. The Interface is
  the segment that distinguishes them, and it is added only where the ambiguity
  is actually present — every other chip stays short.
*/
function title(kind: ReportEntityKind, id: string, siblings: string[]): string {
  const entity = resolveEntity(props.workspace, kind, id)
  if (!entity) return id
  const shared = siblings.filter((other) => {
    if (other === id) return false
    return resolveEntity(props.workspace, kind, other)?.title === entity.title
  })
  if (!shared.length) return entity.title
  const [surface] = entity.id.split('::')
  if (!surface || surface === entity.id) return entity.title
  const owner = resolveEntity(props.workspace, 'interface', surface)?.title ?? surface
  return `${entity.title} · ${owner.replace(/ application$/, '')}`
}

function pick(kind: ReportEntityKind, id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}

function interfaceType(kind: ReportEntityKind, id: string) {
  if (kind !== 'interface') return undefined
  const entity = resolveEntity(props.workspace, 'interface', id)
  return entity?.kind === 'interface' ? entity.interfaceType : undefined
}
</script>

<template>
  <div v-if="rows.length" class="space-y-3.5">
    <div v-for="item in shownRows" :key="item.label" class="space-y-1.5">
      <p class="flex items-center gap-2 text-xs font-medium text-muted">
        <UIcon
          :name="ENTITY_KIND_META[item.kind].icon"
          class="size-3.5 shrink-0"
          :style="{ color: `var(--blr-slot-${ENTITY_KIND_META[item.kind].slot})` }"
        />
        {{ item.label }}
        <span class="font-mono text-dimmed">{{ item.ids.length }}</span>
        <!-- Provenance rides on the row, not above a wall of them. -->
        <span v-if="item.derived" class="blr-derived" title="Derived from the model, never authored here">derived</span>
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="id in shown(item)"
          :key="id"
          type="button"
          class="blr-connection"
          :class="item.derived && 'blr-connection--derived'"
          @click="pick(item.kind, id)"
        >
          <BlrKind
            :kind="item.kind"
            :interface-type="interfaceType(item.kind, id)"
            :labelled="false"
            size="xs"
          />
          <span class="truncate">{{ title(item.kind, id, item.ids) }}</span>
        </button>
        <span v-if="overflow(item)" class="self-center text-xs text-dimmed">+{{ overflow(item) }}</span>
      </div>
    </div>
    <!-- Say what was left out. A silent cut reads as "that is all of it". -->
    <p v-if="hiddenRows > 0" class="text-xs text-dimmed">
      {{ hiddenRows }} more {{ hiddenRows === 1 ? 'relation' : 'relations' }} on the page.
    </p>
  </div>
</template>

<style scoped>
.blr-connection {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 35%, transparent);
  font-size: var(--text-sm);
  color: var(--ui-text-default);
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.blr-connection:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

/* Dashed: the model computed this link rather than someone writing it down. */
.blr-connection--derived {
  border-style: dashed;
}

.blr-derived {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
</style>
