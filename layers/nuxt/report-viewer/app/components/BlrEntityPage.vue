<script setup lang="ts">
/**
 * One entity, in full, at a URL.
 *
 * Generalized from the Journey page, which was the only entity page in the report
 * shaped the way a reading wants to be: the promise, where it is reachable, its
 * relations as links, then its children. Every kind gets that now,
 * because "which kinds deserve a page" is a judgement call that has to be
 * re-made for every field anyone adds, and "all of them" never does.
 *
 * Kinds with no authored body of their own — Actor, Interface, Experience,
 * Domain — are not thin versions of this page. Their reach *is* their content,
 * so the neighbourhood graph is their body rather than an extra.
 */
import type { AnyEntityView, JourneyView, ReportEntityKind, ReportWorkspace, ScenarioView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, counterpartsOf } from '../utils/reportWorkspace'

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
}>()

const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])

/* Kinds whose reach is the reading: the graph is the body, not an addition. */
const GRAPH_LED: ReportEntityKind[] = ['actor', 'interface', 'experience', 'domain']
const graphLed = computed(() => GRAPH_LED.includes(props.entity.kind))

/* Context belongs in the Overview only when it is authored entity meaning.
   Capability availability is such a contract; Journey and Scenario Contexts
   are route projections and Screens already carry their place in identity. */
const contexts = computed(() => props.entity.kind === 'capability' ? props.entity.contexts : [])
const entryPoints = computed(() => props.entity.kind === 'journey' ? props.entity.entryPoints : [])

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
  The same thing on another Interface.

  Two Screens sharing a path suffix below their Interface are counterparts, and
  the format says so deliberately — `personal-library::saved-items` on web and
  on mobile pursue one goal through separate Interfaces. Without this the Screens collection
  reads as a list with duplicates in it.
*/
const counterparts = computed(() => counterpartsOf(props.workspace, props.entity))

const asJourney = computed(() => props.entity as JourneyView)
</script>

<template>
  <article class="space-y-8">
    <header v-if="entity.lead">
      <BlrProse :text="entity.lead" size="base" class="max-w-3xl" />
    </header>

    <BlrContexts
      v-if="contexts.length || entryPoints.length"
      :workspace="workspace"
      :contexts="contexts"
      :entry-points="entryPoints"
      @select="emit('select', $event)"
    />

    <BlrEntityBody
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      :workspace="workspace"
      :entity="entity"
      @select="emit('select', $event)"
    />

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
          The same {{ meta.label.toLowerCase() }} on another Interface — one goal, separate Interfaces.
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
