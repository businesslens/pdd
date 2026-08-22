<script setup lang="ts">
/**
 * One exact authored Product Place, read through its containing surface path.
 */
import type {
  AnyEntityView,
  ProductPlaceView,
  ReportWorkspace,
} from '../utils/reportWorkspace'
import { resolveEntity } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  place: ProductPlaceView
  /** A narrow Step keeps one path line and truncates each entity name to fit. */
  compact?: boolean
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

function select(kind: 'interface' | 'experience' | 'screen', id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <UBadge
    color="neutral"
    variant="outline"
    size="sm"
    class="max-w-full justify-start overflow-hidden whitespace-nowrap"
  >
    <BlrInterfaceType :type="place.interfaceType" size="xs" />
    <UTooltip :text="place.interfaceTitle" :delay-duration="150">
      <button
        type="button"
        class="min-w-0 shrink truncate text-start text-default underline decoration-dotted underline-offset-2 hover:text-highlighted"
        :class="compact ? 'max-w-24' : 'max-w-52'"
        @click.stop="select('interface', place.interfaceId)"
      >
        {{ place.interfaceTitle }}
      </button>
    </UTooltip>

    <template v-if="place.experienceId">
      <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-dimmed" />
      <BlrKind kind="experience" :labelled="false" size="xs" class="shrink-0" />
      <UTooltip :text="place.experienceTitle" :delay-duration="150">
        <button
          type="button"
          class="min-w-0 shrink truncate text-start text-muted underline decoration-dotted underline-offset-2 hover:text-highlighted"
          :class="compact ? 'max-w-24' : 'max-w-52'"
          @click.stop="select('experience', place.experienceId)"
        >
          {{ place.experienceTitle }}
        </button>
      </UTooltip>
    </template>

    <template v-if="place.screenId">
      <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-dimmed" />
      <BlrKind kind="screen" :labelled="false" size="xs" class="shrink-0" />
      <UTooltip :text="place.screenTitle" :delay-duration="150">
        <button
          type="button"
          class="min-w-0 shrink truncate text-start text-muted underline decoration-dotted underline-offset-2 hover:text-highlighted"
          :class="compact ? 'max-w-24' : 'max-w-52'"
          @click.stop="select('screen', place.screenId)"
        >
          {{ place.screenTitle }}
        </button>
      </UTooltip>
    </template>
  </UBadge>
</template>
