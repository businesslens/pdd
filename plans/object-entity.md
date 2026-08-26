# The thing the Product keeps: design

Status: **designed, not implemented.** Settled across six grilling rounds and
recorded as [ADR-0009](./adr/0009-what-the-product-keeps-is-in-scope.md),
[ADR-0010](./adr/0010-a-thing-the-product-keeps.md) and
[ADR-0011](./adr/0011-a-things-states-belong-to-the-thing.md).

**The name is not settled.** `Object` shipped in schema 7; `Entity` is under
consideration, complicated by the fact that "entity" is already the word for a
*kind in the Product Model itself*. This document uses `Object` throughout as a
placeholder. Nothing below depends on the choice.

## Why this exists

Schema 7 shipped `Object` as an orphan. Nothing referenced it, its documented
existence rule was unenforceable, and it held half a concept: a thing's states
but not what the Product keeps about it. Meanwhile a thing's attributes *and* its
states were both scattered across the Screens that displayed them, duplicated per
platform.

## The entity

```markdown
---
domain: ordering            # optional
references: []              # optional, like every semantic entity
---

# Order

A shopper's confirmed intent to buy.

## Information kept          # optional
- The items ordered and their quantities
- The total charged
- When it was placed

## States                    # optional
### Pending
Submitted and awaiting payment settlement.
### Confirmed
Paid and accepted.

## Transitions               # required exactly when States is present
- Pending → Confirmed by place-order
```

- Compact `objects/<id>.md`, expanded `objects/<id>/object.md` when it owns
  assets.
- **At least one** of `## Information kept` / `## States`.
- `## Transitions` required exactly when `## States` is present.
- Assets may carry `state:` naming one of this entity's own states.
- H1 is the name, lead prose is the description.

### Boundary

What the Product **keeps**, never how it is **stored**. Single-line prose. No
types, no cardinality, no keys, and **no structured relations between things** —
"The items ordered" is prose, never `hasMany`. A cache is out; the data it holds
is in when the Product promises it.

### Unit

The naming test: a thing an Actor would point at and call *"this one"*. `item`
yes. `library` no — that is all of them. `order line` no — that is "The items
ordered" inside Order.

### No orphans

It must be referenced by a Capability that changes it, or a Screen that shows it.

## The three edges

| Edge | Owner | Purpose |
| --- | --- | --- |
| Capability → thing | Capability `objects:` | what it acts on, including information-only changes like `rename-collection` |
| transition → Capability | the transition, `by <capability>` | which move that Capability causes |
| Screen → thing | Screen `objects:` | what this view presents |

`lint` cross-checks that a transition's named Capability declares that thing —
the same shape as the existing Screen-Capability cross-check.

## What moves off Screens

- `## Product states` → **`## View states`**, restricted to the view's own
  states. 13 Screens touched.
- `## Information presented` keeps only what is specific to the view — counts,
  feedback, derived values, combinations. Nothing an Object already keeps.
  `collection-workspace` keeps *"The public link when the collection is
  published"* and drops *"Collection name and ordered saved items"*.
- Asset `state:` resolves against the states of whichever entity it hangs on.

## Unchanged

Business Rules stay behavioral — no Object target; a constraint on a thing is a
constraint on what may be done to it. Domain stays a separate axis. Actors,
Interfaces, Experiences and Journeys reach Objects through Capabilities.

## Work this implies

`spec/format.md`, `spec/report.md` · parser and 6+ lint rules · report v11
records and the three new id lists · viewer: Information kept / States /
Transitions blocks, derived "Changed by" and "Presented on" · `docs/objects.md`,
`docs/screens.md`, `docs/capabilities.md`, `docs/product-model.md` · the three
shipped skill references · both models re-authored, the Blueprint gaining `item`
and the fixture `catalog-product`.

Lands inside PR #34 as one coherent schema 7 / 0.9.0. Nothing is published.

## Known open holes

Raised after the design settled, not yet resolved:

1. **The name.** `Object` against `Entity`, against the existing meta-use of
   "entity" for Product Model kinds.
2. **Things that are never stored.** The design says "keeps", which leans
   persistent. A conceptual thing the product reasons about but never stores may
   still belong.
3. **Overlap with Actor and Product.** An Actor is also a noun in the product's
   vocabulary with facts kept about it. Whether Actor is a kind of this entity,
   or disjoint from it, is undecided.
4. **Whether the model should describe its own terminology** — the product's
   vocabulary as such, beyond the things it keeps.
