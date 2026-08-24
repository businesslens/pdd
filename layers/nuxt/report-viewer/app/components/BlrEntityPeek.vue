<script setup lang="ts">
/**
 * The peek: four zones, and never a fifth.
 *
 * It answers one question — *is this the entity I meant?* — without costing the
 * list you asked it from. It is not a reading of the entity; that is the page.
 *
 * The container it replaces rendered every authored field of every kind, which
 * ranged from 570px for an Actor to 2264px for a Journey Scenario inside the
 * same 672px panel. Nothing that varies by 4× fits one container, so this one
 * stops at a fixed set of facts and hands the rest to a page.
 *
 * Every relation here navigates. Re-targeting the panel forever is what made
 * depth confusing: three entities deep there was no trail, and the list behind
 * had nothing to do with what was on screen.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { entityBadge, entityFacts, type EntityFact } from '../utils/entityFacts'

const props = defineProps<{
  workspace: ReportWorkspace
  entity: AnyEntityView
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  open: [entity: AnyEntityView]
}>()

const meta = computed(() => ENTITY_KIND_META[props.entity.kind])
const contexts = computed(() => props.entity.kind === 'capability' ? props.entity.contexts : [])

/*
  Three facts, and they must *discriminate*.

  Not what the header already says (a Scenario panel titled "Capability
  Scenario" does not need a Type row), not what the badge already says, and not
  a count a reader can get from the connections below. A qualified Screen id
  already distinguishes counterparts, so its parent path is not repeated here.
*/
const facts = computed<EntityFact[]>(() => entityFacts(props.workspace, props.entity))
const badge = computed(() => entityBadge(props.workspace, props.entity))

/* The badge and the facts must not say the same thing twice. */
const shownFacts = computed(() => facts.value.filter(fact => fact.value && fact.value !== badge.value))
const wideFacts = computed(() => shownFacts.value.filter(fact => fact.wide))
const gridFacts = computed(() => shownFacts.value.filter(fact => !fact.wide))

/* Written out rather than interpolated: Tailwind only sees literal classes. */
const GRID_COLUMNS = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3']
const gridColumns = computed(() => GRID_COLUMNS[Math.min(gridFacts.value.length, 3)])
</script>

<template>
  <div class="flex min-h-full flex-col gap-5">
    <!-- 1. Identity. The qualified id is what tells counterparts apart. -->
    <div class="shrink-0 space-y-2">
      <code class="inline-block max-w-full truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted">
        {{ entity.id }}
      </code>
      <UBadge v-if="badge" color="neutral" variant="subtle" size="sm" class="ms-2">{{ badge }}</UBadge>
    </div>

    <!-- 2. One sentence. -->
    <BlrProse
      v-if="entity.lead"
      :text="entity.lead"
      size="base"
      class="shrink-0 text-default"
    />

    <!-- 3. Discriminating facts and one non-repeated Context reading. -->
    <div v-if="shownFacts.length || contexts.length" class="shrink-0 space-y-3">
      <dl v-if="shownFacts.length" class="overflow-hidden rounded-xl border border-default bg-default">
        <div v-for="fact in wideFacts" :key="fact.label" class="min-w-0 border-b border-default bg-elevated/35 px-3.5 py-3">
          <dt class="text-xs font-medium text-muted">{{ fact.label }}</dt>
          <dd class="text-sm font-medium text-highlighted" :title="fact.value">{{ fact.value }}</dd>
        </div>
        <div v-if="gridFacts.length" class="grid gap-px bg-default" :class="gridColumns">
          <div v-for="fact in gridFacts" :key="fact.label" class="min-w-0 bg-elevated/35 px-3.5 py-3">
            <dt class="text-xs font-medium text-muted">{{ fact.label }}</dt>
            <dd class="mt-1 truncate text-sm font-medium text-highlighted" :title="fact.value">{{ fact.value }}</dd>
          </div>
        </div>
      </dl>

      <BlrContexts
        v-if="contexts.length"
        :workspace="workspace"
        :contexts="contexts"
        compact
        @select="emit('select', $event)"
      />
    </div>

    <!--
      4. What it touches. Capped at four rows and four chips, because the page
      has the rest and says so. The zone is not clipped: a clipped list looks
      like a complete one, and on a short viewport that would quietly hide
      relations rather than admit they are there.
    -->
    <div class="shrink-0">
      <p class="blr-field mb-2">Connects to</p>
      <BlrConnections
        :workspace="workspace"
        :entity="entity"
        :max="4"
        :max-rows="3"
        @select="emit('select', $event)"
      />
    </div>

    <UButton
      class="mt-auto shrink-0"
      color="primary"
      variant="solid"
      size="md"
      block
      trailing-icon="i-lucide-arrow-right"
      :label="`Open ${meta.label} page`"
      @click="emit('open', entity)"
    />
  </div>
</template>
