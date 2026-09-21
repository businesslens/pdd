<script setup lang="ts">
/** One Screen's Sketch: its container's frame and strip around its page. */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { ScreenSketch } from '../utils/sketch'

const props = defineProps<{
  workspace: ReportWorkspace
  sketch: ScreenSketch
  /** A Product Step's frame wears the badge. */
  product?: boolean
  miniature?: boolean
  currentTab?: string
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView], tab: [screenId: string] }>()
function open(key: string) {
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('open', resource)
}
</script>

<template>
  <div class="blr-sketch" :data-miniature="miniature || undefined" :data-screen-id="sketch.screenId" data-screen-sketch>
    <BlrSketchFrame :frame="sketch.frame" :entry="sketch.entry" :strip="sketch.strip" :product="product" :miniature="miniature" :label="`Sketch of ${sketch.title}`" @open="open">
      <BlrSketchPage :title="sketch.title" :groups="sketch.groups" :actions="sketch.actions" :tabs="sketch.tabs" :current-tab="currentTab" :miniature="miniature" @tab="emit('tab', $event)" />
    </BlrSketchFrame>
  </div>
</template>
