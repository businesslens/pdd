<script setup lang="ts">
/**
 * The closing call to action, shared by every post.
 *
 * Its own component rather than markup in the article layout because it is copy
 * rather than layout: three posts ending in three slightly different asks is
 * exactly the drift the single-source rule exists to prevent.
 */
defineProps<{ align?: 'center' | 'start' }>()
</script>

<template>
  <div
    class="flex flex-col gap-5"
    :class="align === 'start' ? 'items-start' : 'items-center text-center'"
  >
    <div :class="align === 'start' ? '' : 'max-w-xl'">
      <h2 class="text-balance text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
        {{ articleCta.title }}
      </h2>
      <p class="mt-3 leading-relaxed text-dimmed">
        {{ articleCta.description }}
      </p>
    </div>
    <div class="flex flex-wrap gap-3" :class="align === 'start' ? '' : 'justify-center'">
      <UButton
        :label="articleCta.primary.label"
        :to="articleCta.primary.to"
        trailing-icon="i-lucide-arrow-right"
      />
      <UButton
        :label="articleCta.secondary.label"
        :to="articleCta.secondary.to"
        color="neutral"
        variant="soft"
      />
    </div>
  </div>
</template>
