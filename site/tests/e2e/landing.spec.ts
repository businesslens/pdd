import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile-chromium') {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }
  await page.route('https://github.com/**', route => route.abort())
})

test('renders the Product-Driven Development homepage', async ({ page, request }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Product-Driven Development for coding agents',
    exact: true
  })).toBeVisible()
  await expect(page.getByText('Open source', { exact: true })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pdd-kit.dev/')
  // Browser and install icons are one approved stable family.
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]'))
    .toHaveAttribute('href', '/brand/icons/favicon.svg')
  await expect(page.locator('link[rel="apple-touch-icon"]'))
    .toHaveAttribute('href', '/brand/icons/apple-touch-icon.png')
  await expect(page.locator('link[rel="manifest"]'))
    .toHaveAttribute('href', '/site.webmanifest')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://pdd-kit.dev/')
  await expect(page.locator('meta[property="og:image"]'))
    .toHaveAttribute('content', 'https://pdd-kit.dev/pdd-kit-social-card.png')
  await expect(page.locator('meta[name="description"]'))
    .toHaveAttribute('content', /^[^—–]*product model[^—–]*$/)
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/[—–]/)
  expect(new Set(bodyText
    .split('\n')
    .filter(line => /Product Models?/.test(line))))
    .toEqual(new Set(['Product Model']))
  // Three sections, nothing behind an interaction. The two inventories state
  // where the definition lives; the comparison is where the costs are answered.
  await expect(page.getByText('Product-Driven Development').first()).toBeVisible()

  // Where is your product model today? — asked after the artifact has been defined.
  await expect(page.getByText('Where is your product model today?')).toBeVisible()
  for (const place of [
    'Tickets', 'Design docs', 'The wiki', 'Chat threads',
    'UX tools', 'Source code', 'Tests', 'People'
  ]) {
    await expect(page.getByText(place, { exact: true }).first()).toBeVisible()
  }

  // The Product Model — every top-level resource type the format defines, not
  // a friendlier grouping. Product is deliberately absent: it names the thing
  // rather than a part of it. So are References, which attach to resources and
  // are not one. Scenarios are absent for a third reason: they are the only
  // types whose name names their parent, so a card beside Capabilities and
  // Journeys would show a child as a peer of the two things that own it.
  await expect(page.getByText('One definition of what your product does.')).toBeVisible()
  // Seven main collections, not ten equal cards: contained types such as
  // Experiences, Screens and Scenarios are left to the documentation, so a
  // child never sits beside the thing that owns it.
  for (const resourceType of [
    'Entities', 'Interfaces', 'Domains', 'Capabilities', 'Journeys', 'Business rules', 'Variations'
  ]) {
    await expect(page.getByText(resourceType, { exact: true }).first()).toBeVisible()
  }
  for (const example of ['Payment provider', 'Partner API', 'Browse and buy']) {
    await expect(page.getByText(example, { exact: true }).first()).toBeVisible()
  }

  // Before and after — a row's subject and both halves of it, because a section
  // showing only the answers renders fine and drops the entire point of having
  // one, and one showing no subjects loses the index the rows are scanned by.
  await expect(page.getByText('What changes with a product model.')).toBeVisible()
  await expect(page.getByText('Definition', { exact: true })).toBeVisible()
  await expect(page.getByText('Spread across many places')).toBeVisible()
  await expect(page.getByText('Written in one product model')).toBeVisible()
  await expect(page.getByText('Drift', { exact: true })).toBeVisible()
  await expect(page.getByText('Found when someone notices')).toBeVisible()
  await expect(page.getByText('Differences are easier to find')).toBeVisible()

  // The close: the principle, and the one instruction that acts on it. It sits
  // after the comparison rather than after the argument, which is what makes it
  // a conclusion rather than a second hero.
  await expect(page.getByText('AI agents and humans need a living product model.')).toBeVisible()

  // The PDD/SDD comparison belongs to /faq and the docs, not to this page.
  await expect(page.getByText('Different altitudes, meant to coexist.')).toHaveCount(0)

  const heroMap = page.getByRole('img', { name: /illustrated product model/ })
  await expect(heroMap).toBeVisible()
  const [desktopAsset, mobileAsset, socialAsset] = await Promise.all([
    request.get('/brand/heroes/product-model-wide.webp'),
    request.get('/brand/heroes/product-model-mobile.webp'),
    request.get('/pdd-kit-social-card.png')
  ])
  expect(desktopAsset.ok()).toBe(true)
  expect(desktopAsset.headers()['content-type']).toBe('image/webp')
  expect(mobileAsset.ok()).toBe(true)
  expect(mobileAsset.headers()['content-type']).toBe('image/webp')
  expect(socialAsset.ok()).toBe(true)
  expect(socialAsset.headers()['content-type']).toBe('image/png')

  // The three ways in are hero buttons rather than a section. Each opens its
  // steps before offering the corresponding route in the modal footer.
  const ways: Array<[string, string]> = [
    ['Map existing repo', '/docs/from-your-repo'],
    ['Start from a Blueprint', '/blueprints'],
    ['Start from an idea', '/docs/from-an-idea']
  ]
  for (const [label, href] of ways) {
    await page.locator('#start').getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog').locator(`a[href="${href}"]`).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  // The standing "Get started" call to action is viewport-dependent — it is in
  // the header above `lg` and inside the drawer below it — so the desktop and
  // mobile suites assert it where it actually renders.
})

interface BlueprintIndex {
  blueprints: Array<{ slug: string, title: string, logo: string }>
}

// The hero's pull-step picker lists the generated catalog and wears each
// Blueprint's own logo, as the record switcher does, rather than its shelf's
// icon; a logo that fails to load falls back to that icon. The picker opens
// after hydration, so it reads the generated `/_data/blueprints.json`.
test('the hero pull picker lists every Blueprint with its Product logo', async ({ page, request }) => {
  const { blueprints } = await (await request.get('/_blueprints/index.json')).json() as BlueprintIndex
  expect(blueprints).toHaveLength(15)
  const broken = blueprints.find(blueprint => blueprint.slug === 'kanban-board')!
  await page.route(`**/_blueprints/${broken.logo}`, route => route.fulfill({ status: 404 }))

  await page.goto('/')
  await page.locator('#start').getByRole('button', { name: 'Start from a Blueprint', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const trigger = dialog.getByRole('button', { name: /^Choose a Blueprint, currently / })
  await trigger.click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(blueprints.length + 1)
  for (const blueprint of blueprints.filter(entry => entry !== broken)) {
    await expect(menu.getByRole('menuitem', { name: blueprint.title, exact: false }).locator('img'))
      .toHaveAttribute('src', `/_blueprints/${blueprint.logo}`)
  }
  const fallback = menu.getByRole('menuitem', { name: new RegExp(broken.title) })
  await expect(fallback.locator('img')).toHaveCount(0)
  await expect(fallback.locator('.iconify')).toHaveCount(1)
  await expect(menu.getByRole('menuitem', { name: 'Browse all Blueprints' })).toHaveAttribute('href', '/blueprints')

  // Choosing one rewrites the command the reader copies.
  const chosen = blueprints.find(blueprint => blueprint.slug === 'url-shortener')!
  await menu.getByRole('menuitem', { name: new RegExp(chosen.title) }).click()
  await expect(menu).toHaveCount(0)
  await expect(trigger).toHaveAccessibleName(`Choose a Blueprint, currently ${chosen.title}`)
  await expect(dialog.getByText(`pdd-toolkit blueprint pull ${chosen.slug}`)).toBeVisible()
})

test('public SEO endpoints stay available', async ({ request }) => {
  // Nothing reads the head to find `/favicon.ico`, so the root fallback and
  // the stable icon family must both answer with the approved mark.
  const [rootFavicon, stableFavicon] = await Promise.all([
    request.get('/favicon.ico'),
    request.get('/brand/icons/favicon.ico')
  ])
  expect(rootFavicon.ok()).toBe(true)
  expect(await rootFavicon.body()).toEqual(await stableFavicon.body())

  const responses = await Promise.all([
    'favicon.svg',
    'favicon.ico',
    'favicon-32.png',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'maskable-icon-512.png'
  ].map(name => request.get(`/brand/icons/${name}`)))
  for (const response of responses) {
    expect(response.ok(), response.url()).toBe(true)
  }
  expect((await request.get('/site.webmanifest')).ok()).toBe(true)

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain('Sitemap: https://pdd-kit.dev/sitemap.xml')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const sitemapBody = await sitemap.text()
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/blueprints</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/blog</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/blog/introducing-pdd-kit</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/blog/your-agent-is-guessing</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/blog/pdd-and-spec-driven-development</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/changelog</loc>')
  expect(sitemapBody).toContain('<loc>https://pdd-kit.dev/privacy</loc>')
})

test('landing page has no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

/**
 * Both blog surfaces, because the interactive parts differ. The index is cards
 * that are each one big link — an author link nested inside one would be a
 * `nested-interactive` violation. The article adds icon-only share buttons, whose
 * only accessible name is an `aria-label`.
 */
test('the blog surfaces have no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const path of ['/blog', '/blog/introducing-pdd-kit']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations, `${path} should be violation-free`).toEqual([])
  }
})

test('the FAQ has no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/faq')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])

  // Answers are collapsed, so the scan above only saw the closed page. The
  // desktop suite opens one and scans again — an expanded panel is a tree this
  // page never otherwise renders.
  await expect(page.getByRole('button', { name: 'Is it fully open source?' })).toBeVisible()
  for (const name of ['Adopting it', 'What it is and isn\'t', 'Getting started', 'Trust and help']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  }
})

test('an unknown route renders the 404 page without a redirect', async ({ page }) => {
  const response = await page.goto('/no-such-page')
  expect(response?.status()).toBe(404)
  await expect(page).toHaveURL('/no-such-page')
  // The static host answers with the generated 404 shell, and the client renders
  // the error page into it; scan that page, not the empty shell.
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found · pdd-kit')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
