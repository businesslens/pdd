# 0009 — What the Product keeps is in scope

Status: **Accepted** — 2026-08-26

## Context

The Product Model described itself as covering *"who it serves, through which
supported interaction forms, in which usage contexts, what it can do, which
goals matter, and what must remain true."* There is no clause for **what it
keeps**, and that omission was not a decision anyone made — it is visible in the
format's own one-line summary of itself.

The information was never actually absent. It was scattered. `## Information
presented` on a Screen held *"The time each item was saved"*, *"Product name and
description"*, *"Followed source names and feed addresses"* — attributes of a
thing, written on each view that displayed them, duplicated across web and
mobile. A reader asking "what is a Collection?" had to visit three Screens and
assemble the answer.

The counter-argument is real: the moment information is in scope, the format
starts competing with schemas, ERDs, and API contracts, and its value was that
it refused to.

## Decision

**What the Product keeps is product meaning, and belongs in the model.**

The line is not *data or no data*. It is **what the Product keeps** against **how
it is stored**:

| In | Out |
| --- | --- |
| "When it was placed" | `created_at TIMESTAMP NOT NULL` |
| "The total charged" | decimal precision, currency column |
| "The items ordered" | a join table, cardinality, foreign keys |
| the data a cache holds, if the Product promises it | the cache |

A creation date is product meaning whenever something observable turns on it —
a refund window, a sort order, "saved 3 days ago". The mechanism that stores it
never is.

## Consequences

- The Product Model's self-description gains a clause for what it keeps.
- A dedicated entity owns it — see [ADR-0010](./0010-a-thing-the-product-keeps.md).
- The guard against becoming a schema is authored form, not scope: single-line
  prose, no types, no cardinality, no keys, and **no structured relations
  between things**. "The items ordered" is prose, never `hasMany`.
- `## Information presented` on a Screen narrows to what is specific to that
  view — counts, feedback, derived values — and stops being the home for a
  thing's attributes.
