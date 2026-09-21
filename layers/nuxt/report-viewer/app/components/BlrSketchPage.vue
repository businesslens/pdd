<script setup lang="ts">
/**
 * The page inside a frame, in the contract's fixed order: title, presents
 * (one group per Entity, placeholders and fields), actions (one pill per
 * exposed Capability), tabs (one per child Screen). A miniature shows the
 * title, the group labels and the action count only.
 */
import type { SketchAction, SketchGroup, SketchTab } from '../utils/sketch'

const props = defineProps<{
  title: string
  groups: Array<Pick<SketchGroup, 'entityId' | 'title'> & Partial<SketchGroup>>
  actions: SketchAction[]
  tabs: SketchTab[]
  /** Which tab is the reading on, when the page is a parent whose child is open. */
  currentTab?: string
  miniature?: boolean
  /** The miniature's action count, where the actions themselves are not carried. */
  actionCount?: number
}>()
const emit = defineEmits<{ tab: [screenId: string] }>()

const actionTotal = computed(() => props.actionCount ?? props.actions.length)
const stepsOf = (action: SketchAction) => action.steps.length
  ? action.steps.map(step => `${step.scenarioTitle} · ${step.index + 1}. ${step.text}`).join('\n')
  : 'No Step is placed on this Screen for it'
</script>

<template>
  <div class="blr-sketch-page" data-sketch-page>
    <p class="blr-sketch-title" data-sketch-title>{{ title }}</p>

    <div v-if="groups.length" class="blr-sketch-groups" data-sketch-presents>
      <div v-for="group in groups" :key="group.entityId" class="blr-sketch-group" :data-lit="group.lit || undefined" :data-entity-id="group.entityId" data-sketch-group>
        <span class="blr-sketch-group-label">{{ group.title }}</span>
        <template v-if="!miniature">
          <div v-for="(line, index) in group.lines ?? []" :key="`${line.kind}-${line.label}-${index}`" class="blr-sketch-line" :data-kind="line.kind" :data-lit="line.lit || undefined" data-sketch-line>
            <span v-if="line.kind === 'placeholder'" class="blr-sketch-line-label">{{ line.label }}</span>
            <i v-if="line.kind !== 'field'" class="blr-sketch-bar" aria-hidden="true" />
            <span v-else class="blr-sketch-field"><span>{{ line.label }}</span></span>
          </div>
          <span v-if="group.note" class="blr-sketch-note">{{ group.note }}</span>
        </template>
      </div>
    </div>

    <template v-if="miniature">
      <span v-if="actionTotal" class="blr-sketch-meta" data-sketch-action-count>{{ actionTotal }} {{ actionTotal === 1 ? 'action' : 'actions' }}</span>
    </template>
    <div v-else-if="actions.length" class="blr-sketch-actions" data-sketch-actions>
      <UTooltip v-for="action in actions" :key="action.capabilityId" :text="stepsOf(action)" :delay-duration="150" :ui="{ content: 'max-w-md h-auto whitespace-pre-line py-1.5' }">
        <span class="blr-sketch-action" tabindex="0" :data-dashed="action.dashed || undefined" :data-lit="action.lit || undefined" :data-capability-id="action.capabilityId" data-sketch-action>
          <span>{{ action.title }}</span>
        </span>
      </UTooltip>
    </div>

    <div v-if="tabs.length" class="blr-sketch-tabs" role="tablist" data-sketch-tabs>
      <template v-for="tab in tabs" :key="tab.screenId">
        <span v-if="miniature" class="blr-sketch-tab">{{ tab.title }}</span>
        <button v-else type="button" class="blr-sketch-tab" role="tab" :aria-selected="tab.screenId === currentTab" :aria-current="tab.screenId === currentTab ? 'page' : undefined" :data-screen-id="tab.screenId" @click="emit('tab', tab.screenId)">{{ tab.title }}</button>
      </template>
    </div>
  </div>
</template>
