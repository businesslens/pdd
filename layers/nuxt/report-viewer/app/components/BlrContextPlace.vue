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
  <span class="blr-context-place" :data-compact="compact || undefined">
    <template v-for="(segment, index) in segments" :key="`${segment.kind}:${segment.id}`">
      <UIcon v-if="index" name="i-lucide-chevron-right" class="blr-context-place-separator" aria-hidden="true" />
      <UTooltip :text="segment.title" :delay-duration="150">
        <BlrResourceLink :resource-key="`${segment.kind}:${segment.id}`" class="blr-context-place-segment"
          @open="segment.resource && emit('select', segment.resource)">
          <BlrInterfaceType v-if="segment.resource?.kind === 'interface'" :type="segment.resource.interfaceType" size="xs" />
          <BlrKind v-else :kind="segment.kind" :labelled="false" size="xs" />
          <span class="blr-context-place-label">{{ segment.title }}</span>
        </BlrResourceLink>
      </UTooltip>
    </template>
  </span>
</template>

<style scoped>
.blr-context-place {
  --blr-context-icon: calc(var(--blr-context-font, 13px) + 5px);
  --blr-resource-mark-dense: var(--blr-context-icon);
  --blr-interface-mark-dense: var(--blr-context-icon);
  --blr-interface-kind-dense: calc(var(--blr-context-icon) - 2px);
  --blr-interface-badge-dense: calc(var(--blr-context-icon) * 0.65);
  --blr-interface-badge-glyph-dense: calc(var(--blr-context-icon) * 0.45);
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--ui-border-accented);
  border-radius: 6px;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-size: var(--blr-context-font, 13px);
  line-height: 1.5;
  vertical-align: middle;
}
.blr-context-place-segment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  border-radius: 3px;
  color: inherit;
  font-size: inherit;
  text-align: start;
}
.blr-context-place-segment:hover { color: var(--ui-text-highlighted); }
.blr-context-place-segment:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 3px; }
.blr-context-place-label { min-width: 0; max-width: 17rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.blr-context-place[data-compact] .blr-context-place-label { max-width: 10rem; }
.blr-context-place-segment > :first-child { flex-shrink: 0; width: var(--blr-context-icon); height: var(--blr-context-icon); }
.blr-context-place-separator { width: calc(var(--blr-context-font, 13px) + 1px); height: calc(var(--blr-context-font, 13px) + 1px); flex-shrink: 0; color: var(--ui-text-dimmed); }
</style>
