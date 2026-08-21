<script setup lang="ts">
/**
 * Workbench — a rail, a working view, and a peek.
 *
 * The rail lists kinds and nothing else, because kinds do not nest — instances
 * do. Containment appears where instances are: as the default grouping of a
 * collection and on the entity page. `BlrRail` carries that argument in full.
 *
 * Depth has exactly two containers, and the difference between them is not
 * taste but measurement. An entity's authored content ranges from 570px for an
 * Actor to 2264px for a Journey Scenario, and no single container serves both:
 *
 * - the **peek** is a glance from a list — four fixed zones, no scrolling, one
 *   level deep, and every relation on it navigates rather than re-targeting it;
 * - the **page** is the reading — a URL, a breadcrumb, the authored body at
 *   full width, and the browser's own back button.
 *
 * ⌘K is the third way in, for "I know its name, take me there", and it lands on
 * the page for the same reason: naming something means meaning it.
 *
 * Breadth has one destination: Topology, whose named views answer fixed
 * cross-kind questions, and whose focus filter draws one entity's
 * neighbourhood at a width that can actually render it.
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
  INTERFACE_TYPE_META,
  REPORT_ENTITY_KINDS,
  isScenarioKind,
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
import { firstSentence } from '../utils/reportMarkdown'
import { BROWSE_SURFACES } from '../utils/browseSurfaces'

const UButton = resolveComponent('UButton')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Selection: `activeKind` is what the working view is about, `inspected` */
/* is what the peek glances at, and `openEntity` is the page you are on.  */
/* ------------------------------------------------------------------ */

/*
  A Scenario is the only entity with a mandatory single parent, so it is read
  from that Capability or Journey's page rather than exposed as another
  collection in the rail or as a peer tab on the parent's main screen.
*/
const PARENT_OF: Partial<Record<ReportEntityKind, ReportEntityKind>> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

type ViewMode = 'cards' | 'table'
type WorkbenchSection = 'overview' | 'topology' | ReportEntityKind

/**
 * The open section, bindable by the host so it can live in the URL.
 *
 * `activeKind` stays internal: it is what the working view is *about*, which
 * for the overview is the Product rather than the section name.
 */
const section = defineModel<string>('section', { default: 'overview' })

/**
 * The entity whose page is open, or `null` for the section's own surface.
 *
 * Bindable for the same reason `section` is, and the reason pages exist at all:
 * a page a reader can reach but not link to, return to, or refresh is a modal
 * with extra steps. The peek is deliberately *not* here — it is a glance, and
 * replaying every glance through browser history would make back useless.
 */
const openEntity = defineModel<string | null>('entity', { default: null })

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
/* One entity's neighbourhood, drawn on the topology canvas rather than in a
   panel too narrow to render it legibly. */
const topologyFocus = ref<string | null>(null)
const searchOpen = ref(false)
const mobileNavOpen = ref(false)
/* The internal name for the open page is the bindable model itself, so a page
   opened by a click and a page opened by a URL are the same state. */
const openJourneyId = openEntity
const filterOpen = ref(false)

/* Toolbar state is kept per kind: moving to another kind and back returns to
   the shape you left, which is the point of a persistent working view. */
const viewModes = reactive<Partial<Record<ReportEntityKind, ViewMode>>>({})
/* `null` is an explicit "no grouping"; absent means the default has not been
   overridden. Without the distinction, turning grouping off would immediately
   turn it back on. */
const groupKinds = reactive<Partial<Record<ReportEntityKind, ReportEntityKind | null>>>({})
const facetState = reactive<Partial<Record<ReportEntityKind, FacetSelections>>>({})

/*
  Each surface opens grouped by the containment the format declares for it —
  the surface tree for Screens and Experiences, the behavior tree for Scenarios,
  the subject axis for Capabilities and Rules. This is where the hierarchy a
  tree rail was asked to show actually belongs: over instances, where the model
  has it, and one click from being dismissed.

  Roots (Actors, Interfaces, Domains, Journeys) are contained by nothing and
  open flat.
*/
const DEFAULT_GROUPING: Partial<Record<ReportEntityKind, ReportEntityKind>> = {
  experience: 'interface',
  screen: 'interface',
  capability: 'domain',
  'capability-scenario': 'capability',
  'journey-scenario': 'journey',
  rule: 'domain'
}

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
  get: () => {
    const chosen = groupKinds[activeKind.value]
    if (chosen === null) return undefined
    if (chosen) return chosen
    /* A default only applies when the model actually holds that kind: grouping
       Capabilities by a Domain collection that is empty would file all ten
       under "No Domain". */
    const fallback = DEFAULT_GROUPING[activeKind.value]
    return fallback && entitiesOfKind(props.workspace, fallback).length ? fallback : undefined
  },
  set: (value) => {
    groupKinds[activeKind.value] = value ?? null
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

/*
  Chrome scales with the collection.

  Eight controls above four Journeys is not a filter offer, it is a wall. Below
  this many entities the eye is faster than any facet, so the control is not
  rendered at all rather than rendered disabled.
*/
const FILTER_THRESHOLD = 8

const filtersOffered = computed(() => facetKinds.value.length > 0
  && kindEntities.value.length >= FILTER_THRESHOLD)

/** One chip per *active* facet, naming what it selected — never one per offer. */
const facetChips = computed(() => facetKinds.value
  .filter(kind => facetValues(kind).length)
  .map((kind) => {
    const ids = facetValues(kind)
    const meta = ENTITY_KIND_META[kind]
    const [first] = resolveEntities(props.workspace, kind, ids)
    const rest = ids.length - 1
    return {
      kind,
      icon: meta.icon,
      label: ids.length === 1 ? meta.label : meta.plural,
      value: `${first?.title ?? ids[0]}${rest > 0 ? ` +${rest}` : ''}`
    }
  }))

const activeFacetCount = computed(() => facetChips.value.length)

const VIEW_MODE_TABS = [
  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
]

const kindEntities = computed<AnyEntityView[]>(() => entitiesOfKind(props.workspace, activeKind.value))

/** What every surface shows: the cards, the table, the counts in the bar. */
const visibleEntities = computed(() => filterEntities(kindEntities.value, facets.value))

const groupOptions = computed(() => facetKinds.value
  .map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind })))

/*
  An entity relating to several group owners appears under each of them, because
  the model says it belongs to all and dropping it from any but the first would
  be a quiet edit. The visible consequence is group counts that sum past the
  collection count, so the surface says why once rather than leaving a reader to
  wonder whether it is double counting.
*/
const multiGroupCount = computed(() => {
  if (!groupKind.value) return 0
  const memberships = new Map<string, number>()
  for (const group of entityGroups.value) {
    for (const entity of group.entities) memberships.set(entity.key, (memberships.get(entity.key) ?? 0) + 1)
  }
  return [...memberships.values()].filter(count => count > 1).length
})

const multiGroupNote = computed(() => {
  const count = multiGroupCount.value
  if (!count || !groupKind.value) return ''
  const subject = count === 1 ? activeMeta.value.label : activeMeta.value.plural
  return `${count} ${subject} ${count === 1 ? 'relates' : 'relate'} to more than one `
    + `${ENTITY_KIND_META[groupKind.value].label} and ${count === 1 ? 'appears' : 'appear'} under each.`
})

const entityGroups = computed(() => {
  const by = groupKind.value
  /* The bucket is named after what is missing, so it reads as a model fact:
     "No Domain", not the generic "Unassigned". */
  return groupEntities(props.workspace, visibleEntities.value, by ?? null,
    by ? `No ${ENTITY_KIND_META[by].label}` : '')
})

/*
  Every kind has a page.

  "Which kinds deserve one" is a judgement call that has to be re-made every
  time a field is added, and the measurement that forced the split — 570px of
  content for an Actor against 2264px for a Journey Scenario — is an argument
  about the *peek*, not about pages. A thin page is a good page: for an Actor,
  the reach is the reading.
*/
const openPage = computed<AnyEntityView | null>(() => openJourneyId.value
  ? resolveEntityKey(props.workspace, openJourneyId.value) ?? null
  : null)

/**
 * The trail above an open page.
 *
 * A Scenario has exactly one parent, and the collection it belongs to is that
 * parent's — so `Capability Scenarios › Create an owned collection` names a
 * collection the reader never chose and drops the Capability they came from.
 * The trail walks the containment instead: collection, parent, entity.
 */
interface TrailStep {
  key: string
  label: string
  title: string
  icon?: string
  slot?: number
  /** True for a collection segment, which reads as an eyebrow rather than a name. */
  collection?: boolean
  go?: () => void
}

const pageTrail = computed<TrailStep[]>(() => {
  const entity = openPage.value
  if (!entity) return []

  const parentKind = PARENT_OF[entity.kind]
  const parent = parentKind && isScenarioKind(entity.kind)
    ? resolveEntity(props.workspace, parentKind, (entity as ScenarioView).scenarioType === 'capability'
        ? (entity as ScenarioView).capabilityId
        : (entity as ScenarioView).journeyId)
    : undefined

  /* The collection is the parent's when there is one: you reached this Scenario
     through Capabilities, not through a collection of every Scenario. */
  const collectionKind = parent ? parent.kind : entity.kind
  const collectionMeta = ENTITY_KIND_META[collectionKind]

  const steps: TrailStep[] = [{
    key: 'collection',
    label: collectionMeta.plural,
    title: `Back to ${collectionMeta.plural}`,
    icon: collectionMeta.icon,
    slot: collectionMeta.slot,
    collection: true,
    go: () => setKind(collectionKind)
  }]

  if (parent) {
    steps.push({
      key: parent.key,
      label: parent.title,
      title: `Back to ${parent.title}`,
      go: () => openEntityPage(parent)
    })
  }

  steps.push({ key: entity.key, label: entity.title, title: entity.title })
  return steps
})

/* A page brings its own section with it, so a link lands with the rail, the
   breadcrumb and the surface behind it already agreeing. */
watch([openEntity, () => props.workspace], () => {
  const key = openEntity.value
  if (!key) return
  const entity = resolveEntityKey(props.workspace, key)
  if (!entity) {
    openEntity.value = null
    return
  }
  activeKind.value = entity.kind
  activeSection.value = entity.kind
}, { immediate: true })

/* Live recompiles replace the projection. Rehydrate selection by stable key so
   focus, filters, and the open page survive ordinary model edits. */
watch(() => props.workspace, (workspace) => {
  if (inspected.value) inspected.value = workspace.byKey.get(inspected.value.key) ?? null
  if (openEntity.value && !workspace.byKey.has(openEntity.value)) openEntity.value = null
  if (activeId.value && !workspace.byKey.has(activeId.value)) activeId.value = null
  if (topologyFocus.value && !workspace.byKey.has(topologyFocus.value)) topologyFocus.value = null
})

const topologyActive = computed(() => activeSection.value === 'topology')
const showToolbar = computed(() => activeKind.value !== 'product' && !openPage.value && !topologyActive.value)
const surface = computed(() => showToolbar.value ? BROWSE_SURFACES[activeKind.value] : undefined)

function setKind(kind: ReportEntityKind) {
  mobileNavOpen.value = false
  activeKind.value = kind
  activeSection.value = kind === 'product' ? 'overview' : kind
  activeId.value = null
  openEntity.value = null
}

function openTopology() {
  mobileNavOpen.value = false
  activeSection.value = 'topology'
  activeId.value = null
  openEntity.value = null
  topologyFocus.value = null
}

/*
  Two gestures, one rule each.

  A row peeks: you are scanning a list and want to know whether this is the one
  you meant, without losing the list. A peek then opens the page, and so does
  any relation on it. Nothing in the working view opens a page behind your back.
*/
function activate(entity: AnyEntityView) {
  activeId.value = entity.key
  inspect(entity)
}

const openCard = activate

/** Any selection anywhere re-targets the open peek, never the centre. */
function inspect(entity: AnyEntityView) {
  inspected.value = entity
}

function inspectKey(key: string) {
  const entity = resolveEntityKey(props.workspace, key)
  if (entity) inspect(entity)
}

/** The page: a place, with a URL, that the browser's back button can leave. */
function openEntityPage(entity: AnyEntityView) {
  mobileNavOpen.value = false
  activeKind.value = entity.kind
  activeSection.value = entity.kind
  activeId.value = entity.key
  openEntity.value = entity.key
  inspected.value = null
}

/** One entity's neighbourhood, on the canvas that can actually draw it. */
function focusTopology(entity: AnyEntityView) {
  activeSection.value = 'topology'
  openEntity.value = null
  topologyFocus.value = entity.key
  inspected.value = entity
}

/** ⌘K lands on the entity's page — you named it, so you meant it. */
function onSearchSelect(entity: AnyEntityView) {
  openEntityPage(entity)
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

/**
 * A relation the format makes single-valued, rendered as the name it holds.
 *
 * A Capability Scenario has exactly one Capability, so a count column reads `1`
 * on every row and the one fact worth sorting by — which Capability — is the
 * one the table hides.
 */
function relationTitleColumn(
  kind: ReportEntityKind,
  label: string,
  read: (entity: AnyEntityView) => string
): TableColumn<AnyEntityView> {
  return {
    id: kind,
    accessorFn: (entity: AnyEntityView) => resolveEntity(props.workspace, kind, read(entity))?.title ?? '',
    header: sortableHeader(label),
    cell: ({ row }) => {
      const entity = resolveEntity(props.workspace, kind, read(row.original))
      return h('span', { class: 'inline-flex items-center gap-1.5 text-sm text-default' }, [
        h(resolveComponent('UIcon'), { name: ENTITY_KIND_META[kind].icon, class: 'size-3.5 shrink-0 text-dimmed' }),
        h('span', { class: 'truncate' }, entity?.title ?? '—')
      ])
    }
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
        textColumn('interfaceType', 'Type', entity =>
          INTERFACE_TYPE_META[(entity as InterfaceView).interfaceType].label),
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
        relationTitleColumn('interface', 'Interface', entity => (entity as ExperienceView).interfaceIds[0] ?? ''),
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
        relationTitleColumn('capability', 'Capability', entity => (entity as ScenarioView).capabilityId),
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
        relationTitleColumn('journey', 'Journey', entity => (entity as ScenarioView).journeyId),
        relationColumn('actor'),
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

/**
 * Drop the columns that say the same thing on every visible row.
 *
 * `0 decisions` twenty-four times is not data, it is twenty-four cells of
 * furniture between the reader and the three columns that vary. Constancy is
 * judged against the *filtered* set, so narrowing a surface can reveal a column
 * and clearing the filter hides it again — the table describes what is on
 * screen, not what the kind could theoretically hold.
 */
const visibleColumns = computed<TableColumn<AnyEntityView>[]>(() => {
  const rows = visibleEntities.value
  if (rows.length < 2) return tableColumns.value
  return tableColumns.value.filter((column, index) => {
    /* The title column identifies the row; it is never furniture. */
    if (index === 0) return true
    const read = (column as { accessorFn?: (row: AnyEntityView, index: number) => unknown }).accessorFn
    if (!read) return true
    const first = read(rows[0]!, 0)
    return rows.some((row, position) => read(row, position) !== first)
  })
})

/** Notes explaining a column the rule above removed would describe nothing. */
const visibleColumnIds = computed(() => new Set(visibleColumns.value.map(column => column.id
  ?? (column as { accessorKey?: string }).accessorKey)))

/** Each note names the columns it explains, so a pruned table drops it too. */
const TABLE_NOTE: Partial<Record<ReportEntityKind, { text: string, needs: string[] }>> = {
  screen: {
    text: 'Scenario and Capability Journey columns keep the two derivation paths separate. Hover a count for the names behind it.',
    needs: ['scenarioJourneys', 'capabilityJourneys']
  },
  capability: {
    text: 'Capability Scenarios are direct coverage. Journeys, Screens and Rules are derived from what declares this Capability.',
    needs: ['capability-scenario', 'journey', 'screen', 'rule']
  },
  journey: {
    text: 'Screens and Rules include derived participation (via Scenarios and Capabilities); Steps is the authored step depth.',
    needs: ['screen', 'rule', 'steps']
  },
  rule: {
    text: 'Counts are authored attachments; the row adds the reach derived from them.',
    needs: ['capability', 'journey', 'capability-scenario', 'journey-scenario']
  },
  'capability-scenario': {
    text: 'Each is one observable acceptance case for exactly one Capability. Contexts are the exact Interface scopes it is accepted in.',
    needs: ['contexts']
  },
  'journey-scenario': {
    text: 'Kind classifies the variation; Result records whether the Journey goal was reached. Capability-bearing Steps carry their route contexts inline.',
    needs: ['steps', 'result']
  }
}

const tableNote = computed(() => {
  const note = TABLE_NOTE[activeKind.value]
  if (!note) return ''
  return note.needs.some(id => visibleColumnIds.value.has(id)) ? note.text : ''
})

/** Scenarios whose Journey is not in the model would otherwise be unreachable. */
const orphanScenarios = computed(() => props.workspace.scenarios
  .filter(scenario => scenario.scenarioType === 'journey'
    && !resolveEntity(props.workspace, 'journey', scenario.journeyId)))

/* The status bar badge and `BlrOverview` read coverage in the same tone. */
const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}
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
      <!-- A page states the whole path it sits on, and every step but the last
           is a link. A Scenario without its parent in the trail is the one
           thing a breadcrumb exists to prevent. -->
      <template v-if="openPage">
        <template v-for="(step, index) in pageTrail" :key="step.key">
          <UIcon
            v-if="index"
            name="i-lucide-chevron-right"
            class="hidden size-3.5 shrink-0 text-dimmed sm:block"
          />
          <button
            v-if="step.go"
            type="button"
            class="hidden shrink-0 items-center gap-1.5 hover:underline hover:underline-offset-4 sm:inline-flex"
            :class="step.collection ? 'blr-eyebrow' : 'min-w-0 max-w-40 truncate text-sm text-muted'"
            :title="step.title"
            @click="step.go()"
          >
            <UIcon
              v-if="step.icon"
              :name="step.icon"
              class="size-3.5 shrink-0"
              :style="{ color: `var(--blr-slot-${step.slot})` }"
            />
            <span class="truncate">{{ step.label }}</span>
          </button>
          <span
            v-else
            class="hidden min-w-0 truncate text-sm font-medium text-highlighted sm:inline"
          >{{ step.label }}</span>
        </template>
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
          <BlrRail
            :workspace="workspace"
            :active-section="activeSection"
            :counts="kindCounts"
            @kind="setKind"
            @topology="openTopology"
          >
            <!-- The host's own way back out, above its sections. -->
            <template v-if="$slots.navigation" #navigation>
              <slot name="navigation" />
            </template>
          </BlrRail>
        </div>
      </nav>

      <!-- CENTER: the working view for the active kind -->
      <section class="flex min-w-0 flex-1 flex-col">
        <!-- Toolbar: what is shown on the left, how it is shown on the right. -->
        <!--
          What this collection is for, in one line, with the derivation behind
          the order it is read in. The named topology views have said this since
          they shipped; a collection that only states its name and count answers
          "what is this called", which nobody asked.
        -->
        <div
          v-if="surface"
          class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-4 py-2"
        >
          <p class="text-sm text-muted">{{ surface.question }}</p>
          <div class="ms-auto flex flex-wrap items-center gap-1">
            <template v-for="(step, index) in surface.flow" :key="step.kind">
              <span v-if="index" class="px-0.5 text-xs text-dimmed">{{ surface.separators[index - 1] ?? '·' }}</span>
              <span class="inline-flex items-center gap-1.5">
                <BlrKind :kind="step.kind" :labelled="false" size="xs" />
                <span class="font-mono text-[10px] uppercase tracking-[0.07em] text-muted">{{ step.label }}</span>
              </span>
            </template>
          </div>
        </div>

        <div
          v-if="showToolbar"
          class="flex shrink-0 items-center gap-2 border-b border-default px-4 py-2"
        >
          <!-- One control, opened on demand, holding the facets this kind has. -->
          <UPopover v-if="filtersOffered" v-model:open="filterOpen">
            <UButton
              icon="i-lucide-list-filter"
              color="neutral"
              :variant="filtersActive ? 'soft' : 'outline'"
              size="xs"
              label="Filter"
              trailing-icon="i-lucide-chevron-down"
            >
              <template v-if="activeFacetCount" #trailing>
                <UBadge color="primary" variant="solid" size="sm">{{ activeFacetCount }}</UBadge>
              </template>
            </UButton>
            <template #content>
              <div class="w-80 space-y-3 p-3">
                <div v-for="kind in facetKinds" :key="kind" class="space-y-1.5">
                  <p class="blr-field flex items-center gap-1.5">
                    <UIcon :name="ENTITY_KIND_META[kind].icon" class="size-3.5" :style="{ color: `var(--blr-slot-${ENTITY_KIND_META[kind].slot})` }" />
                    {{ ENTITY_KIND_META[kind].plural }}
                  </p>
                  <USelectMenu
                    :model-value="facetValues(kind)"
                    :items="facetOptions(kind)"
                    value-key="value"
                    multiple
                    size="xs"
                    variant="outline"
                    class="w-full"
                    :placeholder="`Any ${ENTITY_KIND_META[kind].label.toLowerCase()}`"
                    :search-input="{ placeholder: `Filter ${ENTITY_KIND_META[kind].plural.toLowerCase()}…` }"
                    @update:model-value="setFacet(kind, $event as string[])"
                  />
                </div>
              </div>
            </template>
          </UPopover>

          <!-- A chip per active facet, never one per facet on offer. -->
          <div v-if="facetChips.length" class="flex min-w-0 flex-wrap items-center gap-1.5">
            <button
              v-for="chip in facetChips"
              :key="chip.kind"
              type="button"
              class="blr-chip"
              :title="`Clear this ${chip.label.toLowerCase()} filter`"
              @click="setFacet(chip.kind, [])"
            >
              <UIcon :name="chip.icon" class="size-3.5 shrink-0" :style="{ color: `var(--blr-slot-${ENTITY_KIND_META[chip.kind].slot})` }" />
              <span class="text-dimmed">{{ chip.label }}</span>
              <span class="truncate font-medium text-highlighted">{{ chip.value }}</span>
              <UIcon name="i-lucide-x" class="size-3 shrink-0 text-dimmed" />
            </button>
            <UButton
              v-if="facetChips.length > 1"
              color="neutral"
              variant="ghost"
              size="xs"
              label="Clear"
              @click="clearFacets"
            />
          </div>

          <!-- Filters narrow a named subject; grouping and the lens toggle
               change how that same subject is read. -->
          <div class="ms-auto flex shrink-0 items-center gap-2">
            <template v-if="groupOptions.length">
              <span class="blr-field hidden xl:inline">Group by</span>
              <USelect
                v-model="groupKind"
                :items="groupOptions"
                size="xs"
                variant="outline"
                class="min-w-32"
                icon="i-lucide-rows-3"
                placeholder="Nothing"
                :aria-label="`Group ${activeMeta.plural} by`"
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

        <!-- Product-level breadth: all named topology views share one canvas. -->
        <div v-if="topologyActive" class="min-h-0 flex-1">
          <BlrProductTopology
            :workspace="workspace"
            :selected-id="inspected?.key ?? null"
            :focus="topologyFocus"
            @select="inspect"
            @clear="inspected = null"
          />
        </div>

        <div v-else class="blr-pane flex-1 p-5">
          <!-- OVERVIEW: the Product, and what it promises -->
          <BlrOverview
            v-if="activeKind === 'product'"
            :workspace="workspace"
            :logo-src="logoSrc"
            @select="inspect"
            @select-key="inspectKey"
          >
            <template v-if="$slots['primary-action']" #primary-action>
              <slot name="primary-action" />
            </template>
            <template v-if="$slots.provenance" #provenance>
              <slot name="provenance" />
            </template>
          </BlrOverview>

          <!-- ENTITY PAGE: one entity in full, at its own URL. -->
          <BlrEntityPage
            v-else-if="openPage"
            :workspace="workspace"
            :entity="openPage"
            :selected-key="inspected?.key ?? null"
            @select="inspect"
            @open="openEntityPage"
            @focus="focusTopology"
          />

          <!-- ENTITY SURFACE: one named subject, with card and table lenses. -->
          <div v-else :class="groupKind ? 'space-y-3' : 'space-y-6'">
            <p v-if="multiGroupNote" class="text-xs text-dimmed">{{ multiGroupNote }}</p>
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
                  data-group-header
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
                  :columns="visibleColumns"
                  class="rounded-xl border border-default bg-default"
                  :ui="{ tr: 'cursor-pointer' }"
                  :on-select="(_event: Event, row: any) => activate(row.original)"
                />

                <div v-else class="space-y-2">
                  <BlrEntityCard
                    v-for="entity in group.entities"
                    :key="entity.key"
                    :workspace="workspace"
                    :entity="entity"
                    :active="entity.key === activeId"
                    :badge="!groupKind || groupKind !== group.kind"
                    @open="openCard"
                  />
                </div>
              </template>
            </UCollapsible>

            <p v-if="viewMode === 'table' && tableNote" class="text-sm text-muted">
              {{ tableNote }}
            </p>

            <!-- A dead end names its own way out. -->
            <div v-if="!visibleEntities.length" class="flex flex-wrap items-center gap-3">
              <p class="text-sm text-muted italic">
                <template v-if="filtersActive">Nothing matches the current filters.</template>
                <template v-else>This model declares no {{ activeMeta.plural.toLowerCase() }}.</template>
              </p>
              <UButton
                v-if="filtersActive"
                icon="i-lucide-filter-x"
                color="neutral"
                variant="outline"
                size="xs"
                label="Clear filters"
                @click="clearFacets"
              />
            </div>

            <section v-if="activeKind === 'journey-scenario' && orphanScenarios.length" class="space-y-1 border-t border-default pt-4">
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

      <!-- PEEK: the shared panel every selection re-targets, one level deep -->
      <BlrInspector
        :workspace="workspace"
        :entity="inspected"
        @select="openEntityPage($event)"
        @open="openEntityPage($event)"
        @close="inspected = null"
      />
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
        <!-- One rail, two placements: the narrow viewport gets the same rows,
             not a second copy that drifts from them. -->
        <BlrRail
          :workspace="workspace"
          :active-section="activeSection"
          :counts="kindCounts"
          @kind="setKind"
          @topology="openTopology"
        >
          <template v-if="$slots.navigation" #navigation>
            <slot name="navigation" />
          </template>
        </BlrRail>
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

/* An active filter, stating what it selected and clearing itself on click. */
.blr-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 18rem;
  padding: 0.1875rem 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  background: var(--ui-bg-elevated);
  font-size: 12px;
  line-height: 1.25rem;
}

.blr-chip:hover {
  border-color: var(--ui-border-accented);
}

</style>
