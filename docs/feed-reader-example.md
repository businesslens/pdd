---
title: Feed reader
description: Learn the Product Model by following the catalog Content Feed Reader through Capability and Journey acceptance.
section: open-source
group: Learn from examples
order: 20
---

# Learn from the Content Feed Reader

The Content Feed Reader is a complete teaching model from the Blueprint catalog.
It follows and synchronizes syndicated feeds, helps a Reader reduce an unread
backlog, and lets that Reader publish a curated collection as a read-only web
link.

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

Read `.businesslens/product.md` first. Its Product promise includes collecting,
reading, saving, organizing, and deliberately publishing content. Its
limitations make three exclusions explicit:

- public collection links are a web commitment, while mobile serves the
  Reader's private library;
- sharing is read-only, without comments, co-editing, or a social graph; and
- the Product reads syndicated feeds but does not publish feeds.

The external `feed-provider` system is modeled as an Actor because the Product
makes observable collection and failure-preservation commitments at the
supported `syndicated-feed` Interface. An internal API would still be an
implementation detail: only the external feed contract earns an Interface.

## The complete model at a glance

| Entity | In this Blueprint | What the examples make visible |
| --- | --- | --- |
| Product | 1 — Content Feed Reader | One coherent reading promise across three Interfaces |
| Actors | 3 — Reader, Visitor, Feed provider | Owner, anonymous recipient, and external system have different privileges |
| Interfaces | 3 — Reader web, Reader mobile, Syndicated feed | Human interaction and external collection are independently supported contracts |
| Experiences | 2 — Personal library, Public reading | Authenticated work spans web and mobile; public reading is web-only; the feed Interface is direct |
| Screens | 4 — Source list, Unread library, Collection workspace, Public collection | Visual places expose behavior without inventing a Screen for background synchronization |
| Domains | 2 — Library, Curation | Product-language groupings organize eight Capabilities |
| Capabilities | 8 | Reading, state, synchronization, publication, and public consumption remain separate promises |
| Capability Scenarios | 23 | Each Capability has direct observable acceptance coverage |
| Journeys | 2 — Catch up on unread, Save and organize | Only goals that necessarily compose multiple Capabilities remain Journeys |
| Journey Scenarios | 4 | Concrete achieved variations own Capability selection, order, and context |
| Business Rules | 4 | Cross-cutting assertions are written once and connected to what they govern |

## Follow the Reader path

The `reader` Actor can use `reader-web` and `reader-mobile` through the
authenticated `personal-library` Experience. Read the catch-up slice first:

```text
Reader
└── Personal library — web and mobile
    ├── Content reading
    │   └── Read an unread library item
    ├── Reading state
    │   ├── Mark an item read
    │   ├── Mark an item unread
    │   └── Mark one source read in bulk
    ├── Item saving
    │   ├── Save an accessible item
    │   └── Remove a saved item
    └── Unread library Screen

Catch up on unread Journey
├── Work through the unread backlog
│   └── Content reading → Reading state
└── Save an item while catching up
    └── Content reading → Item saving → Reading state
```

This boundary matters: reading content is not the same behavior as changing
private reading state, and saving is an optional branch rather than a fake
second step added only to make a Journey valid.

The curation slice makes the same distinction. `item-saving` keeps an item;
`collections` creates and edits ordered membership; `collection-publication`
controls public availability. Publishing and unlisting are local operations of
one Capability, so there is no `share-a-collection` Journey. `save-and-organize`
remains a Journey because both of its variations genuinely compose Item saving
and Collection editing.

## Follow the Visitor path

The `visitor` Actor uses only `reader-web`, through the public
`public-reading` Experience:

```text
Visitor
└── Reader web
    └── Public reading
        ├── Public collection reading Capability
        ├── Public collection Screen
        ├── Read a published collection Capability Scenario
        └── Open an unlisted collection Capability Scenario
```

Publication and consumption are deliberately different Capabilities. The owner
publishes in a private context; the Visitor reads in a public context. The
`unlisting-revokes-anonymous-access` Rule connects those sides without blending
their Actors or availability.

## Follow the feed path

The `feed-provider` system uses the direct `syndicated-feed` Interface. It has
no Experience because there is no meaningful context split and no Screen
because synchronization is not a visual place.

```text
Feed provider
└── Syndicated feed
    └── Feed synchronization
        ├── Collect new items from a followed source
        └── Preserve the library when a feed is unavailable
```

`source-following` stays separate. A Reader controls the subscription through
web or mobile; the Feed provider later participates in collection through the
feed Interface. Unfollowing stops future collection but preserves existing
library history.

## What is optional here

Only Product, Actor, and Interface are foundational requirements. This example
uses the optional entities because each earns its place:

- Experiences separate authenticated private work from anonymous public
  reading. Direct feed availability shows how an Interface works without one.
- Screens exist for meaningful visual places, not for every Capability.
- Domains make eight Capabilities easier to scan.
- Capability Scenarios make every Capability observable. Journeys remain only
  for coherent multi-Capability goals; another complete model may have none.
- Business Rules state durable constraints once across related behavior.

The Blueprint includes a lightweight screen-map Reference to explain visual
intent. A future implementation can attach evidence to these same entities;
that evidence would not redefine the Product Model.

Next, inspect the individual [Product Model pages](./product-model.md) when you
need a file shape or lint constraint, or start adapting the Blueprint with
[Start from a Blueprint](./from-a-blueprint.md).
