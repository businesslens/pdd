<script setup lang="ts">
/**
 * The alternative being read, beside its Variation's title, and the way to
 * another one.
 *
 * Wherever an alternative is a title, the title names its Variation and this
 * picker names the alternative: its title, or a Version's label. On the set's
 * own title it counts the alternatives. Its menu is headed by the set, wearing
 * its member type's mark with the variation sub-icon: what chooses, and the way
 * to the set's own reading. Every alternative follows with its condition.
 *
 * `open` opens the picked alternative, as a row or tree node does. `replace`
 * swaps the reading under the same title without a Back step, as a reading
 * header does. `switch` changes the alternative in place, as a Scenario card
 * does. The picker is its own button, never inside a row's link.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { entityFacetOf } from '../utils/reportWorkspace'
import { resourceOpenerKey } from '../utils/resourceNavigation'
import { absenceLabel, type Place } from '../utils/placeReadings'
import { VARIATION_LABELS, variationAlternatives, variationChooser, variationPickerLabel, variationSetOf } from '../utils/variations'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  resource: AnyResourceView
  /** The reading an alternative opens on; a reading header passes its own tab. */
  tab?: string
  mode?: 'open' | 'replace' | 'switch'
  /** A tree node's place, and the alternatives that do not happen there. */
  place?: Place
  absent?: string[]
}>(), { tab: undefined, mode: 'open', place: undefined, absent: () => [] })
const emit = defineEmits<{ open: [resource: AnyResourceView], pick: [resource: AnyResourceView] }>()
const opener = inject(resourceOpenerKey, null)
const open = ref(false)

const set = computed(() => variationSetOf(props.workspace, props.resource))
const label = computed(() => variationPickerLabel(props.workspace, props.resource))
/* At a tree node's place, the alternatives here come first and the struck ones after, as the tree draws them. */
const alternatives = computed(() => set.value
  ? variationAlternatives(props.workspace, set.value).sort((a, b) => Number(props.absent.includes(a.key)) - Number(props.absent.includes(b.key)))
  : [])
const chooser = computed(() => set.value ? variationChooser(props.workspace, set.value) : undefined)
const selection = (key: string) => set.value?.alternatives.find(item => item.key === key)
const subtitle = computed(() => set.value
  ? [VARIATION_LABELS[set.value.variationKind], chooser.value ? `${chooser.value.label.toLowerCase()} ${chooser.value.text}` : ''].filter(Boolean).join(' · ')
  : '')
const ariaLabel = computed(() => set.value && props.resource.kind !== 'variation'
  ? `${set.value.title} alternative: ${label.value}`
  : `${set.value?.title}: ${label.value}`)

/* A reading header is on the set's own reading; a row's or tree node's picker reads nothing yet. */
const onSet = computed(() => props.mode === 'replace' && props.resource.kind === 'variation')

function go(target: AnyResourceView, tab?: string) {
  open.value = false
  if (props.mode !== 'open' && target.key === props.resource.key) return
  if (props.mode === 'switch' && target.kind !== 'variation') { emit('pick', target); return }
  const replace = props.mode === 'replace'
  if (opener) opener(target.key, target.kind === 'variation' ? undefined : tab, { replace })
  else emit('open', target)
}
</script>

<template>
  <UPopover v-if="set && label" v-model:open="open" :content="{ align: 'start', sideOffset: 6 }">
    <button
      type="button"
      class="blr-variation-picker pointer-events-auto relative inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-md bg-default px-2 py-0.5 text-xs font-medium text-highlighted shadow-xs ring ring-inset ring-accented transition hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="[open && 'bg-elevated', resource.kind === 'variation' && 'text-toned']"
      :aria-label="ariaLabel"
      data-variation-picker
      @click.stop
      @keydown.stop
    >
      <UIcon name="i-lucide-split" class="size-3.5 shrink-0 text-dimmed" />
      <span class="truncate" data-variation-picked>{{ label }}</span>
      <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-dimmed transition-transform" :class="open && 'rotate-180'" />
    </button>
    <template #content>
      <div class="w-[min(22rem,calc(100vw-2rem))] p-1.5 text-sm" data-variation-switcher @click.stop>
        <!-- The Variation heads its alternatives and opens its own reading: what chooses, when it takes effect and how long it holds. -->
        <BlrResourceLink
          :resource-key="set.key"
          class="group/set grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 rounded-md px-2.5 py-2 text-start transition hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :class="onSet && 'bg-elevated/70'"
          :aria-current="onSet ? 'true' : undefined"
          data-variation-open-set
          @open="go(set)"
        >
          <BlrKind kind="variation" :member-kind="set.memberKind" :facet="set.memberFacet" :labelled="false" class="mt-0.5 shrink-0" />
          <span class="flex min-w-0 items-center gap-1.5 font-semibold text-highlighted">
            <span class="[overflow-wrap:anywhere]">{{ set.title }}</span>
            <UIcon v-if="!onSet" name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-dimmed transition group-hover/set:translate-x-0.5 group-hover/set:text-default" aria-hidden="true" />
          </span>
          <UIcon v-if="onSet" name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-highlighted" aria-hidden="true" />
          <span v-else />
          <span v-if="subtitle" class="col-start-2 col-end-4 text-xs text-muted">{{ subtitle }}</span>
        </BlrResourceLink>
        <USeparator class="my-1" />
        <ul class="space-y-0.5" role="list">
          <li v-for="alternative in alternatives" :key="alternative.key">
            <!-- Not at this node's place: struck as the tree draws it. -->
            <div v-if="place && absent.includes(alternative.key)" class="rounded-md" data-variation-absent-option>
              <BlrResourceLink
                :resource-key="alternative.key"
                class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 rounded-md px-2.5 py-2 text-start transition hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                data-variation-option
                @open="go(alternative)"
              >
                <BlrKind
                  :kind="alternative.kind"
                  :interface-type="alternative.kind === 'interface' ? alternative.interfaceType : undefined"
                  :facet="entityFacetOf(alternative)"
                  :acts="alternative.kind === 'entity' ? alternative.acts ?? undefined : undefined"
                  :labelled="false"
                  size="xs"
                  class="mt-0.5 opacity-45"
                />
                <span class="min-w-0 font-medium text-muted line-through decoration-(--ui-text-dimmed) [overflow-wrap:anywhere]">{{ alternative.title }}</span>
                <span class="blr-absent-badge mt-0.5">{{ absenceLabel(place) }}</span>
                <span class="col-start-2 col-end-4 line-clamp-2 text-xs text-muted">{{ selection(alternative.key)?.selectedWhen }}</span>
              </BlrResourceLink>
            </div>
            <BlrResourceLink
              v-else
              :resource-key="alternative.key"
              :tab="tab"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 rounded-md px-2.5 py-2 text-start transition hover:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              :class="alternative.key === resource.key && 'bg-elevated/70'"
              :aria-current="alternative.key === resource.key ? 'true' : undefined"
              data-variation-option
              @open="go(alternative, tab)"
            >
              <BlrKind
                :kind="alternative.kind"
                :interface-type="alternative.kind === 'interface' ? alternative.interfaceType : undefined"
                :facet="entityFacetOf(alternative)"
                :acts="alternative.kind === 'entity' ? alternative.acts ?? undefined : undefined"
                :labelled="false"
                size="xs"
                class="mt-0.5"
              />
              <span class="min-w-0 font-medium text-highlighted [overflow-wrap:anywhere]">
                {{ alternative.title }}
                <span v-if="selection(alternative.key)?.label" class="ms-1 font-mono text-xs text-muted">{{ selection(alternative.key)?.label }}</span>
              </span>
              <UIcon v-if="alternative.key === resource.key" name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-highlighted" aria-hidden="true" />
              <span v-else />
              <span class="col-start-2 col-end-4 line-clamp-2 text-xs text-muted">{{ selection(alternative.key)?.selectedWhen }}</span>
            </BlrResourceLink>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
</template>

