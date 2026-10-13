<script setup lang="ts">
/**
 * The authored interaction contract of an Interface, never guessed from its name.
 *
 * The mark normally badges the type onto the Interface's plug, so a row in a
 * mixed list says both what it is and how it is reached. Where the surface has
 * already named the kind — a filter labelled `Interfaces`, whose every option is
 * one — the plug says nothing the reader does not have, and the mark spends its
 * whole slot on the type instead. That is what `ReportEntityMark` does with a
 * facet, for the same reason.
 */
import type { ReportInterface } from 'pdd-toolkit/report'
import { INTERFACE_TYPE_META } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = withDefaults(defineProps<{
  type: ReportInterface['type']
  labelled?: boolean
  size?: 'xs' | 'sm'
  /** False where the surface already names the kind: draw the type alone. */
  withKind?: boolean
}>(), { labelled: false, size: 'sm', withKind: true })

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
      <UIcon
        v-if="!withKind"
        :name="meta.icon"
        class="report-interface-mark__solo shrink-0"
        :data-size="size"
        :style="{ color: interfaceColor }"
      />
      <span v-else class="report-interface-mark" :data-size="size">
        <UIcon name="i-lucide-plug" class="report-interface-mark__kind" :style="{ color: interfaceColor }" />
        <span class="report-interface-mark__type">
          <UIcon :name="meta.icon" />
        </span>
      </span>
      <span v-if="labelled" class="text-xs font-medium">{{ meta.label }}</span>
    </span>
  </UTooltip>
</template>

<style scoped>
.report-interface-mark__solo {
  width: var(--report-resource-mark-regular);
  height: var(--report-resource-mark-regular);
  flex-basis: var(--report-resource-mark-regular);
}

.report-interface-mark__solo[data-size='xs'] {
  width: var(--report-resource-mark-dense);
  height: var(--report-resource-mark-dense);
  flex-basis: var(--report-resource-mark-dense);
}

.report-interface-mark {
  position: relative;
  display: inline-flex;
  width: var(--report-interface-mark-regular);
  height: var(--report-interface-mark-regular);
  flex: 0 0 var(--report-interface-mark-regular);
  align-items: flex-start;
  justify-content: flex-start;
}

.report-interface-mark__kind {
  width: var(--report-interface-kind-regular);
  height: var(--report-interface-kind-regular);
}

.report-interface-mark__type {
  position: absolute;
  inset-inline-end: var(--report-interface-badge-offset-regular);
  inset-block-end: var(--report-interface-badge-offset-regular);
  display: inline-flex;
  width: var(--report-interface-badge-regular);
  height: var(--report-interface-badge-regular);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--ui-bg);
  box-shadow: 0 0 0 1px var(--ui-border);
  color: var(--ui-text-highlighted);
}

.report-interface-mark__type :deep(svg) {
  width: var(--report-interface-badge-glyph-regular);
  height: var(--report-interface-badge-glyph-regular);
  stroke-width: 2.25;
}

.report-interface-mark[data-size='xs'] {
  width: var(--report-interface-mark-dense);
  height: var(--report-interface-mark-dense);
  flex-basis: var(--report-interface-mark-dense);
}

.report-interface-mark[data-size='xs'] .report-interface-mark__kind {
  width: var(--report-interface-kind-dense);
  height: var(--report-interface-kind-dense);
}

.report-interface-mark[data-size='xs'] .report-interface-mark__type {
  inset-inline-end: var(--report-interface-badge-offset-dense);
  inset-block-end: var(--report-interface-badge-offset-dense);
  width: var(--report-interface-badge-dense);
  height: var(--report-interface-badge-dense);
}

.report-interface-mark[data-size='xs'] .report-interface-mark__type :deep(svg) {
  width: var(--report-interface-badge-glyph-dense);
  height: var(--report-interface-badge-glyph-dense);
}
</style>
