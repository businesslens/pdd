<script setup lang="ts">
/**
 * Workbench — Tripane, made entity-first.
 *
 * The three zones are Tripane's, and for the same reason: navigation, working
 * view and inspector are always on screen, so reading one entity never costs
 * the place you were reading from.
 *
 * What differs is the working view. Every entity kind has a stable browse
 * surface — cards ⇄ table with relation-aware filters — while named Product
 * views own cross-kind questions. Depth is
 * reached three ways, each for a different question:
 * - the inspector, with parent-specific Scenario disclosures;
 * - a Journey → Scenarios centre page;
 * - ⌘K, for "I know its name, take me there".
 *
 * Breadth has one product-level destination: Topology. Its named views answer
 * fixed questions over several kinds without turning the kind rail into a
 * view builder or changing what navigation means.
 *
 * Capability Scenarios expand under Capabilities. Journey Scenarios also form
 * ordered flow lanes on the Journey page.
 */
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  ActorView,
  AnyEntityView,
  AvailabilityPair,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportEntityKind,
  ReportWorkspace,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import {
  ENTITY_KIND_META,
  REPORT_ENTITY_KINDS,
  resolveEntities,
  resolveEntity,
  resolveEntityKey
} from '../utils/reportWorkspace'
import type { FacetSelections } from '../utils/entityFacets'
import {
  entitiesOfKind,
  facetKindsFor,
  filterEntities,
  groupEntities,
  hasSelections,
  relatedIds
} from '../utils/entityFacets'
import type { EntityCardVariant } from '../utils/entityCards'
import { DEFAULT_ENTITY_CARD_VARIANT, ENTITY_CARD_VARIANTS } from '../utils/entityCards'
import { firstSentence } from '../utils/reportMarkdown'
import { buildJourneyAnatomy } from '../utils/productTopologyGraphs'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Selection: activeKind/activeId drive the working view, the inspector */
/* follows every selection, and only a Journey opens an inner page.     */
/* ------------------------------------------------------------------ */

/*
  Every kind is browsable, Scenarios included. Reading them only inside a parent
  worked when a Scenario always had a Journey; most now belong to a Capability
  and would otherwise be the largest collection in the model with no surface.
*/
const RAIL_KINDS = REPORT_ENTITY_KINDS

type ViewMode = 'cards' | 'table'
type WorkbenchSection = 'overview' | 'topology' | ReportEntityKind

/**
 * The open section, bindable by the host so it can live in the URL.
 *
 * `activeKind` stays internal: it is what the working view is *about*, which
 * for the overview is the Product rather than the section name.
 */
const section = defineModel<string>('section', { default: 'overview' })

const activeKind = ref<ReportEntityKind>('product')
const activeSection = ref<WorkbenchSection>('overview')

const KNOWN_SECTIONS = new Set<string>(['overview', 'topology', ...REPORT_ENTITY_KINDS.map(meta => meta.kind)])

/* Two-way, but never fighting: each side only writes when the value differs. */
watch(section, (value) => {
  if (value === activeSection.value) return
  const next = (KNOWN_SECTIONS.has(value) ? value : 'overview') as WorkbenchSection
  activeSection.value = next
  activeKind.value = next === 'overview' || next === 'topology' ? 'product' : next
}, { immediate: true })

watch(activeSection, (value) => {
  if (section.value !== value) section.value = value
})
const activeId = ref<string | null>(null)
const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')
const searchOpen = ref(false)
const mobileNavOpen = ref(false)
const openJourneyId = ref<string | null>(null)
const entityCardVariant = ref<EntityCardVariant>(DEFAULT_ENTITY_CARD_VARIANT)

/* Toolbar state is kept per kind: moving to another kind and back returns to
   the shape you left, which is the point of a persistent working view. */
const viewModes = reactive<Partial<Record<ReportEntityKind, ViewMode>>>({})
const groupKinds = reactive<Partial<Record<ReportEntityKind, ReportEntityKind>>>({})
const facetState = reactive<Partial<Record<ReportEntityKind, FacetSelections>>>({})

const activeMeta = computed(() => ENTITY_KIND_META[activeKind.value])

const kindCounts = computed<Record<string, number>>(() => ({
  actor: props.workspace.counts.actors,
  interface: props.workspace.counts.interfaces,
  experience: props.workspace.counts.experiences,
  screen: props.workspace.counts.screens,
  domain: props.workspace.counts.domains,
  capability: props.workspace.counts.capabilities,
  journey: props.workspace.counts.journeys,
  'capability-scenario': props.workspace.counts.capabilityScenarios,
  'journey-scenario': props.workspace.counts.journeyScenarios,
  rule: props.workspace.counts.rules
}))

const viewMode = computed<ViewMode>({
  get: () => viewModes[activeKind.value] ?? 'cards',
  set: (value) => {
    viewModes[activeKind.value] = value
  }
})

const groupKind = computed<ReportEntityKind | undefined>({
  get: () => groupKinds[activeKind.value],
  set: (value) => {
    if (value) groupKinds[activeKind.value] = value
    else delete groupKinds[activeKind.value]
  }
})

const facets = computed<FacetSelections>(() => facetState[activeKind.value] ?? {})
const filtersActive = computed(() => hasSelections(facets.value))

function facetValues(kind: ReportEntityKind): string[] {
  return facets.value[kind] ?? []
}

function setFacet(kind: ReportEntityKind, ids: string[]) {
  facetState[activeKind.value] = { ...facets.value, [kind]: ids }
}

function clearFacets() {
  facetState[activeKind.value] = {}
}

/** Only kinds this kind actually relates to, and only if the model has any. */
const facetKinds = computed(() => facetKindsFor(activeKind.value)
  .filter(kind => entitiesOfKind(props.workspace, kind).length))

function facetOptions(kind: ReportEntityKind) {
  return entitiesOfKind(props.workspace, kind).map(entity => ({ label: entity.title, value: entity.id }))
}

const VIEW_MODE_TABS = [
  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
]

const kindEntities = computed<AnyEntityView[]>(() => entitiesOfKind(props.workspace, activeKind.value))

/** What every surface shows: the cards, the table, the counts in the bar. */
const visibleEntities = computed(() => filterEntities(kindEntities.value, facets.value))

const groupOptions = computed(() => facetKinds.value
  .map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind })))

const entityGroups = computed(() => {
  const by = groupKind.value
  /* The bucket is named after what is missing, so it reads as a model fact:
     "No Domain", not the generic "Unassigned". */
  return groupEntities(props.workspace, visibleEntities.value, by ?? null,
    by ? `No ${ENTITY_KIND_META[by].label}` : '')
})

const entityCardLayoutClass = computed(() => {
  if (entityCardVariant.value === 'index') return 'space-y-2'
  if (entityCardVariant.value === 'editorial') return 'grid gap-4 xl:grid-cols-2'
  if (groupKind.value) return 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
  return 'grid gap-3 sm:grid-cols-2 2xl:grid-cols-3'
})

const openJourney = computed<JourneyView | null>(() => {
  if (!openJourneyId.value) return null
  const entity = resolveEntityKey(props.workspace, openJourneyId.value)
  return entity?.kind === 'journey' ? entity : null
})

const openJourneyScenarios = computed<ScenarioView[]>(() =>
  openJourney.value ? props.workspace.scenariosByJourney.get(openJourney.value.id) ?? [] : [])
const openJourneyFlow = computed(() => openJourney.value
  ? buildJourneyAnatomy(props.workspace, {
      journeyId: openJourney.value.id,
      selectedId: inspected.value?.key ?? null
    })
  : { nodes: [], edges: [] })

/* Live recompiles replace the projection. Rehydrate selection by stable key so
   focus, trails, filters, and the open Journey survive ordinary model edits. */
watch(() => props.workspace, (workspace) => {
  if (inspected.value) inspected.value = workspace.byKey.get(inspected.value.key) ?? null
  if (openJourneyId.value && !workspace.byKey.has(openJourneyId.value)) openJourneyId.value = null
  if (activeId.value && !workspace.byKey.has(activeId.value)) activeId.value = null
})

const topologyActive = computed(() => activeSection.value === 'topology')
const showToolbar = computed(() => activeKind.value !== 'product' && !openJourney.value && !topologyActive.value)

function setKind(kind: ReportEntityKind) {
  mobileNavOpen.value = false
  activeKind.value = kind
  activeSection.value = kind === 'product' ? 'overview' : kind
  activeId.value = null
  openJourneyId.value = null
}

function openTopology() {
  mobileNavOpen.value = false
  activeSection.value = 'topology'
  activeId.value = null
  openJourneyId.value = null
}

/** Activation moves the working view; a Journey activates into its own page. */
function activate(entity: AnyEntityView) {
  activeId.value = entity.key
  if (entity.kind === 'journey') {
    openJourneyId.value = entity.key
    inspected.value = null
    return
  }
  inspect(entity)
}

/** Cards always open the complete inspector, including Journey cards. */
function openCard(entity: AnyEntityView) {
  activeId.value = entity.key
  inspect(entity)
}

/** Any selection anywhere re-targets the open inspector, never the centre. */
function inspect(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'detail'
}

function inspectKey(key: string) {
  const entity = resolveEntityKey(props.workspace, key)
  if (entity) inspect(entity)
}

function openJourneyPage(journey: JourneyView) {
  activeKind.value = 'journey'
  activeSection.value = 'journey'
  activeId.value = journey.key
  openJourneyId.value = journey.key
}

/** ⌘K lands on the entity: its kind's surface, plus the inspector on it. */
function onSearchSelect(entity: AnyEntityView) {
  /* A Journey Scenario reads best on its Journey page, beside its siblings. */
  if (entity.kind === 'journey-scenario') {
    const journey = resolveEntity(props.workspace, 'journey', entity.journeyId)
    if (journey?.kind === 'journey') {
      openJourneyPage(journey)
      inspect(entity)
      return
    }
  }
  activeKind.value = entity.kind
  activeSection.value = entity.kind
  activeId.value = entity.key
  openJourneyId.value = entity.kind === 'journey' ? entity.key : null
  inspect(entity)
}

/* ------------------------------------------------------------------ */
/* Tables: one column set per kind, built from the same three helpers   */
/* ------------------------------------------------------------------ */

const titlesOf = (kind: ReportEntityKind, ids: string[]) =>
  resolveEntities(props.workspace, kind, ids).map(entity => entity.title).join(', ')

function sortableHeader(label: string) {
  return ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc', toggleSorting: (desc: boolean) => void } }) => {
    const sorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      label,
      trailingIcon: sorted ? (sorted === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down') : 'i-lucide-arrow-up-down',
      class: '-mx-2.5 font-medium',
      onClick: () => column.toggleSorting(sorted === 'asc')
    })
  }
}

const countCell = (count: number, hint: string) =>
  h('span', { class: 'blr-meta', title: hint || undefined }, String(count))

function titleColumn(kind: ReportEntityKind): TableColumn<AnyEntityView> {
  return {
    accessorKey: 'title',
    header: sortableHeader(ENTITY_KIND_META[kind].label),
    cell: ({ row }) => h('div', { class: 'min-w-0 max-w-72' }, [
      h('p', { class: 'truncate font-medium text-highlighted' }, row.original.title),
      h('p', { class: 'truncate text-xs text-muted' }, firstSentence(row.original.lead, 90))
    ])
  }
}

/** A derived relation count, with the names behind it on hover. */
function relationColumn(kind: ReportEntityKind, label?: string): TableColumn<AnyEntityView> {
  return {
    id: kind,
    accessorFn: (entity: AnyEntityView) => relatedIds(entity, kind).length,
    header: sortableHeader(label ?? ENTITY_KIND_META[kind].plural),
    cell: ({ row }) => countCell(
      relatedIds(row.original, kind).length,
      titlesOf(kind, relatedIds(row.original, kind))
    )
  }
}

function relationIdsColumn(
  id: string,
  label: string,
  kind: ReportEntityKind,
  read: (entity: AnyEntityView) => string[]
): TableColumn<AnyEntityView> {
  return {
    id,
    accessorFn: (entity: AnyEntityView) => read(entity).length,
    header: sortableHeader(label),
    cell: ({ row }) => countCell(read(row.original).length, titlesOf(kind, read(row.original)))
  }
}

function textColumn(id: string, label: string, read: (entity: AnyEntityView) => string): TableColumn<AnyEntityView> {
  return {
    id,
    accessorFn: (entity: AnyEntityView) => read(entity),
    header: sortableHeader(label),
    cell: ({ row }) => h('span', { class: 'text-sm text-default' }, read(row.original) || '—')
  }
}

function numberColumn(id: string, label: string, read: (entity: AnyEntityView) => number): TableColumn<AnyEntityView> {
  return {
    id,
    accessorFn: (entity: AnyEntityView) => read(entity),
    header: sortableHeader(label),
    cell: ({ row }) => countCell(read(row.original), '')
  }
}

function pairLabel(pair: AvailabilityPair): string {
  return pair.experienceTitle ? `${pair.interfaceTitle} › ${pair.experienceTitle}` : `${pair.interfaceTitle} (direct)`
}

/** Availability is a scope list rather than an id list, so it gets its own. */
function contextColumn(): TableColumn<AnyEntityView> {
  const read = (entity: AnyEntityView): AvailabilityPair[] =>
    'availability' in entity ? (entity as { availability: AvailabilityPair[] }).availability : []
  return {
    id: 'contexts',
    accessorFn: (entity: AnyEntityView) => read(entity).length,
    header: sortableHeader('Contexts'),
    cell: ({ row }) => countCell(read(row.original).length, read(row.original).map(pairLabel).join(', '))
  }
}

const tableColumns = computed<TableColumn<AnyEntityView>[]>(() => {
  const base = [titleColumn(activeKind.value)]
  switch (activeKind.value) {
    case 'actor':
      return [
        ...base,
        textColumn('actorKind', 'Kind', entity => (entity as ActorView).actorKind),
        textColumn('relationship', 'Relationship', entity => (entity as ActorView).relationship),
        relationColumn('interface'),
        relationColumn('experience'),
        relationColumn('journey')
      ]
    case 'interface':
      return [
        ...base,
        relationColumn('actor'),
        relationColumn('experience'),
        relationColumn('capability'),
        relationColumn('screen'),
        relationColumn('journey'),
        numberColumn('entryPoints', 'Entry points', entity => (entity as InterfaceView).entryPoints.length)
      ]
    case 'experience':
      return [
        ...base,
        textColumn('access', 'Access', entity => (entity as ExperienceView).accessMode),
        relationColumn('actor'),
        relationColumn('interface'),
        relationColumn('capability'),
        relationColumn('screen'),
        relationColumn('journey')
      ]
    case 'screen':
      return [
        ...base,
        contextColumn(),
        relationColumn('capability'),
        relationColumn('capability-scenario', 'Cap. Scenarios'),
        relationColumn('journey-scenario', 'Journey Scenarios'),
        relationIdsColumn('scenarioJourneys', 'Journeys via scenarios', 'journey',
          entity => (entity as ScreenView).scenarioJourneyIds),
        relationIdsColumn('capabilityJourneys', 'Journeys via capabilities', 'journey',
          entity => (entity as ScreenView).capabilityJourneyIds),
        numberColumn('states', 'States', entity => (entity as ScreenView).states.length),
        numberColumn('actions', 'Actions', entity => (entity as ScreenView).actions.length)
      ]
    case 'domain':
      return [
        ...base,
        relationColumn('capability'),
        relationColumn('journey'),
        relationColumn('screen'),
        relationColumn('rule')
      ]
    case 'capability':
      return [
        ...base,
        textColumn('domain', 'Domain', (entity) => {
          const id = (entity as CapabilityView).domainId
          return id ? resolveEntity(props.workspace, 'domain', id)?.title ?? id : ''
        }),
        contextColumn(),
        relationColumn('capability-scenario', 'Capability Scenarios'),
        relationColumn('journey-scenario', 'In Journey Scenarios'),
        relationColumn('journey'),
        relationColumn('screen'),
        relationColumn('rule')
      ]
    case 'journey':
      return [
        ...base,
        relationColumn('actor'),
        contextColumn(),
        relationColumn('capability'),
        relationColumn('screen'),
        relationColumn('journey-scenario', 'Variations'),
        relationColumn('rule'),
        numberColumn('steps', 'Steps', entity => (entity as JourneyView).stepCount)
      ]
    case 'capability-scenario':
      return [
        ...base,
        textColumn('scenarioKind', 'Kind', entity => (entity as ScenarioView).kindName),
        relationColumn('capability'),
        relationColumn('actor'),
        contextColumn(),
        numberColumn('steps', 'Steps', entity => (entity as ScenarioView).steps.length),
        numberColumn('decisions', 'Decisions', entity => (entity as ScenarioView).decisionPoints.length),
        relationColumn('screen'),
        relationColumn('rule')
      ]
    case 'journey-scenario':
      return [
        ...base,
        textColumn('scenarioKind', 'Kind', entity => (entity as ScenarioView).kindName),
        /* `kind` classifies the variation; `result` records how it ended. Orthogonal, so both. */
        textColumn('result', 'Result', entity => (entity as ScenarioView).result),
        relationColumn('journey'),
        relationColumn('actor'),
        numberColumn('stages', 'Stages', entity => (entity as ScenarioView).flow.length),
        numberColumn('steps', 'Steps', entity => (entity as ScenarioView).steps.length),
        relationColumn('capability'),
        relationColumn('screen'),
        relationColumn('rule')
      ]
    case 'rule':
      return [
        ...base,
        relationColumn('domain'),
        relationColumn('capability'),
        relationColumn('journey'),
        relationColumn('capability-scenario', 'Cap. Scenarios'),
        relationColumn('journey-scenario', 'Journey Scenarios'),
        contextColumn()
      ]
    default:
      return base
  }
})

const TABLE_NOTE: Partial<Record<ReportEntityKind, string>> = {
  screen: 'Scenario and Capability Journey columns keep the two derivation paths separate. Hover a count for the names behind it.',
  capability: 'Capability Scenarios are direct coverage. Journeys, Screens and Rules are derived from what declares this Capability.',
  journey: 'Screens and Rules include derived participation (via Scenarios and Capabilities); Steps is the authored step depth.',
  rule: 'Counts are authored attachments; the card view adds the reach derived from them.',
  'capability-scenario': 'Each is one observable acceptance case for exactly one Capability. Contexts are the exact Interface scopes it is accepted in.',
  'journey-scenario': 'Kind classifies the variation; Result records whether the Journey goal was reached. Stages are the ordered Capability flow entries.'
}

/** Scenarios whose Journey is not in the model would otherwise be unreachable. */
const orphanScenarios = computed(() => props.workspace.scenarios
  .filter(scenario => scenario.scenarioType === 'journey'
    && !resolveEntity(props.workspace, 'journey', scenario.journeyId)))

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

/** The one-line shape of the model, in the order the entities depend on. */
const countFacts = computed(() => [
  { label: 'Journeys', value: props.workspace.counts.journeys },
  { label: 'Journey Scenarios', value: props.workspace.counts.journeyScenarios },
  { label: 'Capability Scenarios', value: props.workspace.counts.capabilityScenarios },
  { label: 'Steps', value: props.workspace.counts.steps },
  { label: 'Capabilities', value: props.workspace.counts.capabilities },
  { label: 'Domains', value: props.workspace.counts.domains },
  { label: 'Screens', value: props.workspace.counts.screens },
  { label: 'Interfaces', value: props.workspace.counts.interfaces },
  { label: 'Experiences', value: props.workspace.counts.experiences },
  { label: 'Rules', value: props.workspace.counts.rules },
  { label: 'Actors', value: props.workspace.counts.actors }
])

const authoredCounts = computed<Array<[string, number]>>(() => [
  ['Actors', props.workspace.counts.actors],
  ['Interfaces', props.workspace.counts.interfaces],
  ['Experiences', props.workspace.counts.experiences],
  ['Screens', props.workspace.counts.screens],
  ['Domains', props.workspace.counts.domains],
  ['Capabilities', props.workspace.counts.capabilities],
  ['Journeys', props.workspace.counts.journeys],
  ['Capability Scenarios', props.workspace.counts.capabilityScenarios],
  ['Journey Scenarios', props.workspace.counts.journeyScenarios],
  ['Business rules', props.workspace.counts.rules]
])

const derivedCounts = computed<Array<[string, number]>>(() => [
  ['Steps', props.workspace.counts.steps],
  ['Decision points', props.workspace.counts.decisionPoints],
  ['Branches', props.workspace.counts.branches],
  ['Edge cases', props.workspace.counts.edgeCases],
  ['Screen states', props.workspace.counts.screenStates],
  ['Entry points', props.workspace.counts.entryPoints],
  ['References', props.workspace.counts.references],
  ['Availability scopes', props.workspace.counts.availabilityPairs]
])

/* Everything past the identity header is collapsed until it is asked for. */
const sections = reactive({ about: false, coverage: false, counts: false, references: false })
</script>

<template>
  <div class="blr-workbench flex h-full min-h-0 flex-col text-sm">
    <!-- Status bar: the product, its coverage, and the way to anything. -->
    <header class="flex shrink-0 items-center gap-3 border-b border-default px-4 py-2.5">
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="xs"
        class="lg:hidden"
        aria-label="Open report navigation"
        @click="mobileNavOpen = true"
      />
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5">
      <UIcon v-else name="i-lucide-package" class="size-5 shrink-0 text-primary" />
      <button
        type="button"
        class="min-w-0 max-w-48 truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary"
        title="Open the Overview"
        @click="setKind('product')"
      >
        {{ workspace.identity.title }}
      </button>

      <!-- Where you are: the working view names itself here, not above itself. -->
      <UIcon name="i-lucide-chevron-right" class="hidden size-3.5 shrink-0 text-dimmed sm:block" />
      <template v-if="openJourney">
        <button
          type="button"
          class="blr-eyebrow hidden shrink-0 items-center gap-1.5 hover:underline hover:underline-offset-4 sm:inline-flex"
          title="Back to the Journeys"
          @click="openJourneyId = null"
        >
          <UIcon :name="activeMeta.icon" class="size-3.5" :style="{ color: `var(--blr-slot-${activeMeta.slot})` }" />
          {{ activeMeta.plural }}
        </button>
        <UIcon name="i-lucide-chevron-right" class="hidden size-3.5 shrink-0 text-dimmed sm:block" />
        <span class="hidden min-w-0 truncate text-sm font-medium text-highlighted sm:inline">{{ openJourney.title }}</span>
      </template>
      <template v-else-if="topologyActive">
        <span class="blr-eyebrow hidden shrink-0 items-center gap-1.5 sm:inline-flex">
          <UIcon name="i-lucide-waypoints" class="size-3.5" style="color: var(--blr-slot-9)" />
          Topology
        </span>
      </template>
      <template v-else>
        <span class="blr-eyebrow hidden shrink-0 items-center gap-1.5 sm:inline-flex">
          <UIcon :name="activeMeta.icon" class="size-3.5" :style="{ color: `var(--blr-slot-${activeMeta.slot})` }" />
          {{ activeKind === 'product' ? 'Overview' : activeMeta.plural }}
        </span>
        <span v-if="activeKind !== 'product'" class="blr-meta hidden shrink-0 sm:inline">
          {{ visibleEntities.length }}<template v-if="visibleEntities.length !== kindEntities.length"> / {{ kindEntities.length }}</template>
        </span>
      </template>

      <span class="ms-auto flex shrink-0 items-center gap-2.5">
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="outline"
          size="xs"
          label="Search"
          class="hidden rounded-full sm:inline-flex"
          @click="searchOpen = true"
        >
          <template #trailing>
            <span class="hidden items-center gap-0.5 sm:flex">
              <UKbd value="meta" />
              <UKbd value="K" />
            </span>
          </template>
        </UButton>
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          size="xs"
          class="sm:hidden"
          aria-label="Search Product Model"
          @click="searchOpen = true"
        />
        <UBadge class="hidden md:inline-flex" :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
          coverage: {{ workspace.coverage.status }}
        </UBadge>
        <span class="blr-meta hidden sm:inline">{{ workspace.identity.schemaVersion }}</span>
        <span class="blr-meta hidden md:inline">{{ workspace.identity.generatedAt.slice(0, 10) }}</span>
      </span>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- LEFT: stable navigation. Topology is a destination, never a mode
           that silently changes these kind rows into filters. -->
      <nav class="blr-pane hidden w-64 shrink-0 border-e border-default lg:block">
        <div class="p-2">
          <!-- The host's own way back out, above its sections. -->
          <div v-if="$slots.navigation" class="mb-1 border-b border-default px-1 pb-2">
            <slot name="navigation" />
          </div>
          <p class="blr-navgroup">Explore</p>
          <button
            type="button"
            class="blr-navitem"
            :data-current="activeSection === 'overview'"
            :style="{ '--kind-color': 'var(--blr-slot-9)' }"
            @click="setKind('product')"
          >
            <UIcon name="i-lucide-package" class="size-4 shrink-0" style="color: var(--blr-slot-9)" />
            <span class="flex-1 truncate text-start">Overview</span>
          </button>
          <button
            type="button"
            class="blr-navitem"
            :data-current="topologyActive"
            :style="{ '--kind-color': 'var(--blr-slot-9)' }"
            @click="openTopology"
          >
            <UIcon name="i-lucide-waypoints" class="size-4 shrink-0" style="color: var(--blr-slot-9)" />
            <span class="flex-1 truncate text-start">Topology</span>
          </button>

          <p class="blr-navgroup mt-3">Browse</p>
          <button
            v-for="meta in RAIL_KINDS"
            :key="meta.kind"
            type="button"
            class="blr-navitem"
            :data-current="activeSection === meta.kind"
            :style="{ '--kind-color': `var(--blr-slot-${meta.slot})` }"
            @click="setKind(meta.kind)"
          >
            <UIcon :name="meta.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${meta.slot})` }" />
            <span class="flex-1 truncate text-start">{{ meta.plural }}</span>
            <span class="blr-meta">{{ kindCounts[meta.kind] }}</span>
          </button>
        </div>

      </nav>

      <!-- CENTER: the working view for the active kind -->
      <section class="flex min-w-0 flex-1 flex-col">
        <!-- Toolbar: what is shown on the left, how it is shown on the right. -->
        <div
          v-if="showToolbar"
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-2"
        >
          <span v-if="facetKinds.length" class="blr-field">Filter</span>
          <USelectMenu
            v-for="kind in facetKinds"
            :key="kind"
            :model-value="facetValues(kind)"
            :items="facetOptions(kind)"
            value-key="value"
            multiple
            size="xs"
            variant="outline"
            class="min-w-36"
            :icon="ENTITY_KIND_META[kind].icon"
            :placeholder="ENTITY_KIND_META[kind].plural"
            :search-input="{ placeholder: `Filter ${ENTITY_KIND_META[kind].plural.toLowerCase()}…` }"
            @update:model-value="setFacet(kind, $event as string[])"
          />
          <UButton
            v-if="filtersActive"
            icon="i-lucide-filter-x"
            color="neutral"
            variant="ghost"
            size="xs"
            label="Clear"
            @click="clearFacets"
          />
          <!-- Filters narrow a named subject; grouping and the card/table
               lenses change how that same subject is read. -->
          <div class="ms-auto flex shrink-0 items-center gap-2">
            <template v-if="groupOptions.length">
              <span class="blr-field">Group by</span>
              <USelect
                v-model="groupKind"
                :items="groupOptions"
                size="xs"
                variant="outline"
                class="min-w-32"
                icon="i-lucide-rows-3"
                placeholder="Nothing"
              />
              <UButton
                v-if="groupKind"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Stop grouping"
                @click="groupKind = undefined"
              />
            </template>
            <UTabs
              v-model="viewMode"
              :items="VIEW_MODE_TABS"
              :content="false"
              color="neutral"
              size="xs"
              class="ms-1"
            />
          </div>
        </div>

        <!-- The same card-density choice applies across every entity kind. -->
        <div
          v-if="(showToolbar || openJourney) && viewMode === 'cards'"
          class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default bg-elevated/30 px-4 py-2"
        >
          <span class="blr-field me-1">Card style</span>
          <UButton
            v-for="option in ENTITY_CARD_VARIANTS"
            :key="option.id"
            :icon="option.icon"
            :label="option.name"
            size="xs"
            :color="option.id === entityCardVariant ? 'primary' : 'neutral'"
            :variant="option.id === entityCardVariant ? 'soft' : 'outline'"
            :aria-pressed="option.id === entityCardVariant"
            class="rounded-full"
            :title="option.description"
            @click="entityCardVariant = option.id"
          />
          <span class="ms-1 text-xs text-muted">
            {{ ENTITY_CARD_VARIANTS.find(option => option.id === entityCardVariant)?.description }}
          </span>
        </div>

        <!-- Product-level breadth: all named topology views share one canvas. -->
        <div v-if="topologyActive" class="min-h-0 flex-1">
          <BlrProductTopology
            :workspace="workspace"
            :selected-id="inspected?.key ?? null"
            @select="inspect"
            @clear="inspected = null"
          />
        </div>

        <div v-else class="blr-pane flex-1 p-5">
          <!-- OVERVIEW: identity first, everything else on request -->
          <div v-if="activeKind === 'product'" class="mx-auto max-w-3xl space-y-6">
            <header class="space-y-4">
              <div class="flex flex-wrap items-start gap-4">
                <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 rounded-lg border border-default">
                <div class="min-w-0 flex-1 space-y-1.5">
                  <p class="blr-eyebrow">Product report · read as a workbench</p>
                  <h1 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ workspace.identity.title }}</h1>
                  <p class="max-w-3xl text-sm leading-6 text-default">{{ workspace.identity.summary }}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="blr-field me-1">Made for</span>
                <UButton
                  v-for="actor in workspace.actors"
                  :key="actor.key"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-full"
                  @click="inspect(actor)"
                >
                  <BlrKind kind="actor" :labelled="false" size="xs" />
                  {{ actor.title }}
                </UButton>
                <span v-if="!workspace.actors.length" class="text-sm text-muted italic">No Actors authored.</span>
              </div>
              <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span v-for="fact in countFacts" :key="fact.label" class="blr-field">
                  <span class="font-mono text-highlighted tabular-nums">{{ fact.value }}</span>
                  {{ fact.label }}
                </span>
                <span v-if="workspace.coverage.rationale" class="text-xs text-dimmed italic">
                  {{ firstSentence(workspace.coverage.rationale) }}
                </span>
              </div>
            </header>

            <!-- The host's call to action sits with the identity it acts on. -->
            <div v-if="$slots['primary-action']">
              <slot name="primary-action" />
            </div>

            <!-- Everything the Product page used to show, one disclosure each. -->
            <div class="divide-y divide-default border-y border-default">
              <UCollapsible v-model:open="sections.about">
                <button type="button" class="blr-disclosure">
                  <span class="flex-1 text-start text-sm font-medium text-highlighted">About this Product</span>
                  <span class="blr-meta">description · intent · authors</span>
                  <UIcon :name="sections.about ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
                </button>
                <template #content>
                  <div class="space-y-4 pb-5">
                    <BlrProse :text="workspace.identity.description" />
                    <section v-if="workspace.identity.intent" class="space-y-1.5">
                      <h3 class="blr-field">Intent</h3>
                      <BlrProse :text="workspace.identity.intent" />
                    </section>
                    <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
                      <h3 class="blr-field">Supporting context</h3>
                      <BlrProse :text="workspace.identity.supportingContent" />
                    </section>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">
                        {{ workspace.identity.categoryLabel }}
                      </UBadge>
                      <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">
                        {{ tag }}
                      </UBadge>
                      <span v-if="workspace.identity.license" class="blr-meta">license: {{ workspace.identity.license }}</span>
                    </div>
                    <section v-if="workspace.identity.authors.length" class="space-y-1.5">
                      <h3 class="blr-field">Authors</h3>
                      <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <li v-for="author in workspace.identity.authors" :key="author.name">
                          <a
                            v-if="author.url"
                            :href="author.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary underline underline-offset-2"
                          >{{ author.name }}</a>
                          <span v-else class="text-default">{{ author.name }}</span>
                        </li>
                      </ul>
                    </section>
                    <section v-if="workspace.identity.limitations.length" class="space-y-1.5">
                      <h3 class="blr-field">Known limitations</h3>
                      <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                        <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
                      </ul>
                    </section>
                  </div>
                </template>
              </UCollapsible>

              <UCollapsible v-model:open="sections.coverage">
                <button type="button" class="blr-disclosure">
                  <span class="flex-1 text-start text-sm font-medium text-highlighted">Coverage</span>
                  <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
                    {{ workspace.coverage.status }}
                  </UBadge>
                  <UIcon :name="sections.coverage ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
                </button>
                <template #content>
                  <div class="space-y-3 pb-5">
                    <BlrProse :text="workspace.coverage.rationale" />
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div v-if="workspace.coverage.method.length" class="space-y-1.5">
                        <p class="blr-field">Method</p>
                        <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                          <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
                        </ul>
                      </div>
                      <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
                        <p class="blr-field">Source areas</p>
                        <ul class="space-y-1">
                          <li v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" class="blr-meta">{{ item }}</li>
                        </ul>
                      </div>
                      <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
                        <p class="blr-field">Unmapped</p>
                        <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                          <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
                        </ul>
                      </div>
                      <div v-if="workspace.coverage.limitations.length" class="space-y-1.5">
                        <p class="blr-field">Limitations</p>
                        <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                          <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </template>
              </UCollapsible>

              <UCollapsible v-model:open="sections.counts">
                <button type="button" class="blr-disclosure">
                  <span class="flex-1 text-start text-sm font-medium text-highlighted">Model counts</span>
                  <span class="blr-meta">authored · derived</span>
                  <UIcon :name="sections.counts ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
                </button>
                <template #content>
                  <div class="space-y-3 pb-5">
                    <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                      <div v-for="[label, value] in authoredCounts" :key="label">
                        <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
                        <p class="blr-field">{{ label }}</p>
                      </div>
                    </div>
                    <p class="blr-field pt-1">Depth (derived from the model)</p>
                    <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
                      <div v-for="[label, value] in derivedCounts" :key="label">
                        <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
                        <p class="blr-field">{{ label }}</p>
                      </div>
                    </div>
                  </div>
                </template>
              </UCollapsible>

              <UCollapsible v-model:open="sections.references">
                <button type="button" class="blr-disclosure">
                  <span class="flex-1 text-start text-sm font-medium text-highlighted">References</span>
                  <span class="blr-meta">{{ workspace.references.length }}</span>
                  <UIcon :name="sections.references ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
                </button>
                <template #content>
                  <div class="space-y-3 pb-5">
                    <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
                    <div v-if="workspace.references.length" class="space-y-1.5">
                      <p class="blr-field">All references in the model</p>
                      <ul class="space-y-1">
                        <li
                          v-for="(group, index) in workspace.references"
                          :key="`${group.ownerId}-${index}`"
                          class="flex min-w-0 items-center gap-2 text-sm"
                        >
                          <BlrKind :kind="group.ownerKind" :labelled="false" size="xs" />
                          <button
                            type="button"
                            class="shrink-0 truncate text-default hover:text-primary"
                            :disabled="group.ownerKind === 'product'"
                            @click="group.ownerKey && inspectKey(group.ownerKey)"
                          >
                            {{ group.ownerTitle }}
                          </button>
                          <span class="blr-meta truncate">
                            {{ group.reference.title || group.reference.target }}
                          </span>
                          <span class="blr-meta ms-auto shrink-0">
                            {{ group.reference.kind }} · {{ group.reference.role }}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <p class="blr-meta">
                      Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
                      · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
                    </p>
                  </div>
                </template>
              </UCollapsible>
            </div>

            <!-- Where this report came from, which only the host can know. -->
            <div v-if="$slots.provenance" class="text-sm text-muted">
              <slot name="provenance" />
            </div>
          </div>

          <!-- JOURNEY PAGE: the promise in full, its Scenarios below it -->
          <article v-else-if="openJourney" class="space-y-5">
            <header class="flex flex-wrap items-center gap-2.5">
              <BlrKind kind="journey" />
              <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ openJourney.title }}</h2>
              <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ openJourney.id }}</code>
              <UButton
                icon="i-lucide-panel-right-open"
                color="neutral"
                variant="outline"
                size="xs"
                label="Inspect"
                class="ms-auto"
                @click="inspect(openJourney)"
              />
            </header>
            <BlrProse :text="openJourney.lead" />
            <section v-if="openJourney.intent" class="space-y-1.5">
              <h3 class="blr-field">Intent</h3>
              <BlrProse :text="openJourney.intent" />
            </section>
            <BlrAvail :pairs="openJourney.availability" :entry-points="openJourney.entryPoints" />
            <div class="space-y-1.5">
              <BlrLinks :workspace="workspace" :ids="openJourney.actorIds" kind="actor" interactive @select="inspect" />
              <BlrLinks :workspace="workspace" :ids="openJourney.capabilityIds" kind="capability" interactive @select="inspect" />
              <BlrLinks :workspace="workspace" :ids="openJourney.domainIds" kind="domain" label="Domains (derived)" interactive @select="inspect" />
              <BlrLinks :workspace="workspace" :ids="openJourney.screenIds" kind="screen" label="Screens (derived)" interactive @select="inspect" />
              <BlrLinks :workspace="workspace" :ids="openJourney.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
            </div>

            <section v-if="openJourneyFlow.nodes.length" class="space-y-2 border-t border-default pt-5">
              <header class="flex flex-wrap items-baseline gap-2">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">Scenario flows</h3>
                <span class="text-xs text-muted">Each lane preserves the authored Capability order and operation.</span>
              </header>
              <div class="h-96 overflow-hidden rounded-xl border border-default bg-default">
                <BlrFlowCanvas
                  :nodes="openJourneyFlow.nodes"
                  :edges="openJourneyFlow.edges"
                  :max-zoom="1.1"
                  @select="inspectKey"
                />
              </div>
            </section>

            <section class="space-y-3 border-t border-default pt-5">
              <header class="flex flex-wrap items-baseline gap-2">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">Scenarios</h3>
                <span class="blr-meta">{{ openJourneyScenarios.length }}</span>
                <span class="text-xs text-muted">
                  Each is one path through this promise: what triggers it, the steps, where it branches, how it ends.
                </span>
              </header>
              <p v-if="!openJourneyScenarios.length" class="text-sm text-muted italic">
                No Journey Scenarios name this Journey.
              </p>
              <div :class="entityCardLayoutClass">
                <BlrEntityCard
                  v-for="scenario in openJourneyScenarios"
                  :key="scenario.key"
                  :workspace="workspace"
                  :entity="scenario"
                  :variant="entityCardVariant"
                  :active="scenario.key === inspected?.key"
                  @open="openCard"
                />
              </div>
            </section>
          </article>

          <!-- ENTITY SURFACE: one named subject, with card and table lenses. -->
          <div v-else :class="groupKind ? 'space-y-3' : 'space-y-6'">
            <UCollapsible
              v-for="group in entityGroups"
              :key="group.key || 'all'"
              :default-open="true"
              :disabled="!groupKind"
              :class="groupKind && 'overflow-hidden rounded-xl border border-default bg-elevated/20'"
              :ui="{ content: groupKind ? 'border-t border-muted p-2' : '' }"
            >
              <template v-if="groupKind" #default="{ open }">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="lg"
                  block
                  class="w-full justify-start rounded-none px-3 py-2 text-start"
                >
                  <BlrKind v-if="group.kind" :kind="group.kind" :labelled="false" size="xs" />
                  <UIcon v-else name="i-lucide-minus" class="size-3.5 shrink-0 text-dimmed" />
                  <span
                    class="min-w-0 truncate text-sm font-semibold tracking-tight"
                    :class="group.kind ? 'text-highlighted' : 'text-muted'"
                  >
                    {{ group.title }}
                  </span>
                  <span class="blr-meta ms-auto">{{ group.entities.length }}</span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-3.5 shrink-0 text-dimmed transition-transform"
                    :class="open && 'rotate-180'"
                  />
                </UButton>
              </template>

              <template #content>
                <UTable
                  v-if="viewMode === 'table'"
                  :data="group.entities"
                  :columns="tableColumns"
                  class="rounded-xl border border-default bg-default"
                  :ui="{ tr: 'cursor-pointer' }"
                  :on-select="(_event: Event, row: any) => activate(row.original)"
                />

                <div v-else :class="entityCardLayoutClass">
                  <BlrEntityCard
                    v-for="entity in group.entities"
                    :key="entity.key"
                    :workspace="workspace"
                    :entity="entity"
                    :variant="entityCardVariant"
                    :active="entity.key === activeId"
                    @open="openCard"
                  />
                </div>
              </template>
            </UCollapsible>

            <p v-if="viewMode === 'table' && TABLE_NOTE[activeKind]" class="text-sm text-muted">
              {{ TABLE_NOTE[activeKind] }}
            </p>

            <p v-if="!visibleEntities.length" class="text-sm text-muted italic">
              <template v-if="filtersActive">Nothing matches the current filters.</template>
              <template v-else>This model declares no {{ activeMeta.plural.toLowerCase() }}.</template>
            </p>

            <section v-if="activeKind === 'journey' && orphanScenarios.length" class="space-y-1 border-t border-default pt-4">
              <p class="blr-field">Scenarios whose Journey is not in the model</p>
              <button
                v-for="scenario in orphanScenarios"
                :key="scenario.id"
                type="button"
                class="block text-start text-sm text-muted hover:text-primary"
                @click="inspect(scenario)"
              >
                {{ scenario.title }} — declares journey “{{ scenario.journeyId }}”.
              </button>
            </section>
          </div>
        </div>
      </section>

      <!-- INSPECTOR: the shared slideover every selection re-targets -->
      <BlrInspector
        v-model:tab="inspectorTab"
        :workspace="workspace"
        :entity="inspected"
        @select="inspect($event)"
        @close="inspected = null"
      >
        <template #detail-after="{ entity }">
          <BlrWorkbenchScenarioDrilldown
            :workspace="workspace"
            :entity="entity"
            @select="inspect($event)"
          />
        </template>
      </BlrInspector>
    </div>

    <BlrSearchPalette
      v-model:open="searchOpen"
      :workspace="workspace"
      @select="onSearchSelect"
    />

    <USlideover v-model:open="mobileNavOpen" side="left" :ui="{ content: 'w-72 max-w-[85vw]' }">
      <template #header>
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <UIcon name="i-lucide-package" class="size-4 text-primary" />
          <span class="truncate text-sm font-semibold text-highlighted">{{ workspace.identity.title }}</span>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            class="ms-auto"
            aria-label="Close report navigation"
            @click="mobileNavOpen = false"
          />
        </div>
      </template>
      <template #body>
        <nav>
          <div v-if="$slots.navigation" class="mb-1 border-b border-default pb-2">
            <slot name="navigation" />
          </div>
          <p class="blr-navgroup">Explore</p>
          <button type="button" class="blr-navitem" :data-current="activeSection === 'overview'" @click="setKind('product')">
            <UIcon name="i-lucide-package" class="size-4 text-primary" />
            <span class="flex-1 text-start">Overview</span>
          </button>
          <button type="button" class="blr-navitem" :data-current="topologyActive" @click="openTopology">
            <UIcon name="i-lucide-waypoints" class="size-4 text-primary" />
            <span class="flex-1 text-start">Topology</span>
          </button>
          <p class="blr-navgroup mt-3">Browse</p>
          <button
            v-for="meta in RAIL_KINDS"
            :key="meta.kind"
            type="button"
            class="blr-navitem"
            :data-current="activeSection === meta.kind"
            :style="{ '--kind-color': `var(--blr-slot-${meta.slot})` }"
            @click="setKind(meta.kind)"
          >
            <UIcon :name="meta.icon" class="size-4 shrink-0" :style="{ color: `var(--blr-slot-${meta.slot})` }" />
            <span class="flex-1 truncate text-start">{{ meta.plural }}</span>
            <span class="blr-meta">{{ kindCounts[meta.kind] }}</span>
          </button>
        </nav>
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
/*
  The categorical slot variables mirror BlrFlowCanvas so the kind colours read
  identically inside and outside the graphs. Hexes appear only here, as the
  definition of the vars the markup consumes.
*/
.blr-workbench {
  --blr-slot-0: #2a78d6;
  --blr-slot-1: #eb6834;
  --blr-slot-2: #1baf7a;
  --blr-slot-3: #eda100;
  --blr-slot-4: #e87ba4;
  --blr-slot-5: #008300;
  --blr-slot-6: #4a3aa7;
  --blr-slot-7: #e34948;
  --blr-slot-8: #746651;
  --blr-slot-9: #2a78d6;
  font-variant-numeric: tabular-nums;
}

:global(.dark) .blr-workbench {
  --blr-slot-0: #3987e5;
  --blr-slot-1: #d95926;
  --blr-slot-2: #199e70;
  --blr-slot-3: #c98500;
  --blr-slot-4: #d55181;
  --blr-slot-5: #008300;
  --blr-slot-6: #9085e9;
  --blr-slot-7: #e66767;
  --blr-slot-8: #ab9d81;
  --blr-slot-9: #3987e5;
}

/* Left rail: kind switcher rows */
.blr-navgroup {
  padding: 0.4rem 0.625rem 0.25rem;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.blr-navitem {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: var(--text-sm);
  color: var(--ui-text-muted);
  transition: background 0.12s ease, color 0.12s ease;
}

.blr-navitem:hover {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
}

.blr-navitem[data-current='true'] {
  background: color-mix(in srgb, var(--kind-color) 10%, var(--ui-bg-elevated));
  box-shadow: inset 2px 0 0 var(--kind-color);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

/* Overview disclosures: a full-width row that reads as a heading. */
.blr-disclosure {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 0;
  text-align: start;
}

.blr-disclosure:hover {
  color: var(--ui-text-highlighted);
}

</style>
