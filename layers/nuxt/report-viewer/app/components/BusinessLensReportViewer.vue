<script setup lang="ts">
provide('businesslens:viewer', useId())
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
import type { ProductReportV13 } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  report: ProductReportV13
  /** Host-resolved `.businesslens/product/logo.svg`; rendered in the product header. */
  logoSrc?: string | null
  /** Mounted host-header element receiving the report's search and Vocabulary controls. */
  toolsTarget?: string
}>()

/**
 * The open section: `overview` or a main resource collection. Bindable so a
 * host can keep it in the URL.
 */
const section = defineModel<string>('section', { default: 'overview' })

/**
 * The resource whose page is open, by stable key, or `null` for the section's own
 * surface. Bindable for the same reason: a host that keeps both in the URL gets
 * deep links, a working back button, and a refresh that lands where it left.
 */
const resource = defineModel<string | null>('resource', { default: null })

/**
 * The open page's tab — `overview`, `scenarios`, or `lifecycle`. Bindable so a
 * host can keep it in the URL beside the page; `overview` is the default a
 * host leaves out.
 */
const tab = defineModel<string>('tab', { default: 'overview' })

/** First route in the visible Scenario route window. */
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })

/** `auto`, or the reader's preferred number of visible route columns. */
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const topology = defineModel<TopologyReading>('topology', { default: defaultTopologyReading })

const workspace = computed(() => projectReportWorkspace(props.report))

/*
  Render the canonical location on both server and client. Only the tab's own
  view is reconciled here: an address that names no destination this report has
  simply reads as the section's first tab, which is the honest landing for a
  link written against a report the reader no longer has.
*/
const location = computed(() => {
  const next = { section: section.value, resource: resource.value, tab: tab.value, topology: topology.value }
  const destination = destinationForLocation(next.section, next.tab, next.resource)
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
      :tab="location.tab"
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      :topology="location.topology"
      :workspace="workspace"
      :logo-src="logoSrc"
      :tools-target="toolsTarget"
      @update:section="section = $event"
      @update:resource="resource = $event"
      @update:tab="tab = $event"
      @update:topology="topology = $event"
    >
      <template v-if="$slots.navigation" #navigation>
        <slot name="navigation" />
      </template>
      <template v-if="$slots['primary-action']" #primary-action>
        <slot name="primary-action" />
      </template>
      <template v-if="$slots.provenance" #provenance>
        <slot name="provenance" />
      </template>
    </BlrReportShell>
  </article>
</template>
