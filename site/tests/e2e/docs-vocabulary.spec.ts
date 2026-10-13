import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoWithTools } from '../support/header'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

test('opens the current docs group and preserves the reading when dismissed', async ({ page, isMobile }) => {
  await page.goto('/docs/entities')
  const trigger = page.locator('header').getByRole('button', { name: 'Vocabulary', exact: true })
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(trigger).toBeVisible()
  // The trigger is server-rendered, so it is visible before the page is live.
  // Scrolling that early is undone when hydration restores the saved position.
  await page.locator('[data-docs-tools-ready]').waitFor({ state: 'attached' })
  await page.evaluate(() => window.scrollTo(0, 450))
  const offset = await page.evaluate(() => window.scrollY)
  await trigger.click()
  await expect(panel.locator('[data-term="entity"]')).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-term="product"]')).toHaveAttribute('aria-expanded', 'false')
  const search = panel.getByRole('textbox', { name: 'Filter the vocabulary' })
  if (isMobile) await expect(search).not.toBeFocused()
  else await expect(search).toBeFocused()
  await search.fill('Machine')
  await expect(panel.locator('article').first()).toHaveAttribute('data-term', 'lifecycle')
  await panel.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(panel).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(offset)
  await expect(page).toHaveURL(/\/docs\/entities$/)
  await trigger.click()
  await expect(search).toHaveValue('')
  await expect(panel.locator('[data-term="entity"]')).toHaveAttribute('aria-expanded', 'true')
})

test('follows linked definitions, returns to the search, and reads docs in this tab', async ({ page, context }) => {
  await gotoWithTools(page, '/docs/entities')
  const trigger = page.locator('header').getByRole('button', { name: 'Vocabulary', exact: true })
  await trigger.click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  const search = panel.getByRole('textbox', { name: 'Filter the vocabulary' })
  await search.fill('Actor')
  const actor = panel.locator('article[data-term="actor"]')
  await actor.getByRole('button', { name: 'Go to Entity', exact: true }).click()
  await expect(panel.locator('[data-term="entity"]')).toHaveAttribute('data-marked', 'true')
  await panel.getByRole('button', { name: 'Back to Actor', exact: true }).click()
  await expect(search).toHaveValue('Actor')
  await expect(actor).toBeFocused()

  await search.fill('Trigger')
  const triggerTerm = panel.locator('article[data-term="capability-scenario-trigger"]')
  const readMore = triggerTerm.getByRole('link', { name: 'Read more in docs', exact: true })
  const href = await readMore.getAttribute('href')
  expect(href).toMatch(/^\/docs\/capabilities#.+/)
  await expect(readMore).not.toHaveAttribute('target', '_blank')
  const tabs = context.pages().length
  await readMore.click()
  await expect(panel).not.toBeVisible()
  await expect(page).toHaveURL(url => `${url.pathname}${url.hash}` === href)
  await expect(page.locator(new URL(page.url()).hash)).toBeInViewport()
  expect(context.pages()).toHaveLength(tabs)
  await trigger.click()
  await expect(panel.locator('[data-term="capability"]')).toHaveAttribute('aria-expanded', 'true')
  await expect(search).toHaveValue('')
})

test('handles a same-page heading and falls back to Product on pages without terms', async ({ page }) => {
  await gotoWithTools(page, '/docs/entities')
  const trigger = page.locator('header').getByRole('button', { name: 'Vocabulary', exact: true })
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await trigger.click()
  const actor = panel.locator('article[data-term="actor"]')
  const readMore = actor.getByRole('link')
  const href = await readMore.getAttribute('href')
  await readMore.click()
  await expect(panel).not.toBeVisible()
  await expect(page).toHaveURL(url => `${url.pathname}${url.hash}` === href)
  await expect(page.locator(new URL(page.url()).hash)).toBeInViewport()

  // A second visit to the same heading does not change the route. The link
  // itself must dismiss the panel, rather than relying on the route watcher.
  await trigger.click()
  await readMore.click()
  await expect(panel).not.toBeVisible()

  await gotoWithTools(page, '/docs/cli-lint')
  await trigger.click()
  await expect(panel.locator('[data-term="product"]')).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.locator('[data-vocabulary-page^="cli-"]')).toHaveCount(0)
  await panel.getByRole('textbox', { name: 'Filter the vocabulary' }).fill('zzzz-no-match')
  await expect(panel.getByText('No word matches')).toBeVisible()
  await page.goBack()
  await expect(panel).not.toBeVisible()
})

test('fits narrow screens and has no automatically detectable WCAG A/AA violations', async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await gotoWithTools(page, '/docs/interfaces')
  await page.locator('header').getByRole('button', { name: 'Vocabulary', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Vocabulary', exact: true })
  await expect(panel).toBeVisible()
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
