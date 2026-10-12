import { initializePostHog } from '~/utils/posthog'

/**
 * Analytics is configured when the site is generated: a build with
 * NUXT_PUBLIC_POSTHOG_KEY sends to PostHog, and one without it never loads the
 * client. A static host has no server to ask at runtime.
 */
export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public
  const key = String(posthogKey ?? '').trim()
  const host = String(posthogHost ?? '').replace(/\/+$/, '')
  // Do not await this optional integration and delay hydration, but start it
  // immediately so a short visit is not left outside the capture window.
  void initializePostHog({
    fetchConfig: async () => key.startsWith('phc_') && host.startsWith('https://')
      ? { enabled: true, key, host }
      : { enabled: false }
  })
})
