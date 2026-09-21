<script setup lang="ts">
/**
 * The Sketch tab of a Screen, Interface or Experience reading.
 *
 * A Screen draws its own Sketch; selecting a tab draws the child's own Sketch
 * in the same reading, and the address gains the child. A container draws its
 * wall or listing. The derivation is stated once, below the drawing, where
 * every named view states its own.
 */
import type { AnyResourceView, ExperienceView, InterfaceView, ReportWorkspace, ScreenView } from '../utils/reportWorkspace'
import { containerSketch, screenSketch, SKETCH_DERIVATION } from '../utils/sketch'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: ScreenView | InterfaceView | ExperienceView
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
/** The child Screen whose Sketch is drawn instead, by full id; empty for the resource's own. */
const child = defineModel<string>('child', { default: '' })

const isScreen = computed(() => props.resource.kind === 'screen')
const inside = (parentId: string, id: string) => id.startsWith(`${parentId}::`)
/* A child address that names something outside this Screen draws the Screen itself. */
const shown = computed(() => isScreen.value && child.value && inside(props.resource.id, child.value) ? child.value : props.resource.id)
const sketch = computed(() => isScreen.value ? screenSketch(props.workspace, shown.value) : null)
const container = computed(() => isScreen.value ? null : containerSketch(props.workspace, props.resource.id))
/* The Screens between the resource and the drawn child, each a way back up. */
const trail = computed(() => {
  if (!isScreen.value || shown.value === props.resource.id) return []
  const steps: Array<{ id: string, title: string }> = []
  for (let id = shown.value; id && id !== props.resource.id; id = (props.workspace.byKey.get(`screen:${id}`) as ScreenView | undefined)?.parentScreenId ?? '') {
    const screen = props.workspace.byKey.get(`screen:${id}`)
    steps.unshift({ id, title: screen?.title ?? id })
  }
  return [{ id: props.resource.id, title: props.resource.title }, ...steps]
})
const heading = useTemplateRef<HTMLElement | HTMLElement[]>('heading')
function selectTab(screenId: string) {
  child.value = screenId === props.resource.id ? '' : screenId
  void nextTick(() => (Array.isArray(heading.value) ? heading.value[0] : heading.value)?.focus({ preventScroll: true }))
}
</script>

<template>
  <div class="space-y-3" data-sketch-reading>
    <nav v-if="trail.length" class="flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Sketch trail" data-sketch-trail>
      <template v-for="(step, index) in trail" :key="step.id">
        <UIcon v-if="index" name="i-lucide-chevron-right" class="size-3 shrink-0" aria-hidden="true" />
        <span v-if="index === trail.length - 1" ref="heading" tabindex="-1" class="font-medium text-highlighted outline-none">{{ step.title }}</span>
        <button v-else type="button" class="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-primary" @click="selectTab(step.id)">{{ step.title }}</button>
      </template>
    </nav>

    <BlrScreenSketch v-if="sketch" :workspace="workspace" :sketch="sketch" :current-tab="child" @open="emit('open', $event)" @tab="selectTab" />
    <BlrContainerSketch v-else-if="container" :workspace="workspace" :sketch="container" @open="emit('open', $event)" />
    <p v-else class="text-sm text-muted">Nothing to sketch: the model names no place for it.</p>

    <details class="blr-topology-about" data-sketch-about>
      <summary>About this view</summary>
      <p>{{ SKETCH_DERIVATION }}</p>
    </details>
  </div>
</template>
