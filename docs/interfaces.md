---
title: Interfaces
description: Supported ways for Actors to interact with the Product, with behavior that can be required independently.
section: open-source
group: Product Model
order: 10
terms:
  - term: Interface
    definition: "A supported way for Actors to interact with the Product, such as a web app, a CLI, or a partner API."
  - term: Interface type
    anchor: the-file
    definition: "The form an Interface takes: web, mobile app, desktop app, CLI, API, webhook, messaging, voice, device, or agent."
  - term: Capability boundary
    anchor: the-file
    definition: "What an Interface, Experience, or Screen supports and excludes. Capability availability is declared on each Capability."
  - term: Entry point
    aliases: [Starts at]
    anchor: the-file
    definition: "A Product-facing route or address where an Actor arrives, such as a path, a deep link, or a command."
  - term: Experience
    anchor: experiences
    definition: "A stable context for using the Product within one Interface, with a defined audience, access mode, and capability boundary."
  - term: Access mode
    anchor: experience-file
    definition: "Who may enter an Experience: public, authenticated, or restricted."
  - term: Screen
    anchor: screens
    definition: "A meaningful visual view, named in the Product's own words, directly under an Interface or inside one of its Experiences."
  - term: View state
    anchor: view-states-are-the-views-never-the-things
    definition: "A condition of a Screen, such as empty, populated, or unauthorized. It describes the view rather than an Entity's Lifecycle."
---

# Interfaces

**An Interface is a supported way for Actors to interact with the Product.**
Customer web, reader mobile, operator CLI, and partner API can be
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
external systems do not [act](./entities.md#actors-an-entity-that-acts)
either—they have no goal in your Product and no inbound interaction contract you
must keep stable for them.
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
`interfaces/<interface-id>/interface.md`, with `experiences/`, `screens/`, or
both nested in that folder — both only for a [Screen shared across its
Experiences](./interfaces.md#screens-shared-across-experiences).

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
| `type` | yes | Use one supported interaction contract: `web`, `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`, `device`, or `agent`. |
| `actors` | yes | Name at least one existing Entity that `acts` — who uses the Interface, a descriptive list, never a permission claim; do not repeat an ID. |
| `entryPoints` | no | List Product-facing roots such as `/`, `reader://home`, `product admin`, or `/v1`. Key each one with this Interface's own `type`, or with **another Interface's id** when that is where a reader arrives from — a local web report opened by a command says so here rather than in prose. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Interface. |
| Lead paragraph | yes | Describe how Actors interact with the Product through this Interface. |
| `## Capability boundary` | yes | State what the Interface supports and excludes. |

The Capability boundary describes what the Interface supports and excludes in
prose. It does not list Capability names: each [Capability](./capabilities.md#availability)
declares where it is available. Experiences and Screens also require this
section, describing what each supports and excludes.

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

## In the Product Report

Interfaces is the entry point for Interfaces, Experiences, and Screens. List
shows an expandable directory; Map draws their actual containment as a connected
interactive tree. An Interface's Overview shows its contained resources and
Capability delivery. Compare delivery opens the cross-Interface reading.

Each name opens its own resource page. Breadcrumbs follow actual ownership;
shared Screens appear once under their Interface, with links from Experiences.
Search can find an Experience or Screen across Interfaces without drilling
through each parent. Experiences and Screens are explained below.

## Experiences

**An Experience is a stable context for using the Product within one
[Interface](./interfaces.md).** It has a defined audience, access mode, and
capability boundary. Public discovery, personal workspace, administration,
account management, and partner automation are possible Experiences.

An Experience belongs to exactly one Interface, determined by its folder.
Similar Experiences on another Interface are counterparts with separate
qualified ids. The rules below determine when an Interface requires Experiences
and when existing Experiences are justified.

### When to create an Experience

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

### Experience file

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

### Experiences in the Product Report

Find an Experience through Interfaces or search. Its page keeps Interfaces
selected and shows its owning Interface in the breadcrumb. Overview includes its
Screens, references to shared Screens, and available Capabilities. Interface map
opens the same containment graph focused on this Experience.

## Screens

**A Screen is a meaningful user-visible view** where Product information or
Capabilities are exposed. It describes what users understand and can do there,
not how the view is implemented or drawn.

Screens are optional. A visual Product may need them; a CLI, supported API, or
other non-visual Interface may not. A Screen need not have a URL, fill a device,
or correspond to one component, route module, or view controller.

### When to create a Screen

Create a Screen when a view has a stable Product purpose, meaningful
information or actions, and a capability boundary worth preserving. Do not
create Screens for responsive layouts, themes, hover variants, skeletons,
components, or every route found in source.

**Error, legal and other capability-free views are not Screens.** A Screen must
name at least one Capability, and a not-found page, a privacy policy, or a terms
page exposes none — nothing about the Product's abilities happens there. Model
such a view as a View state of the view it interrupts, or leave it out of the
model entirely. A repository rule that every implemented route must appear
somewhere is a documentation rule, not a Product Model rule; do not satisfy it by
inventing a Capability the view does not have.

> **Experience vs Screen.** An [Experience](./interfaces.md#experiences) is a coherent
> context inside one Interface. A Screen is one meaningful visual view inside
> that context, or directly on an Interface no Experience divides.
>
> **Screen vs Scenario.** A Screen says what is visible and possible at a view.
> A [Capability Scenario](./capabilities.md#capability-scenarios) or
> [Journey Scenario](./journeys.md#journey-scenarios) is a concrete observable behavior
> contract in which that view may participate.

### Screen file

An assetless Screen lives at
`interfaces/<interface-id>/experiences/<experience-id>/screens/<screen-id>.md`
(or directly under an Interface's `screens/`: an undivided Interface's own
Screens, or a Screen a divided Interface shares across its Experiences). A Screen with assets
expands to `<screen-id>/screen.md`. The whole Screen collection is optional.

```md [screens/product-record.md]
---
capabilities: [browse-catalog]
entities: [catalog-product]
entryPoints:
  - customer-web: /products/:id
  - customer-mobile: shop://products/:id
references:
  - kind: visual
    role: intent
    target: https://example.com/designs/product-record
---

# Product record

Shows the information a shopper needs to evaluate one product.

## Information presented

- Product name and description
- Price and availability

## Available actions

- Add the product to the cart
- Return to the catalog

## View states

### Available

The product can be added to the cart.

## Capability boundary

The Screen does not change product or inventory data.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `capabilities` | yes | Name at least one unique existing Capability; each must declare an availability Context for the Interface or Experience containing this Screen. A Screen shared beside `experiences/` needs one for every Experience of its Interface, and `lint` names the Experiences a Capability is missing from. |
| `entities` | no | Name the [Entities](./entities.md) this Screen presents. A Rule that governs who may read one of them is checked against who reaches this Screen. |
| `entryPoints` | no | Key public routes or deep links by the Interface that holds this Screen. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Screen and describe its Product purpose. |
| `## Information presented` | yes | Include at least one meaningful bullet item, with each item on one physical line. |
| `## Available actions` | no | Include a bullet list when present, with each item on one physical line. |
| `## View states` | no | Give every H3 state a description. |
| `## Capability boundary` | yes | State what the Screen supports and excludes. |

Screens do not declare availability and do not list Scenarios. Their folder
path is already authoritative for their containing Interface or Experience. A
Scenario participates in a Screen when one of its Step Contexts names that
Screen as its most-specific `place`. When that Step names a Capability, the Screen must
expose it. Consumers derive both Capability Scenario and Journey Scenario
backlinks from those Step Contexts.

### View states are the view's, never the thing's

`## View states` lists conditions of a Screen, such as empty, populated,
unauthorized, or caught-up. Include a condition when it changes what an Actor
understands or can do in that view.

An [Entity's lifecycle](./entities.md#states-and-the-lifecycle-nobody-authors)
describes the Entity's States. A Screen that presents the Entity declares it in
`entities` and describes how its own view changes. The same Entity State can
appear differently on different Screens.

`## Information presented` follows the same split: what *this view* shows —
counts, feedback, derived values, combinations — never a restatement of what the
Entity keeps. Declare the Entity and let the reader follow the link.

### Screens shared across Experiences

An Interface usually holds either `screens/` or `experiences/`. It may hold
**both** when a Screen is genuinely common to its Experiences rather than
belonging to one — an item reader that opens from a private library and from a
published collection alike. A Screen beside `experiences/` is reachable from
every Experience of that Interface, and two Screens with the same name below
different Experiences of one Interface are counterparts exactly as they are
across Interfaces.

A shared Screen is inside every Experience of its Interface. Its id is
`interface-id::screen-id`, every Capability it exposes must be available in
each Experience, and a Scenario Step on it counts as coverage for each. That is
the test for whether a view is really shared: if its Capabilities differ by
Experience, it is two Screens, one under each Experience, which are
counterparts. A Screen that belongs to one Experience belongs inside it.

### Web and mobile

The same view on web and on mobile is two Screen folders with the same name —
counterparts, told apart by their path. Give them the same purpose, information
and actions when that is the truth; stating each separately is what makes a
divergence between them visible instead of silent.

### Navigation

Screens are not an authored sitemap. Consumers can generate a Screen map by
Interface and Experience, while Capability Scenarios and Journey Scenarios
describe observable behavior and movement. Parent, next, generic transition,
route-tree, and XML sitemap data do not belong in the Product Model. An
information-architecture diagram can be an external `doc` or `visual`
Reference.

Model-owned screenshots, mockups, and diagrams live beside an expanded
`screen.md`; generated captures go under its `implementation/` directory.
External or separately maintained artifacts such as Figma files attach through
[References](./references.md). `lint` checks asset metadata and paths, but does
not interpret whether a visual matches the Product.

A CLI or API does not need substitute Command or Endpoint resource types. Keep
command syntax in CLI help and endpoint schemas in the API contract; model the
durable Capabilities, both observable Scenario types, optional Journeys, and
Rules they expose.

### Screens in the Product Report

Find Screens in the Interfaces directory or search. A Screen opens its own page
with its actual Interface and optional Experience in the breadcrumb. A shared
Screen has one canonical page under its Interface. Interface map shows its
containment context; lines do not represent Screen-to-Screen navigation.
