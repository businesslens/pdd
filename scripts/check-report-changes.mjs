#!/usr/bin/env node
/** Exercise live comparisons in the built viewer against an isolated repository. */
import { chromium, expect } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

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
  run('git', ['init', '--quiet'])
  run('git', ['add', '.'])
  const commit = message => run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '--quiet', '-am', message])
  commit('Original model')
  run(process.execPath, [cli, 'checkpoint', label])
  edit('product/product.md', '# Fixture Shop', '# Updated Fixture Shop')
  commit('Rename the product')
  edit('capabilities/browse-catalog/scenarios/browse-catalog.md', 'The shopper sees product details', 'The shopper sees current product details')
  edit('journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md', 'a confirmed order exists', 'a confirmed and paid order exists')

  // Start with no model, then restore its committed files. No new commit or
  // checkpoint event can rescue a missing baseline list.
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
  await expect(page.locator('[data-baseline-control]')).toContainText('Last commit')
  await expect(page.locator('[data-changes-summary]')).toHaveText('2 changed')
  await expect(page.locator('[data-changes-no-baseline]')).toHaveCount(0)
  console.log('Passed: waiting, changing startup errors, recovery, and baselines on first model binding.')

  cpSync(join(savedModel, 'cache'), join(model, 'cache'), { recursive: true })
  await expect(page.locator('[data-baseline-control]')).toContainText(label)
  await expect(page.locator('[data-changes-summary]')).toHaveText('2 changed · Product changed')

  // Hold an old comparison until a different baseline has already rendered.
  // Both stale successes and stale failures must leave that reading intact.
  for (const fail of [false, true]) {
    let release
    const gate = new Promise(resolve => { release = resolve })
    let held
    const intercepted = new Promise(resolve => { held = resolve })
    const pattern = '**/_businesslens/changes/diff?base=head'
    await page.route(pattern, async route => {
      const response = await route.fetch()
      held()
      await gate
      await route.fulfill(fail
        ? { status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'An obsolete comparison failed.' }) }
        : { response })
    })
    try {
      await page.locator('[data-baseline-control]').click()
      await page.getByRole('option', { name: /Last commit/ }).click()
      await intercepted
      // Old results must disappear as soon as their baseline is deselected.
      await expect(page.locator('[data-changes-product]')).toHaveCount(0)
      await page.locator('[data-baseline-control]').click()
      await page.getByRole('option', { name: new RegExp(label) }).click()
      await expect(page.locator('[data-changes-summary]')).toHaveText('2 changed · Product changed')
      const finished = page.waitForEvent('requestfinished', request => request.url().endsWith('/changes/diff?base=head'))
      release()
      await finished
      await paint(page)
      await expect(page.locator('[data-baseline-control]')).toContainText(label)
      await expect(page.locator('[data-changes-summary]')).toHaveText('2 changed · Product changed')
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
    await page.goto(origin + '/?s=changes&e=capability-scenario:browse-catalog')
    const panel = page.locator('[data-resource-panel]')
    const heading = panel.locator('[data-resource-heading]')
    const mark = panel.locator(':scope > header [data-change-mark]')
    await expect(heading).toHaveText('Browse the catalog')
    await expect(mark).toHaveAttribute('title', `Changed since ${label}`)
    await page.evaluate(() => document.fonts.ready)
    await paint(page)
    expect(await heading.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(100)
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await expect(panel.getByRole('button', { name: 'Close resource', exact: true })).toBeInViewport()
    if (screenshots) await page.screenshot({ path: join(screenshots, `${width}-changed-resource.png`), animations: 'disabled' })
    console.log(`Passed ${width}px: long checkpoint label fits, title stays readable, and Close remains visible.`)
  }
  expect(errors).toEqual([])
} finally {
  await browser?.close()
  if (viewer && viewer.exitCode === null) {
    viewer.kill('SIGTERM')
    await new Promise(resolve => viewer.once('exit', resolve))
  }
  rmSync(scratch, { recursive: true, force: true })
}
