---
title: Feed reader
description: Learn the Product Model by following the catalog Content Feed Reader through Capability and Journey acceptance.
section: open-source
group: Learn from examples
order: 20
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
| Capabilities | 5 — Source following, Reading state, Item saving, Collections, Collection sharing | Durable abilities form the behavioral core |
| Capability Scenarios | 10 | Two local observable cases give every Capability direct acceptance coverage |
| Journeys | 3 — Catch up on unread, Save and organize, Share a collection | Each entity authors only a coherent Goal and Success criterion |
| Journey Scenarios | 6 | Concrete achieved and not-achieved variations own Capability selection and order |
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
        ├── Item saving Capability
        │   ├── Save an accessible item Capability Scenario
        │   └── Reject saving an unavailable item Capability Scenario
        ├── Collections Capability
        │   ├── Add an item to an owned collection Capability Scenario
        │   └── Reject adding to another owner's collection Capability Scenario
        └── Collection workspace Screen

Save and organize Journey
├── Goal: keep a worthwhile item in an owned collection
├── Save an item into a new collection Journey Scenario
│   └── Item saving → Collections
└── Save an item into an existing collection Journey Scenario
    └── Item saving → Collections
```

The two Capabilities state durable behavior, and each has its own local
Capability Scenarios. The Screen is the visual place where useful information
and actions are exposed. `save-and-organize` is a separate high-level Journey
because its achieved variations necessarily compose Item saving and
Collections. The Journey authors only the Goal and Success criterion. Its
Journey Scenarios make two concrete end-to-end flows testable, and the report
derives the Journey's primary Capabilities from achieved flows while marking
Capabilities found only in not-achieved flows as failure-only.

`reading-state-is-private-to-its-reader` is a Business Rule across this slice.
It owns the privacy assertion once, relates it to the relevant entities, and
does not make every Capability Scenario or Journey Scenario repeat the same
policy.

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
        ├── Read a published collection Capability Scenario
        └── Open an unlisted collection Capability Scenario

No Journey
└── Both Capability Scenarios directly accept Collection sharing behavior
```

The same `collection-sharing` Capability also belongs to the Reader's private
context because the owner publishes and unlists there. This is why Interface,
Experience, Screen, Capability, and Journey are separate ideas: they answer
different questions and can connect without duplicating one another.

`read-a-shared-collection` is intentionally not retained as a Journey in the
new model. Although its two cases have clear Visitor outcomes, they exercise
only `collection-sharing`. The Capability and its Capability Scenarios say
everything needed; a Journey would only rename them. `follow-a-new-source` is
removed for the same reason.

The `unlisting-revokes-anonymous-access` Rule links the owner's unlisting path
to the Visitor's unavailable path. It expresses one promise across two Actors,
one Journey, and direct Capability Scenarios.

The rejected-source Capability Scenario demonstrates the same rule: it directly
accepts `source-following` validation without needing a Journey merely as a
folder. Capability coverage remains complete even when no end-to-end goal
exists.

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
- Capability Scenarios make every Capability observable and verifiable.
  Journeys are kept only for coherent Goals that necessarily compose multiple
  Capabilities, and Journey Scenarios verify their concrete variations. Another
  complete model may validly have no Journeys or Journey Scenarios.
- Business Rules are present only for constraints worth stating once across
  behavior.

The Blueprint includes a lightweight screen-map Reference to explain visual
intent. A future reference application can live in a dedicated repository and
attach implementation screenshots to these same Screens. That implementation
would supply evidence; it would not redefine the Product Model.

Next, inspect the individual [Product Model pages](./product-model.md) when you
need a file shape or a lint constraint, or start adapting the Blueprint with
[Start from a Blueprint](./from-a-blueprint.md).
