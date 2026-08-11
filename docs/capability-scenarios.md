---
title: Capability scenarios
description: Concrete observable acceptance cases for exactly one durable Product Capability.
section: open-source
group: Product Model
order: 15
---

# Capability Scenarios

**A Capability Scenario is one concrete, observable acceptance case for exactly
one [Capability](./capabilities.md).** It states a particular starting
condition, the local behavior, and one terminal result for that ability.

Capability Scenarios are part of the behavioral core and are the only direct
acceptance coverage for a Capability. Missing coverage is an error for a
`complete` model, a warning for `partial` or `draft`, and an error for a public
Blueprint, whether or not the Product has any [Journeys](./journeys.md).

## When you create one

Create a Capability Scenario for every materially different observable behavior
of one Capability, including relevant primary, permission, validation,
conflict, and external-failure cases.

A Capability Scenario is a variation of one stable behavior, not an operation
hidden beneath a vague umbrella. `create-a-private-repository`,
`reject-a-duplicate-repository-name`, and `reject-unauthorized-creation` can be
Scenarios of `create-repository`. Create, rename, archive, and delete are not
automatically Scenarios of `manage-repositories`; when they carry independent
Product meaning, they are separate Capabilities.

Split a Capability Scenario when:

- a condition produces a materially different local Outcome; or
- an Interface route materially changes the observable behavior.

Web and mobile may share one Capability Scenario when they promise the same
behavior and Outcome. Checkout succeeding on Tuesday is not a separate case;
checkout being rejected because stock is unavailable is.

> **Capability Scenario vs Journey Scenario.** A Capability Scenario stops at
> the local result of one ability: “the repository write is rejected.” A
> [Journey Scenario](./journey-scenarios.md) ends at the Actor-goal result:
> “the change cannot be proposed for review.” They are different contracts and
> live in different collections.

## The file

Capability Scenarios live at
`capability-scenarios/<capability-scenario-id>.md`.

```md [capability-scenarios/reject-an-unauthorized-repository-write.md]
---
kind: permission
capability: publish-repository-changes
actors: [repository-contributor]
availability:
  - interface: git-transport
references:
  - kind: code
    role: implementation
    target: services/repository/push.go#AuthorizePush
---

# Reject an unauthorized repository write

## Trigger

A contributor without write permission pushes a repository change.

## Steps

1. The Product identifies the repository and contributor
2. The Product evaluates write permission
3. The Product rejects the write

## Outcome

The repository is unchanged and the contributor receives a permission error.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. |
| `kind` | yes | Name an entry in `taxonomies.yaml`. |
| `capability` | yes | Name exactly one existing Capability. |
| `actors` | yes | Name at least one unique existing Actor involved in the case. |
| `availability` | yes | Select at least one exact context already declared by the Capability. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | State the observable starting condition. |
| `## Steps` | yes | Provide a non-empty ordered list with each item on one physical line. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a non-empty bullet list when present, with each item on one physical line. |
| `## Outcome` | yes | State one local observable result of the Capability. |

A Capability Scenario cannot declare `journey`, `result`, or `flow`.
It cannot use Journey-only `## Goal` or `## Success criterion` sections, and
each recognized Scenario H2 may appear only once.
Business Rules own their Scenario relations; Capability Scenarios do not
duplicate a `businessRules` list. Screens may name Capability Scenario IDs in
which they participate.

Journey Scenarios reference the Capability, never this Capability Scenario.
That prevents a concrete local case from becoming a reusable operation entity.

## Supported interaction contexts

An availability record selects one supported interaction context: one
Interface plus, when that Interface has Experiences, one or more Experiences.
Every selected context must already be promised by the Capability.

```yaml
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
```

Equivalent contexts may share one Capability Scenario, but verification checks
each independently.

Every exact context must permit at least one Scenario Actor, and every Scenario
Actor must be supported by at least one selected context. Experience `actors`
are authoritative for an Experience-scoped context; otherwise the Interface
`actors` list is authoritative.

## Decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Use decisions for real behavioral forks whose
branches converge on the Scenario's one Outcome. A branch with a materially
different Outcome belongs in another Capability Scenario.
