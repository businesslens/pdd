<script setup lang="ts">
import type { ReportResourceKind, ReportWorkspace } from '../utils/reportWorkspace'
import type { ReportProductLink } from '../utils/reportProducts'

defineProps<{
  workspace: ReportWorkspace
  logoSrc?: string | null
  products?: ReportProductLink[]
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
  navigate: []
}>()
</script>

<template>
  <div data-report-sidebar :data-collapsed="Boolean(collapsed)" class="blr-pane flex h-full flex-col py-4" :class="collapsed ? 'px-2' : 'px-3'">
    <div v-if="$slots.brand || $slots.close" class="mb-4 flex min-h-7 shrink-0 items-start gap-2" :class="collapsed ? 'justify-center' : 'justify-between'">
      <slot name="brand" />
      <slot name="close" />
    </div>

    <div class="mb-3 shrink-0">
      <BlrProductPicker
        :title="workspace.identity.title"
        :logo-src="logoSrc"
        :products="products"
        :collapsed="collapsed"
        @navigate="emit('navigate')"
      />
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
      <template v-if="tools" #overview-action>
        <BlrReportTools tool="search" :collapsed="collapsed" @search="emit('search')" />
      </template>
      <template v-if="$slots.navigation" #navigation>
        <slot name="navigation" :collapsed="collapsed" />
      </template>
    </BlrRail>

    <div v-if="tools" data-report-sidebar-vocabulary class="mt-3 shrink-0 border-t border-default pt-2">
      <BlrReportTools tool="vocabulary" :collapsed="collapsed" @vocabulary="emit('vocabulary', $event)" />
    </div>

    <div v-if="$slots.footer" data-report-sidebar-footer class="mt-auto grid shrink-0 gap-1 pt-6">
      <slot name="footer" />
    </div>
  </div>
</template>
