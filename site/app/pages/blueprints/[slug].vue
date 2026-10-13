<script setup lang="ts">
import { BLUEPRINT_FEED_TITLE, BLUEPRINT_FEED_URL } from '~~/shared/utils/blueprintFeed'
import CommandBlock from '~/components/landing/CommandBlock.vue'
import { pullCommand } from '~/utils/blueprints'

useHead({
  link: [{
    rel: 'alternate',
    type: 'application/rss+xml',
    title: BLUEPRINT_FEED_TITLE,
    href: BLUEPRINT_FEED_URL
  }]
})

const route = useRoute()
const slug = computed(() => String(route.params.slug))

// Generated with the site from the repository's blueprints/, one page per
// Blueprint, each carrying its whole report.
const [{ data, error }, { data: catalog }] = await Promise.all([
  useFetch(() => `/_data/blueprints/${slug.value}.json`),
  useFetch('/_data/blueprints.json')
])

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Blueprint not found', fatal: true })
}

const blueprint = computed(() => data.value?.blueprint)
const products = computed(() => (catalog.value?.blueprints ?? []).map(product => ({
  label: product.title,
  logoSrc: product.logo,
  to: `/blueprints/${product.slug}`,
  active: product.slug === slug.value
})))

useSeoMeta({
  title: () => blueprint.value ? `${blueprint.value.report.title} · Blueprints · pdd-kit` : 'Blueprint · pdd-kit',
  description: () => blueprint.value?.report.description ?? ''
})

// Preserve the catalog's public section key while sharing all report reading state.
const { section, resource, tab, resourceTab, scenarioRoute, routeColumns, topology, coverage } = useReportNavigation({ sectionKey: 'tab' })
</script>

<template>
  <div class="landing-page">
    <UAlert
      v-if="error"
      class="mx-auto my-16 max-w-2xl"
      icon="i-lucide-plug-zap"
      color="warning"
      variant="subtle"
      title="This Blueprint could not be loaded."
      description="Everything else on the site still works."
    />

    <!--
      The Product Report fills the viewport under the site header and scrolls its own
      panes, but the page still scrolls: the landing footer sits below it and is
      reached the way every other page's is.
    -->
    <PddKitReportViewer
      v-else-if="blueprint"
      :key="blueprint.slug"
      v-model:section="section"
      v-model:resource="resource"
      v-model:tab="tab"
      v-model:resource-tab="resourceTab"
      v-model:topology="topology"
      v-model:scenario-route="scenarioRoute"
      v-model:route-columns="routeColumns"
      v-model:coverage="coverage"
      :report="blueprint.report"
      :logo-src="blueprint.logo"
      :products="products"
      :product-catalog="{ label: 'All Blueprints', to: '/blueprints' }"
      :sidebar-vocabulary="false"
      :style="{
        '--pdd-kit-report-chrome':
          'var(--ui-header-height)'
      }"
    >
      <template #primary-action>
        <!-- The page's one job, set in the site's own command block so it reads
          the way the install command on the home page does: a real heading,
          the command at body size with its prompt and a neutral copy control. -->
        <div class="rounded-lg border border-default p-5">
          <h2 class="text-base font-semibold text-highlighted">
            Pull this Blueprint
          </h2>
          <p class="mt-1 text-sm text-muted">
            One command, no account. It expands into a canonical <code class="font-mono text-xs">product-model/</code> directory without touching repository-owned files.
          </p>
          <CommandBlock
            class="mt-4"
            :command="pullCommand(blueprint.slug)"
            copy-label="Copy the pull command"
            copied-label="Copied"
          />
          <p class="mt-4 text-sm text-muted">
            Then hand the directory to a coding agent, or refine the Product Model with
            <code class="font-mono text-xs">pdd-ideate</code> first.
          </p>
        </div>
      </template>

      <template #provenance>
        <h2 class="font-medium">
          Source
        </h2>
        <dl class="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt class="text-dimmed">
            Path
          </dt>
          <dd class="font-mono text-xs">
            <ULink :to="`https://github.com/itai-gendler/pdd-kit/tree/main/${blueprint.source.path}`" target="_blank" class="text-primary">
              {{ blueprint.source.path }}
            </ULink>
          </dd>
          <dt class="text-dimmed">
            Commit
          </dt>
          <dd class="font-mono text-xs">
            {{ blueprint.source.commit.slice(0, 12) }}
          </dd>
          <dt class="text-dimmed">
            Report digest
          </dt>
          <dd class="font-mono text-xs break-all">
            {{ blueprint.reportDigest.slice(0, 16) }}…
          </dd>
        </dl>
        <p class="mt-4 text-dimmed">
          Blueprints are curated in
          <ULink to="https://github.com/itai-gendler/pdd-kit/tree/main/blueprints" target="_blank" class="text-primary">itai-gendler/pdd-kit</ULink>.
          Propose one with <code class="font-mono text-xs">pdd-kit blueprint contribute</code>.
        </p>
      </template>
    </PddKitReportViewer>
  </div>
</template>
