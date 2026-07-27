---
title: The product map
description: What actors, experiences, domains, journeys, and scenarios are — the entity model behind .businesslens/, in plain language.
section: open-source
group: Concepts
order: 5
---

# The product map

The map answers one question from five angles: *what does this product do,
for whom, and where does the code prove it?* Each entity type covers one
angle. This page explains how to think about them; the exact file shapes
live in the [format contract](./format.md).

## Actors — who

An actor is someone (or something) with a goal or a privilege: a shopper, a
store admin, a billing webhook. Actors are defined by what they are trying
to accomplish, never by UI screens or database roles. If two "roles" share
the same goals and permissions, they are one actor.

## Experiences — where

An experience is a surface of the product with a stable audience and a
capability boundary: the public storefront, the admin console, a CLI, an
API for partners. Each declares who uses it (`actors`), how it is reached
(`entryPoints`), what protects it (`access`), what a successful visit ends
with (`exit`), and — most importantly — its **capability boundary**: what
this surface can and cannot do.

## Domains — which area

Domains group journeys into recognizable product areas — ordering, catalog,
billing. They are an organizing layer for navigation and topology, not a
technical decomposition; name them the way your product people talk.

## Journeys — what users accomplish

A journey is a stable user or operator goal: *browse and buy*, *refund an
order*, *rotate an API key*. It belongs to a domain, is performed by actors
through experiences, and carries `codeRefs` proving the goal is really
served by the code. Journeys are the map's backbone — if a goal disappears
from the product, its journey is deleted, not archived.

## Scenarios — how it observably plays out

Each journey has one or more scenarios: concrete, observable paths through
the goal. A scenario has a `kind` (from your `taxonomies.yaml` — primary,
edge, and whatever vocabulary fits), and three structured sections:

- **Trigger** — what starts it ("the shopper presses *Place order* with a
  non-empty cart");
- **Steps** — the ordered observable progression;
- **Outcome** — what the user or operator ends up with.

Scenarios are deliberately the smallest unit that can be *verified*: their
Trigger/Steps/Outcome are the acceptance contract that
[`businesslens-verify`](./skill-businesslens-verify.md) checks against the
implementation. Scenario IDs are globally unique across the map, so any
scenario can be referenced unambiguously.

## Evidence — where the code proves it

Every journey and scenario cites tracked code with compact `codeRefs`
(`src/services/orders.ts#OrderService.submit`). The validator checks every
path against `git ls-files`, which is what keeps the map from drifting into
fiction. A claim without evidence is, by definition, unfinished work — see
[How it works](./guide.md) for how that powers planning.

## Coverage — how honest the map is

`coverage.md` records how the map was built and what it deliberately leaves
out: the method, inspected source areas, unmapped surfaces, and known
limitations. Its `status` (`draft | partial | complete`) is about the map's
completeness, with one special meaning: `draft` marks a planned greenfield
map whose evidence hasn't been earned yet.

## A worked example

```text
.businesslens/
├── product.md                       # Fixture Shop
├── actors/shopper.md                #   who: buys products
├── actors/store-admin.md            #   who: manages orders
├── domains/catalog.md               #   area: finding products
├── domains/ordering.md              #   area: buying and refunds
├── experiences/storefront.md        #   where: public web store
├── experiences/admin-console.md     #   where: restricted admin area
└── journeys/browse-and-buy/         #   goal: find a product and buy it
    ├── journey.md                   #     domain: ordering, actor: shopper
    └── scenarios/complete-checkout.md   # observable path, with codeRefs
```

Reading order for a newcomer: `product.md` → experiences (the surfaces) →
journeys per domain (the goals) → scenarios (the behavior). That is also
exactly the order an agent reads before touching your code.
