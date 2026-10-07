<script setup lang="ts">
/**
 * Coverage records which of the repository's code the model accounts for. A
 * model tied to no code yet — every Blueprint, any model decided before its
 * code — has none, and says so plainly rather than drawing empty cards.
 */
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'
import { normalizeCoveragePath } from '../utils/coveragePaths'
import { coverageRecordsCode } from '../utils/coverageStatements'

const props = defineProps<{ workspace: ReportWorkspace }>()
const tiedToCode = computed(() => coverageRecordsCode(props.workspace.coverage))
const reading = defineModel<CoverageReading>('reading', { default: defaultCoverageReading })

/** A focused location is a deep link, not a panel: its statements are on the page. */
function selectPath(path: string | null) {
  reading.value = { path: path === null ? null : normalizeCoveragePath(path) }
}
</script>

<template>
  <section class="@container/coverage min-w-0 space-y-5 pb-4" aria-label="Coverage" data-product-coverage>
    <BlrCoverageSources v-if="tiedToCode" :workspace="workspace" :path="reading.path" @select-path="selectPath" />
    <div v-else class="min-w-0 space-y-2 rounded-xl border border-default bg-elevated/20 p-4 @xl/coverage:p-5" data-coverage-empty>
      <p class="text-sm font-medium text-highlighted">This model isn't tied to code yet.</p>
      <p class="text-sm text-muted">Coverage appears once a mapping records which code it accounts for.</p>
    </div>
  </section>
</template>
