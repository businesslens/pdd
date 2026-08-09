# Capability Scenarios, Journeys, and Journey Scenarios

Status: implemented in the existing schema 4 and Product Report v8 contracts.

## Objective

Make four behavioral contracts unambiguous:

- **Capability:** what durable behavior does the Product provide?
- **Capability Scenario:** what concrete variation makes exactly one Capability
  observable and verifiable?
- **Journey:** what coherent Actor goal deliberately composes multiple
  Capabilities?
- **Journey Scenario:** what concrete end-to-end variation can occur while an
  Actor pursues exactly one Journey?

Capability Scenarios and Journey Scenarios are separate entity types, separate
file collections, and separate report relations. A file can never change type
by adding an optional relation.

This is an intentional breaking change within folder schema `4` and Product
Report v8. There is no compatibility reader, legacy alias, dual format, or
automatic migration command.

## Problem established by repository mapping

The Argo CD and Gitea mappings exposed opposite failures produced by the same
contract:

- Gitea created one-Capability wrapper Journeys so Capability behavior could
  have Scenarios, while other Capabilities received no Scenarios because no
  honest Journey existed.
- Argo CD avoided wrappers by grouping several administration Capabilities into
  broad Journeys whose Scenarios did not clearly exercise every listed
  Capability.
- Both models passed lint because the format gave Scenarios only a Journey
  parent and could not express Capability acceptance directly.
- Journey availability required every Capability through every Journey scope,
  making real cross-Interface paths difficult to represent honestly.

The issue is structural. One Scenario type was being asked to serve two
different subjects.

## Decisions

1. Add `capability-scenarios/<scenario-id>.md`. Every Capability Scenario names
   exactly one Capability.
2. Add `journey-scenarios/<scenario-id>.md`. Every Journey Scenario names
   exactly one Journey.
3. Remove the generic Scenario entity and its Journey-nested collection.
4. Keep Capability files at `capabilities/<capability-id>.md` and Journey files
   at `journeys/<journey-id>.md`.
5. Treat Capability Scenarios as the only direct Capability acceptance
   coverage. A missing relation is an error for complete models and public
   Blueprints, and a warning for partial or draft models.
6. Define a Journey by its Actors, Goal, and Success criterion only. Journey
   meaning is goal-focused and does not author a Capability list or flow.
7. Require every Journey to have at least one achieved Journey Scenario. This
   is acceptance coverage, not the definition of the Journey.
8. Give Capability Scenarios exact `availability` selected from their one
   Capability. Equivalent Interface variants may share a Scenario; split them
   when behavior or outcome materially differs.
9. Give Journey Scenarios an ordered `flow`. Each entry names one existing
   Capability, a required one-line operation, and exact supported interaction
   contexts used there.
10. Require every achieved Journey Scenario to exercise at least two distinct
    Capabilities. Each Journey Scenario owns its own order, branches, repeats,
    and terminal result; a not-achieved Scenario may stop after one Capability.
11. Keep Journey free of `availability`. A Journey can move between Interfaces;
    its concrete contexts belong to Journey Scenario flow entries. Concrete
    Product routes remain on Interfaces, Experiences, and Screens.
12. Keep Trigger, Steps, Decision points, Outcome, and Edge cases on both
    Scenario types. A Capability Scenario Outcome is local to one ability; a
    Journey Scenario Outcome says whether the Actor goal was achieved.
13. Keep the shared `scenarioKinds` taxonomy for both Scenario types.
14. Split Screen and Business Rule relations into `capabilityScenarios` and
    `journeyScenarios` so their scope is never ambiguous.
15. Keep Scenario IDs globally unique across both collections for stable report
    routes and unambiguous references.
16. Derive a Journey's primary Capability and Domain projections from achieved
    flow entries, and mark Capabilities observed only in not-achieved flows as
    failure-only. Scenario coverage must not be presented as exhaustive when
    mapping is partial.
17. Do not use Capability Scenarios as hidden operations beneath a vague
    umbrella Capability. A Capability Scenario varies the conditions, route, or
    result of one stable behavior. Split independently meaningful behaviors into
    Capabilities and use an optional Domain for their umbrella.

## Conceptual model

```text
Capability
└── Capability Scenarios
    └── local variations of that one ability

Journey (optional)
├── coherent Actor goal
└── Journey Scenarios
    └── ordered Capability flows for complete variations of pursuing that goal
```

There is no Capability-Scenario-versus-Journey choice. A concrete local case is
always a Capability Scenario. A coherent multi-Capability goal is a Journey,
and its end-to-end variations are always Journey Scenarios.

## Entity contracts

### Capability

A Capability remains a durable Product ability with exact intended
availability. It has no necessary beginning or end and remains meaningful
outside any one Journey.

Capability Scenario backlinks are derived from the `capability` field on
Capability Scenario files. Complete models and public Blueprints need at least
one such backlink per Capability; partial and draft gaps are warned.

A Capability is the smallest independently meaningful durable behavior, not an
arbitrary UI action. If its supposed Scenarios are unrelated Product operations
with distinct purposes, outcomes, permissions, availability, or Rules, split
them into Capabilities and use a Domain for the optional umbrella.

### Capability Scenario

A Capability Scenario is one concrete observable acceptance case for exactly
one Capability.

```md
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

Rules:

- `capability` names exactly one existing Capability;
- `actors` and `availability` are non-empty;
- every availability context must be declared by the Capability;
- Trigger, Steps, and Outcome describe only that Capability's observable
  contract;
- no `journey`, `result`, or multi-Capability flow is allowed.

### Journey

A Journey is an optional, evidence-backed coherent Actor goal that can be
achieved only through deliberate composition of multiple Capabilities. It owns
only its high-level meaning; concrete Capability flows belong to its Journey
Scenarios.

```md
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

Rules:

- `actors` names the Actors who pursue the goal;
- `## Goal` states the stable Actor intent;
- `## Success criterion` states how goal achievement is recognized without
  prescribing one concrete route;
- a Journey has no Trigger, Steps, decisions, concrete Outcome, `availability`,
  authored Capability list, or authored Scenario list;
- at least one achieved Journey Scenario using two or more distinct Capabilities
  must cover it.

### Journey Scenario

A Journey Scenario is one concrete end-to-end variation of exactly one Journey.

```md
---
kind: primary
journey: contribute-a-code-change
actors: [repository-contributor]
result: achieved
flow:
  - capability: publish-repository-changes
    operation: Push the branch
    availability:
      - interface: git-transport
  - capability: propose-code-change
    operation: Open the branch for review
    availability:
      - interface: web-ui
        experiences: [repository-collaboration]
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

Rules:

- `journey` names exactly one existing Journey;
- `result` is `achieved` or `not-achieved`;
- `actors` includes at least one Journey Actor;
- `flow` is non-empty and ordered;
- each flow entry names one existing Capability, one non-empty single-line
  operation, and a non-empty list of exact contexts declared by that Capability;
- an achieved Scenario touches at least two distinct Capabilities;
- a not-achieved Scenario may stop after one Capability and states the
  Journey-level reason the goal was not achieved;
- flow operations name the exact action performed within each Capability while
  Steps expand the same linear order in readable prose;
- local validation details remain separate Capability Scenarios unless they
  materially change the end-to-end Journey result;
- Journey Scenarios reference Capabilities, never Capability Scenarios.

## Folder contract

```text
.businesslens/
├── capabilities/<capability-id>.md
├── capability-scenarios/<scenario-id>.md
├── journeys/<journey-id>.md           # optional collection
└── journey-scenarios/<scenario-id>.md # required only when Journeys exist
```

## Structural validation

Schema `4` lint enforces:

- the two Scenario collections and their distinct frontmatter allowlists;
- globally unique Scenario IDs across both collections;
- one valid Capability relation and exact availability for every Capability
  Scenario;
- at least one Capability Scenario for every Capability;
- one valid Journey relation, result, Actors, and flow for every Journey
  Scenario;
- at least two distinct flow Capabilities in every achieved Journey
  Scenario;
- at least one achieved Journey Scenario for every Journey;
- separate Screen and Business Rule relations for both Scenario types;
- globally valid IDs, References, decisions, and all existing universal rules.

Structural lint cannot decide whether prose describes a genuinely coherent
goal or whether two differently worded cases are materially different. Mapping,
ideation, verification, and human review retain that evidence-based judgment.

## Journey evidence test

Mapping may create a Journey only when inspection establishes all of the
following:

1. Named Actors pursue one recognizable Goal and Success criterion.
2. At least one achieved Journey Scenario uses two or more durable Capabilities.
3. The Product deliberately connects those Capabilities through a handoff,
   orchestration, shared state, navigation, command, or supported
   cross-Interface transition.
4. At least one achieved end-to-end Journey Scenario is evidence-backed.
5. The Journey is not a merely plausible sequence or an administrative grouping.

When these cannot be established, keep the independently verifiable Capability
Scenarios and omit the Journey. In ideation, the same test describes approved
intended behavior rather than established implementation.

## Product Report projection

Product Report v8 stores `capabilityScenarios` and `journeyScenarios` as
separate collections. It derives:

- Capability acceptance coverage only from Capability Scenarios;
- Journey goal coverage only from Journey Scenarios;
- Journey primary Capabilities and Domains from achieved flow entries, with
  failure-only Capabilities marked separately;
- Journey Interface and Experience contexts from Journey Scenario flow entries;
- separate Screen and Business Rule backlinks for both Scenario types.

Journey count is not a Product completeness measure. A complete model may have
zero Journeys when no deliberate multi-Capability goal is part of its Product
contract.

## Implementation scope

The parser, lint rules, Product Report v8 contract, export/open round trip,
renderers, installed skills, golden fixture, Content Feed Reader Blueprint,
orientation text, and automated tests implement this contract directly. Schema
4 and Product Report v8 retain their version labels; historical shapes are not
accepted.

## Acceptance criteria

- Every Capability in a complete model or public Blueprint has direct,
  observable Capability Scenario coverage; partial and draft gaps are visible.
- A Capability Scenario can never refer to or become a Journey Scenario.
- Every Journey authors one coherent goal and no flow or Capability list.
- Every Journey has an achieved end-to-end Journey Scenario.
- Every achieved Journey Scenario composes at least two Capabilities in its own
  exact order.
- Journey Capability projections are derived from Journey Scenario flow entries.
- Capability Scenarios remain variations of one behavior rather than hidden
  operations under vague umbrella Capabilities.
- Cross-Interface Journey routes do not imply false Capability availability.
- Gitea can model repository permission and validation behavior without wrapper
  Journeys, while a real publish-to-review goal remains a Journey.
- Argo CD can give each Capability local acceptance coverage while reserving
  Journeys for coherent goals such as delivering or recovering an application.
- A complete Product Model may validly contain zero Journeys.
- Documentation, skills, implementation, fixtures, and Blueprints express the
  same contract.
