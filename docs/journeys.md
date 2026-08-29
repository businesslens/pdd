---
title: Journeys
description: Optional coherent Actor goals that deliberately compose multiple durable Product Capabilities, and the Journey Scenarios that route them end to end.
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
> criterion. A Journey Scenario states one concrete routed step sequence and result.
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
Journey Scenario Capability-bearing steps. Product routes remain on Interfaces,
Experiences, and Screens.

To present a Journey entry route, a report consumer starts with the first
contextualized Actor Step of each achieved Journey Scenario route and resolves
that Context's Interface or Experience entry point. The entry remains derived
rather than becoming Journey frontmatter.

Consumers derive the primary Capability and Domain sets from achieved paths.
Capabilities seen only in not-achieved paths are marked separately as
failure-only. These are modeled coverage projections, not a mandatory canonical
path or proof that partial mapping is exhaustive.

At least one Journey Scenario must name every Journey with `result: achieved`.
That achieved Scenario must use at least two distinct Capabilities. This gives
the Journey acceptance coverage without pushing steps into the Journey itself.
Every Journey Actor must participate in at least one achieved Scenario.

## Relationship to code

A Journey does not need one matching class, controller, route, test, or wizard.
Like other Product resources, it is a Product-level projection over code. During
mapping, however, its Goal, Capability handoffs, and achieved path must remain
traceable through supported behavior rather than invented from plausible
actions.

When no achieved deliberate multi-Capability composition can be established,
omit the Journey and keep the independently verifiable Capability Scenarios.

## Journey Scenarios

**A Journey Scenario is one concrete end-to-end variation of exactly one
Journey.** It begins with the Journey Actor's Goal, follows one ordered list of
steps through its Capabilities, and ends with the goal achieved or not achieved.

A Scenario always belongs to exactly one parent, and the parent decides which
kind it is. A Scenario owned by a Journey is a Journey Scenario; a Scenario
owned by a Capability is a
[Capability Scenario](./capabilities.md#capability-scenarios). There is no
unowned Scenario and no way for one Scenario to serve both parents.

A Journey Scenario owns its exact sentences, Capability selection, linear
order, correlated routes, and terminal result in one `steps` list. It verifies
composition and handoffs without replacing the local
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
result: achieved
routes:
  git-to-web: Git to web review
steps:
  - text: The contributor pushes the branch through Git transport
    kind: actor
    actor: repository-contributor
    capability: publish-repository-changes
    contexts:
      git-to-web:
        place: git-transport
  - text: The contributor opens the branch comparison in the repository workspace
    kind: actor
    actor: repository-contributor
    contexts:
      git-to-web:
        place: web-ui::repository-collaboration::branch-comparison
  - text: The contributor submits the pull request
    kind: actor
    actor: repository-contributor
    capability: propose-code-change
    contexts:
      git-to-web:
        place: web-ui::repository-collaboration::pull-request
references:
  - kind: code
    role: implementation
    target: services/pull/pull.go#NewPullRequest
---

# Publish a branch and open a pull request

## Trigger

A contributor has a local change ready to propose for review.

## Outcome

The Journey goal is achieved: a reviewable change proposal exists.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. |
| `kind` | yes | Name an entry in `taxonomies.yaml`. |
| `result` | yes | Use `achieved` or `not-achieved`; it is orthogonal to `kind`. |
| `routes` | yes | Map each unique lowercase kebab-case route ID to a unique human-readable name. |
| `steps` | yes | Give a non-empty ordered list with one-line `text` and `kind: actor|product|condition`. A Step may name a Capability independently of its kind. |
| `steps[].actor` | for Actor Steps | Name the responsible Actor when `kind: actor`; omit it for Product actions and unowned conditions. At least one Actor Step must name a Journey Actor. |
| `steps[].contexts` | when contextualized | Map every declared route to a strict Context whose `place` is the most-specific occurrence. Omit it only when the Step is shared by all routes and has no Context. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | Begin with the Actor pursuing the Journey Goal. |
| `## Steps` | no | Journey Steps live only in frontmatter so their text, kind, Actor, Capability, and Context places cannot disagree. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a non-empty bullet list when present, with each item on one physical line. |
| `## Outcome` | yes | State whether and why the Journey Goal was achieved or not achieved. |

Business Rules own their Scenario relations; Journey Scenarios do not duplicate
a `businessRules` list. Screen participation is derived from Step Contexts;
Screens do not list Scenario IDs.

A Journey Scenario cannot use `## Steps` or Journey-only `## Goal` and
`## Success criterion` sections. Each recognized Scenario H2 may appear only
once.

### Steps and routes

The Steps are the path. Each entry has required single-line `text` and one
semantic kind. An Actor Step names its responsible Actor. A Step that exercises
a Capability says so independently. Route-specific Context places stay beside
the Step:

```yaml
routes:
  git-to-web: Git to web review
steps:
  - text: The contributor pushes the branch through Git transport
    kind: actor
    actor: repository-contributor
    capability: publish-repository-changes
    contexts:
      git-to-web:
        place: git-transport
  - text: The contributor opens the branch comparison in the repository workspace
    kind: actor
    actor: repository-contributor
    contexts:
      git-to-web:
        place: web-ui::repository-collaboration::branch-comparison
  - text: The contributor submits the pull request
    kind: actor
    actor: repository-contributor
    capability: propose-code-change
    contexts:
      git-to-web:
        place: web-ui::repository-collaboration::pull-request
```

An unqualified Step names no Capability. It may still carry Contexts when an
observable condition or Product action occurs somewhere, or omit `contexts` when
it is shared by every route and has no Context. It records a
condition, Product-side action, or seam that matters to this end-to-end
variation without manufacturing another Capability or Capability Scenario.
The branch-comparison step above is the Context transition between Git
transport and the web workspace; its position makes that transition first-class.

Capability-bearing steps reference Capabilities, never Capability Scenarios. A
Capability is durable while its Scenarios split and merge as local behavior is
refined. Composition therefore names the stable ability without turning a
local acceptance case into a reusable operation resource.

Every contextualized Step declares the same route-id set. Matching keys
correlate the complete paths. The Context `place` is the most-specific
Interface, Experience, or Screen where the Step occurs. When an availability
boundary owns Screens, `place` names one of them. The containing Interface or
Experience is derived from that place and must appear in the Step Capability's
availability when the Step names a Capability; a Screen must also expose that
Capability.

Route ids are lowercase kebab-case keys declared once under `routes`, each with
a human name. Every route has a Context at least once, and no two routes may
repeat the same Context-place sequence. A `place` change between consecutive
contextualized Steps is a Context transition, including Screen-to-Screen movement within
one Experience.

Steps may repeat or stop. Every achieved Journey Scenario uses at least two
distinct Capabilities. A not-achieved Scenario may stop after one Capability
when that behavior prevents the Goal. Split Journey Scenarios when Step text,
kind, responsible Actor, Capability sequence, observable behavior, or
Journey-level Outcome changes; add another named route when only Context places
change.

The path is linear. A Decision point may vary detail while preserving the same
Capability sequence and Outcome. A branch that changes either belongs in a
separate Journey Scenario.

The Scenario Actor set is derived from Actor Steps. Every Actor must be
supported by at least one selected Context, and every selected availability boundary
must support a Scenario Actor. The first contextualized Actor Step of
every route must belong to a Journey Actor, so the end-to-end variation begins
with the goal owner rather than an internal or downstream participant.

`kind` classifies the nature of the variation; `result` records whether the
Journey Goal was achieved. `kind: edge` with `result: achieved` and
`kind: primary` with `result: not-achieved` are structurally valid.

### Journey Scenario decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Its branches stay within and converge on this
Scenario's one Journey-level Outcome. A materially different Outcome belongs in
another Journey Scenario.
