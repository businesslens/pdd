<script setup lang="ts">
import type { LocalIssue } from '~/composables/useLocalProblems'

/**
 * The one full-screen state: there is no report to show.
 *
 * It is what a reader sees while an agent writes a new model's first files,
 * so it reads as progress, not alarm; only a crash of the viewer itself gets
 * the red edge. It disappears by itself on the first save that builds.
 */
const props = defineProps<{
  issues?: LocalIssue[]
  request?: string | null
  /** The viewer failed to render a report it was given. */
  crash?: string | null
}>()
const copyRequest = useLocalCopyRequest()

const errors = computed(() => (props.issues ?? []).filter(issue => issue.severity === 'error'))
const groups = computed(() => issuesByFile(errors.value))
const title = computed(() => props.crash ? 'The report hit a problem' : 'The model doesn\'t build yet')
const summary = computed(() => {
  if (props.crash) return 'The report could not draw this model. Reloading usually brings it back; if it doesn\'t, copy the details for your agent.'
  const files = groups.value.filter(group => group.file).length
  const count = plural(errors.value.length, 'error')
  return `${files ? `${count} in ${plural(files, 'file')}` : count}. This page turns into the report by itself on the first save that fixes ${errors.value.length === 1 ? 'it' : 'them'}.`
})
const crashDetails = computed(() => props.crash ? `The BusinessLens local report crashed while drawing the Product Model in .businesslens/:\n\n${props.crash}\n` : null)
const caret = (issue: LocalIssue) => `${' '.repeat(Math.max(0, (issue.column ?? 1) - 1))}^`
</script>

<template>
  <div class="local-overlay" role="alert" aria-live="polite" data-local-overlay :data-crash="crash ? true : undefined">
    <div class="local-panel">
      <div class="local-meta">
        <span>BusinessLens · local report</span>
        <span class="flex items-center gap-1.5">
          <UButton v-if="crash" size="sm" icon="i-lucide-rotate-cw" label="Reload" class="local-button" @click="() => reloadNuxtApp({ force: true })" />
          <UButton v-if="request || crashDetails" size="sm" icon="i-lucide-copy" :label="crash ? 'Copy details' : 'Copy for your agent'" class="local-button" @click="copyRequest(crash ? crashDetails : request)" />
        </span>
      </div>
      <h2 class="local-title">{{ title }}</h2>
      <p class="local-summary">{{ summary }}</p>
      <pre v-if="crash" class="local-frame local-crash">{{ crash }}</pre>
      <div v-else class="local-list">
        <div v-for="group in groups" :key="group.file ?? 'model'" class="grid gap-1">
          <code v-if="group.file" class="local-file">{{ group.file }} <span>{{ group.issues.length }}</span></code>
          <template v-for="(issue, index) in group.issues" :key="index">
            <pre v-if="issue.excerpt?.length" class="local-frame"><template v-for="row in issue.excerpt" :key="row.line"><span :class="{ hit: row.line === issue.line }"><span class="ln">{{ String(row.line).padStart(3) }} │ </span>{{ row.text }}
</span><span v-if="row.line === issue.line" class="caret"><span class="ln">    │ </span>{{ caret(issue) }}
</span></template></pre>
            <p class="local-issue">{{ issue.message }}<span v-if="issue.line" class="local-line">line {{ issue.line }}</span></p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* One dark look on purpose, in both themes, like a dev-server overlay. */
.local-overlay {
  position: absolute; inset: 0; z-index: 40; display: grid; place-items: center; padding: 1rem;
  background: repeating-linear-gradient(180deg, color-mix(in srgb, var(--ui-text) 4%, transparent) 0 18px, transparent 18px 40px), var(--ui-bg);
}
.local-panel {
  width: min(52rem, 100%); max-height: calc(100% - 1rem); display: grid; grid-template-rows: auto auto auto minmax(0, 1fr); gap: 0.5rem;
  padding: 1.1rem 1.25rem 1.25rem; border-radius: 0.75rem; background: #1d1915; color: #efe7dc;
  border: 1px solid #3d342b; border-top: 3px solid #c9a466; box-shadow: 0 24px 60px rgb(0 0 0 / 0.35);
}
[data-crash] .local-panel { border-top-color: #e0675b; }
.local-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.75rem; color: #a99a88; }
.local-title { font-size: 1.25rem; font-weight: 650; color: #f5ede2; letter-spacing: -0.01em; }
.local-summary { font-size: 0.875rem; color: #c3b5a3; max-width: 62ch; }
.local-list { min-height: 0; overflow-y: auto; display: grid; align-content: start; gap: 0.9rem; margin-top: 0.4rem; padding-right: 0.25rem; }
.local-file { font-family: var(--font-mono); font-size: 0.8125rem; color: #efe7dc; overflow-wrap: anywhere; }
.local-file span { color: #a99a88; margin-inline-start: 0.25rem; }
.local-issue { display: flex; gap: 0.5rem; align-items: baseline; font-size: 0.875rem; color: #d8cdbf; padding-inline-start: 0.75rem; overflow-wrap: anywhere; }
.local-line { margin-inline-start: auto; flex: none; font-family: var(--font-mono); font-size: 0.75rem; color: #8f8172; padding-inline-start: 0.75rem; }
.local-issue::before { content: ''; flex: none; width: 0.375rem; height: 0.375rem; border-radius: 9999px; background: #ff8b7e; transform: translateY(-0.1rem); }
.local-frame { margin: 0; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.6; background: #13100d; border-radius: 0.375rem; padding: 0.5rem 0; color: #d8cdbf; overflow-x: auto; white-space: pre; }
.local-frame > span { display: block; padding-inline: 0.75rem; }
.local-frame .ln { color: #6f6255; }
.local-frame .hit { background: rgb(224 103 91 / 0.16); }
.local-frame .caret { color: #ff8b7e; }
.local-crash { padding: 0.75rem; white-space: pre-wrap; overflow-wrap: anywhere; color: #ffb4aa; }
.local-button { --ui-primary: #c9a466; }
</style>
