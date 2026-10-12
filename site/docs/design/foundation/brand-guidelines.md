# Brand Guidelines

read_when: changing brand assets, theme colors, typography, or marketing copy voice.

Status: Implemented. The approved identity is shared by every Nuxt host.

## Identity

- Name: **pdd-kit** (one word, capital B and L).
- Descriptor: *Machine-readable product knowledge for humans and coding agents.*
- Metaphor: a shared lens that reveals the product structure already present. The
  "lens" is not a magnifying glass and not a claim that pdd-kit replaces
  human understanding.

The open PDD format defines the product language. The public catalog at
`/blueprints` is the fastest demonstration of it: pull a Blueprint, hand it to a
coding agent, get a working product.

The visual register is a cartographer's atelier — warm, printed, surveyed. It
reads as a drafting table rather than a dashboard, which is the point: a Product
Model is something you author and survey, not telemetry you monitor.

## Color

Three stable ramps come from the sibling `@itai-gendler/pdd-kit/nuxt/theme` Layer, whose
source lives beside the OSS report renderer in the repository's `layers/`. The
site consumes that global theme and remains last in the CSS/configuration cascade, so it can
override any ramp or semantic token locally without forking the renderer:

| Ramp | Role | 500 | Why |
| --- | --- | --- | --- |
| `brass` | primary | `#b8965c` | the pdd-kit accent, drawn from the logo artwork |
| `terracotta` | secondary | `#ce5231` | distinct enough from brass that paired concepts (PDD beside SDD) read apart, while staying in the same warm family |
| `umber` | neutral | `#746651` | a warm brown-grey; Tailwind's `stone` reads too cool against brass and the parchment page backgrounds |

The shared theme's Nuxt UI aliases are primary=brass,
secondary=terracotta, success=green, info=sky, warning=amber, error=red, and
neutral=umber. Site-only prose configuration remains in `app/app.config.ts`.

**Brass at full strength fails WCAG AA on light backgrounds.** The shared theme
steps light mode down the ramp (`--ui-primary` → `primary-700`, `--ui-secondary` →
`secondary-700`, `--ui-success` → `success-700`, `--ui-text-dimmed` →
`neutral-500`), and the optional shared `@itai-gendler/pdd-kit/nuxt/theme-lab` tunes it
further per experimental background, because how far down the ramp you must go
depends on how dark that page is. Do not raise a
primary back to `-500` on a light surface without re-running the axe scan.

**Terracotta and green do not carry good-and-bad.** They were tried for it, on
the home page's before-and-after, twice — as filled cards and then as edges and
glyphs — and both were abandoned. `secondary` is a rust and `success` a cool
green, and a page built from brass, umber and parchment reads that pair as
borrowed from a form validation state rather than as part of the palette. It
does not matter how lightly they are applied.

What the two attempts left behind, and what generalises:

- **Never let text contrast depend on a tint.** Cards inside a washed panel sit
  on `bg-default`, so the wash is free to be as strong as it needs to be.
- **Mute with a type colour, never with `opacity`.** An opacity below about 80%
  drops `text-highlighted` under AA on the parchment grounds, and axe cannot
  catch it — it evaluates the declared colour, not the composite.
- **Terracotta needs roughly half again the alpha green does** to read at the
  same strength, being a near neighbour of the parchment grounds. Recorded in
  case either is ever used at scale again.

**Emphasis without a second hue.** What the home page does instead: two weights
of the same ink, a brass accent on one side only, engraver's hatching, a brass
seal, or elevation. Four of the five survive a greyscale print — a stronger
guarantee than a colour-blind-safe palette, and one this brand can make because
its illustrations are engravings to begin with.

Terracotta and green are still stepped for light mode in the shared theme. That was
correct as a systemic fix — `terracotta-500` measures about 4.5:1 on parchment
and `success-700` about 4.2:1, both at or under the AA boundary — and it stands
whether or not this page uses them.

Decorative accents live in `app/assets/brand/tokens.css`: `--brand-glow-a/b`,
`--brand-gradient`, `--brand-shimmer`. They derive from the
brass and terracotta ramps so accents move with the palette rather than drifting
from it. Add a new accent by deriving it from a ramp, never by hard-coding a hex.

## Typography

| Face | Token | Use |
| --- | --- | --- |
| Archivo Variable | `--brand-font-heading` | headings |
| Inter Variable | `--font-sans` | UI and body |
| IBM Plex Mono | `--font-mono` | code, ids, digests, commit hashes |

The heading face is deliberately **not** a Tailwind `--font-*` theme key. Nuxt
Fonts treats every `--font-*` entry in `@theme` as a family to resolve through
its providers and fails to read metrics for "Archivo Variable", which kills the
build with `Unknown font format`. There is therefore no `font-heading` utility;
the shared theme's base rule applies the face to every heading instead.
`--brand-font-heading` is a site alias of
`--pdd-kit-font-heading`; neither belongs in `@theme`, where it would make
Nuxt Fonts try to resolve it and break `pnpm generate`.

## Assets

The site's active hero and resource/entry-path plates live in `public/brand/`;
the social preview is `public/product-model-open-graph.png`. Retired mascot,
illustration, social variants, and unused source-format copies are removed.
The approved mark, wordmark, favicon family, and install icons
live in the packaged `@itai-gendler/pdd-kit/nuxt/theme` Layer. Nuxt copies them into
each host's own build, so deployments share one identity source without a
runtime dependency on one another. The site carries no local logo copies or
identity selectors.

The stable theme exposes the canonical artwork at `/brand/logo/mark.svg` and
`/brand/logo/wordmark.svg`, with `-dark` twins, and the icon family under
`/brand/icons/`. Its head composable registers the stable favicon, Apple icon,
and `/site.webmanifest`. Regenerate the family from the repository root with
`pnpm theme:icons` after redrawing the approved mark. The generator also writes the
unversioned `/favicon.ico` path that crawlers hit without reading the head.

Only the SVG favicon adapts to the browser's colour scheme, through a
`prefers-color-scheme` rule generated from the two twins. The `.ico` and PNG
fallbacks cannot, so they carry the light drawing; install icons sit on an opaque
paper plate because a transparent maskable icon is rejected and iOS composites
`apple-touch-icon` on black.

**The logo is settled.** The Bare mark and Stamp wordmark are the pdd-kit
identity in both light and dark mode. They are not cookie-backed and cannot be
changed by the theme lab. The lab continues to audition backgrounds only.

## Voice

- Say what the product does, in the reader's terms. The homepage leads with the
  problem (a prompt is history, a codebase shows compromises) before naming the
  format.
- Use the vocabulary in [`CONTEXT.md`](../../../CONTEXT.md) exactly. Marketing
  copy is where retired words like "Hub" and "Explore" resurface first.
- No pricing, commercial tiers, waitlists, or "request access". Monetization is
  paused and the catalog is anonymous.
