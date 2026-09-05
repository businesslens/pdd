#!/usr/bin/env node
/**
 * Browser regressions for vocabulary navigation, against a running report.
 *
 * npm run build
 * npm run view:fixture -- --no-open --port 4317
 * node scripts/check-vocabulary-navigation.mjs http://127.0.0.1:4317
 *
 * Requires Playwright Chromium (`npx playwright install chromium`). Kept
 * separate from the Node test suite so it does not require a browser install.
 */
import { chromium, expect } from '@playwright/test'

const url = process.argv[2]
if (!url) {
  console.error('Usage: node scripts/check-vocabulary-navigation.mjs <viewer-url>')
  process.exit(1)
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url)
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  const filter = panel.getByRole('textbox', { name: 'Filter the vocabulary' })
  const step = panel.locator('[data-term="step"]')

  // Looking up the same destination twice must reveal it both times, even
  // when a new search has hidden it since the first lookup.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await filter.fill('Arc')
    await expect(step).toHaveCount(0)
    await panel.locator('[data-term="arc"]').getByRole('button', { name: 'Go to Step', exact: true }).click()
    await expect(filter).toHaveValue('')
    await expect(step).toHaveAttribute('data-marked', 'true')
    await expect(step).toBeInViewport()
  }
  console.log('Passed: repeated lookups reveal the destination.')

  // Keyboard navigation must continue from the destination, not jump back to
  // the link that initiated the lookup on the next Tab.
  await panel.locator('[data-term="arc"]').getByRole('button', { name: 'Go to Step', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(step).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(step.getByRole('link')).toBeFocused()
  await expect(step).toBeInViewport()
  console.log('Passed: keyboard navigation continues at the destination.')

  // A first lookup from a definition popover must also survive the panel's
  // mount autofocus, while retaining the underlying report location.
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await page.getByRole('button', { name: /^Interfaces \d+$/ }).click()
  const collectionUrl = page.url()
  await page.getByRole('button', { name: 'What Interface means', exact: true }).click()
  await page.getByRole('button', { name: 'What Actors means', exact: true }).click()
  const actor = panel.locator('[data-term="actor"]')
  await expect(actor).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(actor.getByRole('link')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(collectionUrl)
  console.log('Passed: opening from a popover focuses the requested term.')
} finally {
  await browser.close()
}
