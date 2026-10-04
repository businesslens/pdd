---
title: Domains
description: Optional regions of the Product's subject matter that classify Capabilities, Entities, Screens and Journeys without owning any of them.
section: open-source
group: Product Model
order: 11
terms:
  - term: Domain
    definition: "A subject area of the Product, such as ordering or billing, that classifies related Capabilities and Entities."
  - term: Boundary
    anchor: the-file
    definition: "What a Domain takes in and what it leaves out, stated in the Product's own words."
---

# Domains

**A Domain is a subject area of the Product**, such as ordering, catalog, or
billing. It classifies related Capabilities and Entities, with its own
vocabulary and constraints. Name it in Product language rather than after code
directories, services, teams, or deployment boundaries.

A Domain is an **axis, not a level**. It classifies; it does not contain. Two
resource types name the one Domain they are about — a
[Capability](./capabilities.md) and an [Entity](./entities.md) — and every other
Domain relation is derived from those: a Screen is about the Domains of the
Capabilities it exposes, a Journey about the Domains its Scenarios traverse.
Nothing has to restate what can be computed, and nothing can contradict it.

Only Capabilities count toward the two-Capability threshold below. An Entity's
`domain` classifies the thing; it does not make a region.

## When you create one

A Domain must state a `## Boundary` naming something it does **not** own; a
Boundary that only asserts inclusion is a label rather than a region, and `lint`
reports it as an error. A Domain should hold at least two Capabilities: one
holding a single Capability is a folder, and `lint` warns.

**Cut one Domain per Product section holding two or more Capabilities,** planned
or built — the areas its navigation, settings and administration group things
under, at the finest level that still holds two or more (a parent menu is a
section only when none of its direct children is), named in the Product's words.
For a Product planned before its code, the sections are the planned ones. A
Capability no section reaches, such as signing in or one only an emailed link or
a schedule starts, joins the section whose Capabilities change the same
Entities, or has no Domain when more than one section or none does; one alone on
a page beside a sibling section has none either. A Capability several sections
reach — a document opened from Home, Recent and its collection — has no Domain,
and nothing that is not a section becomes one. Zero Domains is valid for a
Product with no section of two or more Capabilities.

You may merge, split or rename Domains and write your own Boundary. Domains an
author has written or regrouped are the author's: mapping adds new Capabilities
to them and never re-cuts, merges or renames them.

Splitting a Capability neither creates nor removes a Domain. If
`manage-repositories` became create, configure, archive and delete, those four
were about Repositories before the split, and whether they share a Domain
depends on the Product's sections, not on the split.

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
everything about ordering"* across the whole model — the Capabilities and
Entities that are about it, their Scenarios, the Screens that expose them, the
Journeys that traverse them, and the Business Rules that constrain them. These
connections let a reader explore the subject across resource types. The Domain
must still meet the Boundary and Capability requirements above.

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
| [Entities](./entities.md) | `domain:` | Zero or one |
| [Screens](./interfaces.md#screens) · [Journeys](./journeys.md) | derived through Capabilities | Zero or more |
