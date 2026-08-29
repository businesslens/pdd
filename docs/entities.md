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
    cardinality: many-to-many
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
where `verb` is your product's own word and `cardinality` states **both ends**,
reading source to target — `one-to-one`, `one-to-many`, or `many-to-many`.

Both ends, because one end is not a relationship. *A Source publishes many
Items* leaves unanswered whether an Item may come from two feeds, and *can I
save this article into two collections* is a product decision your reader will
ask about. Write `many-to-one` and `lint` sends you to the other Entity, where
the same relationship reads `one-to-many` — so one `1:N` has one encoding and
two authors cannot write it from opposite sides.

**Declared on one side only** — the inverse is derived and shown on the other, so
they cannot drift apart. Two Entities that declare relations *at each other* are
a warning: that is the same relationship written twice, and now that each
declaration carries both ends the two can contradict each other. A relation
targets an Entity, never an Actor.

Both live in frontmatter rather than a section because they name other resources
by id, and ids are parsed rather than read out of English.

## One Entity, or several?

The hardest call is a family of things that share a word — document types, event
kinds, payment methods. **Write `## Information kept` before you decide**, and
the answer falls out of whether you can finish the list.

One Entity, if a single list is true of every member. Several, the moment the
list needs *"depending on the kind"* or carries facts that hold for some members
and not others. That shared word is then a category, and its members are the
Entities.

Being stored, parsed and rendered the same way does not make them one thing.
That is how the Product *handles* them; this asks what it *keeps*.

**When it is close, split.** Anyone can merge two Entities later. A collapse
deletes the difference and leaves nothing behind saying it was ever there — the
next reader cannot tell there was a question at all. If you have nobody to ask,
split and say so.

**When one list is contained in another**, the procedure above stops helping:
you can always produce a shared list by discarding whatever differs, so the
intersection proves nothing. Ask instead: **does the smaller one have an address
of its own?**

Being kept inside the larger thing is not the test — that is storage, which is
never the test. Ask what can name it: a file, a route, a scope a command
accepts, an id another resource cites. *The items ordered* has none of those and
belongs inside Order. Anything with one of them is its own Entity, however much
the information overlaps and however firmly the larger thing contains it.

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
declares what it changes, a Screen what it presents, and a Scenario Step what it
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

**Not a representation of another Entity.** A serialization, export or rendering
is that thing in another shape. If you can regenerate it from an Entity, it
belongs in that Entity's information and in the Capability that produces it —
not beside it as a peer.

**Not a receipt the Product keeps for itself.** A marker file, a lock, an index
the Product needs in order to work safely. Ask who the record is *for*: an Actor
never points at these, the Product does.

**Not the Product itself.** Its surfaces, its shipped content and its closed
vocabularies are what it *is*, not what it keeps. A Product keeps information
about *instances*; where there are no instances, only members of a fixed list,
that is a vocabulary.

Apply that last one to the thing you would name, never to the classification
above it. A closed list of kinds is a vocabulary; the things those kinds
classify are not. "Payment method" may be a fixed list of four while every
payment is its own thing.

It traps a tool whose subject is models. Why is *Actor* an Entity for
BusinessLens but *agent skill* is not? Because it keeps information about
Actors — `actors/` is full of them — and it ships its skills rather than keeping
records about them. **Does the Product keep information about instances of this,
or is this the Product itself?**

**The author's test**: if you cannot point at it, and no Capability changes it
and no Screen shows it, it is a table, not an Entity.

## How it relates to everything else

An Entity declares almost nothing about the rest of the model. The things that
use it declare the relationship, and every backlink is derived.

| | |
| --- | --- |
| **Capability** | declares the Entities it **changes**, in `entities`; a Capability that only reads one declares nothing |
| **Transition** | names the Capability that causes that one move |
| **Another Entity** | related by a declared edge with a verb and both cardinality ends; the inverse is derived |
| **Scenario Step** | may name the Entity it changes and the state it leaves it in |
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
- `## States` without a `transitions` list, or `transitions` without
  `## States`, is an error.
- A `## Transitions` or `## Relations` prose section is an error: the
  frontmatter list is the one authority, and a section beside it is a second one
  that can disagree.
- A transition that is not a `{ from, to, by }` mapping is an error.
- A transition naming a state the Entity does not define is an error.
- A transition naming a Capability that does not list this Entity is an error.
- An Entity no Capability changes and no Screen presents is an error.
- A state no transition reaches, other than the first, is a warning.
- An Entity naming a Domain that does not exist is an error.
