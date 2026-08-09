---
title: Screens
description: Optional meaningful visual Product views placed in exact Interface availability scopes without embedding screenshots or layouts.
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

> **Experience vs Screen.** An [Experience](./experiences.md) is a coherent
> context across one or more Interfaces. A Screen is one meaningful visual view
> available in exact Interface scopes, optionally narrowed by Experience.
>
> **Screen vs Scenario.** A Screen says what is visible and possible at a view.
> A [Capability Scenario](./capability-scenarios.md) or
> [Journey Scenario](./journey-scenarios.md) is a concrete observable behavior
> contract in which that view may participate.

## The file

Screens live at `screens/<screen-id>.md`. The whole directory is optional.

```md [screens/product-record.md]
---
availability:
  - interface: customer-web
    experiences: [shopping]
  - interface: customer-mobile
    experiences: [shopping]
capabilities: [catalog-browsing]
capabilityScenarios: [browse-catalog]
journeyScenarios: [browse-and-complete-checkout]
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
| `availability` | yes | Declare at least one valid Interface scope, naming Experiences when that Interface uses them. |
| `capabilities` | yes | Name at least one existing Capability; each must support every Screen availability scope. |
| `capabilityScenarios` | no | Name local Capability cases in which the Screen participates. |
| `journeyScenarios` | no | Name end-to-end Journey variations in which the Screen participates. |
| `entryPoints` | no | Key public routes or deep links by an Interface in Screen availability. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Screen and describe its Product purpose. |
| `## Information presented` | yes | Include at least one meaningful bullet item. |
| `## Available actions` | no | Include a bullet list when present. |
| `## Product states` | no | Give every H3 state a description. |
| `## Capability boundary` | yes | State what the Screen supports and excludes. |

A referenced Capability Scenario must use a Capability named by the Screen and
share at least one exact availability context with it. A referenced Journey
Scenario must have a flow entry whose Capability is named by the Screen and
whose exact context intersects the Screen's availability.

## Web and mobile

Use one Screen across web and mobile when its purpose, information, actions,
states, and boundary are the same. Exact availability still records both
Interfaces. Split Screens only when Product semantics materially differ.

## Navigation

Screens are not an authored sitemap. Consumers can generate a Screen map by
Interface and Experience, while Capability Scenarios and Journey Scenarios
describe observable behavior and movement. Parent, next, generic transition,
route-tree, and XML sitemap data do not belong in the Product Model. An
information-architecture diagram can be an external `doc` or `visual`
Reference.

Screenshots, mockups, prototypes, and Figma files stay outside
`.businesslens/`. Attach them with [References](./references.md) when useful;
the role distinguishes a curated design from an implementation capture or
context. The model stores only the attachment metadata, and `lint` neither
fetches nor assesses the visual itself.

A CLI or API does not need substitute Command or Endpoint entities. Keep
command syntax in CLI help and endpoint schemas in the API contract; model the
durable Capabilities, both observable Scenario types, optional Journeys, and
Rules they expose.
