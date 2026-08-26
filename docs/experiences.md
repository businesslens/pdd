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
counterparts with separate qualified ids, not one shared entity.

## When you create one

**This is decided by rule, not by judgment.** An Interface holds Experiences
exactly when one of the following is true of it, and holds none when neither is:

- it serves more than one `access` value; or
- it serves two or more Actor sets whose Capability coverage is disjoint — no
  Capability available there lists Actors from both sets.

`lint` computes both from `actors`, `access`, and each Capability's
`availability`, so you never have to argue the question. There is one exception:
an Interface may keep a single Experience when another Interface has an
Experience of the same name, because the two are counterparts and flattening one
would make two views of one context look unrelated.

The conditions below explain what the rule is protecting:

1. it represents a coherent Actor context;
2. it has a meaningful capability boundary and exclusions;
3. it remains meaningful if routes, commands, or navigation are reorganized;
4. it normally supports several goals, Capabilities, Screens, or commands.

An overview page is usually a Screen, not an Experience. A command group is an
Experience only when it represents a durable operating context, not just parser
organization.

Use no Experiences when every Interface is already one coherent context. In
that case, availability names the Interface directly. Do not create a
one-to-one Experience merely to satisfy the file shape or make the report look
full.

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
| `actors` | yes | Name at least one unique existing Actor. Every Actor must be supported by the containing Interface. |
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
