<script setup lang="ts">
useBusinessLensThemeLabHead()

const { pddVersion } = useRuntimeConfig().public
const { visible: themeLabVisible, toggle: toggleThemeLab } = useBusinessLensThemeLab()
const themeLabLabel = computed(() => (
  themeLabVisible.value ? 'Hide theme lab' : 'Show theme lab'
))
const year = new Date().getFullYear()

useHead({
  title: 'Local Product Model · BusinessLens',
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<template>
  <UApp>
    <div class="flex min-h-dvh flex-col">
      <NuxtLoadingIndicator />
      <BusinessLensThemeLabBar :row-count="3">
        <template #after>
          <BusinessLensReportLabRow />
        </template>
      </BusinessLensThemeLabBar>
      <UHeader :ui="{ root: 'top-(--businesslens-theme-lab-height)', right: 'gap-0.5' }">
        <template #left>
          <div class="flex items-center gap-2">
            <NuxtLink
              to="https://businesslens.io"
              external
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BusinessLens home"
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
      <main class="businesslens-page-surface flex-1">
        <NuxtPage />
      </main>
      <footer class="border-t border-default">
        <UContainer>
          <div class="flex items-center justify-between gap-6 py-4">
            <div class="flex flex-col items-start gap-2">
              <NuxtLink
                to="https://businesslens.io"
                external
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BusinessLens home"
                class="flex items-center"
              >
                <BusinessLensBrand />
              </NuxtLink>
              <p class="text-sm leading-5 text-dimmed">
                © {{ year }} BusinessLens · Local Product Model
              </p>
            </div>
            <UButton
              icon="i-simple-icons-github"
              to="https://github.com/businesslens/pdd"
              external
              target="_blank"
              rel="noopener noreferrer"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="BusinessLens on GitHub"
            />
          </div>
        </UContainer>
      </footer>
    </div>
  </UApp>
</template>
