<script setup lang="ts">
/**
 * The authored description of the model's breadth, under the field names the
 * model uses. Method is one short line by format, so it is read, not disclosed.
 */
import type { ReportWorkspace } from '../utils/reportWorkspace'

defineProps<{ workspace: ReportWorkspace }>()
</script>

<template>
  <!-- Titled like the About reading's sections, so both Overview readings share one grammar. -->
  <div class="min-w-0 space-y-6" data-coverage-details>
    <section class="min-w-0 space-y-2" aria-label="Scope" data-coverage-field="scope">
      <h2 class="text-base font-semibold text-highlighted">Scope</h2>
      <BlrProse :text="workspace.coverage.scope" />
    </section>
    <section v-if="workspace.coverage.method" class="min-w-0 space-y-2" aria-label="Method" data-coverage-method>
      <h2 class="text-base font-semibold text-highlighted">Method</h2>
      <BlrProse :text="workspace.coverage.method" />
    </section>
  </div>
</template>
