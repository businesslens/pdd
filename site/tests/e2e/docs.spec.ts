import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { BRAND_WARM_SYNTAX_PALETTE } from '../../app/utils/syntaxTheme'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

test('renders the docs with a grouped sidebar and TOC', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.locator('header').getByRole('button', { name: 'Search' })).toBeVisible()
  await expect(page.locator('aside').getByRole('button', { name: 'Search' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'pdd-kit: Product-Driven Development for coding agents' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Introduction' }).first()).toBeVisible()

  await page.locator('aside a[href="/docs/cli-lint"]').click()
  await expect(page).toHaveURL(/\/docs\/cli-lint$/)
  await expect(page.getByRole('heading', { level: 1, name: 'pdd-kit lint' })).toBeVisible()
  await expect(page.getByText('On this page').filter({ visible: true })).toBeVisible()
})

test('keeps Experiences and Screens inside the Interfaces document', async ({ page }) => {
  await page.goto('/docs/interfaces')
  const aside = page.locator('aside').first()
  await expect(aside.locator('a[href="/docs/interfaces"]').first()).toBeVisible()
  await expect(aside.locator('a[href="/docs/experiences"], a[href="/docs/screens"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Experiences', exact: true })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Screens', exact: true })).toHaveCount(1)
  for (const topic of ['experiences', 'screens']) {
    await page.goto(`/docs/interfaces#${topic}`)
    await expect(page).toHaveURL(new RegExp(`/docs/interfaces#${topic}$`))
    await page.reload()
    await expect(page.locator(`#${topic}`)).toBeVisible()
  }
})

test.describe('docs link previews', () => {
  // Sharing crawlers consume the server-rendered head without hydrating Nuxt.
  test.use({ javaScriptEnabled: false })

  test('share the current homepage image and describe the linked document', async ({ page }) => {
    for (const path of ['/', '/docs', '/docs/product-model']) {
      const response = await page.goto(path)
      expect(response?.ok()).toBe(true)

      await expect(page.locator('meta[property="og:image"]'))
        .toHaveAttribute('content', 'https://pdd-kit.dev/product-model-open-graph.png')
      await expect(page.locator('meta[name="twitter:image"]'))
        .toHaveAttribute('content', 'https://pdd-kit.dev/product-model-open-graph.png')

      if (path === '/') continue

      const title = await page.title()
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(title).toMatch(/.+ · pdd-kit docs$/)
      expect(description).toBeTruthy()
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description!)
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description!)
    }
  })
})

/**
 * The sidebar lives in `layouts/docs.vue` for exactly this reason: rendered inside
 * the page it was rebuilt on every link, dumping the reader back at the top of a
 * list taller than the viewport.
 */
test('the sidebar keeps its scroll position across docs pages', async ({ page }) => {
  await page.goto('/docs')

  const aside = page.locator('aside').first()
  await aside.evaluate(el => el.scrollTo(0, el.scrollHeight))
  const offset = await aside.evaluate(el => el.scrollTop)
  expect(offset, 'the sidebar must overflow for this test to mean anything').toBeGreaterThan(0)

  // A link already inside the visible band: Playwright scrolls an off-screen
  // target into view before clicking, which would move the container itself.
  const href = await aside.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const link = [...el.querySelectorAll('a[href^="/docs/"]')].find((anchor) => {
      const rect = anchor.getBoundingClientRect()
      return rect.top > box.top + 40 && rect.bottom < box.bottom - 40
    })
    return link?.getAttribute('href')
  })

  await aside.locator(`a[href="${href}"]`).click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.locator('main h1')).not.toHaveText('pdd-kit: Product-Driven Development for coding agents')
  await expect.poll(() => aside.evaluate(el => el.scrollTop)).toBe(offset)
})

test('searches the docs', async ({ page }) => {
  await page.goto('/docs')
  await page.locator('header').getByRole('button', { name: 'Search' }).click()

  const search = page.getByRole('dialog')
  await search.getByRole('textbox').fill('pdd-verify')
  await expect(search.locator('a[href="/docs/skill-pdd-verify"]').first()).toBeVisible()
})

test('docs pages have no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/docs')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('Brand Warm code stays readable and matches between docs and landing', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('nuxt-color-mode')) localStorage.setItem('nuxt-color-mode', 'light')
  })

  const serverRendered = await page.request.get('/docs/installation')
  expect(serverRendered.ok()).toBe(true)
  const serverRenderedHtml = (await serverRendered.text()).toLowerCase()
  for (const color of [BRAND_WARM_SYNTAX_PALETTE.command, BRAND_WARM_SYNTAX_PALETTE.argument]) {
    expect(serverRenderedHtml).toContain(`--shiki-default:${color}`)
  }
  expect(serverRenderedHtml).not.toMatch(/--shiki-(?:deep-material|editorial|vs-code)/)

  const landingTokenColors = async () => {
    await page.goto('/')
    return page.locator('#start code [data-syntax-token]').evaluateAll(elements =>
      elements.map(element => getComputedStyle(element).color))
  }

  const docsTokenColors = async () => {
    await page.goto('/docs/installation')
    const block = page.locator('.docs-prose pre.shiki').filter({ hasText: 'npx pdd-toolkit install' })
    await expect(block).toBeVisible()

    return {
      background: await block.evaluate(element => getComputedStyle(element).backgroundColor),
      colors: await Promise.all([
        block.locator('code .line > span').filter({ hasText: 'npx' }).first()
          .evaluate(element => getComputedStyle(element).color),
        block.locator('code .line > span').filter({ hasText: 'pdd-toolkit' }).first()
          .evaluate(element => getComputedStyle(element).color)
      ]),
      allColors: await block.locator('code .line > span').evaluateAll(elements =>
        [...new Set(elements.map(element => getComputedStyle(element).color))])
    }
  }

  // The skill pages carry the agent command blocks; the Get started pages say
  // what to ask instead, so they no longer have one to sample. Their blocks list
  // several invocations, so each sample is one line: a bare skill (one token)
  // and a skill with an argument (two).
  // Skill invocations hold no regex metacharacters, so they go in as they are.
  const agentCommandLine = (command: string) => page.locator('pre.language-text code .line')
    .filter({ hasText: new RegExp(`^\\s*${command}\\s*$`) })
    .first()
  const agentDocsTokenColors = async () => {
    await page.goto('/docs/skill-pdd-map')
    const map = agentCommandLine('/pdd-map')
    await expect(map).toBeVisible()
    const mapColors = await map.locator('[data-syntax-token]').evaluateAll(elements =>
      elements.map(element => getComputedStyle(element).color))

    await page.goto('/docs/skill-pdd-verify')
    const verify = agentCommandLine('/pdd-verify current')
    await expect(verify).toBeVisible()

    return {
      map: mapColors,
      verify: await verify.locator('[data-syntax-token]').evaluateAll(elements =>
        elements.map(element => getComputedStyle(element).color))
    }
  }

  const rgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const luminance = (color: string) => {
    const [red, green, blue] = rgb(color).map((channel) => {
      const value = channel! / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
  }
  const contrast = (foreground: string, background: string) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
    return (values[0]! + 0.05) / (values[1]! + 0.05)
  }

  const lightDocs = await docsTokenColors()
  const lightLanding = await landingTokenColors()
  expect(lightLanding, 'Brand Warm differs between docs and landing').toEqual(lightDocs.colors)
  const agentDocs = await agentDocsTokenColors()
  expect(agentDocs.map, 'Brand Warm did not color the map invocation').toEqual([lightLanding[0]])
  expect(agentDocs.verify, 'Brand Warm differs on the verify invocation').toEqual(lightLanding)
  for (const color of lightDocs.allColors) {
    expect(contrast(color, lightDocs.background), `${color} is too faint on ${lightDocs.background}`)
      .toBeGreaterThanOrEqual(7)
  }

  await page.goto('/docs/feed-reader-example')
  await expect(page.locator('pre.language-text [data-syntax-token]')).toHaveCount(0)

  await page.goto('/docs/skill-pdd-verify')
  const multiLineAgentBlock = page.locator('pre.language-text')
    .filter({ hasText: '/pdd-verify report only' })
  await expect(multiLineAgentBlock.locator(':scope > code > .line')).toHaveCount(4)
})

test('keeps the FAQ on its dedicated route, outside normal docs', async ({ page, request }) => {
  await page.goto('/docs')
  await expect(page.locator('a[href="/docs/faq"]')).toHaveCount(0)
  await page.locator('header').getByRole('button', { name: 'Search' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('FAQ')
  await expect(dialog.locator('a[href="/docs/faq"], a[href="/faq"]')).toHaveCount(0)
  expect((await request.get('/docs/faq')).status()).toBe(404)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain('/docs/faq</loc>')
  expect(sitemap.match(/\/faq<\/loc>/g)).toHaveLength(1)
})
