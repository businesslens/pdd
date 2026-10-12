import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const ORIGIN = 'https://pdd-kit.dev'

// Search and sharing crawlers read the generated head without hydrating Nuxt,
// so every assertion here is made against the HTML as served.
test.use({ javaScriptEnabled: false })

test.beforeEach(async ({ page }) => {
  await page.route('https://github.com/**', route => route.abort())
})

type JsonLdNode = Record<string, unknown> & { '@type': string }

async function structuredData(page: Page): Promise<JsonLdNode[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block) as { '@context': string, '@graph': JsonLdNode[] }
    expect(parsed['@context']).toBe('https://schema.org')
    return parsed['@graph']
  })
}

async function meta(page: Page, selector: string) {
  return page.locator(`meta[${selector}]`).getAttribute('content')
}

test('public pages state one title, description and image across search and link previews', async ({ page }) => {
  const routes = [
    '/',
    '/faq',
    '/privacy',
    '/changelog',
    '/blog',
    '/blog/introducing-pdd-kit',
    '/docs',
    '/docs/product-model'
  ]

  for (const path of routes) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)

    const canonical = `${ORIGIN}${path === '/' ? '/' : path}`
    await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute('href', canonical)
    expect(await meta(page, 'property="og:url"'), path).toBe(canonical)
    expect(await meta(page, 'property="og:site_name"'), path).toBe('pdd-kit')

    const title = await page.title()
    const ogTitle = await meta(page, 'property="og:title"')
    // The home page's preview drops the site name, which the card already shows.
    if (path === '/') expect(title).toContain(ogTitle!)
    else expect(ogTitle, path).toBe(title)
    expect(await meta(page, 'name="twitter:title"'), path).toBe(ogTitle)

    const description = await meta(page, 'name="description"')
    expect(description, path).toBeTruthy()
    expect(await meta(page, 'property="og:description"'), path).toBe(description)
    expect(await meta(page, 'name="twitter:description"'), path).toBe(description)

    const image = await meta(page, 'property="og:image"')
    expect(image, path).toMatch(new RegExp(`^${ORIGIN}/`))
    expect(await meta(page, 'name="twitter:image"'), path).toBe(image)
    expect(await meta(page, 'property="og:image:alt"'), path).toBeTruthy()
    expect(await meta(page, 'name="twitter:card"'), path).toBe('summary_large_image')

    const types = (await structuredData(page)).map(node => node['@type'])
    expect(types, path).toEqual(expect.arrayContaining(['Organization', 'WebSite']))
  }
})

test('a blog post is an article with its own image, date and breadcrumb', async ({ page }) => {
  const path = '/blog/introducing-pdd-kit'
  await page.goto(path)

  const heading = (await page.getByRole('heading', { level: 1 }).textContent())!.trim()
  const image = `${ORIGIN}/brand/heroes/product-model-wide.webp`
  expect(await meta(page, 'property="og:type"')).toBe('article')
  expect(await meta(page, 'property="og:image"')).toBe(image)
  expect(await meta(page, 'name="twitter:image"')).toBe(image)
  expect(await meta(page, 'property="og:image:alt"')).toBe(heading)
  const publishedTime = await meta(page, 'property="article:published_time"')
  expect(publishedTime).toMatch(/^\d{4}-\d{2}-\d{2}/)

  const graph = await structuredData(page)
  const article = graph.find(node => node['@type'] === 'BlogPosting')
  expect(article).toMatchObject({
    headline: heading,
    url: `${ORIGIN}${path}`,
    image: image,
    datePublished: publishedTime,
    publisher: { '@id': `${ORIGIN}/#organization` }
  })
  const breadcrumb = graph.find(node => node['@type'] === 'BreadcrumbList')
  expect(breadcrumb?.itemListElement).toEqual([
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${ORIGIN}/` },
    { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${ORIGIN}/blog` },
    { '@type': 'ListItem', 'position': 3, 'name': heading, 'item': `${ORIGIN}${path}` }
  ])
})

test('pages that are not articles stay websites without article metadata', async ({ page }) => {
  for (const path of ['/blog', '/docs/product-model']) {
    await page.goto(path)
    expect(await meta(page, 'property="og:type"'), path).toBe('website')
    await expect(page.locator('meta[property="article:published_time"]'), path).toHaveCount(0)
  }
})

test('a docs page carries a breadcrumb back to the docs index', async ({ page }) => {
  await page.goto('/docs/product-model')
  const breadcrumb = (await structuredData(page)).find(node => node['@type'] === 'BreadcrumbList')
  const items = breadcrumb?.itemListElement as { item: string }[]
  expect(items.map(item => item.item)).toEqual([
    `${ORIGIN}/`,
    `${ORIGIN}/docs`,
    `${ORIGIN}/docs/product-model`
  ])

  // The index is the Docs crumb itself: it describes nothing beyond the site.
  await page.goto('/docs')
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
})

test('the sitemap lists the public pages', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of ['/', '/blueprints', '/blueprints/kanban-board', '/docs', '/faq', '/blog']) {
    expect(sitemap).toContain(`<loc>${ORIGIN}${path}</loc>`)
  }
})

test('a Blueprint record states its own title, description and canonical URL', async ({ page }) => {
  const path = '/blueprints/kanban-board'
  const response = await page.goto(path)
  expect(response?.status()).toBe(200)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}${path}`)
  expect(await meta(page, 'property="og:url"')).toBe(`${ORIGIN}${path}`)
  expect(await page.title()).toBe('Kanban Board · Blueprints · pdd-kit')
  expect(await meta(page, 'name="description"')).toBeTruthy()
})

test.describe('client-side navigation', () => {
  test.use({ javaScriptEnabled: true })

  test('replaces the previous page\'s canonical, article tags and JSON-LD', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/blog/introducing-pdd-kit')
    await page.waitForLoadState('networkidle')
    await page.locator('footer a[href="/faq"]').click()
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page).toHaveTitle('FAQ · pdd-kit')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}/faq`)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${ORIGIN}/faq`)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="og:image"]'))
      .toHaveAttribute('content', `${ORIGIN}/product-model-open-graph.png`)
    await expect(page.locator('meta[property^="article:"]')).toHaveCount(0)
    const types = (await structuredData(page)).map(node => node['@type'])
    expect(types.sort()).toEqual(['Organization', 'WebSite'])
  })
})

test('every sitemap page answers 200 and links only to pages that exist', async ({ request }) => {
  test.slow()

  const sitemap = await (await request.get('/sitemap.xml')).text()
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc!).pathname)
  expect(pages.length).toBeGreaterThan(10)
  expect(new Set(pages).size, 'sitemap URLs are unique').toBe(pages.length)
  for (const path of pages) {
    expect(path === '/' || !path.endsWith('/'), path).toBe(true)
  }

  const linkedFrom = new Map<string, string>()
  for (const path of pages) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    for (const href of internalLinks(await response.text())) {
      if (!linkedFrom.has(href)) linkedFrom.set(href, path)
    }
  }

  const sitemapPages = new Set(pages)
  for (const [href, source] of linkedFrom) {
    if (sitemapPages.has(href)) continue
    const response = await request.get(href)
    expect(response.status(), `${href} (linked from ${source})`).toBeLessThan(400)
  }
})

function internalLinks(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)]
    .map(([, href]) => href!.replaceAll('&amp;', '&'))
    .filter(href => href.startsWith('/') && !href.startsWith('//'))
    .map(href => href.split(/[?#]/, 1)[0]!)
}
