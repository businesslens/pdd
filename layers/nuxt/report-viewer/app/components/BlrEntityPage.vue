<script setup lang="ts">
/**
 * One entity, in full, at a URL.
 *
 * Generalized from the Journey page, which was the only surface in the report
 * shaped the way a reading wants to be: the promise, where it is reachable, its
 * relations as links, then its children. Every kind gets that now,
 * because "which kinds deserve a page" is a judgement call that has to be
 * re-made for every field anyone adds, and "all of them" never does.
 *
 * Kinds with no authored body of their own — Actor, Interface, Experience,
 * Domain — are not thin versions of this page. Their reach *is* their content,
 * so the neighbourhood graph is their body rather than an extra.
 */
import type { AnyEntityView, InterfaceView, JourneyView, ReportEntityKind, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, counterpartsOf, isScenarioKind, resolveEntityKey } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  /** The entity the peek is currently on, so the page can mark it. */
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  /** Peek at a related entity without leaving this page. */
  select: [entity: AnyEntityView]
  /** Go to another entity's page. */
  open: [entity: AnyEntityView]
  /** Show this entity's neighbourhood on the topology canvas. */
  focus: [entity: AnyEntityView]
}>()

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])

/* Kinds whose reach is the reading: the graph is the body, not an addition. */
const GRAPH_LED: ReportEntityKind[] = ['actor', 'interface', 'experience', 'domain']
const graphLed = computed(() => GRAPH_LED.includes(props.entity.kind))

const availability = computed(() => 'availability' in props.entity ? props.entity.availability : [])
const entryPoints = computed(() => 'entryPoints' in props.entity ? props.entity.entryPoints : [])

/** A parent's Scenarios, read where the parent is read. */
const children = computed<ScenarioView[]>(() => {
  if (props.entity.kind === 'capability') {
    return props.workspace.scenariosByCapability.get(props.entity.id) ?? []
  }
  if (props.entity.kind === 'journey') {
    return props.workspace.scenariosByJourney.get(props.entity.id) ?? []
  }
  return []
})

const childLabel = computed(() => props.entity.kind === 'capability' ? 'Capability Scenarios' : 'Journey Scenarios')

/*
  The same thing on another surface.

  Two Screens sharing a path suffix below their Interface are counterparts, and
  the format says so deliberately — `personal-library::saved-items` on web and
  on mobile pursue one goal on two surfaces. Without this the Screens collection
  reads as a list with duplicates in it.
*/
const counterparts = computed(() => counterpartsOf(props.workspace, props.entity))

const parentOf = computed<AnyEntityView | null>(() => {
  const entity = props.entity
  if (!isScenarioKind(entity.kind)) return null
  const scenario = entity as ScenarioView
  const key = scenario.scenarioType === 'capability'
    ? `capability:${scenario.capabilityId}`
    : `journey:${scenario.journeyId}`
  return resolveEntityKey(props.workspace, key) ?? null
})

const asJourney = computed(() => props.entity as JourneyView)
const asInterface = computed(() => props.entity as InterfaceView)
</script>

<template>
  <article class="space-y-8">
    <header class="space-y-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <BlrKind :kind="entity.kind" />
        <h1 class="text-2xl font-semibold tracking-[-0.02em] text-highlighted">{{ entity.title }}</h1>
        <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ entity.id }}</code>
        <BlrInterfaceType
          v-if="entity.kind === 'interface'"
          :type="asInterface.interfaceType"
          labelled
        />
        <UButton
          icon="i-lucide-waypoints"
          color="neutral"
          variant="outline"
          size="xs"
          label="Neighbourhood"
          class="ms-auto"
          title="Show this entity on the topology canvas"
          @click="emit('focus', entity)"
        />
      </div>
      <!-- A child says which parent it belongs to, and links to it. -->
      <button
        v-if="parentOf"
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
        @click="emit('open', parentOf)"
      >
        <UIcon :name="ENTITY_KIND_META[parentOf.kind].icon" class="size-3.5" />
        <span class="text-dimmed">{{ ENTITY_KIND_META[parentOf.kind].label }}</span>
        <span class="font-medium underline decoration-(--ui-border-accented) underline-offset-3">{{ parentOf.title }}</span>
      </button>
      <BlrProse v-if="entity.lead" :text="entity.lead" size="base" class="max-w-3xl" />
    </header>

    <BlrAvail
      v-if="availability.length || entryPoints.length"
      :pairs="availability"
      :entry-points="entryPoints"
    />

    <BlrEntityBody :workspace="workspace" :entity="entity" @select="emit('select', $event)" />

    <!-- Graph-led kinds: the reach is the reading. -->
    <section v-if="graphLed" class="space-y-2 border-t border-default pt-6">
      <header class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-base font-semibold tracking-tight text-highlighted">Neighbourhood</h2>
        <span class="text-xs text-muted">
          What this {{ meta.label }} reaches, and what reaches it. Select a box to read it.
        </span>
      </header>
      <div class="h-[30rem] overflow-hidden rounded-xl border border-default bg-default">
        <BlrTopology
          :workspace="workspace"
          :focus-id="entity.key"
          direction="LR"
          class="h-full"
          @inspect="emit('select', $event)"
        />
      </div>
    </section>

    <section v-if="counterparts.length" class="space-y-3 border-t border-default pt-6">
      <header class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-base font-semibold tracking-tight text-highlighted">Also on</h2>
        <span class="text-xs text-muted">
          The same {{ meta.label.toLowerCase() }} on another Interface — one goal, two surfaces.
        </span>
      </header>
      <div class="space-y-2">
        <BlrEntityCard
          v-for="counterpart in counterparts"
          :key="counterpart.key"
          :workspace="workspace"
          :entity="counterpart"
          @open="emit('open', $event)"
        />
      </div>
    </section>

    <section v-if="entity.kind === 'capability' || entity.kind === 'journey'" class="space-y-3 border-t border-default pt-6">
      <header class="flex flex-wrap items-baseline gap-2">
        <h2 class="text-base font-semibold tracking-tight text-highlighted">{{ childLabel }}</h2>
        <span class="blr-meta">{{ children.length }}</span>
        <span class="text-xs text-muted">
          <template v-if="entity.kind === 'journey'">
            Each Scenario shows what triggers it, its Steps, where it branches, and how it ends.
          </template>
          <template v-else>
            Each is one observable acceptance case for this Capability.
          </template>
        </span>
      </header>
      <p v-if="!children.length" class="text-sm text-muted italic">
        No Scenarios name this {{ meta.label }}.
      </p>
      <div v-else class="space-y-2">
        <BlrEntityCard
          v-for="child in children"
          :key="child.key"
          :workspace="workspace"
          :entity="child"
          :active="child.key === selectedKey"
          badge
          @open="emit('open', $event)"
        />
      </div>
    </section>

    <section class="space-y-3 border-t border-default pt-6">
      <h2 class="text-base font-semibold tracking-tight text-highlighted">Connections</h2>
      <BlrConnections :workspace="workspace" :entity="entity" @select="emit('open', $event)" />
    </section>

    <section v-if="entity.supportingContent" class="space-y-2 border-t border-default pt-6">
      <h2 class="text-base font-semibold tracking-tight text-highlighted">Supporting context</h2>
      <BlrProse :text="entity.supportingContent" class="max-w-3xl" />
    </section>

    <section v-if="entity.references.length" class="border-t border-default pt-6">
      <BlrRefs :references="entity.references" variant="list" />
    </section>

    <p v-if="entity.kind === 'journey' && asJourney.stepCount" class="blr-meta">
      {{ asJourney.stepCount }} authored steps across {{ children.length }} Scenarios.
    </p>
  </article>
</template>
