<script setup lang="ts">
/**
 * Workbench — Tripane, made entity-first.
 *
 * The three zones are Tripane's, and for the same reason: navigation, working
 * view and inspector are always on screen, so reading one entity never costs
 * the place you were reading from.
 *
 * What differs is the working view. Instead of a bespoke composition per kind,
 * every kind is the same surface — cards ⇄ table, facet filters, and group-by
 * over any related kind — so browsing is one behaviour learned once. Depth is
 * reached three ways, each for a different question:
 * - the shared BlrInspector slideover, for "tell me everything about this one";
 * - a drill-down, only where the model genuinely nests (Journey → Scenarios);
 * - ⌘K, for "I know its name, take me there".
 *
 * Scenarios have no page of their own here: they are steps of a promise, read
 * inside the Journey that declares them.
 */
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  ActorView,
  AnyEntityView,
  AvailabilityPair,
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
import { ENTITY_KIND_META, REPORT_ENTITY_KINDS, resolveEntities } from '../utils/reportWorkspace'
import type { FacetSelections } from '../utils/entityFacets'
import {
  entitiesOfKind,
  facetKindsFor,
  filterEntities,
  groupEntities,
  hasSelections,
  relatedIds
} from '../utils/entityFacets'
import { buildRadialSitemap, buildSitemapTree } from '../utils/flowGraph'
import { firstSentence } from '../utils/reportMarkdown'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Selection: activeKind/activeId drive the working view, the inspector */
/* follows every selection, and only a Journey opens an inner page.     */
/* ------------------------------------------------------------------ */

/** Scenarios are read inside their Journey, so the rail never lists them. */
const RAIL_KINDS = REPORT_ENTITY_KINDS.filter(meta => meta.kind !== 'scenario')

type ViewMode = 'cards' | 'table' | 'sitemap'

const activeKind = ref<ReportEntityKind>('product')
const activeId = ref<string | null>(null)
const inspected = ref<AnyEntityView | null>(null)
const inspectorTab = ref<'detail' | 'map'>('detail')
const searchOpen = ref(false)
const openJourneyId = ref<string | null>(null)
const journeyOverlayId = ref<string | null>(null)
const sitemapLayout = ref<'tree' | 'radial'>('tree')
const expandedRules = ref<string[]>([])

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

const groupOptions = computed(() => facetKinds.value
  .map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind })))

const VIEW_MODE_TABS = computed(() => {
  const tabs = [
    { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
    { value: 'table', label: 'Table', icon: 'i-lucide-table' }
  ]
  if (activeKind.value === 'screen') {
    tabs.push({ value: 'sitemap', label: 'Sitemap', icon: 'i-lucide-network' })
  }
  return tabs
})

const kindEntities = computed<AnyEntityView[]>(() => entitiesOfKind(props.workspace, activeKind.value))

/** What every surface shows: the cards, the table, the counts in the bar. */
const visibleEntities = computed(() => filterEntities(kindEntities.value, facets.value))

const entityGroups = computed(() => {
  const by = groupKind.value
  /* The bucket is named after what is missing, so it reads as a model fact:
     "No Domain", not the generic "Unassigned". */
  return groupEntities(props.workspace, visibleEntities.value, by ?? null,
    by ? `No ${ENTITY_KIND_META[by].label}` : '')
})

const openJourney = computed<JourneyView | null>(() => {
  if (!openJourneyId.value) return null
  const entity = props.workspace.byId.get(openJourneyId.value)
  return entity?.kind === 'journey' ? entity : null
})

const openJourneyScenarios = computed<ScenarioView[]>(() =>
  openJourney.value ? props.workspace.scenariosByJourney.get(openJourney.value.id) ?? [] : [])

const showToolbar = computed(() => activeKind.value !== 'product' && !openJourney.value)

function setKind(kind: ReportEntityKind) {
  activeKind.value = kind
  activeId.value = null
  openJourneyId.value = null
}

/** Activation moves the working view; a Journey activates into its own page. */
function activate(entity: AnyEntityView) {
  activeId.value = entity.id
  if (entity.kind === 'journey') {
    openJourneyId.value = entity.id
    inspected.value = null
    return
  }
  inspect(entity)
}

/** Any selection anywhere re-targets the open inspector, never the centre. */
function inspect(entity: AnyEntityView) {
  inspected.value = entity
  inspectorTab.value = 'detail'
}

function inspectId(id: string) {
  const entity = props.workspace.byId.get(id)
  if (entity) inspect(entity)
}

function openJourneyPage(journey: JourneyView) {
  activeKind.value = 'journey'
  activeId.value = journey.id
  openJourneyId.value = journey.id
}

/** ⌘K lands on the entity: its kind's surface, plus the inspector on it. */
function onSearchSelect(entity: AnyEntityView) {
  if (entity.kind === 'scenario') {
    const journey = props.workspace.byId.get(entity.journeyId)
    if (journey?.kind === 'journey') openJourneyPage(journey)
    inspect(entity)
    return
  }
  activeKind.value = entity.kind
  activeId.value = entity.id
  openJourneyId.value = entity.kind === 'journey' ? entity.id : null
  inspect(entity)
}

/* ------------------------------------------------------------------ */
/* Tables: one column set per kind, built from the same three helpers   */
/* ------------------------------------------------------------------ */

const titlesOf = (ids: string[]) =>
  resolveEntities(props.workspace, ids).map(entity => entity.title).join(', ')

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
    cell: ({ row }) => countCell(relatedIds(row.original, kind).length, titlesOf(relatedIds(row.original, kind)))
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
        relationColumn('journey'),
        relationColumn('scenario'),
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
          return id ? props.workspace.byId.get(id)?.title ?? id : ''
        }),
        contextColumn(),
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
        relationColumn('scenario'),
        relationColumn('rule'),
        numberColumn('steps', 'Steps', entity => (entity as JourneyView).stepCount)
      ]
    case 'rule':
      return [
        ...base,
        relationColumn('domain'),
        relationColumn('capability'),
        relationColumn('journey'),
        relationColumn('scenario'),
        contextColumn()
      ]
    default:
      return base
  }
})

const TABLE_NOTE: Partial<Record<ReportEntityKind, string>> = {
  screen: 'Contexts are declared availability scopes; Journeys and Scenarios are derived participation. Hover a count for the names behind it.',
  capability: 'Journeys, Screens and Rules are derived from what declares this Capability. Hover a count for the names behind it.',
  journey: 'Screens and Rules include derived participation (via Scenarios and Capabilities); Steps is the authored step depth.',
  rule: 'Counts are authored attachments; the card view adds the reach derived from them.'
}

/* ------------------------------------------------------------------ */
/* Screens: the sitemap, drawn top-down or from the Product core        */
/* ------------------------------------------------------------------ */

const overlayJourney = computed<JourneyView | null>(() => {
  if (!journeyOverlayId.value) return null
  const entity = props.workspace.byId.get(journeyOverlayId.value)
  return entity?.kind === 'journey' ? entity : null
})

const SITEMAP_TABS = [
  { value: 'tree', label: 'Tree', icon: 'i-lucide-network' },
  { value: 'radial', label: 'Radial', icon: 'i-lucide-orbit' }
]

const sitemap = computed(() => {
  const build = sitemapLayout.value === 'tree' ? buildSitemapTree : buildRadialSitemap
  const emphasize = overlayJourney.value
    ? new Set(overlayJourney.value.screenIds)
    : (filtersActive.value ? new Set(visibleEntities.value.map(entity => entity.id)) : null)
  return build(props.workspace, {
    emphasizeScreenIds: emphasize,
    selectedId: inspected.value?.id ?? null
  })
})

function toggleOverlay(journeyId: string) {
  journeyOverlayId.value = journeyOverlayId.value === journeyId ? null : journeyId
}

/* ------------------------------------------------------------------ */
/* Business rules: ranked by explicit binding count, impact on expand   */
/* ------------------------------------------------------------------ */

function ruleDirectCount(rule: RuleView): number {
  return rule.domainIds.length + rule.capabilityIds.length
    + rule.journeyIds.length + rule.scenarioIds.length
}

function rankRules(entities: AnyEntityView[]): RuleView[] {
  return [...(entities as RuleView[])].sort((left, right) =>
    ruleDirectCount(right) - ruleDirectCount(left) || left.title.localeCompare(right.title))
}

function toggleRule(id: string) {
  expandedRules.value = expandedRules.value.includes(id)
    ? expandedRules.value.filter(item => item !== id)
    : [...expandedRules.value, id]
}

interface RuleImpact {
  derivedCapabilities: CapabilityView[]
  derivedJourneys: JourneyView[]
  derivedScreens: ScreenView[]
}

/** Derived reach, each hop factual: via Domain, via Capability, via Scenario. */
function ruleImpact(rule: RuleView): RuleImpact {
  const directCapabilities = new Set(rule.capabilityIds)
  const derivedCapabilities = props.workspace.capabilities.filter(capability =>
    !!capability.domainId
    && rule.domainIds.includes(capability.domainId)
    && !directCapabilities.has(capability.id))
  const reachedCapabilities = new Set([
    ...rule.capabilityIds,
    ...derivedCapabilities.map(capability => capability.id)
  ])
  const scenarioJourneyIds = new Set(rule.scenarioIds
    .map((id) => {
      const scenario = props.workspace.byId.get(id)
      return scenario?.kind === 'scenario' ? scenario.journeyId : null
    })
    .filter((id): id is string => Boolean(id)))
  const derivedJourneys = props.workspace.journeys.filter(journey =>
    !rule.journeyIds.includes(journey.id)
    && (journey.capabilityIds.some(id => reachedCapabilities.has(id)) || scenarioJourneyIds.has(journey.id)))
  const derivedScreens = props.workspace.screens.filter(screen =>
    screen.capabilityIds.some(id => reachedCapabilities.has(id)))
  return { derivedCapabilities, derivedJourneys, derivedScreens }
}

/* ------------------------------------------------------------------ */
/* Journeys                                                            */
/* ------------------------------------------------------------------ */

function scenarioTitles(journey: JourneyView): string[] {
  return (props.workspace.scenariosByJourney.get(journey.id) ?? []).map(item => item.title)
}

/** Scenarios whose Journey is not in the model would otherwise be unreachable. */
const orphanScenarios = computed(() => props.workspace.scenarios
  .filter(scenario => !props.workspace.byId.has(scenario.journeyId)))

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

const ACCESS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  public: 'success',
  authenticated: 'warning',
  restricted: 'error'
}

/** The one-line shape of the model, in the order the entities depend on. */
const countFacts = computed(() => [
  { label: 'Journeys', value: props.workspace.counts.journeys },
  { label: 'Scenarios', value: props.workspace.counts.scenarios },
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
  ['Scenarios', props.workspace.counts.scenarios],
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
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5">
      <UIcon v-else name="i-lucide-package" class="size-5 shrink-0 text-primary" />
      <button
        type="button"
        class="shrink-0 truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary"
        title="Open the Overview"
        @click="setKind('product')"
      >
        {{ workspace.identity.title }}
      </button>

      <!-- Where you are: the working view names itself here, not above itself. -->
      <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed" />
      <template v-if="openJourney">
        <button
          type="button"
          class="blr-eyebrow inline-flex shrink-0 items-center gap-1.5 hover:underline hover:underline-offset-4"
          title="Back to the Journeys"
          @click="openJourneyId = null"
        >
          <UIcon :name="activeMeta.icon" class="size-3.5" :style="{ color: `var(--blr-slot-${activeMeta.slot})` }" />
          {{ activeMeta.plural }}
        </button>
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed" />
        <span class="min-w-0 truncate text-sm font-medium text-highlighted">{{ openJourney.title }}</span>
      </template>
      <template v-else>
        <span class="blr-eyebrow inline-flex shrink-0 items-center gap-1.5">
          <UIcon :name="activeMeta.icon" class="size-3.5" :style="{ color: `var(--blr-slot-${activeMeta.slot})` }" />
          {{ activeKind === 'product' ? 'Overview' : activeMeta.plural }}
        </span>
        <span v-if="activeKind !== 'product'" class="blr-meta shrink-0">
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
          class="rounded-full"
          @click="searchOpen = true"
        >
          <template #trailing>
            <span class="hidden items-center gap-0.5 sm:flex">
              <UKbd value="meta" />
              <UKbd value="K" />
            </span>
          </template>
        </UButton>
        <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
          coverage: {{ workspace.coverage.status }}
        </UBadge>
        <span class="blr-meta hidden sm:inline">{{ workspace.identity.schemaVersion }}</span>
        <span class="blr-meta hidden md:inline">{{ workspace.identity.generatedAt.slice(0, 10) }}</span>
      </span>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- LEFT: the kind switcher, and nothing else — the entities themselves
           are the working view, and ⌘K reaches any one of them by name. -->
      <nav class="blr-pane w-64 shrink-0 border-e border-default">
        <div class="p-2">
          <button
            type="button"
            class="blr-navitem"
            :data-current="activeKind === 'product'"
            :style="{ '--kind-color': 'var(--blr-slot-9)' }"
            @click="setKind('product')"
          >
            <UIcon name="i-lucide-package" class="size-4 shrink-0" style="color: var(--blr-slot-9)" />
            <span class="flex-1 truncate text-start">Overview</span>
          </button>
          <button
            v-for="meta in RAIL_KINDS"
            :key="meta.kind"
            type="button"
            class="blr-navitem"
            :data-current="activeKind === meta.kind"
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
          <!-- How it is shown: grouping, then the shape of the view itself. -->
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

        <!-- Screens, sitemap mode: the map fills the pane. -->
        <div v-if="activeKind === 'screen' && viewMode === 'sitemap'" class="flex min-h-0 flex-1 flex-col">
          <div class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-default px-4 py-2">
            <UTabs
              v-model="sitemapLayout"
              :items="SITEMAP_TABS"
              :content="false"
              color="neutral"
              size="xs"
            />
            <template v-if="workspace.journeys.length">
              <span class="blr-field ms-2 me-1">Journey overlay</span>
              <UButton
                v-for="journey in workspace.journeys"
                :key="journey.id"
                :label="journey.title"
                :color="journeyOverlayId === journey.id ? 'primary' : 'neutral'"
                :variant="journeyOverlayId === journey.id ? 'soft' : 'outline'"
                size="xs"
                class="rounded-full"
                :title="`Fade Screens outside “${journey.title}”`"
                @click="toggleOverlay(journey.id)"
              />
              <UButton v-if="journeyOverlayId" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" label="Clear" @click="journeyOverlayId = null" />
            </template>
            <span v-if="overlayJourney" class="text-xs text-muted">
              {{ overlayJourney.screenIds.length }} Screens participate (derived)
            </span>
            <span v-else-if="filtersActive" class="text-xs text-muted">
              {{ visibleEntities.length }} Screens match the filters and are drawn solid
            </span>
          </div>
          <div v-if="workspace.interfaces.length" class="min-h-0 flex-1">
            <BlrFlowCanvas
              :nodes="sitemap.nodes"
              :edges="sitemap.edges"
              @select="inspectId"
              @clear="inspected = null"
            />
          </div>
          <p v-else class="p-6 text-sm text-muted italic">
            This model declares no Interfaces, so there is no visible surface to map.
          </p>
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
                  :key="actor.id"
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
                            @click="inspectId(group.ownerId)"
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

            <section class="space-y-3 border-t border-default pt-5">
              <header class="flex flex-wrap items-baseline gap-2">
                <h3 class="text-base font-semibold tracking-tight text-highlighted">Scenarios</h3>
                <span class="blr-meta">{{ openJourneyScenarios.length }}</span>
                <span class="text-xs text-muted">
                  Each is one path through this promise: what triggers it, the steps, where it branches, how it ends.
                </span>
              </header>
              <p v-if="!openJourneyScenarios.length" class="text-sm text-muted italic">
                This Journey declares no Scenarios.
              </p>
              <article
                v-for="scenario in openJourneyScenarios"
                :key="scenario.id"
                class="rounded-xl border bg-default p-4 transition"
                :class="scenario.id === inspected?.id ? 'border-primary' : 'border-default'"
              >
                <header class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium text-highlighted hover:text-primary"
                    @click="inspect(scenario)"
                  >
                    {{ scenario.title }}
                  </button>
                  <UBadge color="neutral" variant="subtle" size="sm">{{ scenario.kindName }}</UBadge>
                  <span class="blr-meta ms-auto">{{ scenario.steps.length }} steps</span>
                </header>
                <div class="mt-2.5 flex items-stretch gap-1.5 overflow-x-auto pb-1.5">
                  <div class="blr-lanecard blr-lanecard--trigger">
                    <p class="blr-field">Trigger</p>
                    <p class="mt-0.5">{{ scenario.trigger }}</p>
                  </div>
                  <template v-for="(step, index) in scenario.steps" :key="`step-${index}`">
                    <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                    <div class="blr-lanecard">
                      <p class="blr-field">Step {{ index + 1 }}</p>
                      <p class="mt-0.5">{{ step }}</p>
                    </div>
                  </template>
                  <template v-for="(point, index) in scenario.decisionPoints" :key="`decision-${index}`">
                    <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                    <div class="blr-lanecard blr-lanecard--decision">
                      <p class="blr-field flex items-center gap-1">
                        <UIcon name="i-lucide-git-branch" class="size-3 shrink-0" /> {{ point.title }}
                      </p>
                      <p class="mt-0.5 text-muted">{{ point.question }}</p>
                      <p v-for="(branch, branchIndex) in point.branches" :key="branchIndex" class="mt-1 text-xs">
                        <span class="rounded bg-muted px-1 font-mono">{{ branch.condition }}</span>
                        <span class="text-muted"> → {{ branch.outcome }}</span>
                      </p>
                    </div>
                  </template>
                  <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 self-center text-dimmed" />
                  <div class="blr-lanecard blr-lanecard--outcome">
                    <p class="blr-field">Outcome</p>
                    <p class="mt-0.5">{{ scenario.outcome }}</p>
                  </div>
                </div>
                <div class="mt-2 space-y-1.5">
                  <p v-if="scenario.edgeCases.length" class="text-sm text-muted">
                    <span class="blr-field me-1">Edge cases · {{ scenario.edgeCases.length }}</span>
                    {{ scenario.edgeCases.join(' · ') }}
                  </p>
                  <BlrLinks :workspace="workspace" :ids="scenario.screenIds" kind="screen" interactive @select="inspect" />
                  <BlrLinks :workspace="workspace" :ids="scenario.ruleIds" kind="rule" label="Constrained by" interactive @select="inspect" />
                </div>
              </article>
            </section>
          </article>

          <!-- ENTITY SURFACE: one shape for every kind -->
          <div v-else class="space-y-6">
            <section v-for="group in entityGroups" :key="group.key || 'all'" class="space-y-3">
              <header v-if="groupKind" class="blr-groupheader">
                <BlrKind v-if="group.kind" :kind="group.kind" :labelled="false" size="xs" />
                <UIcon v-else name="i-lucide-minus" class="size-3.5 shrink-0 text-dimmed" />
                <button
                  v-if="group.kind"
                  type="button"
                  class="text-sm font-semibold tracking-tight text-highlighted hover:text-primary"
                  @click="inspectId(group.key)"
                >
                  {{ group.title }}
                </button>
                <span v-else class="text-sm font-semibold tracking-tight text-muted">{{ group.title }}</span>
                <span class="blr-meta ms-auto">{{ group.entities.length }}</span>
              </header>

              <!-- TABLE: the same columns for the whole kind -->
              <template v-if="viewMode === 'table'">
                <UTable
                  :data="group.entities"
                  :columns="tableColumns"
                  class="rounded-xl border border-default bg-default"
                  :ui="{ tr: 'cursor-pointer' }"
                  :on-select="(_event: Event, row: any) => activate(row.original)"
                />
              </template>

              <!-- CARDS: the kind's own reading -->
              <template v-else>
                <!-- ACTORS: who they are and where they enter -->
                <div v-if="activeKind === 'actor'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="actor in group.entities as ActorView[]"
                    :key="actor.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="actor.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(actor)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="actor" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ actor.title }}</h3>
                      <UBadge color="neutral" variant="subtle" size="sm">{{ actor.actorKind }} · {{ actor.relationship }}</UBadge>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ actor.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrLinks :workspace="workspace" :ids="actor.interfaceIds" kind="interface" label="Enters" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="actor.experienceIds" kind="experience" label="Enters" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="actor.journeyIds" kind="journey" label="Performs" interactive @select="inspect" />
                      <p v-if="!actor.interfaceIds.length && !actor.experienceIds.length" class="text-sm text-muted italic">
                        No access context lists this Actor.
                      </p>
                    </div>
                  </article>
                </div>

                <!-- INTERFACES: access contexts — who enters, what is reachable -->
                <div v-else-if="activeKind === 'interface'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="item in group.entities as InterfaceView[]"
                    :key="item.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="item.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(item)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="interface" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h3>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ item.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                      <ul v-if="item.entryPoints.length" class="space-y-1">
                        <li v-for="point in item.entryPoints" :key="point.path" class="flex items-center gap-1.5">
                          <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 text-dimmed" />
                          <span class="blr-meta truncate">{{ point.path }}</span>
                        </li>
                      </ul>
                      <div v-if="item.capabilityBoundary" class="space-y-0.5">
                        <p class="blr-field">Capability boundary</p>
                        <p class="text-sm leading-6 text-default">{{ item.capabilityBoundary }}</p>
                      </div>
                      <BlrLinks :workspace="workspace" :ids="item.experienceIds" kind="experience" label="Experiences within" interactive @select="inspect" />
                      <div class="space-y-1.5 border-t border-default pt-2">
                        <p class="blr-field">Available here (derived)</p>
                        <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                        <p v-if="!item.screenIds.length" class="text-sm text-muted italic">
                          No Screens — not a graphical surface, and that is fine.
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <!-- EXPERIENCES: bounded contexts inside an Interface -->
                <div v-else-if="activeKind === 'experience'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="item in group.entities as ExperienceView[]"
                    :key="item.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="item.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(item)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="experience" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ item.title }}</h3>
                      <UBadge :color="ACCESS_TONE[item.accessMode] || 'neutral'" variant="subtle" size="sm">{{ item.accessMode }}</UBadge>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ item.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrLinks :workspace="workspace" :ids="item.actorIds" kind="actor" label="Who enters" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="item.interfaceIds" kind="interface" label="Within" interactive @select="inspect" />
                      <ul v-if="item.entryPoints.length" class="space-y-1">
                        <li v-for="point in item.entryPoints" :key="point.path" class="flex items-center gap-1.5">
                          <UIcon name="i-lucide-corner-down-right" class="size-3 shrink-0 text-dimmed" />
                          <span class="blr-meta shrink-0">{{ point.interfaceTitle }}</span>
                          <span class="blr-meta truncate">{{ point.path }}</span>
                        </li>
                      </ul>
                      <div v-if="item.capabilityBoundary" class="space-y-0.5">
                        <p class="blr-field">Capability boundary</p>
                        <p class="text-sm leading-6 text-default">{{ item.capabilityBoundary }}</p>
                      </div>
                      <div class="space-y-1.5 border-t border-default pt-2">
                        <p class="blr-field">Available here (derived)</p>
                        <BlrLinks :workspace="workspace" :ids="item.capabilityIds" kind="capability" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="item.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="item.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                      </div>
                    </div>
                  </article>
                </div>

                <!-- SCREENS: the entity itself; the map is a view away -->
                <div v-else-if="activeKind === 'screen'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="screen in group.entities as ScreenView[]"
                    :key="screen.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="screen.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(screen)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="screen" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ screen.title }}</h3>
                      <span class="blr-meta ms-auto">{{ screen.states.length }} states</span>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ screen.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrAvail :pairs="screen.availability" :entry-points="screen.entryPoints" />
                      <BlrLinks :workspace="workspace" :ids="screen.capabilityIds" kind="capability" :max="4" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="screen.journeyIds" kind="journey" label="Journeys (derived)" :max="4" interactive @select="inspect" />
                    </div>
                  </article>
                </div>

                <!-- DOMAINS: capability areas and their derived reach -->
                <div v-else-if="activeKind === 'domain'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="domain in group.entities as DomainView[]"
                    :key="domain.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="domain.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(domain)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="domain" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ domain.title }}</h3>
                      <span class="blr-meta ms-auto">{{ domain.capabilityIds.length }} capabilities</span>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ domain.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrLinks :workspace="workspace" :ids="domain.capabilityIds" kind="capability" interactive @select="inspect" />
                      <div class="space-y-1.5 border-t border-default pt-2">
                        <p class="blr-field">Derived reach</p>
                        <BlrLinks :workspace="workspace" :ids="domain.journeyIds" kind="journey" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="domain.screenIds" kind="screen" :max="5" interactive @select="inspect" />
                        <BlrLinks :workspace="workspace" :ids="domain.ruleIds" kind="rule" :max="5" interactive @select="inspect" />
                      </div>
                    </div>
                  </article>
                </div>

                <!-- CAPABILITIES: the entity itself, no matrices -->
                <div v-else-if="activeKind === 'capability'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="capability in group.entities as CapabilityView[]"
                    :key="capability.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="capability.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="activate(capability)"
                  >
                    <header class="flex items-center gap-2">
                      <BlrKind kind="capability" :labelled="false" />
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ capability.title }}</h3>
                      <button
                        v-if="capability.domainId"
                        type="button"
                        class="blr-meta ms-auto shrink-0 hover:text-primary"
                        @click.stop="inspectId(capability.domainId!)"
                      >
                        {{ workspace.byId.get(capability.domainId)?.title ?? capability.domainId }}
                      </button>
                    </header>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ capability.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrAvail :pairs="capability.availability" />
                      <BlrLinks :workspace="workspace" :ids="capability.journeyIds" kind="journey" label="Used by" :max="4" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="capability.screenIds" kind="screen" label="Screens (derived)" :max="4" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="capability.ruleIds" kind="rule" label="Constrained by" :max="3" interactive @select="inspect" />
                    </div>
                  </article>
                </div>

                <!-- JOURNEYS: the promise, opening into its own page -->
                <div v-else-if="activeKind === 'journey'" class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="journey in group.entities as JourneyView[]"
                    :key="journey.id"
                    class="cursor-pointer rounded-xl border bg-default p-4 transition hover:border-accented"
                    :class="journey.id === activeId ? 'border-primary bg-primary/5' : 'border-default'"
                    @click="openJourneyPage(journey)"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-base font-semibold tracking-tight text-highlighted">{{ journey.title }}</h3>
                      <BlrKind kind="scenario" :count="journey.scenarioIds.length" :labelled="false" size="xs" />
                    </div>
                    <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{{ journey.lead }}</p>
                    <div class="mt-2.5 space-y-1.5" @click.stop>
                      <BlrLinks :workspace="workspace" :ids="journey.actorIds" kind="actor" interactive @select="inspect" />
                      <BlrAvail :pairs="journey.availability" label="" />
                      <div v-if="scenarioTitles(journey).length" class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span class="blr-field">Scenarios</span>
                        <span class="text-sm text-default">{{ scenarioTitles(journey).join(' · ') }}</span>
                      </div>
                      <BlrLinks :workspace="workspace" :ids="journey.capabilityIds" kind="capability" :max="4" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="journey.screenIds" kind="screen" :max="4" interactive @select="inspect" />
                      <BlrLinks :workspace="workspace" :ids="journey.ruleIds" kind="rule" :max="3" interactive @select="inspect" />
                    </div>
                    <p class="blr-meta mt-2.5 flex items-center gap-1">
                      <UIcon name="i-lucide-corner-down-right" class="size-3" />
                      Open to read its Scenarios
                    </p>
                  </article>
                </div>

                <!-- RULES: ranked by explicit binding count, expandable impact -->
                <div v-else-if="activeKind === 'rule'" class="space-y-2.5">
                  <article
                    v-for="(rule, rank) in rankRules(group.entities)"
                    :key="rule.id"
                    class="rounded-xl border bg-default transition"
                    :class="rule.id === activeId ? 'border-primary' : 'border-default hover:border-accented'"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2.5 text-start"
                      @click="toggleRule(rule.id); activate(rule)"
                    >
                      <span class="blr-meta w-5 shrink-0 text-end">{{ rank + 1 }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium text-highlighted">{{ rule.title }}</span>
                        <span class="block truncate text-sm text-muted">{{ firstSentence(rule.statement, 110) }}</span>
                      </span>
                      <span class="blr-meta shrink-0">{{ ruleDirectCount(rule) }} explicit bindings</span>
                      <UIcon
                        :name="expandedRules.includes(rule.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                        class="size-4 shrink-0 text-dimmed"
                      />
                    </button>
                    <div v-if="expandedRules.includes(rule.id)" class="space-y-3 border-t border-default px-4 py-3.5">
                      <BlrProse :text="rule.statement" />
                      <div v-if="rule.rationale" class="space-y-1">
                        <p class="blr-field">Rationale</p>
                        <BlrProse :text="rule.rationale" />
                      </div>
                      <div class="grid gap-4 lg:grid-cols-2">
                        <div class="space-y-1.5 rounded-xl border border-default bg-default p-4">
                          <p class="blr-field">Direct attachments (authored)</p>
                          <BlrLinks :workspace="workspace" :ids="rule.domainIds" kind="domain" interactive @select="inspect" />
                          <BlrLinks :workspace="workspace" :ids="rule.capabilityIds" kind="capability" interactive @select="inspect" />
                          <BlrLinks :workspace="workspace" :ids="rule.journeyIds" kind="journey" interactive @select="inspect" />
                          <BlrLinks :workspace="workspace" :ids="rule.scenarioIds" kind="scenario" interactive @select="inspect" />
                          <p v-if="!ruleDirectCount(rule)" class="text-sm text-muted italic">
                            Attached to nothing explicitly.
                          </p>
                        </div>
                        <div class="space-y-1.5 rounded-xl border border-dashed border-accented p-4">
                          <p class="blr-field">Derived reach (computed)</p>
                          <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedCapabilities.map(item => item.id)" kind="capability" label="Capabilities · via Domain" interactive @select="inspect" />
                          <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedJourneys.map(item => item.id)" kind="journey" label="Journeys · via Capability or Scenario" interactive @select="inspect" />
                          <BlrLinks :workspace="workspace" :ids="ruleImpact(rule).derivedScreens.map(item => item.id)" kind="screen" label="Screens · via Capability" interactive @select="inspect" />
                          <p
                            v-if="!ruleImpact(rule).derivedCapabilities.length && !ruleImpact(rule).derivedJourneys.length && !ruleImpact(rule).derivedScreens.length"
                            class="text-sm text-muted italic"
                          >
                            No further reach derives from the direct attachments.
                          </p>
                        </div>
                      </div>
                      <BlrAvail
                        :pairs="rule.availability"
                        label="Scoped to"
                        inherited-note="Not narrowed to specific Interface availability scopes."
                      />
                    </div>
                  </article>
                </div>
              </template>
            </section>

            <p v-if="viewMode === 'table' && TABLE_NOTE[activeKind]" class="text-sm text-muted">
              {{ TABLE_NOTE[activeKind] }}
            </p>

            <p v-if="!entityGroups.length" class="text-sm text-muted italic">
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
      />
    </div>

    <BlrSearchPalette
      v-model:open="searchOpen"
      :workspace="workspace"
      @select="onSearchSelect"
    />
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

/* Group headers: sticky, so the group a card belongs to stays named while
   the group is being scrolled through. */
.blr-groupheader {
  position: sticky;
  top: -1.25rem;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 -0.25rem;
  padding: 0.5rem 0.25rem;
  background: var(--ui-bg);
  border-bottom: 1px solid var(--ui-border-muted);
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

/* Scenario flow lane cards */
.blr-lanecard {
  flex-shrink: 0;
  width: 13rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--ui-text);
}

.blr-lanecard--trigger {
  border-inline-start: 2px solid var(--blr-slot-7);
}

.blr-lanecard--decision {
  border-style: dashed;
  width: 15rem;
}

.blr-lanecard--outcome {
  border-inline-start: 2px solid var(--ui-primary);
}
</style>
