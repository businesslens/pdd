<script setup lang="ts">
/**
 * Page · Split — the reading on the left, the context on the right.
 *
 * The page is long mostly because of material that is *reference*, not
 * narrative: what it connects to, what else is on another surface, what the
 * references are. None of that needs to interrupt the reading, and all of it
 * is useful while reading — so it moves to a column that stays put.
 *
 * Needs width, and says so: below `xl` it stacks back into one column, which is
 * the same page in a different order rather than a broken one.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { sectionsFor, type PageSectionId } from '../utils/pageSections'

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

/* The narrative belongs to the reading column; everything referential docks. */
const ASIDE: PageSectionId[] = ['connections', 'counterparts', 'references']

const sections = computed(() => sectionsFor(props.workspace, props.entity))
const main = computed(() => sections.value.filter(section => !ASIDE.includes(section.id)))
const aside = computed(() => sections.value.filter(section => ASIDE.includes(section.id)))
</script>

<template>
  <article class="space-y-6">
    <BlrPageHeader
      :workspace="workspace"
      :entity="entity"
      @open="emit('open', $event)"
      @focus="emit('focus', $event)"
    />

    <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="min-w-0 space-y-8">
        <section v-for="section in main" :key="section.id" class="space-y-2">
          <header v-if="section.id !== 'overview'" class="flex flex-wrap items-baseline gap-2">
            <h2 class="text-base font-semibold tracking-tight text-highlighted">{{ section.label }}</h2>
            <span v-if="section.count !== undefined" class="blr-meta">{{ section.count }}</span>
            <span v-if="section.hint" class="text-xs text-muted">{{ section.hint }}</span>
          </header>
          <BlrPageSection
            :workspace="workspace"
            :entity="entity"
            :id="section.id"
            :selected-key="selectedKey"
            @select="emit('select', $event)"
            @open="emit('open', $event)"
            @focus="emit('focus', $event)"
          />
        </section>
      </div>

      <!-- Sticky, because its whole reason for existing is to be there while
           you read the other column. -->
      <aside class="min-w-0 space-y-6 xl:sticky xl:top-4 xl:self-start">
        <section v-for="section in aside" :key="section.id" class="space-y-2 rounded-xl border border-default bg-elevated/20 p-4">
          <header class="flex flex-wrap items-baseline gap-2">
            <h2 class="text-sm font-semibold tracking-tight text-highlighted">{{ section.label }}</h2>
            <span v-if="section.count !== undefined" class="blr-meta">{{ section.count }}</span>
          </header>
          <BlrPageSection
            :workspace="workspace"
            :entity="entity"
            :id="section.id"
            :selected-key="selectedKey"
            @select="emit('select', $event)"
            @open="emit('open', $event)"
            @focus="emit('focus', $event)"
          />
        </section>
      </aside>
    </div>
  </article>
</template>
