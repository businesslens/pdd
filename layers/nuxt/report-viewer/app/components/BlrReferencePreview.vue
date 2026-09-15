<script setup lang="ts">
import { localReferenceHref } from '../utils/referenceNavigation'

const props = defineProps<{ href: string, title: string, scope: string }>()
const emit = defineEmits<{ navigate: [href: string], close: [] }>()
const frame = useTemplateRef('frame')
const html = ref<string | null>(null)
const pdf = ref(false)
const pending = ref(true)
const failure = ref('')
const colorMode = useColorMode()
let request: AbortController | undefined
let cleanup = () => {}
const styles = `html{color-scheme:var(--preview-color-scheme,light)}.preview-title,.preview-actions{display:none}.preview-header{position:static;padding:10px 20px}.preview-header:has(.preview-heading:empty){display:none}main{padding-top:20px}.asset-image{display:block;max-width:100%;height:auto;margin:auto}.asset-text{white-space:pre;overflow:auto;padding:20px;font:13px/1.6 ui-monospace,monospace}body{margin:0}a[data-external]::after{content:' ↗';font-size:.85em}`

async function load() {
  cleanup()
  request?.abort()
  const controller = request = new AbortController()
  html.value = null
  pdf.value = false
  pending.value = true
  failure.value = ''
  try {
    const href = localReferenceHref(props.href)
    if (!href) throw new Error('This reference cannot be previewed.')
    const response = await fetch(href, { signal: controller.signal })
    if (!response.ok) throw new Error('This file is unavailable in the local repository.')
    const type = response.headers.get('content-type') ?? ''
    if (type.startsWith('application/pdf')) { pdf.value = true; pending.value = false; return }
    const doc = new DOMParser().parseFromString(type.startsWith('text/html') ? await response.text() : '<!doctype html><html><head></head><body></body></html>', 'text/html')
    if (type.startsWith('image/')) {
      const image = doc.createElement('img')
      image.src = href
      image.alt = props.title
      image.className = 'asset-image'
      doc.body.append(image)
    } else if (!type.startsWith('text/html')) {
      if (!type.startsWith('text/')) throw new Error('A preview is not available for this file type.')
      const text = doc.createElement('pre')
      text.className = 'asset-text'
      text.textContent = await response.text()
      doc.body.append(text)
    }
    doc.querySelector('.preview-title')?.remove()
    doc.querySelector('.preview-actions')?.remove()
    if (!doc.querySelector('.preview-details')) doc.querySelector('.preview-header')?.remove()
    doc.querySelectorAll('a[href]').forEach(link => {
      if (/^https?:\/\//i.test(link.getAttribute('href') ?? '')) {
        link.setAttribute('data-external', '')
        link.setAttribute('aria-description', 'Opens in a new tab')
      }
    })
    const style = doc.createElement('style')
    style.textContent = styles
    doc.head.append(style)
    // The frame also has no allow-scripts permission. The preview never executes repository content.
    const csp = doc.createElement('meta')
    csp.httpEquiv = 'Content-Security-Policy'
    csp.content = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' https: http:; base-uri 'none'; form-action 'none'"
    doc.head.prepend(csp)
    if (!controller.signal.aborted) html.value = '<!doctype html>' + doc.documentElement.outerHTML
  } catch (error) {
    if (!controller.signal.aborted) { failure.value = (error as Error).message; pending.value = false }
  }
}

function theme() {
  const root = frame.value?.contentDocument?.documentElement
  if (!root || !frame.value) return
  const host = getComputedStyle(frame.value)
  const colors = { background: '--ui-bg', text: '--ui-text', muted: '--ui-text-muted', border: '--ui-border', surface: '--ui-bg-elevated', link: '--ui-primary' }
  for (const [name, token] of Object.entries(colors)) root.style.setProperty(`--${name}`, host.getPropertyValue(token))
  root.style.setProperty('--preview-color-scheme', colorMode.value === 'dark' ? 'dark' : 'light')
  root.style.setProperty('background', host.getPropertyValue('--ui-bg'))
  root.style.setProperty('color', host.getPropertyValue('--ui-text'))
}

function ready() {
  const doc = frame.value?.contentDocument
  if (!doc) return
  theme()
  pending.value = false
  const href = props.href
  const key = `blr:reference:${location.pathname}:${props.scope}:${href}`
  let saved: { top?: number, left?: number, details?: boolean[] } | null = null
  try { saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') } catch { /* Optional persistence. */ }
  doc.querySelectorAll('details').forEach((item, index) => { item.open = saved?.details?.[index] ?? false })
  const scroller = doc.scrollingElement
  if (saved && scroller) { scroller.scrollTop = saved.top ?? 0; scroller.scrollLeft = saved.left ?? 0 }
  else {
    try { doc.getElementById(decodeURIComponent(new URL(href, location.origin).hash.slice(1)))?.scrollIntoView() } catch { /* Invalid anchors leave the document at the top. */ }
  }
  const save = () => {
    try { sessionStorage.setItem(key, JSON.stringify({ top: scroller?.scrollTop, left: scroller?.scrollLeft, details: [...doc.querySelectorAll('details')].map(item => item.open) })) } catch { /* Optional persistence. */ }
  }
  const follow = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest('a[href]')
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const value = link.getAttribute('href') ?? ''
    if (/^(?:https?:|mailto:)/i.test(value)) return
    event.preventDefault()
    const target = localReferenceHref(value.startsWith('#') ? href.split('#')[0] + value : value)
    if (target) { save(); emit('navigate', target) }
  }
  const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); emit('close') } }
  doc.addEventListener('click', follow)
  doc.addEventListener('keydown', keyboard)
  doc.addEventListener('scroll', save, { passive: true })
  doc.addEventListener('toggle', save, true)
  cleanup = () => {
    save()
    doc.removeEventListener('click', follow)
    doc.removeEventListener('keydown', keyboard)
    doc.removeEventListener('scroll', save)
    doc.removeEventListener('toggle', save, true)
    cleanup = () => {}
  }
}
watch(() => props.href, load)
watch(() => colorMode.value, () => nextTick(theme))
onMounted(load)
onBeforeUnmount(() => { cleanup(); request?.abort() })
</script>

<template>
  <div class="relative min-h-0 flex-1" data-reference-preview-content>
    <div v-if="pending" class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-default text-sm text-muted" role="status"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />Loading reference…</div>
    <UAlert v-if="failure" class="m-5" color="neutral" icon="i-lucide-file-question" title="Reference unavailable" :description="failure" :actions="[{ label: 'Try again', onClick: load }]" />
    <iframe v-else-if="pdf" :src="href" :title="title" class="h-full w-full border-0" />
    <iframe v-else-if="html" ref="frame" :srcdoc="html" :title="title" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" class="h-full w-full border-0" @load="ready" />
  </div>
</template>
