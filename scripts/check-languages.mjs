/**
 * Browser regression for languages in the Fixture Shop report.
 *
 * Run against `npm run view:fixture -- --no-open --port 43213` after building:
 *   node scripts/check-languages.mjs [viewer-url]
 */
import { chromium, expect } from '@playwright/test'

const origin = process.argv[2] || 'http://127.0.0.1:43213'
const browser = await chromium.launch({ headless: true })
const errors = []
const facts = async (tab, id) => {
  await tab.goto(`${origin}/?s=interface&e=${encodeURIComponent(`interface:${id}`)}`)
  const dialog = tab.locator('[role=dialog]').filter({ has: tab.locator('[data-resource-title]') })
  return dialog.locator('dl div').filter({ has: tab.getByText('Languages', { exact: true }) })
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const tab = await context.newPage()
  tab.on('pageerror', error => errors.push(error.message))

  // The Product's languages, in its About reading.
  await tab.goto(`${origin}/`)
  // The report orders tags; the first load can wait on compilation.
  await expect(tab.locator('[data-product-languages] li')).toHaveText(['de', 'en'], { timeout: 20000 })

  // Narrowed: the admin console is English-only, with no qualifier.
  const admin = await facts(tab, 'admin-web')
  await expect(admin.locator('dd')).toHaveText('en')
  await expect(admin.locator('[data-fact-note]')).toHaveCount(0)

  // Not narrowed: the Product's whole list, said as such.
  const web = await facts(tab, 'customer-web')
  await expect(web.locator('dd')).toContainText('de, en')
  await expect(web.locator('[data-fact-note]')).toHaveText(/all of the Product’s/)

  if (errors.length) throw new Error(`Page errors:\n${errors.join('\n')}`)
  console.log('Languages: Product About, a narrowed Interface and an inheriting Interface passed.')
} finally {
  await browser.close()
}
