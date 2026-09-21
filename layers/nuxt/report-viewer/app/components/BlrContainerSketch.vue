<script setup lang="ts">
/**
 * An Interface's or Experience's Sketch: the frame, the strip, and either a
 * wall of miniature Screen Sketches (each opening its Screen) or, for a
 * container with no Screens, the Capabilities available here listed as the
 * frame would list them. Nothing invents a command, a path or a payload.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { ContainerSketch, SketchMiniature } from '../utils/sketch'

const props = defineProps<{
  workspace: ReportWorkspace
  sketch: ContainerSketch
  /** A Storyboard frame draws the Step as one line inside the frame instead of the wall or listing. */
  line?: { prompt: boolean, text: string } | null
  product?: boolean
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
function open(key: string) {
  const resource = props.workspace.byKey.get(key)
  if (resource) emit('open', resource)
}
const kind = computed(() => props.sketch.frame.kind)
const miniatureGroups = (miniature: SketchMiniature) => miniature.groupLabels.map((title, index) => ({ entityId: `${index}:${title}`, title }))
/* How the frame writes a line of the Step: a prompt or output in a terminal, a request or response in a pane, a bubble in a transcript. */
const lineRole = computed(() => {
  if (!props.line) return ''
  if (kind.value === 'terminal') return props.line.prompt ? 'prompt' : 'output'
  if (kind.value === 'transcript') return props.line.prompt ? 'actor' : 'system'
  return props.line.prompt ? 'request' : 'response'
})
</script>

<template>
  <div class="blr-sketch" :data-container-id="sketch.containerId" data-container-sketch>
    <BlrSketchFrame :frame="sketch.frame" :entry="sketch.entry" :strip="sketch.strip" :product="product" :label="`Sketch of ${sketch.title}`" @open="open">
      <!-- A Storyboard frame of a Screen-less place: the Step as one line. -->
      <div v-if="line" class="blr-sketch-lines" :data-kind="kind === 'transcript' ? 'transcript' : undefined" data-sketch-line-body>
        <span v-if="kind === 'transcript'" class="blr-sketch-bubble" :data-side="lineRole"><span>{{ line.text }}</span></span>
        <span v-else class="blr-sketch-line-text" :data-role="lineRole === 'output' ? undefined : lineRole">{{ line.text }}</span>
      </div>

      <!-- The wall: the container's top-level Screens, each miniature opening its Screen. -->
      <div v-else-if="sketch.wall" class="blr-sketch-wall" data-sketch-wall>
        <div v-for="group in sketch.wall" :key="group.experienceId || 'shared'" class="blr-sketch-wall-group" :data-experience-id="group.experienceId || undefined">
          <p v-if="group.title" class="blr-sketch-wall-label">
            <BlrResourceLink v-if="group.experienceKey" :resource-key="group.experienceKey" class="hover:underline" @open="open(group.experienceKey)">{{ group.title }}</BlrResourceLink>
            <template v-else>{{ group.title }}</template>
          </p>
          <div class="blr-sketch-wall-grid">
            <BlrResourceLink v-for="miniature in group.miniatures" :key="miniature.screenId" :resource-key="miniature.screenKey" class="blr-sketch-miniature" :aria-label="`Open Screen ${miniature.title}`" data-sketch-miniature @open="open(miniature.screenKey)">
              <div class="blr-sketch" data-miniature>
                <BlrSketchPage :title="miniature.title" :groups="miniatureGroups(miniature)" :actions="[]" :action-count="miniature.actionCount" :tabs="miniature.tabs" miniature />
              </div>
            </BlrResourceLink>
          </div>
        </div>
      </div>

      <!-- No Screens: the Capabilities available here, as the frame would list them. -->
      <div v-else-if="kind === 'transcript'" class="blr-sketch-lines" data-kind="transcript" data-sketch-listing>
        <span class="blr-sketch-bubble" data-side="system">
          <span v-for="item in sketch.listing" :key="item.capabilityId">{{ item.title }}</span>
        </span>
      </div>
      <div v-else class="blr-sketch-lines" data-sketch-listing>
        <span v-for="item in sketch.listing" :key="item.capabilityId" class="blr-sketch-line-text" :data-role="kind === 'terminal' ? 'listing' : undefined">
          <BlrResourceLink :resource-key="item.capabilityKey" class="hover:underline" @open="open(item.capabilityKey)">{{ item.title }}</BlrResourceLink>
        </span>
      </div>
    </BlrSketchFrame>
  </div>
</template>
