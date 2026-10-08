<script setup lang="ts">
import type { ProductReport } from 'businesslens/report'
import type { LocalIssue } from '~/composables/useLocalProblems'

/**
 * Every problem with the model, most serious first, grouped by file.
 *
 * A file that defines a resource on screen links to its reading. Paths are
 * relative to `.businesslens/`, the folder the reader and their agent edit.
 * The docked desktop panel and the phone sheet both render this.
 */
const props = defineProps<{ report: ProductReport | null }>()
const emit = defineEmits<{ close: [], resource: [key: string] }>()
const problems = useLocalProblems()
const copyRequest = useLocalCopyRequest()

const issues = computed(() => problems.value?.issues ?? [])
const errors = computed(() => issues.value.filter(issue => issue.severity === 'error'))
const warnings = computed(() => issues.value.filter(issue => issue.severity === 'warning'))
const stale = computed(() => problems.value?.state === 'stale')
const files = computed(() => new Set(errors.value.map(issue => issue.file ?? '')).size)
const shownAt = computed(() => problems.value?.builtAt
  ? new Date(problems.value.builtAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : null)

const title = computed(() => {
  if (!errors.value.length) return plural(warnings.value.length, 'warning')
  if (stale.value) return `${plural(errors.value.length, 'problem')} stop the report from rebuilding`
  return `${plural(errors.value.length, 'problem')} in ${plural(files.value, 'file')}`
})
const description = computed(() => {
  if (stale.value) return shownAt.value ? `You're seeing the version from ${shownAt.value}.` : `You're seeing the last version that built.`
  if (errors.value.some(issue => issue.incomplete)) return 'Part of the model is missing from the report until these are fixed.'
  return 'The report is up to date.'
})

const groups = computed(() => {
  const serious = stale.value ? errors.value : errors.value.filter(issue => issue.incomplete)
  const rest = stale.value ? [] : errors.value.filter(issue => !issue.incomplete)
  return [
    { id: 'serious', label: stale.value ? 'Stops the rebuild' : 'Leaves something out of the report', tone: 'error', items: issuesByFile(serious) },
    { id: 'rest', label: 'Doesn\'t change the report', tone: 'warning', items: issuesByFile(rest) }
  ].filter(group => group.items.length)
})
const warningGroups = computed(() => issuesByFile(warnings.value))
const warningsOpen = ref(false)
const heading = ref<HTMLElement | null>(null)
defineExpose({ focus: () => heading.value?.focus({ preventScroll: true }) })

function linkFor(resource: string | undefined) {
  const name = resourceTitle(props.report, resource)
  return name && resource ? { key: resource, name } : null
}
const lineOf = (issue: LocalIssue) => issue.line ? `line ${issue.line}` : ''
</script>
<template>
  <div class="flex h-full min-h-0 flex-col" data-local-problems-content>
    <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-default px-4 py-2.5 sm:px-6">
      <div class="min-w-0 flex-1">
        <h2 ref="heading" tabindex="-1" class="text-sm font-semibold text-highlighted outline-none">{{ title }}</h2>
        <p class="text-xs text-muted">{{ description }}</p>
      </div>
      <UButton v-if="problems?.request" size="sm" icon="i-lucide-copy" label="Copy for your agent" @click="copyRequest(problems.request)" />
      <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Close problems" @click="emit('close')" />
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
      <div class="grid gap-4" data-local-problems-list>
        <section v-for="group in groups" :key="group.id" class="grid gap-1.5">
          <h3 class="local-group" :data-tone="group.tone">{{ group.label }} · {{ group.items.reduce((sum, item) => sum + item.issues.length, 0) }}</h3>
          <div v-for="item in group.items" :key="item.file ?? 'model'" class="grid gap-0.5">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <code class="local-file">{{ item.file ?? 'Model' }}</code>
              <button v-if="linkFor(item.resource)" type="button" class="local-link" @click="emit('resource', linkFor(item.resource)!.key)">
                {{ linkFor(item.resource)!.name }} ›
              </button>
              <span v-else-if="stale && item.resource" class="text-xs text-dimmed">not in this version</span>
            </div>
            <p v-for="(issue, index) in item.issues" :key="index" class="local-issue" :data-tone="group.tone">
              <span>{{ issue.message }}</span>
              <span v-if="lineOf(issue)" class="local-line">{{ lineOf(issue) }}</span>
            </p>
          </div>
        </section>
        <section v-if="warningGroups.length" class="grid gap-1.5">
          <button type="button" class="local-group text-left" data-tone="neutral" :aria-expanded="warningsOpen" @click="warningsOpen = !warningsOpen">
            {{ warningsOpen ? '▾' : '▸' }} Warnings · {{ warnings.length }}
          </button>
          <template v-if="warningsOpen">
            <div v-for="item in warningGroups" :key="item.file ?? 'model'" class="grid gap-0.5">
              <code class="local-file">{{ item.file ?? 'Model' }}</code>
              <p v-for="(issue, index) in item.issues" :key="index" class="local-issue" data-tone="neutral">
                <span>{{ issue.message }}</span>
              </p>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.local-group { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.local-group[data-tone='error'] { color: var(--ui-error); }
.local-group[data-tone='warning'] { color: var(--ui-warning); }
.local-group[data-tone='neutral'] { color: var(--ui-text-muted); }
.local-file { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ui-text-highlighted); overflow-wrap: anywhere; }
.local-link { font-size: 0.75rem; font-weight: 600; color: var(--ui-primary); }
.local-link:hover { text-decoration: underline; }
.local-link:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 2px; border-radius: 2px; }
.local-issue { display: flex; gap: 0.5rem; align-items: baseline; padding-inline-start: 0.75rem; font-size: 0.8125rem; color: var(--ui-text); }
.local-issue::before { content: ''; flex: none; width: 0.375rem; height: 0.375rem; border-radius: 9999px; transform: translateY(-0.1rem); background: var(--ui-text-dimmed); }
.local-issue[data-tone='error']::before { background: var(--ui-error); }
.local-issue[data-tone='warning']::before { background: var(--ui-warning); }
.local-issue > span:first-child { min-width: 0; overflow-wrap: anywhere; }
.local-line { margin-inline-start: auto; flex: none; font-family: var(--font-mono); font-size: 0.6875rem; color: var(--ui-text-dimmed); }
</style>
