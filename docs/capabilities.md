---
title: Capabilities
description: Durable Product abilities with explicit availability Contexts, and the local Capability Scenarios that make each ability observable.
section: open-source
group: Product Model
order: 15
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
least one Capability Scenario covering every availability Context.

## When you create one

Create a Capability when an ability is reusable across goals or independently
important to Product boundaries, availability, Screens, Business Rules, or
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

Every Capability declares explicit availability Contexts, naming
[Experiences](./experiences.md) only where the Interface uses them. An optional
[Domain](./domains.md) can organize it, but Domains are not required.

## The file

A Capability without Scenarios or assets may stay compact at
`capabilities/<capability-id>.md`. Once it owns a Scenario or asset, it expands
to `capabilities/<capability-id>/capability.md`.

```md [capabilities/checkout.md]
---
domain: ordering
availability:
  - place: customer-web::shopping
  - place: customer-mobile::shopping
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
| `availability` | yes | Declare at least one strict Context with one `place`. The place is a bare undivided Interface id or an `interface-id::experience-id`. |
| `domain` | no | Name one existing Domain when the grouping is useful. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Capability and describe the durable Product ability. |

Capability files do not list Actors, Capability Scenarios, Journey Scenarios,
Journeys, Screens, or Business Rules. Other elements own those relations, and
consumers derive backlinks. A Capability Scenario's containing Capability
folder creates its direct acceptance relation, while a Journey Scenario annotates concrete
Steps with Capabilities. Journey Capability backlinks are derived from those
Steps rather than authored on the Journey.

Capability Scenario coverage is the only direct acceptance coverage for a
Capability. The union of its Capability Scenarios must cover every availability
Context the Capability declares through its Step Contexts; use by a Journey Scenario
does not satisfy that requirement. A missing Context is an error for a `complete`
model, a warning for `partial` or `draft`, and an error when publishing a public
Blueprint. A single-Capability goal remains local Capability behavior and never
requires a Journey wrapper.

## Availability

Each item is the same strict Context shape used elsewhere:

```yaml
availability:
  - place: reader-web::public-discovery
  - place: reader-web::personal-workspace
  - place: reader-mobile::personal-workspace
```

This does not promise `public-discovery` on `reader-mobile`. Availability is
intended Product meaning, not implementation status; `businesslens-verify`
checks whether the implementation satisfies it.

For an Interface with no Experiences, use the Interface as the Context place:

```yaml
availability:
  - place: operator-cli
```

Scenario Step Contexts select most-specific places within this availability. They do
not alter or expand the Capability's availability, and every selected Context
is verified independently.

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

## What a Capability acts on

`entities` lists the [Entities](./entities.md) this Capability acts on. It covers
changes a transition can never express — renaming a thing alters its
information, not its state — and it is what a transition's `by` is checked
against.

### Behavior nobody triggers

A schedule the Product owns, an expiry, a retry — real Product behavior with no
Actor to name. Write it as a Scenario whose **first Step is a `condition`
carrying `unattended: true`**, and give the Capability availability where an
Actor *observes the outcome*, never a synthetic Interface.

```yaml
steps:
  - text: The Product's own collection schedule comes due for a followed source
    kind: condition
    unattended: true
```

An unattended Scenario derives no Actors, and is the only Scenario that may have
none. Without it, unattended behavior had to be written as somebody else's
request, or left with no acceptance coverage at all.

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
routes:
  git-push: Git push
steps:
  - text: The contributor pushes a repository change
    kind: actor
    actor: repository-contributor
    contexts:
      git-push:
        place: git-transport
  - text: The Product identifies the repository and contributor
    kind: product
    contexts:
      git-push:
        place: git-transport
  - text: The Product evaluates write permission
    kind: product
    contexts:
      git-push:
        place: git-transport
  - text: The Product rejects the write
    kind: product
    contexts:
      git-push:
        place: git-transport
references:
  - kind: code
    role: implementation
    target: services/repository/push.go#AuthorizePush
---

# Reject an unauthorized repository write

## Trigger

A contributor without write permission pushes a repository change.

## Outcome

The repository is unchanged and the contributor receives a permission error.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. |
| `kind` | yes | Name an entry in `taxonomies.yaml`. |
| `routes` | yes | Map each unique lowercase kebab-case route ID to a unique human-readable name. |
| `steps` | yes | Give a non-empty ordered list of typed Steps. Each Step has one-line `text`, `kind: actor|product|condition`, and optional route-specific `contexts`. |
| `steps[].actor` | for Actor Steps | Name the responsible Actor when `kind: actor`; omit it for Product actions and unowned conditions. |
| `steps[].contexts` | when contextualized | Map every declared route to a strict Context whose `place` is the most-specific occurrence: a Screen when one exists, otherwise the leaf Experience or Interface. Omit it only when the Step is shared by all routes and has no Context. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | State the observable starting condition. |
| `## Steps` | no | Structured Steps live only in frontmatter. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a non-empty bullet list when present, with each item on one physical line. |
| `## Outcome` | yes | State one local observable result of the Capability. |

A Capability Scenario cannot declare `result`, `actors`, `availability`, or a
Step `capability`; its parent Capability is implicit. Both Scenario types
require frontmatter `steps`, and neither declares its parent—the folder it sits
in is the parent.
It cannot use Journey-only `## Goal` or `## Success criterion` sections, and
each recognized Scenario H2 may appear only once.
Business Rules own their Scenario relations; Capability Scenarios do not
duplicate a `businessRules` list. Screen participation is derived from Step
Contexts; Screens do not list Scenario IDs.

Journey Scenarios reference the Capability, never this Capability Scenario.
That prevents a concrete local case from becoming a reusable operation element.

### Routes, Steps, and Context places

A route is one named supported traversal through unchanged Scenario behavior.
Use multiple routes when the Trigger, ordered Step text, Step kinds, responsible
Actors, and Outcome are the same but the Context places differ. If any behavior
changes, create another Scenario.

Every contextualized Step maps every route. A Step without `contexts` is shared by all
routes and has no Context. Every route must have a Context at least once, and two routes
cannot repeat the same Context-place sequence. Changing `place` between consecutive
contextualized Steps is an explicit Context transition, including movement between Screens in one
Experience.

A Step Context is concrete and most-specific. If its availability boundary owns
Screens, its `place` names the Screen. Otherwise it names the leaf Experience
or undivided Interface. Actor support, Screen participation, and backlinks are
all derived from these Context claims.

### Capability Scenario decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Use decisions for real behavioral forks whose
branches converge on the Scenario's one Outcome. A branch with a materially
different Outcome belongs in another Capability Scenario.
