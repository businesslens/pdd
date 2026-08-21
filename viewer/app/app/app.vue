<script setup lang="ts">
useBusinessLensThemeHead()
useBusinessLensThemeLabHead()

const { pddVersion } = useRuntimeConfig().public
const { visible: themeLabVisible, toggle: toggleThemeLab } = useBusinessLensThemeLab()
const themeLabLabel = computed(() => (
  themeLabVisible.value ? 'Hide theme lab' : 'Show theme lab'
))

useHead({
  title: 'Local Product Model · BusinessLens',
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Explore a local BusinessLens Product Model and its capabilities, value paths, delivery surfaces, scenarios, and rules.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<template>
  <UApp>
    <!--
      The report owns the one vertical content scroll. Keeping the host bound
      to the viewport leaves both chrome rows in place while the reading moves.
    -->
    <div class="flex h-dvh flex-col overflow-hidden">
      <NuxtLoadingIndicator />
      <BusinessLensThemeLabBar :row-count="2">
        <template #before>
          <BusinessLensWorkbenchLabRow />
        </template>
      </BusinessLensThemeLabBar>
      <UHeader
        sticky
        :ui="{ root: 'top-(--businesslens-theme-lab-height) shrink-0', right: 'gap-0.5' }"
      >
        <template #left>
          <div class="flex items-center gap-2.5">
            <NuxtLink
              to="https://businesslens.io"
              external
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BusinessLens"
              class="flex items-center"
            >
              <BusinessLensBrand compact-on-mobile />
            </NuxtLink>
            <UBadge
              color="primary"
              variant="subtle"
              size="sm"
              data-pdd-version
              class="shrink-0 rounded-full font-mono text-[11px] leading-none tracking-tight"
            >
              <span class="sr-only">PDD version {{ pddVersion }}</span>
              <span aria-hidden="true">v{{ pddVersion }}</span>
            </UBadge>
          </div>
        </template>

        <template #right>
          <UTooltip :text="themeLabLabel">
            <UButton
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              :variant="themeLabVisible ? 'soft' : 'ghost'"
              :aria-label="themeLabLabel"
              :aria-pressed="themeLabVisible"
              @click="toggleThemeLab"
            />
          </UTooltip>
          <UButton
            to="https://github.com/businesslens/pdd"
            external
            target="_blank"
            icon="i-simple-icons-github"
            color="neutral"
            variant="ghost"
            class="hidden lg:inline-flex"
            aria-label="BusinessLens on GitHub"
          />
          <UColorModeButton
            color="neutral"
            variant="ghost"
            class="hidden lg:inline-flex"
            aria-label="Toggle color mode"
          />
          <UButton
            label="View docs"
            to="https://businesslens.io/docs"
            external
            target="_blank"
            class="ms-1 hidden lg:inline-flex"
          />
        </template>

        <template #body>
          <div class="grid gap-2">
            <UButton
              to="https://github.com/businesslens/pdd"
              external
              target="_blank"
              color="neutral"
              variant="outline"
              class="rounded-full px-3"
              aria-label="BusinessLens on GitHub"
              block
            >
              <UIcon name="i-simple-icons-github" class="size-4 shrink-0" />
              <span class="font-semibold text-highlighted">GitHub</span>
            </UButton>
            <UButton
              label="View docs"
              to="https://businesslens.io/docs"
              external
              target="_blank"
              block
            />
            <div class="flex justify-center border-t border-default pt-2">
              <UColorModeButton color="neutral" variant="ghost" aria-label="Toggle color mode" />
            </div>
          </div>
        </template>
      </UHeader>
      <main
        class="businesslens-page-surface min-h-0 flex-1 overflow-hidden"
        :style="{
          '--businesslens-report-chrome':
            'calc(var(--ui-header-height) + var(--businesslens-theme-lab-height))'
        }"
      >
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
