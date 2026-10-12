import { expect, test } from '@playwright/test'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

/**
 * `rss.test.ts` covers what the feed says; this covers the generated file a
 * reader receives. The feed is a static file, so its HTTP headers are the
 * host's: only an XML content type is required of it here.
 */
test('the blog feed is served as RSS, with the published posts newest first', async ({ request }) => {
  const response = await request.get('/blog/rss.xml')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^application\/(rss\+)?xml\b/)

  const xml = await response.text()
  expect(XMLValidator.validate(xml)).toBe(true)
  expect(xml).not.toContain('<lastBuildDate>')
  expect(xml).toContain('<atom:link href="https://pdd-kit.dev/blog/rss.xml" rel="self"')

  // The channel link leads, then one per item. Every URL is the public origin's,
  // never this test server's, because the feed outlives the host that served it.
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(match => match[1])
  expect(links).toEqual([
    'https://pdd-kit.dev/blog',
    'https://pdd-kit.dev/blog/introducing-pdd-kit',
    'https://pdd-kit.dev/blog/pdd-and-spec-driven-development',
    'https://pdd-kit.dev/blog/your-agent-is-guessing'
  ])

  // Removed slugs are not posts and must never reappear in the feed.
  expect(xml).not.toContain('/blog/product-driven-design')
  expect(xml).not.toContain('/blog/the-missing-standard-for-product-knowledge')

  // Highlighting is this site's stylesheet talking. It cannot travel with the
  // feed, so the code blocks are rebuilt from source before they leave.
  expect(xml).not.toContain('shiki')
  expect(xml).toContain('<pre><code class="language-bash">')
})

test('the blog advertises its feed to readers and to clients', async ({ page }) => {
  await page.goto('/blog')

  // Absolute: a reader saving the feed from this page should save the public
  // URL, not whichever host rendered the HTML.
  await expect(
    page.locator('link[rel="alternate"][type="application/rss+xml"]')
  ).toHaveAttribute('href', 'https://pdd-kit.dev/blog/rss.xml')

  // Same-origin but deliberately a full-document anchor. The target is XML, and
  // a client-side navigation would hand it to the Vue router as if it were a page.
  await expect(page.getByRole('link', { name: 'Follow via RSS' })).toHaveAttribute(
    'href',
    '/blog/rss.xml'
  )

  // An article is where most readers arrive, so the discovery link is there too.
  await page.goto('/blog/introducing-pdd-kit')
  await expect(
    page.locator('link[rel="alternate"][type="application/rss+xml"]')
  ).toHaveAttribute('href', 'https://pdd-kit.dev/blog/rss.xml')
})

test('every blog entry identifies its cover image and serves the referenced asset', async ({ request }) => {
  const response = await request.get('/blog/rss.xml')
  const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' }).parse(await response.text())
  expect(parsed.rss['@xmlns:media']).toBe('http://search.yahoo.com/mrss/')
  const expectedCovers = new Map([
    ['introducing-pdd-kit', '/brand/heroes/product-model-wide.webp'],
    ['pdd-and-spec-driven-development', '/blog/pdd-and-spec-driven-development.webp'],
    ['your-agent-is-guessing', '/blog/ai-writing-code-for-products.webp']
  ])
  expect(parsed.rss.channel.item).toHaveLength(expectedCovers.size)
  for (const item of parsed.rss.channel.item) {
    const slug = new URL(item.link).pathname.split('/').at(-1)!
    const path = expectedCovers.get(slug)!
    expect(path).toBeDefined()
    const url = `https://pdd-kit.dev${path}`
    expect(item['media:content']).toEqual({ '@url': url, '@medium': 'image' })
    expect(item['media:thumbnail']).toEqual({ '@url': url })
    expect(item['content:encoded']).toContain(`<img src="${url}"`)
    const image = await request.get(path)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toBe('image/webp')
    expect((await image.body()).length).toBeGreaterThan(0)
  }
})
