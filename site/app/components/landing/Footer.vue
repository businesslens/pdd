<script setup lang="ts">
// The compact row keeps only links that have no better home.
const links = [
  { label: 'Changelog', to: '/changelog' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'GitHub', to: 'https://github.com/itai-gendler/pdd-kit', external: true },
  { label: 'Contributing', to: 'https://github.com/itai-gendler/pdd-kit/blob/main/CONTRIBUTING.md', external: true },
  { label: 'Issues', to: 'https://github.com/itai-gendler/pdd-kit/issues', external: true }
]

// An open-source project, credited to its maintainer and contributors rather
// than to a company.
const license = 'https://github.com/itai-gendler/pdd-kit/blob/main/LICENSE'

// Two personal accounts, not the project's. The `GitHub` link in the row above
// goes to `itai-gendler/pdd-kit`; these are the human behind it, which is why they
// sit inside the credit rather than beside the product links.
const creator = {
  name: 'Itai Gendler',
  links: [
    { icon: 'i-simple-icons-github', to: 'https://github.com/itai-gendler', network: 'GitHub' },
    { icon: 'i-simple-icons-linkedin', to: 'https://www.linkedin.com/in/itaig/', network: 'LinkedIn' }
  ]
}

const year = new Date().getFullYear()
</script>

<template>
  <!-- The content lives in `#top` so it spans the footer itself. UFooter's own
    container renders an empty flex row underneath, and plain `hidden` loses the
    tailwind-merge tie against its default `flex`, so it needs `hidden!`. The
    `top` wrapper's `py-8 lg:py-12` is zeroed for the same reason: the row below
    owns the vertical rhythm. The important modifiers keep the component's
    responsive defaults from restoring that padding.
  -->
  <UFooter
    data-landing-footer
    :ui="{ root: 'border-t border-default', top: 'py-0! lg:py-0!', container: 'hidden!' }"
  >
    <template #top>
      <UContainer>
        <div
          class="flex flex-col items-center gap-5 py-4 text-center lg:flex-row lg:justify-between lg:gap-6 lg:text-left"
        >
          <div class="flex flex-col items-center gap-2 lg:items-start">
            <NuxtLink to="/" class="flex items-center" aria-label="pdd-kit home">
              <PddKitBrand />
            </NuxtLink>
            <p class="max-w-sm text-sm leading-5 text-dimmed">
              <NuxtLink
                :to="license"
                external
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-2 transition-colors hover:text-highlighted"
              >MIT licensed</NuxtLink> · © {{ year }} Itai Gendler and contributors
            </p>
          </div>

          <nav aria-label="Footer">
            <ul class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <li v-for="link in links" :key="link.label">
                <NuxtLink
                  :to="link.to"
                  :external="link.external"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                  class="text-sm text-dimmed transition-colors hover:text-highlighted"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <div class="flex items-center gap-1">
            <p class="text-sm text-dimmed">
              Created by
              <span class="text-default">{{ creator.name }}</span>
            </p>
            <UButton
              v-for="link in creator.links"
              :key="link.network"
              :icon="link.icon"
              :to="link.to"
              external
              target="_blank"
              rel="noopener noreferrer"
              color="neutral"
              variant="ghost"
              size="sm"
              class="ml-1"
              :aria-label="`${creator.name} on ${link.network}`"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UFooter>
</template>
