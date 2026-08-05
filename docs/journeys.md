---
title: Journeys
description: Complete Actor goals assembled from Capabilities and promised through exact Interface availability, optionally scoped by Experience.
section: open-source
group: Product Model
order: 15
---

# Journeys

**A Journey is one complete Actor goal:** browse and buy, refund an order,
catch up on unread items, rotate an API key.

A Journey is performed by Actors, uses one or more Capabilities, and declares
the exact Interface scopes through which the whole goal is promised. It names
Experiences where the Interface uses them and owns its observable acceptance
Scenarios.

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

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one existing Actor pursuing the goal. |
| `capabilities` | yes | Name at least one existing Capability; each must support every Journey availability scope. |
| `availability` | yes | Declare at least one valid Interface scope, naming Experiences when that Interface uses them. |
| `entryPoints` | no | Key Product-facing entry points by an Interface in Journey availability. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| `scenarios/` | yes | Include at least one valid Scenario. |
| H1 and lead paragraph | yes | Name the Journey and summarize the complete goal. |

Every Journey directory must contain `journey.md`.
