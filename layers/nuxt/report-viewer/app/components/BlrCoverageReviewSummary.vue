<script setup lang="ts">
import type { CoverageComparison, CoverageChange } from 'businesslens/report'
const props = defineProps<{ review?: CoverageComparison, error?: string }>()
const counts = computed(() => {
  const result: Partial<Record<CoverageChange, number>> = {}
  for (const file of props.review?.files ?? []) result[file.change] = (result[file.change] ?? 0) + 1
  return result
})
const labels: Record<CoverageChange, string> = { added: 'Added', modified: 'Modified', deleted: 'Deleted', unchanged: 'Unchanged', unreadable: 'Unreadable', 'outside-policy': 'Outside current inventory policy', unreviewed: 'No completed review' }
const recorded = computed(() => props.review?.pending?.entries.reduce((count, entry) => count + entry.paths.length, 0) ?? 0)
const uncertain = computed(() => props.review?.baseline?.entries.filter(entry => entry.outcome === 'uncertain').reduce((count, entry) => count + entry.paths.length, 0) ?? 0)
const date = (value: string) => new Date(value).toLocaleString()
</script>

<template>
  <section class="space-y-4 rounded-lg border border-default p-4" aria-label="Repository review" data-repository-review>
    <p v-if="error" role="status" class="text-sm text-default">{{ error }} Recorded model information remains available; review status could not be established.</p>
    <template v-if="review">
      <div v-if="review.baseline" class="space-y-2">
        <p class="text-sm text-default"><strong>{{ review.baseline.files.length }} files accounted for</strong> in the review completed {{ date(review.baseline.completedAt!) }}.</p>
        <p class="text-xs text-muted">Source: <code>.businesslens/coverage.json</code></p>
        <p class="text-xs text-muted">Accounted for includes reviewed files, explicit exclusions and recorded uncertainty. It does not mean all Product behavior is modeled.</p>
        <p v-if="uncertain" class="text-sm text-default">{{ uncertain }} files had unresolved uncertainty in that review.</p>
        <p v-if="review.modelChanged" role="status" class="text-sm font-medium text-default">The Product Model has changed since this review. Previous conclusions need to be checked against the current model.</p>
        <p v-else-if="review.modelChanged === false" class="text-xs text-muted">The Product Model files match the completed review.</p>
        <p v-else class="text-xs text-muted">This is the saved review. A live repository comparison is needed to establish current model and file changes.</p>
      </div>
      <div v-else class="space-y-2">
        <p class="text-sm font-medium text-highlighted">No completed repository review yet.</p>
        <p class="text-sm text-muted">This file list shows what exists now. Source areas and model references do not establish that every file was considered.</p>
        <p class="text-xs text-muted">An agent can begin with <code>businesslens coverage start</code>, inspect the captured files and record its conclusions.</p>
      </div>
      <div v-if="review.baseline && review.modelChanged !== null" class="space-y-2">
        <h4 class="text-sm font-medium text-highlighted">Files since review</h4>
        <dl class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <div v-for="(count, change) in counts" :key="change" class="flex gap-1.5"><dt class="text-muted">{{ labels[change] }}</dt><dd class="font-medium">{{ count }}</dd></div>
        </dl>
        <p class="text-xs text-muted">Changes identify where to investigate. A changed file can also affect behavior in unchanged files.</p>
      </div>
      <div v-if="review.pending" class="space-y-2 border-t border-default pt-3" data-review-pending>
        <h4 class="text-sm font-medium text-highlighted">Review in progress</h4>
        <p class="text-sm text-default">{{ recorded }} of {{ review.pending.files.length }} captured files have a recorded conclusion. Started {{ date(review.pending.startedAt) }}.</p>
        <p v-if="review.pendingChanged" role="status" class="text-sm text-default">Files have changed since this worklist was captured. The agent must capture a new worklist before completing it.</p>
        <p class="text-xs text-muted">Work in progress does not replace the completed review. Recorded conclusions are listed below; open a path to inspect its context in the tree.</p>
      </div>
      <section class="space-y-1 border-t border-default pt-3" aria-label="Inventory policy">
        <h4 class="text-xs font-medium text-highlighted">Inventory policy</h4>
        <p class="text-xs text-muted">Tracked files and untracked files allowed by Git ignore rules. Product Model directories and generated model backups are excluded; the selected model is compared separately. Symlink targets are not followed and submodules require a separate review.</p>
        <p class="text-xs text-muted">{{ review.policy.includePaths.length ? 'Explicitly included ignored paths:' : 'No ignored paths explicitly included.' }}</p>
        <ul v-if="review.policy.includePaths.length" class="flex flex-wrap gap-2 text-xs"><li v-for="path in review.policy.includePaths" :key="path" class="font-mono">{{ path }}</li></ul>
        <p v-if="review.pending && JSON.stringify(review.pending.policy) !== JSON.stringify(review.policy)" class="text-xs text-muted">The pending review uses different included paths: {{ review.pending.policy.includePaths.join(', ') || 'None' }}.</p>
        <p class="text-xs text-muted">The completed review is saved in .businesslens/coverage.json and shared when committed. Work in progress stays local to this worktree. Refresh compares current files; it never marks them as reviewed.</p>
      </section>
    </template>
    <p v-else class="text-sm text-muted">No completed review is saved in this model. Live review information is not supplied by this report host.</p>
  </section>
</template>
