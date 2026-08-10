<script setup lang="ts">
/**
 * The public entry point every host renders.
 *
 * Hosts differ in what surrounds a report, not in how a report reads: the
 * local CLI viewer wraps it in dev chrome, the catalog wraps it in site
 * navigation and a pull command. Those differences arrive as slots and a
 * bindable section, so the Workbench itself stays one implementation.
 */
import type { ProductReportV8 } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  report: ProductReportV8
  /** Host-resolved `.businesslens/logo.svg`; rendered in the product header. */
  logoSrc?: string | null
}>()

/**
 * The open section: `overview`, `topology`, or an entity kind such as
 * `capability`. Bindable so a host can keep it in the URL.
 */
const section = defineModel<string>('section', { default: 'overview' })

const workspace = computed(() => projectReportWorkspace(props.report))
</script>

<template>
  <article data-businesslens-report-viewer class="businesslens-report">
    <BlrWorkbench
      v-model:section="section"
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
