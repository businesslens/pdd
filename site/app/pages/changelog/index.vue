<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'
import { Motion } from 'motion-v'
import ChangelogSectionHeading from '~/components/landing/ChangelogSectionHeading.vue'

const { enterMotion } = useLandingMotion()

useSiteSeo({
  title: 'Changelog · pdd-kit',
  description: 'Every release of pdd-kit, the open-source implementation of Product-Driven Development: its format, CLI, agent skills and site.'
})

// `CHANGELOG.md` in itai-gendler/pdd-kit is the only authored copy. Each `##`
// release becomes one version, in file order, with its entries rendered as
// written; nothing here rewrites, summarizes, or stores an entry. A missing
// file fails the prerender rather than shipping an empty or stale page.
//
// Historical entries describe what each release actually shipped, including
// concepts later retired. They are a record, not current claims.
const { data: changelog } = await useAsyncData('changelog', () =>
  queryCollection('changelog').first())

const releases = computed(() => changelogReleases(changelog.value?.body?.value ?? []))

if (!releases.value.length) {
  throw createError({ statusCode: 500, statusMessage: 'The pdd CHANGELOG.md was not found', fatal: true })
}

// The versions menu: one anchor per release card, keyed by its tag.
const versions = computed<ContentTocLink[]>(() => releases.value.map(release => ({
  id: release.slug,
  depth: 2,
  text: release.title
})))
</script>

<template>
  <div>
    <!-- `overflow-x-clip`, not `overflow-hidden`: hidden would unstick the
      versions menu, clip only has to contain the glow sideways. -->
    <div class="landing-page overflow-x-clip">
      <UPageHero
        class="landing-hero relative"
        :ui="{
          container: 'relative z-10 py-8 sm:py-10 lg:py-10',
          wrapper: 'flex flex-col items-center',
          title: 'max-w-3xl text-balance text-4xl font-semibold sm:text-5xl tracking-[-0.045em] leading-[1.05] text-primary'
        }"
      >
        <template #title>
          <Motion
            as="span"
            v-bind="enterMotion(0.2)"
            class="inline-block"
          >
            Changelog
          </Motion>
        </template>
      </UPageHero>

      <UContainer class="pt-4 pb-8 sm:pt-5 sm:pb-10 lg:pt-6 lg:pb-12">
        <UPage :ui="{ root: 'lg:grid-cols-10', left: 'lg:col-span-2', center: 'lg:col-span-8' }">
          <template #left>
            <!-- Anchors into this one page: every release stays on it, and the
              list marks the ones on screen as the reader scrolls. On phones
              it folds into a bar above the timeline. -->
            <UContentToc
              :links="versions"
              highlight
              title="Versions"
              aria-label="Versions"
            />
          </template>

          <Motion v-bind="enterMotion(0.5)">
            <UChangelogVersions data-changelog-versions>
              <UChangelogVersion
                v-for="release in releases"
                :id="release.slug"
                :key="release.id"
                :title="release.title"
                :date="release.date"
                :ui="{
                  root: 'scroll-mt-[calc(var(--ui-header-height)+2rem)]',
                  title: 'text-xl sm:text-2xl tracking-tight'
                }"
              >
                <!-- The version links where its heading does on GitHub. A `to` on
                  the card would lay a link over the entries and their own links. -->
                <template v-if="release.to" #title>
                  <ULink :to="release.to" target="_blank" class="text-highlighted hover:text-primary">
                    {{ release.title }}
                  </ULink>
                </template>

                <template #body>
                  <ContentRenderer
                    :value="{ ...changelog, body: { type: 'minimark', value: release.nodes } }"
                    :components="{ h3: ChangelogSectionHeading }"
                    class="docs-prose mt-2 leading-relaxed text-muted *:first:mt-0 *:last:mb-0 [&_ul]:marker:text-primary"
                  />
                </template>
              </UChangelogVersion>
            </UChangelogVersions>
          </Motion>
        </UPage>
      </UContainer>

      <UPageCTA
        variant="naked"
        title="Follow the next release."
        description="Every release is tagged on GitHub. Watch the repository to hear about the next one, or open an issue to tell me what it should change."
        :links="[
          { label: 'Releases on GitHub', to: 'https://github.com/itai-gendler/pdd-kit/releases', external: true, target: '_blank', icon: 'i-simple-icons-github', color: 'neutral', variant: 'outline', size: 'lg' },
          { label: 'Read the docs', to: '/docs', trailingIcon: 'i-lucide-arrow-right', size: 'lg' }
        ]"
        :ui="{
          root: 'relative',
          container: 'max-w-3xl text-center py-16 sm:py-20 lg:py-20',
          title: 'tracking-tight',
          description: 'mx-auto max-w-xl leading-relaxed text-dimmed'
        }"
      />
    </div>
  </div>
</template>
