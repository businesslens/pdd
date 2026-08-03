---
title: Screens
description: Meaningful user-visible product views, shared across web and mobile when their product semantics are the same.
section: open-source
group: Product model
order: 10
---

# Screens

**A Screen is a meaningful user-visible view** where product information or
capabilities are exposed. It describes what users understand and can do there,
not how the view is implemented or drawn.

A Screen does not need a URL, fill a device display, or correspond to one page,
component, route module, or mobile view controller. Models for CLI, API, and
other non-visual products may contain no Screens.

## When you create one

Create a Screen when a view has a stable product purpose, meaningful
information or actions, and a capability boundary worth preserving. Do not
create Screens for components, responsive layouts, themes, hover variants,
loading skeletons, or every route mechanically discovered in source.

> **Experience vs Screen.** An [Experience](./experiences.md) is the audience
> and capability boundary of a whole product surface. A Screen is one
> meaningful view inside one or more Experiences.

> **Screen vs Scenario.** A Screen says what is visible and possible at one
> product view. A [Scenario](./scenarios.md) is an observable path through a
> user goal and may pass through several Screens.

## The file

Screens live at `screens/<screen-id>.md` and require folder schema `2`.

```md [screens/product-record.md]
---
experiences: [storefront]
features: [catalog-browsing]
scenarios: [browse-catalog]
entryPoints:
  - web: /products/:id
  - ios: acme-shop://products/:id
links:
  - rel: visual
    href: docs/ui/product-record.png
    title: Current visual reference
---

# Product record

Shows the information a shopper needs to evaluate one product.

## Intent

Help a shopper decide whether to add the product to the cart.

## Information presented

- Product name and description
- Price and availability

## Available actions

- Add the product to the cart
- Return to the catalog

## Product states

### Available

The product can be added to the cart.

### Unavailable

The reason it cannot be purchased is explained.

## Capability boundary

The screen does not change product or inventory data.
```

| Key | Required | Meaning |
| --- | --- | --- |
| `experiences` | yes | Experience IDs containing the Screen — at least one |
| `features` | yes | Feature IDs exposed by the Screen — at least one |
| `scenarios` | no | Observable paths in which the Screen participates |
| `entryPoints` | no | Public routes or supported deep links that reach it directly |
| `links` | no | Supporting specs, visuals, research, or other external content |

`## Information presented` and `## Capability boundary` are required.
`## Available actions` and `## Product states` are optional, but must contain
valid content when authored. Other H2 sections survive as supporting content.

Relations are declared only on the Screen. Consumers derive backlinks from
Experiences, Features, and Scenarios instead of maintaining the same relation
twice.

## Product states

Add a state when it changes what a user understands, can do, or achieves.
Empty, unavailable, unauthorized, validation-failure, and completed states
usually qualify. Give each state an H3 name and non-empty explanation.

Visual variations are not product states. Theme, viewport, platform styling,
hover, skeleton, and component variants stay outside the Product Model.

## Websites and mobile apps

There is no `platform` field. Use one Screen across web and mobile when its
purpose, information, actions, meaningful states, and capability boundary are
the same. Relate it to every relevant Experience and add any supported public
routes or deep links as entry points.

Create separate Screens only when product semantics materially differ. Internal
navigation identifiers are implementation details and do not belong in
`entryPoints`.

## Sitemaps and navigation

A Screen collection is not an authored sitemap. Consumers can generate a
screen map grouped by Experience. Journeys and Scenarios describe
goal-oriented movement, so Screens do not carry parent, next, or generic
transition relations.

XML sitemaps are SEO implementation artifacts. UX sitemaps and
information-architecture diagrams may be external `doc` or `visual` links.

## External visuals

Screenshots, mockups, prototypes, and Figma files stay outside
`.businesslens/`. Link them with `rel: visual` when they are useful context.
BusinessLens validates the reference shape and local target, but does not
capture, copy, download, inspect, compare, or certify the visual.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `needs at least one experience` | Add a valid Experience relation. |
| `needs at least one feature` | Add a valid Feature relation. |
| `references missing …` | An Experience, Feature, or Scenario ID has no entity. |
| `"## Information presented" needs at least one bullet item` | State the meaningful information visible to the user. |
| `missing "## Capability boundary" section` | State what this Screen can and cannot do. |
| Product-state finding | Begin each state with an H3 and give it a description. |
| `missing H1 title` / `missing lead paragraph (description)` | Every Screen needs both. |

Screens may carry optional `codeRefs` as repository navigation, but a bookmark
is never required and never proves that the Screen is implemented.
