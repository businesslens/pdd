<script setup lang="ts">
const { pddVersion } = useRuntimeConfig().public

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
              aria-label="BusinessLens home"
              class="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span class="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-inverted">BL</span>
              <span>BusinessLens</span>
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
