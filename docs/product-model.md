---
title: The product model
description: What actors, experiences, domains, features, journeys, scenarios, business rules, intent, and decision points mean in a BusinessLens product model.
section: open-source
group: Concepts
order: 7
---

# The product model

The model answers one question from connected angles: *what does this product
do, for whom, under which rules and decisions, and where does the code prove
it?* Each entity type covers one angle. This page explains how to think about
them; the exact file shapes live in the [format contract](./format.md).
For quick definitions and side-by-side distinctions, use the
[terminology glossary](./terminology.md).

The Product Model is the authored `.businesslens/` artifact. A product map is
one visual or navigable view of that model; it is not a second artifact or a
synonym for the folder.

## Actors — who

An actor is someone (or something) with a goal or a privilege: a shopper, a
store admin, a billing webhook. Actors are defined by what they are trying
to accomplish, never by UI screens or database roles. If two "roles" share
the same goals and permissions, they are one actor.

## Experiences — where

An experience is a surface of the product with a stable audience and a
capability boundary: the public storefront, the admin console, a CLI, an
API for partners. Each declares who uses it (`actors`), how it is reached
(`entryPoints`), what protects it (`access`), what a successful visit ends
with (`exit`), and — most importantly — its **capability boundary**: what
this surface can and cannot do.

## Domains — which area

Domains group journeys into recognizable product areas — ordering, catalog,
billing. They are an organizing layer for navigation and topology, not a
technical decomposition; name them the way your product people talk.

## Features — what capability exists

A feature is a stable product capability, such as *catalog search*, *guest
checkout*, or *release approval*. It sits inside one domain and connects the
actors and experiences that use it to the business rules that constrain it.
Features make capabilities directly addressable without forcing a team to
pretend every capability is itself an end-to-end user goal.

## Journeys — what users accomplish

A journey is a stable user or operator goal: *browse and buy*, *refund an
order*, *rotate an API key*. It belongs to a domain, is performed by actors
through experiences, uses one or more features, and carries `codeRefs` proving
the goal is really served by the code. Journeys are the model's backbone — if a
goal disappears from the product, its journey is deleted, not archived.

## Scenarios — how it observably plays out

Each journey has one or more scenarios: concrete, observable paths through
the goal. A scenario has a `kind` (from your `taxonomies.yaml` — primary,
edge, and whatever vocabulary fits), and three structured sections:

- **Trigger** — what starts it ("the shopper presses *Place order* with a
  non-empty cart");
- **Steps** — the ordered observable progression;
- **Outcome** — what the user or operator ends up with.

A scenario may also contain **Decision points**. Each decision asks one
product question and gives at least two condition-to-outcome branches. Use a
decision point when behavior actually forks; do not turn ordinary sequential
steps into fake choices.

Scenarios are deliberately the smallest unit that can be *verified*: their
Trigger/Steps/Outcome are the acceptance contract that
[`businesslens-sync`](./skill-businesslens-sync.md) checks against the
implementation. Scenario IDs are globally unique across the model, so any
scenario can be referenced unambiguously.

## Business rules — what must remain true

A business rule is a durable constraint stated as an assertion: *an order can
be refunded only while unsettled*, or *a private blueprint is never returned
by an anonymous endpoint*. Rules connect to the domains, features, journeys,
and scenarios they govern. This makes the same constraint reusable and
reviewable instead of copying it into several scenario descriptions.

## Intent — why this shape exists

Product, actor, experience, domain, feature, journey, scenario, and business
rule files may include an `## Intent` section. Intent is structured prose, not
a separate entity: it captures why the product boundary or behavior exists
without inventing another relationship graph.

## Evidence — where the code proves it

Every journey and scenario cites tracked code with compact `codeRefs`
(`src/services/orders.ts#OrderService.submit`). The validator checks every
path against `git ls-files`, which is what keeps the model from drifting into
fiction. A claim without evidence is, by definition, unfinished work — which is
what makes planning possible without inventing anything to hold it.

## Git is the change model

Planning needs no folder of its own, no lifecycle, and no status fields. Git
already has all three:

- **A plan is a branch**, where the model describes intended behavior. New
  journeys and scenarios have no `codeRefs` yet, so `validate` lists them —
  that is the evidence checklist, not a problem to suppress. The model diff is
  the complete plan, including changed and deleted entities.
- **Review is the pull request.** The model diff shows the product delta, so
  reviewers approve behavior before or alongside the code.
- **Done is validation green**, with every claim carrying evidence.
- **The archive is git history.**

One state is special: a brand-new product with no code at all. `coverage.md`
`status: draft` marks the whole model as planned, downgrading missing evidence
to warnings so the draft validates green. A draft can be exported or proposed
to the catalog with its gaps still visible. Once evidence is attached and
coverage leaves draft, evidence is strictly required from then on.

[Find your flow](./flows.md) turns this into the four situations you can
actually be in.

## Coverage — how honest the model is

`coverage.md` records how the model was built and what it deliberately leaves
out: the method, inspected source areas, unmapped surfaces, and known
limitations. Its `status` (`draft | partial | complete`) is about the model's
completeness, with one special meaning: `draft` marks a planned greenfield
model whose evidence hasn't been earned yet.

## A worked example

```text
.businesslens/
├── product.md                       # Fixture Shop
├── actors/shopper.md                #   who: buys products
├── actors/store-admin.md            #   who: manages orders
├── domains/catalog.md               #   area: finding products
├── domains/ordering.md              #   area: buying and refunds
├── experiences/storefront.md        #   where: public web store
├── experiences/admin-console.md     #   where: restricted admin area
├── features/checkout.md              #   capability: create an order
├── business-rules/stock-required.md  #   constraint: stock must be available
└── journeys/browse-and-buy/         #   goal: find a product and buy it
    ├── journey.md                   #     domain + feature + actor
    └── scenarios/complete-checkout.md   # observable path + decisions
```

Reading order for a newcomer: `product.md` → experiences (the surfaces) →
features and business rules (capabilities and constraints) → journeys per
domain (the goals) → scenarios and decision points (the observable behavior).
That is also the order an agent reads before touching your code.
