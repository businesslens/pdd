<script setup lang="ts">
/**
 * The shared entity inspector: a slideover over the working view.
 *
 * Every design opens the same panel for a selected entity, so inspection is
 * one behaviour learned once. It is non-modal — the view behind stays
 * interactive and a new selection re-targets the open panel instead of
 * stacking a second one.
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

const open = computed({
  get: () => props.entity !== null,
  set: (value) => {
    if (!value) emit('close')
  }
})

const TABS: TabsItem[] = [
  { value: 'detail', label: 'Detail', icon: 'i-lucide-book-open' },
  { value: 'map', label: 'Map', icon: 'i-lucide-waypoints' }
]

const kindLabel = computed(() => props.entity ? ENTITY_KIND_META[props.entity.kind].label : '')

/* Non-dismissible so a click in the working view re-targets rather than
   closes; Escape still closes because the panel is transient, not modal. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.entity) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <USlideover
    v-model:open="open"
    :overlay="false"
    :modal="false"
    :dismissible="false"
    :ui="{
      content: 'w-full max-w-md sm:max-w-lg',
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
