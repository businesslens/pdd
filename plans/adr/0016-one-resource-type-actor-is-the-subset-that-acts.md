# 0016 — There is one resource type for things; Actor is the subset that acts

Status: **Accepted** — 2026-09-02

Supersedes in part [0008](./0008-an-ai-agent-harness-is-an-actor.md) — the
`relationship` field and the word *Actor* as a resource type; the decision that
an AI agent harness acts stands unchanged — and
[0013](./0013-relationships-are-product-meaning.md) — the consequence *"a
relation targets an Entity only; ownership stays a fact the Product keeps"*.

## Context

`docs/actors.md` stated the rule: *"An Actor is who acts; an Entity is what is
acted upon. The same participant is never modelled twice."* Three things showed
it was false.

**A Reader is acted upon constantly.** The Blueprint's `collection.md` uses the
word *owner* five times — *"an owner curates"*, *"the name its owner gave it"*,
*"visible only to its owner"* — and it maps to no resource. The model could not
say who owns a Collection, and no Rule could say that only they may publish it.

**The workaround had zero users.** `## Information kept` was added to Actors so
a Reader's reading position had a home *"without modelling the Reader twice"*.
None of the six Actor files across the three shipped models used it, the Reader
included.

**Two collections make acting a migration.** A thing that starts acting — a
payroll Employee who gains a login — moves file, changes id namespace, and
breaks every reference. That is the wrong cost for one product fact.

## Decision

**There is one resource type for things: the Entity. "Actor" is the word for the
subset that acts.**

- An Entity that initiates, with a goal or privilege of its own, under an
  inbound contract the Product must keep stable, says `acts: external` or
  `acts: internal`, and with it `kind: person` or `kind: system`. Everything
  else says nothing, because *it's a thing* is the default.
- The word *Actor* survives where it names a role an Entity is playing in a
  position: a Step's `actor`, an Interface's, Experience's or Journey's
  `actors`, a grant's `actors`. Every such reference must name an Entity that
  acts.
- **A privilege that exists only in code is authorization, not product
  meaning.** *Service X may cancel orders, service Y may not* is deliberately
  unsayable. An internal component holds no contract the Product keeps for it.
- A relation may target an Entity that acts. Ownership is a relation, declared
  on the Entity that owns.
- An Entity is valid with any one of `## Information kept`, `## States` or
  `acts`. A payment gateway that posts webhooks exists because it acts.
- The no-orphans rule admits acting: an Entity must be changed by a Step,
  presented by a Screen, or named as an actor somewhere.

## Considered and rejected

**Two collections, `actors/` beside `entities/`.** The earlier recommendation.
It fails on one question — *what happens when a thing starts acting?* — and the
objection that a payment gateway would be an Entity with nothing kept about it
was against a definition the format does not have: an Entity is what the
Product keeps *or reasons about*.

**`kind` optional under `acts`.** An Entity that acts without saying whether it
is a person or a system is a regression from the Actor it replaces, and the
report's facet would have nothing to group it by.

**`by` in place of `actor` on a Step.** The collision it was said to have did
not exist. The reason to keep `actor` is that every Step already carries it.

## Consequences

- `actors/` is gone. One id namespace; a thing that starts acting gains one
  field and moves nowhere.
- `relationship` becomes `acts`. Its old name collided with `relations` — one
  meant which side of the boundary, the other associations between things —
  and one file holding both was unreadable.
- Interface and Experience `actors` are reworded from *allowed to use* to *who
  uses it*. The list is descriptive. A permission claim appears only in a
  Business Rule ([0017](./0017-a-business-rule-states-what-must-remain-true.md)).
- The report loses its `actors` collection and count. Entity carries `kind`
  and `acts`; consumers that showed *Actors* show the Entities that act.
- `docs/actors.md` folds into `docs/entities.md`. The rendered Product Report
  loses the Actors rail row for an *acts* facet over one Entities collection.
- Folder schema 7 → 8 and Product Report v12 → v13, shared with 0017 and 0018.
