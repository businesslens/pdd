#!/usr/bin/env node
/** Browser regressions against a built CLI report with mutation and Rule data.
 * node scripts/check-comparison-tables.mjs http://127.0.0.1:4317
 * Large-report data is intercepted in this browser only; no model files change.
 */
import { chromium, expect } from '@playwright/test'
import { selectCollectionDrawing, expectCollectionDrawing } from './report-view-controls.mjs'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL with mutation and Rule data.')
const report = await fetch(`${origin}/_businesslens/report.json`).then(response => response.json())
const browser = await chromium.launch()
const errors = []
const observeErrors = page => page.on('pageerror', error => errors.push(error.message))
const settled = async page => {
  await expect(page.locator('.blr-topology-matrix')).not.toHaveAttribute('data-column-motion', 'true')
}
async function closeFilterSheet(page) {
  const toolbar = page.locator('[data-collection-toolbar]')
  await toolbar.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  // Clearing selections can make the controls fit inline again, which closes
  // the drawer automatically. Otherwise close it through its normal action.
  if (await toolbar.locator('[data-blr-filter-bar]').getAttribute('data-filters-collapsed') === 'true') {
    await page.getByRole('button', { name: 'Show results', exact: true }).click()
  }
  await expect(page.locator('[data-mobile-filter-controls]')).toHaveCount(0)
}
async function selectCollectionResource(page, label, title) {
  const toolbar = page.locator('[data-collection-toolbar]')
  await expect(toolbar).toBeVisible()
  await toolbar.evaluate(async () => {
    await document.fonts.ready
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
  const mobileFilters = toolbar.locator('[data-mobile-filters]')
  // Switching drawings can change whether the toolbar fits inline. Resolve
  // the visible trigger at click time while ResizeObserver settles the layout.
  const inline = toolbar.getByRole('button', { name: label, exact: true })
  await inline.or(mobileFilters).filter({ visible: true }).first().click()
  const sheet = page.locator('[data-mobile-filter-controls]')
  await expect(page.getByRole('listbox').or(sheet)).toBeVisible()
  const inSheet = await sheet.isVisible()
  if (inSheet) await sheet.getByRole('button', { name: label, exact: true }).click()
  await page.getByRole('option').filter({ has: page.getByText(title, { exact: true }) }).first().click()
  await page.keyboard.press('Escape')
  // Let the select restore focus before opening another popover or drawer.
  await expect(page.getByRole('listbox')).toHaveCount(0)
  if (inSheet) await closeFilterSheet(page)
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  observeErrors(page)
  for (const section of ['entity', 'capability', 'rule']) {
    await page.goto(`${origin}/?s=${section}&t=matrix`)
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

  // Collection filters and selected resources describe the same rows in every drawing.
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const scoped = await context.newPage()
    observeErrors(scoped)
    for (const [section, label, resources] of [
      ['entity', 'Entities', report.model.entities],
      ['capability', 'Capabilities', report.model.capabilities],
      ['rule', 'Business Rules', report.model.businessRules]
    ]) {
      await scoped.goto(`${origin}/?s=${section}`)
      const selected = resources[0]
      const toolbar = scoped.locator('[data-collection-toolbar]')
      const count = scoped.getByRole('heading', { level: 1 }).locator('.blr-meta')
      await selectCollectionResource(scoped, label, selected.title)
      await expect(count).toHaveText(`1 / ${resources.length}`)
      const selection = await toolbar.locator('.blr-chip').allTextContents()
      for (const drawing of ['matrix', 'graph', 'rows', 'matrix']) {
        await selectCollectionDrawing(scoped, drawing)
        await expect(count).toHaveText(`1 / ${resources.length}`)
        expect(await toolbar.locator('.blr-chip').allTextContents()).toEqual(selection)
        if (drawing !== 'rows') await expect(scoped).toHaveURL(new RegExp(`[?&]t=${drawing}(?:&|$)`))
        if (drawing === 'matrix') {
          await expect(scoped.locator('.blr-topology-matrix tbody tr')).toHaveCount(1)
          await expect(scoped.locator('.blr-topology-matrix tbody th [data-resource-key]')).toHaveAttribute('data-resource-key', `${section}:${selected.id}`)
        }
      }
      await expect(scoped).toHaveURL(/[?&]t=matrix(?:&|$)/)
      await scoped.reload()
      await expectCollectionDrawing(scoped, 'matrix')
      await expect(count).toHaveText(`1 / ${resources.length}`)
      await expect(scoped.locator('.blr-topology-matrix tbody tr')).toHaveCount(1)
      await toolbar.locator('.blr-chip').click()
      await expect(count).toHaveText(String(resources.length))
      await expect(scoped.locator('.blr-topology-matrix tbody tr')).toHaveCount(resources.length)
    }
    // A relation selects the same subjects in Rows, Graph and Matrix. Discover
    // a real cell so this works on any report with the named relationships.
    for (const [section, label] of [['entity', 'Changed by'], ['capability', 'Available in'], ['rule', 'Attached to']]) {
      await scoped.goto(`${origin}/?s=${section}&t=matrix`)
      await expect(scoped.locator('[data-blr-filter-bar]')).toHaveCount(1)
      await expect(scoped.locator('[data-matrix-heading]')).toHaveCount(0)
      const cell = scoped.locator('td[data-cell]:not([inert])').filter({ has: scoped.locator('.blr-matrix-badge') }).first()
      await expect(scoped.locator('.blr-topology-matrix')).toBeVisible()
      // The phone's first column can legitimately contain only empty cells.
      const nextColumns = scoped.getByRole('button', { name: 'Next columns', exact: true })
      while (!await cell.count() && await nextColumns.isEnabled()) {
        await nextColumns.click()
        await settled(scoped)
      }
      const target = (await cell.getAttribute('data-cell')).split('->')[1]
      const targetTitle = await scoped.locator(`thead [data-resource-key="${target}"]`).textContent()
      const matching = await scoped.locator(`td[data-cell$="->${target}"]`).filter({ has: scoped.locator('.blr-matrix-badge') })
        .evaluateAll(cells => cells.map(cell => cell.getAttribute('data-cell').split('->')[0]))
      await selectCollectionResource(scoped, label, targetTitle.trim())
      const toolbar = scoped.locator('[data-collection-toolbar]')
      const chips = await toolbar.locator('.blr-chip').allTextContents()
      const heading = await scoped.getByRole('heading', { level: 1 }).textContent()
      for (const drawing of ['rows', 'graph', 'matrix']) {
        await selectCollectionDrawing(scoped, drawing)
        await expect(scoped.getByRole('heading', { level: 1 })).toHaveText(heading)
        expect(await toolbar.locator('.blr-chip').allTextContents()).toEqual(chips)
        if (drawing === 'rows') {
          const keys = await scoped.locator('.blr-resource-row[data-resource-key]').evaluateAll(rows => [...new Set(rows.map(row => row.dataset.resourceKey))])
          expect(keys.sort()).toEqual(matching.sort())
        }
      }
      expect(await scoped.locator('tbody th [data-resource-key]').evaluateAll(rows => rows.map(row => row.dataset.resourceKey).sort())).toEqual(matching.sort())
      await expect(scoped).toHaveURL(/[?&]t=matrix(?:&|$)/)
      await scoped.reload()
      await expect(scoped.getByRole('heading', { level: 1 })).toHaveText(heading)
      await expect(toolbar.locator('.blr-chip')).toHaveCount(1)
      await toolbar.locator('.blr-chip').click()
      if (section === 'rule') {
        // A whole type is a positive relation choice, with its own removable chip.
        const type = target.split(':')[0]
        const label = { entity: 'Entity', capability: 'Capability', interface: 'Interface', screen: 'Screen', experience: 'Experience', journey: 'Journey', 'capability-scenario': 'Capability Scenario', 'journey-scenario': 'Journey Scenario' }[type]
        await selectCollectionResource(scoped, 'Attached to', `Any ${label}`)
        const typeCount = await scoped.locator('tbody tr').count()
        expect(typeCount).toBeGreaterThanOrEqual(matching.length)
        await selectCollectionDrawing(scoped, 'rows')
        await expect(toolbar.locator('.blr-chip')).toContainText(`Any ${label}`)
        await toolbar.locator('.blr-chip').click()
      }
      expect(await scoped.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    // Availability spans all three location types in one control. Screen
    // selections retain exact delivery while Matrix columns remain Interfaces.
    await scoped.goto(`${origin}/?s=capability`)
    const capabilityToolbar = scoped.locator('[data-collection-toolbar]')
    await expect(capabilityToolbar.getByRole('button', { name: 'Filter by Screens', exact: true })).toHaveCount(0)
    await expect(capabilityToolbar.getByRole('button', { name: /Filter by .*Scenarios/ })).toHaveCount(0)
    const availableScreen = report.model.screens.find(screen => screen.capabilityIds.length)
    const availableExperience = report.model.experiences.find(experience =>
      report.model.screens.some(screen => screen.id.startsWith(`${experience.id}::`) && screen.capabilityIds.length))
    for (const location of [availableScreen, availableExperience].filter(Boolean)) {
      // Select the first of any namesakes, matching the authored option order.
      const resources = location === availableScreen ? report.model.screens : report.model.experiences
      const selected = resources.find(item => item.title === location.title)
      await selectCollectionResource(scoped, 'Available in', selected.title)
      const heading = await scoped.getByRole('heading', { level: 1 }).textContent()
      const rowKeys = await scoped.locator('.blr-resource-row[data-resource-key]').evaluateAll(rows => [...new Set(rows.map(row => row.dataset.resourceKey))].sort())
      if (location === availableScreen) expect(rowKeys).toEqual(selected.capabilityIds.map(id => `capability:${id}`).sort())
      for (const drawing of ['graph', 'matrix']) {
        await selectCollectionDrawing(scoped, drawing)
        await expect(scoped).toHaveURL(new RegExp(`[?&]t=${drawing}(?:&|$)`))
        await expect(scoped.getByRole('heading', { level: 1 })).toHaveText(heading)
      }
      expect(await scoped.locator('tbody th [data-resource-key]').evaluateAll(rows => rows.map(row => row.dataset.resourceKey).sort())).toEqual(rowKeys)
      expect(await scoped.locator('thead [data-resource-key]').evaluateAll(columns => columns.every(column => column.dataset.resourceKey.startsWith('interface:')))).toBe(true)
      await scoped.reload()
      await expect(scoped.getByRole('heading', { level: 1 })).toHaveText(heading)
      await capabilityToolbar.locator('.blr-chip').click()
      await selectCollectionDrawing(scoped, 'rows')
    }
    for (const type of ['Interface', 'Experience', 'Screen']) {
      await selectCollectionResource(scoped, 'Available in', `Any ${type}`)
      await expect(capabilityToolbar.locator('.blr-chip')).toContainText(`Any ${type}`)
      await capabilityToolbar.locator('.blr-chip').click()
    }
    // An Interface opens the same shared Available in scope.
    const iface = report.model.interfaces[0]
    await scoped.goto(`${origin}/?s=interface&e=${encodeURIComponent(`interface:${iface.id}`)}`)
    await scoped.locator('[data-resource-panel]').getByRole('button', { name: 'Compare delivery', exact: true }).click()
    await expect(scoped).toHaveURL(/[?&]s=capability(?:&|$)/)
    await expect(scoped).toHaveURL(/[?&]t=matrix(?:&|$)/)
    await expect(scoped.locator('[data-collection-toolbar] .blr-chip')).toContainText(iface.title)
    expect(await scoped.locator('.blr-topology-matrix tbody tr').count()).toBeGreaterThan(0)
    await expect(scoped.locator('.blr-topology-matrix thead [data-resource-key]')).toHaveAttribute('data-resource-key', `interface:${iface.id}`)
    for (const drawing of ['rows', 'matrix']) await selectCollectionDrawing(scoped, drawing)
    await expect(scoped.locator('.blr-topology-matrix thead [data-resource-key]')).toHaveAttribute('data-resource-key', `interface:${iface.id}`)
    await selectCollectionResource(scoped, 'Capabilities', report.model.capabilities[0].title)
    const collectionFilters = scoped.locator('[data-collection-toolbar]')
    const inSheet = await collectionFilters.locator('[data-mobile-filters]').isVisible()
    if (inSheet) {
      await collectionFilters.locator('[data-mobile-filters]').click()
      await scoped.getByRole('button', { name: 'Clear all', exact: true }).click()
      await expect(collectionFilters.locator('.blr-chip')).toHaveCount(0)
      await closeFilterSheet(scoped)
    } else await collectionFilters.getByRole('button', { name: 'Clear every filter', exact: true }).click()
    await expect(scoped.locator('.blr-topology-matrix tbody tr')).toHaveCount(report.model.capabilities.length)
    await expect(scoped.locator('.blr-topology-matrix thead [data-resource-key]')).toHaveCount(report.model.interfaces.length)
    expect(await scoped.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await context.close()
  }

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
  await largePage.goto(`${origin}/?s=rule&t=matrix`)
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
  await largePage.goto(`${origin}/?s=rule&t=matrix&tm=entity:matrix-review-199`)
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
  console.log(`Passed comparison tables: shared collection scope at desktop and phone widths, drawing switches, refresh and contextual links; focus returns from all three badge types; bounded 200 × 200 matrix; ${updates} body update batches per column move; fixed subject, scroll, history, last window, mobile and reduced motion.`)
} finally {
  await browser.close()
}
