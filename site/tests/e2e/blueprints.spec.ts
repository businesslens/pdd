import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { catalogOf, openCatalogWith } from '../support/catalog'
import { waitForHydration } from '../support/hydration'
import { expectReportHydrated } from '../support/report'

/**
 * The Blueprints are generated with the site from the repository's
 * `blueprints/`: the index lists all fifteen, and each has a prerendered record
 * page carrying its whole report. `catalog-index.spec.ts` covers search and the
 * category filters; this covers the cards' artwork and the record pages.
 */

interface BlueprintIndex {
  commit: string
  blueprints: Array<{ slug: string, title: string, digest: string, logo: string, cover: string | null }>
}

const slug = 'kanban-board'
const title = 'Kanban Board'
const pull = (target: string) => `npx pdd-toolkit@latest blueprint pull ${target}`

const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024

test.beforeEach(async ({ page }) => {
  await page.route('https://github.com/**', route => route.abort())
  // Cards rise and fade into place on enter; scan and measure them at rest,
  // not mid-flight, when a half-faded title reads as a contrast failure.
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('the catalog page renders and advertises its RSS feed', async ({ page }) => {
  await page.goto('/blueprints')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Start from a Product Model')
  await expect(page.getByRole('link', { name: 'Follow via RSS' })).toHaveAttribute(
    'href', '/blueprints/rss.xml'
  )
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href', 'https://pdd-kit.dev/blueprints/rss.xml'
  )
})

test('the catalog lists every generated Blueprint, each with its cover', async ({ page, request }) => {
  const { blueprints } = await (await request.get('/_blueprints/index.json')).json() as BlueprintIndex
  expect(blueprints).toHaveLength(15)

  await page.goto('/blueprints')
  await expect(page.locator('[data-blueprint-card]')).toHaveCount(blueprints.length)
  for (const blueprint of blueprints) {
    const card = page.locator('[data-blueprint-card]').filter({
      has: page.locator(`a[href="/blueprints/${blueprint.slug}"]`)
    })
    await expect(card.locator('[data-card-link]')).toHaveText(blueprint.title)
    await expect(card.locator('img[data-blueprint-card-cover]')).toHaveAttribute('src', `/_blueprints/${blueprint.cover}`)
    await expect(card.locator('[data-blueprint-card-icon]')).toHaveCount(1)
  }

  // The cover the card names is a real image.
  const image = page.locator(`a[href="/blueprints/${slug}"]`).locator('xpath=ancestor::article').locator('img[data-blueprint-card-cover]')
  await image.scrollIntoViewIfNeeded()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
})

test('the catalog listing has no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/blueprints')
  await waitForHydration(page)
  await expect(page.locator('[data-blueprint-card]')).toHaveCount(15)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('the catalog hydrates cleanly after a hard reload', async ({ page }) => {
  const hydrationMessages: string[] = []
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) hydrationMessages.push(message.text())
  })

  await page.goto('/blueprints')
  await waitForHydration(page)
  await page.reload()
  await waitForHydration(page)

  expect(hydrationMessages).toEqual([])
  await expect(page.locator('[data-catalog-state="listing"]')).toBeVisible()
})

/**
 * The artwork is the largest thing on a card and reads as the way in, so the
 * record link has to cover it and not stop at the body. Clicked at real
 * coordinates rather than through the locator, because the point is precisely
 * that the artwork is not the click target — the link over it is.
 */
test('clicking the card artwork opens the record', async ({ page }) => {
  await page.goto('/blueprints')
  await waitForHydration(page)

  const area = page.locator(`a[href="/blueprints/${slug}"]`).first()
    .locator('xpath=ancestor::article')
    .locator('[data-blueprint-card-cover], [data-blueprint-card-artwork]').first()
  await area.scrollIntoViewIfNeeded()
  const box = await area.boundingBox()
  if (!box) throw new Error('The card artwork has no box to click.')

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page).toHaveURL(new RegExp(`/blueprints/${slug}$`))
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(title)
})

test('a card whose images fail falls back from cover to logo to category icon', async ({ page }) => {
  await page.route(`**/_blueprints/${slug}.cover.webp`, route => route.fulfill({ status: 404 }))
  await page.route(`**/_blueprints/${slug}.logo.svg`, route => route.fulfill({ status: 404 }))
  await page.goto('/blueprints')
  const card = page.locator(`a[href="/blueprints/${slug}"]`).first().locator('xpath=ancestor::article')
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('img[data-blueprint-card-cover]')).toHaveCount(0)
  await expect(card.locator('[data-blueprint-card-artwork]')).toBeVisible()
  await expect(card.locator('img[data-blueprint-card-logo]')).toHaveCount(0)
  await expect(card.locator('[data-blueprint-card-artwork] [data-blueprint-card-logo]')).toBeVisible()
})

// Every generated Blueprint has a cover, so a coverless card is answered here.
test('a card without a cover wears its Product logo, with its category on the badge', async ({ page }) => {
  const [bare, ...rest] = catalogOf(3)
  await openCatalogWith(page, { blueprints: [{ ...bare!, cover: null }, ...rest] })
  const card = page.locator(`a[href="/blueprints/${bare!.slug}"]`).first().locator('xpath=ancestor::article')
  await card.scrollIntoViewIfNeeded()
  const logo = card.locator('[data-blueprint-card-artwork] img[data-blueprint-card-logo]')
  await expect(logo).toBeVisible()
  await expect(logo).toHaveAttribute('src', bare!.logo)
  await expect(card.locator('[data-blueprint-card-icon]')).toBeVisible()
  await expect(card.locator('[data-blueprint-card-cover]')).toHaveCount(0)
})

test('a record page renders the report, its pull command, its logo and its source', async ({ page, request }) => {
  const index = await (await request.get('/_blueprints/index.json')).json() as BlueprintIndex
  const entry = index.blueprints.find(blueprint => blueprint.slug === slug)!

  const response = await page.goto(`/blueprints/${slug}`)
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(`${title} · Blueprints · pdd-kit`)
  // The report's heading names the surface the reader chose — `Overview`,
  // qualified by the resource type it presents. The Blueprint's own name is
  // the Product's, and the Product's page carries it in About.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(title)
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href', 'https://pdd-kit.dev/blueprints/rss.xml'
  )

  const logoUrl = `/_blueprints/${entry.logo}`
  await expect(page.locator(`img[src="${logoUrl}"]:visible`).first()).toBeVisible()
  const logo = await request.get(logoUrl)
  expect(logo.status()).toBe(200)
  expect(logo.headers()['content-type']).toContain('image/svg+xml')
  expect(await logo.text()).toContain('<svg')

  // The pull command is the point of the page.
  await expect(page.getByRole('heading', { level: 2, name: 'Pull this Blueprint' })).toBeVisible()
  await expect(page.getByText(pull(slug), { exact: true })).toBeVisible()

  // Provenance: the repository path the report was built from, at the commit
  // the site was generated from, and the digest of the published report.
  const source = page.locator('dl').filter({ hasText: 'Report digest' })
  await expect(source.getByRole('link', { name: `blueprints/${slug}` })).toHaveAttribute(
    'href', `https://github.com/itai-gendler/pdd-kit/tree/main/blueprints/${slug}`
  )
  expect(index.commit).toMatch(/^[0-9a-f]{12,}$/)
  await expect(source).toContainText(index.commit.slice(0, 12))
  await expect(source).toContainText(`${entry.digest.slice(0, 16)}…`)
  await expect(page.getByRole('link', { name: 'itai-gendler/pdd-kit' })).toHaveAttribute(
    'href', 'https://github.com/itai-gendler/pdd-kit/tree/main/blueprints'
  )
})

test('the pull command copies exactly what it shows', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`/blueprints/${slug}`)
  await expectReportHydrated(page)
  await page.getByRole('button', { name: 'Copy the pull command' }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(pull(slug))
})

test('the product picker keeps identity visible and switches Blueprints', async ({ page }) => {
  await page.goto(`/blueprints/${slug}`)
  await expectReportHydrated(page)
  const mobile = isNarrow(page)
  if (mobile) await page.getByRole('button', { name: 'Open report navigation' }).click()
  const picker = page.locator('[data-report-product-picker]:visible')
  await expect(picker).toContainText(title)
  await expect(picker.locator('img')).toHaveAttribute('src', `/_blueprints/${slug}.logo.svg`)
  await expect(page.locator('[data-report-sidebar]:visible').getByRole('link', { name: 'All Blueprints' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Entities', exact: true }).click()
  await expect(page).toHaveURL(url => url.searchParams.get('tab') === 'entity')
  const previous = page.url()

  if (mobile) await page.getByRole('button', { name: 'Open report navigation' }).click()
  else await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await picker.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu')
  // The current Blueprint, every other one, and the way back to the catalog.
  await expect(menu.getByRole('menuitem')).toHaveCount(16)
  await expect(menu.getByRole('menuitem', { name: new RegExp(title) })).toHaveAttribute('aria-current', 'true')
  await expect(menu.getByRole('menuitem', { name: 'All Blueprints', exact: true })).toHaveAttribute('href', '/blueprints')
  await expect(menu.getByRole('menuitem', { name: 'URL Shortener' }).locator('img'))
    .toHaveAttribute('src', '/_blueprints/url-shortener.logo.svg')
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(audit.violations).toEqual([])

  // Type-ahead reaches another Blueprint, and choosing it opens its record.
  await menu.getByRole('menuitem', { name: new RegExp(title) }).focus()
  await page.keyboard.press('u')
  await expect(menu.getByRole('menuitem', { name: 'URL Shortener' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/blueprints\/url-shortener$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('URL Shortener')
  await expect(page.getByText(pull('url-shortener'), { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Report navigation', exact: true })).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL(previous)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Entities')
  if (mobile) await page.getByRole('button', { name: 'Open report navigation' }).click()
  await picker.click()
  await page.getByRole('menuitem', { name: 'All Blueprints', exact: true }).click()
  await expect(page).toHaveURL(/\/blueprints$/)
  await expect(page.getByRole('dialog', { name: 'Report navigation', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-blueprint-card]')).toHaveCount(15)
})

test('a record view is a shareable URL', async ({ page }) => {
  const response = await page.goto(`/blueprints/${slug}`)
  expect(response?.status()).toBe(200)
  await expectReportHydrated(page)

  if (isNarrow(page)) await page.getByRole('button', { name: 'Open report navigation' }).click()
  await page.getByRole('button', { name: 'Business Rules', exact: true }).click()
  await expect(page).toHaveURL(url => url.searchParams.get('tab') === 'rule')

  // A collection row opens the resource in a slideover over the collection
  // and earns one history entry with the stable resource key in the URL.
  const collectionUrl = page.url()
  await page.getByRole('link', { name: /^Open Business Rule / }).first().click()
  await expect(page).toHaveURL(url => url.searchParams.get('e')?.startsWith('rule:') === true)
  const resourceKey = new URL(page.url()).searchParams.get('e')
  if (!resourceKey) throw new Error('The Business Rule page has no resource key.')

  // Back returns to the collection, forward restores the resource, and a reload
  // of the shared URL lands on the same resource reading.
  await page.goBack()
  await expect(page).toHaveURL(collectionUrl)
  await page.goForward()
  await expect(page).toHaveURL(url => url.searchParams.get('e') === resourceKey)
  await page.reload()
  await expect(page).toHaveURL(url => url.searchParams.get('e') === resourceKey)
  // A Rule is titled by its statement, and what it governs is a tab of its own.
  const panel = page.locator('[data-resource-panel]')
  await expect(panel.locator('[data-resource-heading]')).toBeVisible()
  await expect(panel.getByRole('tab', { name: /^Applies to/ })).toBeVisible()
})

/*
  A Blueprint page is a page of this site, so it ends the way every other one
  does. The report brings no chrome of its own; it fills the viewport under
  the header and the site footer waits below it.
*/
test('a record view keeps the site footer below the report', async ({ page }) => {
  const response = await page.goto(`/blueprints/${slug}`)
  expect(response?.status()).toBe(200)
  await expectReportHydrated(page)

  const footer = page.locator('[data-landing-footer]')
  await expect(footer).toHaveCount(1)
  await expect(page.locator('[data-pdd-kit-report-footer]')).toHaveCount(0)

  const initial = await page.evaluate(() => {
    const scroller = document.scrollingElement!
    const panes = [...document.querySelectorAll<HTMLElement>('.report-pane')]
    return {
      clientHeight: scroller.clientHeight,
      scrollHeight: scroller.scrollHeight,
      scrollingPanes: panes.filter(pane => pane.scrollHeight > pane.clientHeight).length
    }
  })

  // The report still owns its own panes; the page scrolls only past it.
  expect(initial.scrollingPanes).toBeGreaterThan(0)
  expect(initial.scrollHeight).toBeGreaterThan(initial.clientHeight)
  await expect(footer).not.toBeInViewport()

  await page.evaluate(() => document.scrollingElement!.scrollTo({ top: 99999 }))
  await expect(footer).toBeInViewport()
})

// Dark mode is off; restore its pass when it returns.
for (const colorMode of ['light'] as const) {
  test(`the record page has no automatically detectable WCAG A/AA violations in ${colorMode} mode`, async ({ page }) => {
    await page.addInitScript((mode) => {
      window.localStorage.setItem('nuxt-color-mode', mode)
    }, colorMode)

    // Asserted before scanning: an error page is trivially accessible, so
    // scanning one is how this suite would report a violation-free record page
    // it never actually rendered.
    const response = await page.goto(`/blueprints/${slug}`)
    expect(response?.status()).toBe(200)
    await expect(page.locator('html')).toHaveClass(new RegExp(`(^|\\s)${colorMode}(\\s|$)`))
    await expect(page.getByText(pull(slug), { exact: true })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}

test('an unknown Blueprint is not found', async ({ page }) => {
  const response = await page.goto('/blueprints/no-such-blueprint')
  // The static host answers with the generated 404 page; it must never be a
  // 200 carrying an error message.
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page.locator('[data-pdd-kit-report-viewer]')).toHaveCount(0)
})

// Every Blueprint in the generated index has its own prerendered record page.
test('every generated Blueprint has a prerendered record page', async ({ request }) => {
  const index = await (await request.get('/_blueprints/index.json')).json() as BlueprintIndex
  for (const blueprint of index.blueprints) {
    const page = await request.get(`/blueprints/${blueprint.slug}`)
    expect(page.status(), blueprint.slug).toBe(200)
    const html = await page.text()
    expect(html, blueprint.slug).toContain('data-pdd-kit-report-viewer')
    expect(html, blueprint.slug).toContain(`<title>${blueprint.title.replaceAll('&', '&amp;')} · Blueprints · pdd-kit</title>`)
  }
})
