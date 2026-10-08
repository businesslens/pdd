<script setup lang="ts">
import type { ProductReport } from 'businesslens/report'

/**
 * The header's answer to "can I trust what's on screen?".
 *
 * Red: the screen is not the current model, because the model stopped
 * building or a resource was shown without part of its file. Amber: the
 * report is right but files need fixing. Grey: warnings only. Nothing at all
 * when the model is clean. It never opens the list by itself: an agent's
 * half-written saves would otherwise take space every few seconds. Clicking
 * it again closes the list.
 */
const props = defineProps<{ report: ProductReport | null, expanded?: boolean }>()
const emit = defineEmits<{ open: [] }>()
const problems = useLocalProblems()

const errors = computed(() => problems.value?.issues.filter(issue => issue.severity === 'error') ?? [])
const warnings = computed(() => problems.value?.issues.filter(issue => issue.severity === 'warning') ?? [])
const shownAt = computed(() => problems.value?.builtAt
  ? new Date(problems.value.builtAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : null)

const chip = computed(() => {
  const status = problems.value
  if (!status) return null
  if (status.state === 'stale') {
    return { tone: 'error', icon: 'i-lucide-circle-alert', label: shownAt.value ? `Can't rebuild · showing ${shownAt.value}` : `Can't rebuild`, title: `The model doesn't build, so this is the last version that did. ${plural(errors.value.length, 'problem')} to fix.` }
  }
  if (status.state === 'degraded') {
    const incomplete = errors.value.filter(issue => issue.incomplete)
    const count = plural(errors.value.length, 'problem')
    if (incomplete.length) {
      const names = [...new Set(incomplete.map(issue => resourceTitle(props.report, issue.resource)).filter((name): name is string => Boolean(name)))]
      const what = names.length === 1 ? `${names[0]} incomplete` : names.length ? `${names.length} resources incomplete` : 'files left out'
      return { tone: 'error', icon: 'i-lucide-circle-alert', label: `${count} · ${what}`, title: 'Part of the model is missing from this report until the problems are fixed.' }
    }
    return { tone: 'warning', icon: 'i-lucide-triangle-alert', label: count, title: 'The report is up to date; some model files need fixing.' }
  }
  if (status.state === 'ready' && warnings.value.length) {
    return { tone: 'neutral', icon: 'i-lucide-info', label: plural(warnings.value.length, 'warning'), title: 'Lint warnings. The report is up to date.' }
  }
  return null
})
</script>

<template>
  <UTooltip v-if="chip" :text="chip.title">
    <button
      type="button"
      data-local-problems
      :data-tone="chip.tone"
      class="local-problems-chip blr-header-pill inline-flex items-center gap-1.5 border"
      :aria-label="`${chip.label}. ${expanded ? 'Hide' : 'Show'} problems`"
      :aria-expanded="expanded"
      @click="emit('open')"
    >
      <UIcon :name="chip.icon" class="size-3.5 shrink-0" />
      <span class="truncate">{{ chip.label }}</span>
    </button>
  </UTooltip>
</template>

<style scoped>
.local-problems-chip { cursor: pointer; max-width: min(22rem, 60vw); transition: background-color 120ms ease; }
.local-problems-chip:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 2px; }
.local-problems-chip[data-tone='error'] { color: var(--ui-error); border-color: color-mix(in srgb, var(--ui-error) 35%, transparent); background: color-mix(in srgb, var(--ui-error) 9%, transparent); }
.local-problems-chip[data-tone='error']:hover { background: color-mix(in srgb, var(--ui-error) 15%, transparent); }
.local-problems-chip[data-tone='warning'] { color: var(--ui-warning); border-color: color-mix(in srgb, var(--ui-warning) 40%, transparent); background: color-mix(in srgb, var(--ui-warning) 10%, transparent); }
.local-problems-chip[data-tone='warning']:hover { background: color-mix(in srgb, var(--ui-warning) 17%, transparent); }
.local-problems-chip[data-tone='neutral'] { color: var(--ui-text-muted); border-color: var(--ui-border); }
.local-problems-chip[data-tone='neutral']:hover { background: var(--ui-bg-elevated); }
</style>
