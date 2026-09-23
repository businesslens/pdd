---
title: Interfaces
description: Supported ways for Actors to interact with the Product, the contexts inside them, and the places where facts and abilities are met.
section: open-source
group: Product Model
order: 10
terms:
  - term: Interface
    definition: "A supported way for Actors to interact with the Product, such as a web app, a CLI, or a partner API."
  - term: Interface type
    anchor: the-file
    definition: "The form an Interface takes: web, mobile app, desktop app, CLI, API, webhook, messaging, voice, device, or agent."
  - term: Entry point
    aliases: [Starts at]
    anchor: the-file
    definition: "A Product-facing route or address where an Actor arrives, such as a path, a deep link, or a command."
  - term: Navigation
    anchor: navigation
    definition: "The Screens reachable from every place inside an Interface or Experience. Structure, never a transition: movement is derived from Steps."
  - term: Experience
    anchor: experiences
    definition: "A stable context for using the Product within one Interface, defined by who is there and what they can do, with an access mode."
  - term: Access mode
    anchor: experience-file
    definition: "Who may enter an Experience: public, authenticated, or restricted."
  - term: Version
    anchor: variation
    definition: "Which of several concurrent versions an Experience serves. Written only where its Interface serves more than one at once."
  - term: Screen
    anchor: screens
    definition: "A place inside an Interface or Experience, named in the Product's own words, where an Actor meets facts and abilities."
  - term: Child Screen
    aliases: [Nested Screen]
    anchor: screens-nest
    definition: "A Screen inside another Screen, whose content depends on an act in its parent: picking a row, choosing a tab, advancing a step."
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

Inside an Interface, the model says what an Actor can reach, see, do and
trigger at each place. It never says how that looks or is built — see
[Is this a design spec?](#is-this-a-design-spec).

## When you create one

Create an Interface when Actors can interact with the Product through it and
its support can be independently required and verified. Do not create one for
every framework, package, adapter, internal endpoint, or deployable.

An API belongs in the model only when it is itself a supported interaction
contract—for example, a partner automation API. An internal API used to
implement the web application is an implementation detail. Apply the same test
to command namespaces, integrations, and background system interactions.

`agent` is the surface an AI coding harness reaches through installed skills or
tools. It is a contract with its own Actors and independently verifiable
behavior — not the harness's own interface, and not a way to describe a
library.

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
languages: [en, de-DE]
navigation: [catalog, cart]
---

# Customer web application

The browser Interface through which shoppers browse and buy.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `type` | yes | Use one supported interaction contract: `web`, `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`, `device`, or `agent`. |
| `actors` | yes | Name at least one existing Entity that `acts` — who uses the Interface, a descriptive list, never a permission claim; do not repeat an ID. |
| `entryPoints` | no | List Product-facing roots such as `/`, `reader://home`, `product admin`, or `/v1`. Key each one with this Interface's own `type`, or with **another Interface's id** when that is where a reader arrives from — a local web report opened by a command says so here rather than in prose. |
| `languages` | no | Narrow the [Product's languages](./product.md#the-file) to the ones this Interface serves: a unique list of tags, each one the Product declares. An Interface listing languages while the Product declares none is an error. |
| `navigation` | no | List the Screens reachable from every place inside this Interface, each as a path relative to it — `catalog`, `library::by-source`. Unique values; order carries no meaning. See [Navigation](#navigation). |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Interface. |
| Lead paragraph | yes | Describe how Actors interact with the Product through this Interface. |
| `## Intent` | no | Explain the outcome this Interface's commitment protects. |

An Interface does not list what it supports and excludes: each
[Capability](./capabilities.md#availability) declares where it is available,
and that positive claim is the whole boundary. Other H2 sections are kept as
supporting sections.

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

## Experiences

**An Experience is a stable context for using the Product within one
[Interface](./interfaces.md).** It is defined by who is there and what they can
do — a defined audience and an access mode — never by what it looks like.
Public discovery, personal workspace, administration, account management, and
partner automation are possible Experiences.

An Experience belongs to exactly one Interface, determined by its folder.
Similar Experiences on another Interface are counterparts with separate
qualified ids. The rules below determine when an Interface requires Experiences
and when existing Experiences are justified.

### When to create an Experience

**Whether an Interface is divided into Experiences is derived, never judged.**
`lint` computes it from `actors`, `access`, `version`, each Capability's
`availability`, and its Scenarios' Steps, so the author never applies a prose
test. Two rules decide it, one in each direction:

- **An Interface must hold Experiences** when its Actors split into groups that
  no Capability available there bridges. Holding none is a `lint` **error**:
  those groups are separate contexts, not one.
- **An Interface that holds Experiences must justify them.** Its Experiences
  differ in `access`, or its audiences are disjoint, or they serve distinct
  [versions](#variation) of one context at once, or one is a counterpart —
  an Experience whose name also exists under another Interface, the same context
  on another platform, which justifies itself because flattening it would make
  two views of one context look unrelated. None of the four, and it is a
  `lint` **error**: use direct Interface availability instead.

Disjoint audiences is the only input that *requires* division. `access` and
`version` only justify Experiences that already exist, because an Interface
declares neither of its own — the values live on each Experience.

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
navigation: [dashboard]
---

# Administration

Where authorized operators manage the Product and its users.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one unique Entity that `acts`. Every Actor must be supported by the containing Interface. |
| `access` | yes | Use `public`, `authenticated`, or `restricted`. |
| `entryPoints` | no | Key Product entry points using the containing Interface as the key. |
| `navigation` | no | List this Experience's own Screens reachable from every place inside it, each as a path relative to the Experience, nested ones by their child path. Unique values; order carries no meaning. See [Navigation](#navigation). |
| `version` | no | A single-line name for the version this Experience serves. Valid only when another Experience of the same Interface carries a different one; see [Variation](#variation). |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the Experience. |
| Lead paragraph | yes | Describe the coherent usage context. |
| `## Intent` | no | Explain the outcome this context protects. |

Like an Interface, an Experience does not list what it supports and excludes;
Capability availability is the positive claim. Experiences and Screens never
declare `languages`: the Interface does.

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

An Experience belongs to its Interface, and carries its own Screens, references
to shared Screens, and the Capabilities available within it.

## Screens

**A Screen is a place where an Actor meets the Product's facts and
abilities.** It says which Capabilities are exposed there and which facts of
which Entities are on screen, not how the view is implemented or drawn.

Screens are optional. A visual Product may need them; a CLI, supported API, or
other non-visual Interface may not. A Screen need not have a URL, fill a device,
or correspond to one component, route module, or view controller.

### When to create a Screen

Create a Screen when a view has a stable Product purpose and exposes at least
one Capability. Do not create Screens for responsive layouts, themes, hover
variants, skeletons, components, or every route found in source.

**Error, legal and other capability-free views are not Screens.** A Screen must
name at least one Capability, and a not-found page, a privacy policy, or a terms
page exposes none — nothing about the Product's abilities happens there. The
condition such a view answers — unauthorized, missing, empty — is a `condition`
Step, an Edge case, or a Rule outcome in the Scenario that meets it; the view
itself is left out of the model. A repository rule that every implemented route
must appear somewhere is a documentation rule, not a Product Model rule; do not
satisfy it by inventing a Capability the view does not have.

**A region inside a view is a Screen of its own when its content depends on an
act inside its parent** — picking a row, choosing a tab, advancing a step. That
is the whole test, and it is decidable from code without judging layout.
Whether the region is visible at the same time as its parent, and whether it
has its own address, do not decide it. The same content drawn differently — a
Rows and a Graph drawing of one set — is design, and one Screen. Such a region
is a [Child Screen](#screens-nest).

> **Experience vs Screen.** An [Experience](./interfaces.md#experiences) is a coherent
> context inside one Interface. A Screen is one place inside that context, or
> directly on an Interface no Experience divides.
>
> **Screen vs Scenario.** A Screen says which facts and abilities are met at a
> place. A [Capability Scenario](./capabilities.md#capability-scenarios) or
> [Journey Scenario](./journeys.md#journey-scenarios) is a concrete observable
> behavior contract whose Steps happen at those places, and every transition
> between places is one of its Steps.

### Screen file

An assetless Screen lives at
`interfaces/<interface-id>/experiences/<experience-id>/screens/<screen-id>.md`
(or directly under an Interface's `screens/`: an undivided Interface's own
Screens, or a Screen a divided Interface shares across its Experiences). A Screen
with assets or Child Screens expands to `<screen-id>/screen.md`. The whole
Screen collection is optional.

```md [screens/product-record.md]
---
capabilities: [browse-catalog, place-order]
entities:
  - { entity: catalog-product, facts: [Name, Price, Availability] }
  - { entity: cart, facts: [Item count] }
entryPoints:
  - customer-web: /products/:id
  - customer-mobile: shop://products/:id
references:
  - kind: visual
    role: intent
    target: https://example.com/designs/product-record
---

# Product record

Shows what a shopper needs to evaluate one product.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `capabilities` | yes | Name at least one unique existing Capability that a Step placed on this Screen uses; each must declare an availability Context for the Interface or Experience containing this Screen. A Screen shared beside `experiences/` needs one for every Experience of its Interface, and `lint` names the Experiences a Capability is missing from. |
| `entities` | no | Name the [Entities](./entities.md) this Screen presents, each as `{ entity, facts }` or a bare id. `facts` names the Entity's [named facts](./entities.md#named-facts) exactly, is non-empty when present, and every name must exist. |
| `entryPoints` | no | Key public routes or deep links by the Interface that holds this Screen. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Screen and describe its Product purpose. |
| `## Intent` | no | Explain the outcome this place protects. |

That is the whole shape. What a Screen presents is its `entities`; what it
offers is its `capabilities` and the Steps placed on it; the conditions it
meets are the Scenarios' `condition` Steps, Edge cases and Rule outcomes; and
its boundary is the positive claim `capabilities` already makes. Other H2
sections are kept as supporting sections.

Screens do not declare availability and do not list Scenarios. Their folder
path is already authoritative for their containing Interface or Experience. A
Scenario participates in a Screen when one of its Step Contexts names that
Screen as its most-specific `place`. When that Step names a Capability, the
Screen must expose it. Consumers derive both Capability Scenario and Journey
Scenario backlinks from those Step Contexts.

### What a Screen presents

**"Presents" means the fact is on screen, whether the Actor reads it or enters
it.** A sign-up form lists `{ entity: account, facts: [Email, Password] }`, and
the Step that creates the Account cites nothing: what a creation collects is
what the Screen presents. Reading versus entering is design.

A fact is cited by the exact name its Entity declares under
`## Information kept`, the way a [Business Rule](./business-rules.md)'s `facts`
target and a [Step](./capabilities.md#what-a-step-does-to-the-products-things)'s
`facts` cite it. An Entity with no named facts is always cited bare. A bare id
for an Entity that has named facts is allowed only while
[Coverage](./product-model.md#coverage) is not `complete`; a complete model
names the facts, because a bare id would otherwise be a second spelling of
"all of them".

A Rule that governs who may read a fact is checked against who reaches every
Screen presenting it, and a Rule scoped to a place must name a Screen
presenting that fact, or an ancestor of one.

**Each Screen lists only the Capabilities its own Steps use.** A Capability a
Screen exposes with no Step placed exactly on that Screen is a `lint` warning,
and an error in a `complete` model. There is no cheaper encoding of "this
ability exists here" than a Scenario, an export button included; a partial
model's Screens are islands until their Scenarios are written, which is a
visible absence.

### Screens nest

An expanded Screen may hold `screens/` of its own. A Screen's id grows one
segment per level — `customer-web::storefront::onboarding::choose-plan` — and
depth is unlimited, because the rule is the same at every level:

```text
interfaces/customer-web/experiences/storefront/screens/
└── onboarding/
    ├── screen.md
    └── screens/
        ├── choose-plan.md
        └── enter-details.md
```

Containment keeps its meaning everywhere. A Step on a Child Screen is inside
the parent; a Rule selector on the parent covers the child; `navigation` may
name a nested Screen by its child path; and the map consumers derive is
hierarchical.

**A parent Screen is a place.** A Step placed on it means *on the parent, not in
any child*. The list of a master-detail and the shell of a wizard have Steps of
their own.

**Capabilities do not flow up or down.** A Child Screen lists what its own
Steps use; the parent does not repeat it. The report shows each Screen's own list at its place in the tree.

| Case | Modeling |
| --- | --- |
| Confirmation dialog | two Steps on the host Screen: ask, confirm |
| Slideover or panel with its own facts | a Child Screen of the view it opens over |
| Tabs showing different facts | Child Screens |
| Rows / Graph drawing of one set | design; one Screen |
| Wizard | one parent Screen, one child per step, a Scenario walking them in order |
| Master-detail | the detail is a Child Screen of the list |
| Overlay preserving the parent's state | a Scenario Outcome, not structure |
| Modal versus page versus inline | design; not modeled |

A wizard is nested Screens on the structure side. The Scenario walking it is a
[Journey Scenario](./journeys.md#journey-scenarios) only where it crosses
Capabilities, and otherwise a
[Capability Scenario](./capabilities.md#capability-scenarios); the two axes are
independent.

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
counterparts, told apart by their path. Give them the same purpose, facts and
Capabilities when that is the truth; stating each separately is what makes a
divergence between them visible instead of silent.

### Navigation

**Places are authored; transitions are derived.** Screens are the places. A
Scenario Step's `place` says where it happens, and a change of place between
consecutive contextualized Steps is the transition — so the Screen map
consumers draw is Steps projected onto places, exactly as an
[Entity's lifecycle](./entities.md#states-and-the-lifecycle-nobody-authors) is
Steps projected onto one Entity. An edge no Scenario walks is not a Product
commitment. Conditions such as empty, unauthorized or blocked appear as the
Scenario branch that meets them.

Two things Steps cannot say are authored on the structure side, and nothing
else is: `navigation`, and [nesting](#screens-nest).

`navigation` names the Screens an Actor can reach from every place inside an
Interface or Experience — a cart, a search, a home. It is structure, not a
relation, in the same sense as folder containment: it states a fact about the
container, and the report draws it as an always-reachable mark on the Screen,
never as edges. Each entry is a Screen path relative to the container,
`catalog` or `library::by-source`. On an undivided Interface any of its
Screens qualifies. On a divided Interface only a
[shared Screen](#screens-shared-across-experiences) or a descendant of one
does, because a Screen inside a restricted Experience cannot be reachable from
a public one; an Experience's own `navigation` names its own Screens. Order
carries no meaning: `lint` ignores it and the report sorts as it sorts
everything else.

Parent, next and back links, menus, route trees, the order of navigation items,
and XML sitemaps do not belong in the Product Model: entry points say what is
addressable, and Steps say movement. An information-architecture diagram can
be an external `doc` or `visual` Reference.

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

A Screen belongs to its actual Interface and optional Experience, and a shared
Screen belongs to one of them canonically. Containment says what holds what; it
never says a reader moves from one Screen to another — the Scenarios' Steps do.

## Is this a design spec?

No, and deliberately not. A design system answers how the Product looks and is
built; the model answers what an Actor can reach, see, do and trigger at each
place.

| | Design | Product Model |
| --- | --- | --- |
| Which surfaces and places exist, nested how | | **yes** |
| Who is in each context, with what access, and which languages are served | | **yes** |
| The facts each place shows or collects, and the abilities it offers | | **yes** |
| What is always reachable, and where behavior moves between places | | **yes** |
| The conditions and outcomes an Actor meets, and who may act | | **yes** |
| Layout, components, typography, color, spacing, icons, motion | yes | never |
| Copy, tone, and the words of any message | yes | never |
| Gestures versus buttons, breakpoints, loading and hover states, navigation chrome | yes | never |

The report can still show you a rough view of any Screen. Its Sketch is
derived, never authored: the same wireframe skeleton for every place, drawn
from the frame the Interface type implies, the Screens always reachable, the
facts presented and entered, the Capabilities offered, and the child Screens as
tabs. A Storyboard draws a Scenario route as a sequence of them. Because the
skeleton is identical everywhere, a Sketch cannot be mistaken for a design, and
nothing in the model says where anything sits.

One test decides every case:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

**In the model:** which surfaces exist and their interaction type; which
languages they serve; who is in each context and with what access; which
places exist, nested how, and what facts and abilities each has, including the
facts an Actor enters; what is always reachable inside a context; where
behavior moves between places; the conditions and outcomes an Actor meets; who
may act; and the Product's own vocabulary for all of it.

**Out of the model:** component libraries, theming, layout, typography, color,
radius and borders, iconography, motion, microcopy and tone, gestures versus
buttons, breakpoints, loading and hover states, navigation chrome, the order of
navigation items, and quality attributes such as accessibility or performance
unless they change what an Actor can do.

**Text follows the same line.** The model says that an Actor is told something
and under which condition — a Step, an Edge case, or a Rule outcome. It never
says the words. Legally required text is a [Business Rule](./business-rules.md)
("consent is captured before creation") whose wording lives in a Reference.
There is no carve-out.

Everything on the design side lives in a design system and design files.
Attach them to the Interface, Experience or Screen they shape as `visual`
[References](./references.md) with `role: intent`, which says *helped define
it, never is it*.

## Variation

A Product varies along a few axes without leaving the model, and each already
has a home.

**Languages.** [`languages`](./product.md#the-file) on the Product lists the
language tags it serves; an Interface may narrow the list, and Experiences and
Screens never carry one. A redesign cannot drop German, so it is product; the
vocabulary is closed, and `businesslens-verify` can check it against i18n
configuration.

**Flags, A/B tests and dynamic configuration.** A settings Entity holds the
flag as a fact, and a [Business Rule](./business-rules.md#grant-keys) reads it
with `when`, targeting an Entity operation or a Capability. An A/B test that
changes what an Actor can do is a flag; one that changes looks is design. The
experiment itself — cohorts, assignment, metrics — is not modeled.

**Concurrent versions are places.** A version with its own entry point — an
`/api/v2`, a separate app — is its own Interface. Versions sharing an entry
point are Experiences under one Interface, each carrying `version`, and serving
distinct versions at once is the third reason an Interface divides, beside
distinct access modes and disjoint audiences. `version` is valid only where two
or more Experiences of one Interface carry distinct values, so a
single-version Product never writes it. A Screen both versions serve with the same Capabilities is a shared Screen
beside `experiences/`; one that differs between versions is written under
each, as counterparts are.

**Who sees which version or flag** is a fact on the Actor or tenant Entity,
read by a Rule — the same shape as a flag. There is no cohort concept.

**Historical versions are never modeled.** Git is the model's history.

## Findings `lint` reports

- A `navigation` entry that does not resolve to a Screen inside its container
  by path — on a divided Interface, a Screen that is not shared or below a
  shared one — is an error.
- A fact named on a Screen's `entities` entry that the Entity does not declare
  is an error; so is an empty `facts` list.
- A Capability a Screen exposes with no Step placed exactly on that Screen is a
  warning, and an error when Coverage is `complete`.
- An `actor` Step placed on a Screen that `reads` an Entity the Screen does
  not present is an error, and so is a Step citing a fact on a Screen whose
  entry for that Entity lists facts without it. Product and condition Steps,
  and reads of an Entity that acts, are not checked.
- A Capability available in an Interface or Experience that owns Screens, which
  no Screen there exposes, is a warning, and an error when Coverage is
  `complete`.
- A bare Entity id on a Screen in a `complete` model, where the Entity has
  named facts, is an error.
- A `languages` entry that is not a well-formed tag, an Interface language the
  Product does not declare, or an Interface listing languages while the Product
  declares none, is an error.
- A `version` on an Experience with no sibling carrying a different one is an
  error.
- An Interface that must divide and holds no Experiences, or one whose
  Experiences none of the four reasons justifies, is an error.
- A `## Capability boundary`, `## Information presented`,
  `## Available actions` or `## View states` section, a `screens` key on an
  Interface or Experience, or a `languages` key on an Experience or Screen, is
  an error.
