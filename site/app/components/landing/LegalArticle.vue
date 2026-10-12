<script setup lang="ts">
defineProps<{
  headline: string
  title: string
  description: string
  updated: string
}>()
</script>

<template>
  <div class="landing-page">
    <UContainer class="max-w-3xl py-12 sm:py-16">
      <UPageHeader
        :headline="headline"
        :title="title"
        :description="description"
        :ui="{
          root: 'border-b-0 py-0',
          headline: 'font-mono font-medium text-xs text-primary uppercase tracking-[0.12em]',
          title: 'text-balance tracking-[-0.035em]',
          description: 'text-pretty leading-relaxed'
        }"
      />
      <p class="mt-4 text-sm text-dimmed">
        Last updated: {{ updated }}
      </p>

      <USeparator class="my-10" />

      <div class="legal-article space-y-10 text-base leading-relaxed text-default">
        <slot />
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.legal-article :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ui-text-highlighted);
  margin-bottom: 0.75rem;
}

.legal-article :deep(p + p),
.legal-article :deep(ul + p) {
  margin-top: 0.75rem;
}

.legal-article :deep(ul ul) {
  margin-top: 0.375rem;
  list-style: circle;
}

.legal-article :deep(ul) {
  margin-top: 0.75rem;
  padding-left: 1.25rem;
  list-style: disc;
  display: grid;
  gap: 0.375rem;
}

/* Underlined at rest, not only on hover: inside a sentence, colour alone is not
  enough to mark a link (WCAG 1.4.1). */
.legal-article :deep(a) {
  color: var(--ui-primary);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.legal-article :deep(a:hover) {
  text-decoration-thickness: 2px;
}
</style>
