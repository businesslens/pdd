<script setup lang="ts">
import { ref } from 'vue'
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
  prd: 'i-lucide-clipboard-list',
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

/**
 * Where the local viewer serves repository files.
 *
 * Only a workspace-profile report carries repository-relative targets; the
 * portable profile drops them, so a host without this mount never renders one.
 */
const ASSET_PREFIX = '/_businesslens/file/'
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i

const isExternal = (target: string) => /^https?:\/\//i.test(target)

/** A code target carries a `#symbol` or `:line` suffix that is not part of the path. */
const isCode = (reference: ReportReference) => reference.kind === 'code'

const localHref = (target: string) =>
  `${ASSET_PREFIX}${target.split('/').map(encodeURIComponent).join('/')}`

const isLocalImage = (reference: ReportReference) =>
  !isExternal(reference.target)
  && !isCode(reference)
  && IMAGE_EXTENSIONS.test(reference.target.split(/[?#]/)[0] ?? '')

const hrefFor = (reference: ReportReference) =>
  isExternal(reference.target)
    ? reference.target
    : isCode(reference)
      ? undefined
      : localHref(reference.target)

const tagFor = (reference: ReportReference) => hrefFor(reference) ? 'a' : 'span'

const keyFor = (reference: ReportReference) => `${reference.kind}-${reference.target}`

const expanded = ref<string>()
const onActivate = (reference: ReportReference, event: MouseEvent) => {
  if (!isLocalImage(reference)) return
  event.preventDefault()
  const key = keyFor(reference)
  expanded.value = expanded.value === key ? undefined : key
}
</script>

<template>
  <div v-if="references.length" class="space-y-2">
    <p v-if="label" class="blr-field">
      {{ label }} · {{ references.length }}
    </p>
    <ul :class="variant === 'inline' ? 'flex flex-wrap gap-1.5' : 'space-y-1.5'">
      <li
        v-for="reference in references"
        :key="keyFor(reference)"
        class="min-w-0"
        :class="isLocalImage(reference) && variant === 'list' && 'space-y-1.5'"
      >
        <component
          :is="tagFor(reference)"
          :href="hrefFor(reference)"
          :target="isExternal(reference.target) ? '_blank' : undefined"
          rel="noopener noreferrer"
          class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-default bg-elevated/50 px-2 py-1 text-xs"
          :class="hrefFor(reference) && 'hover:border-inverted/30 hover:bg-elevated'"
          :title="`${reference.kind} · ${reference.role} · ${reference.target}`"
          @click="onActivate(reference, $event)"
        >
          <UIcon :name="KIND_ICON[reference.kind] || 'i-lucide-link'" class="size-3.5 shrink-0 text-dimmed" />
          <span class="truncate text-sm text-default">
            {{ reference.title || reference.target }}
          </span>
          <UBadge
            v-if="reference.state"
            color="neutral"
            variant="outline"
            size="sm"
            class="shrink-0"
            :title="`Depicts the ${reference.state} product state`"
          >
            {{ reference.state }}
          </UBadge>
          <UBadge
            :color="ROLE_TONE[reference.role] || 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ reference.role }}
          </UBadge>
          <UIcon
            v-if="isLocalImage(reference)"
            :name="expanded === keyFor(reference) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-3.5 shrink-0 text-dimmed"
          />
        </component>

        <!--
          A local image is the point of a `visual` reference, so show it rather
          than describing it. Collapsed by default: the report is a place people
          scan, and an always-open gallery buries the fields beneath it.
        -->
        <div
          v-if="isLocalImage(reference) && expanded === keyFor(reference)"
          class="mt-1.5 overflow-hidden rounded-md border border-default bg-elevated/30 p-2"
        >
          <a :href="localHref(reference.target)" target="_blank" rel="noopener noreferrer">
            <img
              :src="localHref(reference.target)"
              :alt="reference.title || reference.target"
              loading="lazy"
              class="max-h-96 w-auto max-w-full rounded"
            >
          </a>
          <p class="blr-field mt-1.5 truncate">
            {{ reference.target }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
