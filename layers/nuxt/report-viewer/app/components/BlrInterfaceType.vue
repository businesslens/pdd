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
  width: var(--blr-interface-mark-regular);
  height: var(--blr-interface-mark-regular);
  flex: 0 0 var(--blr-interface-mark-regular);
  align-items: flex-start;
  justify-content: flex-start;
}

.blr-interface-mark__kind {
  width: var(--blr-interface-kind-regular);
  height: var(--blr-interface-kind-regular);
}

.blr-interface-mark__type {
  position: absolute;
  inset-inline-end: var(--blr-interface-badge-offset-regular);
  inset-block-end: var(--blr-interface-badge-offset-regular);
  display: inline-flex;
  width: var(--blr-interface-badge-regular);
  height: var(--blr-interface-badge-regular);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-border);
  color: var(--ui-text-highlighted);
}

.blr-interface-mark__type :deep(svg) {
  width: var(--blr-interface-badge-glyph-regular);
  height: var(--blr-interface-badge-glyph-regular);
  stroke-width: 2.25;
}

.blr-interface-mark[data-size='xs'] {
  width: var(--blr-interface-mark-dense);
  height: var(--blr-interface-mark-dense);
  flex-basis: var(--blr-interface-mark-dense);
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__kind {
  width: var(--blr-interface-kind-dense);
  height: var(--blr-interface-kind-dense);
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__type {
  inset-inline-end: var(--blr-interface-badge-offset-dense);
  inset-block-end: var(--blr-interface-badge-offset-dense);
  width: var(--blr-interface-badge-dense);
  height: var(--blr-interface-badge-dense);
}

.blr-interface-mark[data-size='xs'] .blr-interface-mark__type :deep(svg) {
  width: var(--blr-interface-badge-glyph-dense);
  height: var(--blr-interface-badge-glyph-dense);
}
</style>
