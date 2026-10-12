import { expect, test } from '@playwright/test'
import {
  PDD_KIT_DARK_BACKGROUNDS,
  PDD_KIT_DEFAULT_DARK_BACKGROUND,
  PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
  PDD_KIT_LIGHT_BACKGROUNDS
} from '@itai-gendler/pdd-kit/theme-lab/variants'
import { expectHeaderFits } from '../support/header'

test('the generated header and mobile menu fit phone widths', async ({ page }) => {
  await expectHeaderFits(page)
})

test('the generated site has no theme lab and ignores every visual experiment cookie', async ({ baseURL, context, page }) => {
  const nonDefault = <T extends { id: string }>(variants: T[], fallback: string) =>
    variants.find(variant => variant.id !== fallback)!.id

  const selected = {
    darkBackground: nonDefault(PDD_KIT_DARK_BACKGROUNDS, PDD_KIT_DEFAULT_DARK_BACKGROUND),
    lightBackground: nonDefault(PDD_KIT_LIGHT_BACKGROUNDS, PDD_KIT_DEFAULT_LIGHT_BACKGROUND)
  }

  // The lab exists only under `nuxt dev`. The generated HTML is the same file
  // for every visitor, so it carries the default identity before any script runs.
  const html = await (await context.request.get('/')).text()
  expect(html).toMatch(/<html[^>]*\sdata-pdd-kit-theme-lab="hidden"/)
  expect(html).toMatch(new RegExp(`<html[^>]*\\sdata-bg-light="${PDD_KIT_DEFAULT_LIGHT_BACKGROUND}"`))
  expect(html).toMatch(new RegExp(`<html[^>]*\\sdata-bg-dark="${PDD_KIT_DEFAULT_DARK_BACKGROUND}"`))
  expect(html).not.toContain('data-pdd-kit-theme-lab-bar')

  // Cookies a theme-lab session once wrote must change nothing after hydration either.
  await context.addCookies([
    { name: 'bl-preview-bar', value: 'shown', url: baseURL! },
    { name: 'bl-bg-light', value: selected.lightBackground, url: baseURL! },
    { name: 'bl-bg-dark', value: selected.darkBackground, url: baseURL! },
    { name: 'bl-header', value: 'toolbar', url: baseURL! }
  ])

  await page.goto('/')

  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-pdd-kit-theme-lab', 'hidden')
  await expect(root).toHaveAttribute('data-bg-light', PDD_KIT_DEFAULT_LIGHT_BACKGROUND)
  await expect(root).toHaveAttribute('data-bg-dark', PDD_KIT_DEFAULT_DARK_BACKGROUND)
  await expect(root).not.toHaveAttribute('data-syntax-theme')
  await expect(page.locator('[data-pdd-kit-theme-lab-bar]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /customization toolbars/i })).toHaveCount(0)
  await expect(page.locator('header [data-primary-navigation]')).toBeVisible()
  await expect(page.locator('header').getByRole('button', { name: 'Search documentation' })).toBeVisible()
  await expect(page.locator('header').getByRole('button', { name: 'Vocabulary', exact: true })).toBeVisible()

  await page.locator('#start').getByRole('button', { name: 'Start from an idea' }).click()
  await expect(page.getByRole('dialog').locator('a[href="/docs/from-an-idea"]').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const brand = page.getByRole('banner').getByRole('link', { name: 'pdd-kit home', exact: true })
  await expect(brand.locator('[data-logo-mark]')).toHaveAttribute('src', '/brand/logo/mark.svg')
  await expect(brand.locator('[data-logo-wordmark]')).toHaveText('pdd-kit')
  await expect(brand.locator('img')).toHaveCount(1)

  // A deeper page is the same build: no lab there either.
  await page.goto('/docs')
  await expect(page.locator('[data-pdd-kit-theme-lab-bar]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /customization toolbars/i })).toHaveCount(0)
})
