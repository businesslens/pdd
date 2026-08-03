---
title: Interfaces
description: Supported interaction forms through which Actors access the Product and for which behavior can be required independently.
section: open-source
group: Product model
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

| Key | Required | Meaning |
| --- | --- | --- |
| `actors` | yes | At least one Actor allowed to use some part of the Interface |
| `entryPoints` | no | Product-facing roots such as `/`, `reader://home`, `product admin`, or `/v1` |
| `references` | no | Intent, implementation, or context artifacts; see [References](./references.md) |

The H1, lead description, and `## Capability boundary` are required. Say what
the Interface excludes as well as what it supports.

An Interface does not declare one access mode: the same web application can
contain public and restricted Experiences. It also has no success exit;
Journeys and Scenarios own outcomes.

## With Experiences

An Interface is the supported interaction form. An
[Experience](./experiences.md) is the coherent context in which it is used. The
relationship is many-to-many: administration might exist through both an admin
web Interface and an operator CLI, while one web Interface might offer public
discovery and a personal workspace.

Capabilities, Journeys, Screens, Scenarios, and Rules use exact `availability`
pairs to say which combinations they support.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `interfaces/: the model needs at least one interface` | Every Product needs at least one supported interaction form. |
| `needs at least one actor` | The Interface must serve a valid Actor. |
| `references missing actor "…"` | An Actor ID has no file. |
| `missing "## Capability boundary" section` | State what the Interface supports and excludes. |
| `missing H1 title` / `missing lead paragraph (description)` | Every Interface needs both. |
