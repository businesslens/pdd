<script setup lang="ts">
import { REPORT_DESTINATIONS, destinationForSection, destinationForLocation, collectionKindFor, resourceAncestors, resourceViewLinks } from '../utils/reportDestinations'
import { findProductTopologyView } from '../utils/productTopologyViews'
import { parentOf } from '../utils/pageSections'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import type {
  AnyResourceView,
  ReportResourceKind,
  ReportWorkspace
} from '../utils/reportWorkspace'
import {
  ENTITY_KIND_META,
  REPORT_ENTITY_KINDS,
  entityFacetOf,
  resolveResource,
  resolveResourceKey
} from '../utils/reportWorkspace'
import type { FacetSelections } from '../utils/resourceFacets'
import {
  resourcesOfKind,
  collectionGroups,
  facetKindsFor,
  filterResources,
  hasSelections
} from '../utils/resourceFacets'
import { docsForResourceKind } from '../utils/resourceDocs'
import { KIND_TERM } from '../utils/vocabulary'
import type { VocabularySlug } from '../utils/vocabulary.generated'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{ workspace: ReportWorkspace, logoSrc?: string | null, toolsTarget?: string }>()

/* ------------------------------------------------------------------ */
/* Selection: `activeKind` is what the collection view is about, and */
/* `openResource` is the page you are on.                               */
/* ------------------------------------------------------------------ */

type ReportSection = 'overview' | ReportResourceKind | typeof REPORT_DESTINATIONS[number]['section']

const section = defineModel<string>('section', { default: 'overview' })

const openResource = defineModel<string | null>('resource', { default: null })

const pageTab = defineModel<string>('tab', { default: 'overview' })
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const topology = defineModel<TopologyReading>('topology', { default: defaultTopologyReading })

const activeKind = ref<ReportResourceKind>('product')
const activeSection = ref<ReportSection>('overview')

const KNOWN_SECTIONS = new Set<string>(['overview', ...REPORT_DESTINATIONS.map(item => item.section), ...REPORT_ENTITY_KINDS.map(meta => meta.kind)])

/* Two-way, but never fighting: each side only writes when the value differs. */
watch(section, (value) => {
  if (value === activeSection.value) return
  const next = (KNOWN_SECTIONS.has(value) ? value : 'overview') as ReportSection
  activeSection.value = next
  activeKind.value = next === 'overview' ? 'product' : next as ReportResourceKind
}, { immediate: true })

watch(activeSection, (value) => {
  if (section.value !== value) section.value = value
})
/* One resource's neighbourhood, drawn on the topology canvas rather than in a
   page that cannot give the graph the full report width. */
const searchOpen = ref(false)

const vocabulary = useVocabularyPanel()
const mobileNavOpen = ref(false)
/* The internal name for the open page is the bindable model itself, so a page
   opened by a click and a page opened by a URL are the same state. */
const openPageKey = openResource
const filterOpen = ref(false)

/* Filter state is kept per kind: moving to another kind and back returns to
   the narrowing you left, which is the point of a persistent working view.
   Nothing else is kept, because nothing else is configurable — the reading and
   its grouping are decided by the report, not audition
   ed on every visit. */
const facetState = reactive<Partial<Record<ReportResourceKind, FacetSelections>>>({})
const closedGroups = ref<string[]>([])
const collectionStateReady = ref(false)
const collectionStorageKey = () => `blr:collections:${location.pathname}:${props.workspace.identity.id}`

function pruneFacets() {
  for (const kind of Object.keys(facetState) as ReportResourceKind[]) {
    for (const facet of Object.keys(facetState[kind] ?? {}) as ReportResourceKind[]) {
      const ids = facetState[kind]![facet] ?? []
      const valid = ids.filter(id => resolveResource(props.workspace, facet, id))
      if (ids.length !== valid.length) facetState[kind]![facet] = valid
    }
  }
}

function restoreCollectionState() {
  collectionStateReady.value = false
  for (const key of Object.keys(facetState)) delete (facetState as Record<string, unknown>)[key]
  closedGroups.value = []
  try {
    const saved = JSON.parse(sessionStorage.getItem(collectionStorageKey()) ?? 'null')
    if (saved) {
      for (const { kind } of REPORT_ENTITY_KINDS) {
        for (const facet of facetKindsFor(props.workspace, kind)) {
          const ids = saved.facets?.[kind]?.[facet]
          if (Array.isArray(ids)) {
            facetState[kind] ??= {}
            facetState[kind]![facet] = ids.filter((id: unknown): id is string => typeof id === 'string')
          }
        }
      }
      if (Array.isArray(saved.closed)) closedGroups.value = saved.closed.filter((id: unknown) => typeof id === 'string')
    }
  } catch { /* Collections remain usable when storage is unavailable. */ }
  pruneFacets()
  collectionStateReady.value = true
}

onMounted(restoreCollectionState)
watch(() => props.workspace.identity.id, () => { if (collectionStateReady.value) restoreCollectionState() })
watch(() => props.workspace, pruneFacets)
watch([facetState, closedGroups], () => {
  if (!collectionStateReady.value) return
  try { sessionStorage.setItem(collectionStorageKey(), JSON.stringify({ facets: facetState, closed: closedGroups.value })) } catch { /* Optional persistence. */ }
}, { deep: true })

const collectionGroupKey = (key: string) => `${activeKind.value}:${key}`
function setCollectionGroupOpen(key: string, open: boolean) {
  const id = collectionGroupKey(key)
  closedGroups.value = [...closedGroups.value.filter(item => item !== id), ...(!open ? [id] : [])]
}

const activeMeta = computed(() => ENTITY_KIND_META[activeKind.value])

const kindCounts = computed<Record<ReportResourceKind, number>>(() => ({
  product: 1,
  interface: props.workspace.counts.interfaces,
  experience: props.workspace.counts.experiences,
  screen: props.workspace.counts.screens,
  domain: props.workspace.counts.domains,
  entity: props.workspace.counts.entities,
  capability: props.workspace.counts.capabilities,
  journey: props.workspace.counts.journeys,
  'capability-scenario': props.workspace.counts.capabilityScenarios,
  'journey-scenario': props.workspace.counts.journeyScenarios,
  rule: props.workspace.counts.rules
}))

const facets = computed<FacetSelections>(() => facetState[activeKind.value] ?? {})
const filtersActive = computed(() => hasSelections(facets.value))

function facetValues(kind: ReportResourceKind): string[] {
  return facets.value[kind] ?? []
}

function setFacet(kind: ReportResourceKind, ids: string[]) {
  facetState[activeKind.value] = { ...facets.value, [kind]: ids }
}

function clearFacets() {
  facetState[activeKind.value] = {}
}

/** Only kinds this collection's own rows print, and only if the model has any. */
const facetKinds = computed(() => facetKindsFor(props.workspace, activeKind.value)
  .filter(kind => resourcesOfKind(props.workspace, kind).length))

function facetOptions(kind: ReportResourceKind) {
  return resourcesOfKind(props.workspace, kind).map(resource => ({ label: resource.title, value: resource.id }))
}

const FILTER_THRESHOLD = 8

const filtersOffered = computed(() => facetKinds.value.length > 0
  && kindResources.value.length >= FILTER_THRESHOLD)

/** One chip per *active* facet, naming what it selected — never one per offer. */
const facetChips = computed(() => facetKinds.value
  .filter(kind => facetValues(kind).length)
  .map((kind) => {
    const ids = facetValues(kind)
    const meta = ENTITY_KIND_META[kind]
    const [first] = resolveResources(props.workspace, kind, ids)
    const rest = ids.length - 1
    return {
      kind,
      icon: meta.icon,
      facet: ids.length === 1 ? entityFacetOf(first) : null,
      acts: ids.length === 1 && first?.kind === 'entity' ? first.acts ?? undefined : undefined,
      interfaceType: ids.length === 1 && first?.kind === 'interface' ? first.interfaceType : undefined,
      label: ids.length === 1 ? meta.label : meta.plural,
      value: `${first?.title ?? ids[0]}${rest > 0 ? ` +${rest}` : ''}`
    }
  }))

const activeFacetCount = computed(() => facetChips.value.length)

const kindResources = computed<AnyResourceView[]>(() => resourcesOfKind(props.workspace, activeKind.value))

/** What every surface shows: the rows, and the counts beside the heading. */
const visibleResources = computed(() => filterResources(kindResources.value, facets.value))

/* Grouping is a property of the collection, not a control on it. */
const resourceGroups = computed(() => collectionGroups(props.workspace, activeKind.value, visibleResources.value))
const grouped = computed(() => resourceGroups.value.some(group => group.kind))

const multiGroupCount = computed(() => {
  const memberships = new Map<string, number>()
  for (const group of resourceGroups.value) {
    for (const resource of group.resources) memberships.set(resource.key, (memberships.get(resource.key) ?? 0) + 1)
  }
  return [...memberships.values()].filter(count => count > 1).length
})

const multiGroupNote = computed(() => {
  const count = multiGroupCount.value
  if (!count) return ''
  const subject = count === 1 ? activeMeta.value.label : activeMeta.value.plural
  return `${count} ${subject} ${count === 1 ? 'relates' : 'relate'} to more than one `
    + `Domain and ${count === 1 ? 'appears' : 'appear'} under each.`
})

const openPage = computed<AnyResourceView | null>(() => openPageKey.value
  ? resolveResourceKey(props.workspace, openPageKey.value) ?? null
  : null)

interface TrailStep {
  key: string
  label: string
  title: string
  icon?: string
  slot?: number
  go: () => void
}

const pageTrail = computed<TrailStep[]>(() => {
  const resource = openPage.value
  if (!resource) return []

  const parents = resourceAncestors(props.workspace, resource)
  const collectionKind = collectionKindFor(resource.kind)
  const collectionMeta = ENTITY_KIND_META[collectionKind]

  /* The trail ends at the parent: the page names itself in its own H1, and a
     breadcrumb doing title duty is what made a Screen four levels deep read as
     three competing type treatments in one line. */
  return [
    {
      key: 'collection',
      label: collectionMeta.plural,
      title: `Back to ${collectionMeta.plural}`,
      icon: collectionMeta.icon,
      slot: collectionMeta.slot,
      go: () => setKind(collectionKind)
    },
    ...parents.map(parent => ({
      key: parent.key,
      label: parent.title,
      title: `Back to ${parent.title}`,
      go: () => openResourcePage(parent)
    }))
  ]
})

/* A page brings its own section with it, so a link lands with the rail, the
   breadcrumb and the surface behind it already agreeing. */
watch([openResource, () => props.workspace], () => {
  const key = openResource.value
  if (!key) return
  const resource = resolveResourceKey(props.workspace, key)
  if (!resource) {
    leavePage()
    return
  }
  const sectionKind = collectionKindFor(resource.kind)
  activeKind.value = sectionKind
  activeSection.value = sectionKind
}, { immediate: true })

/* Live recompiles replace the projection. Rehydrate selection by stable key so
   focus, filters, and the open page survive ordinary model edits. */
watch(() => props.workspace, (workspace) => {
  if (openResource.value && !workspace.byKey.has(openResource.value)) leavePage()
})

const destination = computed(() => destinationForLocation(activeSection.value, pageTab.value, openResource.value))
const topologyActive = computed(() => Boolean(destination.value))
const vocabularyContext = computed(() => {
  if (topologyActive.value) return 'product'
  if (openPage.value) return KIND_TERM[openPage.value.kind]
  return KIND_TERM[activeKind.value]
})
/* A Scenario is read inside its parent, so the page's subject is the parent. */
const pageSubject = computed(() => {
  const resource = openPage.value
  return resource ? parentOf(props.workspace, resource) ?? resource : null
})

/**
 * What this surface is, named once — the Product's page included.
 *
 * The heading names the surface the reader chose, never the report they are
 * already inside: clicking Entities heads the page `Entities`, so clicking
 * Overview heads it `Overview`. The Product's own name is the report's identity
 * and belongs to the chrome that carries it on every surface, with its logo;
 * printing it again here made the one page that should have looked like the
 * others the one page that did not.
 */
const surfaceHeading = computed(() => {
  const resource = openPage.value
  if (resource) {
    const meta = ENTITY_KIND_META[resource.kind]
    return { icon: meta.icon, slot: meta.slot, title: resource.title, meta: meta.label,
      term: KIND_TERM[resource.kind], termText: resource.title }
  }
  if (activeKind.value === 'product') {
    const meta = ENTITY_KIND_META.product
    return { icon: meta.icon, slot: meta.slot, title: 'Overview', meta: 'Product Report',
      term: KIND_TERM.product, termText: 'Product Report' }
  }
  const shown = visibleResources.value.length
  const all = kindResources.value.length
  return { icon: activeMeta.value.icon, slot: activeMeta.value.slot, title: activeMeta.value.plural,
    meta: shown === all ? String(all) : `${shown} / ${all}`,
    term: KIND_TERM[activeKind.value], termText: activeMeta.value.plural }
})

/* Ways out belong to the subject, not to whichever tab is open, so they sit on
   the heading row rather than inside the tab strip. */
const exits = computed(() => pageSubject.value ? resourceViewLinks(pageSubject.value, props.workspace) : [])
const surfaceDocs = computed(() => docsForResourceKind(pageSubject.value?.kind ?? activeKind.value))

/**
 * Every named view of a collection is a tab of it, and nothing else is.
 *
 * The Product's own readings are tabs too. They were four collapsed disclosures
 * stacked below the identity — a reader had to open each one to learn whether it
 * held anything, and the switch that did it was a fifth idiom nowhere else uses.
 */
const PRODUCT_TABS = [
  { id: 'about', label: 'About', hint: '' },
  { id: 'coverage', label: 'Coverage', hint: '' },
  { id: 'counts', label: 'Model counts', hint: '' },
  { id: 'references', label: 'References', hint: '' }
]

/* Compared as strings: no named view belongs to the Overview any more, so the
   rail union no longer includes it, and a collection that has none is normal. */
const surfaceViews = computed(() => REPORT_DESTINATIONS.filter(item => (item.rail as string) === activeSection.value))
const surfaceTabs = computed(() => openPage.value ? [] : [
  { id: 'overview', label: activeKind.value === 'product' ? 'Overview' : 'List', hint: '' },
  ...(activeKind.value === 'product' ? PRODUCT_TABS : []),
  ...surfaceViews.value.map(item => ({ id: item.mode, label: item.label, hint: findProductTopologyView(item.view).question }))
])
const activeSurfaceTab = computed(() => {
  if (destination.value) return destination.value.mode
  return surfaceTabs.value.some(tab => tab.id === pageTab.value) ? pageTab.value : 'overview'
})
const surfaceHint = computed(() => surfaceTabs.value.find(tab => tab.id === activeSurfaceTab.value)?.hint ?? '')

const showToolbar = computed(() => !openPage.value && activeKind.value !== 'product' && !topologyActive.value
  && (filtersOffered.value || facetChips.value.length > 0))
const pageReadingKey = computed(() => JSON.stringify([props.workspace.identity.id, activeSection.value, openPageKey.value, pageTab.value, topology.value.scenario, topology.value.expanded, topology.value.collapsed]))
const { element: resourcePane, save: savePageScroll, restore: restorePageScroll } = useBlrTopologyScroll(pageReadingKey)

/* Leaving a page, or opening one, is also leaving its tab: both change in one
   tick, so the host writes one history entry for the one gesture. */
function leavePage() {
  openResource.value = null
  pageTab.value = 'overview'
}

function setKind(kind: ReportResourceKind) {
  mobileNavOpen.value = false
  kind = collectionKindFor(kind)
  activeKind.value = kind
  activeSection.value = kind === 'product' ? 'overview' : kind
  leavePage()
}

function openView(sectionId: string, resource?: AnyResourceView) {
  const target = destinationForSection(sectionId)
  if (!target) return
  mobileNavOpen.value = false
  leavePage()
  topology.value = { ...topology.value, view: target.view, hiddenKinds: [], query: '', focus: resource ? [resource.key] : [], column: resource?.kind === 'entity' && target.view === 'what-changes-what' ? resource.key : null }
  /* Every named view now belongs to a resource collection, so its rail row is
     that collection: nothing routes back to the Overview. */
  activeSection.value = target.rail
  activeKind.value = target.rail
  pageTab.value = target.mode
}

/** Resolve a key from an overview projection and open its page. */
function openResourceKey(key: string) {
  const resource = resolveResourceKey(props.workspace, key)
  if (resource) openResourcePage(resource)
}

/** The page: a place, with a URL, that the browser's back button can leave. */
function openResourcePage(resource: AnyResourceView) {
  mobileNavOpen.value = false
  const sectionKind = collectionKindFor(resource.kind)
  activeKind.value = sectionKind
  activeSection.value = sectionKind
  openResource.value = resource.key
  pageTab.value = 'overview'
}

function openSurfaceTab(id: string) {
  const target = surfaceViews.value.find(item => item.mode === id)
  if (target) {
    openView(target.section)
    return
  }
  mobileNavOpen.value = false
  openResource.value = null
  pageTab.value = id
}

/** The Entity behind an Actors group header, for its silhouette. */
function resolvedGroupEntity(kind: ReportResourceKind | null, id: string) {
  if (kind !== 'entity' || !id) return undefined
  const resource = resolveResource(props.workspace, 'entity', id)
  return resource?.kind === 'entity' ? resource : undefined
}

/** ⌘K lands on the resource's page — you named it, so you meant it. */
function onSearchSelect(resource: AnyResourceView) {
  openResourcePage(resource)
}

/** Scenarios whose Journey is not in the model would otherwise be unreachable. */
const orphanScenarios = computed(() => props.workspace.scenarios
  .filter(scenario => scenario.scenarioType === 'journey'
    && !resolveResource(props.workspace, 'journey', scenario.journeyId)))
</script>

<template>
  <div class="blr-report-shell flex h-full min-h-0 flex-col text-sm">
    <!-- Status bar: the product, its coverage, and the way to anything. -->
    <header class="blr-report-header flex shrink-0 items-center gap-3 border-b border-default px-4 py-2.5">
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
      <UIcon v-else name="i-lucide-house" class="hidden size-5 shrink-0 text-primary lg:block" />
      <button
        type="button"
        class="hidden min-w-0 max-w-48 truncate text-sm font-semibold tracking-tight text-highlighted hover:text-primary lg:block"
        title="Open the Overview"
        @click="setKind('product')"
      >
        {{ workspace.identity.title }}
      </button>

      <!-- Where this sits. Only the path back: the surface names itself in its
           own heading, so the current page is never repeated here and every
           step reads in one type treatment. -->
      <UIcon v-if="pageTrail.length" name="i-lucide-chevron-right" class="hidden size-3.5 shrink-0 text-dimmed lg:block" />
      <nav
        v-if="pageTrail.length"
        data-page-trail
        class="flex min-w-0 flex-1 items-center gap-1"
        aria-label="Page breadcrumb"
      >
        <template v-for="(step, index) in pageTrail" :key="step.key">
          <UIcon
            v-if="index"
            name="i-lucide-chevron-right"
            class="size-3.5 shrink-0 text-dimmed"
          />
          <UTooltip :text="step.label">
            <button
              type="button"
              class="blr-breadcrumb-link inline-flex min-w-0 max-w-40 items-center gap-1.5 text-sm text-muted hover:text-default hover:underline hover:underline-offset-4"
              :aria-label="step.title"
              @click="step.go()"
            >
              <UIcon
                v-if="step.icon"
                :name="step.icon"
                class="blr-breadcrumb-type-icon size-3.5 shrink-0"
                :style="{ color: `var(--blr-slot-${step.slot})` }"
              />
              <span class="truncate">{{ step.label }}</span>
            </button>
          </UTooltip>
        </template>
      </nav>
      <span v-else class="min-w-0 flex-1" />

      <span class="ms-auto flex shrink-0 items-center gap-2.5">
        <Teleport :to="toolsTarget || 'body'" :disabled="!toolsTarget">
          <BlrReportTools
            :in-header="Boolean(toolsTarget)"
            @search="searchOpen = true"
            @vocabulary="vocabulary.show(undefined, $event)"
          />
        </Teleport>
        <span :class="openPage ? 'hidden xl:inline-flex' : 'hidden md:inline-flex'">
          <BlrCoverageBadge :status="workspace.coverage.status" named size="md" />
        </span>
        <span class="blr-meta" :class="openPage ? 'hidden xl:inline' : 'hidden sm:inline'">{{ workspace.identity.schemaVersion }}</span>
        <span class="blr-meta" :class="openPage ? 'hidden xl:inline' : 'hidden md:inline'">{{ workspace.identity.generatedAt.slice(0, 10) }}</span>
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
        <!-- What this is, and the ways out of it. An exit belongs to the
             subject, so it sits here and not inside the tab strip. -->
        <div v-if="surfaceHeading || exits.length" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pt-4 pb-2">
          <h1 v-if="surfaceHeading" class="flex min-w-0 items-center gap-2">
            <UIcon :name="surfaceHeading.icon" class="size-5 shrink-0" :style="{ color: `var(--blr-slot-${surfaceHeading.slot})` }" />
            <span class="truncate text-lg font-semibold tracking-tight text-highlighted">{{ surfaceHeading.title }}</span>
            <span class="blr-meta shrink-0">{{ surfaceHeading.meta }}</span>
            <BlrTerm v-if="surfaceHeading.term" :slug="surfaceHeading.term" :text="surfaceHeading.termText" icon-only />
          </h1>
          <div class="ms-auto flex shrink-0 flex-wrap items-center gap-1.5">
            <UButton
              v-for="link in exits"
              :key="link.section"
              :label="link.name"
              :icon="link.icon"
              color="neutral"
              variant="outline"
              size="xs"
              @click="openView(link.section, pageSubject ?? undefined)"
            />
            <UTooltip :text="surfaceDocs.label">
              <UButton
                :to="surfaceDocs.url"
                external
                target="_blank"
                rel="noopener noreferrer"
                icon="i-lucide-book-open"
                color="neutral"
                variant="outline"
                size="xs"
                label="Docs"
                :aria-label="surfaceDocs.label"
              />
            </UTooltip>
          </div>
        </div>

        <!-- Which set. Rendered only where there is more than one. -->
        <div v-if="surfaceTabs.length > 1" class="flex flex-wrap items-center gap-1 border-b border-default px-5" role="tablist" :aria-label="`${activeMeta.plural} readings`">
          <button
            v-for="tab in surfaceTabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="blr-surface-tab"
            :data-current="tab.id === activeSurfaceTab"
            :aria-selected="tab.id === activeSurfaceTab"
            @click="openSurfaceTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- What the open tab answers. The view no longer titles itself: the
             heading names the subject and the tab names the reading. -->
        <p v-if="surfaceHint" class="border-b border-default px-5 py-2 text-xs text-muted">{{ surfaceHint }}</p>
        <!-- Collection controls belong to the list reading, so they scroll
             away with its cards or table. Topology remains a bounded canvas. -->
        <div v-if="!topologyActive" ref="resourcePane" class="blr-pane min-h-0 flex-1" @scroll.capture.passive="savePageScroll">
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
                :facet="chip.facet"
                :acts="chip.acts"
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

          </div>

          <div class="p-5">
          <!-- OVERVIEW: the Product, and what it promises -->
          <BlrOverview
            v-if="activeKind === 'product'"
            :workspace="workspace"
            :tab="activeSurfaceTab"
            @select="openResourcePage"
            @select-key="openResourceKey"
          >
            <template v-if="$slots['primary-action']" #primary-action>
              <slot name="primary-action" />
            </template>
            <template v-if="$slots.provenance" #provenance>
              <slot name="provenance" />
            </template>
          </BlrOverview>

          <!-- ENTITY PAGE: one resource in full, at its own URL. -->
          <BlrResourcePage
            v-else-if="openPage"
            v-model:tab="pageTab"
            v-model:scenario-route="scenarioRoute"
            v-model:route-columns="routeColumns"
            v-model:reading="topology"
            :workspace="workspace"
            :resource="openPage"
            @open="openResourcePage"
            @ready="restorePageScroll"
          />



          <!-- COLLECTION SURFACE: one named subject, one row shape. -->
          <div v-else :class="grouped ? 'space-y-3' : 'space-y-6'">
            <p v-if="multiGroupNote" class="text-xs text-dimmed">{{ multiGroupNote }}</p>
            <UCollapsible
              v-for="group in resourceGroups"
              :key="group.key || 'all'"
              :open="!grouped || !closedGroups.includes(collectionGroupKey(group.key))"
              @update:open="setCollectionGroupOpen(group.key, $event)"
              :disabled="!grouped"
              :class="grouped && 'overflow-hidden rounded-xl border border-default bg-elevated/20'"
              :ui="{ content: grouped ? 'border-t border-muted p-2' : '' }"
            >
              <template v-if="grouped" #default="{ open }">
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
                    :facet="entityFacetOf(resolvedGroupEntity(group.kind, group.key))"
                    :acts="resolvedGroupEntity(group.kind, group.key)?.acts"
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
                  <span class="blr-meta ms-auto">{{ group.resources.length }}</span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-3.5 shrink-0 text-dimmed transition-transform"
                    :class="open && 'rotate-180'"
                  />
                </UButton>
              </template>

              <template #content>
                <div class="space-y-2">
                  <BlrResourceCard
                    v-for="resource in group.resources"
                    :key="resource.key"
                    :workspace="workspace"
                    :resource="resource"
                    :badge="group.kind !== 'domain'"
                    @open="openResourcePage"
                  />
                </div>
              </template>
            </UCollapsible>

            <!-- A dead end names its own way out. -->
            <div v-if="!visibleResources.length" class="flex flex-wrap items-center gap-3">
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
                @click="openResourcePage(scenario)"
              >
                {{ scenario.title }} — declares journey “{{ scenario.journeyId }}”.
              </button>
            </section>
          </div>
          </div>
        </div>

        <!-- Product-level breadth: each named topology view has a specific reading. -->
        <div v-else class="min-h-0 flex-1">
          <BlrProductTopology
            :workspace="workspace"
            v-model:reading="topology"
            @select="openResourcePage"
            @product="setKind('product')"
          />
        </div>
      </section>

    </div>

    <BlrSearchPalette
      v-model:open="searchOpen"
      :workspace="workspace"
      @select="onSearchSelect"
    />

    <BlrVocabulary :context="vocabularyContext" tooltips />

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
          <UIcon v-else name="i-lucide-house" class="size-5 shrink-0 text-primary" />
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
  The categorical slot variables use the shared theme so the kind colours read
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

/* Collection links keep the same casing as their collection heading. */
.blr-breadcrumb-link {
  text-transform: none;
}

@media (max-width: 359px) {
  .blr-report-header {
    gap: 0.25rem;
  }

  .blr-breadcrumb-type-icon {
    display: none;
  }
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
