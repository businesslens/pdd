<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { coverageTree, coverageCounts, type CoverageSourceFilter } from '../utils/coverageTree'
import { repositoryTreeNodes } from '../utils/repositoryTree'

const props = defineProps<{ workspace: ReportWorkspace, path: string | null }>()
const emit = defineEmits<{ selectPath: [path: string] }>()
const filter = ref<CoverageSourceFilter>('all')
const labels = { covered: 'Covered', exclusions: 'Exclusions', unmapped: 'Unmapped' }
const annotationLabels = { ...labels, limitations: 'Limitations' }
const categoryTones = {
  covered: '[--coverage-accent:var(--ui-color-success-800)] dark:[--coverage-accent:var(--ui-color-success-300)]',
  exclusions: '[--coverage-accent:var(--ui-color-info-800)] dark:[--coverage-accent:var(--ui-color-info-300)]',
  unmapped: '[--coverage-accent:var(--ui-color-warning-800)] dark:[--coverage-accent:var(--ui-color-warning-300)]',
  limitations: '[--coverage-accent:var(--ui-color-secondary-800)] dark:[--coverage-accent:var(--ui-color-secondary-300)]'
}
const descriptions = { covered: 'Represented in the model', exclusions: 'Approved omissions', unmapped: 'Known modeling gaps' }
const tree = computed(() => coverageTree(props.workspace.coverage, filter.value))
const all = computed(() => coverageTree(props.workspace.coverage))
const branches = computed(() => ['.', ...repositoryTreeNodes(all.value).filter(node => node.children.length).map(node => node.value)])
const defaults = computed(() => ['.', ...all.value.filter(node => node.children.length).map(node => node.value)])
const expanded = useBlrReferenceExpansion(computed(() => `coverage:${props.workspace.identity.id}:sources`), branches, defaults)
const counts = computed(() => new Map(['.', ...repositoryTreeNodes(all.value).map(node => node.value)]
  .map(path => [path, coverageCounts(props.workspace.coverage, path)])))
const unlocated = computed(() => (['covered', 'exclusions', 'unmapped'] as const).flatMap(kind =>
  filter.value === 'all' || filter.value === kind
    ? props.workspace.coverage[kind].filter(area => !area.paths.length).map(area => ({ ...area, kind })) : []))
watch(() => props.path, path => {
  if (path && path !== '.' && !repositoryTreeNodes(tree.value).some(node => node.value === path)) filter.value = 'all'
})
</script>

<template>
  <section class="min-w-0 space-y-3" aria-label="Source areas" data-coverage-sources>
    <h2 class="text-base font-semibold text-highlighted">Source areas</h2>
    <div class="grid grid-cols-3 gap-2 @xl/coverage:gap-3" role="group" aria-label="Source summary filters">
      <button
        v-for="(label, kind) in labels"
        :key="kind"
        type="button"
        :aria-label="`${label}: ${workspace.coverage[kind].length}`"
        :aria-description="descriptions[kind]"
        :aria-pressed="filter === kind"
        :title="`${descriptions[kind]}. ${filter === kind ? 'Click to show all source areas.' : 'Click to filter source areas.'}`"
        :data-coverage-summary="kind"
        class="coverage-category coverage-summary flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current @xl/coverage:px-3"
        :class="categoryTones[kind]"
        @click="filter = filter === kind ? 'all' : kind"
      >
        <span class="flex w-full items-center gap-2">
          <span class="text-xl font-semibold tabular-nums" data-coverage-summary-count>{{ workspace.coverage[kind].length }}</span>
          <span class="hidden text-sm font-medium @xl/coverage:inline">{{ label }}</span>
          <UIcon name="i-lucide-check" class="ms-auto size-4 shrink-0" :class="filter !== kind && 'invisible'" />
        </span>
        <span class="block text-xs font-medium @xl/coverage:hidden">{{ label }}</span>
        <span class="hidden text-xs text-muted @xl/coverage:block">{{ descriptions[kind] }}</span>
      </button>
    </div>
    <BlrRepositoryTree v-model:expanded="expanded" :path="path" :nodes="tree" root-label="Repository" :empty-message="filter === 'all' ? 'No repository paths recorded.' : 'No recorded paths match this filter.'" @update:path="value => { if (value) emit('selectPath', value) }">
      <template #indicators="{ node }">
        <template v-for="(count, kind) in counts.get(node.value)" :key="kind">
          <span v-if="count" class="coverage-category rounded border px-1 text-[10px]" :class="categoryTones[kind]" :data-coverage-kind="kind" :title="`${count} ${annotationLabels[kind].toLowerCase()} ${node.directory ? 'at or below this folder' : 'at this file'}`">{{ annotationLabels[kind] }}<span v-if="node.directory || count > 1" class="ms-1">{{ count }}</span></span>
        </template>
      </template>
    </BlrRepositoryTree>
    <section v-if="unlocated.length" class="space-y-3 border-t border-default pt-4" aria-label="No location recorded">
      <h2 class="text-sm font-semibold text-highlighted">No location recorded <span class="blr-meta ms-1">{{ unlocated.length }}</span></h2>
      <ul class="space-y-4">
        <li v-for="area in unlocated" :key="area.description" class="space-y-2" data-coverage-entry>
          <span class="coverage-category rounded border px-1 text-[10px]" :class="categoryTones[area.kind]">{{ labels[area.kind] }}</span>
          <BlrProse :text="area.description" />
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.coverage-category {
  color: var(--coverage-accent);
  border-color: color-mix(in oklab, var(--coverage-accent) 30%, var(--ui-border));
  background-color: color-mix(in oklab, var(--coverage-accent) 8%, var(--ui-bg));
}

.coverage-summary {
  background-color: color-mix(in oklab, var(--coverage-accent) 5%, var(--ui-bg));
}

.coverage-summary:hover {
  border-color: color-mix(in oklab, var(--coverage-accent) 60%, var(--ui-border));
  background-color: color-mix(in oklab, var(--coverage-accent) 10%, var(--ui-bg));
}

.coverage-summary[aria-pressed='true'] {
  border-color: var(--coverage-accent);
  background-color: color-mix(in oklab, var(--coverage-accent) 12%, var(--ui-bg));
  box-shadow: inset 0 0 0 1px var(--coverage-accent);
}
</style>
