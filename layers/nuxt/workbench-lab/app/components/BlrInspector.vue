<script setup lang="ts">
/**
 * The slideover, under audition.
 *
 * Shadows the shipped `BlrInspector`. What it holds is no longer a separate
 * design: it is `BlrEntityReading`, the same component the page renders, so a
 * reader chooses a container rather than learning an entity twice.
 *
 * What varies is how much room that container gets — and whether it exists at
 * all. The `none` option forwards straight to the page, which is the honest way
 * to ask whether the panel earns its place.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META, isScenarioKind } from '../utils/model'
import { parentOf } from '../utils/pageSections'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  close: []
}>()

const { panel } = useWorkbenchLab()

/*
  A click on another entity in the working view is both "outside the panel" and
  "select this one", and the dismiss arrives around the same moment as the
  selection. Closing on the spot would drop the incoming selection, so the close
  is deferred one task and abandoned when the selection has already moved.
*/
let closingId: string | null = null

const open = computed({
  get: () => props.entity !== null && panel.value !== 'none',
  set: (value) => {
    if (value) return
    const id = props.entity?.key ?? null
    closingId = id
    setTimeout(() => {
      if (closingId !== id) return
      closingId = null
      if (props.entity && props.entity.key !== id) return
      emit('close')
    })
  }
})

watch(() => props.entity, (entity) => {
  closingId = null
  /* `none`: there is no panel, so a selection goes straight to the page. */
  if (entity && panel.value === 'none') emit('open', entity)
})

const WIDTHS: Record<string, string> = {
  narrow: 'sm:max-w-md',
  wide: 'sm:max-w-2xl',
  sheet: 'sm:max-w-[min(72rem,92vw)]',
  sidetabs: 'sm:max-w-[40rem]'
}

const width = computed(() => WIDTHS[panel.value] ?? WIDTHS.wide)

/* A Scenario is read inside its parent, so the panel names the parent too. */
const parent = computed(() => props.entity ? parentOf(props.workspace, props.entity) : null)
const subject = computed(() => parent.value ?? props.entity)
const kindLabel = computed(() => subject.value ? ENTITY_KIND_META[subject.value.kind].label : '')
</script>

<template>
  <Teleport to="body">
    <Transition name="blr-dim">
      <div v-if="open" class="blr-dim" aria-hidden="true" />
    </Transition>
  </Teleport>

  <USlideover
    v-model:open="open"
    :modal="false"
    :ui="{
      content: `z-50 w-full max-w-full ${width}`,
      body: 'blr-peek-scroll px-5 py-5 sm:px-6 sm:py-6'
    }"
  >
    <template #header>
      <div v-if="subject" class="flex min-w-0 flex-1 items-center gap-2.5">
        <BlrKind :kind="subject.kind" :labelled="false" />
        <div class="min-w-0 flex-1">
          <p class="blr-field">{{ kindLabel }}</p>
          <p class="truncate text-base font-semibold leading-5 tracking-tight text-highlighted">
            {{ subject.title }}
          </p>
        </div>
        <!-- The same reading, in the other container. -->
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          trailing-icon="i-lucide-arrow-right"
          label="Open as page"
          @click="entity && emit('open', entity)"
        />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Close"
          @click="emit('close')"
        />
      </div>
    </template>

    <template #body>
      <BlrEntityReading
        v-if="entity"
        :workspace="workspace"
        :entity="entity"
        compact
        :side-tabs="panel === 'sidetabs'"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
        @focus="emit('open', $event)"
      />
    </template>
  </USlideover>
</template>

<style scoped>
/* Same wash Nuxt UI's own overlay uses, so the panel reads as a standard
   slideover in both colour modes, without taking pointer events. */
.blr-dim {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: color-mix(in srgb, var(--ui-bg-elevated) 75%, transparent);
}

.blr-dim-enter-active,
.blr-dim-leave-active {
  transition: opacity 200ms ease-in-out;
}

.blr-dim-enter-from,
.blr-dim-leave-to {
  opacity: 0;
}
</style>
