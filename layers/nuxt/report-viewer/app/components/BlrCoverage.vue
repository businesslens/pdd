<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'
import { normalizeCoveragePath } from '../utils/coveragePaths'

defineProps<{ workspace: ReportWorkspace }>()
const reading = defineModel<CoverageReading>('reading', { default: defaultCoverageReading })

/** A focused location is a deep link, not a panel: its statements are on the page. */
function selectPath(path: string | null) {
  reading.value = { path: path === null ? null : normalizeCoveragePath(path) }
}
</script>

<template>
  <section class="@container/coverage min-w-0 space-y-5 pb-4" aria-label="Coverage" data-product-coverage>
    <BlrCoverageDetails :workspace="workspace" />
    <BlrCoverageSources :workspace="workspace" :path="reading.path" @select-path="selectPath" />
  </section>
</template>
