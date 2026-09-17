<script setup lang="ts">
import type { AnyResourceView, ContextView, ReportWorkspace } from '../utils/reportWorkspace'
import type { TopologyMatrixCell } from '../utils/topologyProjections'
import { relationshipBadges } from '../utils/matrixBadges'

const props = defineProps<{
  workspace: ReportWorkspace
  cell: TopologyMatrixCell
  row: AnyResourceView
  column: AnyResourceView
  mode: 'delivery' | 'rules'
  viewKey: string
}>()
const emit = defineEmits<{ open: [key: string] }>()
const badges = computed(() => relationshipBadges(props.cell, props.mode))
const operations = { creates: 'When this Entity is created.', changes: 'When this Entity changes.', removes: 'When this Entity is removed.', reads: 'When this Entity is read.' }
function routeContexts(resource: AnyResourceView): ContextView[] {
  if (resource.kind === 'screen') return resource.contexts
    .filter(context => context.interfaceId === props.column.id)
    .map(context => ({ ...context, placeId: resource.id, placeKind: 'screen',
      screenId: resource.id, screenTitle: resource.title, key: resource.id }))
  if (resource.kind === 'experience') return props.workspace.contexts
    .filter(context => context.placeId === resource.id && context.interfaceId === props.column.id)
  return []
}
</script>

<template>
  <BlrMatrixBadge v-for="badge in badges" :key="badge.label" :label="badge.label" :tone="badge.tone"
    :accessible-label="`${badge.label} · ${row.title} · ${column.title}: show details`"
    :view-key="viewKey" :content-key="cell" @open="emit('open', $event)">
    <template #heading="{ follow }"><BlrTopologyResource :resource="column" @open="follow" /></template>
    <template #default="{ follow }">
      <section class="blr-matrix-popover-section">
        <h4 class="blr-matrix-popover-resource blr-matrix-popover-subject"><BlrTopologyResource :resource="row" @open="follow" /></h4>
        <template v-if="badge.kind === 'delivery'">
          <template v-if="badge.label !== 'direct'">
            <p class="blr-matrix-popover-caption">{{ badge.routes.length }} {{ badge.label === 'on screen' ? (badge.routes.length === 1 ? 'Screen' : 'Screens') : (badge.routes.length === 1 ? 'Experience' : 'Experiences') }}</p>
            <ul class="blr-matrix-popover-links"><li v-for="route in badge.routes" :key="route.key" class="min-w-0">
              <BlrContextPlace v-for="context in routeContexts(route)" :key="context.key"
                :workspace="workspace" :context="context" hide-interface @select="follow($event.key)" />
            </li></ul>
          </template>
        </template>
        <BlrProse v-else-if="row.kind === 'rule'" :text="row.statement" />
      </section>
      <template v-if="badge.kind === 'attachment'">
        <template v-for="attachment in badge.attachments" :key="attachment.id">
          <section v-if="attachment.target.type !== 'context'" class="blr-matrix-popover-section">
            <template v-if="attachment.target.type === 'entity'">
              <p v-if="attachment.target.effect || !attachment.target.facts.length" class="blr-matrix-popover-state">{{ attachment.target.effect ? operations[attachment.target.effect] : 'Every operation on this Entity.' }}</p>
              <p v-if="attachment.target.from && attachment.target.to" class="blr-matrix-popover-state"><strong>{{ attachment.target.from }}</strong> <span aria-label="to">→</span> <strong>{{ attachment.target.to }}</strong></p>
              <p v-else-if="attachment.target.from" class="blr-matrix-popover-state">From state: <strong>{{ attachment.target.from }}</strong></p>
              <p v-else-if="attachment.target.to" class="blr-matrix-popover-state">To state: <strong>{{ attachment.target.to }}</strong></p>
              <div v-if="attachment.target.facts.length" class="blr-matrix-attachment-facts">
                <p class="blr-matrix-popover-caption">{{ attachment.target.facts.length === 1 ? 'Fact' : 'Facts' }}</p>
                <ul class="blr-matrix-popover-links"><li v-for="fact in attachment.target.facts" :key="fact">{{ fact }}</li></ul>
              </div>
            </template>
            <template v-if="attachment.contexts.length">
              <p class="blr-matrix-popover-caption">Only in</p>
              <ul class="blr-matrix-popover-links"><li v-for="context in attachment.contexts" :key="context.key"><BlrTopologyResource :resource="context" @open="follow" /></li></ul>
            </template>
            <p v-else class="text-muted">{{ attachment.target.type === 'entity' ? 'No Context restriction' : 'Every supported Context' }}</p>
          </section>
        </template>
      </template>
    </template>
  </BlrMatrixBadge>
</template>
