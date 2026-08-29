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

`agent` is the surface an AI coding harness reaches through installed skills or
tools. It is a contract with its own Actors, boundary, and independently
verifiable behavior — not the harness's own interface, and not a way to describe
a library.

## Interfaces are inbound

Something *arrives* at the Product through an Interface. An outbound connection
your Product opens to a third party is not an Interface, however stable,
versioned, or vendor-supported that integration is.

Do not create an Interface for a feed your Product polls, a payment processor it
charges, a mail provider it sends through, or a model API it queries. Those
external systems are not [Actors](./actors.md) either—they have no goal in your
Product and no inbound interaction contract you must keep stable for them.
Model the call inside the
[Capability](./capabilities.md) that makes it, give its availability the
Interfaces where an Actor actually observes the result, and make the failure
behavior a [Capability Scenario](./capabilities.md#capability-scenarios).

When that same third party calls *you* back—a webhook, callback, or push
subscription—that inbound interaction happens through an **Interface**, and
the third party is its Actor. Direction decides, not ownership.

## The file

An Interface with no assets, Experiences, or Screens lives at
`interfaces/<interface-id>.md`. Otherwise it expands to
`interfaces/<interface-id>/interface.md`, with `experiences/` or `screens/`
nested in that folder.

```md [interfaces/customer-web.md]
---
type: web
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
| `type` | yes | Use one supported interaction contract: `web`, `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`, or `device`. |
| `actors` | yes | Name at least one existing Actor allowed to use some part of the Interface; do not repeat an ID. |
| `entryPoints` | no | List Product-facing roots such as `/`, `reader://home`, `product admin`, or `/v1`. Key each one with this Interface's own `type`, or with **another Interface's id** when that is where a reader arrives from — a local web report opened by a command says so here rather than in prose. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Interface. |
| Lead paragraph | yes | Describe the supported interaction form. |
| `## Capability boundary` | yes | State what the Interface supports and excludes. |

Every model needs at least one Interface.

The type describes how Actors interact with the Product, not how the Interface
is implemented. Use `web`, not `react`; use `mobile-app`, not `swift`. One
Interface has exactly one type. If two interaction contracts can be supported
and verified independently, model them as separate Interfaces. The Product
Report uses this authored value for its Interface icons and labels; it never
guesses from an Interface id or title.

An Interface does not declare one access mode: the same web application can
contain public and restricted Experiences. It also has no success exit;
Capability Scenarios own local observable outcomes. Journey Scenarios own
complete variations of a coherent multi-Capability goal.

## With Experiences

An [Experience](./experiences.md) is optional and belongs to exactly one
Interface: the Interface folder that contains it. Matching Experience names on
different Interfaces are counterparts, not one shared resource. When an
Interface has meaningful Experience contexts, Capability availability Contexts
use their qualified Experience places. When it has none, a Context uses the
Interface place directly. The [availability rules](./product-model.md#availability)
show both forms.
