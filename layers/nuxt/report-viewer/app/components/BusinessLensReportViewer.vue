<script setup lang="ts">
/**
 * The public entry point every host renders.
 *
 * Hosts differ in what surrounds a report, not in how a report reads: the
 * local CLI viewer wraps it in dev chrome, the catalog wraps it in site
 * navigation and a pull command. Those differences arrive as slots and a
 * bindable section, so the Workbench itself stays one implementation.
 */
import type { ProductReportV10 } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  report: ProductReportV10
  /** Host-resolved `.businesslens/product/logo.svg`; rendered in the product header. */
  logoSrc?: string | null
}>()

/**
 * The open section: `overview`, `topology`, or an entity kind such as
 * `capability`. Bindable so a host can keep it in the URL.
 */
const section = defineModel<string>('section', { default: 'overview' })

/**
 * The entity whose page is open, by stable key, or `null` for the section's own
 * surface. Bindable for the same reason: a host that keeps both in the URL gets
 * deep links, a working back button, and a refresh that lands where it left.
 */
const entity = defineModel<string | null>('entity', { default: null })

/** First route in the visible Scenario route window. */
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })

/** `auto`, or the reader's preferred number of visible route columns. */
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })

const workspace = computed(() => projectReportWorkspace(props.report))
</script>

<template>
  <article data-businesslens-report-viewer class="businesslens-report">
    <BlrWorkbench
      v-model:section="section"
      v-model:entity="entity"
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      :workspace="workspace"
      :logo-src="logoSrc"
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
    </BlrWorkbench>
  </article>
</template>
