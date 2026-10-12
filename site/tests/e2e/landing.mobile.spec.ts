import { expect, test, type Page } from '@playwright/test'
import { homeContent } from '../../app/utils/homeContent'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://github.com/**', route => route.abort())
})

/**
 * 320 is the narrowest width this site supports, 390 is the common phone, and
 * 767 is the last pixel before the loop takes its wheel back — the side of the
 * breakpoint that is never exercised by picking a device preset.
 */
const PHONE_WIDTHS = [320, 390, 767] as const

test('the footer does not overflow supported phone widths', async ({ page }) => {
  await page.goto('/')
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 })
    const dimensions = await page.locator('footer').evaluate(element => ({
      scroll: element.scrollWidth,
      client: element.clientWidth
    }))
    expect(dimensions.scroll, `footer overruns its width at ${width}px`)
      .toBeLessThanOrEqual(dimensions.client)
  }
})

/**
 * Nothing on the page may push the document sideways.
 *
 * Checked twice, because either alone is a weak test. `HomeLayout` wraps the
 * page in `overflow-hidden`, so a section that overruns its width is clipped
 * rather than reported at the document level — the section is measured for
 * that. The document is measured for anything that escapes the wrapper.
 */
async function expectNoHorizontalOverflow(page: Page, sectionId: string, at: number) {
  const document = await page.evaluate(() => ({
    scroll: window.document.documentElement.scrollWidth,
    client: window.document.documentElement.clientWidth
  }))
  expect(document.scroll, `the document scrolls sideways at ${at}px`)
    .toBeLessThanOrEqual(document.client)

  const section = await page.locator(`#${sectionId}`).evaluate(element => ({
    scroll: element.scrollWidth,
    client: element.clientWidth
  }))
  expect(section.scroll, `#${sectionId} overruns its width at ${at}px`)
    .toBeLessThanOrEqual(section.client)
}

test('mobile navigation opens and reaches the Blueprint catalog', async ({ page }) => {
  await page.goto('/')

  const header = page.locator('header')
  const brand = header.getByRole('link', { name: 'pdd-kit home' })
  await expect(brand.locator('[data-logo-mark]:visible')).toHaveCount(1)
  await page.setViewportSize({ width: 768, height: 800 })
  await expect(brand.locator('[data-logo-wordmark]')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(brand.locator('[data-logo-wordmark]')).toBeHidden()

  // The PDD release badge outlives the breakpoint that drops the wordmark: it
  // reads from the SDK, so a wrong number is worse than a hidden one, and the
  // narrowest phone still has room for it beside the bare mark.
  const version = header.locator('[data-pdd-version]')
  await expect(version.locator('[aria-hidden="true"]')).toHaveText(/^v\d+\.\d+\.\d+$/)
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(version).toBeVisible()
  await page.setViewportSize({ width: 390, height: 800 })

  // GitHub stays one tap away on a phone: its icon is in the header itself.
  await expect(header.getByRole('link', { name: 'pdd-kit on GitHub', exact: true }).first()).toBeVisible()
  await expect(header.getByRole('button', { name: 'Toggle color mode' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Open menu' }).click()

  const drawer = page.getByRole('dialog')
  await expect(drawer.getByRole('link', { name: 'Blog', exact: true })).toBeVisible()
  await expect(drawer.getByRole('link', { name: 'FAQ', exact: true })).toHaveAttribute('href', '/faq')
  await expect(drawer.getByRole('link', { name: 'Blueprints', exact: true })).toHaveAttribute(
    'href',
    '/blueprints'
  )
  await expect(drawer.getByRole('link', { name: 'Get started', exact: true })).toHaveAttribute(
    'href',
    '/docs'
  )
  // The logo already links home, and the footer already carries the changelog.
  await expect(drawer.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0)
  await expect(drawer.getByRole('link', { name: 'Changelog', exact: true })).toHaveCount(0)
  await expect(drawer.locator('[data-mobile-menu-utilities]')).toBeVisible()
  await expect(drawer.locator('[data-mobile-menu-utilities]').getByRole('link', { name: /^pdd-kit on GitHub/ })).toBeVisible()
  // Dark mode is off, so the drawer has no toggle.
  await expect(drawer.getByRole('button', { name: 'Toggle color mode' })).toHaveCount(0)
  await drawer.getByRole('link', { name: 'Blueprints', exact: true }).click()

  await expect(page).toHaveURL(/\/blueprints$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('mobile docs menu exposes the docs navigation', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.locator('header').getByRole('button', { name: 'Search' })).toBeVisible()

  await expect(page.getByRole('navigation', { name: 'Documentation sections' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Open menu' }).click()

  await expect(page.getByRole('dialog').locator('[data-slot="body"]').getByRole('button', { name: 'Search' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Model overview', exact: true })).toBeVisible()

  await page.getByRole('dialog').locator('a[href="/docs/cli"]').click()

  await expect(page).toHaveURL(/\/docs\/cli$/)
  await expect(page.getByRole('heading', { level: 1, name: /^(CLI reference|pdd-kit CLI)$/ })).toBeVisible()
})

/**
 * The complaint this covers: stacked, the comparison hid the two column
 * headings and left a reader to tell the problem from the answer by a shadow
 * and by which card came first.
 *
 * So the assertion is on words. Both sides are named, on every row, at every
 * supported phone width — and the words are the section's own labels rather
 * than strings retyped here, so the layout cannot pass by inventing a shorter
 * label that fits.
 */
test('the comparison names both sides of every row on a phone', async ({ page }) => {
  const { comparison } = homeContent
  await page.goto('/')

  const section = page.locator('#before-and-after')

  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 })

    // The wide table's headings are the other source for these words, and they
    // are display:none below `lg`. Exactly one of the two is on screen at any
    // width — never both, which would say it twice, and never neither, which is
    // the bug.
    await expect(section.getByRole('heading', { name: comparison.beforeLabel }))
      .toBeHidden()

    for (const side of ['before', 'after'] as const) {
      const label = side === 'before' ? comparison.beforeLabel : comparison.afterLabel
      const labels = section.locator(`[data-side="${side}"] .cmp-label:visible`)

      await expect(labels, `${side} labels missing at ${width}px`)
        .toHaveCount(comparison.rows.length)
      await expect(labels.first()).toHaveText(label)
    }

    // Both claims stay whole. An interaction-gated answer would satisfy the
    // label assertions above and still lose half the argument.
    for (const row of comparison.rows) {
      await expect(section.getByText(row.before.title, { exact: true })).toBeVisible()
      await expect(section.getByText(row.after.title, { exact: true })).toBeVisible()
    }

    await expectNoHorizontalOverflow(page, 'before-and-after', width)
  }
})

/**
 * The complaint this covers: below `md` the wheel was removed outright, and
 * with it went the direction and the return that make the three phases a loop
 * rather than a list.
 *
 * Order is asserted on the rendered heading sequence rather than on the painted
 * figure, because reading order is the thing that has to survive: a layout that
 * placed the phases correctly on screen while emitting them in another order
 * would pass a screenshot and fail a screen reader. The ring's own three names
 * are decorative and deliberately not counted here — they live inside an
 * `aria-hidden` figure, and asserting them as content would be asserting the
 * duplication this is built to avoid.
 */
test('the working loop shows the circuit and its return on a phone', async ({ page }) => {
  const { loop } = homeContent
  await page.goto('/')

  const section = page.locator('#the-loop')

  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 })

    await expect(section.getByRole('heading', { level: 3 }))
      .toHaveText(loop.phases.map(phase => phase.name))

    // The ring survives at phone width rather than being dropped, and it is
    // what carries the direction. Three names painted on it, none at `md`.
    await expect(section.locator('.loop-wheel-phase:visible')).toHaveCount(loop.phases.length)

    // The return, in words — the part a screen reader receives, and what makes
    // the last station Ideate rather than Verify.
    await expect(section.getByText(loop.returnNote)).toBeVisible()

    // Each phase keeps its runner and its note, unclipped.
    for (const phase of loop.phases) {
      await expect(section.getByText(phase.runner.label, { exact: true })).toBeVisible()
      await expect(section.getByText(phase.note, { exact: true })).toBeVisible()
    }

    await expectNoHorizontalOverflow(page, 'the-loop', width)
  }
})

/**
 * The `md` boundary itself, which is where a stack and a diagram trade places.
 *
 * 767 and 768 are asserted as a pair. The ring is on both sides of it, so what
 * changes hands is who says the order and the return: below, the dial's own
 * three names and the written line; above, the grid cells the phases sit in.
 * Neither width may show both — a name on the ring beside the same name in a
 * cell is the duplication this arrangement exists to avoid.
 */
test('the loop hands over cleanly at the md boundary', async ({ page }) => {
  const { loop } = homeContent
  await page.goto('/')

  const section = page.locator('#the-loop')

  await page.setViewportSize({ width: 767, height: 900 })
  await expect(section.getByText(loop.returnNote)).toBeVisible()
  await expect(section.locator('.loop-wheel-phase:visible')).toHaveCount(loop.phases.length)

  await page.setViewportSize({ width: 768, height: 900 })
  await expect(section.getByText(loop.returnNote)).toBeHidden()
  await expect(section.locator('.loop-wheel-phase:visible')).toHaveCount(0)
  await expect(section.getByRole('heading', { level: 3 }))
    .toHaveText(loop.phases.map(phase => phase.name))
  await expectNoHorizontalOverflow(page, 'the-loop', 768)
})

/**
 * Every section has to actually appear, on a short phone, with animation on.
 *
 * `useLandingMotion` renders the pre-animation state — `opacity: 0` — into the
 * SSR HTML, and a scroll trigger is the only thing that clears it. That makes a
 * trigger that cannot fire indistinguishable from a section that does not
 * exist: it is present in the DOM, correct in the accessibility tree, and
 * invisible. The comparison shipped that way to any handset under about 700px
 * tall, because an IntersectionObserver ratio is capped at the viewport's share
 * of the element and six stacked rows are far taller than a phone.
 *
 * Animation is re-enabled inside each test body, not through `test.use`. The
 * `beforeEach` at the top of this file calls `page.emulateMedia` directly, and
 * an explicit call beats a context option however the fixture was declared —
 * with `test.use` alone these three passed against the broken threshold, which
 * is the same way the bug survived in the first place. Under `reduce` the
 * composable returns a plain `animate` that always runs, so every other suite
 * here tests a path production visitors never take.
 */
test.describe('sections survive the scroll reveal', () => {
  // The short end of the range. 320×568 and 375×667 are the two that failed;
  // 390×844 passed on height alone and is kept so a regression cannot hide by
  // only breaking the sizes nobody tests.
  const HANDSETS = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 }
  ] as const

  for (const handset of HANDSETS) {
    test(`at ${handset.width}x${handset.height}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.setViewportSize(handset)
      await page.goto('/')

      // Each section is brought to rest on screen and then measured, rather
      // than sampled during a fast programmatic scroll. Stepping the page in
      // one loop outruns the observer — it coalesces callbacks, so a section
      // can be paged past between two deliveries and report a failure that is
      // about the test's scroll rate rather than about the trigger. Stopping on
      // each section asks the question that actually matters: with this on
      // screen, can the reader see it?
      for (const id of ['before-and-after', 'the-loop']) {
        const section = page.locator(`#${id}`)
        await section.scrollIntoViewIfNeeded()
        await page.waitForTimeout(900)

        const opacity = await section.evaluate(
          element => getComputedStyle(element).opacity
        )
        expect(Number(opacity), `#${id} never became visible at ${handset.width}x${handset.height}`)
          .toBeGreaterThan(0.99)
      }
    })
  }
})
