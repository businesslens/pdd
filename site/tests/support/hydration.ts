import type { Page } from '@playwright/test'

/**
 * Generated pages arrive as finished HTML, so their controls are on screen
 * before Nuxt has hydrated them. Typing or clicking in that window is lost,
 * which a slow runner turns into a flaky test; wait for the app's own flag.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt') as (Element & { __vue_app__?: { $nuxt?: { isHydrating?: boolean } } }) | null
    return root?.__vue_app__?.$nuxt?.isHydrating === false
  })
}
