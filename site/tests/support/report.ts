import type { Page } from '@playwright/test'
import { waitForHydration } from './hydration'

/**
 * The Product Report arrives prerendered, so its rail and rows are on screen
 * before Nuxt has hydrated them. Wait for the viewer and for hydration before
 * interacting with the report.
 */
export async function expectReportHydrated(page: Page): Promise<void> {
  await page.locator('[data-pdd-kit-report-viewer]').waitFor()
  await waitForHydration(page)
}
