# 0013 — Relationships between Entities are product meaning

Status: **Accepted** — 2026-08-27

Superseded in part by [0016](./0016-one-resource-type-actor-is-the-subset-that-acts.md): a relation may target an Entity that acts, and ownership is a relation.

## Context

[ADR-0010](./0010-a-thing-the-product-keeps.md) forbade structured relations
between Entities, to stop the kind becoming an ERD. The result was that real
relations went back into prose, which is the failure this release exists to fix.
Two examples from shipped models:

- Blueprint `collection` — *"The saved items it holds, in the order the owner
  arranged them"*: a relation to `item`, invisible to every consumer.
- Our own `product-model` — *"Every Element it holds, and the relationships
  between them"*: the entire containment of a Product Model, in one bullet.

The ban was the wrong instrument. It removed the **meaning** in order to avoid
the **mechanism**.

## Decision

**Relationships between things a user can point at are product meaning, and are
declared.** The guard is the format's existing test, the same one that separates
an Interface from an adapter: **is it observable to an Actor?**

| In — a user experiences it | Out — storage |
| --- | --- |
| holds many Items | junction table, associative entity |
| comes from one Source | foreign key, index |
| an Order belongs to one Shopper | key type, nullability, default |

Cardinality is in scope because it is load-bearing product meaning: the
Blueprint's `collection-membership-does-not-control-saving` only makes sense
because an Item can be saved *and* belong to many Collections.

Located against standard ERD practice, this is a **conceptual** model and never
a logical or physical one:

| Level | Contains | Here |
| --- | --- | --- |
| Conceptual | entities, relationships, cardinality | **yes** |
| Logical | attributes as fields, keys, normalization | no — attributes are prose |
| Physical | types, indexes, constraints, tables | never |

And it carries two things no ERD has: a **lifecycle** (states, transitions, and
the Capability causing each), and **edges into behaviour** (a Capability
declares what it acts on, a Screen what it presents, a Scenario Step what it
changes).

## Consequences

- It does not replace a schema and cannot be generated into one. An engineer
  designing storage still needs types, keys and indexes; none is here.
- An ERD does not replace it either: no lifecycle, no behaviour, and it contains
  junction and audit tables no Actor can name.
- The author's test: **if you cannot point at it, and no Capability acts on it,
  it is a table, not an Entity.**
- No reference kind is added for a schema. An ERD diagram is `kind: visual`, a
  schema document is `kind: spec`, a migration is `kind: code` — each with
  `role: implementation`, which already says *realization, not meaning*. A
  dedicated kind would invite treating the schema as the authority for what the
  Product keeps.
- A relation targets an Entity only. An Actor is *who acts*; ownership stays a
  fact the Product keeps.
- A relation does **not** satisfy the no-orphans rule. A cluster of Entities
  referencing each other while no behaviour touches any of them is still unused
  vocabulary.
