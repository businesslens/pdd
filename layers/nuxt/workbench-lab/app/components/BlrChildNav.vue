<script setup lang="ts">
/**
 * What a Scenario page carries about the family it belongs to.
 *
 * The parent link is not optional in any variation — losing the Capability a
 * Scenario belongs to was the original complaint, and the breadcrumb now
 * carries it too. What varies is whether the page also lets you *move* between
 * siblings without going back up.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META } from '../utils/model'
import { parentOf, siblingsOf } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{ open: [entity: AnyEntityView] }>()

const { child } = useWorkbenchLab()

const parent = computed(() => parentOf(props.workspace, props.entity))
const siblings = computed(() => siblingsOf(props.workspace, props.entity))
const index = computed(() => siblings.value.findIndex(item => item.key === props.entity.key))
const previous = computed(() => index.value > 0 ? siblings.value[index.value - 1] : null)
const next = computed(() => index.value >= 0 && index.value < siblings.value.length - 1
  ? siblings.value[index.value + 1]
  : null)

const parentMeta = computed(() => parent.value ? ENTITY_KIND_META[parent.value.kind] : null)
/** The rail is a page-level companion; cards and inline keep the plain link. */
const showsRail = computed(() => child.value === 'rail' && siblings.value.length > 1)
const showsStepper = computed(() => (child.value === 'stepper' || child.value === 'split')
  && siblings.value.length > 1)

defineExpose({ showsRail })
</script>

<template>
  <div v-if="parent" class="space-y-3">
    <!-- Always: which parent this belongs to, as a link back into it. -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
      @click="emit('open', parent)"
    >
      <UIcon v-if="parentMeta" :name="parentMeta.icon" class="size-3.5" />
      <span class="text-dimmed">{{ parentMeta?.label }}</span>
      <span class="font-medium underline decoration-(--ui-border-accented) underline-offset-3">{{ parent.title }}</span>
    </button>

    <!-- STEPPER / SPLIT — position and movement without leaving. -->
    <div v-if="showsStepper" class="flex flex-wrap items-center gap-2">
      <UButton
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-lucide-chevron-left"
        :disabled="!previous"
        :label="previous ? previous.title : 'First'"
        class="max-w-56"
        :ui="{ label: 'truncate' }"
        @click="previous && emit('open', previous)"
      />
      <span class="blr-childnav-count">{{ index + 1 }} of {{ siblings.length }}</span>
      <UButton
        color="neutral"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-chevron-right"
        :disabled="!next"
        :label="next ? next.title : 'Last'"
        class="max-w-56"
        :ui="{ label: 'truncate' }"
        @click="next && emit('open', next)"
      />
    </div>
  </div>
</template>

<style scoped>
.blr-childnav-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ui-text-dimmed);
}
</style>
