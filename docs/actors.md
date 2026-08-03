---
title: Actors
description: Product-significant people and systems, classified by kind and by their relationship to the Product boundary.
section: open-source
group: Product model
order: 8
---

# Actors

**An Actor is a person or system whose goal, privilege, trigger, or outcome
changes Product behavior.** A shopper, store administrator, partner system, and
content source can all be Actors.

Every Actor declares two independent classifications:

- `kind: person|system` says whether the Actor is human;
- `relationship: external|internal` says whether it acts independently outside
  the Product owner's boundary or on the Product owner's behalf.

The relationship is about the Product, not network location. A staff operator
is usually internal even when working remotely. A partner system is usually
external even when connected over a private network.

## When you create one

Create an Actor only when its responsibility or privilege is
product-significant. If two roles have the same goals and permissions, they are
one Actor. An internal service is not an Actor merely because it calls another
service; a system becomes an Actor when its autonomous trigger, permissions, or
outcome belongs in the Product contract.

> **Actor vs persona.** A persona describes who someone is. An Actor exists
> because the Product must behave differently for them.

## The file

Actors live at `actors/<actor-id>.md`.

```md [actors/store-admin.md]
---
kind: person
relationship: internal
references:
  - kind: code
    role: implementation
    target: src/routes/admin.ts
---

# Store administrator

An employee who manages orders on behalf of the store.
```

The H1 is the name and the lead paragraph is the description. Optional
[References](./references.md) attach navigation or supporting context.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `kind "…" must be person\|system` | Add one of the two Actor kinds. |
| `relationship "…" must be external\|internal` | Classify the Actor relative to the Product boundary. |
| `id "…" must be lowercase kebab-case` | The filename stem is the ID. |
| `missing H1 title` / `missing lead paragraph (description)` | Every Actor needs both. |
| `references missing actor "…"` | An Interface, Experience, or Journey names no existing Actor. |

## Referenced by

| From | Key | Meaning |
| --- | --- | --- |
| [Interfaces](./interfaces.md) | `actors:` | Who may use any part of the Interface |
| [Experiences](./experiences.md) | `actors:` | Who participates in that coherent context |
| [Journeys](./journeys.md) | `actors:` | Who pursues the complete goal |
