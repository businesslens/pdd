<script setup lang="ts">
import type { ProductReport, RepositoryDiff, RepositoryFileComparison, RepositoryFileLoader, RepositoryFileReading, RepositoryChange } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import type { ResourceReview } from '../utils/resourceReview'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { isReviewModelPath, reviewModelFiles, reviewFileResource, reviewChangeMeta as changeMeta } from '../utils/reviewModel'
import { repositoryTree, type RepositoryTreeNode } from '../utils/repositoryTree'
import { comparisonFileKey, comparisonResource, comparisonReadings, readingChanged, type ComparisonSide } from '../utils/resourceComparison'

const props = defineProps<{
  diff: RepositoryDiff, base: string, target: string, before: ReportWorkspace | null, after: ReportWorkspace | null,
  uncommitted?: boolean, loadFile?: RepositoryFileLoader, resourceReadingOpen?: boolean, modelNotice?: string | null
  beforeReport?: ProductReport | null, afterReport?: ProductReport | null
}>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
const path = defineModel<string | null>('path', { default: null })
const expanded = ref(false)
const returnFocus = shallowRef<HTMLElement | null>(null)
const showContext = ref(false)
const showOtherChanges = ref(false)
const modelFiles = computed(() => reviewModelFiles(props.diff))
const otherFiles = computed(() => props.diff.files.filter(file => !isReviewModelPath(props.diff, file.path)))
const modelPaths = computed(() => props.diff.paths.filter(path => isReviewModelPath(props.diff, path)))
const scopedFiles = computed(() => showOtherChanges.value ? props.diff.files : modelFiles.value)
const scopedPaths = computed(() => showOtherChanges.value ? props.diff.paths : modelPaths.value)
const canSelect = (node: RepositoryTreeNode) => node.directory || isReviewModelPath(props.diff, node.value)
const beforeLabel = computed(() => props.uncommitted ? props.base === 'empty' ? 'Before first commit' : 'Last commit' : 'Base')
const afterLabel = computed(() => props.uncommitted ? 'Working state' : 'Compare to')
const filter = ref('all')
const legendOpen = ref(false)
const states = [
  { label: 'All changes', value: 'all' },
  ...Object.entries(changeMeta).map(([value, meta]) => ({ label: meta.label, value }))
]
const files = computed(() => scopedFiles.value.filter(file => filter.value === 'all' || file.change === filter.value))
const tree = computed(() => repositoryTree(showContext.value && filter.value === 'all' ? scopedPaths.value : files.value.map(file => file.path)))
const uncommittedMessage = (subject: string) => props.uncommitted ? `No uncommitted ${subject} changes.` : `No ${subject} changes between these versions.`
const emptyMessage = computed(() => scopedFiles.value.length ? 'No files match this filter.'
  : showOtherChanges.value ? uncommittedMessage('repository') : uncommittedMessage('Product Model'))
const changes = computed(() => new Map(modelFiles.value.map(file => [file.path, file])))
const directory = computed(() => path.value === '.' || (!changes.value.has(path.value ?? '') && scopedPaths.value.some(file => file.startsWith(`${path.value}/`))))
const contained = (file: string) => path.value === '.' || file === path.value || file.startsWith(`${path.value}/`)
const selectedFiles = computed(() => scopedFiles.value.filter(file => contained(file.path)))
const open = computed({
  get: () => !!path.value && !props.resourceReadingOpen,
  set: (value: boolean) => { if (!value && !props.resourceReadingOpen) path.value = null }
})
function closeFocus(event: Event) {
  if (props.resourceReadingOpen) event.preventDefault()
}
// Keep file contents and their model projections together while refreshing.
// Clearing them on every poll remounts the open reading and loses its position.
const loaded = shallowRef<{ signature: string, file: RepositoryFileComparison, before: ComparisonSide | null, after: ComparisonSide | null } | null>(null)
const reading = computed(() => loaded.value?.file ?? null)
const presentation = ref<'auto' | 'resource' | 'file'>('auto')
const comparisonTab = defineModel<string>('tab', { default: '' })
const details = useTemplateRef('details')
let comparisonScroll = 0
function inspect(key: string, state: string) {
  comparisonScroll = details.value?.parentElement?.scrollTop ?? 0
  emit('inspect', key, state)
}
function restoreComparison() { if (details.value?.parentElement) details.value.parentElement.scrollTop = comparisonScroll }
watch(() => props.resourceReadingOpen, value => {
  if (value) comparisonScroll = details.value?.parentElement?.scrollTop ?? comparisonScroll
}, { flush: 'sync' })
const beforeSide = computed(() => loaded.value?.before ?? null)
const afterSide = computed(() => loaded.value?.after ?? null)
const comparisonKey = computed(() => path.value ? comparisonFileKey(afterSide.value, props.diff.modelPath, path.value) ?? comparisonFileKey(beforeSide.value, props.diff.modelPath, path.value) : null)
// Absence must be established by the file read; a failed model parse is not deletion.
const canCompare = computed(() => !!comparisonKey.value && !!reading.value
  && (beforeSide.value || reading.value.before.status === 'missing')
  && (afterSide.value || reading.value.after.status === 'missing')
  && [reading.value.before, reading.value.after].every(side => side.status === 'text' || side.status === 'missing'))
const semanticChanges = computed(() => {
  if (!comparisonKey.value) return false
  const before = comparisonReadings(beforeSide.value, comparisonKey.value), after = comparisonReadings(afterSide.value, comparisonKey.value)
  const ids = new Set([...before, ...after].map(reading => reading.id))
  // The Product file owns About and its own References; coverage.md owns Coverage.
  if (comparisonKey.value === 'product') ids.delete('coverage')
  return [...ids].some(id => readingChanged(before.find(reading => reading.id === id), after.find(reading => reading.id === id)))
})
const showResource = computed(() => canCompare.value && presentation.value !== 'file' && (presentation.value === 'resource' || semanticChanges.value))
const normalSide = computed(() => afterSide.value?.workspace.byKey.has(comparisonKey.value ?? '') ? afterSide.value : beforeSide.value)
const normalResource = computed(() => normalSide.value?.workspace.byKey.get(comparisonKey.value ?? '') ?? null)
const showNormal = computed(() => showResource.value && !!normalResource.value)
const normalReview = computed<ResourceReview | null>(() => showNormal.value ? { before: beforeSide.value, after: afterSide.value, resourceKey: comparisonKey.value!, inspect } : null)
const fileOpen = computed({ get: () => open.value && !showNormal.value && (!!reading.value || !loading.value || directory.value), set: value => { if (!showNormal.value) open.value = value } })
const resourceTitle = computed(() => {
  if (!comparisonKey.value) return ''
  if (comparisonKey.value === 'coverage') return 'Coverage'
  const resource = afterSide.value && comparisonResource(afterSide.value, comparisonKey.value) || beforeSide.value && comparisonResource(beforeSide.value, comparisonKey.value)
  return String(resource?.title ?? resource?.name ?? '')
})
const panelTitle = computed(() => directory.value ? path.value === '.' ? showOtherChanges.value ? 'Repository changes' : 'Product Model changes' : path.value! : showResource.value ? resourceTitle.value : path.value ?? 'File changes')
const resourceType = computed(() => {
  if (comparisonKey.value === 'product') return 'Product'
  if (comparisonKey.value === 'coverage') return 'Product coverage'
  const resource = afterSide.value?.workspace.byKey.get(comparisonKey.value ?? '') ?? beforeSide.value?.workspace.byKey.get(comparisonKey.value ?? '')
  return resource ? ENTITY_KIND_META[resource.kind].label : ''
})
const parentTitle = computed(() => {
  const side = afterSide.value ?? beforeSide.value
  const resource = side?.workspace.byKey.get(comparisonKey.value ?? '')
  if (resource?.kind === 'capability-scenario') return resource.capabilityTitle
  if (resource?.kind === 'journey-scenario') return resource.journeyTitle
  return ''
})
const versionDetail = (state: string) => state === 'working' || state === 'empty' ? '' : ` · ${state.replace(/^commit:/, '').slice(0, 7)}`
const diffDrawing = ref('unified')
const diffExpanded = ref(new Set<number>())
const diffLimits = ref<Record<number, number>>({})
watch([path, () => props.base, () => props.target], () => { presentation.value = 'auto'; comparisonScroll = 0; diffDrawing.value = 'unified'; diffExpanded.value = new Set(); diffLimits.value = {} })
watch(() => [reading.value?.before, reading.value?.after].map(side => side?.status === 'text' ? side.text : side?.status).join('\0'), () => { diffExpanded.value = new Set(); diffLimits.value = {} })
const loading = ref(false)
const error = ref('')
let request = 0
watch([path, () => props.base, () => props.target, () => props.diff], async ([selectedPath, base, target], [previousPath, previousBase, previousTarget]) => {
  const current = ++request
  error.value = ''
  if (selectedPath !== previousPath || base !== previousBase || target !== previousTarget) loaded.value = null
  if (!selectedPath || directory.value || !isReviewModelPath(props.diff, selectedPath) || !props.loadFile) { loaded.value = null; loading.value = false; return }
  const before = props.beforeReport && props.before ? { report: props.beforeReport, workspace: props.before, state: base } : null
  const after = props.afterReport && props.after ? { report: props.afterReport, workspace: props.after, state: target } : null
  loading.value = true
  try {
    const file = await props.loadFile(base, target, selectedPath)
    // Identical polls must not rebuild the ordinary reading's graph or controls.
    const signature = JSON.stringify([file, before?.state, before?.report, after?.state, after?.report])
    if (current === request && loaded.value?.signature !== signature) loaded.value = { signature, file, before, after }
  } catch (failure) {
    if (current === request) { error.value = (failure as Error).message; loaded.value = null }
  } finally { if (current === request) loading.value = false }
}, { immediate: true })
onBeforeUnmount(() => { request++ })
watch(path, (value, previous) => {
  if (value && !previous && import.meta.client) returnFocus.value = document.activeElement as HTMLElement | null
  if (value && value !== '.' && !files.value.some(file => file.path === value || file.path.startsWith(`${value}/`))) {
    filter.value = 'all'
    if (!scopedFiles.value.some(file => file.path === value || file.path.startsWith(`${value}/`))) showContext.value = true
  }
})
watch([path, scopedPaths], () => {
  if (path.value && !directory.value && !isReviewModelPath(props.diff, path.value)) path.value = null
}, { immediate: true })
const resources = computed(() => [
  { label: beforeLabel.value, workspace: props.before, state: props.base },
  { label: afterLabel.value, workspace: props.after, state: props.target }
].flatMap(side => {
  const resource = path.value && reviewFileResource(side.workspace, props.diff.modelPath, path.value)
  return resource ? [{ label: side.label, state: side.state, resource }] : []
}))
const sides = computed(() => reading.value ? [
  { label: beforeLabel.value, value: reading.value.before }, { label: afterLabel.value, value: reading.value.after }
] : [])
const textComparison = computed(() => reading.value && [reading.value.before, reading.value.after].every(side => side.status === 'text' || side.status === 'missing'))
const text = (side: RepositoryFileReading) => side.status === 'text' ? side.text : ''
function description(value: RepositoryFileReading) {
  if (value.status === 'missing') return 'File absent in this state.'
  if (value.status === 'unavailable') return value.reason
  if (value.status === 'binary') return `Binary file · ${value.bytes.toLocaleString()} bytes`
  if (value.status === 'large') return `Text preview unavailable above 256 KiB · ${value.bytes.toLocaleString()} bytes`
  return ''
}
function counts(prefix: string) {
  const result: Partial<Record<RepositoryChange, number>> = {}
  for (const file of scopedFiles.value) if (prefix === '.' || file.path === prefix || file.path.startsWith(`${prefix}/`)) result[file.change] = (result[file.change] ?? 0) + 1
  return result
}
</script>

<template>
  <section class="space-y-3" data-review-repository>
    <div class="flex flex-wrap items-center gap-3">
      <p class="min-w-0 flex-1 basis-80 text-sm text-muted">Changes in <code>{{ diff.modelPath }}/</code>. Select a file to review its edits.</p>
      <UPopover v-model:open="legendOpen" :content="{ align: 'end', sideOffset: 8, collisionPadding: 16 }" :ui="{ content: 'blr-matrix-legend-popover' }" class="ms-auto">
        <UButton label="Legend" trailing-icon="i-lucide-chevron-down" color="neutral" variant="outline" size="sm" />
        <template #content>
          <div class="blr-matrix-legend-heading">
            <h3>Legend</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close legend" @click="legendOpen = false" />
          </div>
          <ul class="blr-matrix-legend-entries" aria-label="File change legend" data-review-legend>
            <li v-for="(meta, state) in changeMeta" :key="state" :data-legend-label="meta.label">
              <span class="blr-matrix-legend-badge blr-matrix-tone" :data-tone="meta.tone">{{ meta.label }}</span>
              <p>{{ meta.description }}</p>
            </li>
          </ul>
          <p class="border-t border-default px-3 py-2 text-xs text-muted">Folder badges count changed files at or below that folder.</p>
        </template>
      </UPopover>
    </div>
    <BlrRepositoryTree v-model:path="path" :nodes="tree" root-label="Repository" :can-select="canSelect" :empty-message="emptyMessage" @update:path="comparisonTab = ''">
      <template #filters><USelect v-model="filter" :items="states" aria-label="Filter repository changes" size="sm" class="w-40 shrink-0" /></template>
      <template #controls>
        <UCheckbox v-if="otherFiles.length || showOtherChanges" v-model="showOtherChanges" :label="`Show other repository changes (${otherFiles.length})`" class="shrink-0 whitespace-nowrap" />
        <UCheckbox v-model="showContext" label="Show unchanged context" class="shrink-0 whitespace-nowrap" />
      </template>
      <template #status><p v-if="!scopedFiles.length && tree.length" class="text-sm text-muted">{{ emptyMessage }}</p></template>
      <template #indicators="{ node }">
        <span v-for="(count, state) in counts(node.value)" :key="state" class="blr-matrix-tone rounded border px-1 text-[10px]" :data-tone="changeMeta[state].tone" :data-repository-change="state">{{ changeMeta[state].label }}<span v-if="node.directory" class="ms-1">{{ count }}</span></span>
      </template>
    </BlrRepositoryTree>
    <BlrResourceSlideover v-if="showNormal && normalSide" v-model:tab="comparisonTab" :resource="open ? normalResource : null" :workspace="normalSide.workspace" :state-id="normalSide.state" :return-focus="returnFocus" :review="normalReview" file-diff-available :review-label="`${afterLabel}${versionDetail(target)} compared with ${beforeLabel}${versionDetail(base)}`" :review-source="path ?? undefined" @close="path = null" @open="resource => inspect(resource.key, normalSide!.state)" @file-diff="presentation = 'file'" />
    <USlideover v-if="!showNormal" v-model:open="fileOpen" :title="panelTitle" :description="directory ? 'Changes within this location between the selected states.' : `Before: ${beforeLabel}${versionDetail(base)} → After: ${afterLabel}${versionDetail(target)}`" :content="{ onCloseAutoFocus: closeFocus }" :ui="{ content: `w-full max-w-full ${expanded ? '' : 'sm:max-w-5xl'}`, title: 'break-words pe-8 text-base', body: 'min-w-0' }" @after:enter="restoreComparison">
      <template #body>
        <div ref="details" class="space-y-6" data-review-file-details>
          <template v-if="directory">
            <p v-if="!selectedFiles.length" class="text-sm text-muted">No changed files in this location.</p>
            <ul class="space-y-2"><li v-for="file in selectedFiles" :key="file.path" class="flex items-start gap-3 text-sm"><span class="blr-matrix-legend-badge blr-matrix-tone shrink-0" :data-tone="changeMeta[file.change].tone">{{ changeMeta[file.change].label }}</span><button v-if="isReviewModelPath(diff, file.path)" class="break-all text-start font-mono text-primary underline" @click="path = file.path">{{ file.path }}</button><span v-else class="break-all font-mono text-muted">{{ file.path }}</span></li></ul>
          </template>
          <template v-else>
            <div class="flex flex-wrap items-center gap-2">
              <span v-if="showResource" class="text-sm text-muted">{{ resourceType }}<template v-if="parentTitle"> · {{ parentTitle }}</template></span>
              <span v-if="changes.get(path!)" class="blr-matrix-tone rounded border px-1.5 py-0.5 text-xs" :data-tone="changeMeta[changes.get(path!)!.change].tone">{{ changeMeta[changes.get(path!)!.change].label }}</span>
              <UButton v-if="canCompare" :label="showResource ? 'View file diff' : 'View resource comparison'" icon="i-lucide-arrow-left-right" color="neutral" variant="outline" data-review-presentation @click="presentation = showResource ? 'file' : 'resource'" />
              <template v-if="!showResource"><UButton v-for="side in resources" :key="side.state + side.label" :label="`View resource · ${side.label}`" :title="side.resource.title" icon="i-lucide-panel-right-open" color="neutral" variant="outline" data-review-resource @click="inspect(side.resource.key, side.state)" /></template>
              <UButton :icon="expanded ? 'i-lucide-minimize' : 'i-lucide-maximize'" :label="expanded ? 'Restore size' : 'Expand reading'" color="neutral" variant="ghost" class="ms-auto hidden sm:inline-flex" :aria-pressed="expanded" @click="expanded = !expanded" />
            </div>
            <p class="break-all font-mono text-xs text-muted" data-comparison-source>{{ path }}</p>
            <p v-if="canCompare && !semanticChanges" class="text-sm text-muted">No modeled values changed in this file. The file diff shows formatting or file-level edits.</p>
            <details v-if="modelNotice" class="text-xs text-muted" data-review-model-notice>
              <summary class="cursor-pointer">Some resource readings are unavailable</summary>
              <p class="mt-2 whitespace-pre-line break-words">{{ modelNotice }}</p>
            </details>
            <p v-if="changes.get(path!)?.beforeMode !== changes.get(path!)?.afterMode" class="text-xs text-muted">File mode: {{ changes.get(path!)?.beforeMode ?? 'absent' }} → {{ changes.get(path!)?.afterMode ?? 'absent' }}</p>
            <p v-if="loading && !reading" role="status" class="text-sm text-muted">Reading file contents…</p>
            <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
            <p v-if="!loadFile" class="text-sm text-muted">File contents are unavailable in this host.</p>
            <BlrResourceComparison v-if="showResource && comparisonKey" v-model:tab="comparisonTab" :before="beforeSide" :after="afterSide" :resource-key="comparisonKey" @inspect="inspect" />
            <BlrFileDiff v-else-if="reading && textComparison" :key="path!" v-model:drawing="diffDrawing" v-model:expanded="diffExpanded" v-model:limits="diffLimits" :before="text(reading.before)" :after="text(reading.after)" :before-exists="reading.before.status !== 'missing'" :after-exists="reading.after.status !== 'missing'" :before-label="beforeLabel" :after-label="afterLabel" />
            <div v-else-if="reading" class="grid min-w-0 gap-4 md:grid-cols-2">
              <section v-for="side in sides" :key="side.label" class="min-w-0 space-y-2">
                <h3 class="text-sm font-semibold">{{ side.label }}</h3>
                <pre v-if="side.value.status === 'text'" class="max-h-[60vh] overflow-auto rounded-lg border border-default bg-elevated p-3 font-mono text-xs leading-relaxed" :data-file-side="side.label">{{ side.value.text || '(Empty file)' }}</pre>
                <p v-else class="rounded-lg border border-default p-3 text-sm text-muted">{{ description(side.value) }}</p>
              </section>
            </div>
          </template>

        </div>
      </template>
    </USlideover>
  </section>
</template>
