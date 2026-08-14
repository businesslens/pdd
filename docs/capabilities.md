---
title: Capabilities
description: Durable Product abilities with exact Interface availability, and the local Capability Scenarios that make each ability observable.
section: open-source
group: Product Model
order: 14
---

# Capabilities

**A Capability is a durable ability of the Product:** catalog search, guest
checkout, reading-state tracking, or release approval. It completes the
sentence “the Product can …”.

A Capability has no necessary beginning or end. It remains meaningful beyond
one route, command, or implementation module and can participate in several
Screens, Capability Scenarios, and optional [Journeys](./journeys.md).

Capabilities and their observable
[Capability Scenarios](#capability-scenarios) form the behavioral core of
the Product Model. A Capability does not need a Journey, but it does need at
least one Capability Scenario covering every exact availability context.

## When you create one

Create a Capability when an ability is reusable across goals or independently
important to Product scope, availability, Screens, Business Rules, or
verification. Do not create one for an implementation function, endpoint, UI
label, or sequence step that has no durable Product meaning.

A Capability is the smallest durable behavior that remains independently
meaningful, not necessarily the smallest button, API operation, or code
function. If supposed Scenarios describe different Product verbs with different
purposes, outcomes, permissions, availability, or Business Rules, the
Capability is probably too broad.

For example, `manage-repositories` is not a useful umbrella when its cases are
really create, configure, archive, and delete behaviors with distinct
contracts. Split those into Capabilities and, when navigation benefits, group
them under a Repository administration [Domain](./domains.md).

Every Capability declares its exact Interface availability, naming
[Experiences](./experiences.md) only where the Interface uses them. An optional
[Domain](./domains.md) can organize it, but Domains are not required.

## The file

A Capability without Scenarios or assets may stay compact at
`capabilities/<capability-id>.md`. Once it owns a Scenario or asset, it expands
to `capabilities/<capability-id>/capability.md`.

```md [capabilities/checkout.md]
---
domain: ordering
availability: [customer-web::shopping, customer-mobile::shopping]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `availability` | yes | Declare at least one valid scope id. Use a bare Interface id when it is undivided, or `interface-id::experience-id` when it contains Experiences. |
| `domain` | no | Name one existing Domain when the grouping is useful. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Capability and describe the durable Product ability. |

Capability files do not list Actors, Capability Scenarios, Journey Scenarios,
Journeys, Screens, or Business Rules. Other entities own those relations, and
consumers derive backlinks. A Capability Scenario's `capability` field creates
its direct acceptance relation, while a Journey Scenario names concrete
Capability flow entries. Journey Capability backlinks are derived from those
entries rather than authored on the Journey.

Capability Scenario coverage is the only direct acceptance coverage for a
Capability. The union of its Capability Scenarios must cover every exact
Interface/Experience pair the Capability declares; use by a Journey Scenario
does not satisfy that requirement. A missing pair is an error for a `complete`
model, a warning for `partial` or `draft`, and an error when publishing a public
Blueprint. A single-Capability goal remains local Capability behavior and never
requires a Journey wrapper.

## Availability

Each record creates only the pairs it names:

```yaml
availability: [reader-web::public-discovery, reader-web::personal-workspace, reader-mobile::personal-workspace]
```

This does not promise `public-discovery` on `reader-mobile`. Availability is
intended Product scope, not implementation status; `businesslens-verify`
checks whether the implementation satisfies it.

For an Interface with no Experiences, omit the `experiences` key:

```yaml
availability: [operator-cli]
```

Capability Scenario availability and Journey Scenario route contexts select
exact contexts from this availability. They do not alter or expand the
Capability's scope, and every selected context is verified independently.

## Capability Scenarios

**A Capability Scenario is one concrete, observable acceptance case for exactly
one Capability.** It states a particular starting condition, the local behavior,
and one terminal result for that ability.

A Scenario always belongs to exactly one parent, and the parent decides which
kind it is. A Scenario owned by a Capability is a Capability Scenario; a
Scenario owned by a Journey is a
[Journey Scenario](./journeys.md#journey-scenarios). There is no unowned
Scenario and no way for one Scenario to serve both parents.

Capability Scenarios are part of the behavioral core and are the only direct
acceptance coverage for a Capability. Missing coverage is an error for a
`complete` model, a warning for `partial` or `draft`, and an error for a public
Blueprint, whether or not the Product has any [Journeys](./journeys.md).

### When you create a Capability Scenario

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

### The Capability Scenario file

Capability Scenarios normally live at
`capabilities/<capability-id>/scenarios/<id>.md`. A Scenario with assets expands
to `<id>/capability-scenario.md`.

```md [capabilities/publish-repository-changes/scenarios/reject-an-unauthorized-repository-write.md]
---
kind: permission
actors: [repository-contributor]
availability: [git-transport]
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
| `actors` | yes | Name at least one unique existing Actor involved in the case. |
| `availability` | yes | Select at least one exact context already declared by the Capability. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | State the observable starting condition. |
| `## Steps` | yes | Provide a non-empty ordered list with each item on one physical line. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a non-empty bullet list when present, with each item on one physical line. |
| `## Outcome` | yes | State one local observable result of the Capability. |

A Capability Scenario cannot declare `result` or `flow`, and neither Scenario
type declares its parent — the folder it sits in is the parent.
It cannot use Journey-only `## Goal` or `## Success criterion` sections, and
each recognized Scenario H2 may appear only once.
Business Rules own their Scenario relations; Capability Scenarios do not
duplicate a `businessRules` list. Screens may name Capability Scenario IDs in
which they participate.

Journey Scenarios reference the Capability, never this Capability Scenario.
That prevents a concrete local case from becoming a reusable operation entity.

### Supported interaction contexts

`availability` is a list of scope ids selected from the ones its Capability
already promises.

```yaml
availability: [reader-web::personal-library, reader-mobile::personal-library]
```

Equivalent contexts may share one Capability Scenario, but verification checks
each independently.

Every exact context must permit at least one Scenario Actor, and every Scenario
Actor must be supported by at least one selected context. Experience `actors`
are authoritative for an Experience-scoped context; otherwise the Interface
`actors` list is authoritative.

### Capability Scenario decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Use decisions for real behavioral forks whose
branches converge on the Scenario's one Outcome. A branch with a materially
different Outcome belongs in another Capability Scenario.
