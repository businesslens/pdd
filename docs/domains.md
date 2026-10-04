---
title: Domains
description: Optional subject areas, such as ordering or billing, that follow the Product's own sections and group its Capabilities and Entities without owning them.
section: open-source
group: Product Model
order: 10
terms:
  - term: Domain
    definition: "A subject area of the Product, such as ordering or billing, that classifies related Capabilities and Entities."
  - term: Boundary
    anchor: the-file
    definition: "What a Domain takes in and what it leaves out, stated in the Product's own words."
---

# Domains

**A Domain is a subject area of the Product (ordering, catalog, billing) that
groups the Capabilities and Entities about it.** It follows the sections the
Product itself shows people, and it classifies without containing: nothing moves
into a Domain's folder.

## In practice

| In your product | The Domain |
| --- | --- |
| The shop's order area: checkout, payment, tracking, cancellation, refunds | Ordering |
| A Settings menu with Billing and Team pages, each with several things to do | Billing and Team |
| A catalog page whose only Capability is Browse catalog | None: one Capability is not a region |
| A document opened from Home, Recent and its collection | None: several sections reach it |

In the fixture shop, six Capabilities and five Entities, such as Order and
Refund, name `ordering`. `browse-catalog` names no Domain.

## When you create one

**One Domain per section of the Product's navigation, settings or administration
that holds two or more Capabilities**, named the way the Product names that
section. A Product with no such section has no Domains, and that is valid.

- **Use the finest section that still holds two.** Settings with Billing and Team
  pages, each holding several Capabilities, is two Domains, not one Settings
  Domain.
- **Something several sections reach has no Domain**, and nothing that is not a
  section becomes one. A Capability alone on a page beside a sibling section has
  no Domain either.
- **Something no section reaches** (signing in, a link in an email, a scheduled
  job) joins the one section whose Capabilities change the same Entities, or has
  no Domain.
- **Splitting a Capability never changes the Domains.** If `manage-orders`
  became four Capabilities, they share a Domain only if the Product's sections
  say so.
- **An author's Domains are kept.** Once someone has written or regrouped
  Domains, mapping adds new Capabilities to them and never re-cuts, merges or
  renames them.

Team ownership, compliance concerns or code structure never make a Domain; the
model describes the Product, not the organization building it.

## The file

`domains/<id>.md`. The H1 names the Domain, the lead says what it is about, and
`## Boundary` says what it covers and what it does not.

```md [domains/ordering.md]
---
colorSlot: 4
---

# Ordering

Everything between a full cart and a fulfilled order.

## Boundary

Owns cart contents, order state, and the transition between them. It does not
own catalog information or fulfilment logistics.
```

| Field or section | Says |
| --- | --- |
| H1 and lead (required) | The Domain's name and what it is about |
| `## Boundary` (required) | What it owns, and at least one thing it does **not** own |
| `colorSlot` | An optional display hint |
| `references` | Optional [References](./references.md) |

## How it connects

Only two resources name a Domain, each with an optional single `domain:` (a
[Capability](./capabilities.md) and an [Entity](./entities.md)). Everything else
follows from those: a Screen or Journey is about the Domains of the Capabilities
it uses. So one Domain gathers everything about its subject across the model.

A Domain is what a part of the Product is *about*; a Capability is something it
can *do*. Where a Capability can be reached is its `availability`, not its
Domain.

## What lint checks

Errors:

- A missing H1, lead paragraph or `## Boundary`.
- A `## Boundary` that never says what the Domain does not own.
- A Capability or Entity naming a Domain that has no file.

Warnings:

- A Domain named by fewer than two Capabilities: it is a folder, not a region.
  Entities don't count.
- A Domain id that opens with a verb acting on something the model declares.
