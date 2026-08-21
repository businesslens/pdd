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
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

function select(kind: 'interface' | 'experience' | 'screen', id: string) {
  const entity = resolveEntity(props.workspace, kind, id)
  if (entity) emit('select', entity)
}
</script>

<template>
  <UBadge color="neutral" variant="outline" size="sm">
    <BlrInterfaceType :type="place.interfaceType" />
    <button
      type="button"
      class="whitespace-nowrap text-default underline decoration-dotted underline-offset-2 hover:text-highlighted"
      @click.stop="select('interface', place.interfaceId)"
    >
      {{ place.interfaceTitle }}
    </button>

    <template v-if="place.experienceId">
      <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
      <BlrKind kind="experience" :labelled="false" size="xs" />
      <button
        type="button"
        class="whitespace-nowrap text-muted underline decoration-dotted underline-offset-2 hover:text-highlighted"
        @click.stop="select('experience', place.experienceId)"
      >
        {{ place.experienceTitle }}
      </button>
    </template>

    <template v-if="place.screenId">
      <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
      <BlrKind kind="screen" :labelled="false" size="xs" />
      <button
        type="button"
        class="whitespace-nowrap text-muted underline decoration-dotted underline-offset-2 hover:text-highlighted"
        @click.stop="select('screen', place.screenId)"
      >
        {{ place.screenTitle }}
      </button>
    </template>
  </UBadge>
</template>
