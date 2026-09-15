<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { resourceAncestors, resourceViewLinks } from '../utils/reportDestinations'
import { docsForResourceKind } from '../utils/resourceDocs'
import { KIND_TERM } from '../utils/vocabulary'
import { parentOf } from '../utils/pageSections'
import { defaultTopologyReading } from '../utils/topologyState'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView | null
  previous?: AnyResourceView | null
  returnFocus?: HTMLElement | null
  fallbackFocus?: HTMLElement | null
}>()
const emit = defineEmits<{ close: [], back: [], open: [resource: AnyResourceView], view: [section: string, resource: AnyResourceView] }>()
const tab = defineModel<string>('tab', { default: 'overview' })
const scenarioRoute = defineModel<string | null>('scenarioRoute', { default: null })
const routeColumns = defineModel<string>('routeColumns', { default: 'auto' })
const narrow = ref(false)
let media: MediaQueryList | undefined
const updateWidth = () => { narrow.value = media?.matches ?? false }
onMounted(() => {
  media = window.matchMedia('(max-width: 767px)')
  updateWidth()
  media.addEventListener('change', updateWidth)
})
onBeforeUnmount(() => media?.removeEventListener('change', updateWidth))
const subject = computed(() => props.resource ? parentOf(props.workspace, props.resource) ?? props.resource : null)
const ancestors = computed(() => props.resource ? resourceAncestors(props.workspace, props.resource) : [])
const exits = computed(() => subject.value ? resourceViewLinks(subject.value, props.workspace) : [])
const docs = computed(() => docsForResourceKind(subject.value?.kind ?? 'product'))
const tabsTarget = useTemplateRef('tabsTarget')
const heading = useTemplateRef('heading')
const readingKey = computed(() => JSON.stringify([props.workspace.identity.id, 'resource', props.resource?.key, tab.value]))
const { element: pane, save, restore, hasSaved } = useBlrTopologyScroll(readingKey)
const restorePosition = computed(() => { void readingKey.value; return hasSaved() })

/* Interface delivery expansion belongs to this resource, never the graph behind it. */
const reading = ref(defaultTopologyReading())
let storageKey = ''
watch([() => props.workspace.identity.id, () => props.resource?.key], ([reportId, key]) => {
  storageKey = `blr:resource:${reportId}:${key}`
  reading.value = defaultTopologyReading()
  if (!import.meta.client) return
  try { reading.value = { ...reading.value, ...JSON.parse(sessionStorage.getItem(`${location.pathname}:${storageKey}`) ?? '{}') } } catch { /* Optional persistence. */ }
}, { immediate: true })
watch(reading, value => {
  if (!import.meta.client) return
  try { sessionStorage.setItem(`${location.pathname}:${storageKey}`, JSON.stringify(value)) } catch { /* Optional persistence. */ }
}, { deep: true })

function focusReading(event?: Event) {
  event?.preventDefault()
  void nextTick(() => heading.value?.focus({ preventScroll: true }))
}
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
    :open="Boolean(resource)"
    :modal="narrow"
    :overlay="narrow"
    :title="resource?.title"
    :description="resource ? ENTITY_KIND_META[resource.kind].label : ''"
    :content="{ onInteractOutside: (event: Event) => event.preventDefault(), onOpenAutoFocus: focusReading, onCloseAutoFocus: closeFocus }"
    :ui="{ content: 'blr-resource-slideover w-full max-w-full md:max-w-[min(880px,70vw)] shadow-2xl', body: 'min-h-0 flex-1 overflow-hidden p-0 sm:p-0' }"
    @update:open="!$event && emit('close')"
    @after:enter="restore"
  >
    <template #content>
      <div v-if="resource" class="blr-resource-panel flex h-full min-h-0 flex-col" data-resource-panel>
        <header class="flex shrink-0 items-start gap-2 border-b border-default px-5 py-3">
          <UTooltip v-if="previous" :text="`Back to ${previous.title}`">
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" class="-ms-1 shrink-0" :aria-label="`Back to ${previous.title}`" @click="save(); emit('back')" />
          </UTooltip>
          <div class="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
            <BlrKind :kind="resource.kind" :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined" :labelled="false" class="mt-0.5 shrink-0" />
            <div class="min-w-0 flex-1">
              <h2 ref="heading" tabindex="-1" class="flex min-w-0 items-start gap-2 text-base leading-6 font-semibold text-highlighted outline-none" data-resource-heading>
                <span class="min-w-0 break-words">{{ resource.title }}</span>
                <BlrTerm :slug="KIND_TERM[resource.kind]" :text="resource.title" icon-only />
              </h2>
              <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                <span>{{ ENTITY_KIND_META[resource.kind].label }}</span>
                <template v-for="ancestor in ancestors" :key="ancestor.key">
                  <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0" />
                  <BlrResourceLink :resource-key="ancestor.key" class="min-w-0 break-words hover:underline" @open="open(ancestor)">{{ ancestor.title }}</BlrResourceLink>
                </template>
              </div>
            </div>
          </div>
          <div class="blr-resource-actions flex shrink-0 items-center gap-1">
            <UTooltip v-for="link in exits" :key="link.section" :text="link.name">
              <UButton :label="link.name" :aria-label="link.name" :icon="link.icon" color="neutral" variant="ghost" size="sm" :ui="{ label: 'blr-resource-action-label text-xs' }" @click="subject && emit('view', link.section, subject)" />
            </UTooltip>
            <UTooltip :text="docs.label">
              <UButton :to="docs.url" external target="_blank" rel="noopener noreferrer" icon="i-lucide-book-open" color="neutral" variant="ghost" size="sm" label="Docs" :aria-label="docs.label" :ui="{ label: 'blr-resource-action-label text-xs' }" />
            </UTooltip>
            <UTooltip text="Close resource">
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close resource" @click="save(); emit('close')" />
            </UTooltip>
          </div>
        </header>
        <div ref="tabsTarget" class="blr-resource-tabs shrink-0" data-page-tabs-host />
        <div ref="pane" class="blr-pane min-h-0 flex-1 p-5" data-resource-scroll @scroll.capture.passive="save">
          <BlrResourcePage
            :key="resource.key"
            v-model:tab="tab"
            v-model:scenario-route="scenarioRoute"
            v-model:route-columns="routeColumns"
            v-model:reading="reading"
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
  bottom: -1px;
  background-color: var(--ui-text-highlighted);
}

@container (max-width: 759px) {
  .blr-resource-panel :deep(.blr-resource-action-label) { display: none; }
  .blr-resource-panel :deep(.blr-resource-actions > :is(button, a)) { padding-inline: 0.375rem; }
}

@container (max-width: 479px) {
  .blr-resource-panel > header { gap: 0.25rem; padding-inline: 0.75rem; }
  .blr-resource-actions { gap: 0; }
}
</style>
