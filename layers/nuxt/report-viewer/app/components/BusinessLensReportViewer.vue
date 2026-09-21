<script setup lang="ts">
provide('businesslens:viewer', useId())
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'
import type { TopologyReading } from '../utils/topologyState'
import { defaultTopologyReading } from '../utils/topologyState'
import { destinationForLocation } from '../utils/reportDestinations'
/**
 * The public entry point every host renders.
 *
 * Hosts differ in what surrounds a report, not in how a report reads: the
 * local CLI viewer wraps it in dev chrome, the catalog wraps it in site
 * navigation and a pull command. Those differences arrive as slots and a
 * bindable section, so the Product Report stays one implementation.
 */
import type { ProductReportV16, RepositoryFileLoader } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'
import type { ReportProductCatalogLink, ReportProductLink } from '../utils/reportProducts'
import type { ReportChanges } from '../utils/reportChanges'

const props = withDefaults(defineProps<{
  report: ProductReportV16
  loadRepositoryFile?: RepositoryFileLoader
  /** Host-resolved `.businesslens/product/logo.svg`; used in the picker and Overview. */
  logoSrc?: string | null
  /** Other products available in this host; mark the current destination active. */
  products?: ReportProductLink[]
  /** Optional link below the product choices to the host's full catalog. */
  productCatalog?: ReportProductCatalogLink
  /** Set false when the host already provides Vocabulary in its header. */
  sidebarVocabulary?: boolean
  /** Mounted host-header element receiving the report's search and Vocabulary controls. */
  toolsTarget?: string
  /**
   * The host's comparison against an earlier state of this model, where it
   * keeps one. The local viewer does; the catalog does not, and passes nothing.
   */
  changes?: ReportChanges | null
  readingReport?: ProductReportV16 | null
  readingLabel?: string
  readingError?: string | null
}>(), { sidebarVocabulary: true })

const emit = defineEmits<{
  uncommitted: []
  /** The reader chose another baseline to compare against. */
  compare: [base: string, target: string]
  historySearch: [query: string]
  historyMore: []
}>()

/**
 * The open section: `overview` or a main resource collection. Bindable so a
 * host can keep it in the URL.
 */
const section = defineModel<string>('section', { default: 'overview' })

/**
 * The resource whose slideover is open, by stable key, or `null` for the section's own
 * surface. Bindable for the same reason: a host that keeps both in the URL gets
 * deep links, a working back button, and a refresh that lands where it left.
 */
const resource = defineModel<string | null>('resource', { default: null })
const resourceState = defineModel<string>('resourceState', { default: 'working' })
const readingWorkspace = computed(() => props.readingReport ? projectReportWorkspace(props.readingReport) : null)

/**
 * The underlying view's drawing or Product tab; independent of the resource.
 */
const tab = defineModel<string>('tab', { default: 'overview' })

/** The resource reading is independent of the underlying collection drawing. */
const resourceTab = defineModel<string>('resourceTab', { default: 'overview' })

/** First route in the visible Scenario route window. */
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })

/** `auto`, or the reader's preferred number of visible route columns. */
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const topology = defineModel<TopologyReading>('topology', { default: defaultTopologyReading })
const reviewPath = defineModel<string | null>('reviewPath', { default: null })
const reviewTab = defineModel<string>('reviewTab', { default: '' })
const coverage = defineModel<CoverageReading>('coverage', { default: defaultCoverageReading })

const workspace = computed(() => projectReportWorkspace(props.report))

/*
  Render the canonical location on both server and client. Only the tab's own
  view is reconciled here: an address that names no destination this report has
  simply reads as the section's first tab, which is the honest landing for a
  link written against a report the reader no longer has.
*/
const location = computed(() => {
  const next = { section: section.value, resource: resource.value, tab: tab.value, topology: topology.value }
  const destination = destinationForLocation(next.section, next.tab)
  return destination && next.topology.view !== destination.view ? { ...next, topology: { ...next.topology, view: destination.view } } : next
})
let mounted = false
function synchronizeLocation() {
  if (!mounted) return
  const next = location.value
  if (section.value !== next.section) section.value = next.section
  if (resource.value !== next.resource) resource.value = next.resource
  if (tab.value !== next.tab) tab.value = next.tab
  if (JSON.stringify(topology.value) !== JSON.stringify(next.topology)) topology.value = next.topology
}
watch(location, synchronizeLocation, { flush: 'post' })
onMounted(() => { mounted = true; synchronizeLocation() })
</script>

<template>
  <article data-businesslens-report-viewer class="businesslens-report">
    <BlrReportShell
      :section="location.section"
      :resource="location.resource"
      v-model:resource-state="resourceState"
      :reading-workspace="readingWorkspace"
      :reading-label="readingLabel"
      :reading-error="readingError"
      :tab="location.tab"
      v-model:coverage="coverage"
      v-model:review-path="reviewPath"
      v-model:review-tab="reviewTab"
      :load-repository-file="loadRepositoryFile"

      v-model:resource-tab="resourceTab"
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      :topology="location.topology"
      :workspace="workspace"
      :logo-src="logoSrc"
      :products="products"
      :product-catalog="productCatalog"
      :sidebar-vocabulary="sidebarVocabulary"
      :tools-target="toolsTarget"
      :changes="changes"
      @compare="(base, target) => emit('compare', base, target)"
      @uncommitted="emit('uncommitted')"
      @history-search="emit('historySearch', $event)"
      @history-more="emit('historyMore')"
      @update:section="section = $event"
      @update:resource="resource = $event"
      @update:tab="tab = $event"
      @update:topology="topology = $event"
    >
      <template v-if="$slots['sidebar-header']" #sidebar-header="{ collapsed }">
        <slot name="sidebar-header" :collapsed="collapsed" />
      </template>
      <template v-if="$slots['sidebar-footer']" #sidebar-footer="{ collapsed }">
        <slot name="sidebar-footer" :collapsed="collapsed" />
      </template>
      <template v-if="$slots.navigation" #navigation="{ collapsed }">
        <slot name="navigation" :collapsed="collapsed" />
      </template>
      <template v-if="$slots['primary-action']" #primary-action>
        <slot name="primary-action" />
      </template>
      <template v-if="$slots.provenance" #provenance>
        <slot name="provenance" />
      </template>
      <template v-if="$slots.status" #status>
        <slot name="status" />
      </template>
    </BlrReportShell>
  </article>
</template>
