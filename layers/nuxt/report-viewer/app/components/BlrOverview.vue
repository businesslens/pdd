<script setup lang="ts">
/**
 * The Overview: who the Product is for, and what it promises.
 *
 * It used to be an identity header over four collapsed disclosures and an empty
 * lower half — `Model counts` had a heading of its own while the Journeys, the
 * reason the model exists at all, sat one rail click away. The promises are the
 * body now; the metadata stays, one disclosure each, for the visits that want
 * it.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/reportWorkspace'
import { resolveEntityKey } from '../utils/reportWorkspace'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{
  workspace: ReportWorkspace
  logoSrc?: string | null
}>()

const emit = defineEmits<{
  select: [entity: AnyEntityView]
  selectKey: [key: string]
}>()

const COVERAGE_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  draft: 'neutral'
}

/** The one-line shape of the model, in the order the entities depend on. */
const countFacts = computed(() => [
  { label: 'Journeys', value: props.workspace.counts.journeys },
  { label: 'Journey Scenarios', value: props.workspace.counts.journeyScenarios },
  { label: 'Capability Scenarios', value: props.workspace.counts.capabilityScenarios },
  { label: 'Steps', value: props.workspace.counts.steps },
  { label: 'Capabilities', value: props.workspace.counts.capabilities },
  { label: 'Domains', value: props.workspace.counts.domains },
  { label: 'Objects', value: props.workspace.counts.objects },
  { label: 'Screens', value: props.workspace.counts.screens },
  { label: 'Interfaces', value: props.workspace.counts.interfaces },
  { label: 'Experiences', value: props.workspace.counts.experiences },
  { label: 'Rules', value: props.workspace.counts.rules },
  { label: 'Actors', value: props.workspace.counts.actors }
])

const authoredCounts = computed<Array<[string, number]>>(() => [
  ['Actors', props.workspace.counts.actors],
  ['Interfaces', props.workspace.counts.interfaces],
  ['Experiences', props.workspace.counts.experiences],
  ['Screens', props.workspace.counts.screens],
  ['Domains', props.workspace.counts.domains],
  ['Objects', props.workspace.counts.objects],
  ['Capabilities', props.workspace.counts.capabilities],
  ['Journeys', props.workspace.counts.journeys],
  ['Capability Scenarios', props.workspace.counts.capabilityScenarios],
  ['Journey Scenarios', props.workspace.counts.journeyScenarios],
  ['Business rules', props.workspace.counts.rules]
])

const derivedCounts = computed<Array<[string, number]>>(() => [
  ['Steps', props.workspace.counts.steps],
  ['Decision points', props.workspace.counts.decisionPoints],
  ['Branches', props.workspace.counts.branches],
  ['Edge cases', props.workspace.counts.edgeCases],
  ['Screen states', props.workspace.counts.screenStates],
  ['Entry points', props.workspace.counts.entryPoints],
  ['References', props.workspace.counts.references],
  ['Availability contexts', props.workspace.counts.availabilityContexts]
])

/* Everything past the identity header is collapsed until it is asked for. */
const sections = reactive({ about: false, coverage: false, counts: false, references: false })

/*
  What the Overview shows below its identity.

  Journeys are the Product's promises, so they are the body. A model with no
  Journeys is legal, and then the largest promise it does make is its
  Capabilities — showing an empty section instead would report the absence of a
  section rather than the shape of the model.
*/
const overviewEntities = computed<AnyEntityView[]>(() => props.workspace.journeys.length
  ? props.workspace.journeys
  : props.workspace.capabilities)

const overviewHeading = computed(() => props.workspace.journeys.length
  ? { title: 'Journeys', note: 'What the Product promises, and who it promises it to.' }
  : { title: 'Capabilities', note: 'What the Product can do. This model declares no Journeys.' })

function referenceActor(ownerKey?: string) {
  if (!ownerKey) return undefined
  const entity = resolveEntityKey(props.workspace, ownerKey)
  return entity?.kind === 'actor' ? entity : undefined
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
  <header class="space-y-4">
    <div class="flex flex-wrap items-start gap-4">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 rounded-lg border border-default">
      <div class="min-w-0 flex-1 space-y-1.5">
        <p class="blr-eyebrow">Product Report</p>
        <h1 class="text-2xl font-semibold tracking-[-0.03em] text-highlighted">{{ workspace.identity.title }}</h1>
        <p class="max-w-3xl text-sm leading-6 text-default">{{ workspace.identity.summary }}</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="blr-field me-1">Made for</span>
      <UButton
        v-for="actor in workspace.actors"
        :key="actor.key"
        color="neutral"
        variant="outline"
        size="xs"
        class="rounded-full"
        @click="emit('select', actor)"
      >
        <BlrKind
          kind="actor"
          :actor-kind="actor.actorKind"
          :actor-relationship="actor.relationship"
          :labelled="false"
          size="xs"
        />
        {{ actor.title }}
      </UButton>
      <span v-if="!workspace.actors.length" class="text-sm text-muted italic">No Actors authored.</span>
    </div>
    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span v-for="fact in countFacts" :key="fact.label" class="blr-field">
        <span class="font-mono text-highlighted tabular-nums">{{ fact.value }}</span>
        {{ fact.label }}
      </span>
      <span v-if="workspace.coverage.rationale" class="text-xs text-dimmed italic">
        {{ firstSentence(workspace.coverage.rationale) }}
      </span>
    </div>
  </header>

  <!-- The host's call to action sits with the identity it acts on. -->
  <div v-if="$slots['primary-action']">
    <slot name="primary-action" />
  </div>

  <!--
    The body of the Overview is what the Product promises.

    It used to be four collapsed disclosures over an empty lower half,
    with `Model counts` given a heading of its own while the Journeys
    — the whole reason the model exists — sat one rail click away.
  -->
  <section v-if="overviewEntities.length" class="space-y-3">
    <header class="flex flex-wrap items-baseline gap-2">
      <h2 class="text-base font-semibold tracking-tight text-highlighted">{{ overviewHeading.title }}</h2>
      <span class="blr-meta">{{ overviewEntities.length }}</span>
      <span class="text-xs text-muted">{{ overviewHeading.note }}</span>
    </header>
    <div class="space-y-2">
      <BlrEntityCard
        v-for="entity in overviewEntities"
        :key="entity.key"
        :workspace="workspace"
        :entity="entity"
        @open="emit('select', $event)"
      />
    </div>
  </section>

  <!-- Everything the Product page used to show, one disclosure each. -->
  <div class="divide-y divide-default border-y border-default">
    <UCollapsible v-model:open="sections.about">
      <button type="button" class="blr-disclosure">
        <span class="flex-1 text-start text-sm font-medium text-highlighted">About this Product</span>
        <span class="blr-meta">description · intent · authors</span>
        <UIcon :name="sections.about ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
      </button>
      <template #content>
        <div class="space-y-4 pb-5">
          <BlrProse :text="workspace.identity.description" />
          <section v-if="workspace.identity.intent" class="space-y-1.5">
            <h3 class="blr-field">Intent</h3>
            <BlrProse :text="workspace.identity.intent" />
          </section>
          <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
            <h3 class="blr-field">Supporting context</h3>
            <BlrProse :text="workspace.identity.supportingContent" />
          </section>
          <div class="flex flex-wrap items-center gap-1.5">
            <UBadge v-if="workspace.identity.categoryLabel" color="primary" variant="subtle" size="sm">
              {{ workspace.identity.categoryLabel }}
            </UBadge>
            <UBadge v-for="tag in workspace.identity.tags" :key="tag" color="neutral" variant="outline" size="sm">
              {{ tag }}
            </UBadge>
            <span v-if="workspace.identity.license" class="blr-meta">license: {{ workspace.identity.license }}</span>
          </div>
          <section v-if="workspace.identity.authors.length" class="space-y-1.5">
            <h3 class="blr-field">Authors</h3>
            <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <li v-for="author in workspace.identity.authors" :key="author.name">
                <a
                  v-if="author.url"
                  :href="author.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline underline-offset-2"
                >{{ author.name }}</a>
                <span v-else class="text-default">{{ author.name }}</span>
              </li>
            </ul>
          </section>
          <section v-if="workspace.identity.limitations.length" class="space-y-1.5">
            <h3 class="blr-field">Known limitations</h3>
            <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
              <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
            </ul>
          </section>
        </div>
      </template>
    </UCollapsible>

    <UCollapsible v-model:open="sections.coverage">
      <button type="button" class="blr-disclosure">
        <span class="flex-1 text-start text-sm font-medium text-highlighted">Coverage</span>
        <UBadge :color="COVERAGE_TONE[workspace.coverage.status] || 'neutral'" variant="subtle" size="sm">
          {{ workspace.coverage.status }}
        </UBadge>
        <UIcon :name="sections.coverage ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
      </button>
      <template #content>
        <div class="space-y-3 pb-5">
          <BlrProse :text="workspace.coverage.rationale" />
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-if="workspace.coverage.method.length" class="space-y-1.5">
              <p class="blr-field">Method</p>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
              <p class="blr-field">Source areas</p>
              <ul class="space-y-1">
                <li v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" class="blr-meta">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
              <p class="blr-field">Unmapped</p>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
              </ul>
            </div>
            <div v-if="workspace.coverage.limitations.length" class="space-y-1.5">
              <p class="blr-field">Limitations</p>
              <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
                <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </UCollapsible>

    <UCollapsible v-model:open="sections.counts">
      <button type="button" class="blr-disclosure">
        <span class="flex-1 text-start text-sm font-medium text-highlighted">Model counts</span>
        <span class="blr-meta">authored · derived</span>
        <UIcon :name="sections.counts ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
      </button>
      <template #content>
        <div class="space-y-3 pb-5">
          <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
            <div v-for="[label, value] in authoredCounts" :key="label">
              <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
              <p class="blr-field">{{ label }}</p>
            </div>
          </div>
          <p class="blr-field pt-1">Depth (derived from the model)</p>
          <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5">
            <div v-for="[label, value] in derivedCounts" :key="label">
              <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
              <p class="blr-field">{{ label }}</p>
            </div>
          </div>
        </div>
      </template>
    </UCollapsible>

    <UCollapsible v-model:open="sections.references">
      <button type="button" class="blr-disclosure">
        <span class="flex-1 text-start text-sm font-medium text-highlighted">References</span>
        <span class="blr-meta">{{ workspace.references.length }}</span>
        <UIcon :name="sections.references ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
      </button>
      <template #content>
        <div class="space-y-3 pb-5">
          <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
          <div v-if="workspace.references.length" class="space-y-1.5">
            <p class="blr-field">All references in the model</p>
            <ul class="space-y-1">
              <li
                v-for="(group, index) in workspace.references"
                :key="`${group.ownerId}-${index}`"
                class="flex min-w-0 items-center gap-2 text-sm"
              >
                <BlrKind
                  :kind="group.ownerKind"
                  :actor-kind="referenceActor(group.ownerKey)?.actorKind"
                  :actor-relationship="referenceActor(group.ownerKey)?.relationship"
                  :labelled="false"
                  size="xs"
                />
                <button
                  type="button"
                  class="shrink-0 truncate text-default hover:text-primary"
                  :disabled="group.ownerKind === 'product'"
                  @click="group.ownerKey && emit('selectKey', group.ownerKey)"
                >
                  {{ group.ownerTitle }}
                </button>
                <span class="blr-meta truncate">
                  {{ group.reference.title || group.reference.target }}
                </span>
                <span class="blr-meta ms-auto shrink-0">
                  {{ group.reference.kind }} · {{ group.reference.role }}
                </span>
              </li>
            </ul>
          </div>
          <p class="blr-meta">
            Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
            · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
          </p>
        </div>
      </template>
    </UCollapsible>
  </div>

  <!-- Where this report came from, which only the host can know. -->
  <div v-if="$slots.provenance" class="text-sm text-muted">
    <slot name="provenance" />
  </div>
  </div>
</template>

<style scoped>
/* A disclosure row that reads as a heading, full width and quiet until asked. */
.blr-disclosure {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 0;
  text-align: start;
}

.blr-disclosure:hover {
  color: var(--ui-text-highlighted);
}
</style>
