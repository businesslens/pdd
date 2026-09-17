#!/usr/bin/env node
/** Exercise the Coverage root, scoped details, path history and unavailable host context. */
import { chromium, expect as playwrightExpect } from '@playwright/test'

const expect = playwrightExpect.configure({ timeout: 30_000 })
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL.')
const report = await fetch(new URL('/_businesslens/report.json', origin)).then(response => response.json())
const screenshots = process.env.BLR_COVERAGE_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const browser = await chromium.launch()
const errors = []
const capture = async (page, name) => { if (screenshots) await page.screenshot({ path: join(screenshots, `${name}.png`), animations: 'disabled' }) }
const samplePath = 'coverage-fixture/selected.ts'
const deletedPath = 'coverage-fixture/deleted.ts'
const policy = { version: 'project-files-v1', includePaths: [] }
const entry = { paths: [samplePath], outcome: 'uncertain', summary: 'The selected file still needs investigation.', resources: [], exclusions: [], gaps: ['A known gap with a file.'] }
const baseline = { id: '00000000-0000-4000-8000-000000000000', startedAt: '2026-09-15T09:00:00Z', completedAt: '2026-09-15T10:00:00Z', modelDigest: 'a'.repeat(64), policy, files: [samplePath, deletedPath].map(path => ({ path, digest: 'b'.repeat(64) })), entries: [entry, { ...entry, paths: [deletedPath], outcome: 'reviewed', summary: 'A historical file reviewed before deletion.', gaps: [] }] }
const inventory = {
  paths: [samplePath, ...Array.from({ length: 40 }, (_, index) => `coverage-fixture/file-${index}.ts`)],
  coverage: { policy, baseline, pending: { ...baseline, completedAt: null, modelDigest: null }, modelChanged: true, pendingChanged: true, files: [
    { path: samplePath, change: 'modified' }, { path: deletedPath, change: 'deleted' }
  ] }
}
const annotated = structuredClone(report)
annotated.coverage.review = structuredClone(baseline)
annotated.coverage.status = 'partial'
annotated.coverage.sourceAreas = ['coverage-fixture/']
annotated.coverage.exclusions = [{ description: 'An approved exclusion with a file.', paths: [samplePath] }, { description: 'An exclusion with no location.', paths: [] }]
annotated.coverage.unmapped = [{ description: 'A known gap with a file.', paths: [samplePath] }, { description: 'A known gap with no location.', paths: [] }]
annotated.references.push({ kind: 'code', role: 'implementation', target: samplePath })
const linkedResource = annotated.model.capabilities[0]
linkedResource.references.push({ kind: 'code', role: 'implementation', target: samplePath })

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    let currentReport = annotated
    await page.route('**/_businesslens/report.json', route => route.fulfill({ json: currentReport }))
    let response = inventory
    let failInventory = false
    await page.route('**/_businesslens/repository.json*', route => failInventory
      ? route.fulfill({ status: 503, json: { message: 'Repository unavailable for this check.' } })
      : route.fulfill({ json: response }))
    await page.goto(`${origin}/?t=coverage`)
    await expect(page.locator('[data-coverage-root]')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Coverage readings' })).toHaveCount(0)
    await expect(page.locator('[data-coverage-root-indicators]')).toContainText('Model changed')
    await expect(page.locator('[data-coverage-root-indicators]')).toContainText('Review in progress · 2/2 files recorded')
    await expect(page.locator('[data-unlocated="unmapped"]')).toContainText('1')
    await expect(page.locator('[data-unlocated="exclusions"]')).toContainText('1')
    await expect(page.locator('[data-repository-tree]')).toBeVisible()
    await expect(page.locator('[data-coverage-annotations]')).toHaveCount(0)
    await expect(page.locator('[data-coverage-review]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Coverage', exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Scope', exact: true })).toHaveCount(0)
    const folder = page.getByRole('treeitem').filter({ has: page.locator('[data-repository-path="coverage-fixture"]') }).last()
    for (const kind of ['source-areas', 'exclusions', 'references', 'unmapped']) await expect(folder.locator(`[data-annotation="${kind}"]`).first()).toBeVisible()
    for (const state of ['modified', 'deleted']) await expect(folder.locator(`[data-file-state="${state}"]`).first()).toBeVisible()
    const filenameBox = await folder.locator('[data-repository-path="coverage-fixture"]').boundingBox()
    for (const badge of await folder.locator('[data-slot="link"]').first().locator('[data-annotation], [data-file-state]').all()) {
      const box = await badge.boundingBox()
      expect(Math.abs((box.y + box.height / 2) - (filenameBox.y + filenameBox.height / 2))).toBeLessThan(2)
    }
    const treeWidth = (await page.locator('[data-repository-tree]').boundingBox()).width
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
    await capture(page, `${width}-files`)

    await page.getByRole('textbox', { name: 'Find repository paths' }).fill('no-such-path')
    await expect(page.getByText(/No paths match this search/)).toBeVisible()
    await expect(page.locator('[data-coverage-root]')).toBeVisible()
    await page.locator('[data-unlocated="unmapped"]').click()
    await expect(page.getByRole('dialog').getByText('A known gap with no location.', { exact: true })).toBeInViewport()
    await page.keyboard.press('Escape')
    await page.getByRole('textbox', { name: 'Find repository paths' }).fill('')

    const pathsBeforeFolder = await page.locator('[data-repository-path]').count()
    await page.locator('[data-repository-path="coverage-fixture"]').click()
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === 'coverage-fixture')
    await expect(page.locator('[data-coverage-annotations]')).toContainText(entry.summary)
    await expect(page.locator('[data-coverage-annotations]')).toContainText('A historical file reviewed before deletion.')
    await expect(page.locator('[data-repository-path]')).toHaveCount(pathsBeforeFolder)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const pathRow = page.locator(`[data-repository-path="${samplePath}"]`)
    await pathRow.scrollIntoViewIfNeeded()
    const pane = page.locator('.blr-pane').filter({ has: page.locator('[data-repository-tree]') })
    const scrollBefore = await pane.evaluate(element => element.scrollTop)
    expect(scrollBefore).toBeGreaterThan(0)
    await pathRow.click()
    await expect(page.locator('[data-coverage-annotations]')).toBeVisible()
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === samplePath)
    await expect(page.getByRole('dialog', { name: samplePath, exact: true })).toBeVisible()
    expect((await page.locator('[data-repository-tree]').boundingBox()).width).toBe(treeWidth)
    await expect.poll(() => pane.evaluate(element => element.scrollTop)).toBe(scrollBefore)
    await expect(page.locator('[data-coverage-annotations]').getByText('A known gap with a file.', { exact: true }).first()).toBeVisible()
    await capture(page, `${width}-selected-path`)
    const selectedUrl = page.url()
    const resourceLink = page.locator('[data-coverage-annotations]').getByRole('button', { name: linkedResource.title, exact: true })
    await resourceLink.click()
    await expect(page.locator('[data-resource-panel]')).toBeVisible()
    await expect(page).toHaveURL(url => url.searchParams.get('t') === 'coverage' && url.searchParams.get('cp') === samplePath && url.searchParams.get('e') === `capability:${linkedResource.id}`)
    await page.getByRole('button', { name: 'Close resource', exact: true }).click()
    await expect(page.locator('[data-resource-panel]')).toHaveCount(0)
    await expect(page).toHaveURL(selectedUrl)
    await expect(resourceLink).toBeFocused()
    await expect.poll(() => pane.evaluate(element => element.scrollTop)).toBe(scrollBefore)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const selectedRow = page.getByRole('treeitem').filter({ has: page.locator(`[data-repository-path="${samplePath}"]`) }).last()
    await expect(selectedRow).toBeFocused()
    await expect.poll(() => pane.evaluate(element => element.scrollTop)).toBe(scrollBefore)
    await selectedRow.press('Enter')
    await expect(page.getByRole('dialog', { name: samplePath, exact: true })).toBeVisible()
    await expect(page).toHaveURL(selectedUrl)
    await page.reload()
    await expect(page.getByRole('dialog', { name: samplePath, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Close path details', exact: true }).click()
    await expect(page).not.toHaveURL(/[?&]cp=/)
    await page.goBack()
    await expect(page).toHaveURL(selectedUrl)
    await expect(page.getByRole('dialog', { name: samplePath, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const pathsBeforeRoot = await page.locator('[data-repository-path]').count()
    await page.locator('[data-coverage-root]').click()
    await expect(page.locator('[data-repository-path]')).toHaveCount(pathsBeforeRoot)
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === '.')
    await expect(page.locator('[data-coverage-details]')).toContainText('A known gap with no location.')
    await expect(page.locator('[data-coverage-details]')).toContainText('An exclusion with no location.')
    await expect(page.locator('[data-coverage-details]').getByRole('region', { name: 'Scope', exact: true })).toBeVisible()
    await expect(page.locator('[data-coverage-details]').getByRole('region', { name: 'Status', exact: true })).toBeVisible()
    await capture(page, `${width}-details`)
    await page.goBack()
    await expect(page.locator('[data-coverage-root]')).toBeVisible()
    await expect(page.locator('[data-repository-tree]')).toBeVisible()

    await page.getByRole('button', { name: 'Read repository review', exact: true }).click()
    await expect(page.locator('[data-coverage-review]')).toContainText('Inventory policy')
    await expect(page.locator('[data-coverage-review]')).toContainText('Review in progress')
    await expect(page.locator('[data-coverage-review]')).toContainText(entry.summary)
    await capture(page, `${width}-review`)
    await page.reload()
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === '.')
    await page.locator('[data-coverage-review]').getByRole('button', { name: deletedPath, exact: true }).first().click()
    await expect(page.locator('[data-coverage-root]')).toBeVisible()
    await expect(page.getByRole('dialog', { name: deletedPath, exact: true })).toBeVisible()
    await expect(page.locator('[data-coverage-annotations] [data-file-state="deleted"]')).toBeVisible()
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === deletedPath)

    response = { paths: [samplePath], coverageError: 'Review record could not be read.' }
    await page.reload()
    await expect(page.getByRole('dialog', { name: deletedPath, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Close path details', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Read repository review', exact: true }).click()
    await expect(page.locator('[data-coverage-review]')).toContainText('Review record could not be read.')
    response = { paths: [samplePath] }
    await page.getByRole('button', { name: 'Refresh review', exact: true }).click()
    await expect(page.locator('[data-coverage-review]')).toContainText('.businesslens/coverage.json')
    await expect(page.locator('[data-coverage-review]')).toContainText('A live repository comparison is needed')
    await expect(page.locator('[data-coverage-review]')).toContainText(entry.summary)
    await expect(page.getByText('The Product Model files match the completed review.', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Close path details', exact: true }).click()
    await page.locator(`[data-repository-path="${deletedPath}"]`).scrollIntoViewIfNeeded()
    await expect(page.locator(`[data-repository-path="${deletedPath}"]`)).toBeVisible()
    await expect(page.locator('[data-repository-tree] [data-file-state]')).toHaveCount(0)
    await expect(page.getByRole('combobox', { name: 'Filter file states' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Read repository review', exact: true }).click()
    response = { paths: [samplePath], coverage: { ...inventory.coverage, baseline: null, pending: null, modelChanged: null, pendingChanged: null, files: [{ path: samplePath, change: 'unreviewed' }] } }
    await page.getByRole('button', { name: 'Refresh review', exact: true }).click()
    await expect(page.locator('[data-coverage-review]')).toContainText('No completed repository review yet.')
    await expect(page.locator('[data-coverage-root-indicators]')).not.toContainText('Live comparison unavailable')
    failInventory = true
    await page.getByRole('button', { name: 'Refresh review', exact: true }).click()
    await expect(page.locator('[data-coverage-review]')).toContainText('Repository unavailable for this check.')
    await expect(page.locator('[data-coverage-details]')).toContainText('A known gap with no location.')
    await page.locator('[data-coverage-details]').getByRole('button', { name: samplePath, exact: true }).first().click()
    await expect(page.locator('[data-coverage-annotations]')).toContainText('A known gap with a file.')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    // A planned or portable model has meaningful root context even with no paths.
    currentReport = structuredClone(annotated)
    function clearReferences(value) {
      if (!value || typeof value !== 'object') return
      for (const [key, child] of Object.entries(value)) {
        if (key === 'references') value[key] = []
        else clearReferences(child)
      }
    }
    clearReferences(currentReport)
    currentReport.coverage.review = null
    currentReport.coverage.sourceAreas = []
    for (const area of [...currentReport.coverage.exclusions, ...currentReport.coverage.unmapped]) area.paths = []
    response = { paths: [] }
    failInventory = false
    await page.goto(`${origin}/?t=coverage`)
    await expect(page.getByText(/No paths to show/)).toBeVisible()
    await expect(page.getByRole('treeitem')).toHaveCount(1)
    await page.locator('[data-coverage-root]').click()
    await expect(page.locator('[data-coverage-details]')).toContainText('A known gap with no location.')
    await expect(page.locator('[data-coverage-review]')).toContainText('No completed review is saved in this model.')
    await capture(page, `${width}-no-paths`)
    await context.close()
  }
  expect(errors).toEqual([])
  console.log('Coverage root, single-line badges, slideover selection/dismissal/focus/history, mobile layout, historical paths, and host failures passed.')
} finally { await browser.close() }
