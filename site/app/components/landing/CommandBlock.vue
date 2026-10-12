<script setup lang="ts">
import { BRAND_WARM_COMMAND_TOKEN_COLORS } from '~/utils/syntaxTheme'

/**
 * A command, shown the way this site shows commands: mono type on its own
 * ground, a prompt glyph, and one control that copies it.
 *
 * This is the hero's treatment without the terminal title bar. The bar names a
 * working directory, which only means anything where the command is a shell
 * command run somewhere in particular — everywhere else it is chrome around a
 * line of text.
 *
 * **`prompt` is `null` for anything not typed at a shell.** A `$` in front of
 * `/pdd-verify` would be instructing the reader to type a slash
 * command into their terminal, where it does nothing. The prompt is a claim
 * about where a command runs, not decoration.
 *
 * The copy control names what it copies rather than saying "Copy command",
 * because a page with three of these gives a screen reader three identical
 * buttons. Callers with their own wording pass it — the hero does, and
 * `landing.desktop.spec.ts` addresses that button by name.
 *
 * **`copyable` is not always worth it.** A command a reader is being offered
 * wants a control; a command named inside a diagram, as a label for what runs a
 * step, is being read rather than taken. The control there is a second thing to
 * look at in a cell that has three already. Without it the line has no reason
 * to hug one edge, which is what `align` is for.
 *
 * **The default slot replaces the drawn tokens, never the copied text.** A
 * caller that needs part of the line to be interactive (the Blueprint slug)
 * draws the line itself; `command` stays what the copy control takes.
 */
const { command, prompt = '$', size = 'md', align = 'start', copyable = true, nowrap = false, copyLabel, copiedLabel } = defineProps<{
  command: string
  /** The prompt glyph. `null` where the command is not run at a shell. */
  prompt?: string | null
  /** `sm` is for commands set beside body copy rather than as the offer. */
  size?: 'sm' | 'md'
  /** `center` suits a block with no prompt and no control to balance against. */
  align?: 'start' | 'center'
  copyable?: boolean
  /**
   * Keep the command on one line and scroll it sideways instead of wrapping,
   * resting at its end. For a command whose last word is the part that matters
   * (the Blueprint slug), so a narrow screen shows that word rather than a line
   * break in the middle of the command.
   */
  nowrap?: boolean
  copyLabel?: string
  copiedLabel?: string
}>()

const { copied, copy } = useCopyText()
const commandText = useTemplateRef<HTMLElement>('commandText')
const copyFailed = ref(false)

async function copyCommand() {
  if (await copy(command)) {
    copyFailed.value = false
    return
  }
  // The clipboard was refused: select the command so the reader's own copy
  // shortcut takes it, and say so on the control.
  copyFailed.value = true
  const element = commandText.value
  const selection = window.getSelection()
  if (element && selection) selection.selectAllChildren(element)
}

const SIZES = {
  sm: { block: 'gap-2 rounded-lg px-2.5 py-1.5', text: 'text-xs' },
  md: { block: 'gap-3 rounded-xl px-4 py-3', text: 'text-sm' }
} as const

const ALIGNS = { start: 'text-start', center: 'text-center' } as const

/**
 * These two roles are how Shiki's Bash grammar tokenizes the commands used on
 * this page: the executable is one token and its arguments are another. Keeping
 * the split here lets the landing command use the documentation palette without
 * shipping a browser-side syntax highlighter for a single line of static text.
 */
const commandTokens = computed(() => syntaxCommandTokens(command))

/**
 * A one-line command rests scrolled to its end, and fades its start once any
 * of it is out of view, so the cut reads as "more to the left" rather than as
 * a clipped command.
 */
const scrolledFromStart = ref(false)
const overflowing = ref(false)
function trackScroll() {
  const element = commandText.value
  if (element) {
    scrolledFromStart.value = element.scrollLeft > 0
    overflowing.value = element.scrollWidth > element.clientWidth
  }
}
function restAtEnd() {
  const element = commandText.value
  if (!nowrap || !element) return
  element.scrollLeft = element.scrollWidth
  trackScroll()
}
// The line's content can grow after mount — an icon in the slot loads late —
// so it is measured, not just the command string, and re-rests when it does.
const commandContent = useTemplateRef<HTMLElement>('commandContent')
useResizeObserver(commandContent, () => restAtEnd())

onMounted(() => {
  if (!nowrap) return
  restAtEnd()
  window.addEventListener('resize', restAtEnd, { passive: true })
})
onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('resize', restAtEnd)
})
watch(() => command, () => nextTick(restAtEnd))

const label = computed(() => {
  if (copied.value) return copiedLabel ?? `Copied ${command}`
  if (copyFailed.value) return 'Copying is blocked here; the command is selected, copy it with your keyboard'
  return copyLabel ?? `Copy ${command}`
})
</script>

<template>
  <div
    class="flex items-center border border-default bg-elevated/50"
    :class="SIZES[size].block"
  >
    <span
      v-if="prompt"
      class="select-none font-mono text-dimmed"
      :class="SIZES[size].text"
      aria-hidden="true"
    >{{ prompt }}</span>

    <code
      ref="commandText"
      class="flex-1 font-mono"
      :tabindex="nowrap && overflowing ? 0 : undefined"
      :class="[
        SIZES[size].text,
        ALIGNS[align],
        nowrap
          ? ['min-w-0 overflow-x-auto py-0.5 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', scrolledFromStart ? '[mask-image:linear-gradient(to_right,transparent,#000_1.5rem)]' : '']
          : '[overflow-wrap:anywhere]'
      ]"
      @scroll.passive="trackScroll"
    ><span ref="commandContent" :class="nowrap ? 'inline-block' : undefined"><slot><span
      v-for="token in commandTokens"
      :key="token.role"
      :data-syntax-token="token.role"
      :style="{ color: BRAND_WARM_COMMAND_TOKEN_COLORS[token.role] }"
    >{{ token.text }}</span></slot></span></code>

    <UButton
      v-if="copyable"
      :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
      :aria-label="label"
      color="neutral"
      variant="ghost"
      size="xs"
      @click="copyCommand"
    />
  </div>
</template>
