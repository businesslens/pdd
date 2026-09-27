/**
 * Browser regression for Variations in the Fixture Shop report.
 *
 * Run against `npm run view:fixture -- --no-open --port 43213` after building:
 *   node scripts/check-variations.mjs [viewer-url]
 * Set BLR_VARIATION_SCREENSHOTS to a directory to save captures.
 */
import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const origin = process.argv[2] || 'http://127.0.0.1:43213'
const output = process.env.BLR_VARIATION_SCREENSHOTS
if (output) await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []

async function page(url, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  const tab = await context.newPage()
  tab.on('pageerror', error => errors.push(error.message))
  await tab.goto(`${origin}/${url}`)
  return { context, tab }
}
async function capture(tab, name) {
  if (!output) return
  await tab.evaluate(() => document.fonts.ready)
  await tab.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' })
}

try {
  { // The collection: one row per set, grouped by the type it varies.
    const { context, tab } = await page('?s=variation')
    await expect(tab.getByRole('button', { name: 'Variations', exact: true })).toHaveAttribute('data-current', 'true')
    const headers = tab.locator('[data-group-header]')
    await expect(headers).toHaveText([/Interfaces\s*1/, /Screens\s*1/, /Business Rules\s*1/])
    await expect(tab.locator('.blr-resource-row')).toHaveCount(3)
    await expect(tab.locator('[data-variation-mark]')).toHaveCount(3)
    await expect(tab.locator('[data-variation-chooser]').first()).toContainText('Discriminator')
    await capture(tab, 'collection')
    await context.close()
  }

  { // A list: the two refund alternatives are one row, picked from the pill.
    const { context, tab } = await page('?s=rule')
    await expect(tab.locator('.blr-resource-row[data-resource-key="variation:refund-review"]')).toHaveCount(1)
    await expect(tab.locator('.blr-resource-row[data-resource-key="rule:refund-review-standard"]')).toHaveCount(0)
    await expect(tab.getByRole('heading', { level: 1 })).toContainText('14')
    const pill = tab.getByRole('button', { name: 'Alternatives: Configuration · 2 alternatives' })
    await pill.focus()
    await tab.keyboard.press('Enter')
    const switcher = tab.locator('[data-variation-switcher]')
    await expect(switcher.locator('[data-variation-option]')).toHaveText([/Standard refund review/, /Strict refund review/])
    await capture(tab, 'list-switcher')
    await switcher.locator('[data-variation-option]').filter({ hasText: 'Strict refund review' }).click()
    await expect(switcher).toHaveCount(0)
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Strict refund review')
    await expect(dialog.getByRole('button', { name: 'Variation: Refund review' })).toBeVisible()
    await expect(dialog.locator('[data-variation-choice] [data-selected-when]')).toContainText('Strict')
    await capture(tab, 'member')

    // Switch to the other alternative from the header, then open the set.
    await dialog.getByRole('button', { name: 'Variation: Refund review' }).click()
    await expect(switcher.locator('[data-variation-option][aria-current="page"]')).toContainText('Strict refund review')
    await switcher.locator('[data-variation-option]').filter({ hasText: 'Standard refund review' }).click()
    await expect(switcher).toHaveCount(0)
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Standard refund review')
    await dialog.getByRole('button', { name: 'Variation: Refund review' }).click()
    await switcher.locator('[data-variation-open-set]').click()
    await expect(switcher).toHaveCount(0)
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Refund review')
    await expect(dialog.locator('[data-resource-context]')).toContainText('Business Rule variation')
    await expect(dialog.getByRole('tab')).toHaveText([/Overview/, /Alternatives\s*2/, /Connections/])
    await expect(dialog.locator('[data-variation-how]')).toContainText('Takes effect')
    await capture(tab, 'set-overview')
    await dialog.getByRole('tab', { name: /Alternatives/ }).click()
    await expect(dialog.locator('[data-variation-alternative]')).toHaveCount(2)
    await capture(tab, 'set-alternatives')
    await tab.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await context.close()
  }

  { // A tab: Refund's Business Rules read the pair as their set.
    const { context, tab } = await page('?s=entity&e=entity:refund&rt=rules')
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.locator('[data-attached-rules] .blr-resource-row[data-resource-key="variation:refund-review"]')).toHaveCount(1)
    await expect(dialog.locator('[data-attached-rules] .blr-resource-row[data-resource-key="rule:refund-review-strict"]')).toHaveCount(0)
    await capture(tab, 'entity-rules')
    await context.close()
  }

  { // The tree: one node for the experiment, five Screens under it, Screens still 6.
    const { context, tab } = await page('?s=interface')
    await tab.getByRole('combobox', { name: 'Rows per line' }).click()
    await tab.getByRole('option', { name: '1 per row', exact: true }).click()
    const card = tab.locator('[data-card-key="interface:customer-web"]')
    await expect(card.locator('[role=treeitem]').filter({ hasText: /^\s*Screens\s*6\s*$/ })).toHaveCount(1)
    await expect(card.getByRole('button', { name: 'Alternatives: Experiment · 5 alternatives' })).toBeVisible()
    await expect(card.getByRole('button', { name: /^Variation: / })).toHaveCount(0)
    await capture(tab, 'tree')
    await context.close()
  }

  { // Phone width: nothing scrolls sideways, and the pill stays reachable.
    const { context, tab } = await page('?s=rule&e=rule:refund-review-strict', { width: 390, height: 844 })
    await expect(tab.locator('[role=dialog]').getByRole('button', { name: 'Variation: Refund review' })).toBeVisible()
    expect(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await capture(tab, 'member-phone')
    await context.close()
  }

  if (errors.length) throw new Error(`Page errors:\n${errors.join('\n')}`)
  console.log('Variations: collection, set rows, switcher, readings, tab, tree and phone width passed.')
} finally {
  await browser.close()
}
