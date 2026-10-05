---
domain: reflections
availability: [ { place: tracker-web } ]
---

# Weekly reflection generation

When a week ends for an Owner who has reflections on, the Product reads back
that week's check-ins for each active habit, records how consistently each was
done, asks a language model to write a short summary,
and may propose one suggested adjustment to a habit's schedule. It runs on the
Product's own schedule; the Owner finds the result among their reflections.

## Intent

Offer a small, optional look back that helps the Owner notice a schedule that
does not fit. The Product only reads and proposes: it never changes a habit,
and the language model it queries is a helper whose absence costs the
reflection its summary and suggestion, never its figures.
