<script setup lang="ts">
/**
 * Coverage in one reading: a summary panel of Scope, Method and the four
 * category cards, then every authored statement written under the path it names.
 *
 * The four category cards are the only category filter and count whole authored
 * statements, including those with no location. Search finds recorded paths,
 * as a file finder would: it narrows the tree to the paths whose name contains
 * what was typed and opens the folders above them, and never matches prose.
 */
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { coverageStatementTree } from '../utils/coverageTree'
import { normalizeCoveragePath } from '../utils/coveragePaths'
import { repositoryTreeNodes } from '../utils/repositoryTree'
import {
  COVERAGE_KIND_META,
  COVERAGE_KIND_ORDER,
  coveragePathMatches,
  coverageStatements,
  coverageStatementIndex,
  type CoverageStatementKind
} from '../utils/coverageStatements'

const props = defineProps<{ workspace: ReportWorkspace, path: string | null }>()
const emit = defineEmits<{ selectPath: [path: string | null] }>()

const filter = ref<CoverageStatementKind | null>(null)
const query = ref('')

const all = computed(() => coverageStatements(props.workspace.coverage))
const searching = computed(() => Boolean(query.value.trim()))
const shown = computed(() => all.value.filter(statement => !filter.value || statement.kind === filter.value))
// A search narrows paths, not statements: a statement also recorded elsewhere
// never drags its other locations into the result.
const located = computed(() => shown.value
  .map(statement => ({ ...statement, paths: statement.paths.filter(path => coveragePathMatches(path, query.value)) }))
  .filter(statement => statement.paths.length))
// With no path, a statement cannot answer a path search.
const unlocated = computed(() => searching.value ? [] : shown.value.filter(statement => !statement.paths.length))
const nodes = computed(() => coverageStatementTree(located.value))
const branches = computed(() => repositoryTreeNodes(nodes.value).filter(node => node.children.length).map(node => node.value))
// Indexed once per reading, so each row looks its statements up rather than
// filtering every statement for every node it draws. Rows read the authored
// statements, so "also recorded at" still names every other location.
const index = computed(() => {
  const matched = new Set(located.value.flatMap(statement => statement.paths.map(normalizeCoveragePath)))
  return new Map([...coverageStatementIndex(shown.value)].filter(([path]) => matched.has(path)))
})
const statementsAt = (path: string) => index.value.get(normalizeCoveragePath(path)) ?? []

// An explanation is disclosed by its own row, keyed apart from its folder so a
// path that is both a folder and a recorded location keeps the two separate.
const readingKey = (path: string) => `statements:${normalizeCoveragePath(path)}`
const readable = computed(() => [...index.value.keys()].map(readingKey))

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

// A search reveals the paths it matched by opening every folder above them,
// since the narrowed tree holds nothing else; their explanations still wait to
// be asked for. It never rewrites the reader's own expansion: a folder put away
// during a search stays away until the search changes, and clearing it
// restores what they had open.
const revealed = computed(() => searching.value ? branches.value : [])
const dismissed = ref<string[]>([])
watch(query, () => { dismissed.value = [] })
const expanded = computed(() => searching.value
  ? [...new Set([...expansion.value, ...revealed.value])].filter(key => !dismissed.value.includes(key))
  : expansion.value)
function toggle(key: string) {
  if (revealed.value.includes(key)) {
    dismissed.value = dismissed.value.includes(key)
      ? dismissed.value.filter(value => value !== key)
      : [...dismissed.value, key]
    return
  }
  expansion.value = expansion.value.includes(key)
    ? expansion.value.filter(value => value !== key)
    : [...expansion.value, key]
}
function expandAll(open: boolean) {
  expansion.value = open ? [...branches.value, ...readable.value] : []
  dismissed.value = open ? [] : revealed.value
}

// A focused path deep-links a location: its ancestors open and it is read. A
// path this list chose itself has already been toggled by its row, so only a
// path arriving from elsewhere — a link, Back, a refresh — opens anything.
let chosen: string | null = null
function select(path: string | null) {
  chosen = path === null ? null : normalizeCoveragePath(path)
  emit('selectPath', path)
}
function reveal(path: string | null) {
  if (!path) return
  const ancestors = repositoryTreeNodes(nodes.value)
    .filter(node => node.children.length && path.startsWith(`${node.value}/`))
    .map(node => node.value)
  const reading = readable.value.includes(readingKey(path)) ? [readingKey(path)] : []
  expansion.value = [...new Set([...expansion.value, ...ancestors, ...reading])]
}
watch(() => props.path, (path) => {
  const own = path !== null && path === chosen
  chosen = null
  if (!own) reveal(path)
})
// After the saved expansion is restored on mount, never before it, or the
// restore would replace what the link asked for.
onMounted(() => reveal(props.path))
</script>

<template>
  <section class="min-w-0 space-y-3" aria-label="Recorded locations" data-coverage-sources>
    <!-- One summary of what the model covers: its authored scope and method, then the four categories. -->
    <div class="min-w-0 space-y-6 rounded-xl border border-default bg-elevated/20 p-4 @xl/coverage:p-5" data-coverage-summary-panel>
      <BlrCoverageDetails :workspace="workspace" />
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
            <UIcon :name="COVERAGE_KIND_META[kind].icon" class="size-4.5 shrink-0" />
            <span class="text-xl font-semibold tabular-nums" data-coverage-summary-count>{{ workspace.coverage[kind].length }}</span>
            <span class="hidden text-sm font-medium @xl/coverage:inline">{{ COVERAGE_KIND_META[kind].label }}</span>
            <UIcon name="i-lucide-check" class="ms-auto size-4 shrink-0" :class="filter !== kind && 'invisible'" />
          </span>
          <span class="block text-xs font-medium @xl/coverage:hidden">{{ COVERAGE_KIND_META[kind].label }}</span>
          <span class="hidden text-xs text-muted @xl/coverage:block">{{ COVERAGE_KIND_META[kind].blurb }}</span>
        </button>
      </div>
    </div>

    <div class="flex min-w-0 items-center gap-2 py-1" role="group" aria-label="Location controls">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Find a path…"
        aria-label="Find recorded paths"
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
          @focus="select"
        />
      </ul>
    </div>
    <p v-else class="text-sm text-muted">
      {{ query ? 'No recorded path matches this search.' : filter ? 'No recorded locations in this category.' : 'No repository paths recorded.' }}
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
