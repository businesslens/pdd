<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * The site's own error page, rendered inside the default layout so a visitor
 * who mistypes a URL still sees the header, the footer and the brand.
 *
 * The title follows the secondary pages: a plain statement in the brass accent.
 * The requested path is shown in mono and allowed to break anywhere, because a
 * long hyphenated slug otherwise splits mid-word or runs off a phone screen.
 */
const { error } = defineProps<{ error: NuxtError }>()

const route = useRoute()
const notFound = computed(() => error.statusCode === 404)
const title = computed(() => notFound.value ? 'Page not found' : 'Something went wrong')

useSeoMeta({
  title: () => `${title.value} · pdd-kit`,
  robots: 'noindex'
})

// A static host answers an unknown URL with the generated 404.html shell. Nuxt
// starts there already in the error state and never writes head tags to the
// document, so set the title, which the tab and screen readers need, directly.
onMounted(() => {
  document.title = `${title.value} · pdd-kit`
})

const links = [
  { label: 'Browse Blueprints', to: '/blueprints' },
  { label: 'Read the docs', to: '/docs' }
]

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <!-- Error pages do not render app.vue, so they need their own UApp for the
    tooltip and toast context the header and its dialogs use. -->
  <UApp>
    <NuxtLayout>
      <section class="landing-page px-4 py-20 sm:px-6 sm:py-28">
        <div class="mx-auto max-w-xl text-center">
          <h1 class="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl">
            {{ title }}
          </h1>
          <p class="mt-5 text-base leading-relaxed text-muted">
            <template v-if="notFound">
              Error {{ error.statusCode }}: nothing lives at
              <code class="font-mono text-sm text-highlighted [overflow-wrap:anywhere]">{{ route.path }}</code>.
            </template>
            <template v-else>
              Error {{ error.statusCode }}. Try again in a moment.
            </template>
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <UButton label="Go to the home page" size="lg" @click="goHome" />
            <UButton
              v-for="link in links"
              :key="link.to"
              :label="link.label"
              :to="link.to"
              color="neutral"
              variant="outline"
              size="lg"
            />
          </div>
        </div>
      </section>
    </NuxtLayout>
  </UApp>
</template>
