<script setup lang="ts">
/**
 * A relation a resource declares at itself.
 *
 * An Entity may relate to its own kind — an Entity relates to other Entities, a
 * Task blocks another Task — and the format allows it deliberately; a state may
 * move to itself, when a Step changes a thing and says which state it stays in.
 * Vue Flow's step and bezier edges degenerate when source and target are one
 * node: they render a short stub that reads as a broken line rather than a
 * relationship.
 *
 * The loop is drawn off the node's right side and returns to the same point, so
 * it never crosses the box and never reaches the rank above or below. Where it
 * leaves from is the layout's choice, not the loop's: a left-to-right graph
 * hands the loop the right-hand handle, but a top-to-bottom one hands it the
 * bottom handle, and a loop hung from there sits on the next rank's arc with
 * its label over the state's own name. So the loop reads the layout direction
 * and, for a vertical graph, anchors itself at the right edge's midpoint from
 * the node's own measured size.
 */
import { BaseEdge } from '@vue-flow/core'
import type { GraphNode } from '@vue-flow/core'
import type { CSSProperties } from 'vue'
import { FLOW_NODE_HEIGHT, FLOW_NODE_WIDTH } from '../utils/flowGraph'

/* The slot hands every edge prop through; only the ones below belong on the
   path, and the rest would land on it as stray SVG attributes. */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  /** The node the loop belongs to, with its placed position and measured size. */
  sourceNode?: GraphNode
  /** What `layoutFlow` stamps on every edge it placed. */
  data?: { direction?: 'TB' | 'LR' }
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
/** The routed edge's estimate of a label's drawn width, for the same 10px mono face. */
const LABEL_CHAR_WIDTH = 6.2
const LABEL_PADDING = 12

const size = computed(() => ({
  width: props.sourceNode?.dimensions.width || Number(props.sourceNode?.width) || FLOW_NODE_WIDTH,
  height: props.sourceNode?.dimensions.height || Number(props.sourceNode?.height) || FLOW_NODE_HEIGHT
}))

/**
 * Where the loop leaves and returns. A left-to-right layout's source handle is
 * already the right edge's midpoint; a top-to-bottom layout's is the bottom
 * edge's, so the anchor is moved to the right edge from the node's placed
 * position and size.
 */
const anchor = computed(() => {
  const node = props.sourceNode
  if (props.data?.direction !== 'TB' || !node) return { x: props.sourceX, y: props.sourceY }
  return { x: node.computedPosition.x + size.value.width, y: node.computedPosition.y + size.value.height / 2 }
})

const path = computed(() => {
  const { x, y } = anchor.value
  return `M ${x},${y} C ${x + REACH},${y - RISE} ${x + REACH},${y + RISE} ${x},${y}`
})
/* Centred over the loop, unless the label is wider than the loop: then it is
   pushed out until its left edge clears the node, so it never overhangs the
   box it belongs to. */
const labelWidth = computed(() => (props.label?.length ?? 0) * LABEL_CHAR_WIDTH + LABEL_PADDING)
const labelX = computed(() => anchor.value.x + Math.max(REACH * 0.5, labelWidth.value / 2 + 4))
const labelY = computed(() => anchor.value.y - RISE * 0.75 - LABEL_CLEARANCE)
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
