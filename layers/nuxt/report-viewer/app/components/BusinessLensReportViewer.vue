<script setup lang="ts">
import type { ProductReportV8 } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'

const props = defineProps<{
  report: ProductReportV8
  /** Host-resolved `.businesslens/logo.svg`; rendered in the product header. */
  logoSrc?: string | null
}>()

const workspace = computed(() => projectReportWorkspace(props.report))
</script>

<template>
  <article data-businesslens-report-viewer class="businesslens-report">
    <BlrWorkbench :workspace="workspace" :logo-src="logoSrc" />
  </article>
</template>
