#!/usr/bin/env node
/** Rendered Review regression against disposable Git snapshots. Run after npm run build. */
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import { chromium, expect as playwrightExpect } from '@playwright/test'

const expect = playwrightExpect.configure({ timeout: 30_000 })
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = mkdtempSync(join(tmpdir(), 'bl-resource-review-'))
const cli = join(repo, 'dist/cli.js')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
const modelPath = path => `.businesslens/${path}`
const read = path => readFileSync(join(root, modelPath(path)), 'utf8')
const write = (path, content) => writeFileSync(join(root, modelPath(path)), content)
function editFrontmatter(path, edit) {
  const [, yaml, body] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(read(path))
  const value = parse(yaml)
  edit(value)
  write(path, `---\n${stringify(value)}---\n${body}`)
}
const paths = [
  'product/product.md', 'domains/ordering.md', 'entities/order.md', 'interfaces/customer-web/interface.md',
  'interfaces/customer-web/experiences/storefront/experience.md', 'interfaces/customer-web/experiences/storefront/screens/product-record.md',
  'capabilities/place-order/capability.md', 'capabilities/place-order/scenarios/complete-checkout.md',
  'journeys/browse-and-buy/journey.md', 'journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md',
  'business-rules/who-may-change-an-order.md', 'coverage.md'
]
let viewer, browser
const errors = []
try {
  cpSync(join(repo, 'test/fixtures/fixture-shop'), root, { recursive: true })
  git('init', '--initial-branch=main')
  git('config', 'user.name', 'Resource review test')
  git('config', 'user.email', 'review@businesslens.local')
  writeFileSync(join(root, 'review-guide.md'), '# Earlier guide\n')
  editFrontmatter('entities/order.md', value => { value.references = [{ kind: 'doc', role: 'context', target: 'review-guide.md', title: 'Earlier guide' }] })
  write('entities/retired-record.md', '---\ndomain: ordering\n---\n\n# Retired record\n\nA record retained only in the earlier model.\n\n## Information kept\n\n- **Note** — its saved explanation\n')
  editFrontmatter('interfaces/admin-web/screens/order-detail.md', value => { value.entities.push('retired-record') })
  git('add', '.')
  execFileSync(process.execPath, [cli, 'lint', '--json'], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
  git('commit', '-m', 'Before resource edits')
  const base = git('rev-parse', 'HEAD')
  for (const path of paths.filter(path => path !== 'coverage.md')) write(path, read(path).replace(/^# (.+)$/m, '# $1 updated'))
  write(paths[5], read(paths[5]).replace('Price and availability', 'Price, availability and delivery time'))
  editFrontmatter('entities/order.md', value => { delete value.references })
  write('entities/order.md', read('entities/order.md').replace('where and how this order is to be delivered', 'the destination and delivery instructions').replace('- **When placed** — when the shopper submitted it', '- **Delivery note** — instructions supplied by the shopper'))
  editFrontmatter('coverage.md', value => {
    value.scope = 'Updated model scope.'
    value.unmapped = [{ description: 'A newly recorded gap.', paths: ['src/services/'] }]
  })
  editFrontmatter('capabilities/place-order/scenarios/complete-checkout.md', value => {
    value.steps[0].kind = 'product'
    value.steps[0].text = 'The Product submits checkout on behalf of the shopper with a non-empty cart'
    value.steps.splice(3, 0, { ...structuredClone(value.steps[1]), text: 'The shopper confirms an additional detail' })
  })
  editFrontmatter('capabilities/place-order/scenarios/decline-checkout-payment.md', value => {
    value.references = [...value.references ?? [], { kind: 'doc', role: 'context', target: 'review-guide.md', title: 'Scenario guide' }]
  })
  editFrontmatter('business-rules/who-may-change-an-order.md', value => {
    value.permits[0].when[0].state = 'Confirmed'
    value.permits.push({ actors: ['shopper'] })
  })
  rmSync(join(root, modelPath('entities/retired-record.md')))
  editFrontmatter('interfaces/admin-web/screens/order-detail.md', value => { value.entities = value.entities.filter(id => id !== 'retired-record') })
  const deletedRule = read('business-rules/total-charged.md')
  rmSync(join(root, modelPath('business-rules/total-charged.md')))
  write('business-rules/review-example.md', deletedRule.replace('# Total charged', '# Review example'))
  write('config.yaml', `${read('config.yaml')}\n`)
  write('capabilities/browse-catalog/capability.md', `${read('capabilities/browse-catalog/capability.md')}\n`)
  writeFileSync(join(root, 'review-guide.md'), '# Current guide\n')
  execFileSync(process.execPath, [cli, 'lint', '--json'], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
  viewer = spawn(process.execPath, [cli, 'view', '--no-open'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  const url = await new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error(output || 'Viewer startup timeout')), 30_000)
    viewer.stdout.on('data', data => { output += data; const found = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timeout); resolve(found[0]) } })
    viewer.stderr.on('data', data => { output += data })
    viewer.on('exit', () => { clearTimeout(timeout); reject(new Error(output)) })
  })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  page.on('pageerror', error => errors.push(error.message))
  const open = async (path, tab = '', diff = true) => {
    await page.goto(`${url}/?s=review&rp=${encodeURIComponent(modelPath(path))}${tab ? `&rv=${tab}` : ''}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('[data-review-file-details], [data-inline-review-controls]').first()).toBeVisible()
    if (diff && await page.getByRole('button', { name: 'Show diff', exact: true }).count()) await page.getByRole('button', { name: 'Show diff', exact: true }).click()
  }
  const trackReading = async (selector, scrollSelector, parentScroll = false) => {
    await expect(page.locator(selector)).toBeVisible()
    await page.evaluate(async ({ selector, scrollSelector, parentScroll }) => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const node = document.querySelector(selector)
      const scrollTarget = document.querySelector(scrollSelector)
      const scroll = parentScroll ? scrollTarget.parentElement : scrollTarget
      const focused = node.querySelector('[role="tab"][aria-selected="true"]')
      focused?.focus({ preventScroll: true })
      scroll.scrollTop = 300
      const state = { node, scroll, position: scroll.scrollTop, focused, removals: 0 }
      state.observer = new MutationObserver(records => {
        if (records.some(record => [...record.removedNodes].some(removed => removed === node || removed.contains(node)))) state.removals++
      })
      state.observer.observe(document.body, { subtree: true, childList: true })
      window.trackedReading = state
    }, { selector, scrollSelector, parentScroll })
  }
  const expectStableReading = async () => {
    const state = await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const { node, scroll, position, focused, removals } = window.trackedReading
      return { connected: node.isConnected, removals, scrollPreserved: Math.abs(scroll.scrollTop - position) < 2, focusPreserved: !focused || document.activeElement === focused }
    })
    assert.deepEqual(state, { connected: true, removals: 0, scrollPreserved: true, focusPreserved: true }, 'Background refresh preserves the open reading, scroll and focus')
  }
  const refreshReading = async () => {
    const file = page.waitForResponse(response => response.url().includes('/review/file') && response.ok())
    await page.waitForResponse(response => response.url().includes('/history/diff') && response.ok())
    await file
    await expectStableReading()
  }
  for (const path of paths) {
    await open(path, '', false)
    const inline = path !== 'product/product.md' && path !== 'coverage.md'
    if (inline) {
      await expect(page.locator('[data-resource-panel] [data-inline-change]')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Show diff', exact: true })).toHaveAttribute('aria-pressed', 'false')
      await page.getByRole('button', { name: 'Show diff', exact: true }).click()
    }
    await expect(page.locator(inline ? '[data-inline-review-controls]' : '[data-resource-comparison]')).toBeVisible()
    await expect(page.locator(inline ? '[data-resource-panel] [data-inline-change]' : '[data-resource-comparison] [data-comparison-change]')).not.toHaveCount(0)
    await expect(page.locator('[data-file-diff]')).toHaveCount(0)
  }
  for (const key of ['entity:order', 'screen:customer-web::storefront::product-record']) {
    await page.goto(`${url}/?s=entity&e=${key}`, { waitUntil: 'domcontentloaded' })
    const panel = page.locator('[data-resource-panel]')
    await expect(panel).toBeVisible()
    await expect(panel.locator('[data-inline-change]')).toHaveCount(0)
    await expect(panel.getByText('Changed since Last commit', { exact: true })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Show diff', exact: true }).click()
    await expect(panel.locator('[data-review-field="Title"][data-inline-change="modified"]')).toBeVisible()
    if (key.startsWith('screen:')) {
      const details = panel.locator('[data-review-field="Details"][data-inline-change="modified"]')
      await expect(details).toContainText('Price, availability and delivery time')
      await details.getByRole('button', { name: 'Show previous', exact: true }).click()
      await expect(details.locator('[data-previous-value]')).toContainText('Price and availability')
    }
    await panel.getByRole('button', { name: 'Hide diff', exact: true }).click()
    await expect(panel.locator('[data-inline-change]')).toHaveCount(0)
    await expect(panel.getByRole('tab', { name: /^Overview/ })).toHaveAttribute('aria-selected', 'true')
    await page.screenshot({ path: `/tmp/businesslens-normal-${key.split(':')[0]}.png`, animations: 'disabled' })
  }
  await open('capabilities/place-order/scenarios/complete-checkout.md')
  await expect(page.getByRole('tab', { name: /^Scenarios/ })).toHaveAttribute('aria-selected', 'true')
  const steps = page.locator('[data-row-key="capability-scenario:complete-checkout"] [data-scenario-steps]')
  await expect(steps.locator('[data-review-field="Step"][data-inline-change="added"]')).toHaveCount(1)
  await expect(steps.locator('[data-review-field="Who"][data-inline-change="modified"]')).toHaveCount(1)
  const who = steps.locator('[data-review-field="Who"][data-inline-change="modified"]')
  await who.getByRole('button', { name: 'Show previous' }).click()
  await expect(who.locator('[data-previous-value]')).toContainText('Shopper')
  await page.getByRole('button', { name: /^(Show|Hide) diff$/ }).click()
  await expect(steps.locator('[data-inline-change]')).toHaveCount(0)
  await expect(page.getByRole('tab', { name: /^Scenarios/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: /^(Show|Hide) diff$/ }).click()
  await expect(steps).toContainText('The shopper confirms an additional detail')
  await trackReading('[data-resource-panel]', '[data-resource-scroll]')
  assert.ok(await page.evaluate(() => window.trackedReading.position > 0), 'The reading is scrolled before polling')
  await refreshReading()
  await refreshReading()
  // A real edit still arrives without tearing down the reading or re-scrolling to the Scenario.
  write('capabilities/place-order/scenarios/complete-checkout.md', read('capabilities/place-order/scenarios/complete-checkout.md').replace('an additional detail', 'a refreshed detail'))
  await expect(steps).toContainText('The shopper confirms a refreshed detail')
  await expectStableReading()
  await page.evaluate(() => window.trackedReading.observer.disconnect())
  await page.screenshot({ path: '/tmp/businesslens-resource-review-scenario.png', animations: 'disabled' })
  await open('capabilities/place-order/scenarios/decline-checkout-payment.md')
  await expect(page.getByRole('tab', { name: /^Scenarios/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: /^References/ }).click()
  await expect(page.getByRole('tab', { name: /^References/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-resource-panel]')).toContainText('Scenario guide')

  await open('business-rules/who-may-change-an-order.md')
  const ruleDetails = page.locator('[data-review-field="Details"][data-inline-change="modified"]')
  await ruleDetails.getByRole('button', { name: 'Show previous', exact: true }).click()
  await expect(ruleDetails.locator('[data-previous-value]')).toContainText('Pending')
  await expect(ruleDetails).toContainText('Confirmed')
  await page.screenshot({ path: '/tmp/businesslens-resource-review-rule.png', animations: 'disabled' })
  await open('business-rules/total-charged.md')
  await expect(page.locator('[data-resource-panel]')).toContainText('Total charged')
  await expect(page.locator('[data-inline-change="deleted"]')).not.toHaveCount(0)
  await page.getByRole('button', { name: 'View file diff', exact: true }).click()
  await expect(page.locator('[data-file-diff]')).toContainText('Total charged')
  await open('entities/retired-record.md')
  await expect(page.locator('[data-resource-panel]')).toContainText('Removed resource · showing the earlier version')
  await expect(page.locator('[data-resource-panel]')).toContainText('its saved explanation')
  await page.getByRole('button', { name: /^(Show|Hide) diff$/ }).click()
  await expect(page.locator('[data-resource-panel]')).toContainText('Removed resource · showing the earlier version')
  await expect(page.locator('[data-resource-panel] [data-inline-change]')).toHaveCount(0)
  await open('business-rules/review-example.md')
  await expect(page.locator('[data-inline-change="added"]')).not.toHaveCount(0)

  await open('entities/order.md', 'references')
  await expect(page.getByRole('tab', { name: /^References/ })).toHaveAttribute('aria-selected', 'true')
  const guide = page.locator('[data-resource-panel] a').filter({ hasText: 'Earlier guide' })
  await expect(guide).toBeVisible()
  assert.equal(new URL(new URL(await guide.getAttribute('href'), url).searchParams.get('f'), url).searchParams.get('state'), `commit:${base}`)
  await guide.click()
  await expect(page.locator('[data-reference-preview-content]')).toContainText('Earlier guide')
  await page.getByRole('button', { name: 'Close resource', exact: true }).click()
  await expect(page.getByRole('tab', { name: /^References/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page).not.toHaveURL(/[?&]f=/)
  await page.reload()
  await page.getByRole('button', { name: 'Show diff', exact: true }).click()
  await expect(page.getByRole('tab', { name: /^References/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-resource-panel]')).toContainText('Earlier guide')

  await open('entities/order.md', 'overview')
  await expect(page.locator('[data-review-field="Delivery details"][data-inline-change="modified"]')).toContainText('Previously: where and how')
  await expect(page.locator('[data-review-field="When placed"][data-inline-change="deleted"]')).toBeVisible()
  await expect(page.locator('[data-review-field="Delivery note"][data-inline-change="added"]')).toBeVisible()
  await page.getByRole('button', { name: /^(Show|Hide) diff$/ }).click()
  await expect(page.locator('[data-review-field="When placed"]')).toHaveCount(0)
  await expect(page.locator('[data-inline-change]')).toHaveCount(0)
  await page.getByRole('button', { name: /^(Show|Hide) diff$/ }).click()
  await page.screenshot({ path: '/tmp/businesslens-inline-entity.png', animations: 'disabled' })
  await page.getByRole('tab', { name: /^Lifecycle/ }).click()
  await expect(page).toHaveURL(/rv=lifecycle/)
  await page.getByRole('tab', { name: /^References/ }).click()
  await expect(page).toHaveURL(/rv=references/)
  await page.goBack()
  await expect(page.getByRole('tab', { name: /^Lifecycle/ })).toHaveAttribute('aria-selected', 'true')

  await open('entities/order.md', 'lifecycle')
  await expect(page.locator('[data-resource-panel] [data-lifecycle]')).toBeVisible()
  await open('config.yaml')
  await expect(page.locator('[data-file-diff]')).toBeVisible()
  await trackReading('[data-file-diff]', '[data-review-file-details]', true)
  await refreshReading()
  await page.evaluate(() => window.trackedReading.observer.disconnect())
  await open('capabilities/browse-catalog/capability.md')
  await expect(page.locator('[data-file-diff]')).toBeVisible()
  await expect(page.locator('[data-review-file-details]')).toContainText('No modeled values changed')
  await page.goto(`${url}/?s=review&base=empty&target=working&rp=${encodeURIComponent(modelPath('entities/order.md'))}`)
  await expect(page.locator('[data-inline-review-controls]')).toBeVisible()
  await page.getByRole('button', { name: 'Show diff', exact: true }).click()
  await expect(page.locator('[data-resource-panel] [data-inline-change="added"]')).not.toHaveCount(0)

  // A historical resource outside the current comparison is immutable; polling must not reload it.
  let historicalRequests = 0
  const countHistorical = request => { if (new URL(request.url()).pathname === '/_businesslens/state') historicalRequests++ }
  page.on('request', countHistorical)
  await page.goto(`${url}/?s=review&base=empty&target=working&e=entity:order&v=commit:${base}`)
  await trackReading('[data-resource-panel]', '[data-resource-scroll]')
  const initialRequests = historicalRequests
  for (let i = 0; i < 2; i++) await page.waitForResponse(response => response.url().includes('/history/diff') && response.ok())
  await expectStableReading()
  assert.equal(historicalRequests, initialRequests, 'An open historical resource is not fetched again on each working-state poll')
  await page.evaluate(() => window.trackedReading.observer.disconnect())
  page.off('request', countHistorical)

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await open('entities/order.md', 'overview')
    await expect(page.locator('[data-inline-review-controls]')).toBeVisible()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow')
    const bounds = await page.getByRole('dialog').boundingBox()
    assert.ok(bounds && bounds.width <= width, 'Panel fits the mobile viewport')
    await page.screenshot({ path: `/tmp/businesslens-resource-review-${width}.png`, animations: 'disabled' })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('[data-repository-tree]')).toBeVisible()
  }

  // A failed parse is unknown, never an empty model or a deleted resource.
  await open('entities/order.md')
  await expect(page.locator('[data-inline-review-controls]')).toBeVisible()
  write('entities/invalid.md', 'not a model resource')
  await expect(page.locator('[data-file-diff]')).toBeVisible()
  await expect(page.locator('[data-resource-comparison]')).toHaveCount(0)
  await expect(page.locator('[data-inline-review-controls]')).toHaveCount(0)
  assert.deepEqual(errors, [])
  console.log('Resource Review passed: all ten types, Product, Coverage, aligned steps, permissions, additions/deletions, removed References, historical links, normal resource readings, explicit Show diff from Review and collections, inline annotations, stable polling and live edits, file fallbacks and mobile.')
} finally {
  await browser?.close()
  if (viewer?.exitCode === null) { const exited = new Promise(resolve => viewer.once('exit', resolve)); viewer.kill('SIGTERM'); await exited }
  rmSync(root, { recursive: true, force: true })
}
