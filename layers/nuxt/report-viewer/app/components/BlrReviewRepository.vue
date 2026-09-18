<script setup lang="ts">
import type { RepositoryDiff, RepositoryFileComparison, RepositoryFileLoader, RepositoryFileReading, RepositoryChange } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { referencePath } from '../utils/referenceNavigation'
import { repositoryTree } from '../utils/repositoryTree'

const props = defineProps<{
  diff: RepositoryDiff, base: string, target: string, before: ReportWorkspace | null, after: ReportWorkspace | null,
  loadFile?: RepositoryFileLoader, resourceReadingOpen?: boolean, modelNotice?: string | null
}>()
const emit = defineEmits<{ inspect: [key: string, state: string] }>()
const path = defineModel<string | null>('path', { default: null })
const showContext = ref(false)
const filter = ref('all')
const states = [
  { label: 'All changes', value: 'all' }, { label: 'Added', value: 'added' },
  { label: 'Modified', value: 'modified' }, { label: 'Deleted', value: 'deleted' }, { label: 'Unavailable', value: 'unavailable' }
]
const labels: Record<RepositoryChange, string> = { added: 'Added', modified: 'Modified', deleted: 'Deleted', unavailable: 'Unavailable' }
const files = computed(() => props.diff.files.filter(file => filter.value === 'all' || file.change === filter.value))
const tree = computed(() => repositoryTree(showContext.value && filter.value === 'all' ? props.diff.paths : files.value.map(file => file.path)))
const changes = computed(() => new Map(props.diff.files.map(file => [file.path, file])))
const directory = computed(() => path.value === '.' || (!changes.value.has(path.value ?? '') && props.diff.paths.some(file => file.startsWith(`${path.value}/`))))
const contained = (file: string) => path.value === '.' || file === path.value || file.startsWith(`${path.value}/`)
const selectedFiles = computed(() => props.diff.files.filter(file => contained(file.path)))
const open = computed({
  get: () => !!path.value && !props.resourceReadingOpen,
  set: (value: boolean) => { if (!value && !props.resourceReadingOpen) path.value = null }
})
function closeFocus(event: Event) {
  if (props.resourceReadingOpen) event.preventDefault()
}
const reading = shallowRef<RepositoryFileComparison | null>(null)
const loading = ref(false)
const error = ref('')
let request = 0
watch([path, () => props.base, () => props.target, () => props.diff], async () => {
  const current = ++request
  error.value = ''
  if (!path.value || directory.value || !props.loadFile) { reading.value = null; loading.value = false; return }
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
    if (!props.diff.files.some(file => file.path === value || file.path.startsWith(`${value}/`))) showContext.value = true
  }
  reading.value = null
})
const connections = computed(() => [
  { label: 'Base', workspace: props.before, state: props.base },
  { label: 'Compare to', workspace: props.after, state: props.target }
].map(side => ({ ...side, resources: [...new Map((side.workspace?.references ?? [])
  .filter(reference => { const file = referencePath(reference.reference); return file && contained(file) })
  .map(reference => [reference.ownerKey, reference])).values()] })))
const sides = computed(() => reading.value ? [
  { label: 'Base', value: reading.value.before }, { label: 'Compare to', value: reading.value.after }
] : [])
function description(value: RepositoryFileReading) {
  if (value.status === 'missing') return 'File absent in this state.'
  if (value.status === 'unavailable') return value.reason
  if (value.status === 'binary') return `Binary file · ${value.bytes.toLocaleString()} bytes`
  if (value.status === 'large') return `Text preview unavailable above 256 KiB · ${value.bytes.toLocaleString()} bytes`
  return ''
}
function counts(prefix: string) {
  const result: Partial<Record<RepositoryChange, number>> = {}
  for (const file of props.diff.files) if (prefix === '.' || file.path === prefix || file.path.startsWith(`${prefix}/`)) result[file.change] = (result[file.change] ?? 0) + 1
  return result
}
</script>

<template>
  <section class="space-y-3" data-review-repository>
    <p class="text-sm text-muted">Changed files, including the Product Model in <code>.businesslens/</code>. Select a file to compare its contents.</p>
    <BlrRepositoryTree v-model:path="path" :nodes="tree" root-label="Repository" :empty-message="diff.files.length ? 'No changed files match this filter.' : 'No file changes between these states.'">
      <template #filters><USelect v-model="filter" :items="states" aria-label="Filter repository changes" size="sm" class="w-40 shrink-0" /></template>
      <template #controls><UCheckbox v-model="showContext" label="Show unchanged context" class="shrink-0 whitespace-nowrap" /></template>
      <template #status><p v-if="!diff.files.length && tree.length" class="text-sm text-muted">No file changes between these states.</p></template>
      <template #indicators="{ node }">
        <span v-for="(count, state) in counts(node.value)" :key="state" class="rounded border border-default px-1 text-[10px]" :data-repository-change="state">{{ labels[state] }}<span v-if="node.directory" class="ms-1">{{ count }}</span></span>
      </template>
    </BlrRepositoryTree>
    <USlideover v-model:open="open" :title="path === '.' ? 'Repository changes' : path ?? 'File changes'" :description="directory ? 'Changes within this location between the selected states.' : 'File contents at Base and Compare to.'" :content="{ onCloseAutoFocus: closeFocus }" :ui="{ content: 'w-full max-w-full sm:max-w-5xl', title: 'break-all pe-8 font-mono text-sm', body: 'min-w-0' }">
      <template #body>
        <div class="space-y-6" data-review-file-details>
          <template v-if="directory">
            <p v-if="!selectedFiles.length" class="text-sm text-muted">No changed files in this location.</p>
            <ul class="space-y-2"><li v-for="file in selectedFiles" :key="file.path" class="flex gap-3 text-sm"><span class="text-muted">{{ labels[file.change] }}</span><button class="break-all text-start font-mono text-primary underline" @click="path = file.path">{{ file.path }}</button></li></ul>
          </template>
          <template v-else>
            <p v-if="changes.get(path!)?.beforeMode !== changes.get(path!)?.afterMode" class="text-xs text-muted">File mode: {{ changes.get(path!)?.beforeMode ?? 'absent' }} → {{ changes.get(path!)?.afterMode ?? 'absent' }}</p>
            <p v-if="loading && !reading" role="status" class="text-sm text-muted">Reading file contents…</p>
            <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
            <p v-if="!loadFile" class="text-sm text-muted">File contents are unavailable in this host.</p>
            <div v-if="reading" class="grid min-w-0 gap-4 md:grid-cols-2">
              <section v-for="side in sides" :key="side.label" class="min-w-0 space-y-2">
                <h3 class="text-sm font-semibold">{{ side.label }}</h3>
                <pre v-if="side.value.status === 'text'" class="max-h-[60vh] overflow-auto rounded-lg border border-default bg-elevated p-3 font-mono text-xs leading-relaxed" :data-file-side="side.label">{{ side.value.text || '(Empty file)' }}</pre>
                <p v-else class="rounded-lg border border-default p-3 text-sm text-muted">{{ description(side.value) }}</p>
              </section>
            </div>
          </template>
          <section class="space-y-3 border-t border-default pt-4">
            <h3 class="text-sm font-semibold">Model references</h3>
            <p class="text-xs text-muted">Recorded connections at each selected state. A reference does not establish agreement.</p>
            <details v-if="modelNotice" class="text-sm text-muted" data-review-model-notice>
              <summary class="cursor-pointer">Some model references are unavailable</summary>
              <p class="mt-2 whitespace-pre-line break-words">{{ modelNotice }}</p>
            </details>
            <div v-for="side in connections" :key="side.label" class="space-y-2">
              <h4 class="text-xs font-medium text-muted">{{ side.label }}</h4>
              <p v-if="!side.workspace" class="text-sm text-muted">The model is unavailable at this state.</p>
              <p v-else-if="!side.resources.length" class="text-sm text-muted">No model references recorded for this location.</p>
              <ul v-else class="space-y-2"><li v-for="resource in side.resources" :key="resource.ownerKey"><button v-if="resource.ownerKey" class="text-sm text-primary underline" @click="emit('inspect', resource.ownerKey, side.state)">{{ resource.ownerTitle }}</button><span v-else class="text-sm">{{ resource.ownerTitle }} · Product</span></li></ul>
            </div>
          </section>
        </div>
      </template>
    </USlideover>
  </section>
</template>
