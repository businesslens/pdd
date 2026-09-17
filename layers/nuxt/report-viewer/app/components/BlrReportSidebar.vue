<script setup lang="ts">
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'

defineProps<{
  workspace: ReportWorkspace
  activeSection: string
  counts: Record<ReportResourceKind, number>
  tools?: boolean
  collapsed?: boolean
}>()

const emit = defineEmits<{
  kind: [kind: ReportResourceKind]
  view: [section: string]
  search: []
  vocabulary: [originId: string]
}>()
</script>

<template>
  <div data-report-sidebar :data-collapsed="Boolean(collapsed)" class="blr-pane flex h-full flex-col py-4" :class="collapsed ? 'px-2' : 'px-3'">
    <div v-if="$slots.brand || $slots.close" class="mb-5 flex min-h-7 shrink-0 items-center gap-2" :class="collapsed ? 'justify-center' : 'justify-between px-1'">
      <slot name="brand" />
      <slot name="close" />
    </div>

    <div v-if="tools" class="mb-4 grid shrink-0 gap-1">
      <BlrReportTools :collapsed="collapsed" @search="emit('search')" @vocabulary="emit('vocabulary', $event)" />
    </div>

    <BlrRail
      :workspace="workspace"
      :collapsed="collapsed"
      :active-section="activeSection"
      :counts="counts"
      class="shrink-0"
      @kind="emit('kind', $event)"
      @view="emit('view', $event)"
    >
      <template v-if="$slots.navigation" #navigation>
        <slot name="navigation" :collapsed="collapsed" />
      </template>
    </BlrRail>

    <div v-if="$slots.footer" class="mt-auto shrink-0 pt-6">
      <slot name="footer" />
    </div>
  </div>
</template>
