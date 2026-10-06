---
title: Journeys
description: Goals where your product carries a person from one Capability into the next, and the Journey Scenarios that walk each path.
section: open-source
group: Product Model
order: 12
terms:
  - term: Journey
    definition: "A goal where the Product carries one person from one Capability into the next until the goal is met, such as browse and buy."
  - term: Journey Scenario
    anchor: journey-scenarios
    definition: "One path through a Journey, ending with its goal achieved or not achieved."
  - term: Success criterion
    anchor: the-file
    definition: "How you know the Journey's goal was met."
  - term: Leaves behind
    anchor: the-file
    definition: "What a Journey's successful paths create, change or remove, with final States where there are any."
  - term: Trigger
    on: journey-scenario
    anchor: the-journey-scenario-file
    definition: "What starts the Journey Scenario: the person setting out after the goal."
  - term: Outcome
    on: journey-scenario
    anchor: the-journey-scenario-file
    definition: "Where the path ends, and whether the Journey's goal was achieved."
  - term: Result
    anchor: the-journey-scenario-file
    definition: "Whether this path achieves the Journey's goal: achieved, or not-achieved."
  - term: Route
    on: journey-scenario
    anchor: steps-and-routes
    definition: "One named way the same Steps play out in different places, such as web and mobile. Different Steps mean a different Journey Scenario."
  - term: Decision point
    on: journey-scenario
    anchor: journey-scenario-decision-points
    definition: "A question inside a Journey Scenario whose branches keep the same Capabilities and outcome."
  - term: Edge case
    on: journey-scenario
    anchor: the-journey-scenario-file
    definition: "A condition and its consequence noted within a Scenario, without changing its path."
---

# Journeys

**A Journey is a goal where your product carries a person from one
[Capability](./capabilities.md) into the next.** Creating a document and landing
in its editor, or signing up and following the emailed link to confirm, are
Journeys: the Product hands the person on.

A Journey states only the goal and how you know it was met. Each concrete path
is a [Journey Scenario](#journey-scenarios). Journeys are optional: many
products have none.

## In practice

| In your product | Journey? |
| --- | --- |
| A product page's Buy button takes the shopper straight into checkout | Yes: Browse and buy |
| Creating a document opens it in the editor | Yes |
| Browsing source, then later changing notification settings | No: the person chose what to do next |
| Inviting a teammate, who then joins | No: a different person follows the link |
| Creating a repository | No: one Capability with its Scenarios |

## When you create one

- **The Product does the handing on**: a redirect, a required next step, an
  emailed link to follow. A person merely choosing what to do next is not a
  Journey.
- **The same person throughout.** A hand-off to someone else, or a continuation
  the Product runs alone, such as merging once checks pass, is not one.
- **At least two Capabilities.** A goal one Capability meets is that
  Capability's Scenario, never a Journey wrapper.
- **Being sent back to where you were going after signing in** is not a
  hand-off.
- **Something shown where you already are** — drafts appearing in the editor
  you are working in — is that Capability's result, not a hand-off.
- **The redirect names the Capability that made it**: creating a board and
  landing on it is `create-board`; the Journey continues with the first thing
  you then do there.

## The file

`journeys/<id>.md`, or `journeys/<id>/journey.md` once it owns Scenarios. The
H1 names the goal; there is no lead paragraph.

```md [journeys/browse-and-buy/journey.md]
---
actors: [shopper]
---

# Browse and buy

## Goal

A shopper wants to purchase a suitable product.

## Success criterion

A confirmed order exists for the selected product.
```

| Field or section | Says |
| --- | --- |
| `actors` (required) | Who pursues the goal |
| `## Goal` (required) | What they want, in a sentence |
| `## Success criterion` (required) | How you know they got it, without naming a route |
| `references` | Code or docs behind it, as [References](./references.md) |

Everything else is derived from its achieved Scenarios: the Capabilities it
uses, the places it passes through, and what it **leaves behind**: the things
those paths create, change or remove, with their final States.

## Journey Scenarios

**A Journey Scenario is one path through a Journey,** from the person setting out
to the goal achieved or not. A Scenario belongs to exactly one parent; one owned
by a Capability is a
[Capability Scenario](./capabilities.md#capability-scenarios).

Every Journey needs at least one achieved Scenario. Add another when a condition
or hand-off changes how the Journey ends. A local failure, such as a refused
payment, stays a Capability Scenario too.

### The Journey Scenario file

`journeys/<journey-id>/scenarios/<id>.md`. The ids are unique across the whole
model.

```md [journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md]
---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The shopper finds an available product and chooses Buy
    kind: actor
    actor: shopper
    capability: browse-catalog
    entities:
      - { entity: catalog-product, effect: reads, facts: [Name and description, Price, Stock remaining] }
    contexts:
      web:
        place: customer-web::storefront::product-record
  - text: The shopper submits checkout from the product page
    kind: actor
    actor: shopper
    capability: place-order
    entities:
      - { entity: order, effect: creates, to: Pending, facts: [Items ordered, Delivery details, Subtotal, Tax, Discount, Total charged, Margin, When placed] }
      - { entity: cart, effect: removes }
    contexts:
      web:
        place: customer-web::storefront::product-record
  - text: The Product confirms the order once its payment settles
    kind: product
    actor: payment-gateway
    capability: settle-payment
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: payment-webhook
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Outcome

The goal is achieved: a confirmed order exists for the selected product.
```

| Field or section | Says |
| --- | --- |
| `kind` (required) | The Scenario kind, such as `primary` or `edge` |
| `result` (required) | `achieved` or `not-achieved` |
| `routes`, `steps` (required) | As on a [Capability Scenario](./capabilities.md#what-a-step-does-to-the-products-things), plus each Step's optional `capability` |
| `## Trigger` (required) | The person setting out after the goal |
| `## Outcome` (required) | Where the path ends, and why the goal was or wasn't met |
| `## Decision points`, `## Edge cases` | As on a Capability Scenario |

### Steps and routes

Steps are written exactly as on a Capability Scenario. A Step that exercises a
Capability names it in `capability` (the Capability, never one of its
Scenarios) and happens where that Capability is offered. A Step that creates,
changes or removes something must name the Capability that owns the change; a
Step that only reads, or marks a transition, needs none.

The first placed Actor Step belongs to the person pursuing the goal. Routes work
as on Capability Scenarios: the same Steps in different places.

### Journey Scenario decision points

A decision point asks one question with at least two `condition → outcome`
branches that keep the same Capabilities and outcome. A branch that changes
either is another Journey Scenario.

## How it connects

- **Capabilities** are named by Steps; a Journey never lists them.
- Every Capability keeps its own Capability Scenarios; a Journey Scenario never
  stands in for them.
- **Entities** change through the Steps, exactly as in Capability Scenarios.

## What lint checks

Errors:

- A Journey needs an H1, no lead paragraph, `actors`, `## Goal` and
  `## Success criterion`, and at least one achieved Journey Scenario that
  includes each of its actors.
- A Journey Scenario needs `kind`, `result`, `routes`, `steps`, `## Trigger` and
  `## Outcome`, and at least one Step naming a Capability.
- An achieved Journey Scenario uses at least two different Capabilities, and
  carries its own Journey Actor through at least two of them; Steps of another
  Actor don't count.
- Each route's first placed Actor Step belongs to a Journey actor.
- A Step that creates, changes or removes something names a `capability`, and a
  Step naming one happens inside that Capability's availability.
- Every check on a Capability Scenario's Steps applies here too.

Warnings:

- A Journey or Journey Scenario id that reads as a noun phrase instead of
  starting with a verb, or that shortens the name of an Entity the model
  declares.
