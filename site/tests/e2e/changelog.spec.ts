import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The pages must show the repository's `CHANGELOG.md`, the file the build read.
// A build that kept an older copy, or none, fails here rather than shipping quietly.
const markdown = readFileSync(fileURLToPath(new URL('../../../CHANGELOG.md', import.meta.url)), 'utf8')
const definitions = new Map([...markdown.matchAll(/^\[([^\]]+)\]: (\S+)/gm)]
  .map(([, label, url]) => [label!, url!]))
// Each dated `## [0.24.0] - 2026-10-05` with entries is one card, titled
// `v0.24.0` and anchored at `#v0-24-0`. `[Unreleased]` never is.
const releases = markdown.split(/^## /m).slice(1).flatMap((section) => {
  const [heading = '', ...rest] = section.split('\n')
  const body = rest.join('\n').split(/^\[[^\]]+\]: /m)[0]!
  if (!body.trim() || !/ - \d{4}-\d{2}-\d{2}$/.test(heading)) return []
  const label = /^\[([^\]]+)\]/.exec(heading)?.[1] ?? heading
  const title = /^\d/.test(label) ? `v${label}` : label
  return [{
    label,
    title,
    anchor: title.toLowerCase().replace(/[\s.]+/g, '-'),
    sections: [...body.matchAll(/^### (.+)$/gm)].map(([, name]) => name!.trim())
  }]
})

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test.describe('the changelog', () => {
  test('renders every pdd-kit release in file order, with its sections', async ({ page }) => {
    await page.goto('/changelog')
    await expect(page.getByRole('heading', { level: 1, name: 'Changelog' })).toBeVisible()

    const titles = page.locator('[data-changelog-versions] h2[data-slot="title"]')
    await expect(titles).toHaveText(releases.map(release => release.title))
    await expect(page.getByText('Unreleased', { exact: true })).toHaveCount(0)

    for (const release of releases.slice(0, 4)) {
      const card = page.locator(`[id="${release.anchor}"]`)
      await expect(card.locator('h3')).toHaveText(release.sections)
      await expect(card.getByRole('link', { name: release.title, exact: true }))
        .toHaveAttribute('href', definitions.get(release.label)!)
      // Every entry links the commit that shipped it.
      await expect(card.getByRole('link', { name: /^[0-9a-f]{7}$/ }).first()).toBeVisible()
      await expect(card.getByRole('link', { name: /\.\.\./ }).last())
        .toHaveAttribute('href', definitions.get(release.label)!)
    }
  })

  test('the versions menu jumps to each release on the page', async ({ page }) => {
    await page.goto('/changelog')
    const versions = page.getByRole('navigation', { name: 'Versions' }).getByRole('link')
    await expect(versions).toHaveText(releases.map(release => release.title))

    const older = releases.at(-1)!
    await versions.filter({ hasText: older.title }).click()
    await expect(page).toHaveURL(new RegExp(`/changelog#${older.anchor}$`))
    await expect(page.locator(`[id="${older.anchor}"] h2`)).toBeInViewport()
  })
})

test('the changelog passes the accessibility scan', async ({ page }) => {
  await page.goto('/changelog')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
