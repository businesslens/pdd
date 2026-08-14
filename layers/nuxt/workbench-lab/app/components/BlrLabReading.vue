<script setup lang="ts">
/**
 * One entity, read in full, sized by whatever container the variation gives it.
 *
 * Every variation differs in how you *get* to an entity; none of them differ in
 * what an entity says. Sharing the reading keeps the audition about navigation,
 * which is the thing actually being compared — four different renderings of a
 * Screen would make the comparison meaningless.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { ENTITY_KIND_META } from '../utils/model'

const props = withDefaults(defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView | null
  /** Hide the identity header when the container already names the entity. */
  header?: boolean
  /** The prompt shown when nothing is selected. */
  emptyNote?: string
}>(), {
  header: true,
  emptyNote: 'Select something to read it.'
})

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const meta = computed(() => props.entity ? ENTITY_KIND_META[props.entity.kind] : null)
</script>

<template>
  <div v-if="!entity" class="flex h-full items-center justify-center p-8">
    <p class="max-w-xs text-center text-sm text-dimmed">{{ emptyNote }}</p>
  </div>

  <article v-else class="space-y-7 p-5">
    <header v-if="header" class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <BlrKind :kind="entity.kind" />
        <code class="blr-meta rounded bg-muted px-1.5 py-0.5">{{ entity.id }}</code>
      </div>
      <h2 class="text-xl font-semibold tracking-tight text-highlighted">{{ entity.title }}</h2>
      <BlrProse v-if="entity.lead" :text="entity.lead" size="base" class="max-w-2xl" />
    </header>

    <BlrAvail
      v-if="'availability' in entity && entity.availability.length"
      :pairs="entity.availability"
      :entry-points="'entryPoints' in entity ? entity.entryPoints : []"
    />

    <BlrEntityBody :workspace="workspace" :entity="entity" @select="emit('select', $event)" />

    <section class="space-y-3 border-t border-default pt-5">
      <h3 class="text-sm font-semibold text-highlighted">
        What this {{ meta?.label.toLowerCase() }} connects to
      </h3>
      <BlrConnections :workspace="workspace" :entity="entity" @select="emit('select', $event)" />
    </section>

    <section v-if="entity.supportingContent" class="space-y-2 border-t border-default pt-5">
      <h3 class="text-sm font-semibold text-highlighted">Supporting context</h3>
      <BlrProse :text="entity.supportingContent" />
    </section>

    <section v-if="entity.references.length" class="border-t border-default pt-5">
      <BlrRefs :references="entity.references" variant="list" />
    </section>
  </article>
</template>
