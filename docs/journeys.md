---
title: Journeys
description: Optional coherent Actor goals that deliberately compose multiple durable Product Capabilities, and the Journey Scenarios that route them end to end.
section: open-source
group: Product Model
order: 15
---

# Journeys

**A Journey is one coherent Actor goal that requires deliberate composition of
multiple [Capabilities](./capabilities.md):** contribute a code change, deliver
an application, recover a deployment, or browse and buy.

A Journey owns only its high-level Goal, Success criterion, and Actors. Concrete
Capability selection, order, branches, repetition, and failure belong to its
[Journey Scenario](#journey-scenarios) variations.

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

A Journey without Scenarios or assets may stay compact at
`journeys/<journey-id>.md`. Once it owns a Scenario or asset, it expands to
`journeys/<journey-id>/journey.md`. The whole collection is optional.

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
stage of each achieved Journey Scenario route and resolves that route's exact
Interface or Experience entry point. The entry remains derived rather than
becoming Journey frontmatter.

Consumers derive the primary Capability and Domain sets from achieved flows.
Capabilities seen only in not-achieved flows are marked separately as
failure-only. These are modeled coverage projections, not a mandatory canonical
flow or proof that partial mapping is exhaustive.

At least one Journey Scenario must name every Journey with `result: achieved`.
That achieved Scenario must use at least two distinct Capabilities. This gives
the Journey acceptance coverage without pushing flow into the Journey itself.
Every Journey Actor must participate in at least one achieved Scenario.

## Relationship to code

A Journey does not need one matching class, controller, route, test, or wizard.
Like other Product entities, it is a Product-level projection over code. During
mapping, however, its Goal, Capability handoffs, and achieved path must remain
traceable through supported behavior rather than invented from plausible
actions.

When no achieved deliberate multi-Capability composition can be established,
omit the Journey and keep the independently verifiable Capability Scenarios.

## Journey Scenarios

**A Journey Scenario is one concrete end-to-end variation of exactly one
Journey.** It begins with the Journey Actor's Goal, follows a specific route
through its Capabilities, and ends with the goal achieved or not achieved.

A Scenario always belongs to exactly one parent, and the parent decides which
kind it is. A Scenario owned by a Journey is a Journey Scenario; a Scenario
owned by a Capability is a
[Capability Scenario](./capabilities.md#capability-scenarios). There is no
unowned Scenario and no way for one Scenario to serve both parents.

A Journey Scenario owns its exact Capability selection, linear order,
repetition, supported routes, and terminal result. It verifies composition
and handoffs without replacing the local
[Capability Scenarios](./capabilities.md#capability-scenarios) required by each
Capability.

### When you create a Journey Scenario

Create at least one achieved Journey Scenario for every Journey. Add another
only when a condition, route, or handoff produces a materially different
Journey-level result.

A permission or validation failure belongs here only when the Scenario begins
with the Journey Goal and explains its end-to-end consequence. Keep the local
behavior as a Capability Scenario as well.

### The Journey Scenario file

Journey Scenarios normally live at
`journeys/<journey-id>/scenarios/<id>.md`. A Scenario with assets expands to
`<id>/journey-scenario.md`.

```md [journeys/contribute-a-code-change/scenarios/publish-a-branch-and-open-a-pull-request.md]
---
kind: primary
actors: [repository-contributor]
result: achieved
flow:
  - id: publish-branch
    capability: publish-repository-changes
    operation: Push the branch
  - id: open-proposal
    capability: propose-code-change
    operation: Open the branch for review
routes:
  - id: git-to-web
    contexts:
      - stage: publish-branch
        context: git-transport
      - stage: open-proposal
        context: web-ui::repository-collaboration
references:
  - kind: code
    role: implementation
    target: services/pull/pull.go#NewPullRequest
---

# Publish a branch and open a pull request

## Trigger

A contributor has a local change ready to propose for review.

## Steps

1. The contributor pushes the branch through Git transport
2. The contributor opens the branch comparison in the repository workspace
3. The contributor submits the pull request

## Outcome

The Journey goal is achieved: a reviewable change proposal exists.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. |
| `kind` | yes | Name an entry in `taxonomies.yaml`. |
| `actors` | yes | Name at least one unique existing Actor, including a Journey Actor. |
| `result` | yes | Use `achieved` or `not-achieved`; it is orthogonal to `kind`. |
| `flow` | yes | Give an ordered non-empty list of locally unique stage IDs, existing Capabilities, and one-line operations. |
| `routes` | yes | Give one or more locally unique routes, each with exactly one singular exact context for every flow stage. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | Begin with the Actor pursuing the Journey Goal. |
| `## Steps` | yes | Provide a non-empty ordered list with each item on one physical line. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a non-empty bullet list when present, with each item on one physical line. |
| `## Outcome` | yes | State whether and why the Journey Goal was achieved or not achieved. |

Business Rules own their Scenario relations; Journey Scenarios do not duplicate
a `businessRules` list. Screens may name Journey Scenario IDs in which they
participate.

A Journey Scenario cannot use Journey-only `## Goal` or `## Success criterion`
sections, and each recognized Scenario H2 may appear only once.

### Flow

Each flow entry names a locally unique stage, exactly one existing Capability,
and a one-line operation. Routes then correlate one exact context per stage:

```yaml
flow:
  - id: publish-branch
    capability: publish-repository-changes
    operation: Push the branch
  - id: open-proposal
    capability: propose-code-change
    operation: Open the branch for review
routes:
  - id: git-to-web
    contexts:
      - stage: publish-branch
        context: git-transport
      - stage: open-proposal
        context: web-ui::repository-collaboration
```

The Journey Scenario is the authority for Capability order. Flow entries may
repeat or stop. Every achieved Journey Scenario uses at least two
distinct Capabilities. A not-achieved Scenario may stop after one Capability
when that behavior prevents the Goal.

Flow entries reference Capabilities, never Capability Scenarios. `operation`
provides a structured stage label, while `## Steps` expands the flow in the same
order. The number of prose Steps need not equal the number of flow entries.

For example, a flow entry may name `configure-repository` with operation "Set
the default branch." If the model instead has only a vague
`manage-repositories` Capability covering unrelated create, rename, archive,
and delete behaviors, fix the Capability boundary rather than hiding those
operations in Scenario prose.

Every route contains each flow stage exactly once. Its `context` is one scope
id: a bare Interface id when the Interface is undivided, or
`interface-id::experience-id` for an Experience. Each context must be within the
named stage Capability's availability. Route IDs and stage IDs are lowercase
kebab-case and unique within the Scenario.

Routes express correlated paths rather than a cartesian union. For example, a
web stage can hand off to an operator CLI while a mobile stage hands off to the
same CLI; each complete correlation is a separate route. Add another route when
the Capability sequence, behavior, and Journey-level Outcome stay the same.
Split Journey Scenarios when one of those meanings changes.

The flow is linear. A Decision point may vary detail while preserving the same
Capability sequence and Outcome. A branch that changes either belongs in a
separate Journey Scenario.

Every exact route context must permit at least one Scenario Actor, and every
Scenario Actor must be supported by at least one route context. The first
context of every route must permit a Journey Actor who participates in the
Scenario, so the end-to-end variation begins with the goal owner rather than an
internal or downstream participant. Cross-Interface flows do not require every
Actor to use every stage.

`kind` classifies the nature of the variation; `result` records whether the
Journey Goal was achieved. `kind: edge` with `result: achieved` and
`kind: primary` with `result: not-achieved` are structurally valid.

### Journey Scenario decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Its branches stay within and converge on this
Scenario's one Journey-level Outcome. A materially different Outcome belongs in
another Journey Scenario.
