<script setup lang="ts">
/** The authored interaction contract of an Interface, never guessed from its name. */
import type { ReportInterface } from 'businesslens/report'
import { INTERFACE_TYPE_META } from '../utils/reportWorkspace'

const props = withDefaults(defineProps<{
  type: ReportInterface['type']
  labelled?: boolean
}>(), { labelled: false })

const meta = computed(() => INTERFACE_TYPE_META[props.type])
const explanation = computed(() => `${meta.value.label} Interface — authored as type: ${props.type}`)
</script>

<template>
  <UTooltip :text="explanation" :delay-duration="150">
    <span
      class="inline-flex items-center gap-1 whitespace-nowrap text-muted"
      :role="labelled ? undefined : 'img'"
      :aria-label="labelled ? undefined : explanation"
    >
      <UIcon :name="meta.icon" class="size-3.5 shrink-0 text-primary" />
      <span v-if="labelled" class="text-xs font-medium">{{ meta.label }}</span>
    </span>
  </UTooltip>
</template>
