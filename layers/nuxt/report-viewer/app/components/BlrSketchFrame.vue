<script setup lang="ts">
/**
 * The frame a Sketch sits in, by Interface type: a browser window, a window
 * with a side rail, a phone, a terminal, a request pane, an inbound request
 * pane, a transcript, or a panel with a display. The strip and the entry
 * line are the frame's; the page inside is the slot's. A miniature is the
 * same markup at a smaller font.
 */
import type { SketchFrame, SketchStripItem } from '../utils/sketch'

const props = defineProps<{
  frame: SketchFrame
  entry: string[]
  strip: SketchStripItem[]
  /** A Product Step's frame wears the badge. */
  product?: boolean
  miniature?: boolean
  /** The reading's label for the frame, for assistive technology. */
  label?: string
}>()
const emit = defineEmits<{ open: [key: string] }>()

const kind = computed(() => props.frame.kind)
const chromeLabel = computed(() => ({
  request: 'Request · Response',
  inbound: 'Inbound request',
  transcript: 'Transcript'
} as Partial<Record<SketchFrame['kind'], string>>)[kind.value] ?? '')
const stripBefore = computed(() => props.frame.strip === 'top' || props.frame.strip === 'side')
</script>

<template>
  <div class="blr-sketch-frame" :data-frame="kind" :aria-label="label" data-sketch-frame>
    <div class="blr-sketch-chrome" data-sketch-chrome>
      <template v-if="kind === 'browser' || kind === 'terminal'">
        <span class="blr-sketch-dots" aria-hidden="true"><i /><i /><i /></span>
      </template>
      <template v-if="kind === 'phone'">
        <span class="blr-sketch-status" aria-hidden="true"><i /><b /></span>
      </template>
      <span v-else-if="chromeLabel" class="blr-sketch-chrome-label">{{ chromeLabel }}</span>
      <span v-if="kind === 'browser' || kind === 'window' || kind === 'request' || kind === 'inbound' || kind === 'panel'" class="blr-sketch-entry" :data-style="frame.entry" data-sketch-entry>
        <span v-for="path in entry" :key="path">{{ path }}</span>
      </span>
      <span v-if="product" class="blr-sketch-badge" data-sketch-product>Product</span>
    </div>
    <div v-if="kind === 'phone' && entry.length" class="blr-sketch-deeplink" data-sketch-entry>{{ entry.join(' · ') }}</div>
    <div class="blr-sketch-frame-body">
      <nav v-if="strip.length && stripBefore" class="blr-sketch-strip" :data-placement="frame.strip" aria-label="Always reachable" data-sketch-strip>
        <template v-for="item in strip" :key="item.screenId">
          <span v-if="miniature" class="blr-sketch-strip-item" :data-current="item.current || undefined"><i aria-hidden="true" /><span>{{ item.title }}</span></span>
          <BlrResourceLink v-else :resource-key="item.screenKey" class="blr-sketch-strip-item" :data-current="item.current || undefined" :aria-current="item.current ? 'page' : undefined" @open="emit('open', item.screenKey)"><i aria-hidden="true" /><span>{{ item.title }}</span></BlrResourceLink>
        </template>
      </nav>
      <div v-if="kind === 'terminal' && entry.length" class="blr-sketch-lines" data-sketch-entry>
        <span v-for="path in entry" :key="path" class="blr-sketch-line-text" data-role="prompt">{{ path }}</span>
      </div>
      <div v-if="kind === 'transcript' && entry.length" class="blr-sketch-lines" data-kind="transcript" data-sketch-entry>
        <span v-for="path in entry" :key="path" class="blr-sketch-line-text" data-role="muted">{{ path }}</span>
      </div>
      <slot />
      <nav v-if="strip.length && !stripBefore" class="blr-sketch-strip" :data-placement="frame.strip" aria-label="Always reachable" data-sketch-strip>
        <template v-for="item in strip" :key="item.screenId">
          <span v-if="miniature" class="blr-sketch-strip-item" :data-current="item.current || undefined"><i aria-hidden="true" /><span>{{ item.title }}</span></span>
          <BlrResourceLink v-else :resource-key="item.screenKey" class="blr-sketch-strip-item" :data-current="item.current || undefined" :aria-current="item.current ? 'page' : undefined" @open="emit('open', item.screenKey)"><i aria-hidden="true" /><span>{{ item.title }}</span></BlrResourceLink>
        </template>
      </nav>
    </div>
  </div>
</template>
