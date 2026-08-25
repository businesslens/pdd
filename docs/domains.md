---
title: Domains
description: Optional regions of the Product's subject matter that classify Capabilities, Screens and Journeys without owning any of them.
section: open-source
group: Product Model
order: 13
---

# Domains

**A Domain is a coherent region of the Product's subject matter** — ordering,
catalog, billing. It has its own vocabulary and its own invariants, and it is
named in Product language rather than after code directories, services, teams,
or deployment boundaries.

A Domain is an **axis, not a level**. It classifies; it does not contain. A
Capability names the one Domain it is about, and every other Domain relation is
derived from that: a Screen is about the Domains of the Capabilities it exposes,
a Journey about the Domains its Scenarios traverse. Nothing has to restate what
can be computed, and nothing can contradict it.

## When you create one

Create a Domain when a region of the Product has a boundary you can state — what
it covers and what it explicitly does not. Zero Domains is valid, and a small
Product often needs none.

Do not create a Domain to re-gather Capabilities you have just split. If
`manage-repositories` was too broad and became create, configure, archive and
delete, those four were already about the Repositories region before the split.
A Domain that exists only to hold them is a folder, not a region.

> **Domain vs Capability.** A Domain is what a part of the Product is *about*; a
> [Capability](./capabilities.md) is something the Product can *do*.

## The file

Domains normally live at `domains/<domain-id>.md`. A Domain with assets expands
to `domains/<domain-id>/domain.md`. The entire collection is optional.

```md [domains/ordering.md]
---
colorSlot: 4
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts
---

# Ordering

Everything between a full cart and a fulfilled order.

## Boundary

Owns cart contents, order state, and the transition between them. It does not
own catalog information, payment instruments, or fulfilment logistics.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a lowercase kebab-case stem as the Domain ID. |
| `colorSlot` | no | Provide a display hint when useful. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name and describe the Domain. |
| `## Boundary` | yes | State what the region covers and what it explicitly does not. |

Every Domain ID named by a Capability must have a corresponding file.

## What a Domain answers

Because the relation is derived in both directions, one Domain answers *"show me
everything about Collections"* across the whole model — the Capabilities that
are about it, their Scenarios, the Screens that expose them, the Journeys that
traverse them, and the Business Rules that constrain them. That reach is the
reason a Domain earns a place in the model; organizing a long Capability list
is not.

## Grouping that is not subject matter

Three questions group Capabilities, and each has its own answer:

| Question | Mechanism |
| --- | --- |
| What is it about? | **Domain** |
| Where can you reach it? | [availability](./capabilities.md) |
| What does it participate in over time? | [Journey](./journeys.md) |

Anything else — team ownership, compliance concerns, delivery maturity — has no
home in the Product Model and should stay in the system that already tracks it.
The model describes the Product, not the organization building it.

## Referenced by

| From | Key | Cardinality |
| --- | --- | --- |
| [Capabilities](./capabilities.md) | `domain:` | Zero or one |
| [Screens](./screens.md) · [Journeys](./journeys.md) | derived through Capabilities | Zero or more |
