<script setup lang="ts">
import type { HomeLink } from '~/utils/homeContent'

/**
 * Where a panel continues, in the corner of the panel.
 *
 * One treatment, on every box the page has, which is the whole point: a reader
 * who finds it once on the Product Model knows where to look on the loop. It
 * replaced a filled button at the foot of one section — a call to action that
 * competed with the hero's three doors and only existed under one of the five
 * boxes, so it read as *that* section being the one worth continuing.
 *
 * **Light, and deliberately not a button.** The page's mono eyebrow face at
 * label size, muted, warming on hover. That is the same voice the comparison's
 * column heads are set in, so the corner reads as a label on the box rather than
 * as an offer inside it.
 *
 * **Two labels, not five.** *View in docs* and *Read blog* — the destination
 * kind, not the page name. Naming each page put a second title in the corner of
 * every box, and on the Product Model it repeated the heading a foot above it
 * word for word.
 *
 * The glyph is picked off the destination rather than passed in, so the two
 * kinds of link cannot be drawn with each other's mark: documentation gets the
 * open book, the blog gets the paper.
 */
const { link } = defineProps<{ link: HomeLink }>()

const icon = computed(() => (
  link.to.startsWith('/blog') ? 'i-lucide-newspaper' : 'i-lucide-book-open-text'
))
</script>

<template>
  <ULink
    :to="link.to"
    class="ms-auto flex w-fit items-center gap-1.5 rounded-sm font-mono text-xs tracking-[0.14em] uppercase text-muted transition-colors hover:text-toned focus-visible:text-toned"
  >
    <!-- Decorative: the label already says where this goes, and the glyph is
      here to say which of the two kinds of place it is. -->
    <UIcon :name="icon" class="size-3.5" aria-hidden="true" />
    {{ link.label }}
  </ULink>
</template>
