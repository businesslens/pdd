---
title: Capabilities
description: Durable Product abilities with exact Interface–Experience availability, reusable across goals and optionally organized by Domain.
section: open-source
group: Product model
order: 13
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
important to Product scope, availability, Screens, or Rules. It should remain
meaningful beyond one route, command, or implementation module and should not
merely repeat a Journey title.

Every Capability declares its exact Interface–Experience availability. An
optional [Domain](./domains.md) can organize it, but Domains are not required.

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

| Key | Required | Meaning |
| --- | --- | --- |
| `availability` | yes | At least one exact Interface–Experience pair |
| `domain` | no | One Domain ID when the grouping is useful |
| `references` | no | Intent, implementation, or context artifacts; see [References](./references.md) |

Capabilities do not duplicate Actor or Business Rule lists. Actors are
expressed through Journeys and Actor-bound Interfaces and Experiences. Business
Rules own their own scope, and consumers derive backlinks.

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

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `needs at least one availability pair` | Declare where the Capability exists. |
| `references missing interface/experience "…"` | A pair names no entity. |
| `experience "…" does not declare interface "…"` | The pair is impossible in the Experience matrix. |
| Duplicate availability finding | Use one record per Interface and list each Experience once. |
| `references missing domain "…"` | The optional Domain ID has no file. |
| `missing H1 title` / `missing lead paragraph (description)` | Every Capability needs both. |
