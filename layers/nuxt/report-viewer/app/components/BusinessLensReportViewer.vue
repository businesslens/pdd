<script setup lang="ts">
import type { ReportViewModel } from 'businesslens/report/view-model'

type ReportViewerSection = 'overview' | 'journeys' | 'rules'

interface ReportViewerUI {
  root?: string
  headerSection?: string
  bodySection?: string
  footerSection?: string
  header?: string
  title?: string
  description?: string
  stats?: string
  stat?: string
  statValue?: string
  statLabel?: string
  primaryAction?: string
  tabs?: string
  panel?: string
  card?: string
  attribution?: string
  provenance?: string
}

defineProps<{
  report: ReportViewModel
  /** Host-resolved `.businesslens/logo.svg`; rendered decoratively beside the title. */
  logoSrc?: string | null
  ui?: ReportViewerUI
}>()

const section = defineModel<ReportViewerSection>('section', { default: 'overview' })

const tabs: Array<{ value: ReportViewerSection, label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'journeys', label: 'Journeys' },
  { value: 'rules', label: 'Rules & scenarios' }
]

</script>

<template>
  <article
    data-businesslens-report-viewer
    :class="['businesslens-report', ui?.root]"
  >
    <UPageSection :ui="{ container: ['max-w-5xl pt-12 pb-6 sm:pt-16', ui?.headerSection].filter(Boolean).join(' ') }">
      <div v-if="$slots.navigation" class="mb-6">
        <slot name="navigation" />
      </div>

      <div :class="['flex items-start gap-4', ui?.header]">
        <BusinessLensProductLogo
          :src="logoSrc"
          class="mt-1 size-10 shrink-0 object-contain"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 :class="['text-3xl tracking-[-0.03em] sm:text-4xl', ui?.title]">
              {{ report.title }}
            </h1>
            <UBadge
              v-if="report.category"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ report.category }}
            </UBadge>
          </div>
          <p :class="['mt-3 max-w-2xl text-base leading-relaxed text-dimmed', ui?.description]">
            {{ report.description }}
          </p>
        </div>
      </div>

      <div :class="['mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-default py-4', ui?.stats]">
        <div
          v-for="stat in report.stats"
          :key="stat.key"
          :class="['flex items-baseline gap-1.5', ui?.stat]"
        >
          <span :class="['font-mono text-lg text-default', ui?.statValue]">{{ stat.value }}</span>
          <span :class="['text-xs uppercase tracking-wide text-dimmed', ui?.statLabel]">{{ stat.label }}</span>
        </div>
      </div>

      <div v-if="$slots['primary-action']" :class="['mt-8', ui?.primaryAction]">
        <slot name="primary-action" />
      </div>
    </UPageSection>

    <UPageSection :ui="{ container: ['max-w-5xl py-6 sm:py-8', ui?.bodySection].filter(Boolean).join(' ') }">
      <!-- Panels are rendered below so UTabs must not emit aria-controls for
           generated panel ids that do not exist. -->
      <UTabs
        v-model="section"
        :items="tabs"
        :content="false"
        variant="link"
        :class="['w-full', ui?.tabs]"
      />

      <div v-if="section === 'overview'" :class="['mt-8 space-y-10', ui?.panel]">
        <section v-if="report.intent">
          <h2 class="text-lg tracking-tight">
            Intent
          </h2>
          <p class="mt-3 whitespace-pre-line leading-relaxed text-dimmed">
            {{ report.intent }}
          </p>
        </section>

        <section v-if="report.actors.length">
          <h2 class="text-lg tracking-tight">
            Actors
          </h2>
          <dl class="mt-4 grid gap-4 sm:grid-cols-2">
            <div
              v-for="actor in report.actors"
              :key="actor.id"
              :class="['rounded-lg border border-default p-4', ui?.card]"
            >
              <dt class="text-sm font-medium">
                {{ actor.title }}
              </dt>
              <dd class="mt-1 text-sm leading-relaxed text-dimmed">
                {{ actor.description }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="report.capabilities.length">
          <h2 class="text-lg tracking-tight">
            Capabilities
          </h2>
          <dl class="mt-4 grid gap-4 sm:grid-cols-2">
            <div
              v-for="capability in report.capabilities"
              :key="capability.id"
              :class="['rounded-lg border border-default p-4', ui?.card]"
            >
              <dt class="text-sm font-medium">
                {{ capability.title }}
              </dt>
              <dd class="mt-1 text-sm leading-relaxed text-dimmed">
                {{ capability.description }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="report.limitations.length">
          <h2 class="text-lg tracking-tight">
            Known limitations
          </h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-dimmed">
            <li v-for="limitation in report.limitations" :key="limitation">
              {{ limitation }}
            </li>
          </ul>
        </section>
      </div>

      <div v-else-if="section === 'journeys'" :class="['mt-8', ui?.panel]">
        <dl class="grid gap-4">
          <div
            v-for="journey in report.journeys"
            :key="journey.id"
            :class="['rounded-lg border border-default p-4', ui?.card]"
          >
            <dt class="text-sm font-medium">
              {{ journey.title }}
            </dt>
            <dd class="mt-1 text-sm leading-relaxed text-dimmed">
              {{ journey.description }}
            </dd>
          </div>
        </dl>
      </div>

      <div v-else :class="['mt-8 space-y-10', ui?.panel]">
        <section v-if="report.rules.length">
          <h2 class="text-lg tracking-tight">
            Business rules
          </h2>
          <p class="mt-1 text-sm text-dimmed">
            Invariants that hold across every journey.
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="rule in report.rules"
              :key="rule.id"
              :class="['rounded-lg border border-default p-4 text-sm leading-relaxed', ui?.card]"
            >
              {{ rule.statement }}
            </li>
          </ul>
        </section>

        <section v-if="report.capabilityScenarios.length">
          <h2 class="text-lg tracking-tight">
            Capability scenarios
          </h2>
          <p class="mt-1 text-sm text-dimmed">
            Observable acceptance cases for individual Product abilities.
          </p>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            <li
              v-for="scenario in report.capabilityScenarios"
              :key="scenario.id"
              class="flex items-start gap-2 text-sm text-dimmed"
            >
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
              {{ scenario.title }}
            </li>
          </ul>
        </section>

        <section v-if="report.journeyScenarios.length">
          <h2 class="text-lg tracking-tight">
            Journey scenarios
          </h2>
          <p class="mt-1 text-sm text-dimmed">
            End-to-end variations of coherent multi-Capability goals.
          </p>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            <li
              v-for="scenario in report.journeyScenarios"
              :key="scenario.id"
              class="flex items-start gap-2 text-sm text-dimmed"
            >
              <UIcon name="i-lucide-route" class="mt-0.5 size-4 shrink-0 text-primary" />
              {{ scenario.title }}
            </li>
          </ul>
        </section>
      </div>
    </UPageSection>

    <UPageSection
      v-if="report.authors.length || report.license || $slots.provenance"
      :ui="{ container: ['max-w-5xl pt-2 pb-16', ui?.footerSection].filter(Boolean).join(' ') }"
    >
      <div
        v-if="report.authors.length || report.license"
        :class="['rounded-lg border border-default p-5 text-sm', ui?.attribution]"
      >
        <h2 class="font-medium">
          Product attribution
        </h2>
        <dl class="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <template v-if="report.authors.length">
            <dt class="text-dimmed">
              {{ report.authors.length === 1 ? 'Author' : 'Authors' }}
            </dt>
            <dd class="flex flex-wrap gap-x-3 gap-y-1">
              <template v-for="(author, index) in report.authors" :key="`${author.name}-${index}`">
                <ULink v-if="author.url" :to="author.url" target="_blank" class="text-primary">
                  {{ author.name }}
                </ULink>
                <span v-else>{{ author.name }}</span>
              </template>
            </dd>
          </template>
          <template v-if="report.license">
            <dt class="text-dimmed">
              License
            </dt>
            <dd>{{ report.license }}</dd>
          </template>
        </dl>
      </div>

      <div
        v-if="$slots.provenance"
        :class="['rounded-lg border border-default p-5 text-sm', (report.authors.length || report.license) && 'mt-4', ui?.provenance]"
      >
        <slot name="provenance" />
      </div>
    </UPageSection>
  </article>
</template>
