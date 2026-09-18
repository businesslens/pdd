import { expect } from '@playwright/test'

/** The collection picker changes the drawing without changing its scope. */
export async function selectCollectionDrawing(page, drawing) {
  await page.locator('[data-view-trigger]').click()
  await page.getByRole('button', { name: `Draw as ${drawing}`, exact: true }).click()
  await expect(page.locator('.blr-drawing-cards')).toHaveCount(0)
  await expectCollectionDrawing(page, drawing)
}
export async function expectCollectionDrawing(page, drawing) {
  await expect(page.locator('[data-drawing-switch]')).toHaveAttribute('data-current-drawing', drawing)
}
export async function expandCollection(page) {
  const inline = page.locator('.blr-drawing-controls').getByRole('button', { name: 'Expand all', exact: true })
  if (await inline.isVisible()) return inline.click()
  await page.locator('[data-view-trigger]').click()
  await page.locator('.blr-drawing-cards').getByRole('button', { name: 'Expand all', exact: true }).click()
  await page.locator('[data-view-trigger]').click()
  await expect(page.locator('.blr-drawing-cards')).toHaveCount(0)
}
