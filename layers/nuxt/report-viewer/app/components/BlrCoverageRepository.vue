<script setup lang="ts">
import type { CoverageComparison, CoverageChange } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { coverageRepository, coverageTreeNodes, referenceFile, referenceOwner, type CoverageNode } from '../utils/coverageRepository'
import { COVERAGE_ROOT } from '../utils/coverageState'

const props = defineProps<{ workspace: ReportWorkspace, paths: string[], review?: CoverageComparison, comparisonAvailable?: boolean, loading?: boolean, reviewError?: string }>()
const emit = defineEmits<{ selectKey: [key: string] }>()
const selectedPath = defineModel<string | null>('path', { default: null })
const detailsOpen = computed({
  get: () => Boolean(selectedPath.value),
  set: (open: boolean) => { if (!open) selectedPath.value = null }
})
const repository = useTemplateRef<HTMLElement>('repository')
const detailBody = useTemplateRef<HTMLElement>('detailBody')
const rootSection = ref('scope')
const selectedRoot = computed(() => selectedPath.value === COVERAGE_ROOT)
let returnFocus: HTMLElement | null = null
function onCloseAutoFocus(event: Event) {
  const target = returnFocus?.isConnected ? returnFocus : repository.value?.querySelector<HTMLElement>('[role="treeitem"]')
  if (target) { event.preventDefault(); target.focus({ preventScroll: true }) }
}
const fileState = ref('all')
const stateLabels: Record<CoverageChange, string> = { added: 'Added', modified: 'Modified', deleted: 'Deleted', unchanged: 'Unchanged', unreviewed: 'Not reviewed', unreadable: 'Unreadable', 'outside-policy': 'Outside policy' }

const tree = computed(() => coverageRepository(props.workspace, props.paths, props.review))
const allNodes = computed(() => coverageTreeNodes(tree.value))
const stateOptions = computed(() => {
  const counts: Partial<Record<CoverageChange, number>> = {}
  for (const file of props.review?.files ?? []) counts[file.change] = (counts[file.change] ?? 0) + 1
  return [{ label: 'All file states', value: 'all' }, ...Object.entries(counts).map(([state, count]) => ({ label: `${stateLabels[state as CoverageChange]} · ${count}`, value: state }))]
})
watch(stateOptions, options => {
  if (!options.some(option => option.value === fileState.value)) fileState.value = 'all'
})
function filterState(nodes: CoverageNode[]): CoverageNode[] {
  if (fileState.value === 'all') return nodes
  return nodes.flatMap(node => {
    const children = filterState(node.children)
    return children.length || (!node.children.length && node.changes[fileState.value as CoverageChange]) ? [{ ...node, children }] : []
  })
}
const visibleTree = computed(() => filterState(tree.value))
// The root is context, not a filesystem match. It survives empty inventories and filters.
const root = computed<CoverageNode>(() => ({
  value: COVERAGE_ROOT, label: props.workspace.identity.title, directory: true,
  children: visibleTree.value, sources: [], gaps: [], exclusions: [], owners: [], reviewPaths: [], changes: {}
}))
watch(selectedPath, path => {
  if (path && path !== COVERAGE_ROOT && !coverageTreeNodes(visibleTree.value).some(node => node.value === path)) fileState.value = 'all'
})
const selected = computed(() => selectedRoot.value ? root.value : allNodes.value.find(node => node.value === selectedPath.value))
const sourceIndexes = computed(() => selected.value?.sources ?? [])
const gapIndexes = computed(() => selected.value?.gaps ?? [])
const areaFields = computed(() => [
  { key: 'exclusions', label: 'Exclusions', explanation: 'Approved omissions from this model’s scope.', areas: props.workspace.coverage.exclusions, indexes: selected.value?.exclusions ?? [] },
  { key: 'unmapped', label: 'Unmapped', explanation: 'Known missing behavior within the declared scope.', areas: props.workspace.coverage.unmapped, indexes: gapIndexes.value }
])
const owners = computed(() => {
  const groups = new Map<string, { key: string, title: string, references: typeof props.workspace.identity.references }>()
  for (const reference of props.workspace.references) {
    const file = referenceFile(reference)
    if (!file) continue
    if (!selected.value) continue
    if (!selectedRoot.value && file !== selected.value.value && !file.startsWith(`${selected.value.value}/`)) continue
    const key = referenceOwner(reference)
    if (!groups.has(key)) groups.set(key, { key: reference.ownerKey, title: reference.ownerTitle, references: [] })
    groups.get(key)!.references.push(reference.reference)
  }
  return [...groups.values()]
})
function selectNode(event: Event, node: CoverageNode) {
  event.preventDefault()
  returnFocus = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="treeitem"]') : null
  rootSection.value = 'scope'
  selectedPath.value = node.value
}
function scrollRootSection() {
  if (!selectedRoot.value) return
  const body = detailBody.value
  const target = body?.querySelector<HTMLElement>(`[data-coverage-field="${rootSection.value}"]`)
  const scroller = body?.parentElement
  if (target && scroller) scroller.scrollTop += target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24
}
function openRoot(section: string) {
  rootSection.value = section
  if (!detailsOpen.value) returnFocus = repository.value?.querySelector<HTMLElement>('[data-coverage-root]')?.closest<HTMLElement>('[role="treeitem"]') ?? null
  selectedPath.value = COVERAGE_ROOT
  void nextTick(scrollRootSection)
}
watch([detailBody, selectedPath], () => {
  void nextTick(() => {
    if (selectedRoot.value) scrollRootSection()
    else if (detailBody.value?.parentElement) detailBody.value.parentElement.scrollTop = 0
  })
}, { flush: 'post' })
function selectPath(path: string) {
  const key = path.replace(/^\.\//, '').replace(/\/$/, '')
  selectedPath.value = key
  fileState.value = 'all'
}
</script>

<template>
  <section ref="repository" class="space-y-4" aria-label="Repository coverage" data-repository-coverage>
    <BlrRepositoryTree v-model:path="selectedPath" :nodes="visibleTree" :root-label="workspace.identity.title" :loading="loading" @select="(event, node) => selectNode(event, node as CoverageNode)">
      <template #filters><USelect v-if="review?.files.length" v-model="fileState" :items="stateOptions" aria-label="Filter file states" size="sm" class="w-52 shrink-0" /></template>
      <template #controls><slot name="controls" /><slot name="inventory-count" /></template>
      <template #status><slot name="inventory-status" /></template>
      <template #indicators="{ node }">
        <BlrCoverageRootIndicators v-if="node.value === COVERAGE_ROOT" :workspace="workspace" :review="review" :comparison-available="comparisonAvailable" :error="reviewError" :loading="loading" @focus="openRoot" />
        <BlrCoverageIndicators v-else :node="node as CoverageNode" />
      </template>
    </BlrRepositoryTree>
    <p class="text-xs text-muted">File states show changes since review; model annotations show recorded context. Neither establishes completeness. Folder counts include descendants.</p>
    <USlideover
      v-model:open="detailsOpen"
      :title="selectedRoot ? workspace.identity.title : selectedPath ?? 'Path details'"
      :description="selectedRoot ? 'Model scope and review across the repository.' : selected?.directory ? 'Recorded context for this folder and its descendants.' : 'Recorded context for this repository path.'"
      :content="{ onCloseAutoFocus }"
      :ui="{ content: 'w-full max-w-full sm:max-w-xl', wrapper: 'min-w-0', title: 'break-all pe-8 font-mono text-sm', body: 'min-w-0' }"
    >
      <template #close="{ ui }">
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close path details" :class="ui.close()" />
      </template>
      <template #body>
      <div ref="detailBody" class="min-w-0 space-y-5" data-coverage-annotations>
        <UButton v-if="!selectedRoot" icon="i-lucide-folder-root" color="neutral" variant="link" size="xs" class="p-0" @click="openRoot('scope')">{{ workspace.identity.title }}</UButton>
        <p v-if="!selected" role="status" class="text-sm text-muted">{{ loading ? 'Loading this path…' : 'This path is not in the current inventory or recorded model context.' }}</p>
        <template v-if="selectedRoot">
          <BlrCoverageDetails :workspace="workspace" @select-path="selectPath" />
          <section class="space-y-4 border-t border-default pt-5" aria-label="Repository review" data-coverage-review data-coverage-field="review">
            <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="text-base font-semibold text-highlighted">Repository review</h3><slot name="review-controls" /></div>
            <BlrCoverageReviewSummary :review="review" :error="reviewError" />
            <BlrCoverageReviewEntries v-if="review" :review="review" :workspace="workspace" all @select-key="emit('selectKey', $event)" @select-path="selectPath" />
          </section>
        </template>
        <template v-else-if="selected">
          <div class="overflow-x-auto"><BlrCoverageIndicators :node="selected" file-states-only /></div>
          <h3 class="text-base font-semibold text-highlighted">Model scope</h3>
          <p v-if="selected && !sourceIndexes.length && !gapIndexes.length && !selected.exclusions.length && !owners.length" class="text-sm text-muted">No authored model annotations for this location.</p>
          <section class="space-y-2" aria-label="Source areas" data-coverage-field="sourceAreas">
            <h4 class="text-sm font-semibold text-highlighted">Source areas <span class="blr-meta ms-1">{{ sourceIndexes.length }}</span></h4>
            <ul v-if="sourceIndexes.length" class="space-y-1">
              <li v-for="index in sourceIndexes" :key="index"><button type="button" class="break-all text-start font-mono text-xs text-default underline decoration-dotted underline-offset-4 hover:text-primary" :data-source-area="workspace.coverage.sourceAreas[index]" @click="selectPath(workspace.coverage.sourceAreas[index]!)">{{ workspace.coverage.sourceAreas[index] }}</button></li>
            </ul>
            <p v-else class="text-sm text-muted">None recorded.</p>
          </section>
          <section v-for="field in areaFields" :key="field.key" class="space-y-3" :aria-label="field.label" :data-coverage-field="field.key">
            <h4 class="text-sm font-semibold text-highlighted">{{ field.label }} <span class="blr-meta ms-1">{{ field.indexes.length }}</span></h4>
            <p class="text-xs text-muted">{{ field.explanation }}</p>
            <ul v-if="field.indexes.length" class="space-y-4">
              <li v-for="index in field.indexes" :key="index" class="space-y-2" :data-unmapped-entry="field.key === 'unmapped' ? '' : undefined">
                <BlrProse :text="field.areas[index]!.description" />
                <ul class="flex flex-wrap gap-x-3 gap-y-1">
                  <li v-for="path in field.areas[index]!.paths" :key="path"><button type="button" class="break-all text-start font-mono text-xs text-muted underline decoration-dotted underline-offset-4 hover:text-primary" @click="selectPath(path)">{{ path }}</button></li>
                </ul>
              </li>
            </ul>
            <p v-else class="text-sm text-muted">None recorded.</p>
          </section>
          <section class="space-y-3" aria-label="Repository review">
            <h3 class="text-base font-semibold text-highlighted">Repository review</h3>
            <p v-if="reviewError" role="status" class="text-xs text-muted">{{ reviewError }} Current review status is unavailable.</p>
            <p v-else-if="review?.baseline && !comparisonAvailable" class="text-xs text-muted">Saved conclusions; live comparison is unavailable.</p>
            <BlrCoverageReviewEntries v-if="review" :review="review" :path="selected.value" :workspace="workspace" @select-key="emit('selectKey', $event)" @select-path="selectPath" />
            <p v-else class="text-sm text-muted">No review conclusions recorded for this location.</p>
          </section>
        </template>
        <template v-if="selected">
          <section class="space-y-3" aria-label="Model references">
            <h4 class="text-sm font-semibold text-highlighted">Model references <span class="blr-meta ms-1">{{ owners.length }} resources</span></h4>
            <ul v-if="owners.length" class="space-y-4">
              <li v-for="owner in owners" :key="owner.key" class="space-y-2">
                <button v-if="owner.key" type="button" class="text-sm text-primary underline underline-offset-2" @click="emit('selectKey', owner.key)">{{ owner.title }}</button>
                <p v-else class="text-sm text-default">{{ owner.title }} · Product</p>
                <BlrRefs :references="owner.references" :scope="JSON.stringify([workspace.identity.id, 'coverage', selected?.value, owner.key])" label="" />
              </li>
            </ul>
            <p v-else class="text-sm text-muted">None recorded.</p>
          </section>
        </template>
      </div>
      </template>
    </USlideover>
  </section>
</template>
