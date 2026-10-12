# Catalog cards wear the Product logo, not drawn screens

read_when: changing what a `/blueprints` card shows above its text, or adding
artwork derived from a Product Report.

Status: superseded in part by ADR-0021, which shows a Blueprint's cover when it
has one; the logo on its category's tint remains the fallback.

## Context

A card used to draw its artwork from the report: one synthesized window per
Experience, its archetype (board, list, tiles, terminal) guessed from the shape
of the numbers, played through on hover. With fifteen published Blueprints the
windows looked alike — most products have a sidebar and a grid — and they drew
the one thing a Product Model deliberately does not describe: how the product
looks. A card's icon was its category's, so two Blueprints on one shelf also
wore the same badge, while their records showed distinct logos.

## Decision

A card's artwork area shows the Product's own logo, large, on its category's
tint. The small badge on the seam shows the category icon. The logo is the
identity the Blueprint wears on its record and in the report; the badge, the
tint and the label above the title say which shelf it sits on. A card without a
logo shows its category icon in the artwork area.

The listing projection no longer carries artwork, and nothing on the card plays
on hover.

## Consequences

- A Blueprint looks the same in the catalog, the record switcher and the
  report.
- This supersedes the note in ADR-0015 that the artwork keeps a per-Experience
  Actor count: there is no artwork.
- Stored cards may still hold an `artwork` key from earlier publishes; the
  projection reads fields explicitly, so it is ignored until the next
  `blueprints:publish`.
