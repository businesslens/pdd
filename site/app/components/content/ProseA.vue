<script setup lang="ts">
import UProseA from '@nuxt/ui/runtime/components/prose/A.vue'

const props = defineProps<{
  href?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | null
}>()

// The OSS docs are authored for GitHub, where cross-links must keep their
// .md extension (./quickstart.md). On the site those pages live flat under
// /docs, so relative .md links are resolved there.
const resolvedHref = computed(() => {
  const href = props.href ?? ''
  if (/^(?:[a-z]+:|#)/i.test(href) || !/\.md(?:#|$)/.test(href)) return href
  const withoutExtension = href.replace(/\.md(#.*)?$/, '$1')
  if (withoutExtension.startsWith('./')) return `/docs/${withoutExtension.slice(2)}`
  if (!withoutExtension.startsWith('/')) return `/docs/${withoutExtension}`
  return withoutExtension
})
</script>

<template>
  <UProseA :href="resolvedHref" :target="target">
    <slot />
  </UProseA>
</template>
