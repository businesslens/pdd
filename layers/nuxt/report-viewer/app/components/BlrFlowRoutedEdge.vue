<script setup lang="ts">
/**
 * An edge drawn along the route the layout computed for it.
 *
 * Dagre places every edge as well as every node: a skip arc is routed around
 * the ranks it passes. Vue Flow's step edge knows none of that — it draws
 * source handle to target handle, which for two states in one column is a
 * line hidden behind the boxes between them. This edge takes the layout's
 * points, rounds the corners, and puts the label at the path's middle.
 *
 * An arc against the flow gets no route from dagre worth drawing — it ranks
 * the edge reversed and hands back a line through both nodes — so it is looped
 * round the side instead: out of the source, along the column's edge, and back
 * into the target from the direction the target expects.
 */
import { BaseEdge } from '@vue-flow/core'
import type { CSSProperties } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  data?: { points?: Array<{ x: number, y: number }>, backward?: boolean, direction?: 'TB' | 'LR' }
  label?: string
  markerEnd?: string
  style?: CSSProperties
  labelStyle?: CSSProperties
  labelBgStyle?: CSSProperties
  labelBgPadding?: [number, number]
  labelBgBorderRadius?: number
}>()

const RADIUS = 10
/** How far a backward loop steps out of the flow before turning, and how far to the side it runs. */
const LOOP_STEP = 22
const LOOP_SIDE = 118

interface Point { x: number, y: number }

function backwardLoop(): Point[] {
  const { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty } = props
  if (props.data?.direction === 'LR') {
    const rail = Math.max(sy, ty) + LOOP_SIDE
    return [{ x: sx, y: sy }, { x: sx + LOOP_STEP, y: sy }, { x: sx + LOOP_STEP, y: rail }, { x: tx - LOOP_STEP, y: rail }, { x: tx - LOOP_STEP, y: ty }, { x: tx, y: ty }]
  }
  const rail = Math.max(sx, tx) + LOOP_SIDE
  return [{ x: sx, y: sy }, { x: sx, y: sy + LOOP_STEP }, { x: rail, y: sy + LOOP_STEP }, { x: rail, y: ty - LOOP_STEP }, { x: tx, y: ty - LOOP_STEP }, { x: tx, y: ty }]
}

/**
 * The handles at either end, and the layout's interior points between them.
 * Dagre emits a point per rank a skip arc passes, so a straight rail arrives as
 * several short collinear segments; they are merged, so the rail is one segment
 * and the label finds it.
 */
const vertices = computed<Point[]>(() => {
  if (props.data?.backward) return backwardLoop()
  const interior = (props.data?.points ?? []).slice(1, -1)
  const all = [{ x: props.sourceX, y: props.sourceY }, ...interior, { x: props.targetX, y: props.targetY }]
  const distinct = all.filter((point, index) => index === 0 || Math.hypot(point.x - all[index - 1]!.x, point.y - all[index - 1]!.y) > 1)
  return distinct.filter((point, index) => {
    if (index === 0 || index === distinct.length - 1) return true
    const previous = distinct[index - 1]!
    const next = distinct[index + 1]!
    const cross = (point.x - previous.x) * (next.y - point.y) - (point.y - previous.y) * (next.x - point.x)
    return Math.abs(cross) > 2 * Math.hypot(next.x - previous.x, next.y - previous.y)
  })
})

const path = computed(() => {
  const points = vertices.value
  if (points.length < 2) return ''
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]!
    const corner = points[index]!
    const next = points[index + 1]!
    const into = Math.hypot(corner.x - previous.x, corner.y - previous.y)
    const outOf = Math.hypot(next.x - corner.x, next.y - corner.y)
    const radius = Math.min(RADIUS, into / 2, outOf / 2)
    const entry = { x: corner.x - (corner.x - previous.x) / into * radius, y: corner.y - (corner.y - previous.y) / into * radius }
    const exit = { x: corner.x + (next.x - corner.x) / outOf * radius, y: corner.y + (next.y - corner.y) / outOf * radius }
    d += ` L ${entry.x},${entry.y} Q ${corner.x},${corner.y} ${exit.x},${exit.y}`
  }
  const last = points[points.length - 1]!
  return `${d} L ${last.x},${last.y}`
})

/**
 * Where the label sits: the middle of the path's longest segment. A label on a
 * rail — the long side of a loop, or the vertical run of a skip arc — is set
 * beside the rail rather than across it, so two arcs passing one row do not
 * stack their labels on the same spot.
 */
const middle = computed<Point>(() => {
  const points = vertices.value
  let best: { from: Point, to: Point, length: number } | null = null
  for (const [index, point] of points.slice(1).entries()) {
    const from = points[index]!
    const length = Math.hypot(point.x - from.x, point.y - from.y)
    if (!best || length > best.length) best = { from, to: point, length }
  }
  if (!best) return { x: props.targetX, y: props.targetY }
  const centre = { x: (best.from.x + best.to.x) / 2, y: (best.from.y + best.to.y) / 2 }
  const vertical = Math.abs(best.to.y - best.from.y) > Math.abs(best.to.x - best.from.x)
  const rail = vertices.value.length > 3
  if (!rail) return centre
  const width = (props.label?.length ?? 0) * 6.2 + 12
  /* Beside the rail on its outer side, away from the column it runs past. */
  const axis = (props.sourceX + props.targetX) / 2
  const side = centre.x >= axis ? 1 : -1
  return vertical ? { x: centre.x + side * (width / 2 + 8), y: centre.y } : { x: centre.x, y: centre.y + 16 }
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path"
    :label="label"
    :label-x="middle.x"
    :label-y="middle.y"
    :marker-end="markerEnd"
    :style="style"
    :label-style="labelStyle"
    label-show-bg
    :label-bg-style="labelBgStyle"
    :label-bg-padding="labelBgPadding"
    :label-bg-border-radius="labelBgBorderRadius"
  />
</template>
