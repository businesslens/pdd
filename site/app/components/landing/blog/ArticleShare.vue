<script setup lang="ts">
/**
 * The share row that closes the article masthead.
 *
 * Three circular buttons, matching the rhythm of the header this is modelled on,
 * but Facebook is replaced by a copy-link button: nobody shares a Product Model
 * essay to Facebook, and a link on the clipboard is what actually gets pasted
 * into a team channel.
 *
 * The circles stay neutral rather than taking each network's brand colour. A row
 * of saturated blue against parchment is the one thing that would read as
 * borrowed rather than designed.
 */
const { url, title } = defineProps<{ url: string, title: string }>()

const { copied, copy } = useCopyText()

const targets = computed(() => [
  {
    label: 'Share on X',
    icon: 'i-simple-icons-x',
    to: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    label: 'Share on LinkedIn',
    icon: 'i-simple-icons-linkedin',
    to: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  }
])
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-dimmed">Share:</span>
    <UButton
      v-for="target in targets"
      :key="target.label"
      :icon="target.icon"
      :to="target.to"
      :aria-label="target.label"
      external
      target="_blank"
      rel="noopener noreferrer"
      color="neutral"
      variant="soft"
      size="sm"
      class="rounded-full"
    />
    <!-- Label and icon both change, so the acknowledgement reaches a screen
      reader as well as the eye. -->
    <UButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-link'"
      :aria-label="copied ? 'Link copied' : 'Copy link'"
      color="neutral"
      variant="soft"
      size="sm"
      class="rounded-full"
      @click="copy(url)"
    />
  </div>
</template>
