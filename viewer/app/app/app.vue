<script setup lang="ts">
const { pddVersion } = useRuntimeConfig().public

useHead({
  title: 'Local Product Model · BusinessLens',
  htmlAttrs: { lang: 'en' },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Explore a local BusinessLens Product Model and its capabilities, value paths, delivery surfaces, scenarios, and rules.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231b1713'/%3E%3Cpath d='M17 14h13c8 0 13 4 13 10 0 4-2 7-6 9 5 1 9 5 9 10 0 7-6 11-15 11H17V14zm10 8v8h4c3 0 5-1 5-4s-2-4-5-4h-4zm0 16v8h5c4 0 6-1 6-4s-2-4-6-4h-5z' fill='%23f2eee5'/%3E%3C/svg%3E"
    }
  ]
})
</script>

<template>
  <UApp>
    <div class="flex h-dvh flex-col overflow-hidden">
      <NuxtLoadingIndicator />
      <UHeader :ui="{ root: 'shrink-0', right: 'gap-0.5' }">
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
      <main class="businesslens-page-surface min-h-0 flex-1">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
