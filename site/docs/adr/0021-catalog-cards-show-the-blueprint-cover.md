# Catalog cards show the Blueprint's cover

read_when: changing what a `/blueprints` card shows above its text, or how a
Blueprint's cover is published, stored or served.

## Context

ADR-0020 replaced drawn screens with the Product logo, large, on its category's
tint. Fifteen logos on fifteen tints read as a grid of app icons and said little
about each product. The site already has a house illustration style — the
copperplate engravings on the blog covers — and a Product Model can now carry an
optional engraved cover in `.businesslens/product/cover.webp`: a 16:9 WebP,
validated by `validateProductCover` from `businesslens/logo`.

## Decision

This supersedes ADR-0020's artwork decision. A card's artwork area shows the
Blueprint's cover when it has one, edge to edge at 16:9, with the category icon
as its one badge on the seam. The cover already identifies the product, so a
logo badge beside it would only repeat it. A Blueprint without a cover keeps
ADR-0020's fallback — its logo, large, on the category's tint — with the same
category badge.

The cover follows the logo's path. Publishing reads it from pinned official
provenance (`raw.githubusercontent.com/businesslens/pdd/<commit>/…/cover.webp`),
or from the local checkout for a seed, validates it, and stores the bytes on the
row (`cover_data`, base64, nullable). `GET /api/v1/blueprints/:slug/cover.webp`
serves it as `image/webp` under the logo route's visibility and caching rules;
a Blueprint without a cover answers 404 there. The stored card says only whether
a cover exists, and its URL is derived when read, so the listing never loads
cover bytes.

A cover is optional, so an absent one publishes without it. A cover that is
present but invalid fails publication, as an invalid logo does.

## Consequences

- Each card carries a picture of its product in the brand's own style, while the
  logo keeps one identity across the catalog, the record switcher and the report.
- The record page does not show the cover: the report viewer owns that page, and
  it has no place for presentation-only artwork.
- Consuming covers needs a `businesslens` release that exports
  `validateProductCover`.
