<script setup lang="ts">
import type { AnyEntityView, ContextView, EntryPointView, ReportWorkspace } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  contexts: ContextView[]
  entryPoints?: EntryPointView[]
  /** A peek shows only authored Capability Contexts. */
  compact?: boolean
}>(), {
  entryPoints: () => [],
  compact: false
})

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const visibleContexts = computed(() => props.compact ? props.contexts.slice(0, 2) : props.contexts)
const remainingContexts = computed(() => props.contexts.length - visibleContexts.value.length)
const contextLabel = computed(() => props.contexts.length === 1 ? 'Context' : 'Contexts')
</script>

<template>
  <div v-if="contexts.length || (!compact && entryPoints.length)" class="space-y-3">
    <section v-if="contexts.length" class="space-y-1.5">
      <p class="blr-field">{{ contextLabel }}</p>
      <div class="flex flex-wrap gap-1.5">
        <BlrContextPlace
          v-for="context in visibleContexts"
          :key="context.key"
          :workspace="workspace"
          :context="context"
          :compact="compact"
          @select="emit('select', $event)"
        />
        <UBadge v-if="remainingContexts" color="neutral" variant="subtle" size="sm">
          +{{ remainingContexts }} more
        </UBadge>
      </div>
    </section>

    <section v-if="!compact && entryPoints.length" class="space-y-1.5">
      <p class="blr-field">Starts at</p>
      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="point in entryPoints"
          :key="point.key"
          class="min-w-0"
        >
          <BlrContextPlace
            :workspace="workspace"
            :context="point.context"
            @select="emit('select', $event)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>
