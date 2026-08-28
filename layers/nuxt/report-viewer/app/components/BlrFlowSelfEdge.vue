<script setup lang="ts">
/**
 * A relation an element declares at itself.
 *
 * An Entity may relate to its own kind — an Entity relates to other Entities, a
 * Task blocks another Task — and the format allows it deliberately. Vue Flow's
 * step and bezier edges degenerate when source and target are one node: they
 * render a short stub that reads as a broken line rather than a relationship.
 *
 * The loop is drawn on the source side alone and returns to the same point, so
 * it never crosses the box and never reaches the rank above or below. It lives
 * inside the layout's rank gap, which is why that gap is the only clearance this
 * needs.
 */
import { BaseEdge } from '@vue-flow/core'
import type { CSSProperties } from 'vue'

/* The slot hands every edge prop through; only the ones below belong on the
   path, and the rest would land on it as stray SVG attributes. */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  label?: string
  markerEnd?: string
  style?: CSSProperties
  labelStyle?: CSSProperties
  labelBgStyle?: CSSProperties
  labelBgPadding?: [number, number]
  labelBgBorderRadius?: number
}>()

/**
 * Reach and rise of the loop, in flow units, and the label's clearance above it.
 *
 * The label sits above the loop rather than on it: an edge label carries an
 * opaque background, and a loop is narrow enough that the background would hide
 * the whole shape and leave only a floating verb.
 */
const REACH = 104
const RISE = 32
const LABEL_CLEARANCE = 20

const path = computed(() => {
  const { sourceX: x, sourceY: y } = props
  return `M ${x},${y} C ${x + REACH},${y - RISE} ${x + REACH},${y + RISE} ${x},${y}`
})
const labelX = computed(() => props.sourceX + REACH * 0.5)
const labelY = computed(() => props.sourceY - RISE * 0.75 - LABEL_CLEARANCE)
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path"
    :label="label"
    :label-x="labelX"
    :label-y="labelY"
    :marker-end="markerEnd"
    :style="style"
    :label-style="labelStyle"
    label-show-bg
    :label-bg-style="labelBgStyle"
    :label-bg-padding="labelBgPadding"
    :label-bg-border-radius="labelBgBorderRadius"
  />
</template>
