<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { resourceViewLinks } from '../utils/reportDestinations'
import { KIND_TERM } from '../utils/vocabulary'
import { parentOf } from '../utils/pageSections'
import { referenceHref } from '../utils/referenceNavigation'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView | null
  reference?: string | null
  previousReference?: string | null
  previous?: AnyResourceView | null
  returnFocus?: HTMLElement | null
  fallbackFocus?: HTMLElement | null
}>()
const emit = defineEmits<{ close: [], back: [], open: [resource: AnyResourceView], view: [section: string, resource: AnyResourceView], referenceBack: [], referenceOpen: [href: string] }>()
const tab = defineModel<string>('tab', { default: 'overview' })
const expanded = useCookie<boolean>('blr-resource-expanded', { default: () => false, sameSite: 'lax' })
const expandLabel = computed(() => expanded.value ? 'Restore resource size' : 'Expand resource')
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const subject = computed(() => props.resource ? parentOf(props.workspace, props.resource) ?? props.resource : null)
const exits = computed(() => subject.value ? resourceViewLinks(subject.value, props.workspace) : [])
const tabsTarget = useTemplateRef('tabsTarget')
const heading = useTemplateRef('heading')
const referenceHeading = useTemplateRef('referenceHeading')
const referenceDetails = ref<string>()
function referenceInfo(href: string) {
  const url = new URL(href, 'http://businesslens.local')
  const source = url.pathname === '/_businesslens/code'
  const reference = props.workspace.references.find(item => {
    const original = new URL(referenceHref(item.reference), 'http://businesslens.local')
    return source ? referenceHref(item.reference) === href : original.pathname === url.pathname
  })?.reference
  let target = source ? url.searchParams.get('target') ?? '' : url.pathname.slice('/_businesslens/file/'.length)
  if (!source) { try { target = decodeURIComponent(target) } catch { /* Show malformed paths literally. */ } }
  const raw = url.searchParams.get('raw') === '1'
  if (raw) url.searchParams.delete('raw')
  else url.searchParams.set('raw', '1')
  return { title: reference?.title || target, target, kind: source ? 'code' as const : reference?.kind ?? 'doc' as const,
    sourceLink: !source && /\.md$/i.test(target) ? url.pathname + url.search : null, raw }
}
const file = computed(() => props.reference ? referenceInfo(props.reference) : null)
const fileBackTitle = computed(() => props.previousReference ? referenceInfo(props.previousReference).title : props.resource?.title ?? 'References')
const readingKey = computed(() => JSON.stringify([props.workspace.identity.id, 'resource', props.resource?.key, tab.value]))
const { element: pane, save, restore, hasSaved } = useBlrTopologyScroll(readingKey)
const restorePosition = computed(() => { void readingKey.value; return hasSaved() })

function focusReading(event?: Event) {
  event?.preventDefault()
  void nextTick(() => (props.reference ? referenceHeading.value : heading.value)?.focus({ preventScroll: true }))
}
let referenceFocus: HTMLElement | null = null
watch(() => props.reference, (next, before) => {
  referenceDetails.value = undefined
  if (next && !before) { save(); referenceFocus = document.activeElement as HTMLElement | null }
  if (next) focusReading()
  else if (before && props.resource) void nextTick(async () => { await restore(); (referenceFocus?.isConnected ? referenceFocus : heading.value)?.focus({ preventScroll: true }) })
})
watch(() => props.resource?.key, key => { if (key) focusReading() })
function closeFocus(event: Event) {
  event.preventDefault()
  const target = props.returnFocus?.isConnected ? props.returnFocus : props.fallbackFocus
  target?.focus({ preventScroll: true })
}
function open(resource: AnyResourceView) { save(); emit('open', resource) }
</script>

<template>
  <USlideover
    :open="Boolean(resource || reference)"
    modal
    overlay
    :title="file?.title ?? resource?.title"
    :description="file ? 'Reference' : resource ? ENTITY_KIND_META[resource.kind].label : ''"
    :content="{ onOpenAutoFocus: focusReading, onCloseAutoFocus: closeFocus }"
    :ui="{ overlay: 'blr-resource-overlay bg-black/40 dark:bg-black/60', content: `blr-resource-slideover w-full max-w-full ${expanded ? '' : 'md:max-w-[min(880px,70vw)]'} shadow-2xl`, body: 'min-h-0 flex-1 overflow-hidden p-0 sm:p-0' }"
    @update:open="!$event && emit('close')"
    @after:enter="restore"
  >
    <template #content>
      <div v-if="resource || reference" class="blr-resource-panel flex h-full min-h-0 flex-col" data-resource-panel>
        <template v-if="file && reference">
          <header class="flex shrink-0 items-start gap-2 border-b border-default px-5 py-3" data-reference-header>
            <UTooltip :text="`Back to ${fileBackTitle}`"><UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" class="-ms-1 shrink-0" :aria-label="`Back to ${fileBackTitle}`" @click="emit('referenceBack')" /></UTooltip>
            <BlrReferenceIcon :kind="file.kind" class="mt-1.5 size-4" />
            <div class="min-w-0 flex-1 pt-0.5">
              <h2 ref="referenceHeading" tabindex="-1" class="text-base leading-6 font-semibold text-highlighted outline-none [overflow-wrap:anywhere]" data-reference-heading>{{ file.title }}</h2>
              <p class="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">{{ file.title !== file.target ? file.target : 'Reference' }}</p>
              <p v-if="referenceDetails" class="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]" data-source-details>{{ referenceDetails }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <UTooltip :text="expandLabel"><UButton :icon="expanded ? 'i-lucide-minimize' : 'i-lucide-maximize'" :aria-label="expandLabel" :aria-pressed="expanded" class="hidden md:inline-flex" color="neutral" variant="ghost" size="sm" @click="expanded = !expanded" /></UTooltip>
              <UTooltip v-if="file.sourceLink" :text="file.raw ? 'View document' : 'View source'"><UButton :icon="file.raw ? 'i-lucide-file-text' : 'i-lucide-file-code'" :aria-label="file.raw ? 'View document' : 'View source'" color="neutral" variant="ghost" size="sm" @click="emit('referenceOpen', file.sourceLink!)" /></UTooltip>
              <UTooltip text="Close resource"><UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close resource" @click="emit('close')" /></UTooltip>
            </div>
          </header>
          <BlrReferencePreview :href="reference" :title="file.title" :scope="workspace.identity.id" @details="referenceDetails = $event" @navigate="emit('referenceOpen', $event)" @close="emit('close')" />
        </template>
        <header v-if="resource" v-show="!reference" class="blr-resource-header grid shrink-0 items-start gap-x-2 border-b border-default px-5 py-3" :class="previous ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'">
          <UTooltip v-if="previous" :text="`Back to ${previous.title}`">
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" class="-ms-1 shrink-0" :aria-label="`Back to ${previous.title}`" @click="save(); emit('back')" />
          </UTooltip>
          <div class="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
            <BlrKind :kind="resource.kind" :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined" :labelled="false" class="mt-0.5 shrink-0" />
            <div class="min-w-0 flex-1">
              <h2 ref="heading" tabindex="-1" class="flex min-w-0 items-start gap-2 text-base leading-6 font-semibold text-highlighted outline-none" data-resource-heading>
                <span class="min-w-0 break-words" data-resource-title>{{ resource.title }}</span>
                <BlrTerm :slug="KIND_TERM[resource.kind]" :text="resource.title" icon-only />
              </h2>
            </div>
          </div>
          <div class="blr-resource-actions flex shrink-0 items-center gap-1">
            <UTooltip v-for="link in exits" :key="link.section" :text="link.name">
              <UButton :label="link.name" :aria-label="link.name" :icon="link.icon" color="neutral" variant="ghost" size="sm" :ui="{ label: 'blr-resource-action-label text-xs' }" @click="subject && emit('view', link.section, subject)" />
            </UTooltip>
            <UTooltip :text="expandLabel">
              <UButton :icon="expanded ? 'i-lucide-minimize' : 'i-lucide-maximize'" :aria-label="expandLabel" :aria-pressed="expanded" class="hidden md:inline-flex" color="neutral" variant="ghost" size="sm" @click="expanded = !expanded" />
            </UTooltip>
            <UTooltip text="Close resource">
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close resource" @click="save(); emit('close')" />
            </UTooltip>
          </div>
          <BlrResourceContext :key="resource.key" :workspace="workspace" :resource="resource" class="blr-resource-context mt-0.5 ps-[calc(var(--blr-resource-mark-regular)+0.5rem)]" :class="previous ? 'col-start-2' : 'col-start-1'" @open="open" />
        </header>
        <div ref="tabsTarget" v-show="!reference" class="blr-resource-tabs shrink-0" data-page-tabs-host />
        <div ref="pane" v-show="!reference" class="blr-pane min-h-0 flex-1 p-5" data-resource-scroll @scroll.capture.passive="!reference && save()">
          <BlrResourcePage
            v-if="resource"
            :key="resource.key"
            v-model:tab="tab"
            v-model:scenario-route="scenarioRoute"
            v-model:route-columns="routeColumns"
            :workspace="workspace"
            :resource="resource"
            :tabs-target="tabsTarget"
            :restore-position="restorePosition"
            @open="open"
            @ready="restore"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.blr-resource-panel { container-type: inline-size; }
.blr-pane:has([data-lifecycle]) { overflow: hidden; }

/* Only a populated strip splits the header from the reading. Single-reading
   resources keep their one header border, with no empty tab row. */
.blr-resource-panel > header:has(+ .blr-resource-tabs [data-page-tabs]) {
  border-color: color-mix(in oklab, var(--ui-border-muted) 20%, transparent);
}

.blr-resource-tabs:has([data-page-tabs]) {
  border-bottom: 1px solid var(--ui-border);
}

.blr-resource-tabs :deep([data-page-tabs]) {
  align-items: end;
  padding-inline: 0.5rem 1rem;
}

.blr-resource-tabs :deep([role='tablist']) {
  min-height: 2.5rem;
  gap: 0;
}

.blr-resource-tabs :deep([role='tab']) { padding-inline: 1rem; }

.blr-resource-tabs :deep([data-slot='indicator']) {
  bottom: 0;
  background-color: var(--ui-text-highlighted);
}

@container (max-width: 759px) {
  .blr-resource-panel :deep(.blr-resource-action-label) { display: none; }
  .blr-resource-panel :deep(.blr-resource-actions > :is(button, a)) { padding-inline: 0.375rem; }
}

@container (max-width: 479px) {
  .blr-resource-panel > header { gap: 0.25rem; padding-inline: 0.75rem; }
  .blr-resource-actions { gap: 0; }
  /* Long type names and ownership still need room beside the Domain count. */
  .blr-resource-context { grid-column: 1 / -1; }
}
</style>
