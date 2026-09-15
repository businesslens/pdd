#!/usr/bin/env node
/** Resource inspection preserves the live working view and supports real browser history. */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const origin = process.argv[2]
if (!origin) throw new Error('Pass a running fixture-shop report URL.')
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const browser = await chromium.launch()
const errors = []
const panelOf = page => page.locator('[data-resource-panel]')
const urlValue = (page, key) => new URL(page.url()).searchParams.get(key)
const title = (page, value) => expect(panelOf(page).locator('[data-resource-heading]')).toHaveText(value)
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const panel = panelOf(page)
    await page.goto(`${origin}/?s=what-changes-what&tm=entity:order`)
    const source = page.locator('.blr-topology-matrix a[data-resource-key="entity:order"]').first()
    await expect(source).toBeVisible()
    await source.click()
    await title(page, 'Order')
    expect(urlValue(page, 's')).toBe('what-changes-what')
    await expect(page.locator('.blr-topology-matrix')).toBeAttached()
    if (width >= 768) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText('What changes what')
      await expect(page.locator('.blr-navitem[data-current=true]')).toContainText('What changes what')
      // The backdrop remains interactive; another visible matrix row replaces the inspection.
      const next = page.locator('.blr-topology-matrix a[data-resource-key^="capability:"]').first()
      await next.click()
      await expect.poll(() => urlValue(page, 'e')).toMatch(/^capability:/)
      await panel.getByRole('button', { name: 'Back to Order', exact: true }).click()
      await title(page, 'Order')
    }
    await panel.getByRole('tab', { name: /^Lifecycle/ }).click()
    expect(urlValue(page, 'rt')).toBe('lifecycle')
    await expect(panel.locator('[data-flow-ready=true]')).toBeVisible()
    await page.reload()
    await title(page, 'Order')
    expect(urlValue(page, 's')).toBe('what-changes-what')
    await expect(panel.getByRole('tab', { name: /^Lifecycle/ })).toHaveAttribute('aria-selected', 'true')
    await expect(panel.locator('[data-flow-ready=true]')).toBeVisible()
    if (screenshots) await page.screenshot({ animations: 'disabled', path: join(screenshots, `${width}-resource-lifecycle.png`) })
    await panel.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(panel).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('What changes what')
    await page.goBack()
    await title(page, 'Order')
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)

    // The graph and Lifecycle have separate tabs and separate live canvases.
    await page.goto(`${origin}/?s=entity&t=graph&e=entity:order&rt=lifecycle`)
    await expect(page.locator('[data-flow-ready=true]')).toHaveCount(2)
    expect(urlValue(page, 't')).toBe('graph')
    await page.reload()
    await expect(page.locator('[data-flow-ready=true]')).toHaveCount(2)
    await panel.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(page.locator('[data-flow-ready=true]')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Draw as graph', exact: true })).toHaveAttribute('aria-pressed', 'true')

    // Return to the precise expanded Scenario and scroll after two linked-resource lookups.
    await page.goto(`${origin}/?s=journey&e=journey:browse-and-buy&rt=scenarios`)
    const scenario = panel.locator('[data-row-key="journey-scenario:browse-and-complete-checkout"]')
    await scenario.locator('.blr-summary-toggle').click()
    const order = scenario.locator('.blr-steps-list a[data-resource-key="entity:order"]').last()
    await order.scrollIntoViewIfNeeded()
    const top = await panel.locator('[data-resource-scroll]').evaluate(item => item.scrollTop)
    await order.click()
    await title(page, 'Order')
    const rule = panel.locator('a[data-resource-key^="rule:"]').first()
    await rule.click()
    await expect.poll(() => urlValue(page, 'e')).toMatch(/^rule:/)
    await page.reload()
    await panel.getByRole('button', { name: 'Back to Order', exact: true }).click()
    await title(page, 'Order')
    await panel.getByRole('button', { name: 'Back to Browse and buy', exact: true }).click()
    await title(page, 'Browse and buy')
    await expect(scenario.locator('.blr-summary-toggle')).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => panel.locator('[data-resource-scroll]').evaluate(item => item.scrollTop)).toBeCloseTo(top, 0)
    await page.goForward()
    await title(page, 'Order')
    await page.goBack()
    await title(page, 'Browse and buy')
    if (screenshots) await page.screenshot({ animations: 'disabled', path: join(screenshots, `${width}-resource-scenarios.png`) })

    // Search from the Product Overview must retain Overview as the working view.
    await page.goto(origin)
    await page.getByRole('button', { name: /Search/ }).first().click()
    await page.getByPlaceholder('Search every resource in this model…').fill('Order')
    await page.getByRole('option').filter({ hasText: /^Order/ }).first().click()
    await expect(panel).toBeVisible()
    expect(urlValue(page, 's')).toBe('overview')
    await page.reload()
    await expect(panel).toBeVisible()
    await panel.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')

    // Direct links need no previous in-app history and retain the resource tab.
    await page.goto(`${origin}/?e=entity:order&rt=lifecycle`)
    await title(page, 'Order')
    await expect.poll(() => urlValue(page, 's')).toBe('entity')
    await expect(panel.getByRole('button', { name: /^Back to / })).toHaveCount(0)
    expect(urlValue(page, 'rt')).toBe('lifecycle')
    const link = panel.locator('a[data-resource-key^="rule:"]').first()
    const href = await link.getAttribute('href')
    expect(href).toContain('e=rule')
    const opened = context.waitForEvent('page')
    await link.click({ modifiers: ['ControlOrMeta'] })
    const other = await opened
    await other.waitForLoadState()
    await expect(panelOf(other)).toBeVisible()
    await other.close()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await panel.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Entities')
    console.log(`Passed ${width}px: matrix context, independent tabs, nested Back/Forward, exact Scenario return, reload, direct links, Escape and overflow.`)
    await context.close()
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
