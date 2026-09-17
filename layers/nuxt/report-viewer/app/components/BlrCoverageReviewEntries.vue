<script setup lang="ts">
import type { CoverageComparison } from 'businesslens/report'
import type { ReportWorkspace } from '../utils/reportWorkspace'
import { resolveResourceKey } from '../utils/reportWorkspace'
const props = defineProps<{ review: CoverageComparison, path?: string, all?: boolean, workspace: ReportWorkspace }>()
const emit = defineEmits<{ selectKey: [key: string], selectPath: [path: string] }>()
const includes = (path: string) => !props.path || path === props.path || path.startsWith(`${props.path}/`)
const sections = computed(() => [
  { title: 'Completed review', review: props.review.baseline },
  { title: 'Review in progress', review: props.review.pending }
].flatMap(section => section.review ? [{ ...section, entries: section.review.entries.flatMap(entry => {
  const paths = entry.paths.filter(includes)
  return paths.length ? [{ ...entry, paths }] : []
}) }] : []))
const changes = computed(() => props.review.files.filter(file => includes(file.path) && file.change !== 'unchanged'))
const labels = { added: 'Added', modified: 'Modified', deleted: 'Deleted', unreviewed: 'No completed review', unreadable: 'Unreadable', 'outside-policy': 'Outside current inventory policy', unchanged: 'Unchanged' }
function resource(path: string) {
  const parts = path.replace(/\.md$/, '').split('/')
  const collections: Record<string, string> = { entities: 'entity', domains: 'domain', interfaces: 'interface', capabilities: 'capability', journeys: 'journey', 'business-rules': 'rule' }
  const root = collections[parts[0]!]
  if (!root) return undefined
  const expanded = ['entity', 'domain', 'interface', 'capability', 'journey', 'business-rule', 'experience', 'screen', 'scenario'].includes(parts.at(-1)!)
  const ids = parts.slice(1, expanded ? -1 : undefined).filter(part => !['experiences', 'screens', 'scenarios'].includes(part))
  const kind = parts.includes('screens') ? 'screen' : parts.includes('experiences') ? 'experience' : parts.includes('scenarios') ? `${root}-scenario` : root
  return resolveResourceKey(props.workspace, `${kind}:${kind.endsWith('-scenario') ? ids.at(-1) : ids.join('::')}`)
}
</script>

<template>
  <section class="space-y-4 border-t border-default pt-4" aria-label="Review details" data-review-details>
    <h4 class="text-sm font-semibold text-highlighted">Review details</h4>
    <p v-if="!path && !all" class="text-sm text-muted">Select a file or folder to read its recorded conclusions and changes.</p>
    <template v-else>
      <p v-if="all && !sections.length && !changes.length" class="text-sm text-muted">No review conclusions recorded.</p>
      <p v-if="path && !review.files.some(file => includes(file.path)) && !review.baseline?.files.some(file => includes(file.path)) && !review.pending?.files.some(file => includes(file.path))" class="text-sm text-muted">This location is not in the recorded review inventory.</p>
      <ul v-if="changes.length" class="max-h-60 space-y-2 overflow-auto text-xs">
        <li v-for="file in changes" :key="file.path"><span class="font-medium">{{ labels[file.change] }}</span> · <button class="font-mono text-start underline decoration-dotted underline-offset-4" @click="emit('selectPath', file.path)">{{ file.path }}</button><p v-if="file.error" class="mt-1 text-muted">{{ file.error }}</p></li>
      </ul>
      <section v-for="section in sections" :key="section.title" class="space-y-3">
        <h5 class="text-xs font-medium text-muted">{{ section.title }}</h5>
        <p v-if="!section.entries.length" class="text-sm text-muted">No conclusions recorded for this location.</p>
        <ul v-else class="space-y-4">
          <li v-for="(entry, index) in section.entries" :key="index" class="space-y-2 border-s-2 border-default ps-3">
            <p class="text-xs font-medium text-highlighted">{{ entry.outcome === 'reviewed' ? 'Reviewed' : entry.outcome === 'excluded' ? 'Explicitly excluded' : 'Uncertainty recorded' }}</p>
            <BlrProse :text="entry.summary" />
            <ul class="flex max-h-40 flex-wrap gap-x-3 gap-y-1 overflow-auto"><li v-for="file in entry.paths" :key="file"><button class="text-start font-mono text-xs text-muted underline decoration-dotted underline-offset-4" @click="emit('selectPath', file)">{{ file }}</button></li></ul>
            <div v-if="entry.resources.length" class="space-y-1">
              <h6 class="text-xs font-medium">Model resources</h6>
              <ul class="space-y-1"><li v-for="target in entry.resources" :key="target">
                <button v-if="resource(target)" class="text-sm text-primary underline underline-offset-2" @click="emit('selectKey', resource(target)!.key)">{{ resource(target)!.title }}</button>
                <p class="font-mono text-xs text-muted">{{ target }}</p>
              </li></ul>
            </div>
            <div v-for="field in (['exclusions', 'gaps'] as const)" :key="field" class="space-y-1">
              <template v-if="entry[field].length"><h6 class="text-xs font-medium">{{ field === 'exclusions' ? 'Exclusions' : 'Unmapped' }}</h6><ul class="space-y-1"><li v-for="description in entry[field]" :key="description"><BlrProse :text="description" /></li></ul></template>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
