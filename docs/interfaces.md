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
    definition: "Who may enter an Experience: anyone (public), anyone signed in (authenticated), or only some signed-in roles (restricted)."
  - term: Screen
    anchor: screens
    definition: "A place inside an Interface or Experience, named in the Product's own words, where an Actor meets facts and abilities."
  - term: Child Screen
    aliases: [Nested Screen]
    anchor: screens-nest
    definition: "A Screen that subdivides its parent’s persistent working context, such as a selected resource or a wizard process."
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

### Place names must resolve once

Interfaces, Experiences, and Screens share one namespace for their qualified
ids. An Experience and a shared Screen under the same Interface cannot have
the same name: both would resolve to `interface-id::name`. `lint` reports the
colliding id and both files. Rename one place and update its references so that
Steps, Rules, and nested Screen ownership resolve unambiguously.

### When to create an Experience

**Whether an Interface is divided into Experiences is derived, never judged.**
It follows from who reaches the Interface's places and what each Capability
there is available to, so the author never applies a prose test. Two rules
decide it, one in each direction:

- **An Interface must hold Experiences** when it serves more than one `access`
  value — places reached without signing in beside places reached once signed
  in, or an area only some signed-in roles may enter — or when its Actors split
  into groups that no Capability available there bridges; roles that share an
  Account are one group. An Interface declares no access mode, so `lint` reads
  `access` only from the Experiences it holds; split audiences on an undivided
  Interface are a `lint` **error**: those groups are separate contexts, not one.
- **An Interface that holds Experiences must justify them.** Its Experiences
  differ in `access`, or its audiences are disjoint, or they are alternatives in a
  [Variation](./variations.md), or one is a counterpart —
  an Experience whose name also exists under another Interface, the same context
  on another platform, which justifies itself because flattening it would make
  two views of one context look unrelated. None of these, and it is a
  `lint` **error**: use direct Interface availability instead.
- **One access mode is one context.** Two Experiences of one Interface with the
  same `access` share no Actor, unless they are alternatives in a Variation; an
  admin-only area beside one admins share with members is navigation inside one
  restricted Experience. Otherwise it is a `lint` **error**.

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
| `access` | yes | Use `public`, `authenticated`, or `restricted`: the most open the context can be. A setting that closes it — content public only while the store allows guests — is a grant's `when` on the operations it restricts, never a reason for an Experience of its own. A setting that opens it, such as anonymous access, is the same: access follows who is there. People not signed in, including anonymous visitors and wherever people sign in, are one public context; people signed in are one authenticated context, and the areas only some of their roles may enter, such as administration, one restricted context. |
| `entryPoints` | no | Key Product entry points using the containing Interface as the key. |
| `navigation` | no | List this Experience's own Screens reachable from every place inside it, each as a path relative to the Experience, nested ones by their child path. Unique values; order carries no meaning. See [Navigation](#navigation). |
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

**Error, legal and other capability-free views are not Screens.** A Screen needs
at least one Capability exercised by a Step placed on it, and a not-found page, a privacy policy, or a terms
page exposes none — nothing about the Product's abilities happens there. The
condition such a view answers — unauthorized, missing, empty — is a `condition`
Step, an Edge case, or a Rule outcome in the Scenario that meets it; the view
itself is left out of the model. A repository rule that every implemented route
must appear somewhere is a documentation rule, not a Product Model rule; do not
satisfy it by inventing a Capability the view does not have.

A [Child Screen](#screens-nest) subdivides a persistent parent working
context. An opening action alone does not establish ownership.

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
entities:
  - { entity: catalog-product, shows: [Name, Price, Availability] }
  - { entity: cart, shows: [Item count] }
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
| `entities` | no | A bare Entity id only when it has no named facts; otherwise `{ entity, shows?, collects? }`, with at least one non-empty unique list of exact [fact names](./entities.md#named-facts). |
| `entryPoints` | no | Key public routes or deep links by the Interface that holds this Screen. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Screen and describe its Product purpose. |
| `## Intent` | no | Explain the outcome this place protects. |

A Screen does not author `capabilities` or `availability`. Its placement is
its folder; its Capabilities derive from the Steps placed exactly there. A
Capability Scenario supplies its owning Capability, while a Journey Step names
one explicitly. At least one placed Capability is needed for a Screen. The
same Steps supply Scenario backlinks. Parent and child Screens retain separate
Capability sets.

Other H2 sections are supporting content, except `Information presented`,
`Available actions`, `View states` and `Capability boundary`, which are errors:
information is in `entities`, and conditions belong in Scenarios and Rules.

### What a Screen presents

**Displaying information and collecting input are different product claims.**
`shows` records information the Product discloses; `collects` records values
supplied by the Actor. Both refer to the Entity's named facts. A prefilled
editable field may occur in both lists.

```yaml
entities:
  - entity: account
    shows: [Email]
    collects: [Password]
```

Collecting a password does not disclose an existing one. Read-permission Rules
apply to `shows`, never to an input merely because the form collects it.
An Entity without named facts is cited bare; one with named facts needs at
least one shows/collects list. Each present list is non-empty and unique.

An Actor Step reading named facts on a Screen must find them in that Screen's
`shows`. Product and condition Steps may consult information that is not
shown. Creation and change Steps record the named facts their operations affect,
including Product defaults; these are not inferred from what a form collects.

### Screens nest

An expanded Screen can contain its own `screens/` directory. Its child's id
adds a segment, such as `customer-web::onboarding::choose-plan`. A Step on a
child is inside its ancestors; a Step placed directly on the parent is on the
parent itself. Rule selectors on a parent include descendants.

**Ownership follows a persistent working context.** A child subdivides the same
selected subject or process as its parent; changing that parent context also
changes or ends the child. Tabs within a resource reading and stages of a
wizard are examples. Merely opening a view from another view is not ownership.
A resource panel available from search, a collection and related resources
belongs once at their common Interface or Experience container.

| Case | Modeling |
| --- | --- |
| Tabs subdividing one resource reading | Child Screens of that reading |
| Wizard stages | Child Screens of the wizard's working context |
| Shared resource panel opened from several views | One Screen at their common container |
| Confirmation without a distinct working context | Steps on its host |
| Rows and Graph showing the same information | One Screen |
| Preserving the underlying view on close | A Scenario Outcome |
| Modal, page, inline, URL or breakpoint | Does not determine ownership |

Choose the nearest qualifying persistent context as the parent. A generic
settings/category selector is not itself a selected subject or an in-progress
process. A process stage requires its own Actor decision or input while retaining
the same draft or operation; a completion message, generated credential reveal
or read-only result alone is an Outcome on that process Screen, not a child.

A wizard is a Journey only when its Scenario crosses Capabilities. Ownership
is a semantic authoring decision assessed against this rule, not something
structural lint can establish from a folder tree alone.

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
the test for whether a view is really shared: if its displayed facts, inputs, Capabilities or behavior differ by
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
container, and it states reachability, not a Scenario transition. Each entry is a Screen path relative to the container,
`catalog` or `library::by-source`. On an undivided Interface any of its
Screens qualifies. On a divided Interface only a
[shared Screen](#screens-shared-across-experiences) or a descendant of one
does, because a Screen inside a restricted Experience cannot be reachable from
a public one; an Experience's own `navigation` names its own Screens. Order
carries no meaning: `lint` ignores it.

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

### Screen ownership

A Screen belongs to its actual Interface and optional Experience, and a shared
Screen belongs to one of them canonically. Containment says what holds what; it
never says a reader moves from one Screen to another — the Scenarios' Steps do.

## Is this a design spec?

No, and deliberately not. A design system answers how the Product looks and is
built; the model answers what an Actor can reach, see, do and trigger at each
place.

| | Design | Product Model |
| --- | --- | --- |
| Which surfaces and places exist, their interaction type, and how places nest | | **yes** |
| Who is in each context, with what access, and which languages are served | | **yes** |
| The facts each place shows or collects, and the abilities it offers | | **yes** |
| What is always reachable, and where behavior moves between places | | **yes** |
| The conditions and outcomes an Actor meets, and who may act | | **yes** |
| The Product's own vocabulary for all of it | | **yes** |
| Component libraries, theming, layout, typography, color, spacing, radius, icons, motion | yes | never |
| Gestures versus buttons, breakpoints, loading and hover states, navigation chrome and the order of its items | yes | never |
| Ordinary copy and tone | yes | no |
| Exact wording explicitly required by a Rule | | **yes, by Reference** |
| Accessibility or performance, unless it changes what an Actor can do | yes | no |

One test decides every case:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

**Ordinary copy is design; contractual wording is a requirement.** The model
normally records what an Actor must be told and under which condition. When
exact words are required, a Business Rule identifies the authoritative Reference
and says exactness is required. Verification checks the words; an unavailable
source makes that requirement unverifiable.

Everything on the design side lives in a design system and design files.
Attach them to the Interface, Experience or Screen they shape as `visual`
[References](./references.md) with `role: intent`, which says *helped define
it, never is it*.

## Other forms of variation

Languages are [`languages`](./product.md#the-file) on the Product, which an
Interface may narrow. Two or more complete, supported forms of one Interface,
Experience or Screen are a [Variation](./variations.md); a flag deciding who may
perform an operation is a [grant's `when`](./business-rules.md); a difference
only in looks is design. A different URL or header alone never makes a separate
Interface.

## Findings `lint` reports

- A navigation entry must resolve inside its container.
- Screen shows/collects must name existing Entity facts; present lists are
  non-empty and unique. Bare entries are only for Entities without named facts.
- A Screen needs a Capability derived from a Step placed exactly there. An
  authored `capabilities` list is an unknown key.
- Actor reads must be shown by their Screen. Product and condition reads are
  not display claims; fact-free reads naming an Actor as a participant are exempt.
- Languages must be valid and an Interface's list a subset of the Product's.
- Experiences must follow the audience, access, counterpart and Variation rules.
- `## Information presented`, `## Available actions`, `## View states` and
  `## Capability boundary`, a `screens` list on an Interface or Experience, and
  `languages` on an Experience or Screen are errors.

Coverage does not relax these checks. A Capability can have no Screen; a Rule
can prohibit behavior for which there is no example.
