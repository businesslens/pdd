<script setup lang="ts">
import type { ReportWorkspace } from '../utils/reportWorkspace'

defineProps<{ workspace: ReportWorkspace }>()
</script>

<template>
  <div class="min-w-0 space-y-3" data-coverage-details>
    <section class="min-w-0 space-y-2" aria-label="Model scope" data-coverage-field="scope">
      <h2 class="text-base font-semibold text-highlighted">Model scope</h2>
      <BlrProse :text="workspace.coverage.scope" />
    </section>
    <UCollapsible v-if="workspace.coverage.method">
      <template #default="{ open }">
        <UButton color="neutral" variant="link" size="sm" class="h-auto px-0 text-muted" aria-label="How this model was authored">
          <span class="text-sm font-medium">How this model was authored</span>
          <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 transition-transform" :class="open && 'rotate-180'" />
        </UButton>
      </template>
      <template #content>
        <section class="pt-2" aria-label="Method" data-coverage-method>
          <BlrProse :text="workspace.coverage.method" />
        </section>
      </template>
    </UCollapsible>
  </div>
</template>
