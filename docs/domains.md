---
title: Domains
description: Recognizable product areas that group features and journeys — named in product language, not code architecture.
section: open-source
group: Product model
order: 10
---

# Domains

**A domain is a recognizable product area:** ordering, catalog, billing.

Domains are an organizing layer for navigation and topology, not a technical
decomposition. Name them the way your product people talk, not the way your
directories are laid out.

## When you create one

Create a domain when you have a cluster of capabilities and goals that someone
in the business would name as one thing. Domains exist to keep a large model
navigable — a model with three journeys does not need five domains.

> **Domain vs feature.** A domain is a broad area used for organization; a
> [feature](./features.md) is a specific capability *within* one domain.

If a domain name only makes sense to engineers, it is probably a module, not a
domain.

## The file

Domains live at `domains/<domain-id>.md`.

```md [domains/ordering.md]
---
colorSlot: 4
codeRefs:
  - src/services/orders.ts
---

# Ordering

Everything between a full cart and a fulfilled order.
```

Both frontmatter keys are optional. `colorSlot` is a display hint for visual
product maps. `codeRefs` provide navigation when the domain boundary is
represented in code.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `id "<id>" must be lowercase kebab-case` | The filename stem is the ID. |
| `missing H1 title` / `missing lead paragraph (description)` | Every domain needs both. |
| `references missing domain "<id>"` | Reported on a feature or journey whose `domain:` names no existing domain file. |

## Referenced by

| From | Key | Cardinality |
| --- | --- | --- |
| [Features](./features.md) | `domain:` | Exactly one |
| [Journeys](./journeys.md) | `domain:` | Exactly one |
| [Business rules](./business-rules.md) | `domains:` | A list |
