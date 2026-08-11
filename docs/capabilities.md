---
title: Capabilities
description: Durable Product abilities with exact Interface availability and explicit local Capability Scenario coverage.
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
[Capability Scenarios](./capability-scenarios.md) form the behavioral core of
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

Capabilities live at `capabilities/<capability-id>.md`.

```md [capabilities/checkout.md]
---
domain: ordering
availability:
  - interface: customer-web
    experiences: [shopping]
  - interface: customer-mobile
    experiences: [shopping]
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
| `availability` | yes | Declare at least one valid Interface scope, with one record per Interface. Name Experiences when that Interface uses them. |
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
availability:
  - interface: reader-web
    experiences: [public-discovery, personal-workspace]
  - interface: reader-mobile
    experiences: [personal-workspace]
```

This does not promise `public-discovery` on `reader-mobile`. Availability is
intended Product scope, not implementation status; `businesslens-verify`
checks whether the implementation satisfies it.

For an Interface with no Experiences, omit the `experiences` key:

```yaml
availability:
  - interface: operator-cli
```

Capability Scenario availability and Journey Scenario route contexts select
exact contexts from this availability. They do not alter or expand the
Capability's scope, and every selected context is verified independently.
