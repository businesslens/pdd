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
import { readFileSync } from 'node:fs'

/* The Model overview's terms sit under Product; count them from the generated registry. */
const registry = readFileSync(new URL('../layers/nuxt/report-viewer/app/utils/vocabulary.generated.ts', import.meta.url), 'utf8')
const overviewTerms = (registry.match(/page: "product-model"/g) ?? []).length
/* Definitions are authored in docs/ and change with them; read them from the registry. */
const definitionOf = slug => registry.match(new RegExp(`"${slug}": \\{[^}]*?definition: "([^"]+)"`))?.[1] ?? ''

const url = process.argv[2]
if (!url) {
  console.error('Usage: node scripts/check-vocabulary-navigation.mjs <viewer-url>')
  process.exit(1)
}

const browser = await chromium.launch()

/* A resource opens in a slideover whose title carries the definition of what
   it is; closing it returns to the collection, whose heading carries its own. */
async function checkBreadcrumbDefinitions(page, touch = false) {
  for (const route of [
    { section: 'entity', key: 'entity:order', help: 'Order — what Entity means', term: 'Entity', collection: 'Entities — what Entity means' },
    // A Scenario address opens its parent, titled by its Variation where it has one.
    { section: 'capability', key: 'capability-scenario:complete-checkout', help: 'Checkout — what Capability means', term: 'Capability', collection: 'Capabilities — what Capability means' },
    { section: 'journey', key: 'journey-scenario:browse-and-complete-checkout', help: 'Post-purchase — what Variation means', term: 'Variation', collection: 'Journeys — what Journey means' }
  ]) {
    const target = new URL(url)
    target.searchParams.set('s', route.section)
    target.searchParams.set('e', route.key)
    await page.goto(target.href)
    const header = page.locator('[data-resource-panel] header')
    const help = header.getByRole('button', { name: route.help, exact: true })
    await expect(help).toBeVisible()
    // Icons must be bundled in the static report, which has no icon API.
    await expect(help.locator('.blr-term-mark')).toHaveCSS('mask-image', /url\(/)
    // The slideover slides in; read the title once it has settled inside the viewport.
    const viewport = page.viewportSize()
    await expect.poll(async () => {
      const bounds = await help.boundingBox()
      return bounds.x >= 0 && bounds.x + bounds.width <= viewport.width
    }).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    const resourceUrl = page.url()
    await help.click()
    const definition = page.getByRole('dialog', { name: route.help, exact: true })
    await expect(definition.getByText(route.term, { exact: true })).toBeVisible()
    await expect(definition.getByRole('link', { name: 'Read more in docs', exact: true })).toBeVisible()
    await expect(page).toHaveURL(resourceUrl)
    await page.keyboard.press('Escape')
    await expect(help).toBeFocused()
    await page.keyboard.press('Space')
    await expect(definition).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(help).toBeFocused()

    await header.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('e')).toBeNull()
    // The collection's heading keeps its own definition.
    const collectionHelp = page.getByRole('heading', { level: 1 }).getByRole('button', { name: route.collection, exact: true })
    await expect(collectionHelp).toBeVisible()
    const collectionBounds = await collectionHelp.boundingBox()
    expect(collectionBounds.width).toBeGreaterThanOrEqual(touch ? 24 : 16)
    await collectionHelp.click()
    await expect(page.getByRole('dialog', { name: route.collection, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(collectionHelp).toBeFocused()
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
  await expect(entitiesBody).toContainText(definitionOf('entity'))
  await expect(entitiesBody.getByRole('heading', { name: 'Entity', exact: true })).toHaveCount(0)
  const entityEntry = panel.locator('[data-term="actor"]')
  await expect(entityEntry).toBeVisible()
  const definitionBounds = await entityEntry.locator('p').boundingBox()
  // The head says the page once. A row's way out keeps its own anchor as an icon
  // on the term's line, rather than repeating the page name under every meaning.
  await expect(entityEntry.getByRole('link', { name: 'Read more in docs', exact: true })).toHaveCount(0)
  const documentation = entityEntry.getByRole('link', { name: 'Read more in docs, at Actor', exact: true })
  const linkBounds = await documentation.boundingBox()
  expect(linkBounds.y).toBeLessThan(definitionBounds.y)
  expect(linkBounds.x).toBeGreaterThan((await entityEntry.getByRole('heading', { name: 'Actor' }).boundingBox()).x)
  await expect(documentation).toHaveAttribute('target', '_blank')
  await expect(entitiesBody.getByRole('link', { name: 'Read more in docs', exact: true })).toHaveCount(1)
  await entitiesGroup.click()
  await expect(entityEntry).toBeHidden()
  // Product leads the combined section, with every Model overview term beneath it.
  const productHead = panel.locator('[data-vocabulary-page="product"] [data-term="product"]')
  await expect(productHead).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-vocabulary-page]').first()).toHaveAttribute('data-vocabulary-page', 'product')
  await expect(panel.locator('[data-vocabulary-page="product-model"]')).toHaveCount(0)
  await expect(panel.locator('[data-vocabulary-page="product"] article[data-term]')).toHaveCount(overviewTerms)
  await expect(panel.locator('[data-vocabulary-page="product"]'))
    .toContainText(definitionOf('product'))
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
  await expect(step.getByRole('link', { name: 'Read more in docs, at Step', exact: true })).toBeFocused()
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
  await page.getByRole('navigation', { name: 'Report sections', exact: true }).getByRole('button', { name: 'Interfaces', exact: true }).click()
  const collectionUrl = page.url()
  const interfaces = page.getByRole('button', { name: 'Interfaces — what Interface means', exact: true })
  await interfaces.click()
  await page.getByRole('button', { name: 'Actors — show definition', exact: true }).click()
  const actor = panel.locator('[data-term="actor"]')
  await expect(actor).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(actor.getByRole('link', { name: 'Read more in docs, at Actor', exact: true })).toBeFocused()
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
  // when the next collection opens its vocabulary.
  const rail = page.getByRole('navigation', { name: 'Report sections', exact: true })
  await rail.getByRole('button', { name: 'Entities', exact: true }).click()
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(entitiesGroup).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1)
  await expect(entityEntry).toBeInViewport()
  await filter.fill('Arc')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await rail.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(filter).toHaveValue('')
  await expect(panel.locator('[data-vocabulary-page="product"] button[aria-expanded="true"]')).toHaveCount(1)
  await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1)
  await expect(panel.locator('[data-term="product"]')).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  console.log('Passed: every opening clears stale searches and opens only the current collection or the Product group.')

  // Resource labels remain available to heading navigation and voice control.
  const orderUrl = new URL(url)
  orderUrl.searchParams.set('s', 'entity')
  orderUrl.searchParams.set('e', 'entity:order')
  await page.goto(orderUrl.href)
  for (const [label, term] of [
    ['States', 'State'],
    ['Arcs', 'Arc'],
    ['Information kept', 'Information kept']
  ]) {
    const buttons = page.locator('[data-resource-panel] button.blr-term').filter({ hasText: new RegExp(`^${label}$`) })
    await expect(buttons.first()).toBeVisible()
    for (const button of await buttons.all()) await expect(button).toHaveAccessibleName(`${label} — what ${term} means`)
  }
  await expect(page.locator('[data-resource-panel] header').getByRole('link', { name: 'Domain: Ordering', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Information kept — what Information kept means \d+$/ })).toBeVisible()
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
    await expect(kindDefinition).toContainText(definitionOf('entity-kind'))
    await expect(kindDefinition.getByRole('link', { name: 'Read more in docs', exact: true }))
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
    const definitionName = 'Information kept — what Information kept means'
    const termHelp = page.getByRole('button', { name: definitionName, exact: true }).first()
    await expect(termHelp).toBeVisible()
    const html = page.locator('html')
    if (!(await html.getAttribute('class') ?? '').split(/\s+/).includes(colorScheme)) {
      await page.locator('[data-resource-panel]').getByRole('button', { name: 'Close resource', exact: true }).click()
      await page.getByRole('button', { name: 'Toggle color mode', exact: true }).click()
      await page.goto(orderUrl.href)
    }
    await expect(html).toHaveClass(new RegExp(`(?:^|\\s)${colorScheme}(?:\\s|$)`))
    await page.keyboard.press('Tab')
    await termHelp.focus()
    await expect(termHelp).toHaveCSS('outline-style', 'solid')
    await expect(termHelp).toHaveCSS('outline-width', '2px')
    await page.keyboard.press('Enter')
    const mention = page.getByRole('dialog', { name: definitionName, exact: true })
      .getByRole('button', { name: / — show definition$/ }).first()
    await mention.focus()
    await expect(mention).toHaveCSS('outline-style', 'solid')
    await expect(mention).toHaveCSS('outline-width', '2px')
    await page.keyboard.press('Escape')
    await expect(termHelp).toBeFocused()
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
  // On phones the Vocabulary sits in the report navigation sheet.
  await mobile.getByRole('button', { name: 'Open report navigation', exact: true }).click()
  await mobile.getByRole('dialog', { name: 'Report navigation', exact: true }).getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const mobilePanel = mobile.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(mobilePanel).toBeVisible()
  // Phones keep focus in the panel without raising the keyboard for search.
  await expect.poll(() => mobilePanel.evaluate(element => element.contains(document.activeElement))).toBe(true)
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
  const mobileLink = mobileEntry.getByRole('link', { name: 'Read more in docs, at Interface type', exact: true })
  const mobileLinkBounds = await mobileLink.boundingBox()
  expect(mobileLinkBounds.y).toBeLessThan((await mobileEntry.locator('p').boundingBox()).y)
  expect(mobileLinkBounds.width).toBeGreaterThanOrEqual(16)
  await mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' }).fill('Arc')
  await mobilePanel.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(mobilePanel).toBeHidden()
  await mobile.getByRole('button', { name: 'Open report navigation', exact: true }).click()
  await mobile.getByRole('dialog', { name: 'Report navigation', exact: true }).getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' })).toHaveValue('')
  await expect(mobilePanel.getByRole('button', { name: /^Interfaces \d+ more terms$/ }))
    .toHaveAttribute('aria-expanded', 'true')
  await expect(mobilePanel.getByRole('textbox', { name: 'Filter the vocabulary' })).not.toBeFocused()
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
