# Catalog Screens

read_when: changing the Blueprint listing or the Blueprint record.

The catalog is the product surface. Everything else on the site explains it.

Both screens are generated with the site from the repository's `blueprints/`,
so every visitor gets the same HTML and the list never arrives late.

## CAT-01 — Blueprint catalog

Route: `/blueprints`

The hero, then the listing, set close beneath it: search, a result row, and the
grid. `CatalogLayout` uses this one layout at every size — see
[ADR-0019](../../adr/0019-the-catalog-index-has-one-layout.md). A catalog
spanning more than one category also gets the category sidebar from `lg`; below
`lg` the toolbar's category select takes its place. The invitations sit in the
sidebar from `lg` and after the grid below it, or after the grid at every width
when there is no sidebar.

Two states replace the listing:

- **Empty** — a catalog with no Blueprints gets an empty state with **Request a
  Blueprint** and **Submit a Blueprint**.
- **Unavailable** — if the generated Blueprint data cannot be loaded, the hero is
  followed by an alert saying so, and the rest of the site keeps working.

The listing uses the site's content width, so cards stay at most three across and
line lengths stay readable on wide screens.

Search and category are written to `?q=` and `?category=` with `replace`, so a
filtered listing survives a reload and a trip to a record and back. Search is
case-insensitive across title, summary, category, the category's shelf label,
and tags. The result row reads "8 Blueprints" until something narrows it, then
"3 results" with **Clear filters** beside it. A search with no matches shows an
empty state whose **Clear filters** resets search and category in place.

The hero places an icon-only RSS link beside the **Blueprints** label, with
**Follow via RSS** as its accessible name and tooltip. Unlike the Blog,
Changelog, FAQ and Contact heroes, which open on the bare page name, this one
keeps the caps label over its two-line promise, the same way the home page keeps
its eyebrow. It links to
`/blueprints/rss.xml` with a full navigation because the response is XML. Both
the listing and record pages advertise the absolute feed URL through a
`rel="alternate"` RSS link in the document head. The feed follows the entire
catalog regardless of the page's search or category filter.

Each card shows its category, title, summary, and the five resource counts.
Counts wrap between themselves, never inside one. A footer names where the card
goes — **View Blueprint**. Tags are searchable but not shown, and
published freshness is left off: neither helps a reader choose, and a relative
date would go stale in a generated page.

**The whole card is one link**, including the artwork: the title's anchor carries
a stretched pseudo-element, and nothing between it and the `<article>` is
positioned. A hit area that stops at the artwork/body seam is the regression to
watch for — the artwork is the largest thing on a card and the first thing a
reader aims at.

**The artwork is the Blueprint's engraved cover** when it has one, edge to edge
at 16:9, in the house style of the blog covers, with the category icon as its one
badge on the seam
([ADR-0021](../../adr/0021-catalog-cards-show-the-blueprint-cover.md)). The cover
identifies the product; the category badge and the label say which shelf it sits
on. A Blueprint without a cover shows its logo large on its category's tint
instead, with the category icon as its one badge
([ADR-0020](../../adr/0020-catalog-cards-wear-the-product-logo.md)); without a
logo either, its category icon large. The card draws no picture of the product's
screens and nothing on it moves.

| State | Shows |
| --- | --- |
| `CAT-01.default` | the listing with one Blueprint |
| `CAT-01.default-mobile` | the same, at 390px |
| `CAT-01.catalog` | eight Blueprints across five categories, with the sidebar |
| `CAT-01.catalog-mobile` | the same, at 390px, with the category select |

The deterministic catalog fixture lives in `tests/fixtures/catalog/`. It is not in
the real catalog and is not meant to be: a real Blueprint's wording changes
whenever someone improves it.

## CAT-02 — Blueprint record

Route: `/blueprints/:slug`

The record's Product Report is generated into the page payload — there is no
request-time fetch for the body of the page. The pull command is the point of
Overview, so it is set under a real "Pull this Blueprint" heading in the site's `CommandBlock` — the
same prompt, syntax colours and neutral copy control as the home page's install
command. The report's flat rail opens the other resource-type collections.

Above the rail, a Product picker shows the current Product's own logo and name.
It lists the public Blueprints with the current one checked and supports keyboard
type-ahead. Choosing a Blueprint opens its Overview. The
collapsed rail keeps the Product logo and a name tooltip; the mobile navigation
drawer keeps the full picker. All Blueprints is the final picker entry below a
divider. Vocabulary appears in the site header only, with the report's tooltip
controls available in that panel. The sidebar retains Product Model search
beside Overview and has no empty footer divider.

Section selection lives in `?tab=`, so a collection is a shareable URL and a
reload lands on the same reading. The values are the Product Report v15's
singular resource-kind keys, such as `journey` and `rule`. `overview` is the
default and is spelled by the absence of the parameter rather than by
`?tab=overview`; an open resource page adds its stable key in `?e=`.

An unknown slug is a 404, never a 200 carrying an error message: no page is
generated for it, and an in-app navigation to it renders the not-found screen.

| State | Shows |
| --- | --- |
| `CAT-02.overview` | the default reading and the pull command |
| `CAT-02.journeys` | `?tab=journey`, the Journeys collection |
| `CAT-02.rules` | `?tab=rule`, the Business rules collection |

## Asserted in Playwright

The empty, no-match, and unavailable states are asserted in
`tests/e2e/catalog-index.spec.ts`, each from a deterministic listing.
