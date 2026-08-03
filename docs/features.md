---
title: Features
description: Stable product capabilities that sit inside a domain and connect actors and experiences to the rules that constrain them.
section: open-source
group: Product model
order: 12
---

# Features

**A feature is a stable product capability:** catalog search, guest checkout,
release approval.

It sits inside one domain and connects the actors and experiences that use it to
the business rules that constrain it. Features make capabilities directly
addressable without forcing a team to pretend that every capability is itself an
end-to-end user goal.

## When you create one

Create a feature when a capability is **reusable across goals** or worth naming
on its own. *Catalog search* is used while browsing and while building a
reorder — one feature, two journeys.

> **Feature vs journey.** A feature can be reused across goals; a
> [journey](./journeys.md) is one end-to-end goal and may use several features.
>
> **Feature vs experience.** A feature is **what** capability exists; an
> [experience](./experiences.md) is **where** it is exposed.

A feature needs at least one experience — a capability with no surface is not
reachable.

## The file

Features live at `features/<feature-id>.md`.

```md [features/checkout.md]
---
domain: ordering
actors: [shopper]
experiences: [storefront]
businessRules: [payment-before-confirmation]
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
```

| Key | Meaning |
| --- | --- |
| `domain` | Exactly one domain ID |
| `actors` | Actor IDs this capability serves |
| `experiences` | Experience IDs exposing it — at least one |
| `businessRules` | Rule IDs constraining it |

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `references missing domain "…"` / `missing actor "…"` / `missing experience "…"` | A relation points at an entity that does not exist. Create it or fix the ID. |
| `missing H1 title` / `missing lead paragraph (description)` | Every feature needs both. |
| `unknown frontmatter key "<key>"` | The schema is a strict allowlist, so typos fail loudly. |

Features may carry optional `codeRefs` for navigation; no entity requires them.
See [Code refs and coverage](./code-refs-and-coverage.md).
