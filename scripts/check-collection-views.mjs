#!/usr/bin/env node
/** Check the permanent preview-card picker against a running CLI report. */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { selectCollectionDrawing, expectCollectionDrawing } from './report-view-controls.mjs'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI viewer URL.')
const report = await fetch(`${origin}/_businesslens/report.json`).then(response => response.json())
const browser = await chromium.launch()
const errors = []
const screenshots = process.env.BLR_VIEW_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const chosenEntity = report.model.entities.find(item => item.id === 'order') ?? report.model.entities[0]
const cases = [
  ['entity', `1 / ${report.model.entities.length}`, ['List', 'Relationships', 'Changes']],
  ['interface', String(report.model.interfaces.length), ['List', 'Structure']],
  ['domain', String(report.model.domains.length), ['List', 'Reach']],
  ['capability', String(report.model.capabilities.length), ['List', 'Reach', 'Delivery']],
  ['journey', String(report.model.journeys.length), ['List', 'Reach']],
  ['rule', String(report.model.businessRules.length), ['List', 'Reach', 'Attachments']]
]
try {
  for (const width of [1440, 640, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    // An old experiment preference must never restore a retired control.
    await context.addCookies([{ name: 'bl-preview-bar', value: 'shown', url: origin }, { name: 'blr-drawing-controls-lab', value: 'action', url: origin }])
    await context.addInitScript(({ id, key }) => {
      const storageKey = `blr:collections:/:${id}`
      if (!sessionStorage.getItem(storageKey)) sessionStorage.setItem(storageKey, JSON.stringify({ selections: { entity: [key] } }))
    }, { id: report.id, key: `entity:${chosenEntity.id}` })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    for (const [section, expectedCount, labels] of cases) {
      await page.goto(`${origin}/?s=${section}`)
      const chooser = page.locator('[data-drawing-switch]')
      const count = page.getByRole('heading', { level: 1 }).locator('.blr-meta')
      const trigger = page.locator('[data-view-trigger]')
      await expect(page.locator('[data-drawing-controls-lab-row]')).toHaveCount(0)
      let baseline
      for (const [index, label] of labels.entries()) {
        const drawing = ['rows', 'graph', 'matrix'][index]
        await selectCollectionDrawing(page, drawing)
        await page.evaluate(async () => {
          await document.fonts.ready
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        })
        await expect(count).toHaveText(expectedCount)
        await expect(trigger).toHaveAccessibleName(`Change view, current view: ${label}`)
        const box = await chooser.boundingBox()
        if (!baseline) baseline = box
        expect(Math.abs(box.x - baseline.x), `${width}px ${section}: picker moved in ${drawing}`).toBeLessThan(1)
        expect((await trigger.boundingBox()).height).toBe(28)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await trigger.click()
        const picker = page.locator('.blr-drawing-cards')
        const options = picker.getByRole('button', { name: /^Draw as / })
        await expect(options).toHaveCount(labels.length)
        await expect(picker.locator('details, summary')).toHaveCount(0)
        await expect(picker.getByText(/^About /)).toHaveCount(0)
        for (const card of await options.all()) await expect(card.locator('.text-muted')).not.toBeEmpty()
        await expect(picker.getByRole('button', { name: `Draw as ${drawing}`, exact: true })).toHaveAttribute('aria-pressed', 'true')
        if (width < 640 && drawing === 'rows') {
          const expand = picker.getByRole('button', { name: 'Expand all', exact: true })
          if (await expand.count()) await expand.click()
        }
        if (width < 640 && drawing === 'matrix') {
          await picker.getByRole('button', { name: 'Legend', exact: true }).click()
          await expect(page.getByRole('list', { name: 'Badge color legend' })).toBeVisible()
          await page.getByRole('button', { name: 'Close legend', exact: true }).click()
          await expect(page.getByRole('list', { name: 'Badge color legend' })).toHaveCount(0)
        }
        await trigger.click()
        await expect(picker).toHaveCount(0)
      }
      if (screenshots && [1440, 390].includes(width) && ['entity', 'domain'].includes(section)) {
        await trigger.click()
        await page.evaluate(() => Promise.allSettled(document.getAnimations().map(animation => animation.finished)))
        await page.screenshot({ path: join(screenshots, `${width}-${section}-picker.png`) })
        await page.keyboard.press('Escape')
        await expect(page.locator('.blr-drawing-cards')).toHaveCount(0)
      }
      await page.reload()
      await expectCollectionDrawing(page, labels.length === 3 ? 'matrix' : 'graph')
      await expect(count).toHaveText(expectedCount)
      if (section === 'entity') await expect(page.locator('.blr-topology-matrix tbody tr')).toHaveCount(1)
      await trigger.focus()
      await page.keyboard.press('Enter')
      const rows = page.getByRole('button', { name: 'Draw as rows', exact: true })
      await rows.focus()
      await page.keyboard.press('Enter')
      await expectCollectionDrawing(page, 'rows')
      await expect(page.locator('.blr-drawing-cards')).toHaveCount(0)
    }
    await context.close()
    console.log(`Passed ${width}px: six collections, preview subtitles, no About or experiment controls, fixed position, legend, saved filters, refresh and keyboard.`)
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
