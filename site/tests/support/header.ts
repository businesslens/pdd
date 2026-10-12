import { expect, type Locator, type Page } from '@playwright/test'

/**
 * The site has one header: there are no accounts, so what every reader sees is
 * the brand, the PDD version badge, the lookup tools, and the GitHub link. Check
 * that it and the mobile menu's own header fit every phone width.
 */
export async function expectHeaderFits(page: Page) {
  await page.goto('/')
  const header = page.locator('[data-site-header]')
  await expect(header.getByRole('link', { name: 'pdd-kit home', exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: /^Account menu/ })).toHaveCount(0)
  await header.locator('[data-logo-mark]').first().evaluate((image: HTMLImageElement) => image.decode())

  // Include the shared 400px name breakpoint and both sides of the site's 640px one.
  for (const width of [320, 390, 400, 414, 430, 639, 640, 768]) {
    await page.setViewportSize({ width, height: 800 })
    await expectChromeFits(header, width)

    // UHeader renders the same brand and utilities inside its mobile menu.
    await header.getByRole('button', { name: 'Open menu', exact: true }).click()
    const menu = page.getByRole('dialog')
    await expectChromeFits(menu.locator('[data-slot="header"]'), width)
    await menu.getByRole('button', { name: 'Close menu', exact: true }).click()
    await expect(menu).not.toBeVisible()
  }
}

async function expectChromeFits(chrome: Locator, width: number) {
  await expect(chrome.locator('[data-pdd-version]')).toBeVisible()
  // The name is live text that the site hides below `sm`, keeping the mark.
  const name = chrome.locator('[data-logo-wordmark]').getByText('pdd-kit', { exact: true })
  if (width >= 640) await expect(name).toBeVisible()
  else await expect(name).toBeHidden()

  // Measure the artwork and the name themselves: a shrinking link can conceal
  // an overflowing name while both its parent and the header report no overflow.
  const boxes = await chrome.evaluate(element => [...element.querySelectorAll(
    '[data-logo-mark], [data-logo-wordmark] > span, [data-pdd-version], button, a[aria-label]:not(.site-brand)'
  )].map((node) => {
    const { left, right, width } = node.getBoundingClientRect()
    return { left, right, width, name: node.getAttribute('aria-label') || node.getAttribute('alt') || node.textContent }
  }).filter(box => box.width > 0).sort((a, b) => a.left - b.left))

  expect(boxes.length).toBeGreaterThan(2)
  for (const [index, box] of boxes.entries()) {
    expect(box.left, `${box.name} leaves the viewport at ${width}px`).toBeGreaterThanOrEqual(0)
    expect(box.right, `${box.name} leaves the viewport at ${width}px`).toBeLessThanOrEqual(width)
    const previous = boxes[index - 1]
    if (previous) {
      expect(previous.right, `${previous.name} overlaps ${box.name} at ${width}px`)
        .toBeLessThanOrEqual(box.left)
    }
  }
}
