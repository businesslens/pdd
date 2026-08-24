---
title: Screens
description: Optional meaningful visual Product views whose filesystem path determines their Context without duplicating availability.
section: open-source
group: Product Model
order: 12
---

# Screens

**A Screen is a meaningful user-visible view** where Product information or
Capabilities are exposed. It describes what users understand and can do there,
not how the view is implemented or drawn.

Screens are optional. A visual Product may need them; a CLI, supported API, or
other non-visual Interface may not. A Screen need not have a URL, fill a device,
or correspond to one component, route module, or view controller.

## When you create one

Create a Screen when a view has a stable Product purpose, meaningful
information or actions, and a capability boundary worth preserving. Do not
create Screens for responsive layouts, themes, hover variants, skeletons,
components, or every route found in source.

**Error, legal and other capability-free views are not Screens.** A Screen must
name at least one Capability, and a not-found page, a privacy policy, or a terms
page exposes none — nothing about the Product's abilities happens there. Model
such a view as a Product state of the view it interrupts, or leave it out of the
model entirely. A repository rule that every implemented route must appear
somewhere is a documentation rule, not a Product Model rule; do not satisfy it by
inventing a Capability the view does not have.

> **Experience vs Screen.** An [Experience](./experiences.md) is a coherent
> context inside one Interface. A Screen is one meaningful visual view inside
> that context, or directly on an Interface no Experience divides.
>
> **Screen vs Scenario.** A Screen says what is visible and possible at a view.
> A [Capability Scenario](./capabilities.md#capability-scenarios) or
> [Journey Scenario](./journeys.md#journey-scenarios) is a concrete observable behavior
> contract in which that view may participate.

## The file

An assetless Screen lives at
`interfaces/<interface-id>/experiences/<experience-id>/screens/<screen-id>.md`
(or directly under an undivided Interface's `screens/`). A Screen with assets
expands to `<screen-id>/screen.md`. The whole Screen collection is optional.

```md [screens/product-record.md]
---
capabilities: [catalog-browsing]
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

## Product states

### Available

The product can be added to the cart.

## Capability boundary

The Screen does not change product or inventory data.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `capabilities` | yes | Name at least one unique existing Capability; each must declare an availability Context for the Interface or Experience containing this Screen. |
| `entryPoints` | no | Key public routes or deep links by the Interface that holds this Screen. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Screen and describe its Product purpose. |
| `## Information presented` | yes | Include at least one meaningful bullet item, with each item on one physical line. |
| `## Available actions` | no | Include a bullet list when present, with each item on one physical line. |
| `## Product states` | no | Give every H3 state a description. |
| `## Capability boundary` | yes | State what the Screen supports and excludes. |

Screens do not declare availability and do not list Scenarios. Their folder
path is already authoritative for their containing Interface or Experience. A
Scenario participates in a Screen when one of its Step Contexts names that
Screen as its most-specific `place`. When that Step names a Capability, the Screen must
expose it. Consumers derive both Capability Scenario and Journey Scenario
backlinks from those Step Contexts.

## Web and mobile

The same view on web and on mobile is two Screen folders with the same name —
counterparts, told apart by their path. Give them the same purpose, information
and actions when that is the truth; stating each separately is what makes a
divergence between them visible instead of silent.

## Navigation

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

A CLI or API does not need substitute Command or Endpoint entities. Keep
command syntax in CLI help and endpoint schemas in the API contract; model the
durable Capabilities, both observable Scenario types, optional Journeys, and
Rules they expose.
