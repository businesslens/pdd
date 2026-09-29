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
  { // The collection: one row per set, grouped by the type each varies; a Scenario set sits under its owner.
    const { context, tab } = await page('?s=variation')
    await expect(tab.getByRole('button', { name: 'Variations', exact: true })).toHaveAttribute('data-current', 'true')
    await expect(tab.locator('[data-group-header]')).toHaveCount(9)
    await expect(tab.locator('.blr-resource-row')).toHaveCount(10)
    await expect(tab.locator('[data-variation-owner]')).toHaveText(['Checkout', 'Payment settlement', 'Browse and buy'])
    await expect(tab.locator('[data-variation-picked]').first()).toHaveText('2 alternatives')
    await expect(tab.locator('[data-variation-chooser]').filter({ hasText: 'Discriminator' })).toHaveCount(1)
    await capture(tab, 'collection')
    await context.close()
  }

  { // A list: the refund pair is one row; picking an alternative opens it under the set's title.
    const { context, tab } = await page('?s=rule')
    await expect(tab.locator('.blr-resource-row[data-resource-key="variation:refund-review"]')).toHaveCount(1)
    await expect(tab.locator('.blr-resource-row[data-resource-key="rule:refund-review-standard"]')).toHaveCount(0)
    await expect(tab.getByRole('heading', { level: 1 })).toContainText('14')
    const picker = tab.getByRole('button', { name: 'Refund review: 2 alternatives' })
    await picker.focus()
    await tab.keyboard.press('Enter')
    const switcher = tab.locator('[data-variation-switcher]')
    await expect(switcher.locator('[data-variation-option]')).toHaveText([/Standard refund review/, /Strict refund review/])
    // A row reads nothing yet: its set heads the menu as a way in, never as the one being read.
    await expect(switcher.locator('[data-variation-open-set]')).not.toHaveAttribute('aria-current', 'true')
    await capture(tab, 'list-switcher')
    await switcher.locator('[data-variation-option]').filter({ hasText: 'Strict refund review' }).click()
    await expect(switcher).toHaveCount(0)
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Refund review')
    await expect(dialog.locator('[data-resource-context]')).toContainText('Business Rule variation · Configuration')
    const header = dialog.getByRole('button', { name: 'Refund review alternative: Strict refund review' })
    await expect(header).toBeVisible()
    await expect(dialog.locator('[data-variation-choice] [data-selected-when]')).toContainText('Strict')
    await capture(tab, 'member')

    // Switching in the header keeps the title and replaces the reading: no Back step.
    await header.click()
    await expect(switcher.locator('[data-variation-option][aria-current="true"]')).toContainText('Strict refund review')
    await switcher.locator('[data-variation-option]').filter({ hasText: 'Standard refund review' }).click()
    await expect(switcher).toHaveCount(0)
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Refund review')
    await expect(dialog.getByRole('button', { name: 'Refund review alternative: Standard refund review' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Back to / })).toHaveCount(0)
    await expect(tab).toHaveURL(/e=rule%3Arefund-review-standard|e=rule:refund-review-standard/)

    // The set's own reading: the same title, the picker counting its alternatives.
    await dialog.getByRole('button', { name: 'Refund review alternative: Standard refund review' }).click()
    // The set heads its own menu, named once, and opens its reading.
    await expect(switcher.locator('[data-variation-open-set]')).toContainText('Refund review')
    await expect(switcher).not.toContainText('How one is chosen')
    await switcher.locator('[data-variation-open-set]').click()
    await expect(switcher).toHaveCount(0)
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Refund review')
    await expect(dialog.getByRole('button', { name: 'Refund review: 2 alternatives' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Refund review: 2 alternatives' }).click()
    await expect(switcher.locator('[data-variation-open-set]')).toHaveAttribute('aria-current', 'true')
    await tab.keyboard.press('Escape')
    await expect(switcher).toHaveCount(0)
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

  { // A Scenario set: its reading names the Capability its Scenarios belong to.
    const { context, tab } = await page('?s=variation&e=variation:checkout-review')
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.locator('[data-resource-context]')).toContainText(/Capability Scenario variation · Experiment\s*in\s*Checkout/)
    await context.close()
  }

  { // Scenarios: the alternatives are one card, switched in place under the parent's title.
    const { context, tab } = await page('?s=capability&e=capability:place-order&rt=scenarios')
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.getByRole('tab', { name: /Scenarios/ })).toHaveText(/Scenarios\s*4/)
    await expect(dialog.locator('[data-row-key]')).toHaveCount(3)
    const card = dialog.locator('[data-row-key="variation:checkout-review"]')
    await expect(card.locator('[data-scenario-title]')).toHaveText('Checkout review')
    await card.getByRole('button', { name: 'Checkout review alternative: Complete checkout' }).click()
    const switcher = tab.locator('[data-variation-switcher]')
    await switcher.locator('[data-variation-option]').filter({ hasText: 'without review' }).click()
    await expect(switcher).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Checkout review alternative: Complete checkout without review' })).toBeVisible()
    await expect(card.locator('[data-selected-when]')).toContainText('Skip review')
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Checkout')
    await expect(tab).toHaveURL(/e=capability%3Aplace-order|e=capability:place-order/)
    await capture(tab, 'scenario-card')
    await context.close()
  }

  { // A Scenario address reads its parent, with the requested alternative on the card.
    const { context, tab } = await page('?s=capability&e=capability-scenario:complete-checkout-without-review')
    const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Checkout')
    await expect(dialog.getByRole('tab', { name: /Scenarios/ })).toHaveAttribute('aria-selected', 'true')
    await expect(dialog.getByRole('tab', { name: /References/ })).toHaveText(/References\s*1/)
    const card = dialog.locator('[data-row-key="variation:checkout-review"]')
    await card.getByRole('button', { name: 'Checkout review alternative: Complete checkout without review' }).click()
    await tab.locator('[data-variation-switcher] [data-variation-option]').filter({ hasText: /^\s*Complete checkout\s*The/ }).click()
    await expect(tab).toHaveURL(/complete-checkout(&|$)/)
    await expect(dialog.locator('[data-resource-title]')).toHaveText('Checkout')
    await expect(dialog.getByRole('button', { name: /^Back to / })).toHaveCount(0)
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

  { // The tree: every alternative under its set's node, even alone, with what is not here named.
    const { context, tab } = await page('?s=interface')
    await tab.getByRole('combobox', { name: 'Rows per line' }).click()
    await tab.getByRole('option', { name: '1 per row', exact: true }).click()
    await tab.getByRole('button', { name: 'Expand all' }).first().click()
    const card = tab.locator('[data-card-key="interface:customer-web"]')
    await expect(card.getByRole('button', { name: 'Stock disclosure: 2 alternatives' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Cancellation handling: 2 alternatives' }).first()).toBeVisible()
    // An alternative not at this place is struck with a badge, in the tree and in the node's picker.
    const mobile = tab.locator('[data-card-key="interface:customer-mobile"]')
    await expect(mobile.locator('[data-variation-absent]').filter({ hasText: 'Not on this Screen' }).first()).toBeVisible()
    await mobile.getByRole('button', { name: 'Cancellation handling: 2 alternatives' }).first().click()
    const absent = tab.locator('[data-variation-switcher] [data-variation-absent-option]')
    await expect(absent).toContainText('Cancellation request')
    await expect(absent).toContainText('Not on this Screen')
    await expect(tab.locator('[data-tree-note]').filter({ hasText: /Steps? .* here/ })).toHaveCount(0)
    await capture(tab, 'tree-absent')
    await tab.keyboard.press('Escape')
    await expect(card.getByRole('button', { name: / alternative: / })).toHaveCount(0)
    await capture(tab, 'tree')
    await context.close()
  }

  { // Phone width: nothing scrolls sideways, and the picker stays reachable.
    const { context, tab } = await page('?s=rule&e=rule:refund-review-strict', { width: 390, height: 844 })
    await expect(tab.locator('[role=dialog]').getByRole('button', { name: 'Refund review alternative: Strict refund review' })).toBeVisible()
    expect(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await capture(tab, 'member-phone')
    await context.close()
  }

  if (errors.length) throw new Error(`Page errors:\n${errors.join('\n')}`)
  console.log('Variations: collection, owners, set-first titles, pickers, Scenario cards and addresses, tab, tree and phone width passed.')
} finally {
  await browser.close()
}
