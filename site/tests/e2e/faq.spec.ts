import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { waitForHydration } from '../support/hydration'

// The FAQ is authored at the repository root, the same file the build read.
const markdown = readFileSync(fileURLToPath(new URL('../../../docs/faq.md', import.meta.url)), 'utf8')
const questions = [...markdown.matchAll(/^### (.+)$/gm)].map(match => match[1]!)
const groups = [...markdown.matchAll(/^## (.+)$/gm)].map(match => match[1]!).slice(0, -1)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

test('a slow FAQ load keeps the filtered catalog until it arrives, and back restores it', async ({ page }) => {
  // The generated FAQ's content arrives in its prerendered payload, which the
  // router loads before it commits the navigation. Hold that file, including
  // any prefetch of it, as a slow connection would.
  let release!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/faq/_payload.json*', async (route) => {
    await held
    await route.continue()
  })
  try {
    await page.goto('/blueprints')
    await waitForHydration(page)
    const search = page.getByRole('textbox', { name: 'Search Blueprints' })
    await search.fill('kanban')
    await expect(page).toHaveURL(/[?&]q=kanban/)
    await page.getByRole('contentinfo').getByRole('link', { name: 'FAQ', exact: true }).click()

    // Nothing is torn down while the FAQ is on its way.
    await expect(page).toHaveURL(/[?&]q=kanban/)
    await expect(search).toHaveValue('kanban')
    await expect(page.locator('[data-catalog-summary]')).toHaveText('1 result')

    release()
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.locator('main section button[aria-expanded]').first()).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/[?&]q=kanban/)
    await expect(search).toHaveValue('kanban')
    await expect(page.locator('[data-catalog-state="listing"]')).toBeVisible()
    await expect(page.locator('[data-catalog-summary]')).toHaveText('1 result')
  } finally {
    release()
  }
})

test('renders every authored question in order with answers initially collapsed', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')
  // Scoped to the groups: the section index has a disclosure button too.
  const triggers = page.locator('main section button[aria-expanded]')
  await expect(triggers).toHaveText(questions)
  await expect(page.locator('main section button[aria-expanded="true"]')).toHaveCount(0)
  for (const question of questions) {
    const trigger = page.getByRole('button', { name: question, exact: true })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = page.locator(`[id="${await trigger.getAttribute('aria-controls')}"]`)
    await expect(panel).toBeVisible()
    expect((await panel.innerText()).trim()).not.toBe('')
    await trigger.click()
  }
})

test('keeps the source comparison, boundary lists and commands readable', async ({ page }) => {
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'I already have documentation. Why do I need a Product Model?', exact: true }).click()
  const sources = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Information source' }) })
  await expect(sources).toBeVisible()
  await expect(sources.getByRole('rowheader', { name: 'Product Model', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Does the Product Model replace my UI/UX design?', exact: true }).click()
  const boundary = page.locator('[data-boundary]')
  await expect(boundary).toBeVisible()
  await expect(boundary.getByRole('list')).toHaveCount(2)
  for (const list of await boundary.getByRole('list').all()) {
    await expect(list.getByRole('listitem')).toHaveCount(5)
  }
  await page.getByRole('button', { name: 'Can I share the report without running it locally?', exact: true }).click()
  await expect(page.getByText('npx @itai-gendler/pdd-kit view <owner>/<repo> --pr <n>', { exact: true })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
})

// A generated page hydrates at its bare path and the router restores the hash
// afterwards; the FAQ opens the question from that route change.
test('gives every question an address and keeps any number of answers open', async ({ page }) => {
  await page.goto('/faq#how-is-this-different-from-sdd')
  await page.waitForLoadState('networkidle')
  const sdd = page.getByRole('button', { name: 'How is this different from SDD?', exact: true })
  await expect(sdd).toHaveAttribute('aria-expanded', 'true')

  const prd = page.getByRole('button', { name: 'Isn\'t this just a fancy PRD?', exact: true })
  const scroll = await page.evaluate(() => window.scrollY)
  await prd.click()
  await expect(prd).toHaveAttribute('aria-expanded', 'true')
  await expect(sdd).toHaveAttribute('aria-expanded', 'true')
  await expect(page).toHaveURL(/#isn-t-this-just-a-fancy-prd$/)
  // Opening an answer below never moves the page; the reader scrolls.
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll)

  await prd.click()
  await expect(prd).toHaveAttribute('aria-expanded', 'false')
  await expect(page).not.toHaveURL(/#/)
})

test('indexes the groups in the right margin on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')
  const index = page.getByRole('navigation', { name: 'FAQ sections' }).filter({ visible: true })
  await expect(index).toHaveCount(1)
  await expect(index.getByRole('link')).toHaveText(groups)
  const group = await page.locator('main section').filter({ has: page.getByRole('heading', { level: 2, name: groups[0]!, exact: true }) }).boundingBox()
  const box = await index.boundingBox()
  expect(box!.x).toBeGreaterThan(group!.x + group!.width)

  await index.getByRole('link', { name: groups.at(-1)!, exact: true }).click()
  await expect(page).toHaveURL(/#trust-and-help$/)
  await expect(page.getByRole('heading', { level: 2, name: groups.at(-1)!, exact: true })).toBeInViewport()
})

test('indexes the groups in the docs\' collapsible bar on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')
  const index = page.getByRole('navigation', { name: 'FAQ sections' })
  const toggle = index.getByRole('button', { name: 'On this page' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(index.getByRole('link')).toHaveText(groups)

  await index.getByRole('link', { name: groups.at(-1)!, exact: true }).click()
  await expect(page).toHaveURL(/#trust-and-help$/)
  // Picking a group closes the list, and the bar stays pinned under the header
  // without covering the group it opened.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const heading = page.getByRole('heading', { level: 2, name: groups.at(-1)!, exact: true })
  await expect(heading).toBeInViewport()
  await expect.poll(async () => {
    const [bar, top] = await Promise.all([index.boundingBox(), heading.boundingBox()])
    return top!.y - (bar!.y + bar!.height)
  }).toBeGreaterThanOrEqual(0)
})

test('fits answer tables to a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'I already have documentation. Why do I need a Product Model?', exact: true }).click()
  const frame = page.getByRole('region', { name: /source of information/i })
  await expect(frame).toBeVisible()
  expect(await frame.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)

  await page.getByRole('button', { name: 'Isn\'t this just a fancy PRD?', exact: true }).click()
  const stacked = page.locator('[data-comparison="stacked"]').filter({ visible: true })
  await expect(stacked).toHaveCount(1)
  await expect(stacked.getByRole('term').first()).toHaveText('Primary job')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([])
})
