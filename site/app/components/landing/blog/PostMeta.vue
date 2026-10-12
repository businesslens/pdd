<script setup lang="ts">
import type { BlogPostSummary } from '~/utils/blogFeatured'

/**
 * The byline, identical in all five arrangements: who wrote it, then when.
 *
 * `z-10` sits on the author and not on the row. The author is a real link to a
 * GitHub profile and has to receive its own click through the card-wide
 * pseudo-element the title lays down; lifting the whole row instead would punch
 * a dead strip across the card wherever the date sits.
 */
const { post, size = 'xs' } = defineProps<{
  post: BlogPostSummary
  size?: 'xs' | 'sm'
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2"
    :class="size === 'sm' ? 'text-sm' : 'text-xs sm:text-sm'"
  >
    <UUser
      v-for="author in post.authors"
      :key="author.name"
      :name="author.name"
      :avatar="author.avatar"
      :to="author.to"
      external
      target="_blank"
      :size="size"
      :ui="{ root: 'z-10 gap-2', name: 'font-medium' }"
    />
    <span aria-hidden="true" class="text-dimmed">·</span>
    <time :datetime="post.date" class="text-dimmed">{{ formatPostDate(post.date) }}</time>
  </div>
</template>
