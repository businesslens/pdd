<script setup lang="ts">
/** The authored interaction contract of an Interface, never guessed from its name. */
import type { ReportInterface } from 'businesslens/report'
import { INTERFACE_TYPE_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  type: ReportInterface['type']
  labelled?: boolean
  size?: 'xs' | 'sm'
}>(), { labelled: false, size: 'sm' })

const meta = computed(() => INTERFACE_TYPE_META[props.type])
const explanation = computed(() => `${meta.value.label} Interface — authored as type: ${props.type}`)
const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const interfaceColor = computed(() => slotColor(1, mounted.value && colorMode.value === 'dark'))
</script>

<template>
  <UTooltip :text="explanation" :delay-duration="150">
    <span
      class="inline-flex items-center gap-1.5 whitespace-nowrap text-muted"
      :role="labelled ? undefined : 'img'"
      :aria-label="labelled ? undefined : explanation"
    >
      <span class="blr-interface-mark" :data-size="size">
        <UIcon name="i-lucide-plug" class="blr-interface-mark__kind" :style="{ color: interfaceColor }" />
        <span class="blr-interface-mark__type">
          <UIcon :name="meta.icon" />
        </span>
      </span>
      <span v-if="labelled" class="text-xs font-medium">{{ meta.label }}</span>
    </span>
  </UTooltip>
</template>

<style scoped>
.blr-interface-mark {
  position: relative;
  display: inline-flex;
  width: 1.375rem;
  height: 1.375rem;
  flex: 0 0 1.375rem;
  align-items: flex-start;
  justify-content: flex-start;
}

.blr-interface-mark__kind {
  width: 1.125rem;
  height: 1.125rem;
}

.blr-interface-mark__type {
  position: absolute;
  inset-inline-end: -0.0625rem;
  inset-block-end: -0.0625rem;
  display: inline-flex;
  width: 0.8125rem;
  height: 0.8125rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-border);
  color: var(--ui-text-highlighted);
}

.blr-interface-mark__type :deep(svg) {
  width: 0.5625rem;
  height: 0.5625rem;
  stroke-width: 2.25;
}

.blr-interface-mark[data-size='xs'] {
  width: 1.125rem;
  height: 1.125rem;
  flex-basis: 1.125rem;
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__kind {
  width: 0.875rem;
  height: 0.875rem;
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__type {
  width: 0.6875rem;
  height: 0.6875rem;
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__type :deep(svg) {
  width: 0.4375rem;
  height: 0.4375rem;
}
</style>
