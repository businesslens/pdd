#!/usr/bin/env node
/** Exercise the desktop rail and its independent mobile drawer on a built report. */
import { chromium, expect } from '@playwright/test'
import { selectCollectionDrawing, expectCollectionDrawing } from './report-view-controls.mjs'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL.')
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const browser = await chromium.launch()
const errors = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin)
  const desktop = page.locator('[aria-label="Report navigation"][data-collapsed]')
  const rail = page.locator('[data-report-sidebar]:visible')
  const capture = async name => { if (screenshots) await page.screenshot({ path: join(screenshots, `${name}.png`) }) }
  const expectProductRowCentered = async () => {
    const row = page.getByRole('menuitem', { name: /Fixture Shop/ })
    const centers = await row.evaluate(element => [
      element,
      element.querySelector('[data-businesslens-logo]'),
      element.querySelector('[data-slot="itemLabel"]'),
      element.querySelector('[data-slot="itemTrailing"] .iconify')
    ].map(node => {
      const rect = node.getBoundingClientRect()
      return rect.y + rect.height / 2
    }))
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1)
  }
  await expect(desktop).toHaveAttribute('data-collapsed', 'false')
  await expect(desktop).toHaveCSS('width', '288px')
  const product = rail.getByRole('button', { name: 'Choose product: Fixture Shop', exact: true })
  await expect(product).toContainText('Fixture Shop')
  await expect(product.locator('[data-businesslens-logo]')).toBeVisible()
  await product.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem')).toHaveCount(1)
  await expect(page.getByRole('menuitem')).toHaveAttribute('aria-current', 'true')
  await expect(page.getByRole('menuitem')).toContainText('Fixture Shop')
  await expectProductRowCentered()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(product).toBeFocused()
  await rail.getByRole('button', { name: 'Entities', exact: true }).click()
  await selectCollectionDrawing(page, 'graph')
  await expect(page.locator('[data-flow-ready=true]')).toBeVisible()
  const graphUrl = page.url()
  const heading = await page.getByRole('heading', { level: 1 }).textContent()
  await capture('sidebar-expanded')

  const collapse = page.getByRole('button', { name: 'Collapse sidebar', exact: true })
  await expect(collapse.locator('.iconify')).toHaveCSS('mask-image', /url\(/)
  await collapse.focus()
  await page.keyboard.press('Enter')
  await expect(desktop).toHaveCSS('width', '64px')
  await expect(desktop).toHaveAttribute('data-collapsed', 'true')
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeFocused()
  await expect(page).toHaveURL(graphUrl)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  await expectCollectionDrawing(page, 'graph')
  await expect(rail.locator('[data-logo-wordmark], [data-pdd-version]')).toHaveCount(0)
  await expect(product.locator('[data-businesslens-logo]')).toHaveCSS('width', '17px')

  const entities = rail.getByRole('button', { name: 'Entities', exact: true })
  await expect(entities).toHaveAttribute('aria-current', 'page')
  const railBounds = await rail.boundingBox()
  const iconBounds = await entities.locator('.iconify').boundingBox()
  expect(Math.abs(iconBounds.x + iconBounds.width / 2 - railBounds.x - railBounds.width / 2)).toBeLessThan(1)
  await entities.hover()
  await expect(page.locator('[data-slot="content"] [data-slot="text"]').filter({ hasText: /^Entities$/ })).toBeVisible()
  await page.mouse.move(500, 10)
  await capture('sidebar-collapsed')
  await product.hover()
  await expect(page.locator('[data-slot="content"] [data-slot="text"]').filter({ hasText: /^Fixture Shop$/ })).toBeVisible()
  await product.click()
  await expect(page.getByRole('menuitem')).toContainText('Fixture Shop')
  await expectProductRowCentered()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await page.reload()
  await expect(desktop).toHaveCSS('width', '64px')
  await expectCollectionDrawing(page, 'graph')

  await rail.getByRole('button', { name: 'Search Product Model', exact: true }).click()
  const search = page.getByPlaceholder('Search every resource in this model…')
  await expect(search).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(search).toHaveCount(0)
  await rail.getByRole('button', { name: 'Vocabulary', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Vocabulary', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Vocabulary', exact: true })).toHaveCount(0)
  await expect(rail.getByRole('link', { name: 'Documentation', exact: true })).toHaveAttribute('href', 'https://businesslens.io/docs')
  await expect(rail.getByRole('link', { name: 'BusinessLens on GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/businesslens/pdd')
  await rail.getByRole('button', { name: 'Show theme lab', exact: true }).click()
  await expect(page.locator('[data-businesslens-theme-lab-bar]')).toBeVisible()
  await expect(desktop).toHaveCSS('width', '64px')
  await rail.getByRole('button', { name: 'Hide theme lab', exact: true }).click()
  await rail.getByRole('button', { name: 'Toggle color mode', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await capture('sidebar-collapsed-dark')

  /* A phone opens the full menu without changing the saved desktop choice. */
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(desktop).toBeHidden()
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeHidden()
  await page.getByRole('button', { name: 'Open report navigation', exact: true }).click()
  await expect(rail).toHaveAttribute('data-collapsed', 'false')
  await expect(rail.locator('[data-pdd-version]')).toBeVisible()
  await expect(product).toContainText('Fixture Shop')
  await expect(rail.getByRole('button', { name: 'Entities', exact: true })).toHaveText(/Entities/)
  await expect.poll(async () => Math.round((await rail.boundingBox()).x)).toBe(0)
  await capture('sidebar-mobile')
  await rail.getByRole('button', { name: 'Overview', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Report navigation', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(desktop).toHaveCSS('width', '64px')
  await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
  await expect(desktop).toHaveCSS('width', '288px')
  await expect(rail.locator('[data-pdd-version]')).toBeVisible()
  await page.reload()
  await expect(desktop).toHaveAttribute('data-collapsed', 'false')
  await expect(desktop).toHaveCSS('width', '288px')
  /* A short desktop scrolls the rail while keeping its collapse control usable. */
  await page.setViewportSize({ width: 1024, height: 500 })
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await rail.getByRole('button', { name: 'Show theme lab', exact: true }).click()
  await expect(page.locator('[data-businesslens-theme-lab-bar]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeInViewport()
  await rail.getByRole('button', { name: 'Hide theme lab', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  console.log('Passed: collapse/expand, keyboard access, tooltips, persistence, reading state, utilities and independent mobile navigation.')
} finally {
  await browser.close()
}
