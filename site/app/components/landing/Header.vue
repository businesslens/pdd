<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const {
  enabled: themeLabEnabled,
  visible: previewBarVisible,
  toggle: togglePreviewBar
} = usePddKitThemeLab()

const previewBarLabel = computed(() =>
  previewBarVisible.value ? 'Hide customization toolbars' : 'Show customization toolbars'
)

const route = useRoute()
// No `Home` — the logo already links there. No `Changelog` — it is in the footer,
// and duplicating it cost a slot the FAQ needed more. See
// docs/design/experiences/marketing.md.
const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Blueprints', to: '/blueprints' },
  { label: 'Docs', to: '/docs' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq', active: route.path === '/faq' }
])
const { isDocsPath } = useDocsTools()
// Equal outside columns keep navigation centered independently of utilities.
// At the smallest desktop width, shorten the utility group to fit its column.
const headerUi = {
  root: 'top-(--pdd-kit-theme-lab-height)',
  container: 'lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
  left: 'shrink-0 lg:flex-none',
  right: 'shrink-0 gap-0.5 lg:flex-none'
}

// Read from the `pdd-kit` SDK at build time; see `nuxt.config.ts`.
const { pddVersion } = useRuntimeConfig().public

// Dark mode is off until it reads as well as light, so its toggles are hidden.
const { darkMode } = useAppConfig().pddKit

// A repository star count is useful decoration, not part of the document. It
// must never hold a build or the browser's critical rendering work behind
// GitHub's network response, so the browser asks GitHub once per visit, when
// idle, and shows nothing if GitHub does not answer.
const stars = useState<number | null>('github-stars', () => null)
onMounted(() => {
  if (stars.value !== null) return
  runWhenIdle(() => {
    void fetchGithubStars().then((count) => { stars.value = count })
  })
})

// Hide the count until the repository has at least one star.
const githubStars = computed(() => {
  const count = stars.value
  return typeof count === 'number' && count > 0 ? formatStarCount(count) : null
})
</script>

<template>
  <!-- `top` clears the brand kit switcher bar, which sticks above the header. -->
  <UHeader :ui="headerUi" data-site-header>
    <template #default>
      <UNavigationMenu
        data-primary-navigation
        :items="items"
        variant="link"
      />
    </template>
    <template #left>
      <!-- The badge stays outside the home link so the link keeps reading as
        "pdd-kit home" rather than swallowing a version number, and it is
        never hidden by a breakpoint: the release this site documents is as much
        of the identity as the wordmark. -->
      <div class="flex items-center gap-2">
        <NuxtLink to="/" class="site-brand flex shrink-0 items-center" aria-label="pdd-kit home">
          <PddKitBrand compact-on-mobile />
        </NuxtLink>
        <UBadge
          color="primary"
          variant="subtle"
          size="sm"
          data-pdd-version
          class="shrink-0 rounded-full font-mono text-[11px] leading-none tracking-tight"
        >
          <!-- "v0.6.0" on its own tells a screen reader nothing about what is
            versioned, and Vue drops the whitespace between two element children,
            so the spoken and the drawn label are separate rather than one string
            with a prefix. -->
          <span class="sr-only">PDD version {{ pddVersion }}</span>
          <span aria-hidden="true">v{{ pddVersion }}</span>
        </UBadge>
      </div>
    </template>

    <template #right>
      <LazyLandingDocsHeaderSearch />
      <LazyLandingDocsHeaderVocabulary />
      <!-- Lets the site be checked as a visitor sees it, without the brand
        switcher bars. Leaves the header when the bars go, so it stays the way
        back. -->
      <UTooltip v-if="themeLabEnabled" :text="previewBarLabel">
        <UButton
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          :variant="previewBarVisible ? 'soft' : 'ghost'"
          :aria-label="previewBarLabel"
          :aria-pressed="previewBarVisible"
          @click="togglePreviewBar"
        />
      </UTooltip>
      <UButton
        v-if="githubStars"
        to="https://github.com/itai-gendler/pdd-kit"
        external
        target="_blank"
        color="neutral"
        variant="outline"
        class="mx-1 hidden rounded-full px-3 xl:inline-flex"
        :aria-label="`pdd-kit on GitHub, ${githubStars} stars`"
      >
        <UIcon name="i-simple-icons-github" class="size-4 shrink-0" />
        <span class="font-semibold text-highlighted">{{ githubStars }}</span>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-3.5 shrink-0 text-amber-400"
          aria-hidden="true"
        >
          <path d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.7 5.22a1 1 0 0 0 .95.69h5.49c.97 0 1.37 1.24.59 1.81l-4.44 3.23a1 1 0 0 0-.36 1.11l1.7 5.22c.3.92-.76 1.69-1.54 1.12l-4.44-3.22a1 1 0 0 0-1.18 0l-4.44 3.22c-.78.57-1.84-.2-1.54-1.12l1.7-5.22a1 1 0 0 0-.36-1.11L2.32 10.65c-.78-.57-.38-1.81.59-1.81h5.5a1 1 0 0 0 .95-.69l1.7-5.22Z" />
        </svg>
      </UButton>
      <!-- The icon-only link shows on phones too, so the repository is one tap
        away without opening the menu; from `xl` the star pill takes its place
        when the count is known. -->
      <UButton
        icon="i-simple-icons-github"
        to="https://github.com/itai-gendler/pdd-kit"
        external
        target="_blank"
        color="neutral"
        variant="ghost"
        class="max-[359px]:hidden"
        :class="{ 'xl:hidden': githubStars }"
        aria-label="pdd-kit on GitHub"
      />
      <UColorModeButton
        v-if="darkMode"
        color="neutral"
        variant="ghost"
        class="hidden lg:inline-flex"
        aria-label="Toggle color mode"
      />
      <UButton
        label="Get started"
        to="/docs"
        class="hidden xl:flex"
      />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />

      <div
        data-mobile-menu-utilities
        class="mt-4 flex items-center gap-1 border-t border-default pt-4"
      >
        <UButton
          v-if="githubStars"
          to="https://github.com/itai-gendler/pdd-kit"
          external
          target="_blank"
          color="neutral"
          variant="outline"
          class="rounded-full px-3"
          :aria-label="`pdd-kit on GitHub, ${githubStars} stars`"
        >
          <UIcon name="i-simple-icons-github" class="size-4 shrink-0" />
          <span class="font-semibold text-highlighted">{{ githubStars }}</span>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="size-3.5 shrink-0 text-amber-400"
            aria-hidden="true"
          >
            <path d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.7 5.22a1 1 0 0 0 .95.69h5.49c.97 0 1.37 1.24.59 1.81l-4.44 3.23a1 1 0 0 0-.36 1.11l1.7 5.22c.3.92-.76 1.69-1.54 1.12l-4.44-3.22a1 1 0 0 0-1.18 0l-4.44 3.22c-.78.57-1.84-.2-1.54-1.12l1.7-5.22a1 1 0 0 0-.36-1.11L2.32 10.65c-.78-.57-.38-1.81.59-1.81h5.5a1 1 0 0 0 .95-.69l1.7-5.22Z" />
          </svg>
        </UButton>
        <UButton
          v-else
          icon="i-simple-icons-github"
          to="https://github.com/itai-gendler/pdd-kit"
          external
          target="_blank"
          color="neutral"
          variant="ghost"
          aria-label="pdd-kit on GitHub"
        />
        <UColorModeButton
          v-if="darkMode"
          color="neutral"
          variant="ghost"
          aria-label="Toggle color mode"
        />
      </div>

      <div class="mt-4 grid gap-2">
        <UButton
          label="Get started"
          to="/docs"
          block
        />
      </div>

      <div
        v-if="isDocsPath"
        class="mt-6 border-t border-default pt-6"
      >
        <LazyLandingDocsMobileNavigation />
      </div>
    </template>
  </UHeader>
</template>
