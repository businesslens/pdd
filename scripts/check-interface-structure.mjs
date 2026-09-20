#!/usr/bin/env node
/** Verify the same hierarchy across the collection and scoped resource readings. */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const origin = process.argv[2]
if (!origin) throw new Error('Pass a running content-feed-reader report URL.')
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const browser = await chromium.launch()
const errors = []
const ifaceKey = 'interface:reader-web'
const experienceKey = 'experience:reader-web::personal-library'
const screenKey = 'screen:reader-web::item-reader'
const capture = async (page, name) => {
  if (screenshots) await page.screenshot({ animations: 'disabled', path: join(screenshots, `${name}.png`) })
}
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/?s=interface`)
    const card = page.locator(`[data-card-key="${ifaceKey}"]`)
    const panel = page.locator('[data-resource-panel]')
    const structure = panel.locator('[data-resource-structure]')
    const tab = name => panel.getByRole('tab', { name, exact: true })
    const link = (scope, key) => scope.locator(`a[data-resource-key="${key}"]`)
    const keys = scope => scope.locator('a[data-resource-key]').evaluateAll(items => items.map(item => item.dataset.resourceKey))
    await expect(card).toBeVisible()
    await expect(card.getByText('Overview', { exact: true })).toHaveCount(0)
    await expect(card.locator('[data-slot="linkLabel"]').filter({ hasText: /^Experiences 2$/ })).toBeVisible()
    await expect(card.locator('[data-slot="linkLabel"]').filter({ hasText: /^Shared Screens 1$/ })).toBeVisible()
    await expect(link(card, screenKey)).toHaveCount(1)
    const childKeys = (await keys(card)).filter(key => key !== ifaceKey)
    await capture(page, `${width}-interface-collection`)
    await card.getByRole('button', { name: 'Collapse Reader web application', exact: true }).click()
    await expect(link(card, experienceKey)).toHaveCount(0)
    await expect(panel).toHaveCount(0)
    await page.reload()
    await card.getByRole('button', { name: 'Expand Reader web application', exact: true }).press('Space')
    await expect(link(card, experienceKey)).toBeVisible()
    const root = card.locator('[role="treeitem"][aria-level="1"]')
    await root.press('ArrowLeft')
    await expect(root).toHaveAttribute('aria-expanded', 'false')
    await root.press('ArrowRight')
    await expect(root).toHaveAttribute('aria-expanded', 'true')
    await link(card, ifaceKey).click()
    await expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
    await expect(tab('Delivery')).toHaveCount(0)
    await expect(panel.locator('[data-resource-audience]')).toContainText('Reader')
    await expect(panel.locator('[data-resource-audience]')).toContainText('Visitor')
    await tab('Structure').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBe('structure')
    await expect(structure).toBeVisible()
    expect(await keys(structure)).toEqual(childKeys)
    await expect(link(structure, ifaceKey)).toHaveCount(0)
    await expect(structure).not.toContainText('Exposes')
    await expect(structure).not.toContainText('Entered by')
    await expect(structure).not.toContainText('Delivers')
    await capture(page, `${width}-interface-structure`)

    await structure.getByRole('button', { name: 'Collapse Personal library', exact: true }).click()
    await tab('Overview').click()
    await tab('Structure').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBe('structure')
    await expect(structure.getByRole('button', { name: 'Expand Personal library', exact: true })).toBeVisible()
    await page.reload()
    await expect(structure.getByRole('button', { name: 'Expand Personal library', exact: true })).toBeVisible()
    // A collapsed resource still opens by its name, without changing expansion.
    await link(structure, experienceKey).click()
    await expect(tab('Screens')).toHaveCount(0)
    await tab('Structure').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBe('structure')
    await expect(structure).toContainText('Screens 4')
    await expect(structure).toContainText('Shared Screens 1')
    await expect(structure).toContainText('From Reader web application')
    await expect(link(structure, screenKey)).toHaveCount(1)
    await expect(link(structure, ifaceKey)).toHaveCount(1)
    await expect(link(structure, experienceKey)).toHaveCount(0)
    await capture(page, `${width}-experience-structure`)
    // Links retain their actual addresses, including modifier-click behavior.
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      link(structure, screenKey).click({ modifiers: ['ControlOrMeta'] })
    ])
    await expect.poll(() => new URL(popup.url()).searchParams.get('e')).toBe(screenKey)
    await popup.close()
    await link(structure, screenKey).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('e')).toBe(screenKey)
    await expect(tab('Structure')).toHaveCount(0)
    await page.goBack()
    await expect(structure).toContainText('From Reader web application')
    await structure.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await page.reload()
    await expect(structure.locator('[role="treeitem"][aria-expanded="true"]')).toHaveCount(0)
    await structure.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(link(structure, screenKey)).toBeVisible()
    await link(structure, ifaceKey).click()
    await tab('Structure').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBe('structure')
    await expect(structure.getByRole('button', { name: 'Expand Personal library', exact: true })).toBeVisible()
    await expect(link(structure, screenKey)).toHaveCount(1)
    if (width >= 768) {
      await panel.getByRole('button', { name: 'Expand resource', exact: true }).click()
      await expect(structure.getByRole('button', { name: 'Expand Personal library', exact: true })).toBeVisible()
      await panel.getByRole('button', { name: 'Restore resource size', exact: true }).click()
    }
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await panel.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(link(card, experienceKey)).toBeVisible()
    await expect(root).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await context.close()
    console.log(`Passed ${width}px: shared hierarchy, labelled counts, ownership, links, keyboard expansion, persistence and restored collection.`)
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
