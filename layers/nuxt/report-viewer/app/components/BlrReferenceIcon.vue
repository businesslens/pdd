<script setup lang="ts">
import type { ReportReference } from 'businesslens/report'

const props = defineProps<{ kind?: ReportReference['kind'] }>()

/** The category is a link; an individual Reference identifies its material. */
const KIND_ICON: Record<ReportReference['kind'], string> = {
  code: 'i-lucide-file-code',
  prd: 'i-lucide-clipboard-list',
  spec: 'i-lucide-file-text',
  proposal: 'i-lucide-file-diff',
  doc: 'i-lucide-book-open',
  adr: 'i-lucide-gavel',
  visual: 'i-lucide-image',
  research: 'i-lucide-microscope'
}

const icon = computed(() => (props.kind && KIND_ICON[props.kind]) || 'i-lucide-link')
</script>

<template>
  <UIcon :name="icon" aria-hidden="true" class="shrink-0 text-dimmed" />
</template>
