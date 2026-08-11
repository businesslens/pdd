---
title: Journey scenarios
description: Concrete end-to-end variations of one coherent multi-Capability Journey goal.
section: open-source
group: Product Model
order: 17
---

# Journey Scenarios

**A Journey Scenario is one concrete end-to-end variation of exactly one
[Journey](./journeys.md).** It begins with the Journey Actor's Goal, follows a
specific route through its Capabilities, and ends with the goal achieved or not
achieved.

A Journey Scenario owns its exact Capability selection, linear order,
repetition, supported routes, and terminal result. It verifies composition
and handoffs without replacing the local
[Capability Scenarios](./capability-scenarios.md) required by each Capability.

## When you create one

Create at least one achieved Journey Scenario for every Journey. Add another
only when a condition, route, or handoff produces a materially different
Journey-level result.

A permission or validation failure belongs here only when the Scenario begins
with the Journey Goal and explains its end-to-end consequence. Keep the local
behavior as a Capability Scenario as well.

> **Local result:** “The Git write is rejected.” — Capability Scenario
>
> **Goal result:** “The code change cannot be proposed because its branch was
> not published.” — Journey Scenario

## The file

Journey Scenarios live at `journey-scenarios/<journey-scenario-id>.md`.

```md [journey-scenarios/publish-a-branch-and-open-a-pull-request.md]
---
kind: primary
journey: contribute-a-code-change
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
        interface: git-transport
      - stage: open-proposal
        interface: web-ui
        experience: repository-collaboration
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
| `journey` | yes | Name exactly one existing Journey. |
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

## Flow

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
        interface: git-transport
      - stage: open-proposal
        interface: web-ui
        experience: repository-collaboration
```

The Journey Scenario is the authority for Capability order. Flow entries may
repeat or stop. Every achieved Journey Scenario uses at least two
distinct Capabilities. A not-achieved Scenario may stop after one Capability
when that behavior prevents the Goal.

Flow entries reference Capabilities, never Capability Scenarios. `operation`
provides a structured stage label, while `## Steps` expands the flow in the same
order. The number of prose Steps need not equal the number of flow entries.

For example, a flow entry may name `configure-repository` with operation “Set
the default branch.” If the model instead has only a vague
`manage-repositories` Capability covering unrelated create, rename, archive,
and delete behaviors, fix the Capability boundary rather than hiding those
operations in Scenario prose.

Every route contains each flow stage exactly once. Its context uses `interface`
and, when that Interface has Experiences, singular `experience`. Each context
must be within the named stage Capability's availability. Route IDs and stage
IDs are lowercase kebab-case and unique within the Scenario.

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

## Decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Its branches stay within and converge on this
Scenario's one Journey-level Outcome. A materially different Outcome belongs in
another Journey Scenario.
