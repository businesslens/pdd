<script setup lang="ts">
/**
 * What one Step does to one Entity.
 *
 * This is the most specific thing the model says about an Entity, and the only
 * place it can be said: the Scenario's own `entityIds` is this set deduped, so
 * it answers *what* the reading touches and never *which Step does it*.
 *
 * The tail of the arrow is derived. A Step names the state it leaves the Entity
 * in; the lifecycle says which states reach that one by this Capability. Where
 * exactly one does, the chip reads `Unread → Read` without anything being
 * authored twice. Where several do, it shows the destination alone and names
 * the alternatives in the tooltip rather than picking one.
 *
 * Drawn as a reference to a resource, exactly as the Step's Actor is — the
 * Entity's own mark inside a chip that opens it. States are not resources, so
 * they stay plain terminal readings rather than second targets competing with
 * the first.
 */
import type { AnyResourceView, EntityView, ReportWorkspace, ScenarioStepMentionView } from '../utils/reportWorkspace'
import { ENTITY_KIND_META, resolveResource } from '../utils/reportWorkspace'
import { slotColor } from '../utils/reportPalette'

const props = defineProps<{
  workspace: ReportWorkspace
  mention: ScenarioStepMentionView
  /** An end-state summary states where a thing was left, not what a Step did. */
  outcome?: boolean
}>()

const emit = defineEmits<{ select: [resource: AnyResourceView] }>()

const colorMode = useColorMode()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const entity = computed<EntityView | undefined>(() => {
  const resource = resolveResource(props.workspace, 'entity', props.mention.entityId)
  return resource?.kind === 'entity' ? resource : undefined
})

const color = computed(() => slotColor(
  ENTITY_KIND_META.entity.slot,
  mounted.value && colorMode.value === 'dark'
))

/* `changes` is the default and the ordinary case, so it is the one effect that
   costs no word — a label on every chip would separate nothing. */
const effectLabel = computed(() => ({
  creates: 'created',
  changes: '',
  removes: 'removed',
  /* Past participle, as the others are: the label says what happened to the
     thing, not what the Step does. "Collection reads" read as the Collection
     doing the reading. */
  reads: 'read'
}[props.mention.effect]))

/* A read is a mention, not a claim about what can alter the thing. It reads at
   a lower weight than a change so a row of both cannot be misread as a row of
   changes — absence of a read means nothing, and it must not look like it does. */
const isRead = computed(() => props.mention.effect === 'reads')

const from = computed(() => props.mention.fromStates.length === 1 ? props.mention.fromStates[0] : '')

const description = computed(() => {
  const name = entity.value?.title ?? props.mention.entityId
  if (props.mention.effect === 'reads') return `This Step reads ${name} without changing it`
  if (props.outcome) {
    return props.mention.state
      ? `The Scenario leaves ${name} in "${props.mention.state}"`
      : `The Scenario changes ${name}`
  }
  if (props.mention.effect === 'removes') return `This Step ends ${name}`
  if (props.mention.effect === 'creates') {
    return props.mention.state
      ? `This Step brings ${name} into being, in the state "${props.mention.state}"`
      : `This Step brings ${name} into being`
  }
  if (!props.mention.state) return `This Step changes ${name}`
  if (from.value) return `This Step moves ${name} from "${from.value}" to "${props.mention.state}"`
  if (props.mention.fromStates.length > 1) {
    return `This Step leaves ${name} in "${props.mention.state}", reached from ${props.mention.fromStates.join(' or ')}`
  }
  return `This Step leaves ${name} in "${props.mention.state}"`
})
</script>

<template>
  <UTooltip v-if="entity" :text="description" :delay-duration="150">
    <button
      type="button"
      class="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 font-sans text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="isRead
        ? 'border-dashed border-muted bg-transparent font-normal text-muted hover:border-default hover:text-default'
        : 'border-default bg-elevated/60 font-medium text-highlighted hover:border-accented hover:bg-elevated'"
      :aria-label="`Open Entity ${entity.title}`"
      @click="emit('select', entity)"
    >
      <UIcon
        :name="ENTITY_KIND_META.entity.icon"
        class="size-3.5 shrink-0"
        :style="{ color, opacity: isRead ? 0.55 : 1 }"
      />
      <span class="min-w-0 truncate">{{ entity.title }}</span>
      <span v-if="effectLabel" class="shrink-0 font-normal text-muted">{{ effectLabel }}</span>
      <template v-if="mention.state">
        <span v-if="from" class="min-w-0 truncate font-normal text-muted">{{ from }}</span>
        <UIcon name="i-lucide-arrow-right" class="size-3 shrink-0 text-dimmed" />
        <span class="min-w-0 truncate text-default">{{ mention.state }}</span>
      </template>
    </button>
  </UTooltip>
</template>
