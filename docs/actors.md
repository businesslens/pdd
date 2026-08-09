---
title: Actors
description: Product-significant people and systems, classified by kind and by their relationship to the Product boundary.
section: open-source
group: Product Model
order: 9
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

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a lowercase kebab-case stem as the Actor ID. |
| `kind` | yes | Use `person` or `system`. |
| `relationship` | yes | Use `external` or `internal` relative to the Product boundary. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name and describe the Actor. |

Every Actor ID named by another entity must have a corresponding file.

## Referenced by

| From | Key | Meaning |
| --- | --- | --- |
| [Interfaces](./interfaces.md) | `actors:` | Who may use any part of the Interface |
| [Experiences](./experiences.md) | `actors:` | Who participates in that coherent context |
| [Capability Scenarios](./capability-scenarios.md) | `actors:` | Who participates in the local Capability case |
| [Journeys](./journeys.md) | `actors:` | Who shares the stable intent and success criterion |
| [Journey Scenarios](./journey-scenarios.md) | `actors:` | Who participates in the end-to-end Journey variation |
