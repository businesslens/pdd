<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue/components/MarkdownDocument'
import type { MarkdownDocument as Document } from 'comark'
import {
  ProseA, ProseBlockquote, ProseCode, ProseH1, ProseH2, ProseH3, ProseH4,
  ProseHr, ProseLi, ProseOl, ProseP, ProsePre, ProseStrong, ProseTable, ProseTbody,
  ProseTd, ProseTh, ProseThead, ProseTr, ProseUl
} from '#components'

defineProps<{ document: Document }>()
defineEmits<{ ready: [] }>()
// Explicit mappings keep the report's typography consistent across Nuxt hosts.
const PlainImage = defineComponent({ inheritAttrs: false, setup: (_, { attrs }) => () => h('img', attrs) })
const CodeBlock = defineComponent({ inheritAttrs: false, setup: (_, { attrs, slots }) => () => h(ProsePre, { ...attrs, icon: 'i-lucide-file-code' }, slots) })
const components = {
  img: PlainImage,
  a: ProseA, blockquote: ProseBlockquote, code: ProseCode,
  h1: ProseH1, h2: ProseH2, h3: ProseH3, h4: ProseH4,
  hr: ProseHr, li: ProseLi, ol: ProseOl, p: ProseP, pre: CodeBlock, strong: ProseStrong,
  table: ProseTable, tbody: ProseTbody, td: ProseTd, th: ProseTh, thead: ProseThead, tr: ProseTr, ul: ProseUl
}
</script>

<template>
  <Suspense @resolve="$emit('ready')">
    <MarkdownDocument :value="document" :components="components" />
  </Suspense>
</template>
