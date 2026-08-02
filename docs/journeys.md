---
title: Journeys
description: Durable user and operator goals — the backbone of the model, and the first entity that requires code evidence.
section: open-source
group: Product model
order: 12
---

# Journeys

**A journey is a stable user or operator goal:** *browse and buy*, *refund an
order*, *rotate an API key*.

It belongs to a domain, is performed by actors through experiences, uses one or
more features, and carries `codeRefs` proving the goal is really served by the
code.

Journeys are the model's backbone. If a goal disappears from the product, its
journey is **deleted, not archived** — git history is the archive.

## When you create one

Create a journey for a goal someone would describe as a complete thing they came
to do. "Buy a product" is a journey. "Validate a cart" is a step inside one.

> **Journey vs scenario.** A journey stays stable while its success, permission,
> validation, conflict, and failure paths become separate
> [scenarios](./scenarios.md) whenever their observable outcomes differ
> materially.
>
> **Journey vs feature.** A journey is an end-to-end goal and may use several
> [features](./features.md); a feature is reusable across goals.

## The file

A journey is a **directory**, not a single file. The directory name is the ID.

```text
journeys/browse-and-buy/
├── journey.md
└── scenarios/
    ├── browse-catalog.md
    └── complete-checkout.md
```

The journey file itself lives at `journeys/<journey-id>/journey.md`.

```md [journeys/browse-and-buy/journey.md]
---
domain: ordering
actors: [shopper]
experiences: [storefront]
features: [catalog-browsing, checkout]
entryPoints:
  - web: src/routes/storefront.ts
codeRefs:
  - src/services/catalog.ts#CatalogService
  - src/services/orders.ts#OrderService.submit
---

# Browse and buy

A shopper finds a product in the catalog and completes checkout.
```

| Key | Required | Meaning |
| --- | --- | --- |
| `domain` | yes | Exactly one domain ID |
| `actors` | yes | At least one actor ID |
| `experiences` | yes | At least one experience ID |
| `features` | yes | At least one feature ID |
| `entryPoints` | no | How the goal is reached |
| `codeRefs` | yes¹ | At least one, outside a draft model |

¹ See [the draft rule](./evidence.md#the-draft-rule).

The lead paragraph is the journey's **summary**, not a description — one
sentence on what the actor accomplishes.

## What `validate` checks

| Finding | Meaning |
| --- | --- |
| `journeys/<id>/ is missing journey.md` | A journey directory without its journey file. Add it or delete the directory. |
| `needs at least one actor` | A goal nobody pursues is not a product claim. |
| `must belong to at least one experience` | A goal with no surface is unreachable. |
| `needs at least one scenario` | A goal with no observable path cannot be verified. |
| `needs at least one codeRef` | A behavioral claim without evidence. On a branch this is the planning checklist, not a failure — `businesslens-sync` attaches evidence after implementation. |
| `references missing domain "…"` / `missing feature "…"` | A relation names an entity that does not exist. |

## Planning with journeys

On a feature branch, a new journey with no `codeRefs` is exactly what planning
looks like. `validate` lists it, `businesslens-sync` clears it. See
[Your commit loop](./commit-loop.md).
