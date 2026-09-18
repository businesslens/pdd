<script setup lang="ts">
import { filterRepositoryTree, repositoryModelKind, repositoryTreeNodes, type RepositoryTreeNode } from '../utils/repositoryTree'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = defineProps<{ nodes: RepositoryTreeNode[], rootLabel: string, loading?: boolean, emptyMessage?: string }>()
const emit = defineEmits<{ select: [event: Event, node: RepositoryTreeNode] }>()
const path = defineModel<string | null>('path', { default: null })
const query = ref('')
const expanded = ref<string[]>(['.'])
const visible = computed(() => filterRepositoryTree(props.nodes, query.value))
const root = computed<RepositoryTreeNode>(() => ({ value: '.', label: props.rootLabel, directory: true, children: visible.value }))
const all = computed(() => repositoryTreeNodes(props.nodes))
const modelIcons = computed(() => new Map(all.value.map(node => {
  const kind = repositoryModelKind(node)
  return [node.value, kind ? ENTITY_KIND_META[kind] : null]
})))
const colorMode = useColorMode()
const modelLogo = computed(() => `/brand/logo/mark${colorMode.value === 'dark' ? '-dark' : ''}.svg`)
const selected = computed(() => path.value === '.' ? root.value : all.value.find(node => node.value === path.value))
let initialized = false
watch([all, path], () => {
  if (!initialized && props.nodes.length) {
    expanded.value = ['.', ...props.nodes.filter(node => node.children.length).map(node => node.value)]
    initialized = true
  }
  if (path.value && path.value !== '.') {
    expanded.value = [...new Set([...expanded.value, ...all.value.filter(node => path.value!.startsWith(`${node.value}/`)).map(node => node.value)])]
    if (!repositoryTreeNodes(visible.value).some(node => node.value === path.value)) query.value = ''
  }
}, { immediate: true })
let beforeSearch: string[] | null = null
watch(query, (value, previous) => {
  if (value && !previous) beforeSearch = [...expanded.value]
  if (value) expanded.value = ['.', ...repositoryTreeNodes(visible.value).filter(node => node.children.length).map(node => node.value)]
  else if (beforeSearch) { expanded.value = beforeSearch; beforeSearch = null }
})
function expand(all: boolean) {
  expanded.value = ['.', ...(all ? repositoryTreeNodes(visible.value).filter(node => node.children.length).map(node => node.value) : [])]
}
function select(event: Event, node: RepositoryTreeNode) {
  event.preventDefault()
  path.value = node.value
  emit('select', event, node)
}
function toggle(event: CustomEvent<{ originalEvent: Event }>) {
  if (event.detail.originalEvent.type === 'click') event.preventDefault()
}
</script>

<template>
  <div class="space-y-3" data-repository-tree>
    <div class="flex min-w-0 items-center gap-2 overflow-x-auto py-1" role="group" aria-label="Repository controls">
      <UInput v-model="query" icon="i-lucide-search" placeholder="Find a file or folder…" aria-label="Find repository paths" size="sm" class="min-w-48 flex-1" />
      <slot name="filters" />
      <UFieldGroup size="sm" class="shrink-0" data-expand-all>
        <UTooltip text="Expand all"><UButton icon="i-lucide-maximize-2" color="neutral" variant="outline" aria-label="Expand all" @click="expand(true)" /></UTooltip>
        <UTooltip text="Collapse all"><UButton icon="i-lucide-minimize-2" color="neutral" variant="outline" aria-label="Collapse all" @click="expand(false)" /></UTooltip>
      </UFieldGroup>
      <slot name="controls" />
    </div>
    <slot name="status" />
    <div class="overflow-x-auto rounded-lg border border-default p-2" data-repository-tree-scroll>
      <UTree v-model:expanded="expanded" :model-value="selected" :items="[root]" :get-key="(item: RepositoryTreeNode) => item.value" :as="{ link: 'div' }" aria-label="Repository paths" color="neutral" size="sm" class="min-w-max" :ui="{ link: 'min-w-max flex-nowrap items-center gap-x-2', linkLabel: 'shrink-0 overflow-visible whitespace-nowrap font-mono text-xs', linkTrailing: 'shrink-0 flex-nowrap' }" @select="select" @toggle="toggle">
        <template #item-leading="{ item, expanded: open, handleToggle }">
          <button v-if="item.children.length" type="button" class="shrink-0 rounded p-0.5 focus-visible:outline-2 focus-visible:outline-primary" :aria-label="`${open ? 'Collapse' : 'Expand'} ${item.value}`" :aria-expanded="open" @click.stop="handleToggle()" @keydown.stop><UIcon name="i-lucide-chevron-right" class="size-3 transition-transform" :class="open && 'rotate-90'" /></button>
          <span v-else class="size-4 shrink-0" />
          <img v-if="item.directory && item.value.split('/').at(-1) === '.businesslens'" :src="modelLogo" alt="" title="BusinessLens Product Model" class="size-4 shrink-0 object-contain" data-model-folder-logo>
          <UIcon v-else-if="modelIcons.get(item.value)" :name="modelIcons.get(item.value)!.icon" :title="modelIcons.get(item.value)!.label" :style="{ color: slotColor(modelIcons.get(item.value)!.slot, colorMode.value === 'dark') }" class="size-4 shrink-0" :data-model-kind="modelIcons.get(item.value)!.kind" />
          <UIcon v-else :name="item.value === '.' ? 'i-lucide-folder-root' : item.directory ? open ? 'i-lucide-folder-open' : 'i-lucide-folder' : 'i-lucide-file'" class="size-4 shrink-0 text-muted" />
        </template>
        <template #item-label="{ item }">
          <span :title="item.value === '.' ? rootLabel : item.value" :data-coverage-root="item.value === '.' ? '' : undefined" :data-repository-path="item.value === '.' ? undefined : item.value" :class="[path === item.value ? 'font-semibold text-primary' : 'text-default', item.value === '.' && 'font-sans text-sm font-semibold']">{{ item.label }}{{ item.directory && item.value !== '.' ? '/' : '' }}</span>
        </template>
        <template #item-trailing="{ item }"><slot name="indicators" :node="item" /></template>
      </UTree>
    </div>
    <p v-if="!visible.length" class="text-sm text-muted">{{ loading ? 'Loading repository paths…' : query ? 'No paths match this search.' : emptyMessage ?? 'No paths to show.' }}</p>
  </div>
</template>
