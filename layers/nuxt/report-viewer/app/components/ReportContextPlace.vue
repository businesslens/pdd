<script setup lang="ts">
/** Shared Context path for resource readings, Scenario steps and comparison popovers. */
import type { AnyResourceView, ContextView, ReportWorkspace, ResolvedContextView } from '../utils/reportWorkspace'
import { resolveResource } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  context: ContextView | ResolvedContextView
  compact?: boolean
  /** Omit the Interface when the surrounding view already names it. */
  hideInterface?: boolean
}>()
const emit = defineEmits<{ select: [resource: AnyResourceView] }>()
type Segment = { kind: 'interface' | 'experience' | 'screen', id: string, title: string }
const segments = computed(() => {
  const context = props.context
  const result: Segment[] = []
  if (!props.hideInterface || (!context.experienceId && !context.screenId)) result.push({ kind: 'interface', id: context.interfaceId, title: context.interfaceTitle })
  if (context.experienceId) result.push({ kind: 'experience', id: context.experienceId, title: context.experienceTitle })
  if (context.screenId) result.push({ kind: 'screen', id: context.screenId, title: context.screenTitle })
  return result.map(segment => ({ ...segment, resource: resolveResource(props.workspace, segment.kind, segment.id) }))
})
</script>

<template>
  <span class="report-context-place" :data-compact="compact || undefined">
    <template v-for="(segment, index) in segments" :key="`${segment.kind}:${segment.id}`">
      <UIcon v-if="index" name="i-lucide-chevron-right" class="report-context-place-separator" aria-hidden="true" />
      <UTooltip :text="segment.title" :delay-duration="150">
        <ReportResourceLink :resource-key="`${segment.kind}:${segment.id}`" class="report-context-place-segment"
          @open="segment.resource && emit('select', segment.resource)">
          <ReportInterfaceType v-if="segment.resource?.kind === 'interface'" :type="segment.resource.interfaceType" size="xs" />
          <ReportKind v-else :kind="segment.kind" :labelled="false" size="xs" />
          <span class="report-context-place-label">{{ segment.title }}</span>
        </ReportResourceLink>
      </UTooltip>
    </template>
  </span>
</template>

<style scoped>
.report-context-place {
  --report-context-icon: calc(var(--report-context-font, 13px) + 5px);
  --report-resource-mark-dense: var(--report-context-icon);
  --report-interface-mark-dense: var(--report-context-icon);
  --report-interface-kind-dense: calc(var(--report-context-icon) - 2px);
  --report-interface-badge-dense: calc(var(--report-context-icon) * 0.65);
  --report-interface-badge-glyph-dense: calc(var(--report-context-icon) * 0.45);
  display: inline-flex;
  flex-wrap: wrap;
  /* Baseline, so the path's baseline is its first name's and the prose and
     labels beside it line up with the words, not with the icons. */
  align-items: baseline;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--ui-border-accented);
  border-radius: 6px;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-size: var(--report-context-font, 13px);
  line-height: 1.5;
  vertical-align: middle;
}
.report-context-place-segment {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  border-radius: 3px;
  color: inherit;
  font-size: inherit;
  text-align: start;
}
.report-context-place-segment:hover { color: var(--ui-text-highlighted); }
.report-context-place-segment:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 3px; }
.report-context-place-label { min-width: 0; max-width: 17rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.report-context-place[data-compact] .report-context-place-label { max-width: 10rem; }
.report-context-place-segment > :first-child { flex-shrink: 0; align-self: center; width: var(--report-context-icon); height: var(--report-context-icon); }
.report-context-place-separator { align-self: center; width: calc(var(--report-context-font, 13px) + 1px); height: calc(var(--report-context-font, 13px) + 1px); flex-shrink: 0; color: var(--ui-text-dimmed); }
</style>
