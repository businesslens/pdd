---
title: Experiences
description: Coherent contexts of Product use with a stable audience, access boundary, and capability boundary across one or more Interfaces.
section: open-source
group: Product model
order: 11
---

# Experiences

**An Experience is a coherent context in which Actors use the Product.** Public
discovery, personal workspace, administration, account management, and partner
automation are possible Experiences.

An Experience has a stable audience, access boundary, and capability boundary.
It may be offered through one or more [Interfaces](./interfaces.md): the same
administration Experience might exist in an admin website and an operator CLI.

## When you create one

Create an Experience when all of these are true:

1. it represents a coherent Actor context;
2. it has a meaningful capability boundary and exclusions;
3. it remains meaningful if routes, commands, or navigation are reorganized;
4. it normally supports several goals, Capabilities, Screens, or commands; and
5. its availability through different Interfaces has product meaning.

An overview page is usually a Screen, not an Experience. A command group is an
Experience only when it represents a durable operating context, not just parser
organization.

## The file

Experiences live at `experiences/<experience-id>.md`.

```md [experiences/administration.md]
---
actors: [store-admin]
interfaces: [admin-web, operator-cli]
access: restricted
entryPoints:
  - admin-web: /admin
  - operator-cli: product admin
---

# Administration

Where authorized operators manage the Product and its users.

## Capability boundary

Supports operational administration. It does not grant customer privileges.
```

| Key | Required | Meaning |
| --- | --- | --- |
| `actors` | yes | At least one Actor participating in this context |
| `interfaces` | yes | At least one Interface offering it |
| `access` | yes | `public`, `authenticated`, or `restricted` |
| `entryPoints` | no | Interface-keyed Product entry points; every key must be declared in `interfaces` |
| `references` | no | Intent, implementation, or context artifacts; see [References](./references.md) |

There is no `exit` field. A persistent context does not have one useful success
exit; Journey and Scenario outcomes state what Actors accomplish.

Every Experience Actor must also be supported by each declared Interface. This
makes the audience promise consistent before more exact availability is added.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `needs at least one actor` / `needs at least one interface` | Both relationships are required. |
| `access "…" must be public\|authenticated\|restricted` | Use one access mode. |
| `references missing actor/interface "…"` | A relationship names no entity. |
| `actor "…" is not supported by interface "…"` | Add the Actor to the Interface or correct the Experience relation. |
| `entry point references undeclared interface "…"` | Entry-point keys are Interface IDs, not generic platform labels. |
| `missing "## Capability boundary" section` | State what this Experience supports and excludes. |
| `experiences/: the model needs at least one experience` | Every Product needs a coherent usage context. |
