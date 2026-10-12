import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { catalogOf, openCatalogWith } from '../support/catalog'
import { waitForHydration } from '../support/hydration'

/**
 * The catalog index: one layout at every size — see ADR-0019. The listing is
 * generated with the site from the repository's fifteen Blueprints, so search,
 * category and URL filters run against that real catalog. The states it can
 * never be in on its own — one Blueprint, none, or a listing that failed to
 * load — are answered to the browser through `openCatalogWith`.
 * `blueprints.spec.ts` covers the cards' artwork and the record pages.
 */

test.beforeEach(async ({ page }) => {
  await page.route('https://github.com/**', route => route.abort())
  // Cards rise into place on enter; geometry is measured where they rest.
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  // A count that wraps inside itself, or is cut off, is a statistic the reader
  // cannot read.
  const clipped = await page.locator('[data-blueprint-stats]').evaluateAll(lists => lists
    .filter(list => list.scrollWidth > list.clientWidth || list.scrollHeight > list.clientHeight).length)
  expect(clipped).toBe(0)
}

/** The generated catalog, hydrated, so typing reaches the filters. */
async function openCatalog(page: Page, path = '/blueprints') {
  await page.goto(path)
  await waitForHydration(page)
}

const search = (page: Page) => page.getByRole('textbox', { name: 'Search Blueprints' })
const summary = (page: Page) => page.locator('[data-catalog-summary]')
const cardLinks = (page: Page) => page.locator('[data-card-link]')

/** The sidebar from `lg`, the select below it — whichever this width shows. */
async function chooseCategory(page: Page, label: string) {
  const sidebar = page.getByRole('navigation', { name: 'Blueprint categories' })
  if (await sidebar.isVisible()) {
    await sidebar.getByRole('button', { name: new RegExp(label) }).click()
  } else {
    await page.getByRole('button', { name: 'Filter by category' }).click()
    await page.getByRole('option', { name: label }).click()
  }
}

test('the generated catalog searches, filters by category, and clears', async ({ page }) => {
  await openCatalog(page)

  await expect(page.locator('[data-catalog-state="listing"]')).toBeVisible()
  await expect(summary(page)).toHaveText('15 Blueprints')
  await expect(cardLinks(page)).toHaveCount(15)
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
  await expectAccessible(page)

  // Case-insensitive, and written to the URL.
  await search(page).fill('KANBAN')
  await expect(summary(page)).toHaveText('1 result')
  await expect(cardLinks(page)).toHaveText(['Kanban Board'])
  await expect(page).toHaveURL(/[?&]q=KANBAN/)

  // A tag counts as much as a title, and so does a category's shelf label.
  await search(page).fill('agentic')
  await expect(cardLinks(page)).toHaveText(['Bookmark Manager', 'Kanban Board', 'Notes App', 'Study Planner', 'Team Wiki'])
  await search(page).fill('dev tools')
  await expect(cardLinks(page)).toHaveText(['Code Snippet Sharing', 'Public Status Page', 'URL Shortener'])

  await search(page).fill('')
  await expect(summary(page)).toHaveText('15 Blueprints')
  await expect(page).toHaveURL(/\/blueprints$/)

  await chooseCategory(page, 'Collaboration')
  await expect(summary(page)).toHaveText('3 results')
  await expect(cardLinks(page)).toHaveText(['Kanban Board', 'Polls & Decisions', 'Team Wiki'])
  await expect(page).toHaveURL(/[?&]category=collaboration/)

  // Search narrows within the category.
  await search(page).fill('wiki')
  await expect(summary(page)).toHaveText('1 result')
  await expect(page).toHaveURL(/[?&]q=wiki/)
  await expect(page).toHaveURL(/[?&]category=collaboration/)

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(summary(page)).toHaveText('15 Blueprints')
  await expect(search(page)).toHaveValue('')
  await expect(page).toHaveURL(/\/blueprints$/)
})

test('a filtered URL opens filtered, and an unknown category filters nothing', async ({ page }) => {
  await openCatalog(page, '/blueprints?category=education&q=quiz')
  await expect(summary(page)).toHaveText('1 result')
  await expect(cardLinks(page)).toHaveText(['Quiz Builder'])
  await expect(search(page)).toHaveValue('quiz')

  await openCatalog(page, '/blueprints?category=education')
  await expect(summary(page)).toHaveText('3 results')
  await expect(cardLinks(page)).toHaveText(['Flashcard App', 'Quiz Builder', 'Study Planner'])

  // A shelf the catalog does not have is no filter, not an empty result.
  await openCatalog(page, '/blueprints?category=no-such-shelf')
  await expect(summary(page)).toHaveText('15 Blueprints')
  await expect(cardLinks(page)).toHaveCount(15)
})

test('a search with no matches clears in place', async ({ page }) => {
  await openCatalog(page)
  await expect(summary(page)).toHaveText('15 Blueprints')
  let documentLoads = 0
  page.on('load', () => documentLoads++)

  await search(page).fill('no such product')
  await expect(summary(page)).toHaveText('No results')
  const empty = page.locator('[data-catalog-empty]')
  await expect(empty).toContainText('Nothing matches that.')
  await expect(cardLinks(page)).toHaveCount(0)
  await expectAccessible(page)

  await empty.getByRole('button', { name: 'Clear filters' }).click()
  await expect(summary(page)).toHaveText('15 Blueprints')
  await expect(search(page)).toHaveValue('')
  await expect(cardLinks(page)).toHaveCount(15)
  await expect(page).toHaveURL(/\/blueprints$/)
  expect(documentLoads).toBe(0)
})

test('the filtered listing survives leaving and coming back', async ({ page }) => {
  await openCatalog(page)
  await search(page).fill('wiki')
  await expect(page).toHaveURL(/[?&]q=wiki/)

  await page.getByRole('contentinfo').getByRole('link', { name: 'FAQ' }).click()
  await expect(page).toHaveURL(/\/faq$/)
  await page.goBack()

  await expect(page).toHaveURL(/[?&]q=wiki/)
  await expect(search(page)).toHaveValue('wiki')
  await expect(cardLinks(page)).toHaveText(['Team Wiki'])

  // A full reload of the shared URL lands on the same listing.
  await page.reload()
  await waitForHydration(page)
  await expect(search(page)).toHaveValue('wiki')
  await expect(cardLinks(page)).toHaveText(['Team Wiki'])
})

test('one Blueprint gets the same layout as a full catalog', async ({ page }) => {
  const [only] = catalogOf(1)
  await openCatalogWith(page, { blueprints: [only!] })

  await expect(page.locator('[data-catalog-state="listing"]')).toBeVisible()
  await expect(search(page)).toBeVisible()
  await expect(summary(page)).toHaveText('1 Blueprint')
  // One category is nothing to choose between.
  await expect(page.getByRole('navigation', { name: 'Blueprint categories' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Filter by category' })).toHaveCount(0)

  // The card's visible promise and its accessible link agree on where it goes.
  await expect(page.locator('[data-blueprint-card-cta]')).toContainText('View Blueprint')
  await expect(cardLinks(page)).toHaveAttribute('href', `/blueprints/${only!.slug}`)
  await expect(page.getByRole('link', { name: 'Request a Blueprint' })).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectAccessible(page)
})

test('an empty catalog says so and offers the two ways to fill it', async ({ page }) => {
  await openCatalogWith(page, { blueprints: [] })

  await expect(page.locator('[data-catalog-state="empty"]')).toBeVisible()
  const empty = page.locator('[data-catalog-empty]')
  await expect(empty).toContainText('No Blueprints yet.')
  await expect(empty.getByRole('link', { name: 'Request a Blueprint' })).toHaveAttribute('href', '/contact')
  await expect(empty.getByRole('link', { name: 'Submit a Blueprint' })).toHaveAttribute('href', '/docs/cli-contribute')
  await expect(search(page)).toHaveCount(0)
  await expect(cardLinks(page)).toHaveCount(0)
  await expectAccessible(page)
})

test('a listing that cannot load shows the outage notice, not an empty shelf', async ({ page }) => {
  await openCatalogWith(page, { status: 404 })

  await expect(page.locator('[data-catalog-unavailable]')).toContainText('The Blueprints could not be loaded.')
  await expect(page.locator('[data-catalog-empty]')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Start from a Product Model')
})
