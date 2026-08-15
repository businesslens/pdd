<script setup lang="ts">
/**
 * Page · One scroll — the shipped arrangement, composed from the same sections.
 *
 * The shipped `BlrEntityPage` draws its own children section, so it cannot show
 * the Scenario-navigation options. This is that page rebuilt from the shared
 * section list, which keeps the baseline arrangement while letting the other
 * axis vary. When both axes are at their defaults the dispatcher renders the
 * shipped component instead, so the true baseline is never a copy.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import { sectionsFor } from '../utils/pageSections'

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

const sections = computed(() => sectionsFor(props.workspace, props.entity))
</script>

<template>
  <article class="space-y-8">
    <BlrPageHeader
      :workspace="workspace"
      :entity="entity"
      @open="emit('open', $event)"
      @focus="emit('focus', $event)"
    />

    <section
      v-for="section in sections"
      :key="section.id"
      class="space-y-2"
      :class="section.id !== 'overview' && 'border-t border-default pt-6'"
    >
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
  </article>
</template>
