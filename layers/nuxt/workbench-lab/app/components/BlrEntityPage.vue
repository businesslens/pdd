<script setup lang="ts">
/**
 * The entity page, under audition.
 *
 * Shadows the shipped `BlrEntityPage` by name, the same way the peek does. Two
 * axes meet here: how the page is arranged, and how a parent and its Scenarios
 * relate. When both are at their defaults this renders the shipped component
 * itself, so the baseline is the real thing and not a copy that can drift.
 *
 * The sibling rail is the one option that changes the page's outer shape, so it
 * is applied here rather than inside a layout — every layout gets it for free,
 * and no layout has to know it exists.
 */
import ShippedPage from '../../../report-viewer/app/components/BlrEntityPage.vue'
import BlrPageScroll from './BlrPageScroll.vue'
import BlrPageTabs from './BlrPageTabs.vue'
import BlrPageSplit from './BlrPageSplit.vue'
import BlrPageAnchored from './BlrPageAnchored.vue'
import BlrPageAccordion from './BlrPageAccordion.vue'
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { isScenarioKind } from '../utils/model'
import { siblingsOf } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
  selectedKey?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  focus: [entity: AnyEntityView]
}>()

const { page, child } = useWorkbenchLab()

/* Only when nothing is being auditioned: otherwise the layouts compose the
   sections themselves, because the shipped page owns its children section. */
const shipped = computed(() => page.value === 'scroll' && child.value === 'cards')

/* Imported rather than named: `<component :is="'Name'">` resolves against the
   global registry, and Nuxt auto-imports are per-file, not global. */
const LAYOUTS = {
  scroll: BlrPageScroll,
  tabs: BlrPageTabs,
  split: BlrPageSplit,
  anchored: BlrPageAnchored,
  accordion: BlrPageAccordion
}

const layout = computed(() => LAYOUTS[page.value] ?? BlrPageScroll)

const railed = computed(() => child.value === 'rail'
  && isScenarioKind(props.entity.kind)
  && siblingsOf(props.workspace, props.entity).length > 1)
</script>

<template>
  <ShippedPage
    v-if="shipped"
    :workspace="workspace"
    :entity="entity"
    :selected-key="selectedKey"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
    @focus="emit('focus', $event)"
  />

  <div v-else-if="railed" class="flex min-h-0 gap-0">
    <BlrSiblingRail :workspace="workspace" :entity="entity" @open="emit('open', $event)" />
    <div class="min-w-0 flex-1 ps-5">
      <component
        :is="layout"
        :workspace="workspace"
        :entity="entity"
        :selected-key="selectedKey"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
        @focus="emit('focus', $event)"
      />
    </div>
  </div>

  <component
    :is="layout"
    v-else
    :workspace="workspace"
    :entity="entity"
    :selected-key="selectedKey"
    @select="emit('select', $event)"
    @open="emit('open', $event)"
    @focus="emit('focus', $event)"
  />
</template>
