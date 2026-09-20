<script setup lang="ts">
import type { RepositoryDiff, RepositoryFileComparison, RepositoryFileLoader, RepositoryFileReading, RepositoryChange } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { isReviewModelPath, reviewModelFiles, reviewFileResource, reviewChangeMeta as changeMeta } from '../utils/reviewModel'
import { repositoryTree, type RepositoryTreeNode } from '../utils/repositoryTree'

const props = defineProps<{
  diff: RepositoryDiff, base: string, target: string, before: ReportWorkspace | null, after: ReportWorkspace | null,
  uncommitted?: boolean, loadFile?: RepositoryFileLoader, resourceReadingOpen?: boolean, modelNotice?: string | null
}>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
const path = defineModel<string | null>('path', { default: null })
const expanded = ref(false)
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
const reading = shallowRef<RepositoryFileComparison | null>(null)
const diffDrawing = ref('unified')
const diffExpanded = ref(new Set<number>())
const diffLimits = ref<Record<number, number>>({})
watch([path, () => props.base, () => props.target], () => { diffDrawing.value = 'unified'; diffExpanded.value = new Set(); diffLimits.value = {} })
watch(() => [reading.value?.before, reading.value?.after].map(side => side?.status === 'text' ? side.text : side?.status).join('\0'), () => { diffExpanded.value = new Set(); diffLimits.value = {} })
const loading = ref(false)
const error = ref('')
let request = 0
watch([path, () => props.base, () => props.target, () => props.diff], async () => {
  const current = ++request
  error.value = ''
  if (!path.value || directory.value || !isReviewModelPath(props.diff, path.value) || !props.loadFile) { reading.value = null; loading.value = false; return }
  loading.value = true
  try {
    const value = await props.loadFile(props.base, props.target, path.value)
    if (current === request) reading.value = value
  } catch (failure) {
    if (current === request) { error.value = (failure as Error).message; reading.value = null }
  } finally { if (current === request) loading.value = false }
}, { immediate: true })
onBeforeUnmount(() => { request++ })
watch(path, value => {
  if (value && value !== '.' && !files.value.some(file => file.path === value || file.path.startsWith(`${value}/`))) {
    filter.value = 'all'
    if (!scopedFiles.value.some(file => file.path === value || file.path.startsWith(`${value}/`))) showContext.value = true
  }
  reading.value = null
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
    <BlrRepositoryTree v-model:path="path" :nodes="tree" root-label="Repository" :can-select="canSelect" :empty-message="emptyMessage">
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
    <USlideover v-model:open="open" :title="path === '.' ? showOtherChanges ? 'Repository changes' : 'Product Model changes' : path ?? 'File changes'" :description="directory ? 'Changes within this location between the selected states.' : `${beforeLabel} → ${afterLabel}`" :content="{ onCloseAutoFocus: closeFocus }" :ui="{ content: `w-full max-w-full ${expanded ? '' : 'sm:max-w-5xl'}`, title: 'break-all pe-8 font-mono text-sm', body: 'min-w-0' }">
      <template #body>
        <div class="space-y-6" data-review-file-details>
          <template v-if="directory">
            <p v-if="!selectedFiles.length" class="text-sm text-muted">No changed files in this location.</p>
            <ul class="space-y-2"><li v-for="file in selectedFiles" :key="file.path" class="flex items-start gap-3 text-sm"><span class="blr-matrix-legend-badge blr-matrix-tone shrink-0" :data-tone="changeMeta[file.change].tone">{{ changeMeta[file.change].label }}</span><button v-if="isReviewModelPath(diff, file.path)" class="break-all text-start font-mono text-primary underline" @click="path = file.path">{{ file.path }}</button><span v-else class="break-all font-mono text-muted">{{ file.path }}</span></li></ul>
          </template>
          <template v-else>
            <div class="flex flex-wrap items-center gap-2">
              <UButton v-for="side in resources" :key="side.state + side.label" :label="`View resource · ${side.label}`" :title="side.resource.title" icon="i-lucide-panel-right-open" color="neutral" variant="outline" data-review-resource @click="emit('inspect', side.resource.key, side.state)" />
              <UButton :icon="expanded ? 'i-lucide-minimize' : 'i-lucide-maximize'" :label="expanded ? 'Restore size' : 'Expand diff'" color="neutral" variant="ghost" class="ms-auto hidden sm:inline-flex" :aria-pressed="expanded" @click="expanded = !expanded" />
            </div>
            <details v-if="modelNotice" class="text-xs text-muted" data-review-model-notice>
              <summary class="cursor-pointer">Some resource readings are unavailable</summary>
              <p class="mt-2 whitespace-pre-line break-words">{{ modelNotice }}</p>
            </details>
            <p v-if="changes.get(path!)?.beforeMode !== changes.get(path!)?.afterMode" class="text-xs text-muted">File mode: {{ changes.get(path!)?.beforeMode ?? 'absent' }} → {{ changes.get(path!)?.afterMode ?? 'absent' }}</p>
            <p v-if="loading && !reading" role="status" class="text-sm text-muted">Reading file contents…</p>
            <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
            <p v-if="!loadFile" class="text-sm text-muted">File contents are unavailable in this host.</p>
            <BlrFileDiff v-if="reading && textComparison" :key="path!" v-model:drawing="diffDrawing" v-model:expanded="diffExpanded" v-model:limits="diffLimits" :before="text(reading.before)" :after="text(reading.after)" :before-exists="reading.before.status !== 'missing'" :after-exists="reading.after.status !== 'missing'" :before-label="beforeLabel" :after-label="afterLabel" />
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
