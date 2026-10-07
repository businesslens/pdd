---
title: Interfaces
description: The web apps, mobile apps, CLIs, APIs and webhooks through which people and systems reach your product, the parts inside them, and the places where facts and abilities are met.
section: open-source
group: Product Model
order: 10
terms:
  - term: Interface
    definition: "A supported way for Actors to reach the Product, such as a web app, a mobile app, a CLI, a partner API or an inbound webhook."
  - term: Interface type
    anchor: the-file
    definition: "The form an Interface takes: web, mobile app, desktop app, CLI, API, webhook, messaging, voice, device, or agent."
  - term: Entry point
    aliases: [Starts at]
    anchor: the-file
    definition: "An address where an Actor arrives, such as a path, a deep link or a command."
  - term: Experience
    anchor: experiences
    definition: "One part of an Interface, such as its public, signed-in or admin part, defined by who is there and what they can do."
  - term: Access mode
    anchor: experience-file
    definition: "Who may enter an Experience: anyone (public), anyone signed in (authenticated), or only the roles that administer the Product (restricted)."
  - term: Screen
    anchor: screens
    definition: "A place inside an Interface or Experience, named in the Product's own words, where an Actor sees facts and finds abilities."
---

# Interfaces

**An Interface is a supported way people or systems reach your Product**: a web
app, a mobile app, a CLI, a partner API, an inbound webhook. Inside it live
**Experiences**, its parts, and **Screens**, its places: what an Actor can reach,
see and do, never how it looks (see
[Is this a design spec?](#is-this-a-design-spec)).

## In practice

| In your product | Interface | `type` |
| --- | --- | --- |
| The shop's website, where shoppers browse and buy | Customer web | `web` |
| The same shop as an app | Customer mobile | `mobile-app` |
| The console where operators resolve orders | Admin web | `web` |
| The endpoint the payment gateway calls to report settlements | Payment webhook | `webhook` |
| The commands operators run in a terminal | Operator CLI | `cli` |

## When you create one

- **Create one for every supported way in**: something whose behavior you could
  require and check on its own.
- **Inbound only.** A payment processor you charge or a mail provider you send
  through is not one; the [Capability](./capabilities.md) that calls it says so.
  When the third party calls *you* back (a webhook), that is an Interface, and
  the third party is its Actor.
- **Not every deployable.** Frameworks, packages, internal APIs that serve your
  own web app, and background workers are implementation, not Interfaces.
- **One type each.** A website and an app are two Interfaces, even when they do
  the same thing.
- **No commands or endpoints as resources.** A CLI's syntax lives in its help and
  an API's payloads in its OpenAPI file, attached as a
  [Reference](./references.md); the model holds the Capabilities behind them.

## The file

`interfaces/<id>.md`, or `interfaces/<id>/interface.md` once it holds
Experiences or Screens.

```md [interfaces/customer-web/interface.md]
---
type: web
actors: [shopper]
entryPoints:
  - web: /
---

# Customer web application

The browser interface through which shoppers browse and buy.
```

| Field | Says |
| --- | --- |
| `type` (required) | `web`, `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`, `device` or `agent`: how Actors interact, never the technology (`web`, not `react`) |
| `actors` (required) | Who uses it: Entities that act |
| `entryPoints` | Where Actors arrive, keyed by this Interface's `type`, or by another Interface's id when they arrive from there |
| `languages` | The [Product's languages](./product.md#the-file) this Interface serves, when it serves fewer |

## How it connects

Capabilities name the Interface (or, once divided, its Experiences) in their
[availability](./capabilities.md#availability); it never lists what it offers.
Steps name the place they happen ([Where a Step happens](#where-a-step-happens)),
and a Business Rule applied at a place covers everything inside it.

## Experiences

**An Experience is one part of an Interface (its public, signed-in or admin
part), defined by who is there and what they can do.** Public browsing, a
personal account, an administration area and partner automation are typical
Experiences. An Interface nothing divides has none.

### When to create an Experience

- **Divide an Interface when it has a public part and a signed-in part**:
  browsing without an account, managing orders once signed in.
- **Divide it when it has an admin area only administrators enter**: a
  `restricted` Experience. Administrators are whoever administers the Product,
  its settings or members, including a customer's own workspace admins.
- **Divide it when its people form groups that share no ability**: buyers and
  sellers who never use a Capability in common. Roles that each relate
  one-to-one to the same Account are one group.
- **Otherwise, don't**, unless the Experience is a counterpart or a Variation
  alternative, below. Capabilities name the Interface directly, and Experiences
  nothing justifies are refused.
- **A page only some ordinary roles may open, outside the administration area,
  stays in the signed-in part**; who may use it is a
  [permission](./business-rules.md#permission).
- **The same part on web and on mobile has the same name under each Interface.**
  The two are counterparts (Shopping on customer web and Shopping on customer
  mobile) and keep their Experience even where nothing else would divide.

Alternatives of a [Variation](./variations.md) are also allowed as Experiences,
and only they may share both an access mode and an Actor.

### Experience file

`interfaces/<interface-id>/experiences/<id>.md`, or `<id>/experience.md` once it
holds Screens.

```md [interfaces/store-web/experiences/administration.md]
---
actors: [store-admin]
access: restricted
entryPoints:
  - store-web: /admin
---

# Administration

Where operators manage the store, its orders and its staff.
```

A `restricted` Experience never stands alone: store web also has a public or
signed-in Experience for its shoppers, and the two access modes divide it.

| Field | Says |
| --- | --- |
| `actors` (required) | Who is there; each must be an Actor of the Interface |
| `access` (required) | `public`, `authenticated` (signed in) or `restricted` (only the roles that administer the Product) |
| `entryPoints` | Where Actors arrive, keyed by the containing Interface's id |

`access` is the most open the part can be. A setting that opens or closes it,
such as content public only while the store allows guests, is a condition on a
[permission](./business-rules.md#grant-keys), never an Experience of its own.

## Screens

**A Screen is a place where a person sees facts and finds abilities**, never a
description of how it looks. A shop's catalog, a product record, order status
and an operator's order detail are Screens. They are optional: a CLI, API or
webhook usually has none.

### When to create a Screen

- **Create one for a place with a stable purpose where at least one Capability
  is used**, such as a product record, where shoppers add to the cart.
- **Not for error or legal pages.** A not-found page or a privacy policy offers
  no ability; the condition it answers belongs in a Scenario.
- **One subject, one Screen.** Everything that works on the same selected
  thing or the same process is one Screen: an order's tabs, a wizard's stages.
  Tabs or one long page, a wizard or one form, is design; the order of stages
  lives in the Scenario's Steps.
- **Not for every route or component.** A modal, a page, a URL and a breakpoint
  decide nothing, and a different drawing of the same information is one Screen.
- **The same view on web and on mobile is two Screens with the same name**
  (counterparts), so a difference between them stays visible.

### Screen file

`.../screens/<id>.md` inside its Interface or Experience, or `<id>/screen.md`
once it holds images. Screens never nest.

```md [interfaces/customer-web/experiences/storefront/screens/product-record.md]
---
entities:
  - { entity: catalog-product, shows: [Name and description, Price, Stock remaining] }
  - { entity: cart, shows: [Quantity chosen] }
entryPoints:
  - customer-web: /products/:id
---

# Product record

Shows what a shopper needs to evaluate one product.
```

| Field | Says |
| --- | --- |
| `entities` | Which Entities' facts are on screen; see [What a Screen presents](#what-a-screen-presents) |
| `entryPoints` | Routes or deep links, keyed by the containing Interface's id |
| `references` | Mockups and design files, as [References](./references.md) |

A Screen never lists its Capabilities: they come from the Scenario Steps placed
on it. Its folder says where it sits.

### What a Screen presents

`shows` lists facts the Product displays; `collects` lists values the person
enters: a sign-in Screen collects Email and Password without showing them. Both
name the Entity's [named facts](./entities.md#named-facts); a prefilled field is
in both, and an Entity with no named facts is listed by its id alone. Facts a
Step reads on a Screen must be in its `shows`.

A view with a subject of its own, such as a panel opened from search, a list
and related items, is its own Screen, placed once in their common Interface or
Experience.

### Screens shared across Experiences

A Screen placed beside `experiences/`, directly in the Interface, is shared by
every Experience of that Interface, such as a catalog that guests and signed-in
shoppers both browse. Every Capability it exposes must be available in each. If
what it shows or offers differs by Experience, it is two Screens, one in each.

### Where a Step happens

A Step names the most specific place it happens: the Screen when on one;
otherwise the Experience or undivided Interface.

Movement between Screens comes from Scenario Steps. Menus, and which Screens
they hold, are design.

## Is this a design spec?

No. Rebuild a view with different components, layout, colors, icons and copy:
what would still have to be true (places, who reaches them with what access,
facts shown and collected, abilities offered, what happens next) is the
model's. What the redesign may change is design's; attach design files as
`visual` [References](./references.md) with `role: intent`.

## What lint checks

All of these are errors:

- The model has at least one Interface, each with a valid `type` and at least
  one Actor.
- An Experience has a valid `access` and only Actors its Interface lists, and
  together an Interface's Experiences cover all of them.
- An Interface whose Actors form groups sharing no Capability is divided;
  Experiences need more than one access mode or audience, a counterpart or a
  Variation; and two with the same `access` share no Actor unless they are
  alternatives of one Variation.
- Entry point keys and `languages` resolve, and a Step's place lists the
  Step's Actor.
- A Screen never holds `screens/`: Screens never nest.
- A Screen has a Capability from a Step placed on it, available wherever it
  sits; its `entities` resolve; facts read on it are in its `shows`.
- Place ids are unique: a shared Screen and an Experience of one Interface
  never have the same name.
- `## Capability boundary` is refused on all three, and `## Information
  presented`, `## Available actions` and `## View states` on a Screen.
