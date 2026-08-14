<script setup lang="ts">
/**
 * The audition entry point: one report, five readings.
 *
 * `workbench` renders the shipped component itself rather than a copy of it, so
 * the thing being compared is the thing that ships. The other four are lab
 * components and never leave this layer.
 */
import type { ProductReportV9 } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/model'

const props = defineProps<{
  report: ProductReportV9
  logoSrc?: string | null
}>()

const section = defineModel<string>('section', { default: 'overview' })
const entity = defineModel<string | null>('entity', { default: null })

const { active } = useBusinessLensWorkbenchVariant()
const workspace = computed(() => projectReportWorkspace(props.report))
</script>

<template>
  <BusinessLensReportViewer
    v-if="active.id === 'workbench'"
    v-model:section="section"
    v-model:entity="entity"
    :report="report"
    :logo-src="logoSrc"
  />

  <article v-else data-businesslens-workbench-lab class="businesslens-report">
    <BlrLabAtlas
      v-if="active.id === 'atlas'"
      :workspace="workspace"
      :variant="active"
      :logo-src="logoSrc"
    />
    <BlrLabStoryline
      v-else-if="active.id === 'storyline'"
      :workspace="workspace"
      :variant="active"
      :logo-src="logoSrc"
    />
    <BlrLabLedger
      v-else-if="active.id === 'ledger'"
      :workspace="workspace"
      :variant="active"
      :logo-src="logoSrc"
    />
    <BlrLabColumns
      v-else-if="active.id === 'columns'"
      :workspace="workspace"
      :variant="active"
      :logo-src="logoSrc"
    />
  </article>
</template>
