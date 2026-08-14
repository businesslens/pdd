<script setup lang="ts">
/**
 * Storyline — the model as promises unfolding in time.
 *
 * Premise: a Product is what it promises an Actor, and a promise has a shape in
 * time — a trigger, an ordered run of Capabilities, a place it lands, and an
 * ending that either was or was not the one promised. Every other view in this
 * lab arranges entities by *type*. This one arranges them by *when*.
 *
 * A Journey is a band; each of its Scenarios is a track inside that band, read
 * left to right. Two tracks under one band with different endings is the whole
 * argument for Journey Scenarios existing, and it is invisible in a list.
 *
 * The stated cost — everything not on a Journey — is turned into the last
 * section rather than hidden: a Capability no promise reaches is a finding
 * about the model, and no other reading in this lab surfaces it at all.
 */
import type { AnyEntityView, JourneyView, ReportWorkspace, ScenarioView } from '../utils/model'
import { ENTITY_KIND_META, resolveEntities, resolveEntity } from '../utils/model'
import type { WorkbenchVariant } from '../utils/workbenchVariants'

const props = defineProps<{
  workspace: ReportWorkspace
  variant: WorkbenchVariant
  logoSrc?: string | null
}>()

const selected = ref<AnyEntityView | null>(null)
const openJourneyId = ref<string>(props.workspace.journeys[0]?.id ?? '')

interface Stage {
  key: string
  order: number
  operation: string
  capability: AnyEntityView | null
  screens: AnyEntityView[]
}

interface Track {
  scenario: ScenarioView
  stages: Stage[]
  screens: AnyEntityView[]
}

interface Band {
  journey: JourneyView
  actors: AnyEntityView[]
  tracks: Track[]
}

const bands = computed<Band[]>(() => props.workspace.journeys.map((journey) => {
  const scenarios = props.workspace.scenariosByJourney.get(journey.id) ?? []
  return {
    journey,
    actors: resolveEntities(props.workspace, 'actor', journey.actorIds),
    tracks: scenarios.map(scenario => ({
      scenario,
      screens: resolveEntities(props.workspace, 'screen', scenario.screenIds),
      stages: scenario.flow.map((item, index) => ({
        key: `${scenario.key}:${item.id || index}`,
        order: index + 1,
        operation: item.operation,
        capability: resolveEntity(props.workspace, 'capability', item.capabilityId) ?? null,
        screens: []
      }))
    }))
  }
}))

const openBand = computed(() => bands.value.find(band => band.journey.id === openJourneyId.value) ?? bands.value[0])

/*
  What no promise reaches.

  A Capability no Journey Scenario runs through, and a Screen no Scenario lands
  on, are the two shapes of "authored but unpromised". Neither is necessarily
  wrong — an admin Capability may be real and unmapped — but a reading organized
  by promise owes the reader the list it cannot show.
*/
const unreached = computed(() => {
  const inFlow = new Set<string>()
  const landedOn = new Set<string>()
  for (const scenario of props.workspace.journeyScenarios) {
    for (const item of scenario.flow) inFlow.add(item.capabilityId)
    for (const id of scenario.screenIds) landedOn.add(id)
  }
  return {
    capabilities: props.workspace.capabilities.filter(capability => !inFlow.has(capability.id)),
    screens: props.workspace.screens.filter(screen => !landedOn.has(screen.id))
  }
})

/** The Interface an unreached Screen sits on, from its qualified id. */
function scopeOf(entity: AnyEntityView): string {
  const [head] = entity.id.split('::')
  if (!head || head === entity.id) return ''
  return resolveEntity(props.workspace, 'interface', head)?.title.replace(/ application$/, '') ?? head
}

const RESULT_TONE: Record<string, string> = {
  achieved: 'blr-result--achieved',
  'not-achieved': 'blr-result--missed'
}

const status = computed(() => `${props.workspace.counts.journeys} promises · ${props.workspace.counts.journeyScenarios} tracks`)
</script>

<template>
  <BlrLabFrame :workspace="workspace" :variant="variant" :logo-src="logoSrc" :status="status" @select="selected = $event">
    <!-- The promises, as a table of contents that never scrolls away. -->
    <nav class="hidden w-60 shrink-0 flex-col border-e border-default lg:flex">
      <p class="blr-story-label px-4 pt-3">Promises</p>
      <div class="blr-pane min-h-0 flex-1 p-2">
        <button
          v-for="band in bands"
          :key="band.journey.key"
          type="button"
          class="blr-story-nav"
          :data-current="band.journey.id === openBand?.journey.id"
          @click="openJourneyId = band.journey.id"
        >
          <span class="flex min-w-0 items-center gap-2">
            <BlrKind kind="journey" :labelled="false" size="xs" />
            <span class="min-w-0 flex-1 truncate text-start">{{ band.journey.title }}</span>
          </span>
          <span class="mt-1 flex items-center gap-2 ps-6 text-xs text-dimmed">
            <span>{{ band.tracks.length }} {{ band.tracks.length === 1 ? 'track' : 'tracks' }}</span>
            <span v-if="band.actors.length" class="truncate">· {{ band.actors[0]?.title }}</span>
          </span>
        </button>

        <p class="blr-story-label mt-4 px-2">Off the storyline</p>
        <p class="px-2 pb-1 text-xs text-dimmed">
          {{ unreached.capabilities.length }} Capabilities and {{ unreached.screens.length }} Screens
          that no promise runs through.
        </p>
        <button
          v-for="entity in [...unreached.capabilities, ...unreached.screens]"
          :key="entity.key"
          type="button"
          class="blr-story-orphan"
          :title="entity.id"
          @click="selected = entity"
        >
          <BlrKind :kind="entity.kind" :labelled="false" size="xs" />
          <span class="min-w-0 flex-1 truncate text-start">{{ entity.title }}</span>
          <!-- Two Screens can share a title across Interfaces, and a list of
               unreached things that repeats a name reads as a bug. -->
          <span v-if="scopeOf(entity)" class="shrink-0 text-[10px] opacity-70">{{ scopeOf(entity) }}</span>
        </button>
      </div>
    </nav>

    <section v-if="openBand" class="blr-pane min-w-0 flex-1">
      <article class="space-y-6 p-5">
        <header class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <BlrKind kind="journey" />
            <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ openBand.journey.title }}</h2>
            <button
              type="button"
              class="blr-meta rounded bg-muted px-1.5 py-0.5 hover:text-primary"
              @click="selected = openBand.journey"
            >
              read the promise
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="blr-story-label">Promised to</span>
            <button
              v-for="actor in openBand.actors"
              :key="actor.key"
              type="button"
              class="blr-story-actor"
              @click="selected = actor"
            >
              <BlrKind kind="actor" :labelled="false" size="xs" />{{ actor.title }}
            </button>
          </div>
          <BlrProse :text="openBand.journey.lead" class="max-w-3xl" />
          <p v-if="openBand.journey.successCriterion" class="max-w-3xl border-s-2 border-primary ps-3 text-sm text-muted">
            <span class="blr-story-label me-2">Kept when</span>{{ openBand.journey.successCriterion }}
          </p>
        </header>

        <p v-if="!openBand.tracks.length" class="text-sm text-muted italic">
          No Journey Scenarios name this promise, so it has no tracks to unfold.
        </p>

        <!-- One track per Scenario: trigger, ordered stages, landing, ending. -->
        <section
          v-for="track in openBand.tracks"
          :key="track.scenario.key"
          class="space-y-3 rounded-xl border border-default bg-elevated/20 p-4"
        >
          <header class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="text-start text-sm font-semibold text-highlighted hover:text-primary"
              @click="selected = track.scenario"
            >
              {{ track.scenario.title }}
            </button>
            <UBadge color="neutral" variant="subtle" size="sm">{{ track.scenario.kindName }}</UBadge>
            <span v-if="track.scenario.result" class="blr-result" :class="RESULT_TONE[track.scenario.result]">
              {{ track.scenario.result === 'achieved' ? 'promise kept' : 'promise missed' }}
            </span>
            <span class="blr-meta ms-auto">{{ track.scenario.steps.length }} steps</span>
          </header>

          <p v-if="track.scenario.trigger" class="text-sm text-muted">
            <span class="blr-story-label me-2">Starts when</span>{{ track.scenario.trigger }}
          </p>

          <!-- Left to right, in the authored order. Horizontal scroll is the
               point: a long promise should feel long. -->
          <ol v-if="track.stages.length" class="blr-track">
            <li v-for="stage in track.stages" :key="stage.key" class="blr-stage">
              <button
                type="button"
                class="blr-stage-box"
                :disabled="!stage.capability"
                @click="stage.capability && (selected = stage.capability)"
              >
                <span class="blr-stage-order">{{ stage.order }}</span>
                <span class="blr-stage-operation">{{ stage.operation }}</span>
                <span v-if="stage.capability" class="blr-stage-capability">
                  <BlrKind kind="capability" :labelled="false" size="xs" />
                  {{ stage.capability.title }}
                </span>
              </button>
            </li>
          </ol>
          <p v-else class="text-xs text-dimmed">
            This track authors steps but no Capability flow, so it has no stages to place in time.
          </p>

          <div v-if="track.screens.length" class="flex flex-wrap items-center gap-1.5">
            <span class="blr-story-label">Lands on</span>
            <button
              v-for="screen in track.screens"
              :key="screen.key"
              type="button"
              class="blr-story-chip"
              @click="selected = screen"
            >
              <BlrKind kind="screen" :labelled="false" size="xs" />{{ screen.title }}
            </button>
          </div>

          <p v-if="track.scenario.outcome" class="text-sm text-default">
            <span class="blr-story-label me-2">Ends</span>{{ track.scenario.outcome }}
          </p>
        </section>
      </article>
    </section>

    <aside class="hidden w-[24rem] shrink-0 flex-col border-s border-default 2xl:flex">
      <div class="blr-pane min-h-0 flex-1">
        <BlrLabReading
          :workspace="workspace"
          :entity="selected"
          empty-note="Select a stage, an ending, or a name to read what it is. The storyline stays where it is."
          @select="selected = $event"
        />
      </div>
    </aside>
  </BlrLabFrame>
</template>

<style scoped>
.blr-story-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-story-nav {
  display: block;
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  border-radius: 0.375rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
}

.blr-story-nav:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-story-nav[data-current='true'] {
  background: color-mix(in srgb, var(--blr-slot-6) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--blr-slot-6);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.blr-story-orphan {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.3125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 12px;
  color: var(--ui-text-dimmed);
}

.blr-story-orphan:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-default);
}

.blr-story-actor,
.blr-story-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--ui-text-default);
}

.blr-story-actor:hover,
.blr-story-chip:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text-highlighted);
}

/* The track: a row that scrolls sideways, with the connector drawn between. */
.blr-track {
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.blr-stage {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.blr-stage + .blr-stage::before {
  content: '';
  width: 1.25rem;
  height: 1px;
  background: var(--ui-border-accented);
}

.blr-stage-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  width: 13rem;
  min-height: 5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: var(--ui-bg-default);
  text-align: start;
  transition: border-color 0.12s ease, background 0.12s ease;
}

.blr-stage-box:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--blr-slot-5) 45%, var(--ui-border));
  background: color-mix(in srgb, var(--blr-slot-5) 6%, var(--ui-bg-default));
}

.blr-stage-order {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ui-text-dimmed);
}

.blr-stage-operation {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--ui-text-highlighted);
}

.blr-stage-capability {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  margin-top: auto;
  font-size: 11px;
  color: var(--ui-text-muted);
}

.blr-result {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.blr-result--achieved {
  background: color-mix(in srgb, var(--blr-slot-2) 14%, transparent);
  color: color-mix(in srgb, var(--blr-slot-2) 80%, var(--ui-text-highlighted));
}

.blr-result--missed {
  background: color-mix(in srgb, var(--blr-slot-7) 14%, transparent);
  color: color-mix(in srgb, var(--blr-slot-7) 80%, var(--ui-text-highlighted));
}
</style>
