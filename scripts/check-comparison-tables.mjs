#!/usr/bin/env node
/** Browser regressions against a built CLI report with mutation and Rule data.
 * node scripts/check-comparison-tables.mjs http://127.0.0.1:4317
 * Large-report data is intercepted in this browser only; no model files change.
 */
import { chromium, expect } from '@playwright/test'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL with mutation and Rule data.')
const report = await fetch(`${origin}/_businesslens/report.json`).then(response => response.json())
const browser = await chromium.launch()
const errors = []
const observeErrors = page => page.on('pageerror', error => errors.push(error.message))
const settled = async page => {
  await expect(page.locator('.blr-topology-matrix')).not.toHaveAttribute('data-column-motion', 'true')
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  observeErrors(page)
  for (const section of ['what-changes-what', 'delivery', 'rule-attachments']) {
    await page.goto(`${origin}/?s=${section}`)
    const badge = page.locator('td:not([inert]) .blr-matrix-badge').first()
    await expect(badge).toBeVisible()
    await badge.focus()
    await page.keyboard.press('Enter')
    const popover = page.locator('.blr-matrix-popover[data-state="open"]')
    const resource = popover.locator('[data-resource-key]').first()
    await resource.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.blr-resource-slideover')).toBeVisible()
    await expect(page.locator('.blr-matrix-popover')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.locator('.blr-resource-slideover')).toHaveCount(0)
    await expect(badge).toBeFocused()
  }
  await page.close()

  // A sparse 200 × 200 matrix must not mount 40,000 cells just to show a few columns.
  const large = structuredClone(report)
  const count = 200
  const entity = large.model.entities[0], rule = large.model.businessRules[0]
  if (!entity || !rule) throw new Error('The report must include Entities and Business Rules.')
  large.model.entities.push(...Array.from({ length: count }, (_, index) => ({
    ...entity, id: `matrix-review-${index}`, title: `Matrix Entity ${index}`, relations: []
  })))
  large.model.businessRules = Array.from({ length: count }, (_, index) => ({
    ...rule, id: `matrix-rule-${index}`, title: `Matrix Rule ${index}`,
    appliesTo: [{ type: 'entity', entityId: `matrix-review-${index}`, effect: null, from: null, to: null, facts: [], contexts: [] }]
  }))
  const largePage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  observeErrors(largePage)
  await largePage.route('**/_businesslens/report.json', route => route.fulfill({ json: large }))
  await largePage.goto(`${origin}/?s=rule-attachments`)
  const matrix = largePage.locator('.blr-topology-matrix')
  const range = largePage.locator('.blr-matrix-range')
  const pane = largePage.locator('.blr-topology-reading')
  await expect(matrix.locator('tbody tr')).toHaveCount(count)
  async function checkWindow() {
    await settled(largePage)
    const [start, end, total] = (await range.textContent()).match(/\d+/g).map(Number)
    expect(total).toBe(count)
    expect(await matrix.locator('td[data-cell]').count()).toBeLessThanOrEqual(count * (end - start + 3))
    expect(await matrix.locator('tbody tr').first().locator('td[data-cell]:not([inert])').count()).toBe(end - start + 1)
    for (const row of await matrix.locator('tbody tr').all()) {
      expect(await row.locator('td[data-cell]:not([inert])').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('aria-colindex')))))
        .toEqual(Array.from({ length: end - start + 1 }, (_, index) => start + index + 1))
    }
    return { start, end }
  }
  const initial = await checkWindow()
  await pane.evaluate(element => { element.scrollTop = 300 })
  const scrollTop = await pane.evaluate(element => element.scrollTop)
  const subjectX = await matrix.locator('tbody th').first().evaluate(element => element.getBoundingClientRect().x)
  await largePage.evaluate(() => {
    window.comparisonBodyUpdates = 0
    window.comparisonObserver = new MutationObserver(() => { window.comparisonBodyUpdates++ })
    window.comparisonObserver.observe(document.querySelector('.blr-topology-matrix tbody'), { attributes: true, childList: true, subtree: true })
  })
  await largePage.getByRole('button', { name: 'Next columns', exact: true }).click()
  await expect(range).toContainText(`Columns 2–${initial.end + 1}`)
  await settled(largePage)
  const updates = await largePage.evaluate(() => { window.comparisonObserver.disconnect(); return window.comparisonBodyUpdates })
  expect(updates).toBeLessThanOrEqual(4)
  expect(await pane.evaluate(element => element.scrollTop)).toBe(scrollTop)
  expect(await matrix.locator('tbody th').first().evaluate(element => element.getBoundingClientRect().x)).toBeCloseTo(subjectX)
  await checkWindow()
  await largePage.goBack()
  await expect(range).toContainText('Columns 1–')
  await checkWindow()
  // An interrupted move snaps before dropping the departing buffer column.
  for (const start of [2, 3]) {
    await largePage.getByRole('button', { name: 'Next columns', exact: true }).click()
    await expect(range).toContainText(`Columns ${start}–`)
  }
  await settled(largePage)
  expect(await matrix.evaluate(element => Math.abs(
    parseFloat(getComputedStyle(element).getPropertyValue('--blr-matrix-offset'))
      - parseFloat(element.style.getPropertyValue('--blr-matrix-offset'))
  ))).toBeLessThan(0.01)
  const subjectRight = await matrix.locator('tbody th').first().evaluate(element => element.getBoundingClientRect().right)
  expect(await matrix.locator('tbody tr').first().locator('td[data-cell]:not([inert])').first()
    .evaluate(element => element.getBoundingClientRect().left)).toBeCloseTo(subjectRight, 0)
  // A jump to the last column and a resize clamp the window without mounting the gap.
  await largePage.goto(`${origin}/?s=rule-attachments&tm=entity:matrix-review-199`)
  const last = await checkWindow()
  expect(last.end).toBe(count)
  await expect(largePage.getByRole('button', { name: 'Next columns', exact: true })).toBeDisabled()
  await largePage.setViewportSize({ width: 390, height: 850 })
  await checkWindow()
  await expect(range).toHaveText(`Columns ${count}–${count} of ${count}`)
  await largePage.emulateMedia({ reducedMotion: 'reduce' })
  await largePage.getByRole('region', { name: 'Relationship table' }).focus()
  await largePage.keyboard.press('ArrowLeft')
  await expect(range).toHaveText(`Columns ${count - 1}–${count - 1} of ${count}`)
  await checkWindow()
  expect(errors).toEqual([])
  console.log(`Passed comparison tables: focus returns from all three badge types; bounded 200 × 200 matrix; ${updates} body update batches per column move; fixed subject, scroll, history, last window, mobile and reduced motion.`)
} finally {
  await browser.close()
}
