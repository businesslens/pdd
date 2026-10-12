import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { expectHeaderFits } from '../support/header'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

test('the header and mobile menu fit phone widths', async ({ page }) => {
  await expectHeaderFits(page)
})

test('search and Vocabulary are available across the site and ignore retired header choices', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'bl-header', value: 'toolbar', url: baseURL! }])
  for (const path of ['/', '/blog', '/faq', '/docs/entities']) {
    await page.goto(path)
    const header = page.locator('[data-site-header]')
    await expect(header.getByRole('button', { name: 'Search documentation' })).toBeVisible()
    const trigger = header.getByRole('button', { name: 'Vocabulary', exact: true })
    await trigger.click()
    const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
    const lead = path.startsWith('/docs') ? 'entity' : 'product'
    await expect(panel.locator(`[data-term="${lead}"]`)).toHaveAttribute('aria-expanded', 'true')
    await panel.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(trigger).toBeFocused()
  }
  // The generated site has no customization toolbars to show.
  await expect(page.locator('[data-site-header]').getByRole('button', { name: /customization toolbars/i })).toHaveCount(0)
  await expect(page.locator('[data-preview-bar]')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Header variants' })).toHaveCount(0)
})

test('desktop navigation stays centered when entering docs without overlapping the tools', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mobile uses the navigation menu.')
  await page.goto('/')
  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.locator('[data-site-header]').getByRole('link', { name: 'pdd-kit home', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.waitForLoadState('networkidle')
    const nav = page.locator('[data-site-header] [data-primary-navigation]')
    const firstLink = nav.getByRole('link').first()
    await expect(firstLink).toBeInViewport()
    await expect.poll(async () => (await firstLink.boundingBox())?.x ?? 0).toBeGreaterThan(0)
    const homeX = (await firstLink.boundingBox())!.x
    await nav.getByRole('link', { name: 'Docs', exact: true }).click()
    await expect(page).toHaveURL(/\/docs$/)
    await expect.poll(async () => (await firstLink.boundingBox())?.x ?? -1).toBeCloseTo(homeX, 0)

    const boxes = await page.locator('[data-site-header]').evaluate((el) => {
      const nav = el.querySelector('[data-primary-navigation]')!.getBoundingClientRect()
      const left = el.querySelector('[data-slot="left"]')!.getBoundingClientRect()
      const right = el.querySelector('[data-slot="right"]')!
      const tools = [...right.children].map(child => child.getBoundingClientRect()).filter(box => box.width > 0)
      return {
        navLeft: nav.left,
        navRight: nav.right,
        brandRight: left.right,
        toolsLeft: Math.min(...tools.map(box => box.left)),
        toolsRight: Math.max(...tools.map(box => box.right)),
        viewport: innerWidth
      }
    })
    expect((boxes.navLeft + boxes.navRight) / 2).toBeCloseTo(boxes.viewport / 2, 0)
    expect(boxes.brandRight).toBeLessThanOrEqual(boxes.navLeft)
    expect(boxes.navRight).toBeLessThanOrEqual(boxes.toolsLeft)
    expect(boxes.toolsRight).toBeLessThanOrEqual(boxes.viewport)
  }
})

test('header and Vocabulary fit narrow screens and pass WCAG A/AA checks', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  const header = page.locator('[data-site-header]')
  expect(await header.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  const headerAudit = await new AxeBuilder({ page }).include('[data-site-header]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(headerAudit.violations).toEqual([])
  await header.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(panel).toBeVisible()
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  const panelAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(panelAudit.violations).toEqual([])
})

test('site tools work alongside report search and Vocabulary', async ({ page, isMobile }) => {
  await page.goto('/')
  const header = page.locator('[data-site-header]')
  const search = page.getByRole('dialog')
  await header.getByRole('button', { name: 'Search documentation' }).click()
  await expect(search).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(search).not.toBeVisible()
  const modifier = await page.evaluate(() => /Macintosh;/.test(navigator.userAgent) ? 'Meta' : 'Control')
  await page.keyboard.press(`${modifier}+k`)
  await search.getByRole('textbox').fill('pdd-verify')
  await search.locator('a[href="/docs/skill-pdd-verify"]').first().click()
  await expect(page).toHaveURL(/\/docs\/skill-pdd-verify$/)
  await expect(search).not.toBeVisible()

  await page.goto('/blueprints/kanban-board')
  // A Blueprint page hydrates a whole report, so the client-only tool dialogs
  // arrive after the header that opens them. Wait for them rather than racing.
  await page.locator('[data-docs-tools-ready]').waitFor({ state: 'attached' })
  await header.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(panel).toHaveCount(1)
  await panel.getByRole('button', { name: 'Hide tooltips', exact: true }).click()
  await panel.getByRole('button', { name: 'Close', exact: true }).click()
  const productHelp = page.getByRole('button', { name: 'Product — what Product means', exact: true })
  await expect(productHelp).toHaveCount(0)
  if (isMobile) await page.getByRole('button', { name: 'Open report navigation' }).click()
  await expect(page.locator('[data-report-sidebar]:visible').getByRole('button', { name: 'Vocabulary', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-report-sidebar-footer]')).toHaveCount(0)
  if (isMobile) await page.getByRole('button', { name: 'Close report navigation' }).click()
  await header.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(panel).toHaveCount(1)
  await panel.getByRole('button', { name: 'Show tooltips', exact: true }).click()
  await panel.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(productHelp).toBeVisible()

  await header.getByRole('button', { name: 'Search documentation' }).click()
  await expect(search).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(search).not.toBeVisible()
  await page.keyboard.press(`${modifier}+k`)
  await expect(search).toHaveCount(1)
  await expect(search.getByPlaceholder('Search pages and resources…')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(search).not.toBeVisible()
  await page.keyboard.press(`${modifier}+Shift+k`)
  await expect(search).toHaveCount(1)
  await search.getByRole('textbox').fill('pdd-verify')
  await search.locator('a[href="/docs/skill-pdd-verify"]').first().click()
  await expect(page).toHaveURL(/\/docs\/skill-pdd-verify$/)
  await expect(search).not.toBeVisible()
  await header.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(panel).toHaveCount(1)
  await panel.getByRole('link', { name: 'Read more in docs', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/product(?:#.*)?$/)
  await expect(panel).not.toBeVisible()
})
