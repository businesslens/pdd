---
title: Entities
description: An Entity names a thing the Product keeps or reasons about, the people and systems that act on it included — what it holds about that thing, the states it moves through, and who acts.
section: open-source
group: Product Model
order: 9
---

# Entities

An Entity is a thing the Product keeps or reasons about, which an Actor can
point at and the Product can tell apart from another one — an order, a listing,
a saved item, and the Reader who saved it.

Capabilities name the Product's **verbs**. Entities name its **nouns**, the
people and systems that act on it included. There is one resource type for
things; the ones that act carry one more field.

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

## Actors: an Entity that acts

**An Actor is an Entity that acts on the Product.** A shopper, a store
administrator, a partner system posting webhooks, and the AI agent harness
running a skill are all Entities that `acts`. Nothing else distinguishes them
from an Order: the Product keeps or reasons about instances of every one of
them, and a thing that starts acting gains one field — no file move, no id
change.

`acts` is `external` or `internal`, relative to the Product boundary: whether
the thing acts independently outside the Product owner's boundary, or on the
Product owner's behalf. A staff operator is usually internal even when working
remotely; a partner system is usually external even when connected over a
private network. `kind` is `person` or `system`, **required when `acts` is
set** and invalid otherwise — an Order says nothing, because *it's a thing* is
the default, and an Entity that acts always says which it is.

Two independent questions decide, neither ranking the other:

| | keeps / reasons about | initiates under a contract | |
| --- | --- | --- | --- |
| Reader | yes | yes | Entity + `acts` |
| Payment gateway | reasons about | yes — posts webhooks | Entity + `acts` |
| AI agent harness | reasons about | yes | Entity + `acts` |
| Order | yes | no | Entity |
| Employee (payroll) | yes | no — never signs in | Entity |
| Feed source the Product polls | yes | no | Entity |
| An internal service with its own credentials | no | no | not modelled |
| The Product's own scheduler | no | no — that is `unattended` | not modelled |

Create an acting Entity only when its responsibility or privilege is
product-significant. If two roles have the same goals and permissions, they are
one Entity. **A privilege that exists only in code is authorization, not product
meaning**, so *service X may cancel orders, service Y may not* is deliberately
unsayable.

> **Actor vs persona.** A persona describes who someone is. An Entity acts
> because the Product must behave differently for it.

**The word Actor names a role, not a type.** An Entity that acts is *an Actor*
wherever it acts — a Step's `actor`, an Interface's, Experience's or Journey's
`actors`, a Business Rule grant's `actors`. Every such reference must name an
Entity that `acts`; `lint` errors otherwise.

### External systems: direction decides

An external system acts only when it **initiates**. Ask three questions:

1. Does it start the interaction with your Product?
2. Does it have a goal or privilege of its own inside your Product?
3. Must you keep an inbound interaction contract stable and verifiable for it?

All three yes — a partner system calling your API, a processor posting a
webhook — and it acts, through an [Interface](./interfaces.md). Any no and it
does not act: a system your Product calls out to is a dependency of the
[Capability](./capabilities.md) that calls it, and is an Entity only if the
Product keeps something about it.

A syndicated feed your Product polls scores no on all three. The same provider
pushing updates to your Product scores yes on all three. Same company, opposite
answer, because direction changed.

### An AI agent acts

An AI agent harness that loads a skill and acts inside the repository is an
Entity that acts. Give it the id `ai-agent`, `kind: system`, `acts: external`.

It qualifies because its responsibility is product-significant in its own right.
It initiates, it is the only participant that reads and writes on the person's
behalf, and what it does is not fully determined by whoever invoked it — it
chooses what to inspect, what to propose, and when to stop. That latitude is the
test. A browser delivering a `web` Interface makes no such choices and does not
act; an agent does. A CI runner executing a fixed command has no latitude of its
own either.

Name it `ai-agent`, not `coding-agent`. The same participant appears in a
support product or a research product, and the narrower name would be wrong in
both.

## The file

An Entity with no assets lives at `entities/<id>.md`. There is no `actors/`
directory; a folder with that name is a `lint` error naming where its files go.

```markdown
---
domain: ordering
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many-to-many
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- **Items ordered** — the items and their quantities
- **Total charged** — the amount taken from the shopper
- **When placed** — when the shopper submitted it

## States

### Pending

Submitted and awaiting payment settlement.

### Confirmed

Paid and accepted; stock is committed.

### Refunded

Reversed after confirmation.
```

```markdown
---
kind: person
acts: external
relations:
  - entity: order
    verb: owns
    cardinality: one-to-many
---

# Shopper

A person who browses the catalog and buys products.

## Information kept

- **Delivery address** — where their orders are sent
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a lowercase kebab-case stem as the Entity ID; it never opens with a verb. |
| `acts` | no | Use `external` or `internal` relative to the Product boundary when the thing acts on the Product. |
| `kind` | with `acts` | Use `person` or `system`. Required when `acts` is set, invalid otherwise. |
| `domain` | no | Name one existing Domain. |
| `relations` | no | Declare edges to other Entities as `{ entity, verb, cardinality }`; see below. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name and describe the thing. |
| `## Information kept` | see below | A bullet list of named facts, each `- **Name** — prose`. |
| `## States` | see below | H3 state names, each with prose; the first is where a thing starts. |

**At least one of `## Information kept`, `## States`, and `acts` must be
present.** A thing may have information and no lifecycle worth naming, a
lifecycle with almost nothing kept about it, or — a payment gateway — nothing
kept at all and a reason to exist because it acts.

## Named facts

Each fact is `- **Name** — prose`: the name in bold, an em dash with a space on
each side as the separator, and non-empty prose after it. Names are unique
within the Entity and are cited by exact match — a
[Business Rule](./business-rules.md)'s `facts` target and its `when` condition
are the only places that cite one. It is the idiom `## States` already uses,
where an H3 titled `Pending` is cited as `from: Pending`.

It is **what the Product keeps, never how it is stored**: *When placed*, not
`created_at TIMESTAMP`. No types, no keys, and no structured relations between
Entities — *Items ordered* is prose, never `hasMany`. A fact is addressable,
never typed: addressable is what a field-level Rule and a derivation need; typed
is a data model. Computed information is still a fact.

## States, and the lifecycle nobody authors

`## States` lists what a thing can be. **The Entity declares its states and
nothing about the moves between them.** The lifecycle is composed from Scenario
Steps: a Step's `entities` entry says which Entity it creates, changes, or
removes, and from and to which state, and the report draws the machine from
every Scenario in the model — each arc labelled with the Capability whose Step
draws it, and with the Rules that restrict or forbid it.

A per-Entity transition list could never express a combined lifecycle —
*settling a payment confirms an Order and creates a Shipment* is one act on two
things, which only a Step can say — and it stated a second time what a Step
already states. There is no `transitions` key; one that is still authored is an
error naming the Step keys that replaced it.

`lint` composes every Scenario and reports what the composition is missing: a
state other than the first that no Step ever leaves anything in is a warning, and
so is a Step leaving from a state nothing produces. An Entity with states that
no Step creates, or that nothing ever removes, is noted on its report page and is
not a finding — a Catalog product no Capability creates is a real thing whose
instances pre-exist the model.

## Relations

`relations` declares edges to other Entities — an Entity that acts included,
which is how ownership is said: the Shopper above `owns` Orders, and a Business
Rule walks that edge back to find who may. Each is `{ entity, verb, cardinality }`,
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
a warning: that is the same relationship written twice, and the two can now
contradict each other. A relation may target the Entity itself — a Comment
replies to a Comment — though a Rule's `related` path cannot walk through one,
because naming the Entity gives it no direction.

Relations live in frontmatter rather than a section because they name other
resources by id, and ids are parsed rather than read out of English.

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
| Logical | attributes as fields, keys, normalization | no — what is kept is named prose |
| Physical | types, indexes, constraints, tables | never |

And it carries three things no ERD has: a **lifecycle** — states, and the arcs
between them composed from every Step that moves a thing; **edges into
behaviour**, because a Step declares what it does to a thing and a Screen what
it presents; and **who may act**, because a Business Rule's grants name the
Entities that act and the relation paths back to them.

**An ERD answers "how is the data shaped". This answers "what does the Product
keep, what changes it, and who may".** Neither replaces the other. An engineer
designing storage still needs types, keys and indexes, and none of them is here —
you cannot generate a schema from this. Going the other way, an ERD has no
lifecycle, no link to behaviour, and is full of junction, audit and configuration
tables that no user can name.

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

It traps a tool whose subject is models. Why is *Capability* an Entity for
BusinessLens but *agent skill* is not? Because it keeps information about
Capabilities — `capabilities/` is full of them — and it ships its skills rather
than keeping records about them. **Does the Product keep information about
instances of this, or is this the Product itself?**

**The author's test**: if you cannot point at it, no Step changes it, no Screen
shows it, nothing names it as an actor, and no Rule reads it, it is a table, not
an Entity.

## How it relates to everything else

An Entity declares almost nothing about the rest of the model. The things that
use it declare the relationship, and every backlink is derived.

| | |
| --- | --- |
| **Scenario Step** | declares what it does to the Entity in `entities` — creates, changes, removes, or reads — and the states it leaves and lands in |
| **Capability** | nothing; what it changes is derived from its Scenarios' Steps |
| **Screen** | declares the Entities it presents, in `entities` |
| **Another Entity** | related by a declared edge with a verb and both cardinality ends; the inverse is derived |
| **Interface, Experience, Journey** | name it in `actors` when it acts |
| **Business Rule** | targets an operation on it, cites one of its facts, walks its relations to find who may, or reads a settings Entity's fact as a condition |
| **Domain** | optional and single, authored on the Entity itself |

An Entity never declares Capabilities, Screens, availability, or who may act on
it. Steps say what changes it, a Screen says what presents it, a Business Rule
says who may.

## No orphans

An Entity must be changed by a Step, presented by a Screen, named as an actor —
on a Step, an Interface, an Experience, a Journey, or a Business Rule grant — or
read by a Business Rule, as a condition's `entity` or a `configuredBy`, which is
how a settings Entity earns its place. **A Step's read never counts, and neither
does a relation** — a cluster of Entities referencing each other while no
behaviour touches any of them is still vocabulary nobody uses. An Entity nothing
points at is a `lint` error: it is either vocabulary nobody uses, or a
relationship somebody forgot to declare.

## Findings `lint` reports

- An Entity with none of `## Information kept`, `## States`, and `acts` is an
  error.
- `kind` without `acts`, `acts` without `kind`, or a value outside
  `person|system` and `external|internal`, is an error.
- An `actors/` directory is an error naming `entities/` as where its files go.
- A fact that is not `- **Name** — prose`, or two facts with one name, is an
  error.
- A `transitions` key is an error naming the Step keys that replaced it; a
  `## Transitions` or `## Relations` prose section is an error.
- A relation naming a missing Entity, a duplicate edge, or `many-to-one` is an
  error; two Entities declaring relations at each other is a warning.
- A Step, Interface, Experience, Journey, or grant naming an Entity that does
  not `acts` as an actor is an error.
- An Entity nothing changes, presents, names as an actor, or reads by Rule is an
  error.
- A state other than the first that no Step leaves anything in is a warning; a
  Step leaving from a state nothing produces is a warning.
- An Entity naming a Domain that does not exist is an error.
