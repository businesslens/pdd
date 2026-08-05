<script setup lang="ts">
import { parseProse } from '../utils/reportMarkdown'

const props = withDefaults(defineProps<{
  text?: string | null
  size?: 'sm' | 'base'
  /** Render nothing at all when the fragment is empty. */
  hideEmpty?: boolean
}>(), {
  text: '',
  size: 'sm',
  hideEmpty: true
})

const blocks = computed(() => parseProse(props.text || ''))
</script>

<template>
  <div
    v-if="blocks.length || !hideEmpty"
    class="blr-prose space-y-3 leading-relaxed"
    :class="size === 'sm' ? 'text-sm' : 'text-base'"
  >
    <template v-for="(block, index) in blocks" :key="index">
      <!-- eslint-disable-next-line vue/no-v-html -- fragments are escaped in parseProse before marks are re-applied -->
      <p v-if="block.type === 'paragraph'" v-html="block.html" />
      <h4 v-else-if="block.type === 'heading'" class="text-highlighted font-medium" v-html="block.html" />
      <blockquote
        v-else-if="block.type === 'quote'"
        class="border-s-2 border-default ps-3 text-dimmed italic"
        v-html="block.html"
      />
      <pre v-else-if="block.type === 'code'" class="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{{ block.text }}</pre>
      <ul v-else-if="block.type === 'bullets'" class="list-disc space-y-1.5 ps-5 marker:text-dimmed">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex" v-html="item" />
      </ul>
      <ol v-else class="list-decimal space-y-1.5 ps-5 marker:font-mono marker:text-dimmed">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex" v-html="item" />
      </ol>
    </template>
  </div>
</template>

<style scoped>
.blr-prose :deep(code) {
  border-radius: 0.25rem;
  background: var(--ui-bg-muted);
  padding: 0.05rem 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.blr-prose :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blr-prose :deep(.blr-prose-target) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--ui-text-dimmed);
}
</style>
