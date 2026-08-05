---
title: Feed reader
description: Learn the Product Model by following the catalog Content Feed Reader from its Product boundary to its acceptance Scenarios.
section: open-source
group: Learn from examples
order: 19
---

# Learn from the Content Feed Reader

The Content Feed Reader is a small, complete teaching model from the Blueprint
catalog. It follows syndicated feeds, helps a Reader reduce an unread backlog,
and lets that Reader publish a curated collection as a read-only web link.

Pull the same model into a clean repository and open its Product Report:

```bash
mkdir content-reader && cd content-reader
git init
npx businesslens blueprint pull content-feed-reader
npx businesslens lint
npx businesslens view
```

The Blueprint is intentionally source-free. It teaches the Product contract
without implying that an application has already been built or verified.

## Start with the boundary

Read `.businesslens/product.md` first. Its Product promise includes following,
reading, saving, organizing, and deliberately sharing content. Its limitations
make three exclusions explicit:

- public collection links are a web commitment, while mobile serves the
  Reader's private library;
- sharing is read-only, without comments, co-editing, or a social graph; and
- the Product reads syndicated feeds but does not publish feeds.

Those statements keep the rest of the model honest. A feed is not modeled as
an Actor merely because the Product reads it: the feed does not use this
Product, receive a Product outcome, or hold Product privileges. There is also
no API Interface because this Product promises no independently supported API.
An internal HTTP layer used by the applications would remain implementation
detail.

## The complete model at a glance

Every entity counted by `lint` appears more than once except the single Product.
The counts are deliberately generous for teaching, not minimums that other
models must copy.

| Entity | In this Blueprint | What the examples make visible |
| --- | --- | --- |
| Product | 1 — Content Feed Reader | One coherent promise across web and mobile |
| Actors | 2 — Reader, Visitor | A signed-in owner and an anonymous recipient have different goals and privileges |
| Interfaces | 2 — Reader web, Reader mobile | Web and mobile are independently supported interaction contracts |
| Experiences | 2 — Personal library, Public reading | One authenticated context spans web and mobile; one public context is web-only |
| Screens | 4 — Source list, Unread library, Collection workspace, Public collection | Meaningful visual views are shared across Interfaces only where their Product purpose stays the same |
| Domains | 2 — Library, Curation | Optional Product-language groupings organize five Capabilities |
| Capabilities | 5 — Source following, Reading state, Item saving, Collections, Collection sharing | Durable abilities are reused by Screens and goals |
| Journeys | 5 | Each Journey is one complete Reader or Visitor goal |
| Scenarios | 10 — two per Journey | Every goal has a primary path and a materially different validation or edge path |
| Business Rules | 4 | Cross-cutting assertions are written once and connected to everything they govern |

## Follow the Reader path

The `reader` Actor can use both `reader-web` and `reader-mobile`. Both
Interfaces offer the authenticated `personal-library` Experience, so private
Capabilities declare both exact availability combinations:

```yaml
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
```

From there, read one vertical slice:

```text
Reader
└── Reader web + Reader mobile
    └── Personal library
        ├── Reading state + Item saving
        ├── Unread library Screen
        └── Catch up on unread Journey
            ├── Work through the unread backlog Scenario
            └── Mark one source read in bulk Scenario
```

The Journey is the complete goal: leave the unread backlog smaller. The Screen
is the visual place where useful information and actions are exposed. The two
Capabilities remain useful in other goals and views. The Scenarios make two
observable paths testable without turning each step into another entity.

`reading-state-is-private-to-its-reader` is a Business Rule across this slice.
It owns the privacy assertion once, relates it to the relevant entities, and
does not make every Scenario repeat the same policy.

## Follow the Visitor path

The `visitor` Actor uses only `reader-web`, through the public
`public-reading` Experience. That narrower context exposes one Capability,
`collection-sharing`, and one Screen, `public-collection`:

```text
Visitor
└── Reader web
    └── Public reading
        ├── Collection sharing Capability
        ├── Public collection Screen
        └── Read a shared collection Journey
            ├── Read a published collection Scenario
            └── Open an unlisted collection Scenario
```

The same `collection-sharing` Capability also belongs to the Reader's private
context because the owner publishes and unlists there. This is why Interface,
Experience, Screen, Capability, and Journey are separate ideas: they answer
different questions and can connect without duplicating one another.

The `unlisting-revokes-anonymous-access` Rule links the owner's unlisting path
to the Visitor's unavailable path. It expresses one promise across two Actors
and two Journeys.

## What is optional here

Only Product, Actor, and Interface are foundational requirements. This example
uses the optional entities because each one earns its place:

- Experiences separate authenticated private work from anonymous public
  reading. A Product whose Interface has only one coherent context should omit
  Experiences and use direct Interface availability.
- Screens exist because web and mobile are visual. A CLI or supported API can
  omit Screens without inventing Command or Endpoint substitutes.
- Domains make five Capabilities easier to scan. A smaller Capability set could
  omit them.
- Journeys and their Scenarios make the intended behavior verifiable. A very
  early boundary-only model can add them as its behavior becomes known.
- Business Rules are present only for constraints worth stating once across
  behavior.

The Blueprint includes a lightweight screen-map Reference to explain visual
intent. A future reference application can live in a dedicated repository and
attach implementation screenshots to these same Screens. That implementation
would supply evidence; it would not redefine the Product Model.

Next, inspect the individual [Product Model pages](./product-model.md) when you
need a file shape or a lint constraint, or start adapting the Blueprint with
[Start from a Blueprint](./from-a-blueprint.md).
