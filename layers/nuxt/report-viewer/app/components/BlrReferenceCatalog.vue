<script setup lang="ts">
/**
 * Every reference in the model, read by where it points.
 *
 * One card per kind of material the format defines counts its citations and
 * is the only kind filter; a kind with none reads zero rather than vanishing,
 * so the set of kinds never changes shape between models. Repository paths are drawn once each in a repository tree and
 * external pages once each under their site, so a file cited by fourteen
 * resources is one row, not fourteen. Search finds paths and links by name.
 * The kinds share one neutral tone: their icons tell them apart.
 */
import type { ReportWorkspace } from '../utils/reportWorkspace'
import type { ReferenceKind } from '../utils/referenceCatalog'
import {
  REFERENCE_KIND_LABEL,
  REFERENCE_KIND_ORDER,
  referenceCitationIndex,
  referenceCitations,
  referenceLocationMatches,
  referenceRepositoryTree,
  referenceSiteTree
} from '../utils/referenceCatalog'
import { repositoryTreeNodes } from '../utils/repositoryTree'

const props = defineProps<{ workspace: ReportWorkspace }>()
const emit = defineEmits<{ selectKey: [key: string, tab: string] }>()

const filter = ref<ReferenceKind | null>(null)
const query = ref('')

const all = computed(() => referenceCitations(props.workspace.references))
const cards = computed(() => REFERENCE_KIND_ORDER
  .map(kind => ({ kind, count: all.value.filter(citation => citation.reference.kind === kind).length })))
const shown = computed(() => all.value
  .filter(citation => !filter.value || citation.reference.kind === filter.value)
  .filter(citation => referenceLocationMatches(citation, query.value)))

const index = computed(() => referenceCitationIndex(shown.value))
const citationsAt = (location: string) => index.value.get(location) ?? []
const sections = computed(() => [
  {
    origin: 'internal',
    label: 'In this repository',
    icon: 'i-lucide-folder',
    nodes: referenceRepositoryTree(shown.value),
    citations: shown.value.filter(citation => citation.origin === 'internal')
  },
  {
    origin: 'external',
    label: 'External',
    icon: 'i-lucide-globe',
    nodes: referenceSiteTree(shown.value),
    citations: shown.value.filter(citation => citation.origin === 'external')
  }
].filter(section => section.citations.length).map(section => ({
  ...section,
  locations: new Set(section.citations.map(citation => citation.location)).size
})))
const nodes = computed(() => sections.value.flatMap(section => section.nodes))
const branches = computed(() => repositoryTreeNodes(nodes.value).filter(node => node.children.length).map(node => node.value))
const readable = computed(() => [...index.value.keys()].map(location => `citations:${location}`))

// One expansion set over both axes, so Expand all and Collapse all cover each.
const whole = computed(() => [...referenceRepositoryTree(all.value), ...referenceSiteTree(all.value)])
const allBranches = computed(() => repositoryTreeNodes(whole.value).filter(node => node.children.length).map(node => node.value))
const keys = computed(() => [
  ...allBranches.value,
  ...new Set(all.value.map(citation => `citations:${citation.location}`))
])
// Folders and sites open; citations wait to be asked for, so structure stays browsable.
const { expanded, toggle, expandAll } = useBlrLocationTreeExpansion({
  scope: computed(() => `references:${props.workspace.identity.id}:catalog`),
  keys,
  defaults: allBranches,
  branches,
  readable,
  query
})
</script>

<template>
  <section class="@container/references min-w-0 space-y-3" aria-label="References" data-reference-catalog>
    <div class="grid grid-cols-2 gap-2 @xl/references:grid-cols-4 @xl/references:gap-3" role="group" aria-label="Reference kinds">
      <button
        v-for="card in cards"
        :key="card.kind"
        type="button"
        class="blr-reference-card flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary @xl/references:px-3"
        :aria-label="`${REFERENCE_KIND_LABEL[card.kind]}: ${card.count}`"
        :aria-pressed="filter === card.kind"
        :title="filter === card.kind ? 'Click to show every kind.' : 'Click to show only these.'"
        :data-reference-summary="card.kind"
        @click="filter = filter === card.kind ? null : card.kind"
      >
        <span class="flex w-full items-center gap-2">
          <BlrReferenceIcon :kind="card.kind" class="size-4.5 text-muted" />
          <span class="shrink-0 text-xl font-semibold tabular-nums" :class="card.count ? 'text-highlighted' : 'text-dimmed'" data-reference-summary-count>{{ card.count }}</span>
          <UIcon name="i-lucide-check" class="ms-auto size-4 shrink-0 text-primary" :class="filter !== card.kind && 'invisible'" />
        </span>
        <!-- The kind's name has the card's whole width, so the longest ones fit whole. -->
        <span class="block max-w-full truncate text-xs font-medium @xl/references:text-sm" :class="card.count ? 'text-default' : 'text-dimmed'">{{ REFERENCE_KIND_LABEL[card.kind] }}</span>
      </button>
    </div>

    <div class="flex min-w-0 items-center gap-2 py-1" role="group" aria-label="Reference controls">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Find a path or link…"
        aria-label="Find referenced paths and links"
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

    <!-- Side by side where the reading has room for both; stacked otherwise. -->
    <div v-if="sections.length" class="grid min-w-0 items-start gap-4 @4xl/references:grid-cols-2">
      <section
        v-for="section in sections"
        :key="section.origin"
        class="min-w-0 space-y-1.5"
        :aria-label="section.label"
        :data-reference-origin="section.origin"
      >
        <p class="flex items-center gap-1.5 text-sm font-medium text-highlighted">
          <UIcon :name="section.icon" class="size-3.5 shrink-0 text-muted" />{{ section.label }}
          <span class="blr-meta" data-reference-section-count>
            {{ section.locations }} {{ section.origin === 'internal' ? (section.locations === 1 ? 'path' : 'paths') : (section.locations === 1 ? 'link' : 'links') }}
            · {{ section.citations.length }} {{ section.citations.length === 1 ? 'citation' : 'citations' }}
          </span>
        </p>
        <div class="rounded-xl border border-default bg-elevated/20 px-3 py-2">
          <ul class="min-w-0">
            <BlrReferenceLocation
              v-for="node in section.nodes"
              :key="node.value"
              :node="node"
              :workspace="workspace"
              :citations-at="citationsAt"
              :expanded="expanded"
              :depth="0"
              @toggle="toggle"
              @select-key="(key, tab) => emit('selectKey', key, tab)"
            />
          </ul>
        </div>
      </section>
    </div>
    <p v-if="!sections.length" class="text-sm text-muted">
      {{ query ? 'No referenced path or link matches this search.' : 'No references of this kind.' }}
    </p>
  </section>
</template>

<style scoped>
.blr-reference-card {
  border-color: var(--ui-border);
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 30%, transparent);
}

.blr-reference-card:hover {
  border-color: var(--ui-border-accented);
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 60%, transparent);
}

.blr-reference-card[aria-pressed='true'] {
  border-color: var(--ui-primary);
  box-shadow: inset 0 0 0 1px var(--ui-primary);
}
</style>
