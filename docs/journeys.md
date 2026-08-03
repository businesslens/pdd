---
title: Journeys
description: Durable user and operator goals — the backbone of the model and the parent of observable acceptance scenarios.
section: open-source
group: Product model
order: 12
---

# Journeys

**A journey is a stable user or operator goal:** *browse and buy*, *refund an
order*, *rotate an API key*.

It belongs to a domain, is performed by actors through experiences, and uses one
or more features. Optional `codeRefs` can point a reader toward relevant code.

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
| `codeRefs` | no | Optional tracked-file navigation |

The lead paragraph is the journey's **summary**, not a description — one
sentence on what the actor accomplishes.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `journeys/<id>/ is missing journey.md` | A journey directory without its journey file. Add it or delete the directory. |
| `needs at least one actor` | A goal nobody pursues is not a product claim. |
| `must belong to at least one experience` | A goal with no surface is unreachable. |
| `needs at least one scenario` | A goal with no observable path cannot be verified. |
| `references missing domain "…"` / `missing feature "…"` | A relation names an entity that does not exist. |

## Planning

Approved planned behavior belongs in the model before implementation. Missing
codeRefs are not lifecycle state, so use `businesslens-verify`—not bookmarks—to
check whether the journey is implemented. See [The loop](./the-loop.md).
