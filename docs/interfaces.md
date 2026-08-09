---
title: Interfaces
description: Supported interaction forms through which Actors access the Product and for which behavior can be required independently.
section: open-source
group: Product Model
order: 10
---

# Interfaces

**An Interface is a supported interaction form through which Actors access the
Product.** Customer web, reader mobile, operator CLI, and partner API can be
Interfaces when the Product makes an independently meaningful commitment
through them.

Interfaces are not Product types or technology labels. One Product may expose a
website, mobile application, CLI, and API together. They remain one Product
when they serve one coherent value promise; the Interfaces say where particular
behavior is promised.

## When you create one

Create an Interface when Actors can interact with the Product through it and
its support can be independently required and verified. Do not create one for
every framework, package, adapter, internal endpoint, or deployable.

An API belongs in the model only when it is itself a supported interaction
contract—for example, a partner automation API. An internal API used to
implement the web application is an implementation detail. Apply the same test
to command namespaces, integrations, and background system interactions.

## The file

Interfaces live at `interfaces/<interface-id>.md`.

```md [interfaces/customer-web.md]
---
actors: [shopper]
entryPoints:
  - web: /
---

# Customer web application

The browser Interface through which shoppers browse and buy.

## Capability boundary

Supports customer shopping. It does not expose store administration.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one existing Actor allowed to use some part of the Interface. |
| `entryPoints` | no | List Product-facing roots such as `/`, `reader://home`, `product admin`, or `/v1`. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Interface. |
| Lead paragraph | yes | Describe the supported interaction form. |
| `## Capability boundary` | yes | State what the Interface supports and excludes. |

Every model needs at least one Interface.

An Interface does not declare one access mode: the same web application can
contain public and restricted Experiences. It also has no success exit;
Capability Scenarios own local observable outcomes. Journey Scenarios own
complete variations of a coherent multi-Capability goal.

## With Experiences

[Experience](./experiences.md) is optional and many-to-many with Interface.
When an Interface has meaningful Experience contexts, availability names the
exact combinations. When it has none, availability names the Interface
directly. The [availability rules](./product-model.md#availability) show both
forms.
