<script setup lang="ts">
/**
 * The Variation on a title line, and the way between its alternatives.
 *
 * A set's pill names its subtype and size; an alternative's names its set (and
 * a Version's label). Pressing either opens the same switcher: what chooses,
 * every alternative with its condition, and the set itself. Picking an
 * alternative opens it on the same reading. The pill is its own button, never
 * inside a row's link.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { resourceOpenerKey } from '../utils/resourceNavigation'
import { VARIATION_LABELS, variationAlternatives, variationChooser, variationPillLabel, variationSetOf } from '../utils/variations'

const props = defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  /** The reading an alternative opens on; the slideover passes its own tab. */
  tab?: string
}>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const opener = inject(resourceOpenerKey, null)
const open = ref(false)

const set = computed(() => variationSetOf(props.workspace, props.resource))
const label = computed(() => variationPillLabel(props.workspace, props.resource))
const alternatives = computed(() => set.value ? variationAlternatives(props.workspace, set.value) : [])
const chooser = computed(() => set.value ? variationChooser(props.workspace, set.value) : undefined)
const selection = (key: string) => set.value?.alternatives.find(item => item.key === key)
const subtitle = computed(() => set.value
  ? [VARIATION_LABELS[set.value.variationKind], chooser.value ? `${chooser.value.label.toLowerCase()} ${chooser.value.text}` : ''].filter(Boolean).join(' · ')
  : '')

function go(target: AnyResourceView, tab?: string) {
  open.value = false
  if (opener) opener(target.key, tab)
  else emit('open', target)
}
</script>

<template>
  <UPopover v-if="set && label" v-model:open="open" :content="{ align: 'start', sideOffset: 6 }">
    <button
      type="button"
      class="blr-variation-pill pointer-events-auto relative inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-md bg-elevated/60 px-2 py-0.5 text-xs font-medium text-toned ring ring-inset ring-accented transition hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="open && 'bg-accented/60'"
      :aria-label="`${resource.kind === 'variation' ? 'Alternatives' : 'Variation'}: ${label}`"
      data-variation-pill
      @click.stop
      @keydown.stop
    >
      <UIcon name="i-lucide-split" class="size-3.5 shrink-0" />
      <span class="truncate">{{ label }}</span>
      <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-180'" />
    </button>
    <template #content>
      <div class="w-[min(22rem,calc(100vw-2rem))] p-1.5 text-sm" data-variation-switcher @click.stop>
        <div class="space-y-0.5 px-2.5 pt-2 pb-2">
          <p class="font-semibold text-highlighted">{{ set.title }}</p>
          <p v-if="subtitle" class="text-xs text-muted">{{ subtitle }}</p>
        </div>
        <USeparator class="my-1" />
        <ul class="space-y-0.5" role="list">
          <li v-for="alternative in alternatives" :key="alternative.key">
            <BlrResourceLink
              :resource-key="alternative.key"
              :tab="tab"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 rounded-md px-2.5 py-2 text-start transition hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              :class="alternative.key === resource.key && 'bg-elevated/70'"
              :aria-current="alternative.key === resource.key ? 'page' : undefined"
              data-variation-option
              @open="go(alternative, tab)"
            >
              <BlrKind
                :kind="alternative.kind"
                :interface-type="alternative.kind === 'interface' ? alternative.interfaceType : undefined"
                :labelled="false"
                size="xs"
                class="mt-0.5"
              />
              <span class="min-w-0 font-medium text-highlighted [overflow-wrap:anywhere]">
                {{ alternative.title }}
                <span v-if="selection(alternative.key)?.label" class="ms-1 font-mono text-xs text-muted">{{ selection(alternative.key)?.label }}</span>
              </span>
              <span class="text-xs text-muted">{{ alternative.key === resource.key ? 'Viewing' : '' }}</span>
              <span class="col-start-2 col-end-4 line-clamp-2 text-xs text-muted">{{ selection(alternative.key)?.selectedWhen }}</span>
            </BlrResourceLink>
          </li>
        </ul>
        <template v-if="set">
          <USeparator class="my-1" />
          <BlrResourceLink
            :resource-key="set.key"
            class="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 font-medium text-highlighted transition hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            data-variation-open-set
            @open="go(set)"
          >
            <span class="truncate">Open {{ set.title }}</span>
            <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0" />
          </BlrResourceLink>
        </template>
      </div>
    </template>
  </UPopover>
</template>
