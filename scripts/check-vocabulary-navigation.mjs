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
  const list = panel.locator('[data-vocabulary-list]')
  const step = panel.locator('[data-term="step"]')
  await expect(filter).toBeFocused()
  await filter.fill('Step')
  await expect(panel.locator('[data-term]').first()).toHaveAttribute('data-term', 'step')
  await filter.fill('')
  await expect(panel.locator('[data-term="product-model"]')).toBeVisible()
  await filter.fill('Arc')
  await panel.getByRole('button', { name: 'Clear the filter', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(filter).toBeFocused()
  console.log('Passed: general desktop lookups focus search and rank the exact term first.')

  // Looking up the same destination twice must reveal it both times, even
  // when a new search has hidden it since the first lookup.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await filter.fill('Arc')
    await expect(step).toHaveCount(0)
    await panel.locator('[data-term="arc"]').getByRole('button', { name: 'Go to Step', exact: true }).click()
    await expect(filter).toHaveValue('')
    await expect(step).toHaveAttribute('data-marked', 'true')
    await expect(step).toBeInViewport()
    await filter.fill('Product')
    await expect(panel.locator('[data-term]').first()).toHaveAttribute('data-term', 'product')
    await expect(panel.locator('[data-term="product"]')).toBeInViewport()
    await expect(panel.locator('[data-marked="true"]')).toHaveCount(0)
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBe(0)
    await expect(panel.getByRole('button', { name: /^Back to / })).toHaveCount(0)
  }
  console.log('Passed: repeated lookups reveal the destination; new searches reset position and selection.')

  // Keyboard navigation must continue from the destination, not jump back to
  // the link that initiated the lookup on the next Tab.
  await filter.fill('Arc')
  const arc = panel.locator('[data-term="arc"]')
  await arc.getByRole('button', { name: 'Go to Step', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(step).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(step.getByRole('link')).toBeFocused()
  await expect(step).toBeInViewport()
  console.log('Passed: keyboard navigation continues at the destination.')

  // Two levels of history restore both a scrolled, marked term and a filtered
  // search. Focus resumes at the original row, even when the Back button leaves.
  const stepScroll = await list.evaluate(el => el.scrollTop)
  await step.getByRole('button', { name: 'Go to Actor', exact: true }).click()
  await expect(panel.locator('[data-term="actor"]')).toBeFocused()
  await panel.getByRole('button', { name: 'Back to Step', exact: true }).click()
  await expect(step).toBeFocused()
  await expect(step).toHaveAttribute('data-marked', 'true')
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeCloseTo(stepScroll, 0)
  await panel.getByRole('button', { name: 'Back to Arc', exact: true }).click()
  await expect(filter).toHaveValue('Arc')
  await expect(arc).toBeFocused()
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBe(0)
  await expect(panel.getByRole('button', { name: /^Back to / })).toHaveCount(0)
  console.log('Passed: Back restores search, scroll position, selection, and keyboard focus across multiple lookups.')

  // A first lookup from a definition popover must also survive the panel's
  // mount autofocus, while retaining the underlying report location.
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await page.getByRole('button', { name: /^Interfaces \d+$/ }).click()
  const collectionUrl = page.url()
  const interfaces = page.getByRole('button', { name: 'Interfaces — what Interface means', exact: true })
  await interfaces.click()
  await page.getByRole('button', { name: 'Actors — show definition', exact: true }).click()
  const actor = panel.locator('[data-term="actor"]')
  await expect(actor).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(actor.getByRole('link')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(collectionUrl)
  await expect(interfaces).toBeFocused()
  console.log('Passed: popover handoffs focus the requested term and return to the original report trigger on close.')

  // Alternate surface labels must remain available to heading navigation and
  // voice control, even when their definitions use a different canonical term.
  const orderUrl = new URL(url)
  orderUrl.searchParams.set('s', 'entity')
  orderUrl.searchParams.set('e', 'entity:order')
  await page.goto(orderUrl.href)
  for (const [label, term] of [
    ['Subject', 'Domain'],
    ['Relationships', 'Relation'],
    ['Kept', 'Information kept'],
    ['coverage', 'Coverage']
  ]) {
    const button = page.locator('button.blr-term').filter({ hasText: new RegExp(`^${label}$`) })
    await expect(button).toHaveAccessibleName(`${label} — what ${term} means`)
  }
  await expect(page.getByRole('heading', { name: 'Subject — what Domain means', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Relationships — what Relation means \d+$/ })).toBeVisible()
  console.log('Passed: heading and button names retain their visible labels.')

  // The acting Entity's Kind classifies person versus system; it must not
  // open the general Actor definition just because the two terms are related.
  for (const id of ['shopper', 'payment-gateway']) {
    const entityUrl = new URL(url)
    entityUrl.searchParams.set('s', 'entity')
    entityUrl.searchParams.set('e', `entity:${id}`)
    await page.goto(entityUrl.href)
    const entityKind = page.getByRole('button', { name: 'Kind — what Entity kind means', exact: true })
    await entityKind.click()
    const kindDefinition = page.getByRole('dialog', { name: 'Kind — what Entity kind means', exact: true })
    await expect(kindDefinition).toContainText('Whether an Entity that acts on the Product is a person or a system.')
    await expect(kindDefinition.getByRole('link', { name: 'Read more in Entities', exact: true }))
      .toHaveAttribute('href', 'https://businesslens.io/docs/entities#actors-an-entity-that-acts')
    await page.keyboard.press('Escape')
    await expect(entityKind).toBeFocused()
  }
  console.log('Passed: person and system Entities explain Kind as an Entity classification.')
  await page.goto(orderUrl.href)

  // Both kinds of definition trigger keep a clear keyboard focus indicator in
  // either theme, and dismissing the popover restores focus to its trigger.
  for (const colorScheme of ['light', 'dark']) {
    await page.reload()
    const subject = page.getByRole('button', { name: 'Subject — what Domain means', exact: true })
    await expect(subject).toBeVisible()
    const html = page.locator('html')
    if (!(await html.getAttribute('class') ?? '').split(/\s+/).includes(colorScheme)) {
      await page.getByRole('button', { name: 'Toggle color mode', exact: true }).click()
    }
    await expect(html).toHaveClass(new RegExp(`(?:^|\\s)${colorScheme}(?:\\s|$)`))
    await page.keyboard.press('Tab')
    await subject.focus()
    await expect(subject).toHaveCSS('outline-style', 'solid')
    await expect(subject).toHaveCSS('outline-width', '2px')
    await page.keyboard.press('Enter')
    const mention = page.getByRole('button', { name: 'Capability — show definition', exact: true })
    await mention.focus()
    await expect(mention).toHaveCSS('outline-style', 'solid')
    await expect(mention).toHaveCSS('outline-width', '2px')
    await page.keyboard.press('Escape')
    await expect(subject).toBeFocused()
  }
  console.log('Passed: definition triggers show keyboard focus in light and dark themes.')

  // Mobile collection headings expose the same definition, with enough room
  // for either overlay at narrow widths. A general lookup must not summon the
  // software keyboard before the reader asks to type.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true
  })
  await mobile.goto(collectionUrl)
  const mobileTerm = mobile.getByRole('button', { name: 'Interfaces — what Interface means', exact: true })
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 })
    await mobileTerm.click()
    const popover = mobile.getByRole('dialog', { name: 'Interfaces — what Interface means', exact: true })
    await expect(popover).toBeVisible()
    const bounds = await popover.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(15)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 15)
    await mobile.keyboard.press('Escape')
  }
  await mobile.getByRole('button', { name: 'Open the vocabulary', exact: true }).click()
  const mobilePanel = mobile.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(mobilePanel).toBeVisible()
  await expect(mobilePanel.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await expect(mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' })).not.toBeFocused()
  // Wait for the opening slide before measuring its final viewport bounds.
  await expect.poll(async () => {
    const bounds = await mobilePanel.boundingBox()
    return bounds.x + bounds.width
  }).toBeLessThanOrEqual(320)
  const mobileBounds = await mobilePanel.boundingBox()
  expect(mobileBounds.x).toBeGreaterThanOrEqual(0)
  expect(mobileBounds.x + mobileBounds.width).toBeLessThanOrEqual(320)
  expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await mobile.close()
  console.log('Passed: mobile definitions and vocabulary fit narrow viewports without unwanted search autofocus.')
} finally {
  await browser.close()
}
