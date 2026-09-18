#!/usr/bin/env node
/** Exercise live comparisons in the built viewer against an isolated repository. */
import { chromium, expect as playwrightExpect } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const expect = playwrightExpect.configure({ timeout: 30_000 })
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = mkdtempSync(join(tmpdir(), 'blr-changes-browser-'))
const project = join(scratch, 'project')
const model = join(project, '.businesslens')
const cli = join(repository, 'dist/cli.js')
const label = 'Mapped catalog availability and checkout completion scenarios across all supported interfaces'
let viewer
let browser

function run(command, args) {
  const result = spawnSync(command, args, { cwd: project, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
}

function edit(path, before, after) {
  const file = join(model, path)
  const contents = readFileSync(file, 'utf8')
  if (!contents.includes(before)) throw new Error(`Missing fixture text in ${path}: ${before}`)
  writeFileSync(file, contents.replace(before, after))
}

const paint = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

try {
  cpSync(join(repository, 'test/fixtures/fixture-shop'), project, {
    recursive: true, filter: path => !/\.businesslens\/(build|cache)(\/|$)/.test(path)
  })
  run('git', ['init', '--quiet', '--initial-branch=main'])
  writeFileSync(join(project, 'implementation.txt'), 'Original implementation\n')
  run('git', ['add', '.'])
  const commit = message => run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '--quiet', '-am', message])
  commit(label)
  const first = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).stdout.trim()
  edit('product/product.md', '# Fixture Shop', '# Updated Fixture Shop')
  commit('Rename the product')
  edit('capabilities/browse-catalog/scenarios/browse-catalog.md', 'The shopper sees product details', 'The shopper sees current product details')
  edit('journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md', 'a confirmed order exists', 'a confirmed and paid order exists')

  writeFileSync(join(project, 'implementation.txt'), 'Working implementation\n')

  // Recover from startup errors without a new Git event to refresh states.
  const savedModel = join(scratch, 'saved-model')
  renameSync(model, savedModel)
  viewer = spawn(process.execPath, [cli, 'view', '--no-open'], { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  viewer.stdout.on('data', data => { log += data })
  viewer.stderr.on('data', data => { log += data })
  let origin
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = /Viewing the local Product Model at (http:\/\/127\.0\.0\.1:\d+)/.exec(log)?.[1]
    if (origin) break
    if (viewer.exitCode !== null) throw new Error(log)
    await delay(100)
  }
  if (!origin) throw new Error(`Viewer did not start: ${log}`)

  browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin)
  await expect(page.locator('body')).toContainText('No Product Model yet.')
  await expect(page.locator('[data-review-repository]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Base', exact: true })).toContainText('Last commit')
  await page.locator('[data-repository-path="implementation.txt"]').click()
  await expect(page.locator('[data-file-side="Base"]')).toContainText('Original implementation')
  await expect(page.locator('[data-file-side="Compare to"]')).toContainText('Working implementation')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-review-file-details]')).toHaveCount(0)
  console.log('Passed: Git Review compares files before the working model exists.')
  mkdirSync(join(model, 'product'), { recursive: true })
  const invalidProduct = marker => writeFileSync(join(model, 'product/product.md'), `---\n${marker}: true\n---\n# Draft\n`)
  invalidProduct('firstStartupError')
  await expect(page.locator('body')).toContainText('firstStartupError')
  invalidProduct('secondStartupError')
  await expect(page.locator('body')).toContainText('secondStartupError')
  await expect(page.locator('body')).not.toContainText('firstStartupError')
  cpSync(savedModel, model, { recursive: true, filter: path => path !== join(savedModel, 'cache') })
  await expect(page.locator('[data-businesslens-report-viewer]')).toBeVisible()
  await page.locator('[data-header-changes]').click()
  await expect(page.getByRole('button', { name: 'Base', exact: true })).toContainText('Last commit')
  await expect(page.getByRole('heading', { name: /^Review 3 files/ })).toBeVisible()
  await expect(page.locator('[data-changes-no-baseline]')).toHaveCount(0)
  console.log('Passed: waiting, changing startup errors, recovery, and baselines on first model binding.')

  const chooseBase = async id => {
    await page.getByRole('button', { name: 'Base', exact: true }).click()
    await page.getByRole('tab', { name: 'Commits', exact: true }).click()
    await page.locator(`[data-history-state="${id}"]`).click()
  }
  await chooseBase(`commit:${first}`)
  await expect(page.getByRole('button', { name: 'Base', exact: true })).toContainText(label)
  await expect(page.getByRole('heading', { name: /^Review 4 files/ })).toBeVisible()

  // Model files are reviewed once, through the same tree and file panel as source.
  await expect(page.locator('[data-model-changes], [data-changes-summary]')).toHaveCount(0)
  await expect(page.locator('[data-repository-tree]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Expand all', exact: true }).click()
  const productPath = page.locator('[data-repository-path=".businesslens/product/product.md"]')
  await expect(productPath).toHaveCount(1)
  await productPath.click()
  await expect(page.locator('[data-file-side="Base"]')).toContainText('# Fixture Shop')
  await expect(page.locator('[data-file-side="Compare to"]')).toContainText('# Updated Fixture Shop')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-review-file-details]')).toHaveCount(0)
  console.log('Passed: one changed-file tree, with raw model diffs and no duplicate model summary.')

  // Hold an old comparison until a different baseline has already rendered.
  // Both stale successes and stale failures must leave that reading intact.
  for (const fail of [false, true]) {
    let release
    const gate = new Promise(resolve => { release = resolve })
    let held
    const intercepted = new Promise(resolve => { held = resolve })
    const pattern = '**/_businesslens/history/diff?base=head&target=working'
    await page.route(pattern, async route => {
      const response = await route.fetch()
      held()
      await gate
      await route.fulfill(fail
        ? { status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'An obsolete comparison failed.' }) }
        : { response })
    })
    try {
      await chooseBase('head')
      await intercepted
      // Old results must disappear as soon as their baseline is deselected.
      await expect(page.locator('[data-review-repository]')).toHaveCount(0)
      await chooseBase(`commit:${first}`)
      await expect(page.getByRole('heading', { name: /^Review 4 files/ })).toBeVisible()
      const finished = page.waitForEvent('requestfinished', request => request.url().endsWith('/history/diff?base=head&target=working'))
      release()
      await finished
      await paint(page)
      await expect(page.getByRole('button', { name: 'Base', exact: true })).toContainText(label)
      await expect(page.getByRole('heading', { name: /^Review 4 files/ })).toBeVisible()
      await expect(page.locator('body')).not.toContainText('An obsolete comparison failed.')
    } finally {
      release()
      await page.unroute(pattern)
    }
  }
  console.log('Passed: late comparison responses and failures cannot overwrite the chosen baseline.')

  // A Scenario-only edit leaves its parent unchanged, but the card still
  // shows its own standing. Both Capability and Journey readings use the map.
  for (const [kind, parent, scenario] of [
    ['capability', 'browse-catalog', 'browse-catalog'],
    ['journey', 'browse-and-buy', 'browse-and-complete-checkout']
  ]) {
    await page.goto(`${origin}/?s=${kind}&e=${kind}:${parent}&rt=scenarios`)
    const row = page.locator(`[data-row-key="${kind}-scenario:${scenario}"]`)
    await expect(row.locator('[data-change-mark]')).toHaveText('Changed')
    await expect(page.locator('[data-resource-panel] > header [data-change-mark]')).toHaveCount(0)
    await row.locator('.blr-summary-toggle').click()
    await expect(row.locator('[data-change-mark]')).toHaveText('Changed')
  }
  console.log('Passed: changed Capability and Journey Scenario cards are marked without marking their parents.')

  const screenshots = process.env.BLR_NAV_SCREENSHOTS
  if (screenshots) mkdirSync(screenshots, { recursive: true })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${origin}/?s=review&base=commit:${first}&target=working&e=capability-scenario:browse-catalog`)
    const panel = page.locator('[data-resource-panel]')
    const heading = panel.locator('[data-resource-heading]')
    const mark = panel.locator(':scope > header [data-change-mark]')
    await expect(heading).toHaveText('Browse the catalog')
    await expect(mark).toHaveAttribute('title', `Changed since ${first.slice(0, 7)} ${label}`)
    await page.evaluate(() => document.fonts.ready)
    await paint(page)
    expect(await heading.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(100)
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await expect(panel.getByRole('button', { name: 'Close resource', exact: true })).toBeInViewport()
    if (screenshots) await page.screenshot({ path: join(screenshots, `${width}-changed-resource.png`), animations: 'disabled' })
    console.log(`Passed ${width}px: long commit title fits, title stays readable, and Close remains visible.`)
  }
  // Unreferenced source files participate in the same comparison and keep
  // their own address without claiming a Product Model change.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${origin}/?s=review&base=head&target=working`)
  await page.locator('[data-repository-path="implementation.txt"]').click()
  await expect(page.locator('[data-file-side="Base"]')).toHaveText('Original implementation')
  await expect(page.locator('[data-file-side="Compare to"]')).toHaveText('Working implementation')
  await expect(page.locator('[data-review-file-details]')).toContainText('No model references recorded for this location.')
  await expect(page).toHaveURL(/rp=implementation.txt/)
  await page.reload()
  await expect(page.locator('[data-file-side="Compare to"]')).toHaveText('Working implementation')
  writeFileSync(join(project, 'implementation.txt'), 'Updated while reviewing\n')
  await expect(page.locator('[data-file-side="Compare to"]')).toHaveText('Updated while reviewing', { timeout: 15_000 })
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-review-file-details]')).toHaveCount(0)
  await page.goBack()
  await expect(page.locator('[data-file-side="Compare to"]')).toHaveText('Updated while reviewing')
  await page.screenshot({ path: '/tmp/businesslens-review-file-desktop.png', animations: 'disabled' })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('[data-file-side="Base"]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (screenshots) await page.screenshot({ path: join(screenshots, `${width}-source-review.png`), animations: 'disabled' })
  }
  console.log('Passed: unreferenced source contents, direct address, reload, Back, live source-only updates, and mobile.')
  expect(errors).toEqual([])
} finally {
  await browser?.close()
  if (viewer && viewer.exitCode === null) {
    viewer.kill('SIGTERM')
    await new Promise(resolve => viewer.once('exit', resolve))
  }
  rmSync(scratch, { recursive: true, force: true })
}
