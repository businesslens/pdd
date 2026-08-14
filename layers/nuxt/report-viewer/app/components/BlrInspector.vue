<script setup lang="ts">
/**
 * The panel the peek lives in.
 *
 * It stays non-modal, and the dimming overlay takes no pointer events, so the
 * gesture the working view depends on still works: clicking another entity in
 * the list re-targets the panel rather than forcing a close and a second click.
 *
 * What it no longer carries is depth. There is no history stack and no back
 * arrow, because there is nowhere to go back *to* — a relation opens that
 * entity's page, which has a breadcrumb and a browser back button that already
 * mean what they say. A panel that could be three entities deep with a bare
 * arrow for a trail was the confusion, not the cure.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
  close: []
}>()

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

watch(() => props.entity, () => {
  closingId = null
})

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
      content: 'z-50 w-full max-w-full sm:max-w-md',
      body: 'blr-peek-scroll px-5 py-5 sm:px-6 sm:py-6'
    }"
  >
    <template #header>
      <div v-if="entity" class="flex min-w-0 flex-1 items-center gap-2.5">
        <BlrKind :kind="entity.kind" :labelled="false" />
        <div class="min-w-0 flex-1">
          <p class="blr-field">{{ kindLabel }}</p>
          <p class="truncate text-base font-semibold leading-5 tracking-tight text-highlighted">{{ entity.title }}</p>
        </div>
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
      <BlrEntityPeek
        v-if="entity"
        :workspace="workspace"
        :entity="entity"
        class="h-full"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
      />
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
