# UI Design Reference

read_when: changing screens, shared UI patterns, or state coverage.

> The screen documents reflect the current implementation. Update them when a
> route, meaningful state, overlay, or shared visual pattern changes.

## Screen Specifications

One document per surface. Each owns intended behavior and names every
implemented state.

| Prefix | Surface | Routes |
| --- | --- | --- |
| `MKT` | [Marketing](./marketing-screens.md) | `/`, `/contact`, `/faq` |
| `CAT` | [Blueprint catalog](./catalog-screens.md) | `/blueprints`, `/blueprints/:slug` |
| `DOC` | [Documentation](./documentation-screens.md) | `/docs/**` |
| `WRT` | [Blog and changelog](./writing-screens.md) | `/blog`, `/blog/:slug`, `/changelog` |
| `LEG` | [Legal and trust](./legal-screens.md) | `/privacy` |

`SYS` is reserved for [system screens](./system-screens.md) — error states and
specimens, not a product experience.

## Shared Patterns

- **One layout.** `app/layouts/default.vue` is the whole shell: an optional
  `PreviewBar`, `landing/Header.vue`, a `<main>` slot, and `landing/Footer.vue`.
  There is no dashboard shell, no sidebar, and no application switcher. The
  catalog pages use this same layout.
- **Head ownership follows the concern.** `app.vue` owns the default title and
  description, the canonical URL, the default link-preview image and the
  site-wide `Organization`/`WebSite` JSON-LD (`useSiteSeoDefaults`); calling it
  there keeps the helper in the entry chunk rather than costing the home page a
  module preload. Pages state their title, description and,
  where they have them, their own image, article date and page JSON-LD through
  `useSiteSeo`, which writes the search tags, Open Graph and the Twitter card
  together so they cannot disagree. The stable theme owns the approved logo,
  wordmark, favicon, and install icons; the shared theme-lab composables own
  only background and visibility attributes. The site overrides the lab state at
  the host boundary: background selections survive while authoring on loopback,
  while a deployed origin ignores every lab cookie and renders only declared
  defaults.
- **Background variants are shared page appearance, not landing chrome.** Both
  light and dark selections are always applied as html attributes by the lab,
  and its `:not(.dark)` / `.dark` selectors decide which is visible. Toggling
  color mode never discards the other choice.
- **Visual selections are a local authoring tool.** The background and
  preview-bar choices use `useCookie` in the dev server on loopback. Generated
  pages always paint the declared defaults. The identity has no selection state.
- **The lab has one shared background row.** The missing-piece layout, image,
  copy, and table-header comparisons are settled. The host declares one row,
  and the header pins to
  `--pdd-kit-theme-lab-height`. The local report viewer declares one row
  and gets the correct independent offset. The site enables the lab only for
  local development and explicit loopback browser tests; production renders no
  bar or toggle.
- **One row per open question.** A row exists while a decision is live and goes
  when it is made. Host-only questions stay in host slots; a question moves to
  the shared lab registry only when both products need to audition it.
- **A finished comparison is deleted, not parked.** The blog post and the FAQ
  each ran a five-way comparison behind a Layout row and now ship one
  arrangement; the losers are gone and so is the row. A variant kept "just in
  case" is a variant nobody re-checks for accessibility. The home page settled
  its shape the same way over four rounds, deleting each round's losers before
  the next began, and the blog index, hero CTA, hero cover, changelog bullets,
  and synthetic catalog have since settled too. Only the shared background row
  remains.
- **Flat nav, no section tabs.** Docs and changelog are each one surface, so the
  sidebar clusters by `group` frontmatter and the header nav stays flat. The
  section tabs existed only to switch between open source and Platform; the
  Platform is not part of this product, so they went with it.
- **The first screen never waits for hydration.** `enterMotion` is a CSS
  keyframe entrance (`.landing-enter`), so the hero and page headings paint from
  the generated HTML and reduced motion is honoured in CSS.
- **Scroll motion resolves to a resting state under reduced motion.**
  `scrollMotion` and `staggerMotion` return a zero-duration animation rather
  than no animation, because the generated HTML carries their pre-animation
  state inline — skipping the animation entirely would leave those sections
  invisible.
- **Nuxt UI v4 first.** Reach for a Nuxt UI component before hand-rolling one.
  Semantic colors come from the shared `@itai-gendler/pdd-kit/nuxt/theme` Layer; see
  [brand guidelines](../foundation/brand-guidelines.md) before introducing a new
  color or accent.
- **Drill-in records share tab state through `?tab=`,** so a record view is a
  shareable URL and a reload lands on the same tab. The default tab is spelled by
  the absence of the parameter, not by naming it.

## Accessibility

Every Playwright page suite runs an axe WCAG 2.0/2.1 A/AA scan, and new pages
must be violation-free. The palette makes this a live constraint rather than a
formality: brass at full strength fails AA on light backgrounds, so light mode
steps down the ramp per page. Re-run the scan after any change to a background
variant or a primary-colored control.
