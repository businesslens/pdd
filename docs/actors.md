---
title: Actors
description: Who uses the product — people, systems, and operators distinguished by a goal or a privilege.
section: open-source
group: Product model
order: 8
---

# Actors

**An actor is someone — or something — with a goal or a privilege.** A shopper,
a store admin, a billing webhook.

Actors are defined by what they are trying to accomplish, never by UI screens or
database roles.

## When you create one

Create an actor when its goal or privilege **changes product behavior**.

If two "roles" share the same goals and the same permissions, they are one
actor. Demographics, job titles, and database roles alone do not create actors —
a `premium_user` row in a table is an actor only if the product actually behaves
differently for it.

> **Actor vs persona.** A persona describes who someone is. An actor exists
> because of what the product must do differently for them.

## The file

Actors live at `actors/<actor-id>.md`.

```md [actors/shopper.md]
---
codeRefs:
  - src/routes/storefront.ts
---

# Shopper

A visitor who browses the catalog and buys products.
```

No required frontmatter. The H1 is the name and the lead paragraph is the
description. Optional `codeRefs` provide navigation when the actor boundary is
represented in code. They are never required and do not prove the boundary.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `id "<id>" must be lowercase kebab-case` | The filename stem is the ID and must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. |
| `missing H1 title` | Every actor needs a `# Heading`. |
| `missing lead paragraph (description)` | Add prose between the H1 and the first `##`. |
| `references missing actor "<id>"` | Reported on the *other* entity — an experience, feature, or journey points at an actor file that does not exist. Create it or fix the ID. |

## Referenced by

| From | Key | Meaning |
| --- | --- | --- |
| [Experiences](./experiences.md) | `actors:` | Who may enter this surface |
| [Features](./features.md) | `actors:` | Who this capability is for |
| [Journeys](./journeys.md) | `actors:` | Who pursues this goal — at least one required |
