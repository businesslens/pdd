/** Browser regression for the Content Feed Reader Blueprint. Five-member data is a synthetic layout fixture. */
import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const origin = process.argv[2] || 'http://127.0.0.1:43213'
const output = process.env.BLR_VARIATION_SCREENSHOTS
if (output) await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const anchor = 'experience:reader-mobile::personal-library'
const peer = 'experience:reader-mobile::source-focused-library'
async function capture(page, name) {
  if (!output) return
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' })
}
async function prepare(page) {
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/?s=interface`)
  await page.getByRole('combobox', { name: 'Rows per line' }).click()
  await page.getByRole('option', { name: '1 per row', exact: true }).click()
  const mobile = page.locator('[data-card-key="interface:reader-mobile"]')
  await expect(mobile).toBeVisible()
  for (const title of ['Personal library', 'Source-focused library']) {
    const collapse = mobile.getByRole('button', { name: `Collapse ${title}`, exact: true })
    await expect(collapse).toBeVisible()
    await collapse.click()
    await expect(mobile.getByRole('button', { name: new RegExp(`^Expand ${title}`) })).toBeVisible()
  }
  return mobile
}
const member = (page, key) => page.locator(`[data-variation-member="${key}"]`)
const conditions = (page, key) => member(page, key).locator('[data-variation-conditions]')
try {
  const context = await browser.newContext({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const mobile = await prepare(page)
  await expect(mobile.locator('[data-variation-link]')).toHaveCount(2)
  await expect(mobile).not.toContainText('When used:')
  await capture(page, 'tree-two')
  const link = mobile.locator('[data-variation-link]').first().getByRole('link', { name: 'View 2 variations', exact: true })
  await expect(link).toHaveAttribute('href', /rt=variations/)
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('tab', { name: 'Variations 2', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Expand resource', exact: true }).click()
  await expect(page.locator('[data-variations]')).toContainText('Configuration')
  await expect(page.locator('[data-variation-member]')).toHaveCount(2)
  await expect(page.locator('[data-current-variation]')).toHaveCount(1)
  await expect(conditions(page, anchor)).toBeVisible()
  await expect(conditions(page, peer)).not.toBeVisible()
  await expect(page.locator('[data-variation-owner]')).toHaveCount(0)
  await capture(page, 'tab-two')
  await member(page, peer).getByRole('button', { name: 'When used: Source-focused library', exact: true }).click()
  await expect(conditions(page, peer)).toBeVisible()
  await page.getByRole('button', { name: 'Close resource', exact: true }).click()
  await expect(mobile.getByRole('button', { name: /^Expand Personal library/ })).toBeVisible()
  await expect(mobile.getByRole('button', { name: /^Expand Source-focused library/ })).toBeVisible()
  await link.click()
  await expect(conditions(page, peer)).toBeVisible()
  await page.reload()
  await expect(conditions(page, peer)).toBeVisible()
  await member(page, peer).getByRole('link', { name: 'Source-focused library', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-when-used]')).toContainText('Source-focused')
  await page.getByRole('button', { name: 'Back to Personal library', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Variations 2', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(conditions(page, peer)).toBeVisible()
  await member(page, anchor).getByRole('button', { name: 'When used: Personal library', exact: true }).click()
  await page.getByRole('tab', { name: 'Overview', exact: true }).click()
  await expect(page.locator('[data-variations]')).toHaveCount(0)
  await expect(page.locator('[data-when-used]')).toContainText('Configuration')
  await expect(page.locator('[data-when-used]')).toContainText('Selected when')
  await expect(page.locator('[data-when-used]')).toContainText('Takes effect')
  await expect(page.locator('[data-when-used]')).toContainText('Stability')
  await expect(page.locator('[data-variation-overview] [data-entity-chip]')).toHaveAccessibleName('Open Entity Reader')
  await expect(page.locator('[data-variation-overview] [data-usage-field]')).toContainText('Library assignment')
  await capture(page, 'overview-two')
  await page.locator('[data-when-used] [data-usage-reference]').click()
  await expect(page.locator('[data-resource-heading]')).toContainText('Reader')
  await expect(page.getByRole('dialog')).toContainText('Library assignment')
  await page.getByRole('button', { name: 'Back to Personal library', exact: true }).click()
  await page.getByRole('link', { name: 'View all 2 variations', exact: true }).click()
  await expect(conditions(page, anchor)).not.toBeVisible()
  await page.getByRole('button', { name: 'Close resource', exact: true }).click()
  // The same shortcut must work in an Interface's Delivery, not only the collection.
  await page.goto(`${origin}/?s=interface&e=interface%3Areader-mobile&rt=delivery`)
  await page.getByRole('dialog').locator('[data-variation-link]').first().getByRole('link').click()
  await expect(page.getByRole('tab', { name: 'Variations 2', exact: true })).toHaveAttribute('aria-selected', 'true')
  await context.close()

  // A separate context injects synthetic report data; the authored Blueprint stays unchanged.
  const scaling = await browser.newContext({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  await scaling.route('**/_businesslens/report.json', async route => {
    const response = await route.fetch()
    const report = await response.json()
    const template = report.model.experiences.find(item => item.id === peer.slice('experience:'.length))
    const samples = [
      ['reader-mobile', 'compact-library', 'Compact library'],
      ['reader-mobile', 'guided-library', 'Guided library for Readers who want a structured daily reading routine'],
      ['reader-web', 'focused-library', 'Focused library']
    ]
    for (const [owner, id, title] of samples) report.model.experiences.push({
      ...template, id: `${owner}::${id}`, title, interfaceIds: [owner], entryPoints: [], navigation: [],
      description: 'Synthetic layout example, not proposed product behavior.',
      variationUsage: {
        settings: [{ entity: 'reader', fact: 'Library assignment' }],
        selectedWhen: `The Library assignment selects **${title}**. Unknown values are rejected.`,
        takesEffect: 'At the next sign-in. Administrators may change the assignment while a session is active; that does not change an active session.',
        stability: 'Fixed for the session. Saved content stays accessible after reassignment.'
      }
    })
    report.counts.experiences += 3
    await route.fulfill({ response, json: report })
  })
  const five = await scaling.newPage()
  const fiveMobile = await prepare(five)
  const fiveWeb = five.locator('[data-card-key="interface:reader-web"]')
  for (const title of ['Personal library', 'Public reading']) {
    await fiveWeb.getByRole('button', { name: `Collapse ${title}`, exact: true }).click()
  }
  await expect(five.locator('[data-variation-link]')).toHaveCount(5)
  await expect(five.getByRole('link', { name: 'View 5 variations', exact: true })).toHaveCount(5)
  await capture(five, 'tree-five')
  await fiveMobile.locator('[data-variation-link]').filter({ has: five.locator(`[data-resource-key="${anchor}"]`) }).getByRole('link').click()
  await five.getByRole('button', { name: 'Expand resource', exact: true }).click()
  await expect(five.locator('[data-variation-member]')).toHaveCount(5)
  await expect(five.locator('[data-variation-owner]')).toHaveCount(5)
  const order = await five.locator('[data-variation-member]').evaluateAll(items => items.map(item => item.dataset.variationMember))
  await capture(five, 'tab-five')
  const guided = 'experience:reader-mobile::guided-library'
  await member(five, guided).getByRole('button').click()
  await expect(conditions(five, guided)).toContainText('next sign-in')
  await member(five, guided).getByRole('heading').getByRole('link').click()
  await five.getByRole('link', { name: 'View all 5 variations', exact: true }).click()
  expect(await five.locator('[data-variation-member]').evaluateAll(items => items.map(item => item.dataset.variationMember))).toEqual(order)
  await expect(member(five, guided).locator('[data-current-variation]')).toBeVisible()
  await expect(conditions(five, guided)).toBeVisible()
  await five.getByRole('button', { name: 'Back to Personal library', exact: true }).click()
  await expect(conditions(five, guided)).toBeVisible()
  await capture(five, 'tab-five-expanded')
  await five.setViewportSize({ width: 390, height: 844 })
  expect(await five.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await capture(five, 'tab-five-mobile')
  await five.getByRole('button', { name: 'Close resource', exact: true }).click()
  expect(await five.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await capture(five, 'tree-five-mobile')
  for (const kind of ['experiment', 'version']) {
    const subtype = await browser.newContext({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
    await subtype.route('**/_businesslens/report.json', async route => {
      const response = await route.fetch(), report = await response.json()
      for (const resource of report.model.experiences.filter(item => [anchor, peer].includes(`experience:${item.id}`))) {
        const isAnchor = `experience:${resource.id}` === anchor
        if (isAnchor) resource.variationKind = kind
        const usage = { selectedWhen: isAnchor ? 'Assigned the Classic form.' : 'Assigned the Source-focused form.', takesEffect: 'At session start.', stability: 'Fixed for the session.' }
        resource.variationUsage = kind === 'experiment' ? { ...usage, assignmentUnit: { entity: 'reader' }, assignmentFact: { entity: 'reader', fact: 'Library assignment' }, assignmentMethod: 'Random assignment per Reader.', allocation: 'Half of eligible Readers.' }
          : { ...usage, label: isAnchor ? 'v1' : 'v2', discriminator: { entity: 'reader', fact: 'Library assignment' } }
      }
      await route.fulfill({ response, json: report })
    })
    const reading = await subtype.newPage()
    reading.on('pageerror', error => errors.push(error.message))
    await reading.goto(`${origin}/?s=interface&e=${encodeURIComponent(anchor)}&rt=variations`)
    await reading.getByRole('button', { name: 'Expand resource', exact: true }).click()
    await expect(member(reading, anchor).locator('[data-variation-usage]')).toContainText(kind === 'experiment' ? 'Assignment method' : 'Version discriminator')
    await capture(reading, `tab-${kind}`)
    await subtype.close()
  }
  expect(errors).toEqual([])
  console.log('Variation usage references, all subtypes, navigation, counts, ordering, expansion, Back, refresh, Delivery and mobile checks passed (2 and 5 members).')
} finally {
  await browser.close()
}
