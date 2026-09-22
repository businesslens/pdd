<script setup lang="ts">
/**
 * Recorded locations: every authored Coverage statement, written under the path
 * it names.
 *
 * The four category cards are the only category filter and count whole authored
 * statements, including those with no location. Search matches a statement by
 * its own words or by where it is recorded, so a reader who knows neither the
 * wording nor the folder can still find it.
 */
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { coverageStatementTree } from '../utils/coverageTree'
import { normalizeCoveragePath } from '../utils/coveragePaths'
import { repositoryTreeNodes } from '../utils/repositoryTree'
import {
  COVERAGE_KIND_META,
  COVERAGE_KIND_ORDER,
  coverageStatementMatches,
  coverageStatements,
  coverageStatementsAt,
  type CoverageStatementKind
} from '../utils/coverageStatements'

const props = defineProps<{ workspace: ReportWorkspace, path: string | null }>()
const emit = defineEmits<{ selectPath: [path: string] }>()

const filter = ref<CoverageStatementKind | null>(null)
const query = ref('')

const all = computed(() => coverageStatements(props.workspace.coverage))
const shown = computed(() => all.value
  .filter(statement => !filter.value || statement.kind === filter.value)
  .filter(statement => coverageStatementMatches(statement, query.value)))
const located = computed(() => shown.value.filter(statement => statement.paths.length))
const unlocated = computed(() => shown.value.filter(statement => !statement.paths.length))
const nodes = computed(() => coverageStatementTree(located.value))
const branches = computed(() => repositoryTreeNodes(nodes.value).filter(node => node.children.length).map(node => node.value))
const statementsAt = (path: string) => coverageStatementsAt(located.value, path)

// An explanation is disclosed by its own row, keyed apart from its folder so a
// path that is both a folder and a recorded location keeps the two separate.
const readingKey = (path: string) => `statements:${normalizeCoveragePath(path)}`
const readable = computed(() => [...new Set(located.value.flatMap(statement => statement.paths.map(readingKey)))])

// One expansion set over both axes, so Expand all and Collapse all cover each.
const keys = computed(() => {
  const everything = coverageStatementTree(all.value.filter(statement => statement.paths.length))
  return [
    ...repositoryTreeNodes(everything).filter(node => node.children.length).map(node => node.value),
    ...new Set(all.value.flatMap(statement => statement.paths.map(readingKey)))
  ]
})
// Folders open; an explanation waits to be asked for, so structure stays browsable.
const expansion = useBlrReferenceExpansion(
  computed(() => `coverage:${props.workspace.identity.id}:locations`),
  keys,
  branches
)
// A search reveals what it matched: a hidden explanation is not an answer.
const expanded = computed(() => query.value.trim()
  ? [...new Set([...expansion.value, ...readable.value])]
  : expansion.value)
function toggle(key: string) {
  expansion.value = expansion.value.includes(key)
    ? expansion.value.filter(value => value !== key)
    : [...expansion.value, key]
}
function expandAll(open: boolean) {
  expansion.value = open ? [...branches.value, ...readable.value] : []
}

// A focused path deep-links a location: its ancestors open and it is read.
watch(() => props.path, path => {
  if (!path) return
  const ancestors = repositoryTreeNodes(nodes.value)
    .filter(node => node.children.length && path.startsWith(`${node.value}/`))
    .map(node => node.value)
  const reading = readable.value.includes(readingKey(path)) ? [readingKey(path)] : []
  expansion.value = [...new Set([...expansion.value, ...ancestors, ...reading])]
}, { immediate: true })
</script>

<template>
  <section class="min-w-0 space-y-3" aria-label="Recorded locations" data-coverage-sources>
    <div class="flex flex-wrap items-baseline gap-x-2">
      <h2 class="text-base font-semibold text-highlighted">Recorded locations</h2>
      <span class="blr-meta">{{ all.length }} statements</span>
    </div>

    <div class="grid grid-cols-2 gap-2 @xl/coverage:grid-cols-4 @xl/coverage:gap-3" role="group" aria-label="Coverage categories">
      <button
        v-for="kind in COVERAGE_KIND_ORDER"
        :key="kind"
        type="button"
        class="blr-coverage-card flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current @xl/coverage:px-3"
        :class="COVERAGE_KIND_META[kind].tone"
        :aria-label="`${COVERAGE_KIND_META[kind].label}: ${workspace.coverage[kind].length}`"
        :aria-description="COVERAGE_KIND_META[kind].blurb"
        :aria-pressed="filter === kind"
        :title="`${COVERAGE_KIND_META[kind].blurb}. ${filter === kind ? 'Click to show every category.' : 'Click to show only these.'}`"
        :data-coverage-summary="kind"
        @click="filter = filter === kind ? null : kind"
      >
        <span class="flex w-full items-center gap-2">
          <span class="text-xl font-semibold tabular-nums" data-coverage-summary-count>{{ workspace.coverage[kind].length }}</span>
          <span class="hidden text-sm font-medium @xl/coverage:inline">{{ COVERAGE_KIND_META[kind].label }}</span>
          <UIcon name="i-lucide-check" class="ms-auto size-4 shrink-0" :class="filter !== kind && 'invisible'" />
        </span>
        <span class="block text-xs font-medium @xl/coverage:hidden">{{ COVERAGE_KIND_META[kind].label }}</span>
        <span class="hidden text-xs text-muted @xl/coverage:block">{{ COVERAGE_KIND_META[kind].blurb }}</span>
      </button>
    </div>

    <div class="flex min-w-0 items-center gap-2 py-1" role="group" aria-label="Location controls">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Find a statement or a path…"
        aria-label="Find Coverage statements"
        size="sm"
        class="min-w-48 flex-1"
      />
      <UFieldGroup size="sm" class="shrink-0" data-expand-all>
        <UTooltip text="Expand all">
          <UButton icon="i-lucide-maximize-2" color="neutral" variant="outline" aria-label="Expand all" @click="expandAll(true)" />
        </UTooltip>
        <UTooltip text="Collapse all">
          <UButton icon="i-lucide-minimize-2" color="neutral" variant="outline" aria-label="Collapse all" @click="expandAll(false)" />
        </UTooltip>
      </UFieldGroup>
    </div>

    <div v-if="nodes.length" class="rounded-xl border border-default bg-elevated/20 px-3 py-2" data-repository-tree>
      <ul class="min-w-0">
        <BlrCoverageLocation
          v-for="node in nodes"
          :key="node.value"
          :node="node"
          :statements-at="statementsAt"
          :expanded="expanded"
          :focused="path"
          :depth="0"
          @toggle="toggle"
          @focus="emit('selectPath', $event)"
        />
      </ul>
    </div>
    <p v-else class="text-sm text-muted">
      {{ query ? 'No statements match this search.' : filter ? 'No recorded locations in this category.' : 'No repository paths recorded.' }}
    </p>

    <section v-if="unlocated.length" class="min-w-0 space-y-3 border-t border-default pt-4" aria-label="No location recorded">
      <h3 class="text-sm font-semibold text-highlighted">No location recorded <span class="blr-meta ms-1">{{ unlocated.length }}</span></h3>
      <ul class="space-y-4">
        <li v-for="(statement, index) in unlocated" :key="index" data-coverage-entry>
          <BlrCoverageStatement :statement="statement" />
        </li>
      </ul>
    </section>

    <p class="text-xs text-muted">
      A row shows only what is recorded at that exact path. A closed folder also says how many statements are
      recorded inside it — a way in, not a claim about the folder, which is why it goes when the folder opens.
      Paths locate authored context and never establish that a file exists, or that it is completely modeled.
    </p>
  </section>
</template>

<style scoped>
.blr-coverage-card {
  color: var(--coverage-accent);
  border-color: color-mix(in oklab, var(--coverage-accent) 30%, var(--ui-border));
  background-color: color-mix(in oklab, var(--coverage-accent) 5%, var(--ui-bg));
}

.blr-coverage-card:hover {
  border-color: color-mix(in oklab, var(--coverage-accent) 60%, var(--ui-border));
  background-color: color-mix(in oklab, var(--coverage-accent) 10%, var(--ui-bg));
}

.blr-coverage-card[aria-pressed='true'] {
  border-color: var(--coverage-accent);
  background-color: color-mix(in oklab, var(--coverage-accent) 12%, var(--ui-bg));
  box-shadow: inset 0 0 0 1px var(--coverage-accent);
}
</style>
