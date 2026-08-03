---
title: Journeys
description: Complete Actor goals assembled from Capabilities and promised through exact Interface–Experience availability.
section: open-source
group: Product model
order: 14
---

# Journeys

**A Journey is one complete Actor goal:** browse and buy, refund an order,
catch up on unread items, rotate an API key.

A Journey is performed by Actors, uses one or more Capabilities, and declares
the exact Interface–Experience pairs through which the whole goal is promised.
It owns its observable acceptance Scenarios.

Journeys do not belong to one Domain. A goal can cross several Product areas;
its Domains are derived from its Capabilities.

## When you create one

Create a Journey for a goal someone would describe as a complete thing they
came to do. “Buy a product” is a Journey. “Validate a cart” is a step or
Capability inside one.

> **Journey vs Capability.** A Journey has an Actor goal and an end-to-end
> outcome. A [Capability](./capabilities.md) is a durable ability reused by
> goals and has no necessary beginning or end.
>
> **Journey vs Scenario.** A Journey stays stable while materially different
> observable paths become separate [Scenarios](./scenarios.md).

## The file

The directory name is the Journey ID.

```text
journeys/browse-and-buy/
├── journey.md
└── scenarios/
    ├── browse-catalog.md
    └── complete-checkout.md
```

```md [journeys/browse-and-buy/journey.md]
---
actors: [shopper]
capabilities: [catalog-browsing, checkout]
availability:
  - interface: customer-web
    experiences: [shopping]
  - interface: customer-mobile
    experiences: [shopping]
entryPoints:
  - customer-web: /
  - customer-mobile: shop://home
---

# Browse and buy

A shopper finds a product and completes checkout.
```

| Key | Required | Meaning |
| --- | --- | --- |
| `actors` | yes | At least one Actor pursuing the goal |
| `capabilities` | yes | At least one durable ability used by the goal |
| `availability` | yes | At least one exact Interface–Experience pair |
| `entryPoints` | no | Product-facing entry points keyed by an available Interface |
| `references` | no | Intent, implementation, or context artifacts; see [References](./references.md) |

The lead paragraph is the Journey summary. Optional
[References](./references.md) attach navigation or supporting context.

Every Capability used by the Journey must support every Journey availability
pair. This makes the promise implementable as written: the complete goal cannot
be required on an Interface where one of its required abilities is absent.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `needs at least one actor/capability/availability pair/scenario` | Each is part of a complete, verifiable goal. |
| `references missing actor/capability/interface/experience "…"` | A relationship names no entity. |
| `capability "…" is not available in "interface/experience"` | Narrow the Journey availability or add the pair to the Capability. |
| `entry point references undeclared interface "…"` | Use an Interface present in Journey availability. |
| `journeys/<id>/ is missing journey.md` | Add the Journey file or remove the incomplete directory. |
