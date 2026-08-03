---
title: Screens
description: Optional meaningful visual Product views placed in exact Interface–Experience contexts without embedding screenshots or layouts.
section: open-source
group: Product model
order: 11
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
> available in exact Interface–Experience pairs.
>
> **Screen vs Scenario.** A Screen says what is visible and possible at a view.
> A [Scenario](./scenarios.md) is an observable path through a complete goal.

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
scenarios: [browse-catalog]
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

| Key | Required | Meaning |
| --- | --- | --- |
| `availability` | yes | Exact Interface–Experience placement |
| `capabilities` | yes | At least one Capability exposed by the Screen |
| `scenarios` | no | Observable paths in which the Screen participates |
| `entryPoints` | no | Public routes or deep links keyed by an available Interface |
| `references` | no | External intent, implementation, or context artifacts |

Every Capability must support every Screen availability pair.
`## Information presented` and `## Capability boundary` are required.
`## Available actions` and `## Product states` are optional but must contain
valid content when present.

## Web and mobile

Use one Screen across web and mobile when its purpose, information, actions,
states, and boundary are the same. Exact availability still records both
Interfaces. Split Screens only when Product semantics materially differ.

## Navigation

Screens are not an authored sitemap. Consumers can generate a Screen map by
Interface and Experience, while Journeys and Scenarios describe goal-oriented
movement. Parent, next, generic transition, route-tree, and XML sitemap data do
not belong in the Product Model. An information-architecture diagram can be an
external `doc` or `visual` Reference.

Screenshots, mockups, prototypes, and Figma files stay outside
`.businesslens/`. Attach them with [References](./references.md) when useful;
the role distinguishes a curated design from an implementation capture or
context. BusinessLens does not take or assess screenshots.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `needs at least one availability pair` | Place the Screen in the Interface–Experience matrix. |
| `needs at least one capability` | Name what the Screen exposes. |
| `capability "…" is not available in "interface/experience"` | Screen placement exceeds Capability scope. |
| `references missing …` | An Interface, Experience, Capability, or Scenario ID has no entity. |
| `"## Information presented" needs at least one bullet item` | State meaningful visible information. |
| `missing "## Capability boundary" section` | State what the Screen supports and excludes. |
| Product-state finding | Begin each state with an H3 and give it a description. |
