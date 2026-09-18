#!/usr/bin/env node
/** Screen readings, keyboard expansion and remembered state on desktop and phones. */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running fixture-shop report URL.')
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const screenId = 'customer-web::storefront::product-record'
const address = `${origin}/?s=interface&e=${encodeURIComponent(`screen:${screenId}`)}`
const browser = await chromium.launch()
const errors = []
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const panel = page.locator('[data-resource-panel]')
    const reading = panel.locator('[data-resource-scroll]')
    const behavior = panel.locator('[data-screen-behavior]')
    const ready = panel.locator('[data-screen-state="Ready to buy"]')
    const descriptions = panel.locator('[data-screen-state-description]')
    await page.goto(address)
    await expect(panel.getByRole('heading', { name: 'Information presented 2', exact: true })).toBeVisible()
    await expect(panel.getByRole('heading', { name: /Available actions|View states/ })).toHaveCount(0)
    await expect(reading.locator('dl')).toHaveCount(0)
    await expect(reading.getByRole('heading').last()).toHaveText('Capability boundary')
    await expect(reading.getByText('Presents', { exact: true })).toBeVisible()
    await expect(reading.locator('a[data-resource-key="screen:customer-mobile::storefront::product-record"]')).toHaveCount(0)
    if (screenshots) await page.screenshot({ animations: 'disabled', path: join(screenshots, `${width}-screen-overview.png`) })

    await panel.getByRole('tab', { name: 'Behavior', exact: true }).click()
    await expect(behavior).toBeVisible()
    expect(new URL(page.url()).searchParams.get('rt')).toBe('behavior')
    await expect(panel.locator('[data-screen-actions] li')).toHaveCount(2)
    await expect(panel.locator('[data-screen-state]')).toHaveCount(2)
    await expect(descriptions).toHaveCount(0)
    await ready.getByRole('button').focus()
    await page.keyboard.press('Enter')
    await expect(ready.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await expect(ready).toContainText('The price and stock are shown with an active control')
    await expect(descriptions).toHaveCount(1)
    await panel.getByRole('tab', { name: 'Overview', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBeNull()
    await page.goBack()
    await expect.poll(() => new URL(page.url()).searchParams.get('rt')).toBe('behavior')
    await expect(ready.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await panel.locator('a[data-resource-key="experience:customer-web::storefront"]').first().click()
    await expect(panel.locator('[data-resource-heading]')).toHaveText('Shopping')
    await panel.getByRole('button', { name: 'Back to Product record', exact: true }).click()
    await expect(panel.getByRole('tab', { name: 'Behavior', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(ready.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await page.reload()
    await expect(ready.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await expect(descriptions).toHaveCount(1)
    if (width >= 768) {
      await panel.getByRole('button', { name: 'Expand resource', exact: true }).click()
      await expect(ready.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
      await panel.getByRole('button', { name: 'Restore resource size', exact: true }).click()
    }
    await panel.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(descriptions).toHaveCount(2)
    if (screenshots) await page.screenshot({ animations: 'disabled', path: join(screenshots, `${width}-screen-behavior.png`) })
    await panel.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await expect(descriptions).toHaveCount(0)
    await page.reload()
    await expect(behavior).toBeVisible()
    await expect(descriptions).toHaveCount(0)
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)

    await panel.getByRole('tab', { name: 'Connections', exact: true }).click()
    await expect(reading.getByText('Also on', { exact: false })).toBeVisible()
    await reading.locator('a[data-resource-key="screen:customer-mobile::storefront::product-record"]').click()
    await panel.getByRole('tab', { name: 'Behavior', exact: true }).click()
    await expect(descriptions).toHaveCount(0)

    // Authored lists are optional independently; omit their controls and headings when empty.
    for (const mode of ['actions', 'states', 'neither']) {
      await page.route('**/_businesslens/report.json', async route => {
        const response = await route.fetch()
        const report = await response.json()
        const screen = report.model.screens.find(item => item.id === screenId)
        if (mode !== 'actions') screen.actions = []
        if (mode !== 'states') screen.states = []
        await route.fulfill({ response, json: report })
      })
      await page.goto(`${address}&rt=behavior`)
      if (mode === 'neither') {
        await expect(panel.getByRole('tab', { name: 'Behavior', exact: true })).toHaveCount(0)
        await expect(panel.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true')
      } else {
        await expect(behavior).toBeVisible()
        await expect(panel.locator('[data-screen-actions]')).toHaveCount(mode === 'actions' ? 1 : 0)
        await expect(panel.locator('[data-screen-states]')).toHaveCount(mode === 'states' ? 1 : 0)
        await expect(panel.getByRole('button', { name: 'Expand all', exact: true })).toHaveCount(mode === 'states' ? 1 : 0)
      }
      await page.unroute('**/_businesslens/report.json')
    }
    console.log(`Passed ${width}px: Screen tab separation, counterparts, optional lists, keyboard and bulk expansion, Back, refresh and panel resizing.`)
    await context.close()
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
