---
title: Domains
description: Optional recognizable Product areas that organize related Capabilities without owning Journeys or mirroring code architecture.
section: open-source
group: Product Model
order: 13
---

# Domains

**A Domain is an optional recognizable Product area:** ordering, catalog,
billing. Domains organize related Capabilities in a large model; they do not
classify the Product and do not own Journeys.

Name Domains in Product language, not after code directories, services, teams,
or deployment boundaries. A Journey can use Capabilities from several Domains,
so its Domain grouping is derived instead of choosing an artificial primary
Domain.

## When you create one

Create a Domain only when a cluster of Capabilities forms an area that Product
stakeholders would name and the grouping makes the model easier to navigate.
Zero Domains is valid. A small Product often needs none.

> **Domain vs Capability.** A Domain organizes a broad area; a
> [Capability](./capabilities.md) is one durable ability the Product provides.

## The file

Domains live at `domains/<domain-id>.md`. The entire directory is optional.

```md [domains/ordering.md]
---
colorSlot: 4
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts
---

# Ordering

Everything between a full cart and a fulfilled order.
```

`colorSlot` is an optional display hint. [References](./references.md) are
optional navigation or context.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `id "…" must be lowercase kebab-case` | The filename stem is the ID. |
| `missing H1 title` / `missing lead paragraph (description)` | Every authored Domain needs both. |
| `references missing domain "…"` | A Capability or Business Rule names no existing Domain. |

## Referenced by

| From | Key | Cardinality |
| --- | --- | --- |
| [Capabilities](./capabilities.md) | `domain:` | Zero or one |
| [Business rules](./business-rules.md) | `domains:` | A list |
