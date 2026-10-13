import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { homeContent } from '../../app/utils/homeContent'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

test('stays light, supports the hero command, and the routes out of the body', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')

  // Dark mode is off until it reads as well as light, so there is no toggle.
  await expect(page.locator('html')).toHaveClass(/light/)
  await expect(page.getByRole('button', { name: 'Toggle color mode' })).toHaveCount(0)

  // The shared install command leads the three ways in and can be copied.
  await page.getByRole('button', { name: 'Copy command' }).click()
  await expect(page.getByRole('button', { name: 'Command copied' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
    'npx pdd-toolkit install'
  )

  // The hero offers the three ways in and nothing broader. A Get started of its
  // own sat above them briefly: the header carries that route on every page, and
  // a second one beside the doors only asks the reader to choose between a door
  // and the corridor all three open onto.
  await expect(page.locator('#start').getByRole('link', { name: 'Get started', exact: true }))
    .toHaveCount(0)
  await page.locator('#start').getByRole('button', { name: 'Map existing repo' }).click()
  await expect(page.getByRole('dialog').locator('a[href="/docs/from-your-repo"]').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // Routes onward from the body: every box of information says where it
  // continues, in the same light corner link. Three lead into the documentation
  // and Today leads to the post that makes its argument at length, which is the
  // only place the labels differ. The close is a sub-hero rather than a box and
  // carries no corner link at all — one button, back to the doors, which exist
  // once at `#start`.
  await expect(page.locator('#product-model').getByRole('link', { name: 'View in docs' }))
    .toHaveAttribute('href', '/docs/product-model')
  await expect(page.locator('#today').getByRole('link', { name: 'Read blog' }))
    .toHaveAttribute('href', '/blog/your-agent-is-guessing')
  await expect(page.locator('#before-and-after').getByRole('link', { name: 'View in docs' }))
    .toHaveAttribute('href', '/docs')
  await expect(page.locator('#the-loop').getByRole('link', { name: 'View in docs' }))
    .toHaveAttribute('href', '/docs#the-development-loop')
  await expect(page.locator('#get-started').getByRole('link', { name: /View in docs|Read blog/ }))
    .toHaveCount(0)
  await expect(page.locator('#get-started').getByRole('link', { name: 'Get started' }))
    .toHaveAttribute('href', '#start')
  await expect(page.locator('#start')).toHaveCount(1)
})

test('keeps the approved identity fixed', async ({ page }) => {
  await page.goto('/')

  const header = page.locator('header')
  // Nothing sits above the header, so it pins itself to the top.
  expect(await page.evaluate(() => Number.parseFloat(getComputedStyle(document.querySelector('header')!).top))).toBe(0)

  // The lockup is the mark plus the PDD-KIT wordmark.
  const home = header.getByRole('link', { name: 'pdd-kit home' })
  const name = home.locator('[data-logo-wordmark] img[src$="/brand/logo/wordmark.svg"]')
  const mark = home.locator('img[src$="/brand/logo/mark.svg"]')
  await expect(name).toBeVisible()
  await expect(name).toHaveAttribute('alt', 'pdd-kit')
  await expect(name).toHaveCSS('height', '26px')
  await expect(mark).toHaveCSS('height', '34px')
  await expect(home.locator('img')).toHaveCount(2)

  const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]')
  await expect(favicon).toHaveAttribute('href', '/brand/icons/favicon.svg')
  await expect(page.locator('link[rel="manifest"]'))
    .toHaveAttribute('href', '/site.webmanifest')

  await page.reload()
  await expect(name).toBeVisible()
  await expect(mark).toBeVisible()
  await expect(favicon).toHaveAttribute('href', '/brand/icons/favicon.svg')
})

test('the header exposes its primary destinations without a resources menu', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('header')

  await expect(header.getByRole('link', { name: 'Blueprints', exact: true })).toHaveAttribute(
    'href',
    '/blueprints'
  )
  await expect(header.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute('href', '/docs')
  await expect(header.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('href', '/blog')
  await expect(header.getByRole('link', { name: 'FAQ', exact: true })).toHaveAttribute('href', '/faq')
  await expect(header.getByRole('link', { name: 'Get started', exact: true })).toHaveAttribute(
    'href',
    '/docs'
  )
  // The logo already links home, and the footer already carries the changelog.
  await expect(header.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0)
  await expect(header.getByRole('link', { name: 'Changelog', exact: true })).toHaveCount(0)

  await expect(header.locator('[aria-label^="pdd-kit on GitHub"]:visible')).toHaveCount(1)
  // Dark mode is off until it reads as well as light, so there is no toggle.
  await expect(header.locator('[aria-label="Toggle color mode"]')).toHaveCount(0)

  await header.getByRole('link', { name: 'Blog', exact: true }).click()

  await expect(page).toHaveURL(/\/blog$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()
})

test('blog lists the articles and renders a post', async ({ page }) => {
  await page.goto('/blog')

  // A card carries two destinations. The author goes to GitHub; the rest of the
  // card — including the parts covered only by the title link's pseudo-element —
  // goes to the post.
  const card = page.getByRole('article').filter({ hasText: 'Introducing pdd-kit' })

  await expect(card.getByRole('link', { name: 'Itai Gendler' })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler'
  )

  // The description is outside every anchor, so reaching the post from it proves
  // the overlay still covers the card after `to` was dropped.
  const overlaid = card.getByText('a shared product model that is git-tracked', { exact: false })
  await overlaid.scrollIntoViewIfNeeded()
  const box = (await overlaid.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

  await expect(page).toHaveURL(/\/blog\/introducing-pdd-kit$/)
  await expect(page.getByRole('heading', { level: 1, name: /^Introducing pdd-kit/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to blog' })).toBeVisible()
})

/**
 * The masthead carries four things the prose cannot: who wrote it, when, how
 * long it takes, and how to pass it on. Each is asserted separately because each
 * has its own way of quietly disappearing — an author without `to` drops the
 * profile link, an empty `toc.links` drops the rail, and `readingMinutes`
 * returning zero would render "0 minutes".
 */
test('an article carries its byline, reading time, share row, and heading rail', async ({ page }) => {
  await page.goto('/blog/introducing-pdd-kit')

  const article = page.getByRole('article')

  // The byline links to the author's GitHub profile, not to a page on this site.
  await expect(article.getByRole('link', { name: 'Itai Gendler' })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler'
  )
  await expect(article.locator('[data-slot="description"]').filter({ hasText: '@itai-gendler' })).toBeVisible()
  await expect(article.getByText('October 7, 2026')).toBeVisible()
  // Leading `[1-9]` rather than `\d`: the estimate rounding down to "0 minutes"
  // is the one way this renders and is still wrong.
  await expect(article.getByText(/\b[1-9]\d* minutes?\b/)).toBeVisible()

  // Share targets are built from the public origin, never the request URL.
  await expect(article.getByRole('link', { name: 'Share on X' })).toHaveAttribute(
    'href',
    /pdd-kit\.dev%2Fblog%2Fintroducing-pdd-kit/
  )
  await expect(article.getByRole('link', { name: 'Share on LinkedIn' })).toHaveAttribute(
    'href',
    /pdd-kit\.dev%2Fblog%2Fintroducing-pdd-kit/
  )
  await expect(article.getByRole('button', { name: 'Copy link' })).toBeVisible()

  const toc = page.getByRole('navigation', { name: 'In this article' })
  await expect(toc.getByRole('link', { name: 'What you get' })).toHaveAttribute('href', '#what-you-get')
})

test('the footer carries its license, its links, and the creator credit', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')

  // The license sits beside the mark; there is no company copyright line.
  await expect(footer.getByText('©')).toHaveCount(0)
  await expect(footer.getByRole('link', { name: 'MIT licensed', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler/pdd-kit/blob/main/LICENSE'
  )
  await expect(footer.getByText(/software teams/)).toHaveCount(0)
  await expect(footer.getByRole('link', { name: 'Changelog', exact: true })).toHaveAttribute('href', '/changelog')
  await expect(footer.getByRole('link', { name: 'FAQ', exact: true })).toHaveAttribute('href', '/faq')
  await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler/pdd-kit'
  )
  await expect(footer.getByRole('link', { name: 'Contributing', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler/pdd-kit/blob/main/CONTRIBUTING.md'
  )
  await expect(footer.getByRole('link', { name: 'Issues', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler/pdd-kit/issues'
  )
  await expect(footer.getByText('Created by Itai Gendler')).toBeVisible()
  // The personal accounts, distinct from the `GitHub` link above, which is the
  // project's repository.
  await expect(footer.getByRole('link', { name: 'Itai Gendler on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/itai-gendler'
  )
  await expect(footer.getByRole('link', { name: 'Itai Gendler on LinkedIn' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/itaig/'
  )

  // The columned footer advertised these; the header and the pages themselves
  // own them now.
  await expect(footer.getByRole('link', { name: 'About', exact: true })).toHaveCount(0)
  await expect(footer.getByRole('link', { name: 'Community', exact: true })).toHaveCount(0)
  await expect(footer.getByRole('link', { name: 'Blueprints', exact: true })).toHaveCount(0)

  await footer.getByRole('link', { name: 'Privacy', exact: true }).click()

  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
})

test('the standalone pages render their heroes', async ({ page }) => {
  const pages: Array<[string, string]> = [
    ['/changelog', 'Changelog'],
    ['/faq', 'FAQ']
  ]

  for (const [path, heading] of pages) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

/**
 * The FAQ ships in one arrangement now; the four that lost that comparison are
 * deleted. What is left to protect is not a choice but the content: an
 * arrangement that silently drops a section still renders, and only a test for
 * the words themselves would notice.
 *
 * The home page is still choosing — see the story arrangements suite below.
 */
test.describe('the marketing arrangements', () => {
  async function scan(page: import('@playwright/test').Page) {
    return new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
  }

  test('the FAQ carries all four groups and opens an answer', async ({ page }) => {
    await page.goto('/faq')

    for (const name of ['Adopting it', 'What it is and isn\'t', 'Getting started', 'Trust and help']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    }

    await page.waitForLoadState('networkidle')
    expect((await scan(page)).violations).toEqual([])

    // Answers start collapsed, which is the decision this arrangement carries.
    // An expanded panel is a different tree than the closed page ever renders,
    // so it is scanned on its own.
    await expect(
      page.getByText('Listing and pulling Blueprints are anonymous', { exact: false })
    ).toBeHidden()
    const multiRepositoryIssue = page.getByRole('link', {
      name: 'Follow the multi-repository support issue'
    })
    await expect(multiRepositoryIssue).toBeHidden()
    const storyReferencesLink = page.getByRole('link', { name: 'Link external work with references' })
    await expect(storyReferencesLink).toBeHidden()
    const prdReferencesLink = page.getByRole('link', { name: 'See how references work' })
    await expect(prdReferencesLink).toBeHidden()

    await page.getByRole('button', { name: 'Is it fully open source?' }).click()
    await expect(
      page.getByText('There is no plan to build a commercial product on top of it.', { exact: false })
    ).toBeVisible()

    await page.getByRole('button', { name: 'My product spans multiple repositories — is that supported?' }).click()
    await expect(multiRepositoryIssue).toBeVisible()
    await expect(multiRepositoryIssue)
      .toHaveAttribute('href', 'https://github.com/itai-gendler/pdd-kit/issues/17')

    await page.getByRole('button', { name: 'Why doesn\'t the product model have a user story resource type?' }).click()
    await expect(
      page.getByText('pdd-kit maps its lasting meaning instead', { exact: false })
    ).toBeVisible()
    await expect(storyReferencesLink).toBeVisible()
    await expect(storyReferencesLink).toHaveAttribute('href', '/docs/references')
    await expect(storyReferencesLink).toHaveAttribute('target', '_blank')
    await expect(storyReferencesLink).toHaveAttribute('rel', 'noopener noreferrer')

    await page.getByRole('button', { name: 'Isn\'t this just a fancy PRD?' }).click()
    await expect(
      page.getByText('No. A PRD and a Product Model are different artifacts with different jobs.')
    ).toBeVisible()
    const prdComparison = page.getByRole('table', { name: 'PRD and Product Model comparison' })
    await expect(prdComparison).toBeVisible()
    await expect(prdComparison.getByRole('rowheader', { name: 'Primary job' })).toBeVisible()
    await expect(
      prdComparison.getByText('Keep approved product intent and the implementation aligned over time')
    ).toBeVisible()
    await expect(prdReferencesLink).toBeVisible()
    await expect(prdReferencesLink).toHaveAttribute('href', '/docs/references')
    await expect(prdReferencesLink).toHaveAttribute('target', '_blank')
    await expect(prdReferencesLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect((await scan(page)).violations).toEqual([])
  })
})

test('the homepage and FAQ use the documentation reading color at a readable size', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nuxt-color-mode', 'dark'))
  await page.goto('/docs')

  const docsParagraph = page.locator('.docs-prose p').first()
  await expect(docsParagraph).toBeVisible()
  const docsStyle = await docsParagraph.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      color: style.color,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight)
    }
  })

  // Nuxt Content's prose paragraph is the reference treatment these marketing
  // pages should read like, not merely a color that happens to clear contrast.
  expect(docsStyle.fontSize).toBe(16)
  expect(docsStyle.lineHeight).toBe(28)

  const unreadable = async (path: string, selector: string, minimumSize: number) => {
    await page.goto(path)
    const paragraphs = page.locator(selector)
    expect(await paragraphs.count(), `${path} rendered no reading copy`).toBeGreaterThan(0)

    return paragraphs.evaluateAll((elements, reference) => elements.flatMap((element) => {
      const style = getComputedStyle(element)
      const fontSize = Number.parseFloat(style.fontSize)
      const failures = []
      if (style.color !== reference.color) failures.push(`color ${style.color}`)
      if (fontSize < reference.minimumSize) failures.push(`size ${fontSize}px`)
      return failures.length > 0
        ? [`${element.textContent?.trim().slice(0, 48)}: ${failures.join(', ')}`]
        : []
    }), { color: docsStyle.color, minimumSize })
  }

  // Runner chips are diagram labels, not paragraphs; everything else below the
  // homepage hero is reading copy. Cards may step down once, but never to the
  // 12px caption treatment this test replaced.
  expect(await unreadable('/', '.landing-page > div.mx-auto p:not(.loop-runner)', 14)).toEqual([])

  const titleStyle = (selector: string) => page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      color: style.color,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight
    }
  })
  expect(await titleStyle('#product-model article h3 a'))
    .toEqual(await titleStyle('#today article h3'))

  // The FAQ has no compact card tier: descriptions and expanded answers use
  // the docs paragraph size. The section index's "On this page" title is the
  // docs' own navigation label, not reading copy, and is excluded.
  expect(await unreadable('/faq', '.landing-page p:not(nav p)', 16)).toEqual([])
})

/**
 * The hero's three calls to action.
 *
 * Width is the whole problem here. From `xl` up the copy is pinned to `max-w-xl`
 * so the headline stays inside the scrim, so the plates are exercised at the
 * widths where they could break: the narrowest phone, a tablet, the `xl`
 * boundary where the constraint bites hardest, and a wide desktop.
 */
test('the hero call to action holds every width', async ({ page }) => {
  const WIDTHS = [390, 768, 1280, 1920] as const
  // Asserted by destination rather than by link text: two ways share the label
  // "View more in docs", and the href is what actually has to be right.
  const WAYS = {
    'from-your-repo': '/docs/from-your-repo',
    'from-a-blueprint': '/blueprints',
    'from-an-idea': '/docs/from-an-idea'
  } as const

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')

    // Checked before anything is opened: the failure mode is a row that does
    // not fit its column and pushes the document wider than the window instead
    // of wrapping.
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `the hero overflows horizontally at ${width}px`).toBeLessThanOrEqual(1)

    await expect(
      page.locator('#start').getByText(homeContent.hero.installCommand, { exact: true }),
      `the hero at ${width}px is missing the install command`
    ).toBeVisible()

    for (const [id, href] of Object.entries(WAYS)) {
      // The modal teleports out of `main`, and an open one covers the plates, so
      // each way is opened and dismissed in turn. Scoped to the dialog: an
      // unscoped href match finds the header nav item first — which is hidden
      // inside the collapsed menu at narrow widths.
      await page.locator(`[data-way="${id}"]`).first().click()
      await expect(
        page.getByRole('dialog').locator(`a[href="${href}"]`).first(),
        `the hero at ${width}px cannot reach ${href}`
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
  }
})

/**
 * The home page's three sections, in every comparison treatment.
 *
 * Expectations are read straight out of `homeContent` rather than hand-copied.
 * A section that quietly drops a row, or a comparison that renders only the
 * answers, still produces a plausible page — and only a test driven by the
 * source would notice it is arguing something shorter.
 *
 * Nothing is behind an interaction. An earlier version of this page hid half the
 * argument behind a switch, which is why the suite reads rather than presses.
 */
test.describe('the home page', () => {
  const WIDTHS = [390, 768, 1280, 1920] as const

  async function carriesTheWholeArgument(page: import('@playwright/test').Page, where: string) {
    for (const section of homeContent.sections) {
      const region = page.locator(`#${section.id}`)

      await expect(
        region.getByRole('heading', { name: section.title, exact: true }).first(),
        `${where} is missing the heading "${section.title}"`
      ).toBeVisible()
      for (const item of section.items) {
        await expect(
          region.getByRole('heading', { name: item.title, exact: true }).first(),
          `${where} is missing "${item.title}"`
        ).toBeVisible()
      }
      // Optional, and both sections currently go without one.
      if (section.verdict) {
        await expect(region.getByText(section.verdict, { exact: true })).toBeVisible()
      }
    }

    const { comparison } = homeContent
    const region = page.locator(`#${comparison.id}`)
    await expect(
      region.getByRole('heading', { name: comparison.title, exact: true }).first()
    ).toBeVisible()

    // Both halves of every row. A treatment showing only the answers would look
    // fine and would have dropped the entire point of the section.
    for (const row of comparison.rows) {
      for (const side of [row.before, row.after]) {
        await expect(
          region.getByRole('heading', { name: side.title, exact: true }).first(),
          `${where} is missing "${side.title}"`
        ).toBeVisible()
        await expect(
          region.getByText(side.description, { exact: true }).first(),
          `${where} is missing the line under "${side.title}"`
        ).toBeVisible()
      }
    }
  }

  test('carries the whole argument at every width', async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `overflows horizontally at ${width}px`).toBeLessThanOrEqual(1)

      await carriesTheWholeArgument(page, `at ${width}px`)
    }

    // Both colour modes, which the rest of the suite does not do. The
    // comparison signals before-and-after with elevation, and a shadow built
    // from the page's own darkness behaves differently on each ground — one
    // mode is not evidence for the other. Colour mode is a localStorage key, so
    // it is seeded before load.
    await page.setViewportSize({ width: 1280, height: 900 })
    // Dark mode is off; restore its pass when it returns.
    for (const scheme of ['light'] as const) {
      await page.addInitScript(value => localStorage.setItem('nuxt-color-mode', value), scheme)
      await page.goto('/')
      await expect(page.locator('html')).toHaveClass(new RegExp(scheme))
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(results.violations, `should be violation-free in ${scheme} mode`).toEqual([])
    }
  })

  /**
   * The two inventories are built to be read against one another, which only
   * works if a card is the same object in both. `homeContent.test.ts` caps note
   * lengths as a proxy; here it is measured.
   */
  test('an inventory card is one size within its own section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')

    // The cards directly: the column heading this used to hang off is gone.
    const heights = async (id: string) => page.evaluate((sectionId) => {
      const cards = document.querySelectorAll(`#${sectionId} article`)
      return [...cards].map(card => Math.round(card.getBoundingClientRect().height))
    }, id)

    const [today, model] = await Promise.all([heights('today'), heights('product-model')])

    // Not the same count — the sections run at different column widths and the
    // resource types are however many the format defines. `homeContent.test.ts`
    // where each is checked against its own grid.
    expect(today.length, 'Today rendered no cards').toBeGreaterThan(0)
    expect(model.length, 'the Product Model rendered no cards').toBeGreaterThan(0)
    expect(new Set(today).size, 'Today\'s cards differ in height').toBe(1)
    expect(new Set(model).size, 'the Product Model\'s cards differ in height').toBe(1)

    // The two are no longer held to *each other*. The resource types carry an
    // engraved band and Today's places carry none, so the Product Model's card is
    // taller by exactly that band — deliberately. `Entities` has no plate drawn
    // yet and still measures level, because the grid stretches every card to its
    // row; if that ever stops being true this is where it goes red. Within a section a ragged height still
    // means a note that wraps further than its neighbours, which is what this
    // test is really for. See `docs/brand.md`; dropping
    // the plates would restore the equality.
    expect(model[0], 'the resource types lost their band').toBeGreaterThan(today[0]!)
  })

  /**
   * Every resource type card opens its own documentation, and the whole box is the
   * target — the link sits on the title and is stretched over the card by an
   * `after` overlay.
   *
   * Two things are worth measuring rather than trusting. The href has to be the
   * one the content declares, and it has to *resolve*: these point into the pdd
   * docs collection, so a renamed page 404s silently and the card still looks
   * fine. And the corner has to be clickable, because the overlay is the only
   * thing making it so — lose it and the card degrades to a text link with no
   * visible change.
   */
  test('every resource type card opens its documentation, from anywhere on the card', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')

    const cards = page.locator('#product-model article')
    const count = await cards.count()
    expect(count, 'the Product Model rendered no cards').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const title = (await card.getByRole('heading').innerText()).trim()
      const link = card.getByRole('link', { name: title, exact: true })

      const href = await link.getAttribute('href')
      expect(href, `${title} is not a link`).toMatch(/^\/docs\/[a-z-]+$/)

      const response = await request.get(href!)
      expect(response.status(), `${title} points at a page that is not there`).toBe(200)
    }

    // The far corner of the first card, well clear of the title's own text: only
    // the stretched overlay can catch this.
    // Scrolled into view first: `boundingBox` reports document coordinates, and
    // clicking a point below the fold lands somewhere else entirely.
    const first = cards.first()
    await first.scrollIntoViewIfNeeded()
    const box = (await first.boundingBox())!
    await page.mouse.click(box.x + box.width - 10, box.y + box.height - 10)
    await expect(page, 'the card is not clickable away from its title')
      .toHaveURL(/\/docs\/[a-z-]+$/)
  })

  /**
   * The gutter names each row, and the word it costs comes out of the two cards
   * beside it — 56px of them, before the offsets. The failure that buys is
   * quiet: a title that fitted on one line wraps to two, and every card in that
   * row grows with it. `homeContent.test.ts` caps the strings as a proxy; this
   * measures what the browser actually did with them.
   */
  test('a labelled gutter still leaves every row one line of title', async ({ page }) => {
    const { comparison } = homeContent

    // 1024 is where the wide grid takes over and the gutter is least
    // affordable; 1280 is the width the section is read at.
    for (const width of [1024, 1280] as const) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const lines = await page.evaluate((id) => {
        const titles = document.querySelectorAll(`#${id} h4`)
        return [...titles].map((title) => {
          const style = getComputedStyle(title)
          return Math.round(title.getBoundingClientRect().height / parseFloat(style.lineHeight))
        })
      }, comparison.id)

      expect(lines.length, 'the comparison rendered no cards').toBe(comparison.rows.length * 2)
      expect(Math.max(...lines), `a card title wraps at ${width}px`).toBe(1)
    }
  })

  /**
   * The subject is what says the two cards beside it are one thing, so it is
   * content rather than ornament — a section that rendered six glyphs and no
   * words would look entirely correct and have lost the index the row set is
   * scanned by.
   */
  test('names every comparison row in the gutter', async ({ page }) => {
    const { comparison } = homeContent
    const region = page.locator(`#${comparison.id}`)

    // Both the stacked width, where the mark heads its pair, and the wide one
    // where it sits between them.
    for (const width of [390, 1280] as const) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      for (const row of comparison.rows) {
        await expect(
          region.getByText(row.subject, { exact: true }),
          `${row.subject} is missing at ${width}px`
        ).toBeVisible()
      }
    }
  })
})
