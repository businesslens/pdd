<script setup lang="ts">
/**
 * The shared entity inspector: a slideover over the working view.
 *
 * Every design opens the same panel for a selected entity, so inspection is
 * one behaviour learned once: the page dims behind it and a click outside
 * closes it, which is what a slideover is expected to do.
 *
 * It stays non-modal, and the dimming overlay does not take pointer events, so
 * the one gesture the designs depend on still works: clicking another entity
 * in the working view re-targets the panel to it rather than forcing a close
 * and a second click.
 */
import type { TabsItem } from '@nuxt/ui'
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  close: []
}>()

/** `detail` is complete authored content; `map` is the contextual topology. */
const tab = defineModel<'detail' | 'map'>('tab', { default: 'detail' })

/*
  A click on another entity in the working view is both "outside the panel" and
  "select this one", and the dismiss arrives around the same moment as the
  selection. Closing on the spot would drop the incoming selection, so the close
  is deferred one task and abandoned when the selection has already moved: a
  click on empty space closes, a click on another entity re-targets, and neither
  gesture needs a second click.
*/
let closingId: string | null = null

const open = computed({
  get: () => props.entity !== null,
  set: (value) => {
    if (value) return
    const id = props.entity?.id ?? null
    closingId = id
    setTimeout(() => {
      if (closingId !== id) return
      closingId = null
      if (props.entity && props.entity.id !== id) return
      emit('close')
    })
  }
})

watch(() => props.entity, () => {
  closingId = null
})

const TABS: TabsItem[] = [
  { value: 'detail', label: 'Detail', icon: 'i-lucide-book-open' },
  { value: 'map', label: 'Map', icon: 'i-lucide-waypoints' }
]

const kindLabel = computed(() => props.entity ? ENTITY_KIND_META[props.entity.kind].label : '')
</script>

<template>
  <!--
    Reka only mounts its own overlay for a modal dialog, and a modal one would
    swallow the click that re-targets the panel. So the dim is ours: same look,
    no pointer events, painted under the panel (z-40 against the panel's z-50).
  -->
  <Teleport to="body">
    <Transition name="blr-dim">
      <div v-if="entity" class="blr-dim" aria-hidden="true" />
    </Transition>
  </Teleport>

  <USlideover
    v-model:open="open"
    :modal="false"
    :ui="{
      content: 'z-50 w-full max-w-md sm:max-w-lg',
      body: tab === 'map' ? 'p-0 sm:p-0' : undefined
    }"
  >
    <template #header>
      <div v-if="entity" class="flex min-w-0 flex-1 items-center gap-3">
        <BlrKind :kind="entity.kind" :labelled="false" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold tracking-tight text-highlighted">{{ entity.title }}</p>
          <p class="blr-field">{{ kindLabel }}</p>
        </div>
        <UTabs
          v-model="tab"
          :items="TABS"
          :content="false"
          color="neutral"
          size="xs"
          class="shrink-0"
        />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Close inspector"
          @click="emit('close')"
        />
      </div>
    </template>

    <template #body>
      <template v-if="entity">
        <BlrEntityDetail
          v-if="tab === 'detail'"
          :workspace="workspace"
          :entity="entity"
          @select="emit('select', $event)"
        />
        <BlrTopology
          v-else
          :workspace="workspace"
          :focus-id="entity.id"
          direction="TB"
          class="h-full"
          @inspect="emit('select', $event)"
        />
      </template>
    </template>
  </USlideover>
</template>

<style scoped>
/* Same wash Nuxt UI's own overlay uses (`bg-elevated/75`), so the panel reads
   as a standard slideover in both colour modes. */
.blr-dim {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: color-mix(in srgb, var(--ui-bg-elevated) 75%, transparent);
}

/* Matched to the slideover's own 200ms slide, so panel and dim arrive together. */
.blr-dim-enter-active,
.blr-dim-leave-active {
  transition: opacity 200ms ease-in-out;
}

.blr-dim-enter-from,
.blr-dim-leave-to {
  opacity: 0;
}
</style>
