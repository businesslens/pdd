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

async function checkBreadcrumbDefinitions(page, touch = false) {
  for (const route of [
    { section: 'entity', key: 'entity:order', collection: 'Entities', term: 'Entity' },
    { section: 'capability', key: 'capability-scenario:complete-checkout', collection: 'Capabilities', term: 'Capability', parent: 'Checkout', parentKey: 'capability:place-order' },
    { section: 'journey', key: 'journey-scenario:browse-and-complete-checkout', collection: 'Journeys', term: 'Journey', parent: 'Browse and buy', parentKey: 'journey:browse-and-buy' }
  ]) {
    const target = new URL(url)
    target.searchParams.set('s', route.section)
    target.searchParams.set('e', route.key)
    await page.goto(target.href)
    const header = page.locator('.blr-report-header')
    const name = `${route.collection} — what ${route.term} means`
    const help = header.getByRole('button', { name, exact: true })
    await expect(help).toBeVisible()
    // Icons must be bundled in the static report, which has no icon API.
    await expect(help.locator('.blr-term-mark')).toHaveCSS('mask-image', /url\(/)
    const bounds = await help.boundingBox()
    const viewport = page.viewportSize()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
    expect(bounds.width).toBeGreaterThanOrEqual(touch ? 44 : 24)
    expect(bounds.height).toBeGreaterThanOrEqual(touch ? 44 : 24)
    const current = header.locator('[aria-current="page"]:visible')
    expect((await current.boundingBox()).width).toBeGreaterThanOrEqual(40)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    const resourceUrl = page.url()
    await help.click()
    const definition = page.getByRole('dialog', { name, exact: true })
    await expect(definition.getByText(route.term, { exact: true })).toBeVisible()
    await expect(definition.getByRole('link', { name: `Read more in ${route.collection}`, exact: true })).toBeVisible()
    await expect(page).toHaveURL(resourceUrl)
    await page.keyboard.press('Escape')
    await expect(help).toBeFocused()
    await page.keyboard.press('Space')
    await expect(definition).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(help).toBeFocused()

    if (route.parent) {
      await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
      const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
      const term = panel.locator(`[data-term="${route.key.split(':')[0]}"]`)
      // Being in the viewport is insufficient: the sticky category heading
      // must not cover the Scenario's title or its documentation link.
      for (const element of [term.getByRole('heading'), term.getByRole('link')]) {
        await expect.poll(() => element.evaluate(el => {
          const bounds = el.getBoundingClientRect()
          return [bounds.top + 1, bounds.bottom - 1].every(y =>
            el.contains(document.elementFromPoint(bounds.left + bounds.width / 2, y)))
        })).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(panel).toBeHidden()
      await expect(page).toHaveURL(resourceUrl)

      await header.getByRole('button', { name: `Back to ${route.parent}`, exact: true }).click()
      await expect.poll(() => new URL(page.url()).searchParams.get('e')).toBe(route.parentKey)
      await expect(help).toBeVisible()
    }
    await header.getByRole('button', { name: `Back to ${route.collection}`, exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('e')).toBeNull()
    // The same definition remains available when the collection is current.
    await help.click()
    await expect(definition).toBeVisible()
    await page.keyboard.press('Escape')
  }
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url)
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  const filter = panel.getByRole('textbox', { name: 'Filter the vocabulary' })
  const list = panel.locator('[data-vocabulary-list]')
  const step = panel.locator('[data-term="step"]')
  await expect(filter).toBeFocused()
  await expect(list.getByText('CLI', { exact: true })).toHaveCount(0)
  // Page groups are the only browsing level; documentation categories do not
  // introduce separate containers around them.
  await expect(list.locator(':scope > section:not([data-vocabulary-page])')).toHaveCount(0)

  // Browsing has page context; opening one page reveals its nested definitions.
  const entitiesGroup = panel.getByRole('button', { name: /^Entities \d+ more terms$/ })
  const entitiesBody = panel.locator('[data-vocabulary-page="entities"] > div')
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'false')
  await expect(entitiesBody).toBeHidden()
  await entitiesGroup.focus()
  await page.keyboard.press('Enter')
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'true')
  // The page's own term is the section's meaning: stated in its head, never a row.
  await expect(entitiesBody).toContainText('A distinct thing the Product keeps')
  await expect(entitiesBody.getByRole('heading', { name: 'Entity', exact: true })).toHaveCount(0)
  const entityEntry = panel.locator('[data-term="actor"]')
  await expect(entityEntry).toBeVisible()
  const definitionBounds = await entityEntry.locator('p').boundingBox()
  // The head says the page once. A row's way out keeps its own anchor as an icon
  // on the term's line, rather than repeating the page name under every meaning.
  await expect(entityEntry.getByRole('link', { name: 'Read more in Entities', exact: true })).toHaveCount(0)
  const documentation = entityEntry.getByRole('link', { name: 'Read more in Entities, at Actor', exact: true })
  const linkBounds = await documentation.boundingBox()
  expect(linkBounds.y).toBeLessThan(definitionBounds.y)
  expect(linkBounds.x).toBeGreaterThan((await entityEntry.getByRole('heading', { name: 'Actor' }).boundingBox()).x)
  await expect(documentation).toHaveAttribute('target', '_blank')
  await expect(entitiesBody.getByRole('link', { name: 'Read more in Entities', exact: true })).toHaveCount(1)
  await entitiesGroup.click()
  await expect(entityEntry).toBeHidden()
  // Product leads the combined section, with every Model overview term beneath it.
  const productHead = panel.locator('[data-vocabulary-page="product"] [data-term="product"]')
  await expect(productHead).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-vocabulary-page]').first()).toHaveAttribute('data-vocabulary-page', 'product')
  await expect(panel.locator('[data-vocabulary-page="product-model"]')).toHaveCount(0)
  await expect(panel.locator('[data-vocabulary-page="product"] article[data-term]')).toHaveCount(6)
  await expect(panel.locator('[data-vocabulary-page="product"]'))
    .toContainText('The one coherent value promise this model describes')
  const desktopWidth = (await panel.boundingBox()).width
  await page.setViewportSize({ width: 1920, height: 1080 })
  await expect.poll(async () => (await panel.boundingBox()).width).toBeGreaterThan(desktopWidth)
  await page.setViewportSize({ width: 1440, height: 900 })
  console.log('Passed: a page states its own term in its head, the rest nest under it, documentation follows each definition, and the panel grows on wider screens.')

  await filter.fill('Step')
  await expect(panel.locator('[data-term]').first()).toHaveAttribute('data-term', 'step')
  await filter.fill('')
  await expect(panel.locator('[data-term="product-model"]')).toBeVisible()
  await expect(panel.locator('[data-vocabulary-page="product"] [data-term="product-model"]'))
    .toHaveCount(1)
  await filter.fill('Arc')
  await panel.getByRole('button', { name: 'Clear the filter', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(filter).toBeFocused()
  console.log('Passed: general desktop lookups focus search and rank the exact term first.')

  // A moved term opens Product even when it was collapsed before the search.
  await productHead.click()
  await expect(productHead).toHaveAttribute('aria-expanded', 'false')
  await filter.fill('Resource type')
  await panel.locator('[data-term="resource-type"]').getByRole('button', { name: 'Go to Product Model', exact: true }).click()
  await expect(productHead).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-vocabulary-page="product"] [data-term="product-model"]')).toBeFocused()
  await panel.getByRole('button', { name: 'Back to Resource type', exact: true }).click()
  await expect(filter).toHaveValue('Resource type')
  await expect(panel.locator('[data-term="resource-type"]')).toBeFocused()
  await filter.fill('')
  await expect(productHead).toHaveAttribute('aria-expanded', 'false')
  console.log('Passed: moved terms open Product, and Back restores the previous search and collapsed state.')

  // Looking up the same destination twice must reveal it both times, even
  // when a new search has hidden it since the first lookup.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await filter.fill('Arc')
    await expect(step).toHaveCount(0)
    await panel.locator('[data-term="arc"]').getByRole('button', { name: 'Go to Step', exact: true }).click()
    await expect(filter).toHaveValue('')
    await expect(step).toHaveAttribute('data-marked', 'true')
    await expect(step).toBeInViewport()
    await panel.getByRole('button', { name: /^Capabilities \d+ more terms$/ }).click()
    await expect(step).toBeHidden()
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
  // The row's own way out sits on its name line, so it is the first stop after it.
  await page.keyboard.press('Tab')
  await expect(step.getByRole('link', { name: 'Read more in Capabilities, at Step', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(step.getByRole('button', { name: 'Go to Actor', exact: true })).toBeFocused()
  await expect(step).toBeInViewport()
  console.log('Passed: keyboard navigation continues at the destination.')

  // Two levels of history restore both a scrolled, marked term and a filtered
  // search. Focus resumes at the original row, even when the Back button leaves.
  const stepScroll = await list.evaluate(el => el.scrollTop)
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'false')
  await step.getByRole('button', { name: 'Go to Actor', exact: true }).click()
  await expect(panel.locator('[data-term="actor"]')).toBeFocused()
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'true')
  await panel.getByRole('button', { name: 'Back to Step', exact: true }).click()
  await expect(step).toBeFocused()
  await expect(step).toHaveAttribute('data-marked', 'true')
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeCloseTo(stepScroll, 0)
  await panel.getByRole('button', { name: 'Back to Arc', exact: true }).click()
  await expect(filter).toHaveValue('Arc')
  await expect(arc).toBeFocused()
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBe(0)
  await expect(panel.getByRole('button', { name: /^Back to / })).toHaveCount(0)
  console.log('Passed: Back restores search, expanded pages, scroll position, selection, and keyboard focus across multiple lookups.')

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
  await expect(actor.getByRole('link', { name: 'Read more in Entities, at Actor', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(actor.getByRole('button', { name: 'Go to Entity', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(collectionUrl)
  await expect(interfaces).toBeFocused()
  console.log('Passed: popover handoffs focus the requested term and return to the original report trigger on close.')

  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(panel.getByRole('button', { name: /^Interfaces \d+ more terms$/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-term="interface"]')).toBeInViewport()
  await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1)
  await filter.fill('Arc')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()

  // Navigate within the same report instance so the old search really exists
  // when the next page opens its vocabulary.
  await page.getByRole('button', { name: /^Entities \d+$/ }).click()
  await page.getByRole('button', { name: 'Open Entity Shopper', exact: true }).click()
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1)
  await expect(entityEntry).toBeInViewport()
  await filter.fill('Arc')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await page.getByRole('button', { name: 'Topology', exact: true }).click()
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(panel.locator('[data-vocabulary-page="product"] button[aria-expanded="true"]')).toHaveCount(1)
  await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1)
  await expect(panel.locator('[data-term="topology"]')).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  console.log('Passed: every header opening clears stale searches and opens only the current collection, resource, or Topology group.')

  // Alternate surface labels must remain available to heading navigation and
  // voice control, even when their definitions use a different canonical term.
  const orderUrl = new URL(url)
  orderUrl.searchParams.set('s', 'entity')
  orderUrl.searchParams.set('e', 'entity:order')
  await page.goto(orderUrl.href)
  for (const [label, term] of [
    ['Subject', 'Domain'],
    ['Relationships', 'Relation'],
    ['Kept', 'Information kept']
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
    const mention = page.getByRole('dialog', { name: 'Subject — what Domain means', exact: true })
      .getByRole('button', { name: / — show definition$/ }).first()
    await mention.focus()
    await expect(mention).toHaveCSS('outline-style', 'solid')
    await expect(mention).toHaveCSS('outline-width', '2px')
    await page.keyboard.press('Escape')
    await expect(subject).toBeFocused()
  }
  console.log('Passed: definition triggers show keyboard focus in light and dark themes.')

  // Help and navigation coexist on resource pages and both kinds of nested
  // Scenario. Middle widths must work too, before the mobile trail takes over.
  for (const width of [1440, 1280, 1024, 768, 640]) {
    await page.setViewportSize({ width, height: 900 })
    await checkBreadcrumbDefinitions(page)
  }
  console.log('Passed: breadcrumb definitions, keyboard dismissal, and parent navigation survive every nesting level on desktop and tablet.')

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
  await mobile.getByRole('button', { name: 'Vocabulary', exact: true }).click()
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
  await expect(mobilePanel.getByRole('button', { name: /^Interfaces \d+ more terms$/ }))
    .toHaveAttribute('aria-expanded', 'true')
  const mobileEntry = mobilePanel.locator('[data-term="interface-type"]')
  await expect(mobileEntry).toBeVisible()
  const mobileLink = mobileEntry.getByRole('link', { name: 'Read more in Interfaces, at Interface type', exact: true })
  const mobileLinkBounds = await mobileLink.boundingBox()
  expect(mobileLinkBounds.y).toBeLessThan((await mobileEntry.locator('p').boundingBox()).y)
  expect(mobileLinkBounds.width).toBeGreaterThanOrEqual(16)
  await mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' }).fill('Arc')
  await mobilePanel.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(mobilePanel).toBeHidden()
  await mobile.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' })).toHaveValue('')
  await expect(mobilePanel.getByRole('button', { name: /^Interfaces \d+ more terms$/ }))
    .toHaveAttribute('aria-expanded', 'true')
  await expect(mobilePanel.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await mobile.keyboard.press('Escape')
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 })
    await checkBreadcrumbDefinitions(mobile, true)
  }
  await mobile.close()
  console.log('Passed: mobile definitions and vocabulary fit narrow viewports without unwanted search autofocus.')
} finally {
  await browser.close()
}
