#!/usr/bin/env node
/** Browser/geometry regressions against a running, built CLI report (no model writes).
 * node scripts/check-topology-diagrams.mjs http://127.0.0.1:4317 [more-report-urls]
 * Chromium is required. Optional BLR_DIAGRAM_SCREENSHOTS writes review PNGs outside the model.
 */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const urls = process.argv.slice(2)
if (!urls.length) throw new Error('Pass at least one running CLI viewer URL.')
const browser = await chromium.launch()
const failures = []
const measurements = []
const views = ['product-map', 'value-paths', 'delivery-by-interface', 'sitemap', 'rule-reach', 'what-it-keeps', 'what-changes-what']
/* Every named view is a tab of the collection whose subject it draws. */
const LOCATION = {
  'product-map': ['domain', 'map'],
  'sitemap': ['interface', 'map'],
  'delivery-by-interface': ['interface', 'delivery'],
  'what-it-keeps': ['entity', 'relationships'],
  'what-changes-what': ['capability', 'mutations'],
  'rule-reach': ['rule', 'attachments'],
  'value-paths': ['journey', 'composition']
}
const viewUrl = (origin, view, query = '') => `${origin}/?s=${LOCATION[view][0]}&t=${LOCATION[view][1]}${query}`
const openTab = page => page.locator('.blr-surface-tab[data-current="true"]')
const screenshotRoot = process.env.BLR_DIAGRAM_SCREENSHOTS
if (screenshotRoot) mkdirSync(screenshotRoot, { recursive: true })

async function flowReady(page) {
  await expect(page.locator('[data-diagram-pending="true"]')).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('[data-flow-ready="true"]')).toBeVisible({ timeout: 15000 })
}
const flowTransform = page => page.locator('.vue-flow__transformationpane').getAttribute('style')
async function geometry(page) {
  return page.locator('.vue-flow').evaluate(root => {
    const boxes = [...root.querySelectorAll('.vue-flow__node, .blr-flow-edge-label')].map(item => ({ title: item.textContent, rect: item.getBoundingClientRect() }))
    const overlaps = []
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].rect, b = boxes[j].rect
      if (a.right > b.left + 1 && b.right > a.left + 1 && a.bottom > b.top + 1 && b.bottom > a.top + 1) overlaps.push([boxes[i].title, boxes[j].title])
    }
    const labels = [...root.querySelectorAll('.blr-flow-edge-label, .blr-flow-node__text')]
    return { overlaps, clipped: labels.filter(item => item.scrollHeight > item.clientHeight + 1 || item.scrollWidth > item.clientWidth + 1).map(item => item.textContent) }
  })
}
async function checkSitemap(page) {
  await flowReady(page)
  expect(await geometry(page)).toEqual({ overlaps: [], clipped: [] })
  const problems = await page.locator('.vue-flow').evaluate(root => {
    const issues = [], nodes = [...root.querySelectorAll('.vue-flow__node')], edges = [...root.querySelectorAll('.vue-flow__edge')]
    if (edges.length !== nodes.length - 1) issues.push('Every visible non-root node must have a parent connection.')
    const near = (a, b) => Math.abs(a - b) <= 1
    for (const node of nodes) {
      if (node.querySelector('[data-resource-key^="product:"]')) continue
      const incoming = edges.filter(edge => edge.dataset.id.endsWith(`->${node.dataset.id}`))
      if (incoming.length !== 1) { issues.push('Missing parent connector'); continue }
      const edge = incoming[0], path = edge.querySelector('path.blr-flow-route'), box = node.getBoundingClientRect()
      const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM())
      if (!near(end.x, box.left + box.width / 2) || !near(end.y, box.top)) issues.push('Detached child connector')
      const parent = nodes.find(item => edge.dataset.id === `${item.dataset.id}->${node.dataset.id}`)
      if (!parent) { issues.push('Missing parent'); continue }
      const parentBox = parent.getBoundingClientRect(), start = path.getPointAtLength(0).matrixTransform(path.getScreenCTM())
      if (!near(start.x, parentBox.left + parentBox.width / 2) || !near(start.y, parentBox.bottom)) issues.push('Detached parent connector')
    }
    return issues
  })
  expect(problems).toEqual([])
}
async function checkBounds(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await expect.poll(() => page.locator('.blr-topology-link').evaluateAll(items => items.filter(item => item.checkVisibility() && parseFloat(getComputedStyle(item).fontSize) < 12).map(item => ({ title: item.textContent, size: getComputedStyle(item).fontSize })))).toEqual([])
  expect(await page.locator('.blr-report-shell').first().evaluate(item => item.clientHeight)).toBeGreaterThan(80)
}
async function selectView(page, view) {
  await page.goto(viewUrl(new URL(page.url()).origin, view))
  await expect(page.locator('.blr-report-shell')).toBeVisible()
  await expect(openTab(page)).toHaveCount(1)
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))) })
  if (view === 'what-it-keeps' && await page.locator('.blr-diagram').count()) { await flowReady(page); expect(await geometry(page)).toEqual({ overlaps: [], clipped: [] }) }
  if (view === 'sitemap') {
    await checkSitemap(page)
    if (page.viewportSize().width >= 1400) await expect.poll(() => page.locator('.vue-flow').evaluate(viewport => {
      const bounds = viewport.getBoundingClientRect()
      return [...viewport.querySelectorAll('.vue-flow__node')].filter(item => {
        if (!item.querySelector('[data-resource-key^="interface:"]')) return false
        const box = item.getBoundingClientRect()
        return box.left < bounds.left - 1 || box.right > bounds.right + 1
      }).map(item => item.textContent)
    })).toEqual([])
  }
}

try {
  for (const url of urls) {
    const report = await fetch(new URL('/_businesslens/report.json', url)).then(response => response.json())
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => failures.push(`${report.id}: ${error.message}`))
    for (const [width, height, dark] of [[1440, 1000, false], [1024, 768, true], [390, 844, false], [320, 844, true]]) {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto(viewUrl(url, 'product-map'))
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Domains')
      if ((await page.locator('html').getAttribute('class')).includes('dark') !== dark) await page.getByRole('button', { name: 'Toggle color mode' }).click()
      await page.setViewportSize({ width, height })
      for (const view of views) {
        const started = performance.now()
        await selectView(page, view)
        await checkBounds(page)
        measurements.push({ report: report.id, width, view, ms: Math.round(performance.now() - started) })
        if (view === 'value-paths' && report.model.journeys.length) {
          /* Columns align within the Journey they compose; each Journey is its
             own subgrid, so the guarantee is per section rather than global. */
          await expect.poll(() => page.locator('.blr-composition-journey').evaluateAll(sections => sections.map(section => {
            const tops = [...section.querySelectorAll('.blr-composition-column > header')].map(item => item.getBoundingClientRect().top)
            return tops.length ? Math.max(...tops) - Math.min(...tops) : 0
          }).filter(spread => spread >= 1))).toEqual([])
        }
        if (screenshotRoot && (width === 1440 || width === 390)) await page.screenshot({ path: join(screenshotRoot, `${report.id}-${width}-${view}.png`) })
      }
    }
    // Sitemap remains a connected graph through keyboard collapse, navigation and reload.
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(viewUrl(url, 'sitemap'))
    await checkSitemap(page)
    const rootNode = page.locator('.vue-flow__node:has([data-resource-key^="product:"])')
    const rootToggle = rootNode.locator('.blr-flow-node__count')
    const nodeCount = await page.locator('.vue-flow__node').count()
    if (await rootToggle.count()) {
      await rootToggle.focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('.vue-flow__node')).toHaveCount(1)
      await expect(rootToggle).toBeFocused()
      await expect(page.locator('.vue-flow__edge')).toHaveCount(0)
      await expect(page).toHaveURL(/tc=product/)
      await page.reload()
      await expect(page.locator('.vue-flow__node')).toHaveCount(1)
      await rootToggle.click()
      await expect(page.locator('.vue-flow__node')).toHaveCount(nodeCount)
      await checkSitemap(page)
      await page.locator('.vue-flow__node:has([data-resource-key^="interface:"]) .blr-flow-node__main').first().click()
      await expect(page).toHaveURL(/e=interface/)
      await page.goBack()
      await checkSitemap(page)
    }
    await rootNode.locator('.blr-flow-node__main').click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')
    await expect(page).not.toHaveURL(/[?&](?:s|e)=/)
    await page.goBack()
    await checkSitemap(page)
    const deeper = page.locator('.vue-flow__node:has([data-resource-key^="experience:"]) .blr-flow-node__count[aria-expanded="false"]').first()
    if (await deeper.count()) {
      const before = await page.locator('.vue-flow__node').count()
      await deeper.click()
      await expect.poll(() => page.locator('.vue-flow__node').count()).toBeGreaterThan(before)
      await expect(page).toHaveURL(/tx=.*(?:experience|screen)/)
      const expanded = await page.locator('.vue-flow__node').count()
      await checkSitemap(page)
      await page.reload()
      await expect(page.locator('.vue-flow__node')).toHaveCount(expanded)
      await checkSitemap(page)
    }
    // Navigation, group overrides and scroll survive a resource visit and reload.
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(viewUrl(url, 'product-map'))
    const group = page.locator('[data-group-id]').first()
    const toggle = group.getByRole('button', { name: /Expand.*items|Collapse.*items/ }).first()
    if (await toggle.count()) {
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      const link = group.locator('.blr-topology-link').first()
      await link.scrollIntoViewIfNeeded()
      const beforeScroll = await page.locator('.blr-topology-reading').evaluate(item => item.scrollTop)
      await link.click()
      await expect(page).toHaveURL(/e=/)
      await page.goBack()
      await expect(openTab(page)).toHaveText(/Map/)
      await expect(group.getByRole('button', { name: /Collapse.*items/ }).first()).toHaveAttribute('aria-expanded', 'true')
      await expect.poll(() => page.locator('.blr-topology-reading').evaluate(item => item.scrollTop)).toBeGreaterThanOrEqual(Math.max(0, beforeScroll - 4))
      await page.reload()
      await expect(group.getByRole('button', { name: /Collapse.*items/ }).first()).toHaveAttribute('aria-expanded', 'true')
    }
    // URL-selected Journey, Scenario window and matrix column remain selected.
    const journey = report.model.journeys.at(-1)
    if (journey) {
      /* Composition compares Journeys, so it draws every one of them. */
      await page.goto(viewUrl(url, 'value-paths'))
      await expect(openTab(page)).toHaveText(/Composition/)
      await expect(page.locator('.blr-composition-journey')).toHaveCount(report.model.journeys.length)
      await page.reload()
      await expect(openTab(page)).toHaveText(/Composition/)
      await expect(page.locator('.blr-composition-journey')).toHaveCount(report.model.journeys.length)
    }
    const entity = report.model.entities.find(item => item.states.length)
    if (entity) {
      await page.goto(`${url}/?s=entity&e=${encodeURIComponent(`entity:${entity.id}`)}&t=lifecycle`)
      await flowReady(page)
      expect(await geometry(page)).toEqual({ overlaps: [], clipped: [] })
      await page.reload()
      await flowReady(page)
      if (screenshotRoot) await page.screenshot({ path: join(screenshotRoot, `${report.id}-lifecycle.png`) })
    }
    // Hover changes neither geometry nor viewport; explicit pan/zoom survives Back and refresh.
    await page.goto(viewUrl(url, 'what-it-keeps'))
    await flowReady(page)
    const positions = await page.locator('.vue-flow__node').evaluateAll(items => items.map(item => item.style.cssText))
    const beforeViewport = await flowTransform(page)
    await page.locator('.vue-flow__node').first().hover()
    await page.mouse.move(0, 0)
    expect(await page.locator('.vue-flow__node').evaluateAll(items => items.map(item => item.style.cssText))).toEqual(positions)
    expect(await flowTransform(page)).toBe(beforeViewport)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await expect.poll(() => flowTransform(page)).not.toBe(beforeViewport)
    const paneBox = await page.locator('.vue-flow').boundingBox()
    await page.mouse.move(paneBox.x + 30, paneBox.y + 30)
    await page.mouse.down(); await page.mouse.move(paneBox.x + 120, paneBox.y + 90, { steps: 8 }); await page.mouse.up()
    const changed = await flowTransform(page)
    await page.locator('.vue-flow__node .blr-flow-node__main').first().click()
    await expect(page).toHaveURL(/e=entity/)
    await page.goBack(); await flowReady(page)
    await expect.poll(() => flowTransform(page)).toBe(changed)
    await page.reload(); await flowReady(page)
    await expect.poll(() => flowTransform(page)).toBe(changed)
    const zoom = await page.locator('.vue-flow__transformationpane').evaluate(item => new DOMMatrix(getComputedStyle(item).transform).a)
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect.poll(() => page.locator('.vue-flow__transformationpane').evaluate(item => new DOMMatrix(getComputedStyle(item).transform).a)).toBe(zoom)
    // A blocked worker leaves every resource and relationship readable.
    await page.route('**/*diagram.worker*', route => route.abort())
    await page.reload()
    await expect(page.getByRole('status')).toContainText('Diagram layout is unavailable', { timeout: 20000 })
    await expect(page.locator('.blr-diagram-fallback li')).toHaveCount(report.model.entities.length)
    await context.close()
  }

  // Dense overview and long unequal Scenario columns, using the same shipped renderer.
  const base = await fetch(new URL('/_businesslens/report.json', urls[0])).then(response => response.json())
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('pageerror', error => failures.push(`synthetic report: ${error.message}`))
  const stress = structuredClone(base)
  stress.id = 'topology-stress'
  const entity = stress.model.entities[0]
  for (const key of Object.keys(stress.model)) if (Array.isArray(stress.model[key])) stress.model[key] = []
  stress.model.entities = Array.from({ length: 500 }, (_, index) => ({ ...entity, id: `entity-${index}`, title: `Entity ${index} — a long readable title 資料`, states: [], relations: Array.from({ length: 4 }, (_, edge) => ({ entityId: `entity-${(index + edge + 1) % 500}`, verb: `relates ${edge}`, cardinality: 'one-to-many' })) }))
  for (const key of Object.keys(stress.counts)) stress.counts[key] = key === 'entities' ? 500 : 0
  await page.route('**/_businesslens/report.json', route => route.fulfill({ json: stress }))
  const started = performance.now()
  await page.goto(`${urls[0]}/?s=entity`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Entities')
  await expect(page.locator('.blr-resource-row')).toHaveCount(500)
  measurements.push({ report: stress.id, resources: 500, relations: 2000, ms: Math.round(performance.now() - started) })
  await page.locator('.blr-resource-row').first().click()
  await expect(page).toHaveURL(/e=entity/)
  await expect(page.locator('[data-resource-connections]')).toBeVisible()
  await expect(page.locator('[data-resource-connections]').getByRole('heading', { name: 'Incoming' })).toBeVisible()
  await expect(page.locator('[data-resource-connections]').getByRole('heading', { name: 'Outgoing' })).toBeVisible()
  await checkBounds(page)
  await page.unroute('**/_businesslens/report.json')
  const longReport = structuredClone(base)
  longReport.id = 'topology-long-scenarios'
  const journey = longReport.model.journeys[0]
  const scenario = longReport.model.journeyScenarios.find(item => item.journeyId === journey.id)
  const capabilityStep = scenario.steps.find(step => step.capabilityId)
  longReport.model.journeyScenarios = Array.from({ length: 12 }, (_, index) => ({ ...scenario,
    id: `long-scenario-${index}`, title: `Variation ${index} with a long title that remains distinguishable — 資料の順序`,
    result: index % 2 ? 'not-achieved' : 'achieved',
    steps: Array.from({ length: index + 20 }, (_, stepIndex) => ({ ...capabilityStep, text: `Step ${stepIndex + 1} retains its full explanation and exact Context, including repeated Capabilities and non-Latin text 資料の順序を確認します。` }))
  }))
  longReport.counts.journeyScenarios = 12
  for (const kind of ['interfaces', 'experiences', 'screens']) for (const [index, item] of longReport.model[kind].entries()) {
    item.title += ` — ${'A longer name 資料の順序 '.repeat(index % 3 + 1)}`
  }
  await page.route('**/_businesslens/report.json', route => route.fulfill({ json: longReport }))
  await page.goto(viewUrl(urls[0], 'sitemap'))
  await checkSitemap(page)
  // The readable mobile opening can extend beyond the canvas. Use its public
  // Fit action to reach an offscreen branch before expanding it.
  await page.getByRole('button', { name: 'Fit map to view', exact: true }).click()
  const longBranch = page.locator('.vue-flow__node:has([data-resource-key^="experience:"]) .blr-flow-node__count[aria-expanded="false"]').first()
  if (await longBranch.count()) { await longBranch.click(); await expect(page).toHaveURL(/tx=/); await checkSitemap(page) }
  await checkBounds(page)
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  const treeViewport = await flowTransform(page)
  await page.reload()
  await checkSitemap(page)
  await expect.poll(() => flowTransform(page)).toBe(treeViewport)
  await page.goto(viewUrl(urls[0], 'value-paths', '&ts=long-scenario-11'))
  /* The window holds however many columns fit; what the URL names stays inside
     it, through a move, a reload and a visit to a resource and back. */
  const owner = page.locator('.blr-composition-journey').first()
  const column = id => owner.locator(`.blr-composition-column[data-scenario-id="${id}"]`)
  await expect(column('long-scenario-11')).toBeVisible()
  await expect(column('long-scenario-11').locator('[data-occurrence-id]')).toHaveCount(31)
  await checkBounds(page)
  await owner.getByRole('button', { name: 'Previous Scenario', exact: true }).click()
  await expect(page).toHaveURL(/ts=long-scenario-10/)
  await page.reload()
  await expect(column('long-scenario-10')).toBeVisible()
  const firstStep = column('long-scenario-10').locator('.blr-composition-step .blr-topology-link').first()
  await firstStep.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/e=capability/)
  await page.goBack()
  await expect(column('long-scenario-10')).toBeVisible()
  await selectView(page, 'what-changes-what')
  const columnPicker = page.getByRole('combobox', { name: 'Matrix column' })
  if (await columnPicker.count()) {
    const last = await columnPicker.locator('option').last().getAttribute('value')
    await columnPicker.selectOption(last)
    await expect(page).toHaveURL(/tm=/)
    await page.reload()
    await expect(columnPicker).toHaveValue(last)
  }
  await page.unroute('**/_businesslens/report.json')
  const empty = structuredClone(stress)
  empty.id = 'topology-empty'
  empty.model.entities = []
  empty.counts.entities = 0
  await page.route('**/_businesslens/report.json', route => route.fulfill({ json: empty }))
  /* An address naming no destination lands on the Overview rather than guessing. */
  await page.goto(`${urls[0]}/?s=topology&tv=unknown`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')
  /* A reading naming resources an edit removed is cleared by the view that owns it. */
  await page.goto(viewUrl(urls[0], 'product-map', '&tf=entity%3Aremoved&tx=kind%3Aremoved'))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Domains')
  await expect(page).not.toHaveURL(/tf=|tx=/)
  for (const view of views) {
    await selectView(page, view)
    await checkBounds(page)
    if (view !== 'sitemap') await expect(page.locator('.vue-flow')).toHaveCount(0)
    if (view === 'sitemap') {
      await checkSitemap(page)
      await expect(page.locator('.vue-flow__node')).toHaveCount(1)
    }
  }
  await context.close()
  expect(failures).toEqual([])
  console.log(JSON.stringify({ passed: true, measurements }, null, 2))
} finally { await browser.close() }
