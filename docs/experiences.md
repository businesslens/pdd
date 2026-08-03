---
title: Experiences
description: Where the product is used — a surface with a stable audience, an access mode, and a capability boundary.
section: open-source
group: Product model
order: 9
---

# Experiences

**An experience is a surface of the product** with a stable audience and a
capability boundary: the public storefront, the admin console, a CLI, a partner
API.

Each one declares who uses it, how it is reached, what protects it, what a
successful visit ends with, and — most importantly — **what it can and cannot
do**.

## When you create one

Create an experience when a surface has its own audience *and* its own
capability boundary. The test is the boundary: if the same actors can do the
same things, it is one experience with two entry points, not two experiences.

> **Experience vs feature.** An experience is **where** capabilities are
> exposed; a [feature](./features.md) is **what** capability exists there. One
> storefront exposes both catalog browsing and checkout.

Every model needs at least one experience — a product with no surface is not a
product.

## The file

Experiences live at `experiences/<experience-id>.md`.

```md [experiences/storefront.md]
---
actors: [shopper]
access: public
entryPoints:
  - web: /
exit: "Order confirmed and receipt shown"
---

# Storefront

The public web store where shoppers browse and buy.

## Capability boundary

Anonymous browsing; checkout creates an order. No administrative actions.
```

| Key | Meaning |
| --- | --- |
| `actors` | Actor IDs allowed on this surface |
| `access` | `public`, `authenticated`, or `restricted` |
| `entryPoints` | How the surface is reached — a list of single `type: path` maps, such as `web: /admin` or `api: /v1/orders` |
| `exit` | The exit contract: the successful state a visit ends in |

`## Capability boundary` is a recognized section and carries the most weight on
this entity. Say what the surface cannot do, not only what it can — that is the
half an agent cannot infer from your code.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `access "…" must be public\|authenticated\|restricted` | The only allowed access modes. |
| `references missing actor "…"` | An `actors:` entry names no existing actor file. |
| `experiences/: the model needs at least one experience` | An empty model is only valid transiently. Map established behavior with `businesslens-map` or author intended behavior with `businesslens-ideate`. |
| `"entryPoints" must be a list` / `each entry point must be a single "type: path" map` | Entry-point shape. One key per list item. |
| `missing H1 title` / `missing lead paragraph (description)` | Every experience needs both. |

Experiences may carry optional `codeRefs` for navigation. See
[Code refs and coverage](./code-refs-and-coverage.md).

> **Entry point vs codeRef.** An entry point says how an actor *reaches* the
> surface. A `codeRef` is an optional bookmark into relevant tracked source.
