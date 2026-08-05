---
title: Capabilities
description: Durable Product abilities with exact Interface availability, optionally scoped by Experience and organized by Domain.
section: open-source
group: Product Model
order: 14
---

# Capabilities

**A Capability is a durable ability of the Product:** catalog search, guest
checkout, reading-state tracking, or release approval. It completes the
sentence “the Product can …”.

A Capability has no necessary beginning or end. It can support several
Journeys, Experiences, Screens, and Interfaces. This is what distinguishes it
from a [Journey](./journeys.md), which is one complete Actor goal.

## When you create one

Create a Capability when an ability is reusable across goals or independently
important to Product scope, availability, Screens, or Business Rules. It should
remain meaningful beyond one route, command, or implementation module and
should not merely repeat a Journey title.

Every Capability declares its exact Interface availability, naming
[Experiences](./experiences.md) only where the Interface uses them. An optional
[Domain](./domains.md) can organize it, but Domains are not required.

## The file

Capabilities live at `capabilities/<capability-id>.md`.

```md [capabilities/checkout.md]
---
domain: ordering
availability:
  - interface: customer-web
    experiences: [shopping]
  - interface: customer-mobile
    experiences: [shopping]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `availability` | yes | Declare at least one valid Interface scope, with one record per Interface. Name Experiences when that Interface uses them. |
| `domain` | no | Name one existing Domain when the grouping is useful. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Capability and describe the durable Product ability. |

Capabilities do not duplicate Actor or Business Rule lists. Actors are
expressed through Journeys, Actor-bound Interfaces, and optional Experiences.
Business Rules own their own scope, and consumers derive backlinks.

## Availability

Each record creates only the pairs it names:

```yaml
availability:
  - interface: reader-web
    experiences: [public-discovery, personal-workspace]
  - interface: reader-mobile
    experiences: [personal-workspace]
```

This does not promise `public-discovery` on `reader-mobile`. Availability is
intended Product scope, not implementation status; `businesslens-verify`
checks whether the implementation satisfies it.

For an Interface with no Experiences, omit the `experiences` key:

```yaml
availability:
  - interface: operator-cli
```
