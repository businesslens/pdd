<script setup lang="ts">
import type { ReportReference } from 'businesslens/report'

withDefaults(defineProps<{
  references: ReportReference[]
  /** `inline` is a wrapped chip row; `list` is one reference per line. */
  variant?: 'inline' | 'list'
  label?: string
}>(), {
  variant: 'inline',
  label: 'References'
})

const KIND_ICON: Record<string, string> = {
  code: 'i-lucide-file-code',
  spec: 'i-lucide-file-text',
  proposal: 'i-lucide-file-diff',
  doc: 'i-lucide-book-open',
  adr: 'i-lucide-gavel',
  visual: 'i-lucide-image',
  research: 'i-lucide-microscope'
}

/** Role is why the artefact is attached — never a verification result. */
const ROLE_TONE: Record<string, 'primary' | 'neutral' | 'secondary'> = {
  intent: 'primary',
  implementation: 'secondary',
  context: 'neutral'
}

const isExternal = (target: string) => /^https?:\/\//i.test(target)
</script>

<template>
  <div v-if="references.length" class="space-y-2">
    <p v-if="label" class="font-mono text-[10px] tracking-[0.12em] text-dimmed uppercase">
      {{ label }} · {{ references.length }}
    </p>
    <ul :class="variant === 'inline' ? 'flex flex-wrap gap-1.5' : 'space-y-1.5'">
      <li
        v-for="reference in references"
        :key="`${reference.kind}-${reference.target}`"
        class="min-w-0"
      >
        <component
          :is="isExternal(reference.target) ? 'a' : 'span'"
          :href="isExternal(reference.target) ? reference.target : undefined"
          :target="isExternal(reference.target) ? '_blank' : undefined"
          rel="noopener noreferrer"
          class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-default bg-elevated/50 px-2 py-1 text-xs"
          :class="isExternal(reference.target) && 'hover:border-inverted/30 hover:bg-elevated'"
          :title="`${reference.kind} · ${reference.role} · ${reference.target}`"
        >
          <UIcon :name="KIND_ICON[reference.kind] || 'i-lucide-link'" class="size-3.5 shrink-0 text-dimmed" />
          <span class="truncate font-mono text-[11px] text-toned">
            {{ reference.title || reference.target }}
          </span>
          <UBadge
            :color="ROLE_TONE[reference.role] || 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0 text-[9px] tracking-wide uppercase"
          >
            {{ reference.role }}
          </UBadge>
        </component>
      </li>
    </ul>
  </div>
</template>
