---
title: Entities
description: The things your product keeps or reasons about (orders, products, settings) and the people and systems that act on it, with what it knows about each and the States it moves through.
section: open-source
group: Product Model
order: 8
terms:
  - term: Entity
    definition: "A thing the Product keeps or reasons about, including the people and systems that act on it."
  - term: Actor
    anchor: actors-an-entity-that-acts
    definition: "An Entity that acts on the Product. Actor is a role a thing plays where it acts, never a resource type of its own."
  - term: Entity kind
    anchor: actors-an-entity-that-acts
    definition: "Whether an Entity that acts on the Product is a person or a system."
  - term: Acts
    anchor: external-systems-direction-decides
    definition: "Which side of the boundary an Actor acts from: internal to the organisation running the Product, or external to it."
  - term: Information kept
    anchor: named-facts
    definition: "Named facts the Product keeps about an Entity, such as Total charged. Each is cited by name; storage details and data types stay outside the model."
  - term: State
    anchor: states-and-the-lifecycle-nobody-authors
    definition: "A named condition an Entity can be in, such as Pending or Refunded. Scenario Steps move it between States."
  - term: Left here by
    anchor: states-and-the-lifecycle-nobody-authors
    definition: "Scenarios containing a Step that puts this Entity in this State, even if a later Step changes it again."
  - term: Arc
    anchor: states-and-the-lifecycle-nobody-authors
    definition: "A move a Step makes: into a State, out of one, or between two. Nothing declares Arcs; they are composed from the Scenarios."
  - term: Lifecycle
    aliases: [Machine]
    anchor: states-and-the-lifecycle-nobody-authors
    definition: "An Entity's States and Arcs, showing how it is created, changes State, or is removed, composed from Scenario Steps across the model."
  - term: Relation
    aliases: [Relationship]
    anchor: relations
    definition: "A relationship between Entities, such as Shopper owns Orders, stating how many instances can relate on each side."
  - term: Changed by
    anchor: how-it-connects
    definition: "The Capabilities whose Steps create, change, or remove this thing."
---

# Entities

**An Entity is a thing your product keeps or reasons about, including the
people and systems that act on it.** Capabilities are the Product's verbs;
Entities are its nouns, and the ones that act are **Actors**.

## In practice

| In your product | The Entity |
| --- | --- |
| A shopper's purchase, from Pending to Confirmed or Refunded | Order |
| The person browsing and buying, who owns their orders | Shopper (acts) |
| What the store sells, Available or Unavailable | Catalog product |
| Money returned against an order, with its own amount and reason | Refund |
| The switches a store sets, such as self-service cancellation | Store settings |
| The processor that posts settlement results back | Payment gateway (acts) |

## When you create one

### One Entity, or several?

- **A thing a person would call "this one".** A shopper says *"this order"*,
  never *"this order line"*: the items ordered are a fact of Order. Parts and
  containers are not Entities: an order line, or *"the library"*, which is
  simply all the items.
- **A part with an address of its own is its own Entity.** If a route, a file,
  or another resource's id names the smaller thing, it is separate however
  firmly the larger one contains it.
- **A family sharing one word: write the Information kept first.** One list
  true of every member is one Entity; a list that needs *"depending on the
  kind"* is several. When it is close, split.
- **Identity, not storage.** A draft the Product never saves is still an Entity
  when someone points at it; a database row nobody can name is not.

## Actors: an Entity that acts

**An Actor is an Entity that acts on the Product.** It carries `acts`
(`external`, or `internal` when it acts on the Product owner's behalf, as staff
do) and `kind`, `person` or `system`, which is required with `acts` and invalid
without it.

Make an Entity act when it starts interactions with the Product, with a goal or
privilege of its own there. Two roles with the same goals and permissions
are one Entity, and a privilege that exists only in code is not product meaning.

*Actor* names a role, not a type: a Step's `actor`, an Interface's, Experience's
or Journey's `actors`, and a Business Rule grant's `actors` must each name an
Entity that acts.

### External systems: direction decides

An external system acts only when it **initiates**: a processor posting a
webhook, a partner calling your API, through an
[Interface](./interfaces.md). A system your Product calls out to is a
dependency of the [Capability](./capabilities.md) that calls it, and an Entity
only if the Product keeps something about it. The same provider can be either:
polled, it does not act; pushing updates, it does.

### An AI agent acts

An AI agent harness that loads a skill and works on someone's behalf acts: give
it the id `ai-agent`, `kind: system`, `acts: external`. It qualifies because it
chooses what to inspect, what to propose and when to stop. A CI runner executing
a fixed command does not.

A built-in AI feature is different: when the Product itself calls a language
model to draft or summarize, that model is a dependency of the Capability, and
the drafting is a Product Step. It never acts, however much it feels like an
assistant. Whichever way AI enters, what it produces stays a draft until a
person accepts it, and every grant to an `ai-agent` says whose agent it is
through `related`.

## The file

`entities/<id>.md`: one folder for every Entity, whether or not it acts.

```md [entities/order.md]
---
domain: ordering
relations:
  - entity: refund
    verb: is repaid by
    cardinality: one-to-many
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- **Delivery details** — where and how this order is to be delivered
- **Total charged** — the amount taken from the shopper
- **Margin** — what the store earns on it

## States

### Pending

Submitted and awaiting payment settlement.

### Confirmed

Paid and accepted; stock is committed.
```

```md [entities/shopper.md]
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

| Field or section | Required | Says |
| --- | --- | --- |
| H1 and lead | yes | The thing's name and what it is |
| `acts`, `kind` | for an Actor | How it acts; see [Actors](#actors-an-entity-that-acts) |
| `domain` | no | One existing [Domain](./domains.md) |
| `relations` | no | Its relationships to other Entities |
| `references` | no | Code or documents behind it, in the [Reference](./references.md) shape |
| `## Information kept` | one of these three | The named facts the Product keeps |
| `## States` | one of these three | Its named conditions; the first is where it starts |

Every Entity has at least one of `## Information kept`, `## States` or `acts`. A
payment gateway may keep nothing and exist because it acts.

## Named facts

Each line of `## Information kept` is one fact: `- **Name** — prose`, with the
name in bold and an em dash between. Write what the Product keeps, never how it
is stored: *When placed*, not `created_at TIMESTAMP`. Computed information is
still a fact. Business Rules, Screens and Steps cite a fact by its exact name:
*Margin is for operators* governs the Order's **Margin**.

## States, and the lifecycle nobody authors

`## States` lists the named conditions an Entity can be in, each an H3 with a
line of prose. **The Entity declares its States; Scenario Steps move it between
them.** A Step says which Entity it creates, changes or removes, and the State
it leaves or lands in. Each such move is an Arc. Composed across every Scenario,
they form the Entity's Lifecycle, and each State's **Left here by** lists the
Scenarios with a Step that puts the Entity there. There is no `transitions` key:
one act can move two things at once, and only the Step can say so.

## Relations

`relations` declares how Entities relate, each as
`{ entity, verb, cardinality }`: the Shopper `owns` Orders, one-to-many. `cardinality` states both ends
(`one-to-one`, `one-to-many` or `many-to-many`) because whether a saved item can
sit in two collections is a product decision. Declare a relation on one side
only; the inverse is derived. There is no `many-to-one`: declare it on the other
Entity, where it reads `one-to-many`. A relation may point back at the same
Entity: a Comment replies to a Comment.

## Is this an ERD?

Partly. It holds what a conceptual ERD holds (things, relationships,
cardinality) and nothing physical: no types, keys, join tables or indexes. It
adds what an ERD lacks: States, links to the Steps that change each thing, and
who may act on it. Attach a real schema as a [Reference](./references.md) with
`role: implementation`.

Not every noun is an Entity. An export of another Entity belongs to that
Entity; a lock the Product keeps for itself is machinery; a closed list it ships,
such as measurement units, is vocabulary; and an empty list is a condition a
Scenario meets, while *Archived* belongs to the thing.

## How it connects

An Entity declares almost nothing else; what uses it says so.

| | |
| --- | --- |
| **Scenario Step** | creates, changes, removes or reads it, naming the States and facts involved |
| **Capability** | is listed as **Changed by** when its Steps create, change or remove it |
| **Screen** | shows and collects its facts |
| **Business Rule** | governs an operation on it, cites its facts, or reads a setting from it |
| **Interface, Experience, Journey** | name it in `actors` when it acts |
| **Variation** | chooses by one of its facts, or assigns its instances |

**No orphans.** Something must change it, present it, name it as an actor, read
it in a Rule or choose by it in a Variation; a read Step or a relation alone does
not count.

## What lint checks

Errors:

- A missing H1 or lead, or none of `## Information kept`, `## States` and
  `acts`.
- `acts` without `kind` or `kind` without `acts`, or a value outside
  `external`/`internal` and `person`/`system`.
- A fact not written `- **Name** — prose`, two facts with one name, or two
  States with one name.
- A `transitions` key, a `## Transitions` or `## Relations` section, or an
  `actors/` folder.
- A relation to a missing Entity, a duplicate relation, or `many-to-one`; a
  Domain that does not exist.
- An `actor` or `actors` entry naming an Entity that does not act.
- An orphan, as above.

Warnings:

- A State other than the first that no Step ever puts the Entity in.
- A Step moving it from a State nothing produces.
- Two Entities declaring relations at each other.
- An id that opens with a verb acting on something the model declares, such as
  `cancel-orders` beside an Order Entity.
