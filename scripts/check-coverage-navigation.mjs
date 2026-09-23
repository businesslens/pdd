#!/usr/bin/env node
/** Exercise Coverage disclosure, recorded locations, filters, search and portable models. */
import { chromium, expect as playwrightExpect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const expect = playwrightExpect.configure({ timeout: 30_000 })
const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL.')
const report = await fetch(new URL('/_businesslens/report.json', origin)).then(response => response.json())
const screenshots = process.env.BLR_COVERAGE_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const browser = await chromium.launch()
const errors = []
const capture = async (page, name) => { if (screenshots) await page.screenshot({ path: join(screenshots, `${name}.png`), animations: 'disabled' }) }
const samplePath = 'coverage-fixture/selected.ts'
const plannedPath = 'coverage-fixture/nested/planned.ts'
const annotated = structuredClone(report)
annotated.coverage.scope = 'Shopping, checkout and customer refunds.'
annotated.coverage.method = 'Static source inspection.'
annotated.coverage.limitations = [{ description: 'Model-wide policy uncertainty.', paths: [] }, { description: 'Local retry policy could not be established.', paths: [samplePath] }, { description: 'A limitation with its own location.', paths: ['coverage-fixture/uncertain.ts'] }]
annotated.coverage.covered = [{ description: 'Shopping behavior.', paths: ['coverage-fixture/'] }, { description: 'Fulfillment behavior.', paths: ['coverage-fixture/nested/'] }, { description: 'Selected behavior.', paths: [samplePath] }, { description: 'Planned behavior with no location.', paths: [] }]
annotated.coverage.exclusions = [{ description: 'An approved exclusion with a file.', paths: [samplePath, 'coverage-fixture/help/guide.md'] }, { description: 'An exclusion with no location.', paths: [] }]
annotated.coverage.unmapped = [{ description: 'A known gap with a file.', paths: [samplePath] }, { description: 'Another gap at the same location.', paths: [samplePath] }, { description: 'A known gap with no location.', paths: [] }, { description: 'Planned behavior without a current file.', paths: [plannedPath] }]
annotated.references.push({ kind: 'code', role: 'implementation', target: samplePath })
const linkedResource = annotated.model.capabilities[0]
linkedResource.references.push({ kind: 'code', role: 'implementation', target: samplePath })

try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    let currentReport = annotated
    let inventoryRequests = 0
    const comparisonRequests = []
    page.on('request', request => {
      if (/\/_businesslens\/(history|review|state)(?:[/?]|$)/.test(request.url())) comparisonRequests.push(request.url())
    })
    await page.route('**/_businesslens/report.json', route => route.fulfill({ json: currentReport }))
    await page.route('**/_businesslens/repository.json*', route => {
      inventoryRequests++
      return route.fulfill({ status: 503, json: { message: 'No repository access.' } })
    })
    await page.goto(`${origin}/?t=coverage`)
    const coverage = page.locator('[data-product-coverage]')
    const details = coverage.locator('[data-coverage-details]')
    const sources = coverage.locator('[data-coverage-sources]')
    const methodDetails = coverage.locator('[data-coverage-method]')
    const panel = sources.locator('[data-coverage-summary-panel]')
    await expect(details).toBeVisible()
    await expect(page.getByRole('button', { name: /^(Review|Show diff|Compare versions)/ })).toHaveCount(0)
    await expect(sources).toBeVisible()
    await expect(coverage.getByRole('tab')).toHaveCount(0)
    // One summary panel: Scope, then Method read rather than disclosed, then the categories.
    await expect(panel.locator('[data-coverage-details]')).toBeVisible()
    await expect(panel.locator('[data-coverage-summary]')).toHaveCount(4)
    await expect(details.getByRole('region', { name: 'Scope', exact: true })).toContainText('Shopping, checkout and customer refunds.')
    await expect(coverage.getByRole('heading', { name: 'Model scope', exact: true })).toHaveCount(0)
    await expect(coverage.getByRole('heading', { name: 'Recorded locations', exact: true })).toHaveCount(0)
    await expect(coverage.getByRole('button', { name: 'How this model was authored', exact: true })).toHaveCount(0)
    await expect(details.getByRole('region', { name: 'Status', exact: true })).toHaveCount(0)
    await expect(page.locator('[data-report-status]')).not.toContainText(/Coverage:|draft|partial|complete/i)
    await expect(methodDetails).toContainText('Static source inspection.')
    // Coverage never opens a panel: every statement is written where it is recorded.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await capture(page, `${width}-summary`)
    // Model-wide Limitations have no section of their own; they are unlocated statements.
    await expect(details.getByRole('region', { name: 'Model-wide limitations', exact: true })).toHaveCount(0)
    await expect(details).not.toContainText('Model-wide policy uncertainty.')
    await expect(sources).toBeVisible()
    const search = sources.getByRole('textbox', { name: 'Find recorded paths' })
    const summary = kind => sources.locator(`[data-coverage-summary="${kind}"]`)
    const path = value => sources.locator(`[data-repository-path="${value}"]`)
    const row = value => path(value).locator('xpath=ancestor::li[1]')
    const statementsAt = value => row(value).locator('> ul > li > [data-coverage-statement]')
    const chooseFilter = async label => {
      const active = sources.locator('[data-coverage-summary][aria-pressed="true"]')
      if (label === 'All categories') { if (await active.count()) await active.click() }
      else {
        const card = summary(label.toLowerCase())
        if (await card.getAttribute('aria-pressed') !== 'true') await card.click()
      }
    }
    await expect(search).toBeVisible()
    await expect(sources.getByRole('combobox')).toHaveCount(0)

    // Four cards, Limitations among them, counting whole authored statements.
    await expect(sources.locator('[data-coverage-summary]')).toHaveCount(4)
    for (const [kind, count] of [['covered', 4], ['exclusions', 2], ['unmapped', 4], ['limitations', 3]]) {
      await expect(summary(kind).locator('[data-coverage-summary-count]')).toHaveText(String(count))
      await expect(summary(kind)).toHaveAttribute('aria-pressed', 'false')
    }
    await expect(sources.getByRole('region', { name: 'No location recorded', exact: true }).locator('[data-coverage-entry]')).toHaveCount(4)

    // An explanation is asked for. Folders open; their prose does not come with them.
    await expect(sources.locator('[data-repository-tree] [data-coverage-statement]')).toHaveCount(0)
    await expect(path('coverage-fixture')).toBeVisible()
    await expect(path(samplePath)).toBeVisible()
    await capture(page, `${width}-collapsed`)
    const reveal = value => row(value).locator('> div [data-coverage-reveal]')
    // Unlocated statements have no row to hide behind, so scope to the tree.
    const inTree = sources.locator('[data-repository-tree] [data-coverage-statement]')
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'false')
    // Counts where the set is many; one mark already says there is one.
    await expect(reveal(samplePath)).toContainText('5')
    await expect(reveal('coverage-fixture')).not.toContainText(/\d/)
    await expect(reveal('coverage-fixture')).toHaveAttribute('aria-label', 'Read 1 statement recorded at coverage-fixture')
    // A folder that only holds recorded paths has nothing of its own to disclose.
    await expect(reveal('coverage-fixture/help')).toHaveCount(0)
    // A closed folder says what is inside it, so it is never a dead end.
    const inside = value => row(value).locator('> div [data-coverage-inside]')
    // An open folder shows its contents, so it claims nothing about them.
    await expect(inside('coverage-fixture')).toHaveCount(0)
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await expect(inside('coverage-fixture')).toBeVisible()
    await expect(inside('coverage-fixture').locator('[data-coverage-kind-inside]')).toHaveCount(4)
    // The way in expands the folder; it never reads anything.
    await inside('coverage-fixture').click()
    await expect(inside('coverage-fixture')).toHaveCount(0)
    await expect(inTree).toHaveCount(0)
    await expect(path('coverage-fixture/help')).toBeVisible()
    // One claim recorded at several paths below still counts once.
    await expect(inside('coverage-fixture/help')).toContainText('1 inside')
    await inside('coverage-fixture/help').click()
    await expect(path('coverage-fixture/help/guide.md')).toBeVisible()
    await expect(inTree).toHaveCount(0)
    // One control per row: the path is only a larger pointer target for it.
    await expect(row(samplePath).locator('> div button')).toHaveCount(1)
    // A row's own marks are the way to read it: the icons open it too.
    await row(samplePath).locator('[data-coverage-kind="covered"]').click()
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'true')
    await expect(statementsAt(samplePath)).toHaveCount(5)
    await reveal(samplePath).click()
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'false')
    await reveal(samplePath).click()
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'true')
    await expect(statementsAt(samplePath)).toHaveCount(5)
    await expect(inTree).toHaveCount(5)
    await capture(page, `${width}-one-open`)
    await path(samplePath).click()
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'false')
    await expect(inTree).toHaveCount(0)

    await sources.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(path(samplePath)).toHaveCount(1)
    await expect(reveal(samplePath)).toHaveAttribute('aria-expanded', 'true')

    // A row shows what is recorded at that exact path, and nothing from beneath it.
    await expect(statementsAt(samplePath)).toHaveCount(5)
    await expect(row(samplePath).locator('[data-coverage-kind="covered"]')).toHaveCount(1)
    await expect(row(samplePath).locator('[data-coverage-kind="exclusions"]')).toHaveCount(1)
    await expect(row(samplePath).locator('[data-coverage-kind="unmapped"]')).toHaveCount(1)
    await expect(row(samplePath).locator('[data-coverage-kind="limitations"]')).toHaveCount(1)
    for (const text of ['Selected behavior.', 'A known gap with a file.', 'Another gap at the same location.', 'An approved exclusion with a file.', 'Local retry policy could not be established.']) {
      await expect(statementsAt(samplePath).filter({ hasText: text })).toHaveCount(1)
    }
    // Model References belong to the Overview's References reading, never to Coverage.
    await expect(sources).not.toContainText(linkedResource.title)
    await expect(sources.getByRole('button', { name: linkedResource.title, exact: true })).toHaveCount(0)
    // A folder never inherits or totals what sits beneath it.
    await expect(statementsAt('coverage-fixture')).toHaveCount(1)
    await expect(statementsAt('coverage-fixture')).toContainText('Shopping behavior.')
    await expect(row('coverage-fixture').locator('> div [data-coverage-kind]')).toHaveCount(1)
    // A statement recorded elsewhere too lists its other locations.
    await expect(statementsAt(samplePath).filter({ hasText: 'An approved exclusion with a file.' }))
      .toContainText('coverage-fixture/help/guide.md')
    await capture(page, `${width}-sources`)

    // Cards are the sole category filter and narrow paths and unlocated statements alike.
    await chooseFilter('Exclusions')
    await expect(summary('exclusions')).toHaveAttribute('aria-pressed', 'true')
    await expect(path(plannedPath)).toHaveCount(0)
    await expect(path(samplePath)).toBeVisible()
    await expect(statementsAt(samplePath)).toHaveCount(1)
    await expect(sources.locator('[data-coverage-entry]')).toHaveCount(1)
    await expect(sources.locator('[data-coverage-entry]')).toContainText('An exclusion with no location.')
    await expect(summary('exclusions').locator('[data-coverage-summary-count]')).toHaveText('2')
    await capture(page, `${width}-active-summary`)
    await chooseFilter('Limitations')
    await expect(summary('limitations')).toHaveAttribute('aria-pressed', 'true')
    await expect(summary('exclusions')).toHaveAttribute('aria-pressed', 'false')
    await sources.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(path('coverage-fixture/uncertain.ts')).toBeVisible()
    await expect(sources.locator('[data-coverage-entry]')).toContainText('Model-wide policy uncertainty.')
    await chooseFilter('Unmapped')
    await sources.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(path(plannedPath)).toBeVisible()
    await expect(path('coverage-fixture/help/guide.md')).toHaveCount(0)
    await chooseFilter('All categories')
    await summary('covered').focus()
    await page.keyboard.press('Space')
    await expect(summary('covered')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Space')
    await expect(summary('covered')).toHaveAttribute('aria-pressed', 'false')

    // Search finds recorded paths, as a file finder would, and never prose.
    await search.fill('planned.ts')
    await expect(path(plannedPath)).toBeVisible()
    await expect(path(samplePath)).toHaveCount(0)
    await search.fill('Another gap at the same location')
    await expect(sources.locator('[data-repository-path]')).toHaveCount(0)
    await expect(sources.getByRole('region', { name: 'No location recorded', exact: true })).toHaveCount(0)
    // A statement also recorded elsewhere never drags its other paths along.
    await search.fill('')
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await search.fill('selected')
    await expect(path(samplePath)).toBeVisible()
    await expect(path('coverage-fixture/help/guide.md')).toHaveCount(0)
    await expect(path(plannedPath)).toHaveCount(0)
    // A matched path's explanation still waits to be asked for, and names every location.
    await expect(statementsAt(samplePath)).toHaveCount(0)
    await reveal(samplePath).click()
    await expect(statementsAt(samplePath)).toHaveCount(5)
    await expect(statementsAt(samplePath).filter({ hasText: 'An approved exclusion with a file.' })).toContainText('coverage-fixture/help/guide.md')
    await reveal(samplePath).click()
    await expect(statementsAt(samplePath)).toHaveCount(0)
    // A search opens the folders above what it matched, even after Collapse all,
    // and clearing it restores what the reader had open.
    await search.fill('')
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await expect(path(plannedPath)).toHaveCount(0)
    await search.fill('nested/planned')
    await expect(path(plannedPath)).toBeVisible()
    await expect(statementsAt(plannedPath)).toHaveCount(0)
    await search.fill('')
    await expect(path(plannedPath)).toHaveCount(0)
    // What a filter hides keeps its own state: a toggle under a filter never
    // closes the folders the filter set aside.
    await sources.getByRole('button', { name: 'Expand all', exact: true }).click()
    await expect(path('coverage-fixture/help/guide.md')).toBeVisible()
    await summary('unmapped').click()
    await expect(path('coverage-fixture/help/guide.md')).toHaveCount(0)
    await reveal(samplePath).click()
    await summary('unmapped').click()
    await expect(path('coverage-fixture/help/guide.md')).toBeVisible()
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await search.fill('planned.ts')
    await summary('exclusions').click()
    await expect(search).toHaveValue('planned.ts')
    await expect(path(plannedPath)).toHaveCount(0)
    await expect(summary('exclusions').locator('[data-coverage-summary-count]')).toHaveText('2')
    await summary('exclusions').click()
    await expect(path(plannedPath)).toBeVisible()
    await expect(search).toHaveValue('planned.ts')
    await search.fill('no-such-recorded-path')
    await expect(sources.getByText('No recorded path matches this search.', { exact: true })).toBeVisible()
    await search.fill('')

    // Expansion, and a focused location as a deep link rather than a panel.
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await expect(path(samplePath)).toHaveCount(0)
    await expect(inTree).toHaveCount(0)
    await sources.getByRole('button', { name: `Expand coverage-fixture`, exact: true }).click()
    await expect(sources.getByRole('button', { name: `Collapse coverage-fixture`, exact: true })).toHaveAttribute('aria-expanded', 'true')
    await path(samplePath).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(url => url.searchParams.get('cp') === samplePath)
    await expect(path(samplePath)).toHaveAttribute('aria-current', 'true')
    await expect(statementsAt(samplePath)).toHaveCount(5)
    const selectedUrl = page.url()
    await page.reload()
    await expect(path(samplePath)).toHaveAttribute('aria-current', 'true')
    // A deep link opens the explanation it names, not merely the path.
    await expect(statementsAt(samplePath)).toHaveCount(5)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await path(samplePath).click()
    await expect(page).not.toHaveURL(/[?&]cp=/)
    await expect(statementsAt(samplePath)).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(selectedUrl)
    await expect(path(samplePath)).toHaveAttribute('aria-current', 'true')
    // A shared link opens what it names with nothing remembered in this tab.
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await page.evaluate(() => sessionStorage.clear())
    await page.goto(selectedUrl)
    await expect(path(samplePath)).toHaveAttribute('aria-current', 'true')
    await expect(statementsAt(samplePath)).toHaveCount(5)
    // A link may spell a folder as authored, with its trailing slash.
    await page.goto(`${origin}/?t=coverage&cp=${encodeURIComponent('coverage-fixture/')}`)
    await expect(path('coverage-fixture')).toHaveAttribute('aria-current', 'true')
    await expect(statementsAt('coverage-fixture')).toHaveCount(1)
    await page.goto(selectedUrl)
    await capture(page, `${width}-focused-path`)

    // Remembered expansion, with no deep link asking for anything.
    await path(samplePath).click()
    await expect(page).not.toHaveURL(/[?&]cp=/)
    await sources.getByRole('button', { name: 'Collapse all', exact: true }).click()
    await expect(path(samplePath)).toHaveCount(0)
    await page.reload()
    await expect(sources).toBeVisible()
    await expect(path(samplePath)).toHaveCount(0)

    currentReport = structuredClone(annotated)
    for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations']) for (const area of currentReport.coverage[kind]) area.paths = []
    await page.goto(`${origin}/?t=coverage`)
    await expect(sources.locator('[data-repository-path]')).toHaveCount(0)
    await expect(sources.getByText('No repository paths recorded.', { exact: true })).toBeVisible()
    await expect(sources).toContainText('A known gap with no location.')
    await capture(page, `${width}-no-paths`)
    currentReport = structuredClone(currentReport)
    for (const key of ['covered', 'exclusions', 'unmapped', 'limitations']) currentReport.coverage[key] = []
    currentReport.coverage.method = ''
    await page.reload()
    await expect(details.getByRole('region', { name: 'Status', exact: true })).toHaveCount(0)
    await expect(page.locator('[data-report-status]')).not.toContainText(/Coverage:|draft|partial|complete/i)
    for (const kind of ['covered', 'exclusions', 'unmapped', 'limitations']) await expect(summary(kind).locator('[data-coverage-summary-count]')).toHaveText('0')
    await summary('unmapped').click()
    await expect(summary('unmapped')).toHaveAttribute('aria-pressed', 'true')
    await expect(sources.getByText('No recorded locations in this category.', { exact: true })).toBeVisible()
    await summary('unmapped').click()
    // An empty Method is not recorded, so it has no field.
    await expect(methodDetails).toHaveCount(0)
    await expect(details.getByRole('region', { name: 'Model-wide limitations', exact: true })).toHaveCount(0)
    expect(inventoryRequests).toBe(0)

    currentReport = report
    await page.goto(`${origin}/?t=coverage`)
    await expect(details).toBeVisible()
    await expect(sources.locator('[data-repository-tree]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
    await capture(page, `${width}-actual-summary`)
    await sources.getByRole('button', { name: 'Expand all', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
    await capture(page, `${width}-actual-sources`)
    expect(comparisonRequests).toEqual([])
    await context.close()
  }
  expect(errors).toEqual([])
  console.log('One Coverage summary of scope, method and four category cards, per-row explanations closed until asked for, closed folders naming what is inside them, statements at exact paths, filters, path search, expansion over both axes, focused-location deep links, mobile layout and portable/empty states passed; no path panel, no comparison controls or requests.')
} finally { await browser.close() }
