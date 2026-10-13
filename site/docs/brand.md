# Brand and UI

read_when: changing colours, typography, brand assets, home page copy or
layout, or a pattern shared across pages.

## Identity

- Name: **pdd-kit**, always lower case. The practice is Product-Driven
  Development (PDD), written out on first use on a page.
- The visual register is a cartographer's atelier: warm, printed, engraved. A
  Product Model is something you author and survey, not telemetry you monitor.

## Colour

Three ramps come from the `pdd-toolkit/nuxt/theme` Layer
(`../layers/nuxt/theme`). The site loads last in the cascade, so it can override
any token locally.

The page background is the site's own, in `app/assets/css/main.css`: warm
paper (`--ui-bg: #f4ecdb`) with grain and light pooling at the top, and cards
lighter than the page. Its text and border steps are set with it, and the
`theme-color` meta in `app.vue` matches `--ui-bg`. The site is light only.

| Ramp | Role | 500 |
| --- | --- | --- |
| `brass` | primary | `#b8965c` |
| `terracotta` | secondary | `#ce5231` |
| `umber` | neutral | `#746651` |

Nuxt UI aliases: primary=brass, secondary=terracotta, success=green, info=sky,
warning=amber, error=red, neutral=umber.

- **Brass at full strength fails WCAG AA on light backgrounds.** Light mode steps
  down the ramp (`--ui-primary` → `primary-700`, `--ui-secondary` →
  `secondary-700`, `--ui-success` → `success-800`; `--ui-text-dimmed` is
  darkened). Do not raise a primary back to `-500` on a
  light surface without re-running the axe scan.
- **Terracotta and green do not carry good and bad.** Red/green reads as a form
  validation state on parchment. Show emphasis with ink weight, a brass accent,
  or elevation instead.
- **Never let text contrast depend on a tint.** Cards inside a washed panel sit
  on `bg-default`.
- **Mute with a text colour, never with `opacity`.** Opacity below about 80%
  drops text under AA on parchment, and axe cannot catch it.
- Decorative accents (`--brand-glow-a/b`, `--brand-gradient`,
  `--brand-shimmer`) live in `app/assets/brand/tokens.css` and derive from the
  ramps. Add an accent by deriving it from a ramp, never by hard-coding a hex.

## Typography

| Face | Token | Use |
| --- | --- | --- |
| Archivo Variable | `--brand-font-heading` (alias of `--pdd-kit-font-heading`) | headings |
| Inter Variable | `--font-sans` | UI and body |
| IBM Plex Mono | `--font-mono` | code, ids, digests, commit hashes |

**The heading face is not a Tailwind `--font-*` theme key.** Nuxt Fonts treats
every `--font-*` entry in `@theme` as a family to resolve and fails on "Archivo
Variable" with `Unknown font format`, breaking `pnpm generate`. There is no
`font-heading` utility; the theme's base rule applies the face to headings.

## Assets and icons

- The mark (`/brand/logo/mark.svg`), the PDD-KIT wordmark
  (`/brand/logo/wordmark.svg`), the README lockup (`/brand/logo/lockup.svg`)
  and the heavier browser-tab cut (`/brand/logo/tab.svg`), each with a `-dark`
  twin, the favicon family
  (`/brand/icons/`, `/favicon.ico`) and `/site.webmanifest` live in the theme
  Layer; Nuxt copies them into the build. The site keeps no local logo copies.
  Regenerate the icon family from the repository root with `pnpm theme:icons`.
- Only the SVG favicon follows the colour scheme; `.ico` and PNG fallbacks carry
  the light drawing, and install icons sit on an opaque paper plate.
- Site artwork lives in `public/brand/` (hero, door plates, resource-type
  plates, the missing-piece illustration). The social card is
  `public/product-model-open-graph.png`.

## Voice

- Say what the product does, in the reader's terms. Lead with the problem before
  naming the format.
- Use [`CONTEXT.md`](../CONTEXT.md) vocabulary exactly.
- No pricing, tiers, waitlists, sign-up or "request access", and no hint of
  a future paid plan or hosted service.
- pdd-kit is an open-source project by one maintainer and its contributors,
  not a company. Address one developer and their coding agent, never a team
  or an organization; the maintainer writes as "I", not "we".
- Questions (FAQ, privacy) lead with the reader's concrete situation, keep
  jargon out of the question, and put the mechanism after the answer.
- The blog argues; the docs define. Each post is written for one channel, so
  posts do not restate each other; a new post replaces one rather than joining
  them.

## Home page and copy

See [ADR-0002](./adr/0002-the-home-page.md) for the hero, doors and collections.

- **Nothing is sold.** Every exit leads to the catalog, the docs or GitHub. A
  dead end is a bug.
- **Section order is the argument:** Product Model, then *Where is your product
  model today?*, then the missing-piece section, the comparison, the loop, and
  the close. The artifact is defined before the reader is told they lack one,
  and section two names no tooling (`product-model/`, CLI, validation). Both
  are asserted in `tests/integration/homeContent.test.ts`.
- **Copy lives in `app/utils/homeContent.ts`**; FAQ copy in `../docs/faq.md`.
  Components render it and never reword it.
- **Brand marks** (Today's cards): the `logos` Iconify collection with
  `mode="svg"` so owners' colours survive; the `-icon` variant wherever one
  exists; no mark twice; at most three per card. Near-black marks are inverted
  in dark mode through `HomeCard`'s `INK_MARKS`; a mark that is merely
  low-contrast is replaced, not inverted. Each linked mark carries an
  `aria-label` with its name, since a tooltip does not name a link. People uses
  the `users` glyph, unlinked and hidden.
- **One link per box**, top right, in the dimmed mono label face (`MoreLink`):
  *View in docs* or *Read blog*. `more` is required, and destinations are
  distinct. The close panel carries none; its one button goes to `#start`.
- **Comparison rows** pair a cost with its answer in one `ComparisonRow`, so
  neither can be added alone. The answer is raised with `shadow-lg` tinted
  `--ui-border-accented`; the problem lies flat. Depth, not red and green.
- **Resource-type plates** fill a 16:9 band (`aspect-video`, `object-cover`) on
  16:9 sheets, so nothing crops. Parchment stays parchment in dark mode. If a
  plate needs to sit larger or smaller, redraw it; do not zoom.
- **The FAQ answers situations, not vocabulary.** Answers start collapsed; every
  question has its own `/faq#<slug>`, written on open and opened on load.

## Shared UI rules

- **One layout.** `app/layouts/default.vue` is the shell: header, `<main>`,
  footer. The docs layout nests inside it to keep its sidebar mounted.
- **Head ownership.** `app.vue` calls `useSiteSeoDefaults` (default title,
  canonical, social image, site JSON-LD). Pages call `useSiteSeo`, which writes
  search tags, Open Graph and the Twitter card together.
- **Motion settles under reduced motion.** The first screen uses a CSS entrance
  (`.landing-enter`) and never waits for hydration. Scroll motion from
  `useLandingMotion` resolves to a zero-duration animation, because the
  generated HTML carries the pre-animation state inline.
- **Whole-card links** use the title anchor's `after:absolute after:inset-0`
  overlay against the card's `relative` root. Never nest an interactive element
  inside another (axe `nested-interactive`): a card with a second link lifts
  only that link with `z-10`.
- **Shortcuts.** Documentation search is ⌘/Ctrl+K; on Blueprint report pages the
  report keeps ⌘/Ctrl+K and docs search moves to ⌘/Ctrl+Shift+K.
- **Blog cards** put the date in the byline at the foot, not above the title.
  The author links to their GitHub profile and is the one element lifted over
  the card's overlay.
- **The changelog is rendered as-is**: never summarized or copied. Old entries
  use current names, and the retired product name never appears.
- **404** is `app/error.vue` inside the site shell, generated as `404.html`, the
  same page for every unmatched path.
- **Privacy** leads with the reader's question and says plainly that nothing
  tracks them. The site sets no cookies; it lists what the browser's local and
  session storage keep.
- **Nuxt UI v4 first.** Reach for a Nuxt UI component before hand-rolling one.
- **Accessibility.** Every Playwright page suite runs an axe WCAG 2.0/2.1 A/AA
  scan; new pages must be violation-free.
