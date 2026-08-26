---
title: Model overview
description: The .businesslens/ folder models one coherent Product with required foundations and optional contexts, views, groupings, goals, and constraints.
section: open-source
group: Product Model
order: 7
---

# The Product Model

The Product Model is a Git-tracked directory of Markdown describing one
coherent Product promise: who it serves, through which supported interaction
forms, in which usage contexts, what it can do, which goals matter, and what
must remain true.

## The shape of a model

Two hierarchies and two axes. One hierarchy says **where** Actors meet the
Product, the other says **what** the Product does, and the axes classify members
of both.

```text
            ┌─────────────────── where Actors meet it ───────────────────┐
            │   Interface  ──▶  Experience  ──▶  Screen                  │
            └───────────────────────┬────────────────────────────────────┘
                                    │  availability joins the two
            ┌───────────────────────┴────────────────────────────────────┐
            │   Capability ──▶ Capability Scenario                       │
            │   Journey    ──▶ Journey Scenario                          │
            └────────────────── what the Product does ───────────────────┘

   Domain  ── classifies members of both by subject matter
   Object  ── what the Product keeps; Capabilities act on it
   Actor   ── who reaches it        Business Rule ── what must stay true
```

Domain and Object are axes, not levels: they classify and are classified, and
they contain nothing. Actors and Business Rules attach across everything.

## What belongs in a model

The entities describe Product meaning rather than mirroring source files,
frameworks, commands, or endpoints. Start with the required foundation, then
add optional entities only when they communicate a real Product distinction.

| Entity | Model requirement | What it adds |
| --- | --- | --- |
| [Product](./product.md) | Exactly one | The coherent value promise and its boundary |
| [Actor](./actors.md) | At least one, because every Interface names an Actor | A Product-significant goal, privilege, trigger, or outcome |
| [Interface](./interfaces.md) | At least one | An independently supported interaction contract |
| [Experience](./experiences.md) | Optional | A durable context of use inside one Interface when audience, access, or capability boundaries differ |
| [Screen](./screens.md) | Optional | A meaningful visual view; non-visual Products do not need one |
| [Domain](./domains.md) | Optional | A Product-language grouping that makes a larger Capability set easier to navigate |
| [Object](./objects.md) | Optional | A thing the Product keeps whose state an Actor observes, and the lifecycle it moves through |
| [Capability](./capabilities.md) | At least one in a complete model | A durable Product ability reused across views, behavior contracts, or goals |
| [Journey](./journeys.md) | Optional | One coherent Actor Goal that deliberately composes multiple Capabilities |
| [Business Rule](./business-rules.md) | Optional | A durable assertion that must remain true |

Do not add an Experience, Domain, Screen, or any other entity to make the model
look complete. A small model can be both valid and honest.

Screens are deliberately visual. A CLI or supported API does not need parallel
Command or Endpoint entities: syntax belongs in CLI help, and endpoints and
payloads belong in an API contract such as OpenAPI. Attach those artifacts as
[References](./references.md) when they help explain intent or implementation.

`taxonomies.yaml` defines Scenario kinds. `config.yaml` records folder schema
and SDD roots. `coverage.md` describes model breadth.
`.businesslens/README.md` orients an agent that encounters the model.

Use [`businesslens view`](./cli-view.md) to browse the current model as a local
report while editing.

## Authoring conventions

An entity without assets or children is the compact file `<id>.md`. When it
gains its first asset or typed child collection, move it to
`<id>/<type>.md`; the folder becomes that entity's namespace. The two forms
never coexist and derive the same id — `lint` reports both shapes at once, or a
folder missing its `<type>.md`, as errors. A folder you have expanded but not
filled yet is only a warning, so you can create it and add the child next. Behavior-hierarchy ids are the bare file
or folder name; qualified Interface, Experience, and Screen ids carry their path
joined by `::`, because Experience and Screen names may repeat across Interfaces.
Only `product.md` declares `id:`. Scenario IDs are globally unique.

The first and only H1 supplies an entity's title. Lead prose normally supplies its
description. Journeys have no lead prose and instead require `## Goal` and
`## Success criterion`; both Scenario types also have no lead prose and begin
with the required `## Trigger` section. A recognized H2 may appear only once,
and Journey-only sections cannot appear on Scenarios or vice versa. Other H2
sections are preserved as structured supporting sections through export and
expansion. Lead and H2-section bodies cannot contain another H1 or H2 heading.

Relations and navigation belong in frontmatter; Product meaning belongs in
prose. Product tags and every relation list contain unique values. Structured
Steps, Edge cases, Screen information, and Screen actions use one complete list
item per physical line. The frontmatter schema is a strict allowlist, so `lint`
reports unknown keys rather than silently ignoring them.

`## Intent` prose explains why a Product or entity exists and which outcome it
protects. It is optional where documented. A Journey uses required `## Goal`
prose for its Actor intent. Neither becomes another entity or relationship
graph.

## Availability

**Context is the one model concept for saying where Product meaning applies.**
Its current strict shape contains one place:

```yaml
place: customer-web::shopping
```

There is no separate Product `Scope` or `Place` entity. `place` is a property
of Context, and its value names an Interface, Experience, or Screen by
qualified id:
`Interface`, `Interface::Experience`, or
`Interface::Experience::Screen` (with Screens directly under an undivided
Interface using `Interface::Screen`). A future folder schema may add another
Context property when the model needs one; schema 6 accepts only `place`, so
misspelled or speculative keys are reported instead of ignored.

Different fields use the same Context shape at the precision their meaning
requires:

- Capability `availability` lists Contexts whose places are undivided
  Interfaces or Experiences. These are the durable availability boundaries.
- Scenario `steps[].contexts` maps every route to a Context. Its place is the
  most-specific occurrence: a Screen when the boundary contains Screens,
  otherwise the leaf Experience or Interface.
- Business Rule Context selectors may name an Interface, Experience, or
  Screen. An ancestor place includes its descendants, so an Interface selector
  can deliberately cover Contexts beneath that Interface.
- A Screen declares no Context field. Its path already determines its place and
  containing availability boundary.

For example:

```yaml
availability:
  - place: customer-web::shopping
  - place: customer-mobile::shopping
```

When an Interface has no Experiences, use an Interface place directly:

```yaml
availability:
  - place: release-cli
```

Do not invent a ceremonial Experience for an Interface with only one coherent
context. An Interface holds either Screens directly or Experiences, never
both. The Experiences inside an Interface must collectively cover all of its
Actors. Availability is intended Product meaning; it is not inferred from
shared code, routes, packages, or protocols.

## Behavioral core

Capabilities state what the Product can durably do. Capability Scenarios make
each ability observable and verifiable. In a complete model, every Capability
availability Context must be covered by at least one Capability Scenario;
appearing in a Journey Scenario does not satisfy that local acceptance
coverage. A complete model has at least one Capability.

Journeys are optional high-level goals. A Journey authors only the Actors, Goal,
and Success criterion. Journey Scenarios own concrete Capability selection,
order, branches, repetition, correlated context routes, and terminal results.
Every Journey needs at least one achieved Journey Scenario using at least two
distinct Capabilities, and every Journey Actor must appear in an achieved
Scenario. A
complete Product Model may have zero Journeys.

The report derives a Journey's primary Capabilities and Domains from achieved
Journey Scenario Steps. Capabilities found only in not-achieved paths are
marked separately as failure-only. These describe modeled coverage, not one
mandatory path or proof that partial mapping is exhaustive.

## Which behavioral entity?

These are not alternative ways to describe the same contract:

| Entity | Identity | It must contain | It must never contain |
| --- | --- | --- | --- |
| Capability | The smallest durable behavior that remains independently meaningful | Product behavior and supported Contexts | Unrelated operations grouped only by a vague umbrella verb |
| Capability Scenario | One local variation of exactly one Capability | Trigger, context, Steps, and local Outcome | A Journey or multiple Capabilities |
| Journey | One coherent Actor Goal whose achieved variations require multiple Capabilities | Actors, Goal, and Success criterion | Capability list, Steps, branches, or one concrete variation |
| Journey Scenario | One end-to-end variation of exactly one Journey | Trigger, one ordered annotated Steps list, correlated Context routes, goal result, and Outcome | Local acceptance coverage for its Capabilities |

A local case is always a Capability Scenario. A coherent multi-Capability goal
is always a Journey. A complete variation of pursuing that goal is always a
Journey Scenario. A file cannot switch between these meanings by adding an
optional relation.

### Which structural entity?

The boundaries below are decided by rule, not by taste, and `lint` applies each
one. Where a rule can be computed, an author never has to argue it.

| Question | Rule that decides it |
| --- | --- |
| Interface, or Experience of one? | An Interface holds Experiences exactly when it serves more than one `access` value, or two Actor sets whose Capability coverage is disjoint. Otherwise it is one coherent context and takes direct availability. |
| Interface, or nothing? | Interfaces are **inbound**. Something the Product calls out to is a dependency of the Capability that calls it, and gets no entity. |
| Actor, or dependency? | Direction decides. An external system is an Actor only when it **initiates**. The same third party can be a dependency one way and an Actor the other. |
| Screen, or Object state? | A Screen's `## Product states` are that **view's** states. A thing's own lifecycle belongs to an [Object](./objects.md). |
| Object, or nothing? | An Object exists exactly when a thing has two or more named states referenced by two or more Capabilities. |
| Business Rule, or Scenario condition? | A Rule governs **two or more** behaviors, or a Context independent of any behavior. Anything true of exactly one Capability is a `condition` Step or its Outcome. |
| Domain, or no grouping? | A Domain states a `## Boundary` naming what it does **not** own, and holds at least two Capabilities. Otherwise it is a folder. |

### Naming

Behavioral ids are **verb-object**; cross-cutting ids are the **bare noun**.
`browse-catalog`, not `catalog-browsing`; `manage-orders`, not
`order-management`; but `shopper`, `ordering`, `order`, `customer-web`.

This is a rule rather than a style because ids are the model's whole identity
mechanism. Two models of one product that name the same behavior differently
cannot be diffed, merged, or compared — which is exactly what reviewing a change
and reusing a Blueprint both require.

Capability Scenarios must remain variations rather than hidden operations. If
`manage-repositories` produces create, configure, archive, and delete cases
with independent Product meaning, split those into Capabilities and use a
Domain as the optional umbrella.

## Coverage

`coverage.md` records how broadly the Product Model has been authored and why
known gaps remain:

```md
---
status: partial
method: ["Static inspection without executing target code"]
sourceAreas: [src, server]
unmapped: [deployment]
limitations: ["Runtime-only billing policy was not established"]
---

# Coverage

The mapped breadth and why known gaps remain.
```

| Status | Meaning |
| --- | --- |
| `draft` | The model itself is still being authored or reviewed |
| `partial` | Useful model with known unmapped areas |
| `complete` | Intended Product breadth is modeled |

`method` describes how the model was created or expanded. `sourceAreas` records
inspected repository areas, `unmapped` names intentionally absent Product
breadth, `limitations` states what could not be established, and the lead prose
is the rationale. Coverage accepts no H2 sections. Coverage has no entity
counts or Reference-derived fields;
entity totals belong to the Product Report Counts.

Availability and Coverage do not claim implementation status. Every status may
describe planned, implemented, or mixed behavior, and a complete model may have
no References. `businesslens-verify` checks semantic alignment.

Entity files, config, taxonomy, coverage, and orientation are committed.
The model's `.gitignore` ignores `build/` and `cache/`, which are generated and
never committed. See [References](./references.md) for optional external
artifacts.
