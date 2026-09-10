<script setup lang="ts">
/**
 * The Product's own page.
 *
 * It reads like every other surface, because it is one: the heading names the
 * Product and the tabs name each reading of it. What used to be four collapsed
 * disclosures stacked under a centred column — asking the reader to open each
 * one to find out whether it held anything — are now peer tabs, which is the
 * report's only switch everywhere else.
 *
 * Journeys are not listed here. They are a collection with a rail row, a page
 * and a count, and printing them a second time on the way past made the Product
 * page a duplicate of the one place that owns them.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { entityFacetOf, resolveResourceKey } from '../utils/reportWorkspace'
import { firstSentence } from '../utils/reportMarkdown'

const props = defineProps<{
  workspace: ReportWorkspace
  /** The open reading: `overview`, `about`, `coverage`, `counts`, `references`. */
  tab: string
}>()

const emit = defineEmits<{
  select: [resource: AnyResourceView]
  selectKey: [key: string]
}>()

/** The one-line shape of the model, in the order the resources depend on. */
const countFacts = computed(() => [
  { label: 'Journeys', value: props.workspace.counts.journeys },
  { label: 'Journey Scenarios', value: props.workspace.counts.journeyScenarios },
  { label: 'Capability Scenarios', value: props.workspace.counts.capabilityScenarios },
  { label: 'Steps', value: props.workspace.counts.steps },
  { label: 'Capabilities', value: props.workspace.counts.capabilities },
  { label: 'Domains', value: props.workspace.counts.domains },
  { label: 'Entities', value: props.workspace.counts.entities },
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
  ['Entities', props.workspace.counts.entities],
  ['Capabilities', props.workspace.counts.capabilities],
  ['Journeys', props.workspace.counts.journeys],
  ['Capability Scenarios', props.workspace.counts.capabilityScenarios],
  ['Journey Scenarios', props.workspace.counts.journeyScenarios],
  ['Business Rules', props.workspace.counts.rules]
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

function referenceEntity(ownerKey?: string) {
  if (!ownerKey) return undefined
  const resource = resolveResourceKey(props.workspace, ownerKey)
  return resource?.kind === 'entity' ? resource : undefined
}
</script>

<template>
  <div class="min-w-0 space-y-5">
    <!-- OVERVIEW: what this Product is, and the shape of what is modeled. -->
    <template v-if="tab === 'overview'">
      <p class="text-base leading-7 text-default">{{ workspace.identity.summary }}</p>

      <div class="flex flex-wrap items-center gap-1.5">
        <span class="blr-field me-1">Made for</span>
        <UButton
          v-for="actor in workspace.actingEntities"
          :key="actor.key"
          color="neutral"
          variant="outline"
          size="xs"
          class="rounded-full"
          @click="emit('select', actor)"
        >
          <BlrKind
            kind="entity"
            :facet="entityFacetOf(actor)"
            :acts="actor.acts"
            :labelled="false"
            size="xs"
          />
          {{ actor.title }}
        </UButton>
        <span v-if="!workspace.actingEntities.length" class="text-sm text-muted italic">No Entity acts on this Product.</span>
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

      <!-- The host's call to action sits with the identity it acts on. -->
      <div v-if="$slots['primary-action']">
        <slot name="primary-action" />
      </div>

      <!-- Where this report came from, which only the host can know. -->
      <div v-if="$slots.provenance" class="text-sm text-muted">
        <slot name="provenance" />
      </div>
    </template>

    <!-- ABOUT: the authored meaning the identity header cannot hold. -->
    <template v-else-if="tab === 'about'">
      <BlrProse :text="workspace.identity.description" />
      <section v-if="workspace.identity.intent" class="space-y-1.5">
        <h2 class="blr-field">Intent</h2>
        <BlrProse :text="workspace.identity.intent" />
      </section>
      <section v-if="workspace.identity.supportingContent" class="space-y-1.5">
        <h2 class="blr-field">Supporting context</h2>
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
        <h2 class="blr-field">Authors</h2>
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
        <h2 class="blr-field">Known limitations</h2>
        <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
          <li v-for="(item, index) in workspace.identity.limitations" :key="index">{{ item }}</li>
        </ul>
      </section>
    </template>

    <!-- COVERAGE: how much of the repository this model claims to speak for. -->
    <template v-else-if="tab === 'coverage'">
      <div class="flex flex-wrap items-center gap-2">
        <BlrCoverageBadge :status="workspace.coverage.status" named size="md" />
      </div>
      <BlrProse :text="workspace.coverage.rationale" />
      <div class="grid gap-4 sm:grid-cols-2">
        <section v-if="workspace.coverage.method.length" class="space-y-1.5">
          <h2 class="blr-field">Method</h2>
          <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
            <li v-for="(item, index) in workspace.coverage.method" :key="index">{{ item }}</li>
          </ul>
        </section>
        <section v-if="workspace.coverage.sourceAreas.length" class="space-y-1.5">
          <h2 class="blr-field">Source areas</h2>
          <ul class="space-y-1">
            <li v-for="(item, index) in workspace.coverage.sourceAreas" :key="index" class="blr-meta">{{ item }}</li>
          </ul>
        </section>
        <section v-if="workspace.coverage.unmapped.length" class="space-y-1.5">
          <h2 class="blr-field">Unmapped</h2>
          <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
            <li v-for="(item, index) in workspace.coverage.unmapped" :key="index">{{ item }}</li>
          </ul>
        </section>
        <section v-if="workspace.coverage.limitations.length" class="space-y-1.5">
          <h2 class="blr-field">Limitations</h2>
          <ul class="list-disc space-y-1 ps-5 text-sm text-muted marker:text-dimmed">
            <li v-for="(item, index) in workspace.coverage.limitations" :key="index">{{ item }}</li>
          </ul>
        </section>
      </div>
    </template>

    <!-- MODEL COUNTS: what was authored, and what the model derives from it. -->
    <template v-else-if="tab === 'counts'">
      <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5 lg:grid-cols-6">
        <div v-for="[label, value] in authoredCounts" :key="label">
          <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
          <p class="blr-field">{{ label }}</p>
        </div>
      </div>
      <h2 class="blr-field pt-1">Depth (derived from the model)</h2>
      <div class="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5 lg:grid-cols-6">
        <div v-for="[label, value] in derivedCounts" :key="label">
          <p class="font-mono text-lg text-highlighted tabular-nums">{{ value }}</p>
          <p class="blr-field flex items-center gap-1.5">
            <BlrReferenceIcon v-if="label === 'References'" class="size-3.5" />
            {{ label }}
          </p>
        </div>
      </div>
    </template>

    <!-- REFERENCES: everything the model points at, and who points at it. -->
    <template v-else-if="tab === 'references'">
      <BlrRefs :references="workspace.identity.references" variant="list" label="Product references" />
      <section v-if="workspace.references.length" class="space-y-1.5">
        <h2 class="blr-field flex items-center gap-2">
          <BlrReferenceIcon class="size-3.5" />
          All references in the model
        </h2>
        <ul class="space-y-1">
          <li
            v-for="(group, index) in workspace.references"
            :key="`${group.ownerId}-${index}`"
            class="flex min-w-0 items-center gap-2 text-sm"
          >
            <BlrKind
              :kind="group.ownerKind"
              :facet="entityFacetOf(referenceEntity(group.ownerKey))"
              :acts="referenceEntity(group.ownerKey)?.acts"
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
            <span class="blr-meta flex min-w-0 items-center gap-1.5">
              <BlrReferenceIcon :kind="group.reference.kind" class="size-3.5" />
              <span class="truncate">{{ group.reference.title || group.reference.target }}</span>
            </span>
            <span class="blr-meta ms-auto shrink-0">
              {{ group.reference.kind }} · {{ group.reference.role }}
            </span>
          </li>
        </ul>
      </section>
      <p class="blr-meta">
        Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
        · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
      </p>
    </template>
  </div>
</template>
