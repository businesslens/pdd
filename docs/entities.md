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
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many
transitions:
  - from: Pending
    to: Confirmed
    by: place-order
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

```

**At least one of `## Information kept` and `## States` must be present.** A
thing may be worth naming for what is kept about it, for how it changes, or for
both — but not for neither.

`transitions` is required exactly when `## States` is present. Each is
`{ from, to, by }`, where `by` names the Capability that causes the move — and
that Capability must list this Entity, so the two declarations can never quietly
disagree.

`relations` declares edges to other Entities: `{ entity, verb, cardinality }`,
where `verb` is your product's own word and `cardinality` is `one` or `many`.
**Declared on one side only** — the inverse is derived and shown on the other, so
they cannot drift apart. A relation targets an Entity, never an Actor.

Both live in frontmatter rather than a section because they name other elements
by id, and ids are parsed rather than read out of English.

## Is this an ERD?

Partly, and deliberately only partly. Standard practice splits an ERD into three
levels:

| Level | Contains | Here |
| --- | --- | --- |
| Conceptual | entities, relationships, cardinality | **yes** |
| Logical | attributes as fields, keys, normalization | no — what is kept is prose |
| Physical | types, indexes, constraints, tables | never |

And it carries two things no ERD has: a **lifecycle** — states, transitions, and
the Capability causing each — and **edges into behaviour**, because a Capability
declares what it acts on, a Screen what it presents, and a Scenario Step what it
changes.

**An ERD answers "how is the data shaped". This answers "what does the Product
keep, and what changes it".** Neither replaces the other. An engineer designing
storage still needs types, keys and indexes, and none of them is here — you
cannot generate a schema from this. Going the other way, an ERD has no lifecycle,
no link to behaviour, and is full of junction, audit and configuration tables
that no user can name.

Attach the schema as a Reference instead: an ERD diagram is `kind: visual`, a
schema document is `kind: spec`, a migration is `kind: code` — each with
`role: implementation`, which says *realization, never meaning*. See
[References](./references.md).

## What it is not

**Not a data model.** No types, no keys, no foreign keys, no join entities. A
relation says *"holds many item"*, never `hasMany` with a key. **The moment you
write a type, you have left product meaning.**

**Not the implementation.** A cache is out of the model; the data it holds is in
when the Product promises it. The mechanism is never product meaning; what the
Product undertakes to know is.

**Not a view's states.** "Empty list" belongs to a [Screen](./screens.md).
"Archived" belongs to the thing.

**The author's test**: if you cannot point at it, and no Capability acts on it,
it is a table, not an Entity.

## How it relates to everything else

An Entity declares almost nothing about the rest of the model. The things that
use it declare the relationship, and every backlink is derived.

| | |
| --- | --- |
| **Capability** | declares the Entities it acts on, in `entities` |
| **Transition** | names the Capability that causes that one move |
| **Another Entity** | related by a declared edge with a verb and a cardinality; the inverse is derived |
| **Scenario Step** | may name the Entity it acts on and the state it leaves it in |
| **Screen** | declares the Entities it presents, in `entities` |
| **Domain** | optional and single, authored on the Entity itself |
| **Actor** | never — an Actor is *who acts*, an Entity is *what is acted upon* |
| **Business Rule** | never directly; a constraint on a thing is a constraint on what may be done to it |

An [Actor](./actors.md) carries its own `## Information kept` for what the
Product keeps about *them*, which is why a Reader needs no Entity of their own.

## No orphans

An Entity must be referenced by a Capability that changes it or a Screen that
presents it. **A relation from another Entity does not count** — a cluster of
Entities referencing each other while no behaviour touches any of them is still
vocabulary nobody uses. An Entity nothing points at is a `lint` error: it is either
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
