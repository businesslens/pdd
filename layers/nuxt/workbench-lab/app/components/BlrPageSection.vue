<script setup lang="ts">
/**
 * One section of an entity page, rendered by id.
 *
 * A switchboard, so the five layouts contain arrangement and nothing else. If
 * a layout had to know how to draw a Screen's Product states, changing that
 * drawing would mean changing it five times, and the layouts would slowly stop
 * being comparable.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, counterpartsOf, resolveEntityKey } from '../utils/model'
import type { PageSectionId } from '../utils/pageSections'
import { peekFacts } from '../utils/peekFacts'
import { buildJourneyAnatomy } from '../../../report-viewer/app/utils/productTopologyGraphs'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  id: PageSectionId
  selectedKey?: string | null
  /** Layouts that already draw their own heading suppress this one. */
  heading?: boolean
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])
const availability = computed(() => 'availability' in props.entity ? props.entity.availability : [])
const entryPoints = computed(() => 'entryPoints' in props.entity ? props.entity.entryPoints : [])
const counterparts = computed(() => counterpartsOf(props.workspace, props.entity))

/*
  The overview carries the entity's shape, not only its sentence.

  Without it, a layout that puts the overview alone — tabs especially — lands
  the reader on two lines and a badge, which says less than the row they clicked
  from. The same facts the peek uses, so the two never disagree.
*/
const facts = computed(() => peekFacts(props.workspace, props.entity).filter(fact => fact.value))

const journeyFlow = computed(() => props.entity.kind === 'journey'
  ? buildJourneyAnatomy(props.workspace, {
      journeyId: props.entity.id,
      selectedId: props.selectedKey ?? null
    })
  : { nodes: [], edges: [] })

function openKey(key: string) {
  const entity = resolveEntityKey(props.workspace, key)
  if (entity) emit('select', entity)
}
</script>

<template>
  <!-- OVERVIEW: what it is, and where it is reachable. -->
  <div v-if="id === 'overview'" class="space-y-5">
    <BlrProse v-if="entity.lead" :text="entity.lead" size="base" class="max-w-3xl" />

    <dl v-if="facts.length" class="flex flex-wrap gap-x-8 gap-y-3">
      <div v-for="fact in facts" :key="fact.label" class="min-w-0">
        <dt class="text-xs text-dimmed">{{ fact.label }}</dt>
        <dd class="mt-0.5 truncate text-sm font-medium text-highlighted">{{ fact.value }}</dd>
      </div>
    </dl>

    <BlrAvail
      v-if="availability.length || entryPoints.length"
      :pairs="availability"
      :entry-points="entryPoints"
    />
  </div>

  <BlrEntityBody
    v-else-if="id === 'detail'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('select', $event)"
  />

  <div v-else-if="id === 'flow'" class="space-y-2">
    <p v-if="heading" class="text-xs text-muted">Each lane preserves the authored Capability order and operation.</p>
    <div class="h-[26rem] overflow-hidden rounded-xl border border-default bg-default">
      <BlrFlowCanvas
        :nodes="journeyFlow.nodes"
        :edges="journeyFlow.edges"
        :max-zoom="1.1"
        @select="openKey"
      />
    </div>
  </div>

  <div v-else-if="id === 'neighbourhood'" class="space-y-2">
    <p v-if="heading" class="text-xs text-muted">
      What this {{ meta.label }} reaches, and what reaches it. Select a box to read it.
    </p>
    <div class="h-[26rem] overflow-hidden rounded-xl border border-default bg-default">
      <BlrTopology
        :workspace="workspace"
        :focus-id="entity.key"
        direction="LR"
        class="h-full"
        @inspect="emit('select', $event)"
      />
    </div>
  </div>

  <BlrChildren
    v-else-if="id === 'children'"
    :workspace="workspace"
    :entity="entity"
    :selected-key="selectedKey"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
  />

  <div v-else-if="id === 'counterparts'" class="space-y-2">
    <p v-if="heading" class="text-xs text-muted">
      The same {{ meta.label.toLowerCase() }} on another Interface — one goal, two surfaces.
    </p>
    <BlrEntityCard
      v-for="counterpart in counterparts"
      :key="counterpart.key"
      :workspace="workspace"
      :entity="counterpart"
      @open="emit('open', $event)"
    />
  </div>

  <BlrConnections
    v-else-if="id === 'connections'"
    :workspace="workspace"
    :entity="entity"
    @select="emit('open', $event)"
  />

  <BlrProse
    v-else-if="id === 'supporting'"
    :text="entity.supportingContent"
    class="max-w-3xl"
  />

  <BlrRefs v-else-if="id === 'references'" :references="entity.references" variant="list" />
</template>
