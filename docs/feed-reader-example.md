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

Feed providers are deliberately **not** Actors here, and there is no feed
Interface. The Product polls those feeds; they never call the Product, hold no
goal inside it, and need no surface kept stable for them. An external system
earns an Actor and an Interface only when it *initiates*. So the outbound
dependency lives inside the Capability that makes the call, and the RSS contract
it depends on is attached to that Capability as a context Reference.

## The complete model at a glance

| Entity | In this Blueprint | What the examples make visible |
| --- | --- | --- |
| Product | 1 — Content Feed Reader | One coherent reading promise across two Interfaces |
| Actors | 2 — Reader, Visitor | Owner and anonymous recipient have different privileges; the feeds the Product polls are not Actors |
| Interfaces | 2 — Reader web, Reader mobile | Two supported interaction forms; an outbound feed connection is not one of them |
| Experiences | 2 — Personal library, Public reading | Authenticated work spans web and mobile; public reading is web-only |
| Screens | 5 — Source list, Unread library, Saved items, Collection workspace, Public collection | Visual places where behavior is observed, including where a Reader asks for new items and sees a source fail |
| Domains | 3 — Sources, Reading, Collections | Stable areas of Product responsibility group ten Capabilities on one consistent axis |
| Capabilities | 10 | Source intake, private reading work, collection ownership, naming, publication, and public consumption remain separate promises |
| Capability Scenarios | 24 | Each Capability has direct observable acceptance coverage |
| Journeys | 4 | Reader goals cover source intake, catch-up, organization, and cross-Actor sharing |
| Journey Scenarios | 8 | Concrete variations own Capability selection, order, context, and cross-Interface handoffs; six reach the goal and two record why it was not reached |
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
    ├── Unread library Screen
    └── Saved items Screen

Catch up on unread Journey
├── Work through the unread backlog
│   └── Content reading → Reading state
└── Save an item while catching up
    └── Content reading → Item saving → Reading state
```

This boundary matters: reading content is not the same behavior as changing
private reading state, and saving is an optional branch rather than a fake
second step added only to make a Journey valid.

The collection slice makes the same distinction. `item-saving` keeps an item;
`collection-creation` establishes a named owned list; `collection-naming`
changes its name; `collection-organization` changes its ordered membership; and
`collection-publication` controls public availability. `save-and-organize`
composes the private operations. `publish-and-share-a-collection` continues
across the public boundary so the model shows the handoff from owner publication
to Visitor consumption.

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
their Actors or availability. The `publish-and-read-a-collection` Journey
Scenario makes the achieved cross-Actor path visible without collapsing those
local contracts.

## Follow the feed path

This is the part of the model most worth studying, because the obvious shape is
the wrong one. A syndicated feed is external, it is essential to the Product,
and it fails in ways the Reader must see — so it looks like it deserves an Actor
and an Interface. It gets neither.

**Direction decides.** Ask three questions of any external system:

1. Does it initiate contact with the Product?
2. Does it have a goal or privilege of its own inside the Product?
3. Must the Product keep a surface stable and verifiable for it?

A polled feed answers no three times. It never calls the Product, wants nothing
from it, and needs nothing kept stable for it. Modeling it as an Actor produces
an Interface whose own boundary has to admit that its Actor can do nothing
through it, and Scenarios whose steps are entirely "the Product does X" while
the Reader — the only party who observes the outcome — is barred from
participating.

So the outbound call lives inside the Capability that makes it:

```text
Reader
└── Personal library — web and mobile
    └── Feed synchronization  ← names the feed as an outbound dependency
        ├── Collect new items from a followed source
        ├── Preserve the library when a feed is unavailable
        └── Source list Screen  ← where the Reader refreshes and sees a failure
```

`feed-synchronization` is scoped to the Interfaces where its result is observed,
its Reader-visible failure behavior is an ordinary Capability Scenario, and the
RSS specification is attached as a `kind: spec`, `role: context` Reference. The
Reader triggers it by refreshing; the Product also reads feeds on a schedule it
owns, which the Capability states in prose because a scheduler is not an Actor
either.

`source-following` stays separate from collection: choosing which feeds may
contribute is a different durable ability from reading them. The
`follow-and-receive-from-a-source` Journey composes the two. Unfollowing stops
future collection but preserves existing library history.

The rule is symmetric. If this Product ever accepted *pushed* feed updates, that
inbound surface would be a genuine Interface and the provider a genuine Actor —
same company, opposite modeling, because direction changed. See
[Actors](./actors.md) and [Interfaces](./interfaces.md) for the general rule.

## What is optional here

Only Product, Actor, and Interface are foundational requirements. This example
uses the optional entities because each earns its place:

- Experiences separate authenticated private work from anonymous public
  reading. Both Interfaces here are genuinely divided, so both use them; an
  Interface that is already one coherent context names availability directly.
- Screens exist for meaningful visual places, not for every Capability.
- Domains make ten Capabilities easier to scan.
- Capability Scenarios make every Capability observable. Journeys remain only
  for coherent multi-Capability goals; another complete model may have none.
- Journey Scenarios record how an attempt ended, not only that one exists. Two
  variations here are `not-achieved`: a catch-up where a refresh brought nothing
  new, and a share where the owner unlisted the collection first. Within
  `catch-up-on-unread`, `feed-synchronization` appears only on that failure
  path, so a consumer derives it as a failure-only Capability of that Journey —
  visible in the Product Report without being claimed as part of the achieved
  goal. The same Capability reaches its goal in
  `follow-and-receive-from-a-source`, so failure-only is a per-Journey
  projection rather than a verdict on the Capability.
- Business Rules state durable constraints once across related behavior.

The Blueprint includes a lightweight screen-map Reference to explain visual
intent. A future implementation can attach evidence to these same entities;
that evidence would not redefine the Product Model.

Next, inspect the individual [Product Model pages](./product-model.md) when you
need a file shape or lint constraint, or start adapting the Blueprint with
[Start from a Blueprint](./from-a-blueprint.md).
