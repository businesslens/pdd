---
title: Entities
description: An Entity names a thing the Product keeps or reasons about — what it holds about that thing, the states it moves through, and the Capabilities that move it.
section: open-source
group: Product Model
order: 14
---

# Entities

An Entity is a thing the Product keeps or reasons about, which an Actor can
point at and the Product can tell apart from another one — an order, a listing,
a saved item.

Capabilities name the Product's **verbs**. Entities name its **nouns**.

## The test is identity, not storage

A draft recommendation the Product never persists is still an Entity when a
reader points at it and the Product distinguishes it from another. A database
row no Actor can name is not.

This is why the section is called *Information kept* rather than *stored*.
"Kept" means held, in the sense of *keep a record* — not written to a table.

## When you create one

Apply the naming test: **a thing an Actor would call "this one"**.

A shopper says *"this order"*, never *"this order line"* — that is "The items
ordered" inside Order. A reader says *"this item"* and *"this collection"*, but
"library" is simply all of them. Containers and parts are not Entities.

Do not create one for every noun in the product. A word that appears in your
prose and matches no Entity is a signal worth checking, but the answer is
sometimes that it was never a thing.

## The file

An Entity with no assets lives at `entities/<id>.md`.

```markdown
---
domain: ordering
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- The items ordered and their quantities
- The total charged
- When it was placed

## States

### Pending

Submitted and awaiting payment settlement.

### Confirmed

Paid and accepted; stock is committed.

## Transitions

- Pending → Confirmed by place-order
```

**At least one of `## Information kept` and `## States` must be present.** A
thing may be worth naming for what is kept about it, for how it changes, or for
both — but not for neither.

`## Transitions` is required exactly when `## States` is present, and each
reads `from → to by <capability-id>`. The named Capability must list this Entity
in its `entities`, so the two declarations can never quietly disagree.

## What it is not

**Not a data model.** No types, no cardinality, no keys, and **no structured
relations between Entities** — "The items ordered" is prose, never `hasMany`.
The moment you write a type, you have left product meaning.

**Not the implementation.** A cache is out of the model; the data it holds is in
when the Product promises it. The mechanism is never product meaning; what the
Product undertakes to know is.

**Not a view's states.** "Empty list" belongs to a [Screen](./screens.md).
"Archived" belongs to the thing.

## How it relates to everything else

An Entity declares almost nothing about the rest of the model. The things that
use it declare the relationship, and every backlink is derived.

| | |
| --- | --- |
| **Capability** | declares the Entities it acts on, in `entities` |
| **Transition** | names the Capability that causes that one move |
| **Screen** | declares the Entities it presents, in `entities` |
| **Domain** | optional and single, authored on the Entity itself |
| **Actor** | never — an Actor is *who acts*, an Entity is *what is acted upon* |
| **Business Rule** | never directly; a constraint on a thing is a constraint on what may be done to it |

An [Actor](./actors.md) carries its own `## Information kept` for what the
Product keeps about *them*, which is why a Reader needs no Entity of their own.

## No orphans

An Entity must be referenced by a Capability that changes it or a Screen that
presents it. An Entity nothing points at is a `lint` error: it is either
vocabulary nobody uses, or a relationship somebody forgot to declare.

## Findings `lint` reports

- An Entity with neither `## Information kept` nor `## States` is an error.
- `## States` without `## Transitions`, or the reverse, is an error.
- A transition that does not read `from → to by <capability>` is an error.
- A transition naming a state the Entity does not define is an error.
- A transition naming a Capability that does not list this Entity is an error.
- An Entity no Capability changes and no Screen presents is an error.
- A state no transition reaches, other than the first, is a warning.
- An Entity naming a Domain that does not exist is an error.
