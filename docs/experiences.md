---
title: Experiences
description: Coherent contexts of Product use with a stable audience, access boundary, and capability boundary inside one Interface.
section: open-source
group: Product Model
order: 11
---

# Experiences

**An Experience is a coherent context in which Actors use the Product.** Public
discovery, personal workspace, administration, account management, and partner
automation are possible Experiences.

Experiences are optional. An Experience has a stable audience, access boundary,
and capability boundary inside exactly one [Interface](./interfaces.md), which
is determined by its folder. Similar Experiences on another Interface are
counterparts with separate qualified ids, not one shared resource.

## When you create one

**Whether an Interface is divided into Experiences is derived, never judged.**
`lint` computes it from `actors`, `access`, each Capability's `availability`,
and its Scenarios' Steps, so the author never applies a prose test. Two rules
decide it, one in each direction:

- **An Interface must hold Experiences** when its Actors split into groups that
  no Capability available there bridges. Holding none is a `lint` **error**:
  those groups are separate contexts, not one.
- **An Interface that holds Experiences must justify them.** Its Experiences
  differ in `access`, or its audiences are disjoint, or one is a counterpart —
  an Experience whose name also exists under another Interface, the same context
  on another platform, which justifies itself because flattening it would make
  two views of one context look unrelated. None of the three, and it is a
  `lint` **error**: use direct Interface availability instead.

Disjoint audiences is the only input that *requires* division. `access` only
justifies Experiences that already exist, because an Interface declares no
`access` of its own — the value lives on each Experience.

The rule protects one thing: an Experience is a context that stays meaningful
when routes, commands, or navigation are reorganized, because it is defined by
who is there and what they can do, not by how the surface is laid out. An
overview page is usually a Screen, not an Experience. A command group is an
Experience only when the rule divides its Interface, not because a parser groups
its commands.

When nothing divides an Interface, availability names the Interface directly.
Do not create a one-to-one Experience to satisfy the file shape or make the
report look full; `lint` refuses it.

## The file

An Experience with no assets or Screens lives at
`interfaces/<interface-id>/experiences/<experience-id>.md`. Otherwise it
expands to `<experience-id>/experience.md`, with `screens/` inside its folder.

```md [experiences/administration.md]
---
actors: [store-admin]
access: restricted
entryPoints:
  - admin-web: /admin
---

# Administration

Where authorized operators manage the Product and its users.

## Capability boundary

Supports operational administration. It does not grant customer privileges.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one unique Entity that `acts`. Every Actor must be supported by the containing Interface. |
| `access` | yes | Use `public`, `authenticated`, or `restricted`. |
| `entryPoints` | no | Key Product entry points using the containing Interface as the key. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Experience. |
| Lead paragraph | yes | Describe the coherent usage context. |
| `## Capability boundary` | yes | State what the Experience supports and excludes. |

The entire `experiences/` directory is optional. When an Interface contains
Experiences, availability Contexts use their qualified places. The union of
Actors across those Experiences must cover
every Actor declared by the Interface; Experiences may overlap, but they cannot
leave an Interface Actor without a usable context. An Interface with no
Experiences uses direct availability:

```yaml
availability:
  - place: release-cli
```

There is no `exit` field. A persistent context does not have one useful success
exit; Capability Scenario and Journey Scenario outcomes state what happens in
concrete cases.
