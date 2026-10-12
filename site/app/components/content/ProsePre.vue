<script setup lang="ts">
import UProsePre, { type ProsePreProps } from '@nuxt/ui/runtime/components/prose/Pre.vue'
import { pddKitAgentCommandLines } from '~/utils/syntaxCommandTokens'
import { BRAND_WARM_COMMAND_TOKEN_COLORS } from '~/utils/syntaxTheme'

const props = defineProps<ProsePreProps>()

const agentCommandLines = computed(() =>
  pddKitAgentCommandLines(props.code, props.language)
)

/*
 * A long line scrolls the block sideways on a phone, and a scrollable region a
 * keyboard cannot reach fails WCAG 2.1.1. So the `<pre>` takes a tab stop, but
 * only while it overflows: a block that fits needs no stop of its own.
 *
 * Set on the element rather than passed as `tabindex`, because Nuxt UI's Prose
 * Pre forwards attributes to both its wrapper and its `<pre>`, which would add
 * two stops per block, and the wrapper is not what scrolls. Whether a block
 * overflows is only known after layout, so this runs in the browser, and again
 * whenever the block resizes or the web fonts finish loading.
 */
const block = useTemplateRef<{ $el: HTMLElement }>('block')
let resizeObserver: ResizeObserver | undefined

function syncScrollFocus(pre: HTMLPreElement) {
  if (pre.scrollWidth > pre.clientWidth) pre.tabIndex = 0
  else pre.removeAttribute('tabindex')
}

onMounted(() => {
  const pre = block.value?.$el.querySelector('pre')
  if (!pre) return
  syncScrollFocus(pre)
  resizeObserver = new ResizeObserver(() => syncScrollFocus(pre))
  resizeObserver.observe(pre)
  // The `<pre>` keeps its size when a web font swaps in, but its content can
  // grow past it, and the inline `<code>` inside reports no resize of its own.
  void document.fonts.ready.then(() => syncScrollFocus(pre))
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <UProsePre
    ref="block"
    v-bind="props"
    :data-pdd-kit-agent-command="agentCommandLines ? '' : undefined"
  >
    <code v-if="agentCommandLines"><span
      v-for="(line, lineIndex) in agentCommandLines"
      :key="lineIndex"
      class="line"
      :class="{ highlight: props.highlights?.includes(lineIndex + 1) }"
    ><span
      v-for="(part, partIndex) in line.parts"
      :key="partIndex"
      :data-syntax-token="part.role"
      :style="{ color: part.role ? BRAND_WARM_COMMAND_TOKEN_COLORS[part.role] : undefined }"
    >{{ part.text }}</span></span></code>
    <slot v-else />
  </UProsePre>
</template>
