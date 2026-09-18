<script setup lang="ts">
/** Complete Product and Coverage readings, using the authored field names. */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { defaultCoverageReading, type CoverageReading } from '../utils/coverageState'
import { entityFacetOf, resolveResourceKey } from '../utils/reportWorkspace'

const props = defineProps<{
  workspace: ReportWorkspace
  /** Host-resolved product logo, rendered with the Product's own name. */
  logoSrc?: string | null
  /** The open reading: `overview` (About), `coverage`, or `references`. */
  tab: string
}>()

const emit = defineEmits<{
  select: [resource: AnyResourceView]
  selectKey: [key: string, tab: string]
}>()

const coverage = defineModel<CoverageReading>('coverage', { default: defaultCoverageReading })

const references = computed(() => props.workspace.references.map(group => group.reference))

function referenceEntity(ownerKey?: string) {
  if (!ownerKey) return undefined
  const resource = resolveResourceKey(props.workspace, ownerKey)
  return resource?.kind === 'entity' ? resource : undefined
}
</script>

<template>
  <div class="blr-overview @container min-w-0 space-y-6">
    <div v-if="tab === 'overview'" class="space-y-7 pb-4" data-product-about>
      <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="size-12 self-start rounded-lg border border-default sm:row-span-2">
        <h2 class="text-2xl font-semibold tracking-[-0.025em] text-highlighted" :class="{ 'col-span-full': !logoSrc }">{{ workspace.identity.title }}</h2>
        <p class="col-span-full text-base leading-7 text-default" :class="{ 'sm:col-span-1': logoSrc }">{{ workspace.identity.summary }}</p>
      </div>

      <div v-if="$slots['primary-action']">
        <slot name="primary-action" />
      </div>

      <div class="grid gap-8 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div class="min-w-0 space-y-7" data-product-narrative>
          <section class="space-y-2" aria-label="Description">
            <h3 class="text-base font-semibold text-highlighted">Description</h3>
            <BlrProse :text="workspace.identity.description" />
          </section>
          <section class="space-y-2" aria-label="Intent">
            <h3 class="text-base font-semibold text-highlighted">Intent</h3>
            <BlrProse v-if="workspace.identity.intent" :text="workspace.identity.intent" />
            <p v-else class="text-sm text-muted">Not recorded.</p>
          </section>
          <section class="space-y-2" aria-label="Product limitations">
            <h3 class="flex items-baseline gap-2 text-base font-semibold text-highlighted">
              Limitations <span class="blr-meta">{{ workspace.identity.limitations.length }}</span>
            </h3>
            <p class="text-xs text-muted">Deliberate exclusions or constraints of the Product.</p>
            <ul v-if="workspace.identity.limitations.length" class="list-disc space-y-2 ps-4 marker:text-dimmed">
              <li v-for="(item, index) in workspace.identity.limitations" :key="index">
                <BlrProse :text="item" />
              </li>
            </ul>
            <p v-else class="text-sm text-muted">None recorded.</p>
          </section>
          <section v-for="(section, index) in workspace.identity.supportingSections" :key="index" class="space-y-2" data-product-supporting-section>
            <h3 class="text-base font-semibold text-highlighted">{{ section.heading }}</h3>
            <BlrProse :text="section.content" />
          </section>
        </div>

        <aside class="min-w-0 space-y-6 border-t border-default pt-6 @3xl:border-t-0 @3xl:border-s @3xl:pt-0 @3xl:ps-7" aria-label="Product details">
          <h3 class="text-base font-semibold text-highlighted">Product details</h3>
          <dl class="space-y-4 text-sm">
            <div>
              <dt class="text-sm font-medium text-muted">ID</dt>
              <dd class="mt-1 font-mono">{{ workspace.identity.id }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted">Category</dt>
              <dd class="mt-1">{{ workspace.identity.category || 'None recorded.' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted">Tags</dt>
              <dd class="mt-1">
                <ul v-if="workspace.identity.tags.length" class="flex flex-wrap gap-1.5">
                  <li v-for="tag in workspace.identity.tags" :key="tag" class="rounded border border-default px-2 py-0.5 text-sm">{{ tag }}</li>
                </ul>
                <span v-else class="text-muted">None recorded.</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted">Authors</dt>
              <dd class="mt-1">
                <ul v-if="workspace.identity.authors.length" class="space-y-3">
                  <li v-for="(author, index) in workspace.identity.authors" :key="index" class="space-y-0.5">
                    <p>{{ author.name }}</p>
                    <a v-if="author.url" :href="author.url" target="_blank" rel="noopener noreferrer" class="block text-sm text-primary underline underline-offset-2">{{ author.url }}</a>
                  </li>
                </ul>
                <span v-else class="text-muted">None recorded.</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted">License</dt>
              <dd class="mt-1">{{ workspace.identity.license || 'None recorded.' }}</dd>
            </div>
          </dl>
          <section class="space-y-2 border-t border-default pt-5" aria-label="Actors">
            <h3 class="text-base font-semibold text-highlighted">Actors</h3>
            <p class="text-xs text-muted">Derived from Entities that act on the Product.</p>
            <div v-if="workspace.actingEntities.length" class="flex flex-wrap items-center gap-2">
              <UButton
                v-for="actor in workspace.actingEntities"
                :key="actor.key"
                color="neutral"
                variant="outline"
                size="sm"
                class="rounded-full text-sm"
                @click="emit('select', actor)"
              >
                <BlrKind kind="entity" :facet="entityFacetOf(actor)" :acts="actor.acts" :labelled="false" size="xs" />
                {{ actor.title }}
              </UButton>
            </div>
            <p v-else class="text-sm text-muted">None recorded.</p>
          </section>
        </aside>
      </div>
      <div v-if="$slots.provenance" class="border-t border-default pt-4 text-xs text-muted">
        <slot name="provenance" />
      </div>
    </div>

    <BlrCoverage v-else-if="tab === 'coverage'" v-model:reading="coverage" :workspace="workspace" @select-key="emit('selectKey', $event, 'overview')" />

    <!-- REFERENCES: everything the model points at, and who points at it. -->
    <template v-else-if="tab === 'references'">
      <BlrRefs
        :references="references"
        :scope="JSON.stringify([workspace.identity.id, 'all-references'])"
        label="All references in the model"
        data-reference-catalog
      >
        <template #reference-owner="{ index }">
          <span class="flex w-full min-w-0 items-start gap-1.5 text-xs text-muted">
            <BlrKind
              :kind="workspace.references[index]!.ownerKind"
              :facet="entityFacetOf(referenceEntity(workspace.references[index]!.ownerKey))"
              :acts="referenceEntity(workspace.references[index]!.ownerKey)?.acts"
              :labelled="false"
              size="xs"
            />
            <BlrResourceLink
              v-if="workspace.references[index]!.ownerKey"
              :resource-key="workspace.references[index]!.ownerKey"
              tab="references"
              class="min-w-0 text-muted hover:text-primary hover:underline [overflow-wrap:anywhere]"
              @keydown.stop
              @open="emit('selectKey', workspace.references[index]!.ownerKey, 'references')"
            >
              {{ workspace.references[index]!.ownerTitle }}
            </BlrResourceLink>
            <span v-else>{{ workspace.references[index]!.ownerTitle }}</span>
          </span>
        </template>
      </BlrRefs>
      <p class="blr-meta">
        Generated by {{ workspace.identity.generator.name }} v{{ workspace.identity.generator.version }}
        · schema {{ workspace.identity.schemaVersion }} · {{ workspace.identity.generatedAt }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.blr-overview {
  overflow-wrap: anywhere;
}
</style>
