---
title: Journeys
description: Optional coherent Actor goals that deliberately compose multiple durable Product Capabilities.
section: open-source
group: Product Model
order: 16
---

# Journeys

**A Journey is one coherent Actor goal that requires deliberate composition of
multiple [Capabilities](./capabilities.md):** contribute a code change, deliver
an application, recover a deployment, or browse and buy.

A Journey owns only its high-level Goal, Success criterion, and Actors. Concrete
Capability selection, order, branches, repetition, and failure belong to its
[Journey Scenario](./journey-scenarios.md) variations.

Journeys are optional. A complete Product Model can contain none when its
behavior is better expressed as independently verifiable Capabilities.

## When you create one

Create a Journey only when all of these are true:

1. one or more named Actors pursue one recognizable Goal and Success criterion;
2. at least one achieved Journey Scenario uses two or more durable Capabilities;
3. the Product deliberately connects those Capabilities through a handoff,
   orchestration, shared state, navigation, command, or supported
   cross-Interface transition;
4. at least one achieved end-to-end Journey Scenario is evidence-backed—or
   approved as intended behavior during ideation; and
5. the Journey is not merely a plausible sequence or an administrative grouping.

A wizard is strong Journey evidence, but it is not required. Product
documentation, controller orchestration, integration tests, UI handoffs, and a
supported transition from Git transport to a web pull-request flow can also
establish one.

“Publish a branch and open it for review” can be a Journey when the Product
supports that handoff. “Browse source and later change notification settings”
is only a possible sequence. “Create a repository” is one Capability with
Capability Scenarios, not a Journey wrapper.

> **Journey vs Capability.** A Journey is a coherent Actor goal that requires
> several abilities. A Capability is one durable ability that remains useful
> outside that Journey.
>
> **Journey vs Journey Scenario.** A Journey states the Goal and Success
> criterion. A Journey Scenario states one concrete Capability flow and result.
> One achieved Scenario is enough for Journey coverage; the number of variations
> does not define the Journey.

## The file

Journeys live at `journeys/<journey-id>.md`. The whole collection is optional.

```md [journeys/contribute-a-code-change.md]
---
actors: [repository-contributor]
references:
  - kind: doc
    role: context
    target: docs/usage/pull-requests.md
---

# Contribute a code change

## Goal

A repository contributor wants to propose a code change for review.

## Success criterion

A reviewable change proposal exists for the repository.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `actors` | yes | Name at least one unique existing Actor who pursues the Goal. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 | yes | Name the coherent Actor goal rather than one route or variation. |
| Lead paragraph | no | Start with a named H2; move goal prose into `## Goal`. |
| `## Goal` | yes | State the stable Actor intent. |
| `## Success criterion` | yes | State how achievement is recognized without prescribing a route. |

A Journey does not declare `availability`, `entryPoints`, Trigger, Steps,
decisions, a concrete Outcome, authored Capability list, or authored Scenario
list. `## Goal` and `## Success criterion` may each appear only once.
Capabilities, Domains, Interfaces, and Experiences are derived from concrete
Journey Scenario flow entries. Product routes remain on Interfaces,
Experiences, and Screens.

To present a Journey entry route, a report consumer starts with the first flow
item of each achieved Journey Scenario and resolves the matching Interface or
Experience entry point. The route remains derived rather than becoming Journey
frontmatter.

Consumers derive the primary Capability and Domain sets from achieved flows.
Capabilities seen only in not-achieved flows are marked separately as
failure-only. These are modeled coverage projections, not a mandatory canonical
flow or proof that partial mapping is exhaustive.

At least one Journey Scenario must name every Journey with `result: achieved`.
That achieved Scenario must use at least two distinct Capabilities. This gives
the Journey acceptance coverage without pushing flow into the Journey itself.

## Relationship to code

A Journey does not need one matching class, controller, route, test, or wizard.
Like other Product entities, it is a Product-level projection over code. During
mapping, however, its Goal, Capability handoffs, and achieved path must remain
traceable through supported behavior rather than invented from plausible
actions.

When no achieved deliberate multi-Capability composition can be established,
omit the Journey and keep the independently verifiable Capability Scenarios.
