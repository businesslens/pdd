---
title: Experiences
description: Coherent contexts of Product use with a stable audience, access boundary, and capability boundary across one or more Interfaces.
section: open-source
group: Product Model
order: 11
---

# Experiences

**An Experience is a coherent context in which Actors use the Product.** Public
discovery, personal workspace, administration, account management, and partner
automation are possible Experiences.

Experiences are optional. An Experience has a stable audience, access boundary,
and capability boundary. It may be offered through one or more
[Interfaces](./interfaces.md): the same administration Experience might exist
in an admin website and an operator CLI.

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

Use no Experiences when every Interface is already one coherent context. In
that case, availability names the Interface directly. Do not create a
one-to-one Experience merely to satisfy the file shape or make the report look
full.

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

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one existing Actor. Every Actor must be supported by every declared Interface. |
| `interfaces` | yes | Name at least one existing Interface offering the Experience. |
| `access` | yes | Use `public`, `authenticated`, or `restricted`. |
| `entryPoints` | no | Key Product entry points by an Interface declared in `interfaces`. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Experience. |
| Lead paragraph | yes | Describe the coherent usage context. |
| `## Capability boundary` | yes | State what the Experience supports and excludes. |

The entire `experiences/` directory is optional. If any Experience names an
Interface, all availability for that Interface must name one or more of its
Experiences. An Interface with no Experiences uses direct availability:

```yaml
availability:
  - interface: release-cli
```

There is no `exit` field. A persistent context does not have one useful success
exit; Journey and Scenario outcomes state what Actors accomplish.
