<script setup lang="ts">
/**
 * Product Report shell — a rail, collection views, element pages, and Topology.
 *
 * The rail lists kinds and nothing else, because kinds do not nest — instances
 * do. Containment appears where instances are: as the default grouping of a
 * collection and on the element page. `BlrRail` carries that argument in full.
 *
 * A collection row opens the element page directly. The page is the one reading:
 * a URL, a breadcrumb, the authored body at full width, and the browser's own
 * back button.
 *
 * ⌘K is the third way in, for "I know its name, take me there", and it lands on
 * the page for the same reason: naming something means meaning it.
 *
 * Breadth has one destination: Topology, whose named views answer fixed
 * cross-kind questions, and whose focus filter draws one element's
 * neighbourhood at a width that can actually render it.
 */
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  ActorView,
  AnyElementView,
  ContextView,
  CapabilityView,
  ExperienceView,
  InterfaceView,
  JourneyView,
  ReportElementKind,
  ReportWorkspace,
  ScenarioView,
  ScreenView
} from '../utils/reportWorkspace'
import {
  ENTITY_KIND_META,
  INTERFACE_TYPE_META,
  REPORT_ENTITY_KINDS,
  isScenarioKind,
  resolveElements,
  resolveElement,
  resolveElementKey
} from '../utils/reportWorkspace'
import type { FacetSelections } from '../utils/elementFacets'
import {
  elementsOfKind,
  facetKindsFor,
  filterElements,
  groupElements,
  hasSelections,
  relatedIds
} from '../utils/elementFacets'
import { docsForElementKind } from '../utils/elementDocs'
import { firstSentence } from '../utils/reportMarkdown'

const UButton = resolveComponent('UButton')
const BlrActorTypeComponent = resolveComponent('BlrActorType')
const BlrInterfaceTypeComponent = resolveComponent('BlrInterfaceType')

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null }>()

/* ------------------------------------------------------------------ */
/* Selection: `activeKind` is what the collection view is about, and */
/* `openElement` is the page you are on.                               */
/* ------------------------------------------------------------------ */

/*
  A Scenario is the only element with a mandatory single parent, so it is read
  from that Capability or Journey's page rather than exposed as another
  collection in the rail or as a peer tab on the parent's main screen.
*/
const PARENT_OF: Partial<Record<ReportElementKind, ReportElementKind>> = {
  'capability-scenario': 'capability',
  'journey-scenario': 'journey'
}

type ViewMode = 'cards' | 'table'
type ReportSection = 'overview' | 'topology' | ReportElementKind

/**
 * The open section, bindable by the host so it can live in the URL.
 *
 * `activeKind` stays internal: it is what the working view is *about*, which
 * for the overview is the Product rather than the section name.
 */
const section = defineModel<string>('section', { default: 'overview' })

/**
 * The element whose page is open, or `null` for the section's own surface.
 *
 * Bindable for the same reason `section` is, and the reason pages exist at all:
 * a page a reader can reach but not link to, return to, or refresh is a modal
 * with extra steps.
 */
const openElement = defineModel<string | null>('element', { default: null })
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const activeKind = ref<ReportElementKind>('product')
const activeSection = ref<ReportSection>('overview')

const KNOWN_SECTIONS = new Set<string>(['overview', 'topology', ...REPORT_ENTITY_KINDS.map(meta => meta.kind)])

/* Two-way, but never fighting: each side only writes when the value differs. */
watch(section, (value) => {
  if (value === activeSection.value) return
  const next = (KNOWN_SECTIONS.has(value) ? value : 'overview') as ReportSection
  activeSection.value = next
  activeKind.value = next === 'overview' || next === 'topology' ? 'product' : next
}, { immediate: true })

watch(activeSection, (value) => {
  if (section.value !== value) section.value = value
})
/* One element's neighbourhood, drawn on the topology canvas rather than in a
   page that cannot give the graph the full report width. */
const topologyFocus = ref<string | null>(null)
const searchOpen = ref(false)
const mobileNavOpen = ref(false)
/* The internal name for the open page is the bindable model itself, so a page
   opened by a click and a page opened by a URL are the same state. */
const openPageKey = openElement
const filterOpen = ref(false)

/* Toolbar state is kept per kind: moving to another kind and back returns to
   the shape you left, which is the point of a persistent working view. */
const viewModes = reactive<Partial<Record<ReportElementKind, ViewMode>>>({})
/* `null` is an explicit "no grouping"; absent means the default has not been
   overridden. Without the distinction, turning grouping off would immediately
   turn it back on. */
const groupKinds = reactive<Partial<Record<ReportElementKind, ReportElementKind | null>>>({})
const facetState = reactive<Partial<Record<ReportElementKind, FacetSelections>>>({})

/*
  Each collection opens grouped by the containment the format declares for it —
  the Interface → Experience → Screen hierarchy for Screens and Experiences, the behavior hierarchy for Scenarios,
  the subject axis for Capabilities and Rules. This is where the hierarchy a
  tree rail was asked to show actually belongs: over instances, where the model
  has it, and one click from being dismissed.

  Roots (Actors, Interfaces, Domains, Journeys) are contained by nothing and
  open flat.
*/
const DEFAULT_GROUPING: Partial<Record<ReportElementKind, ReportElementKind>> = {
  experience: 'interface',
  screen: 'interface',
  capability: 'domain',
  'capability-scenario': 'capability',
  'journey-scenario': 'journey',
  rule: 'domain'
}

const activeMeta = computed(() => ENTITY_KIND_META[activeKind.value])

/*
 * Keyed by ReportElementKind, not string: a hand-maintained map typed loosely is
 * exactly where a newly added kind goes missing, and the rail then renders a row
 * with a blank count instead of failing the build.
 */
const kindCounts = computed<Record<ReportElementKind, number>>(() => ({
  product: 1,
  actor: props.workspace.counts.actors,
  interface: props.workspace.counts.interfaces,
  experience: props.workspace.counts.experiences,
  screen: props.workspace.counts.screens,
  domain: props.workspace.counts.domains,
  object: props.workspace.counts.objects,
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

const groupKind = computed<ReportElementKind | undefined>({
  get: () => {
    const chosen = groupKinds[activeKind.value]
    if (chosen === null) return undefined
    if (chosen) return chosen
    /* A default only applies when the model actually holds that kind: grouping
       Capabilities by a Domain collection that is empty would file all ten
       under "No Domain". */
    const fallback = DEFAULT_GROUPING[activeKind.value]
    return fallback && elementsOfKind(props.workspace, fallback).length ? fallback : undefined
  },
  set: (value) => {
    groupKinds[activeKind.value] = value ?? null
  }
})

const facets = computed<FacetSelections>(() => facetState[activeKind.value] ?? {})
const filtersActive = computed(() => hasSelections(facets.value))

function facetValues(kind: ReportElementKind): string[] {
  return facets.value[kind] ?? []
}

function setFacet(kind: ReportElementKind, ids: string[]) {
  facetState[activeKind.value] = { ...facets.value, [kind]: ids }
}

function clearFacets() {
  facetState[activeKind.value] = {}
}

/** Only kinds this kind actually relates to, and only if the model has any. */
const facetKinds = computed(() => facetKindsFor(activeKind.value)
  .filter(kind => elementsOfKind(props.workspace, kind).length))

function facetOptions(kind: ReportElementKind) {
  return elementsOfKind(props.workspace, kind).map(element => ({ label: element.title, value: element.id }))
}

/*
  Chrome scales with the collection.

  Eight controls above four Journeys is not a filter offer, it is a wall. Below
  this many elements the eye is faster than any facet, so the control is not
  rendered at all rather than rendered disabled.
*/
const FILTER_THRESHOLD = 8

const filtersOffered = computed(() => facetKinds.value.length > 0
  && kindElements.value.length >= FILTER_THRESHOLD)

/** One chip per *active* facet, naming what it selected — never one per offer. */
const facetChips = computed(() => facetKinds.value
  .filter(kind => facetValues(kind).length)
  .map((kind) => {
    const ids = facetValues(kind)
    const meta = ENTITY_KIND_META[kind]
    const [first] = resolveElements(props.workspace, kind, ids)
    const rest = ids.length - 1
    return {
      kind,
      icon: meta.icon,
      actorKind: ids.length === 1 && first?.kind === 'actor' ? first.actorKind : undefined,
      actorRelationship: ids.length === 1 && first?.kind === 'actor' ? first.relationship : undefined,
      interfaceType: ids.length === 1 && first?.kind === 'interface' ? first.interfaceType : undefined,
      label: ids.length === 1 ? meta.label : meta.plural,
      value: `${first?.title ?? ids[0]}${rest > 0 ? ` +${rest}` : ''}`
    }
  }))

const activeFacetCount = computed(() => facetChips.value.length)

const VIEW_MODE_TABS = [
  { value: 'cards', label: 'Cards', icon: 'i-lucide-layout-grid' },
  { value: 'table', label: 'Table', icon: 'i-lucide-table' }
]

const kindElements = computed<AnyElementView[]>(() => elementsOfKind(props.workspace, activeKind.value))

/** What every surface shows: the cards, the table, the counts in the bar. */
const visibleElements = computed(() => filterElements(kindElements.value, facets.value))

const groupOptions = computed(() => facetKinds.value
  .map(kind => ({ label: ENTITY_KIND_META[kind].plural, value: kind })))

/*
  An element relating to several group owners appears under each of them, because
  the model says it belongs to all and dropping it from any but the first would
  be a quiet edit. The visible consequence is group counts that sum past the
  collection count, so the surface says why once rather than leaving a reader to
  wonder whether it is double counting.
*/
const multiGroupCount = computed(() => {
  if (!groupKind.value) return 0
  const memberships = new Map<string, number>()
  for (const group of elementGroups.value) {
    for (const element of group.elements) memberships.set(element.key, (memberships.get(element.key) ?? 0) + 1)
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

const elementGroups = computed(() => {
  const by = groupKind.value
  /* The bucket is named after what is missing, so it reads as a model fact:
     "No Domain", not the generic "Unassigned". */
  return groupElements(props.workspace, visibleElements.value, by ?? null,
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
const openPage = computed<AnyElementView | null>(() => openPageKey.value
  ? resolveElementKey(props.workspace, openPageKey.value) ?? null
  : null)

/**
 * The trail above an open page.
 *
 * A Scenario has exactly one parent, and the collection it belongs to is that
 * parent's — so `Capability Scenarios › Create an owned collection` names a
 * collection the reader never chose and drops the Capability they came from.
 * The trail walks the containment instead: collection, parent, element.
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
  const element = openPage.value
  if (!element) return []

  const parentKind = PARENT_OF[element.kind]
  const parent = parentKind && isScenarioKind(element.kind)
    ? resolveElement(props.workspace, parentKind, (element as ScenarioView).scenarioType === 'capability'
        ? (element as ScenarioView).capabilityId
        : (element as ScenarioView).journeyId)
    : undefined

  /* The collection is the parent's when there is one: you reached this Scenario
     through Capabilities, not through a collection of every Scenario. */
  const collectionKind = parent ? parent.kind : element.kind
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
      go: () => openElementPage(parent)
    })
  }

  steps.push({ key: element.key, label: element.title, title: element.title })
  return steps
})

/* A page brings its own section with it, so a link lands with the rail, the
   breadcrumb and the surface behind it already agreeing. */
watch([openElement, () => props.workspace], () => {
  const key = openElement.value
  if (!key) return
  const element = resolveElementKey(props.workspace, key)
  if (!element) {
    openElement.value = null
    return
  }
  const sectionKind = PARENT_OF[element.kind] ?? element.kind
  activeKind.value = sectionKind
  activeSection.value = sectionKind
}, { immediate: true })

/* Live recompiles replace the projection. Rehydrate selection by stable key so
   focus, filters, and the open page survive ordinary model edits. */
watch(() => props.workspace, (workspace) => {
  if (openElement.value && !workspace.byKey.has(openElement.value)) openElement.value = null
  if (topologyFocus.value && !workspace.byKey.has(topologyFocus.value)) topologyFocus.value = null
})

const topologyActive = computed(() => activeSection.value === 'topology')
const showToolbar = computed(() => activeKind.value !== 'product' && !openPage.value && !topologyActive.value)
const collectionDocs = computed(() => docsForElementKind(activeKind.value))

function setKind(kind: ReportElementKind) {
  mobileNavOpen.value = false
  activeKind.value = kind
  activeSection.value = kind === 'product' ? 'overview' : kind
  openElement.value = null
}

function openTopology() {
  mobileNavOpen.value = false
  activeSection.value = 'topology'
  openElement.value = null
  topologyFocus.value = null
}

/** Resolve a key from an overview projection and open its page. */
function openElementKey(key: string) {
  const element = resolveElementKey(props.workspace, key)
  if (element) openElementPage(element)
}

/** The page: a place, with a URL, that the browser's back button can leave. */
function openElementPage(element: AnyElementView) {
  mobileNavOpen.value = false
  const parentKind = PARENT_OF[element.kind]
  const sectionKind = parentKind ?? element.kind
  activeKind.value = sectionKind
  activeSection.value = sectionKind
  openElement.value = element.key
}

/** One element's neighbourhood, on the canvas that can actually draw it. */
function focusTopology(element: AnyElementView) {
  activeSection.value = 'topology'
  openElement.value = null
  topologyFocus.value = element.key
}

/** ⌘K lands on the element's page — you named it, so you meant it. */
function onSearchSelect(element: AnyElementView) {
  openElementPage(element)
}

/* ------------------------------------------------------------------ */
/* Tables: one column set per kind, built from the same three helpers   */
/* ------------------------------------------------------------------ */

const titlesOf = (kind: ReportElementKind, ids: string[]) =>
  resolveElements(props.workspace, kind, ids).map(element => element.title).join(', ')

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

function resolvedInterfaceType(kind: ReportElementKind | null, id: string) {
  if (kind !== 'interface' || !id) return undefined
  const element = resolveElement(props.workspace, 'interface', id)
  return element?.kind === 'interface' ? element.interfaceType : undefined
}

function resolvedActor(kind: ReportElementKind | null, id: string) {
  if (kind !== 'actor' || !id) return undefined
  const element = resolveElement(props.workspace, 'actor', id)
  return element?.kind === 'actor' ? element : undefined
}

function titleColumn(kind: ReportElementKind): TableColumn<AnyElementView> {
  return {
    accessorKey: 'title',
    header: sortableHeader(ENTITY_KIND_META[kind].label),
    cell: ({ row }) => {
      const marker = row.original.kind === 'interface'
        ? h(BlrInterfaceTypeComponent, { type: row.original.interfaceType })
        : row.original.kind === 'actor'
          ? h(BlrActorTypeComponent, {
              actorKind: row.original.actorKind,
              relationship: row.original.relationship,
              size: 'xs'
            })
          : null
      return h('div', { class: 'flex min-w-0 max-w-72 items-start gap-2' }, [
        marker,
        h('span', { class: 'min-w-0' }, [
          h('span', { class: 'block truncate font-medium text-highlighted' }, row.original.title),
          h('span', { class: 'block truncate text-xs text-muted' }, firstSentence(row.original.lead, 90))
        ])
      ])
    }
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
  kind: ReportElementKind,
  label: string,
  read: (element: AnyElementView) => string
): TableColumn<AnyElementView> {
  return {
    id: kind,
    accessorFn: (element: AnyElementView) => resolveElement(props.workspace, kind, read(element))?.title ?? '',
    header: sortableHeader(label),
    cell: ({ row }) => {
      const element = resolveElement(props.workspace, kind, read(row.original))
      const marker = element?.kind === 'interface'
        ? h(BlrInterfaceTypeComponent, { type: element.interfaceType, size: 'xs' })
        : h(resolveComponent('UIcon'), { name: ENTITY_KIND_META[kind].icon, class: 'size-3.5 shrink-0 text-dimmed' })
      return h('span', { class: 'inline-flex items-center gap-1.5 text-sm text-default' }, [
        marker,
        h('span', { class: 'truncate' }, element?.title ?? '—')
      ])
    }
  }
}

/** A derived relation count, with the names behind it on hover. */
function relationColumn(kind: ReportElementKind, label?: string): TableColumn<AnyElementView> {
  return {
    id: kind,
    accessorFn: (element: AnyElementView) => relatedIds(element, kind).length,
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
  kind: ReportElementKind,
  read: (element: AnyElementView) => string[]
): TableColumn<AnyElementView> {
  return {
    id,
    accessorFn: (element: AnyElementView) => read(element).length,
    header: sortableHeader(label),
    cell: ({ row }) => countCell(read(row.original).length, titlesOf(kind, read(row.original)))
  }
}

function textColumn(id: string, label: string, read: (element: AnyElementView) => string): TableColumn<AnyElementView> {
  return {
    id,
    accessorFn: (element: AnyElementView) => read(element),
    header: sortableHeader(label),
    cell: ({ row }) => h('span', { class: 'text-sm text-default' }, read(row.original) || '—')
  }
}

function numberColumn(id: string, label: string, read: (element: AnyElementView) => number): TableColumn<AnyElementView> {
  return {
    id,
    accessorFn: (element: AnyElementView) => read(element),
    header: sortableHeader(label),
    cell: ({ row }) => countCell(read(row.original), '')
  }
}

function contextLabel(context: ContextView): string {
  return [context.interfaceTitle, context.experienceTitle, context.screenTitle].filter(Boolean).join(' › ')
}

/** Context is a structured place rather than an id list, so it gets its own. */
function contextColumn(): TableColumn<AnyElementView> {
  const read = (element: AnyElementView): ContextView[] =>
    'contexts' in element ? (element as { contexts: ContextView[] }).contexts : []
  return {
    id: 'contexts',
    accessorFn: (element: AnyElementView) => read(element).length,
    header: sortableHeader('Contexts'),
    cell: ({ row }) => countCell(read(row.original).length, read(row.original).map(contextLabel).join(', '))
  }
}

const tableColumns = computed<TableColumn<AnyElementView>[]>(() => {
  const base = [titleColumn(activeKind.value)]
  switch (activeKind.value) {
    case 'actor':
      return [
        ...base,
        textColumn('actorKind', 'Kind', element => (element as ActorView).actorKind),
        textColumn('relationship', 'Relationship', element => (element as ActorView).relationship),
        relationColumn('interface'),
        relationColumn('experience'),
        relationColumn('journey')
      ]
    case 'interface':
      return [
        ...base,
        textColumn('interfaceType', 'Type', element =>
          INTERFACE_TYPE_META[(element as InterfaceView).interfaceType].label),
        relationColumn('actor'),
        relationColumn('experience'),
        relationColumn('capability'),
        relationColumn('screen'),
        relationColumn('journey'),
        numberColumn('entryPoints', 'Entry points', element => (element as InterfaceView).entryPoints.length)
      ]
    case 'experience':
      return [
        ...base,
        textColumn('access', 'Access', element => (element as ExperienceView).accessMode),
        relationColumn('actor'),
        relationTitleColumn('interface', 'Interface', element => (element as ExperienceView).interfaceIds[0] ?? ''),
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
          element => (element as ScreenView).scenarioJourneyIds),
        relationIdsColumn('capabilityJourneys', 'Journeys via capabilities', 'journey',
          element => (element as ScreenView).capabilityJourneyIds),
        numberColumn('states', 'States', element => (element as ScreenView).states.length),
        numberColumn('actions', 'Actions', element => (element as ScreenView).actions.length)
      ]
    case 'object':
      return [...base, relationColumn('domain')]
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
        textColumn('domain', 'Domain', (element) => {
          const id = (element as CapabilityView).domainId
          return id ? resolveElement(props.workspace, 'domain', id)?.title ?? id : ''
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
        numberColumn('steps', 'Steps', element => (element as JourneyView).stepCount)
      ]
    case 'capability-scenario':
      return [
        ...base,
        textColumn('scenarioKind', 'Kind', element => (element as ScenarioView).kindName),
        relationTitleColumn('capability', 'Capability', element => (element as ScenarioView).capabilityId),
        relationColumn('actor'),
        contextColumn(),
        numberColumn('steps', 'Steps', element => (element as ScenarioView).steps.length),
        numberColumn('decisions', 'Decisions', element => (element as ScenarioView).decisionPoints.length),
        relationColumn('screen'),
        relationColumn('rule')
      ]
    case 'journey-scenario':
      return [
        ...base,
        textColumn('scenarioKind', 'Kind', element => (element as ScenarioView).kindName),
        /* `kind` classifies the variation; `result` records how it ended. Orthogonal, so both. */
        textColumn('result', 'Result', element => (element as ScenarioView).result),
        relationTitleColumn('journey', 'Journey', element => (element as ScenarioView).journeyId),
        relationColumn('actor'),
        numberColumn('steps', 'Steps', element => (element as ScenarioView).steps.length),
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
const visibleColumns = computed<TableColumn<AnyElementView>[]>(() => {
  const rows = visibleElements.value
  if (rows.length < 2) return tableColumns.value
  return tableColumns.value.filter((column, index) => {
    /* The title column identifies the row; it is never furniture. */
    if (index === 0) return true
    const read = (column as { accessorFn?: (row: AnyElementView, index: number) => unknown }).accessorFn
    if (!read) return true
    const first = read(rows[0]!, 0)
    return rows.some((row, position) => read(row, position) !== first)
  })
})

/** Notes explaining a column the rule above removed would describe nothing. */
const visibleColumnIds = computed(() => new Set(visibleColumns.value.map(column => column.id
  ?? (column as { accessorKey?: string }).accessorKey)))

/** Each note names the columns it explains, so a pruned table drops it too. */
const TABLE_NOTE: Partial<Record<ReportElementKind, { text: string, needs: string[] }>> = {
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
    text: 'Each is one observable acceptance case for exactly one Capability. Contexts show where that case is accepted.',
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
    && !resolveElement(props.workspace, 'journey', scenario.journeyId)))

/* The status bar badge and `BlrOverview` read coverage in the same tone. */
const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}
</script>

<template>
  <div class="blr-report-shell flex h-full min-h-0 flex-col text-sm">
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
      <img v-if="logoSrc" :src="logoSrc" alt="" class="hidden size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5 lg:block">
      <UIcon v-else name="i-lucide-package" class="hidden size-5 shrink-0 text-primary lg:block" />
      <button
        type="button"
        class="hidden min-w-0 max-w-48 truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary lg:block"
        title="Open the Overview"
        @click="setKind('product')"
      >
        {{ workspace.identity.title }}
      </button>

      <!-- Where you are: the working view names itself here, not above itself. -->
      <UIcon name="i-lucide-chevron-right" class="hidden size-3.5 shrink-0 text-dimmed lg:block" />
      <!-- A page states the whole path it sits on, and every step but the last
           is a link. A Scenario without its parent in the trail is the one
           thing a breadcrumb exists to prevent. -->
      <nav
        data-mobile-location
        class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden sm:hidden"
        aria-label="Page breadcrumb"
      >
        <template v-if="openPage">
          <template v-for="(step, index) in pageTrail" :key="`mobile-${step.key}`">
            <UIcon
              v-if="index"
              name="i-lucide-chevron-right"
              class="size-3.5 shrink-0 text-dimmed"
            />
            <UTooltip v-if="step.go" :text="step.label">
              <button
                type="button"
                class="inline-flex min-w-0 max-w-32 items-center gap-1.5 hover:underline hover:underline-offset-4"
                :class="step.collection ? 'blr-eyebrow' : 'text-sm text-muted'"
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
            </UTooltip>
            <UTooltip v-else :text="step.label">
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-highlighted">
                {{ step.label }}
              </span>
            </UTooltip>
          </template>
        </template>
        <span
          v-else-if="topologyActive"
          class="blr-eyebrow inline-flex min-w-0 items-center gap-1.5"
          data-mobile-section
        >
          <UIcon name="i-lucide-waypoints" class="size-3.5 shrink-0" style="color: var(--blr-slot-9)" />
          <span class="truncate">Topology</span>
        </span>
        <template v-else>
          <span class="blr-eyebrow inline-flex min-w-0 items-center gap-1.5" data-mobile-section>
            <UIcon
              :name="activeMeta.icon"
              class="size-3.5 shrink-0"
              :style="{ color: `var(--blr-slot-${activeMeta.slot})` }"
            />
            <span class="truncate">{{ activeKind === 'product' ? 'Overview' : activeMeta.plural }}</span>
          </span>
          <span v-if="activeKind !== 'product'" class="blr-meta shrink-0">
            {{ visibleElements.length }}<template v-if="visibleElements.length !== kindElements.length"> / {{ kindElements.length }}</template>
          </span>
        </template>
      </nav>
      <template v-if="openPage">
        <template v-for="(step, index) in pageTrail" :key="step.key">
          <UIcon
            v-if="index"
            name="i-lucide-chevron-right"
            class="hidden size-3.5 shrink-0 text-dimmed sm:block"
          />
          <UTooltip v-if="step.go" :text="step.label">
            <button
              type="button"
              class="hidden shrink-0 items-center gap-1.5 hover:underline hover:underline-offset-4 sm:inline-flex"
              :class="step.collection ? 'blr-eyebrow' : 'min-w-0 max-w-40 truncate text-sm text-muted'"
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
          </UTooltip>
          <UTooltip v-else :text="step.label">
            <span class="hidden min-w-0 truncate text-sm font-medium text-highlighted sm:inline">
              {{ step.label }}
            </span>
          </UTooltip>
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
          {{ visibleElements.length }}<template v-if="visibleElements.length !== kindElements.length"> / {{ kindElements.length }}</template>
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
        <!-- Collection controls belong to the list reading, so they scroll
             away with its cards or table. Topology remains a bounded canvas. -->
        <div v-if="!topologyActive" class="blr-pane min-h-0 flex-1">
          <!-- Toolbar: what is shown on the left, how it is shown on the right. -->
          <div
            v-if="showToolbar"
            class="flex items-center gap-2 px-4 py-2"
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
              <BlrKind
                :kind="chip.kind"
                :interface-type="chip.interfaceType"
                :actor-kind="chip.actorKind"
                :actor-relationship="chip.actorRelationship"
                :labelled="false"
                size="xs"
              />
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
            <UTooltip :text="collectionDocs.label">
              <UButton
                :to="collectionDocs.url"
                external
                target="_blank"
                rel="noopener noreferrer"
                icon="i-lucide-book-open"
                color="neutral"
                variant="outline"
                size="xs"
                label="Docs"
                class="hidden sm:inline-flex"
                :aria-label="collectionDocs.label"
              />
            </UTooltip>
            <UTooltip :text="collectionDocs.label" class="sm:hidden">
              <UButton
                :to="collectionDocs.url"
                external
                target="_blank"
                rel="noopener noreferrer"
                icon="i-lucide-book-open"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="collectionDocs.label"
              />
            </UTooltip>
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

          <div class="p-5">
          <!-- OVERVIEW: the Product, and what it promises -->
          <BlrOverview
            v-if="activeKind === 'product'"
            :workspace="workspace"
            :logo-src="logoSrc"
            @select="openElementPage"
            @select-key="openElementKey"
          >
            <template v-if="$slots['primary-action']" #primary-action>
              <slot name="primary-action" />
            </template>
            <template v-if="$slots.provenance" #provenance>
              <slot name="provenance" />
            </template>
          </BlrOverview>

          <!-- ENTITY PAGE: one element in full, at its own URL. -->
          <BlrElementPage
            v-else-if="openPage"
            v-model:scenario-route="scenarioRoute"
            v-model:route-columns="routeColumns"
            :workspace="workspace"
            :element="openPage"
            @open="openElementPage"
            @focus="focusTopology"
          />

          <!-- ENTITY SURFACE: one named subject, with card and table lenses. -->
          <div v-else :class="groupKind ? 'space-y-3' : 'space-y-6'">
            <p v-if="multiGroupNote" class="text-xs text-dimmed">{{ multiGroupNote }}</p>
            <UCollapsible
              v-for="group in elementGroups"
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
                  <BlrKind
                    v-if="group.kind"
                    :kind="group.kind"
                    :interface-type="resolvedInterfaceType(group.kind, group.key)"
                    :actor-kind="resolvedActor(group.kind, group.key)?.actorKind"
                    :actor-relationship="resolvedActor(group.kind, group.key)?.relationship"
                    :labelled="false"
                    size="sm"
                  />
                  <UIcon v-else name="i-lucide-minus" class="size-3.5 shrink-0 text-dimmed" />
                  <span
                    class="min-w-0 truncate text-sm font-semibold tracking-tight"
                    :class="group.kind ? 'text-highlighted' : 'text-muted'"
                  >
                    {{ group.title }}
                  </span>
                  <span class="blr-meta ms-auto">{{ group.elements.length }}</span>
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
                  :data="group.elements"
                  :columns="visibleColumns"
                  class="rounded-xl border border-default bg-default"
                  :ui="{ tr: 'cursor-pointer' }"
                  :on-select="(_event: Event, row: any) => openElementPage(row.original)"
                />

                <div v-else class="space-y-2">
                  <BlrElementCard
                    v-for="element in group.elements"
                    :key="element.key"
                    :workspace="workspace"
                    :element="element"
                    :badge="!groupKind || groupKind !== group.kind"
                    @open="openElementPage"
                  />
                </div>
              </template>
            </UCollapsible>

            <p v-if="viewMode === 'table' && tableNote" class="text-sm text-muted">
              {{ tableNote }}
            </p>

            <!-- A dead end names its own way out. -->
            <div v-if="!visibleElements.length" class="flex flex-wrap items-center gap-3">
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
                @click="openElementPage(scenario)"
              >
                {{ scenario.title }} — declares journey “{{ scenario.journeyId }}”.
              </button>
            </section>
          </div>
          </div>
        </div>

        <!-- Product-level breadth: all named topology views share one canvas. -->
        <div v-else class="min-h-0 flex-1">
          <BlrProductTopology
            :workspace="workspace"
            :focus="topologyFocus"
            @select="openElementPage"
          />
        </div>
      </section>

    </div>

    <BlrSearchPalette
      v-model:open="searchOpen"
      :workspace="workspace"
      @select="onSearchSelect"
    />

    <USlideover
      v-model:open="mobileNavOpen"
      side="left"
      :ui="{ content: 'w-64 max-w-[85vw]', body: 'p-2' }"
    >
      <template #header>
        <div class="blr-report-shell flex min-w-0 flex-1 items-center gap-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            alt=""
            class="size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5"
          >
          <UIcon v-else name="i-lucide-package" class="size-5 shrink-0 text-primary" />
          <button
            type="button"
            class="min-w-0 max-w-48 truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary"
            title="Open the Overview"
            @click="setKind('product')"
          >
            {{ workspace.identity.title }}
          </button>
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
        <div class="blr-report-shell min-h-full">
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
        </div>
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
.blr-report-shell {
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

:global(.dark) .blr-report-shell {
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
