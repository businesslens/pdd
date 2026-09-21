<script setup lang="ts">
/**
 * One route of one Scenario as frames, scrolled sideways: each Step that names
 * a place is that place's Sketch with the Step's facts and Capability lit, a
 * Step shared by every route is a narrow interstitial, a condition is a note.
 * Selecting a frame selects the Step; the Steps list follows, and vice versa.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import type { Storyboard } from '../utils/sketch'
import { STORYBOARD_DERIVATION } from '../utils/sketch'

const props = defineProps<{
  workspace: ReportWorkspace
  storyboard: Storyboard
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
/** The selected Step, by zero-based index. */
const selected = defineModel<number | null>('selected', { default: null })
const strip = useTemplateRef('strip')

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
/** Bring the selected frame into view without moving the page around the strip. */
function reveal(index: number | null) {
  if (index === null || !strip.value) return
  const frame = strip.value.querySelector<HTMLElement>(`[data-storyboard-frame][data-step="${index + 1}"]`)
  if (!frame) return
  const bounds = strip.value.getBoundingClientRect()
  const target = frame.getBoundingClientRect()
  const left = target.left - bounds.left + strip.value.scrollLeft - (bounds.width - target.width) / 2
  strip.value.scrollTo({ left: Math.max(0, left), behavior: reduced() ? 'auto' : 'smooth' })
}
watch(selected, index => { void nextTick(() => reveal(index)) })
watch(() => props.storyboard.routeId, () => { void nextTick(() => reveal(selected.value)) })
onMounted(() => reveal(selected.value))

/* A click on the frame selects its Step, unless it landed on a link inside the Sketch. */
function select(index: number, event?: Event) {
  if (event && (event.target as HTMLElement).closest('a, button, [tabindex]') !== event.currentTarget && (event.target as HTMLElement).closest('a, button')) return
  selected.value = index
}
function open(resource: AnyResourceView) { emit('open', resource) }
</script>

<template>
  <div data-storyboard :data-route-id="storyboard.routeId">
    <div ref="strip" class="blr-storyboard" role="list" :aria-label="`Storyboard of the ${storyboard.routeName} route`">
      <article
        v-for="frame in storyboard.frames"
        :key="frame.index"
        role="listitem"
        class="blr-storyboard-frame"
        :data-kind="frame.kind"
        :data-step="frame.index + 1"
        :data-selected="selected === frame.index || undefined"
        data-storyboard-frame
        @click="select(frame.index, $event)"
      >
        <p class="blr-storyboard-label" data-storyboard-capability>
          <BlrResourceLink v-if="frame.capabilityKey" :resource-key="frame.capabilityKey" class="hover:underline" @open="open(workspace.byKey.get(frame.capabilityKey)!)">{{ frame.capabilityTitle }}</BlrResourceLink>
        </p>

        <BlrScreenSketch v-if="frame.kind === 'sketch'" :workspace="workspace" :sketch="frame.sketch" :product="frame.product" @open="open" />
        <BlrContainerSketch v-else-if="frame.kind === 'container'" :workspace="workspace" :sketch="frame.container" :line="frame.line" :product="frame.product" @open="open" />
        <!-- The card carries the text, so the caption below it keeps only the index. -->
        <div v-else class="blr-storyboard-card" :data-kind="frame.kind">
          <span>{{ frame.text }}</span>
        </div>

        <button type="button" class="blr-storyboard-caption" :aria-pressed="selected === frame.index" :aria-label="`Select step ${frame.index + 1}`" @click.stop="select(frame.index)">
          <b>{{ frame.index + 1 }}</b><span v-if="frame.kind === 'sketch' || frame.kind === 'container'">{{ frame.text }}</span>
        </button>
      </article>
    </div>
    <details class="blr-storyboard-about" data-storyboard-about>
      <summary>About this view</summary>
      <p>{{ STORYBOARD_DERIVATION }}</p>
    </details>
  </div>
</template>
