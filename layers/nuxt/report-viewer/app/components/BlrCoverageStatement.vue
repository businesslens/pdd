<script setup lang="ts">
import { COVERAGE_KIND_META, type CoverageStatement } from '../utils/coverageStatements'
import { normalizeCoveragePath } from '../utils/coveragePaths'

const props = withDefaults(defineProps<{
  statement: CoverageStatement
  /** The path this statement is being read under, shown as the current one. */
  here?: string | null
}>(), { here: null })

const elsewhere = computed(() => props.here
  ? props.statement.paths.filter(location => normalizeCoveragePath(location) !== normalizeCoveragePath(props.here!))
  : props.statement.paths)
</script>

<template>
  <div
    class="blr-coverage-statement min-w-0 space-y-1.5"
    :class="COVERAGE_KIND_META[statement.kind].tone"
    :data-coverage-statement="statement.kind"
  >
    <span class="blr-coverage-chip inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium">
      <UIcon :name="COVERAGE_KIND_META[statement.kind].icon" class="size-3.5 shrink-0" />
      {{ COVERAGE_KIND_META[statement.kind].singular }}
    </span>
    <BlrProse :text="statement.description" />
    <p v-if="elsewhere.length" class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span v-if="here" class="blr-field shrink-0">also recorded at</span>
      <span
        v-for="location in elsewhere"
        :key="location"
        class="rounded bg-elevated/60 px-1.5 py-0.5 font-mono text-xs break-all text-muted"
        data-coverage-statement-path
      >{{ location }}</span>
    </p>
  </div>
</template>

<style scoped>
.blr-coverage-chip {
  color: var(--coverage-accent);
  border-color: color-mix(in oklab, var(--coverage-accent) 30%, var(--ui-border));
  background-color: color-mix(in oklab, var(--coverage-accent) 8%, var(--ui-bg));
}
</style>
