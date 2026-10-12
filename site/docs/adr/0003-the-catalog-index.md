# ADR-0003: The catalog index

Status: accepted, 2026-10-12.

read_when: changing the `/blueprints` layout, its states, its search or
category controls, the URL parameters it reads, or what a card shows above its
text.

## Decision

**One layout at every size.** The hero, then search, a result row, and the grid,
in `CatalogLayout`. The listing uses the full viewport width, keeping only the
gutters; the grid grows to four columns on wide screens. The category sidebar is
the one part that depends on the catalog: it appears from `lg` only when there
is more than one category, and below `lg` the toolbar's category select takes
its place.

Besides the listing there are two states:

| State | Shows |
| --- | --- |
| empty | An empty state offering **Request a Blueprint** and **Submit a Blueprint**. |
| unavailable | The hero, then an alert that the Blueprints could not be loaded. |

The result row reads "8 Blueprints" until something narrows it, then
"3 results", "1 result" or "No results", never "1 of 1".

**Search and category live in the URL** as `?q=` and `?category=`, written with
`replace`. A filtered listing survives a reload, a shared link, and a trip to a
record and back, without each keystroke adding a history entry. Search is
case-insensitive across title, summary, category, the category's shelf label
and tags. An unknown category is ignored rather than shown as an empty shelf.

**Cards show the Blueprint's cover.** A card's artwork is the Blueprint's
engraved cover, edge to edge at 16:9, with the category icon as its one badge on
the seam. The cover comes from `product-model/product/cover.webp`, is validated
by `validateProductCover` (`../src/cover.ts`) in the release build, and is
served from `/_blueprints`. A Blueprint without a cover shows its logo, large,
on its category's tint; without a logo either, its category icon. An image that
fails to load falls back the same way.

## Why

- A layout that changed with the count would carry arrangements that exist for a
  few weeks and stay in the code for good.
- A card drawn from the report (synthesized screens) made every product look
  alike and depicted the one thing a Product Model does not describe: how the
  product looks. Logos alone read as a grid of app icons. Covers in the house
  engraving style say what each product is.

## Consequences

- A small catalog leaves gaps in a wide grid; the layout does not change with
  the count.
- The cover already identifies the product, so the card carries no logo badge
  beside it. The record page does not show the cover: the report viewer owns
  that page.
- A cover is optional; a present but invalid cover fails the build, as an
  invalid logo does.
