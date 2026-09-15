<script setup lang="ts">
import { localReferenceHref, referenceNavigationKey } from '../utils/referenceNavigation'
import type { ReferencePreview } from '../utils/referencePreview'

const props = defineProps<{ href: string, title: string, scope: string }>()
const emit = defineEmits<{ navigate: [href: string], close: [], details: [value: string | undefined] }>()
const pane = useTemplateRef('pane')
const navigation = inject(referenceNavigationKey, null)
const preview = shallowRef<ReferencePreview | null>(null)
watch(preview, value => emit('details', value?.details))
const asset = ref<{ kind: 'image' | 'text' | 'pdf', value: string } | null>(null)
const pending = ref(true)
const failure = ref('')
let request: AbortController | undefined
let cleanup = () => {}

async function load() {
  cleanup()
  request?.abort()
  const controller = request = new AbortController()
  preview.value = null
  asset.value = null
  pending.value = true
  failure.value = ''
  try {
    const href = localReferenceHref(props.href)
    if (!href) throw new Error('This reference cannot be previewed.')
    const response = await fetch(href, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error('This file is unavailable in the local repository.')
    const type = response.headers.get('content-type') ?? ''
    if (type.startsWith('application/json')) {
      const value = await response.json() as ReferencePreview
      if (!['markdown', 'code'].includes(value.kind) || !value.document?.nodes) throw new Error('A preview is not available for this file type.')
      if (!controller.signal.aborted) preview.value = value
    } else {
      const kind = type.startsWith('application/pdf') ? 'pdf' : type.startsWith('image/') ? 'image' : type.startsWith('text/') ? 'text' : null
      if (!kind) throw new Error('A preview is not available for this file type.')
      const value = kind === 'text' ? await response.text() : href
      if (!controller.signal.aborted) { asset.value = { kind, value }; await ready() }
    }
  } catch (error) {
    if (!controller.signal.aborted) { failure.value = (error as Error).message; pending.value = false }
  }
}

async function ready() {
  const href = props.href
  await nextTick()
  await document.fonts.ready
  const element = pane.value
  if (!element || href !== props.href) return
  pending.value = false
  const key = 'blr:reference:' + location.pathname + ':' + props.scope + ':' + href
  let saved: { top?: number, left?: number, details?: boolean[], codeLeft?: number[] } | null = null
  try { saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') } catch { /* Optional persistence. */ }
  element.querySelectorAll('details').forEach((item, index) => { item.open = saved?.details?.[index] ?? false })
  element.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const value = link.getAttribute('href') ?? ''
    const target = localReferenceHref(value.startsWith('#') ? href.split('#')[0] + value : value)
    if (target) {
      link.dataset.previewHref = target
      link.href = navigation?.href(target) ?? '/?f=' + encodeURIComponent(target)
    }
  })
  if (saved) { element.scrollTop = saved.top ?? 0; element.scrollLeft = saved.left ?? 0 }
  else {
    try {
      const hash = decodeURIComponent(new URL(href, location.origin).hash.slice(1))
      const anchor = hash && element.querySelector<HTMLElement>('#' + CSS.escape(hash))
      element.scrollTop = anchor ? anchor.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop - 16 : 0
    } catch { element.scrollTop = 0 }
  }
  element.querySelectorAll('pre').forEach((item, index) => { item.scrollLeft = saved?.codeLeft?.[index] ?? 0 })
  const save = () => {
    try { sessionStorage.setItem(key, JSON.stringify({ top: element.scrollTop, left: element.scrollLeft,
      details: [...element.querySelectorAll('details')].map(item => item.open),
      codeLeft: [...element.querySelectorAll('pre')].map(item => item.scrollLeft) })) } catch { /* Optional persistence. */ }
  }
  element.addEventListener('scroll', save, { passive: true, capture: true })
  element.addEventListener('toggle', save, true)
  cleanup = () => {
    save()
    element.removeEventListener('scroll', save, true)
    element.removeEventListener('toggle', save, true)
    cleanup = () => {}
  }
}

function follow(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-preview-href]')
  const target = localReferenceHref(link?.dataset.previewHref)
  if (!target) return
  event.preventDefault()
  event.stopPropagation()
  emit('navigate', target)
}
watch(() => props.href, load)
onMounted(load)
onBeforeUnmount(() => { cleanup(); request?.abort() })
</script>

<template>
  <div class="relative min-h-0 flex-1" data-reference-preview-content>
    <div v-if="pending" class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-default text-sm text-muted" role="status"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />Loading reference…</div>
    <UAlert v-if="failure" class="m-5" color="neutral" icon="i-lucide-file-question" title="Reference unavailable" :description="failure" :actions="[{ label: 'Try again', onClick: load }]" />
    <div v-else ref="pane" class="blr-reference-reading h-full overflow-auto" :aria-label="title" tabindex="0" data-reference-scroller @click.capture="follow" @keydown.esc.prevent.stop="emit('close')">
      <template v-if="preview">
        <article class="mx-auto max-w-4xl p-5 sm:p-6" :aria-label="preview.kind === 'code' ? 'Source code' : 'Document'" :data-source-preview="preview.kind === 'code' ? '' : undefined">
          <details v-if="preview.metadata !== null && preview.metadata !== undefined" class="mb-5 text-xs text-muted" data-document-metadata>
            <summary class="w-fit cursor-pointer">Document metadata</summary>
            <pre class="mt-3 overflow-auto rounded-md border border-default bg-elevated p-4 font-mono whitespace-pre-wrap [overflow-wrap:anywhere]">{{ preview.metadata }}</pre>
          </details>
          <BlrMarkdownDocument :key="href" :document="preview.document" @ready="ready" />
        </article>
      </template>
      <iframe v-else-if="asset?.kind === 'pdf'" :src="asset.value" :title="title" class="h-full w-full border-0" />
      <img v-else-if="asset?.kind === 'image'" :src="asset.value" :alt="title" class="mx-auto max-w-full p-5" />
      <pre v-else-if="asset?.kind === 'text'" class="min-h-full overflow-auto p-5 font-mono text-sm leading-6">{{ asset.value }}</pre>
    </div>
  </div>
</template>

<style>
.blr-reference-reading .comark-content > :first-child { margin-top: 0; }
.blr-reference-reading .comark-content { overflow-wrap: anywhere; }
.blr-reference-reading .comark-content :is(h5, h6) { margin-block: 1.5rem .75rem; font-weight: 600; color: var(--ui-text-highlighted); }
.blr-reference-reading .comark-content img { display: block; max-width: 100%; height: auto; border-radius: var(--ui-radius); }
.blr-reference-reading a[data-external]::after { content: ' ↗'; font-size: .85em; }
.blr-reference-reading .shiki span[style] {
  color: var(--shiki-light);
  font-style: var(--shiki-light-font-style, normal);
  font-weight: var(--shiki-light-font-weight, inherit);
  text-decoration: var(--shiki-light-text-decoration, none);
}
.dark .blr-reference-reading .shiki span[style] {
  color: var(--shiki-dark);
  font-style: var(--shiki-dark-font-style, normal);
  font-weight: var(--shiki-dark-font-weight, inherit);
  text-decoration: var(--shiki-dark-text-decoration, none);
}
.blr-reference-reading .shiki { white-space: pre; overflow-wrap: normal; }
.blr-reference-reading .shiki .line { min-height: 1.5rem; }
.blr-reference-reading .blr-source-code code { display: block; width: max-content; min-width: 100%; }
.blr-reference-reading .blr-line-number { display: inline-block; width: 5ch; margin-right: 2ch; color: var(--ui-text-muted); text-align: right; text-decoration: none; user-select: none; }
.blr-reference-reading .blr-line-number:hover { color: var(--ui-text-highlighted); text-decoration: underline; }
</style>
