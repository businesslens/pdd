<script setup lang="ts">
import type { RepositoryFileLoader } from 'businesslens/report'
import { projectReportWorkspace } from '../utils/reportWorkspace'
import type { ReportChanges } from '../utils/reportChanges'

const props = defineProps<{ changes: ReportChanges, loadRepositoryFile?: RepositoryFileLoader, resourceReadingOpen?: boolean }>()
const path = defineModel<string | null>('path', { default: null })
const emit = defineEmits<{
  uncommitted: []
  compare: [base: string, target: string]
  search: [query: string]
  more: []
  inspect: [key: string, state: string]
}>()
const target = computed(() => props.changes.target ?? 'working')
const before = computed(() => props.changes.before ? projectReportWorkspace(props.changes.before) : null)
const after = computed(() => props.changes.after ? projectReportWorkspace(props.changes.after) : null)
const baseId = computed(() => props.changes.baseState?.id ?? props.changes.baseline ?? '')
const targetId = computed(() => props.changes.targetState?.id ?? target.value)
</script>

<template>
  <div class="space-y-5" data-changes data-history>
    <div class="flex flex-wrap items-center justify-between gap-3" data-review-mode>
      <div>
        <h2 class="text-base font-semibold text-highlighted">{{ changes.mode === 'uncommitted' ? 'Uncommitted changes' : 'Compare versions' }}</h2>
        <p v-if="changes.mode === 'uncommitted'" class="mt-1 text-sm text-muted">{{ changes.baseline === 'empty' ? 'New Product Model · no commits yet.' : 'Since the last commit, including staged, unstaged and new files.' }}</p>
      </div>
      <UButton v-if="changes.mode === 'uncommitted'" label="Compare versions…" icon="i-lucide-arrow-left-right" color="neutral" variant="outline" :disabled="!changes.baseline" @click="emit('compare', changes.baseline!, target)" />
      <UButton v-else label="Uncommitted changes" icon="i-lucide-file-pen-line" color="neutral" variant="outline" @click="emit('uncommitted')" />
    </div>
    <div v-if="changes.mode !== 'uncommitted'" class="flex flex-wrap items-center gap-2 rounded-lg border border-default p-3" data-changes-toolbar>
      <BlrHistorySelect :changes="changes" :model-value="changes.baseline" label="Base" data-baseline-control @select="emit('compare', $event, target)" @search="emit('search', $event)" @more="emit('more')" />
      <UButton icon="i-lucide-arrow-left-right" aria-label="Swap comparison sides" color="neutral" variant="outline" :disabled="!changes.baseline" @click="emit('compare', target, changes.baseline!)" />
      <BlrHistorySelect :changes="changes" :model-value="target" label="Compare to" data-target-control @select="changes.baseline && emit('compare', changes.baseline, $event)" @search="emit('search', $event)" @more="emit('more')" />
    </div>
    <UAlert v-if="changes.error" color="warning" icon="i-lucide-triangle-alert" title="These states cannot be compared." :description="changes.error" />
    <p v-else-if="changes.initializing" class="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">Loading history…</p>
    <div v-else-if="!changes.baseline" class="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-5 text-center" data-history-empty>
      <UIcon name="i-lucide-history" class="size-9 text-muted" aria-hidden="true" />
      <h2 class="text-lg font-semibold">{{ changes.emptyReason === 'choose-state' ? 'Choose a state to compare' : 'Nothing to compare yet' }}</h2>
      <p v-if="changes.emptyReason === 'choose-state'" class="max-w-md text-sm leading-relaxed text-muted">No initial comparison could be selected. Choose an earlier commit or another branch as your base, to inspect its changes.</p>
      <p v-else class="max-w-md text-sm leading-relaxed text-muted">There isn’t an earlier saved Git state. Commit your model and relevant source files to make a saved state available.</p>
    </div>
    <p v-else-if="!changes.repository" class="text-sm text-muted" role="status">Comparing states…</p>
    <BlrReviewRepository v-if="changes.repository" v-model:path="path" :diff="changes.repository" :uncommitted="changes.mode === 'uncommitted'" :base="baseId" :target="targetId" :before="before" :after="after" :model-notice="changes.modelNotice" :load-file="loadRepositoryFile" :resource-reading-open="resourceReadingOpen" @inspect="(key, state) => emit('inspect', key, state)" />
  </div>
</template>
