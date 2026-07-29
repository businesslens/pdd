---
title: Terminology
description: A glossary of every BusinessLens product-model entity and the supporting concepts that connect them.
section: open-source
group: Concepts
order: 6
---

# BusinessLens terminology

BusinessLens uses a small product vocabulary on purpose. This page defines
each term and, more importantly, separates terms that sound similar. For exact
file shapes and validation requirements, use the
[format contract](./format.md).

## The model at a glance

```text
Product
├── Actors
├── Experiences ── surfaces available to actors
├── Domains
│   └── Features ── capabilities available through experiences
├── Journeys ── actor goals in a domain, using features
│   └── Scenarios ── observable paths through a journey
│       └── Decision points ── conditional forks inside a scenario
└── Business rules ── constraints on domains, features, journeys, or scenarios
```

The **product**, **actors**, **experiences**, **domains**, **features**,
**journeys**, **scenarios**, and **business rules** are the core model entities.
They have stable IDs and relationships. Decision points, intent, evidence,
links, taxonomies, and coverage add meaning to those entities but are not
standalone product entities.

## Core entities

| Term | Meaning | Example |
| --- | --- | --- |
| **Product** | The root of one Product Model: what the product is, who it serves, and why it exists. | Fixture Shop |
| **Actor** | A person, system, or operator distinguished by a goal or privilege. It is not a screen or an implementation role. | Shopper, store admin, billing webhook |
| **Experience** | A product surface with a stable audience, access mode, entry points, exit contract, and capability boundary. | Storefront, admin console, partner API, CLI |
| **Domain** | A recognizable product area used to organize capabilities and goals. It follows product language, not code architecture. | Catalog, ordering, billing |
| **Feature** | A stable product capability available to actors through one or more experiences. | Catalog search, checkout, refund management |
| **Journey** | A durable user or operator goal completed through one or more experiences and features. | Browse and buy, refund an order |
| **Scenario** | One materially distinct, observable path through a journey. Its Trigger, Steps, and Outcome form a verifiable acceptance contract. | Checkout succeeds, payment is declined |
| **Business rule** | A durable assertion, constraint, or policy that must remain true across the behavior it governs. | An order is confirmed only after payment succeeds |

## Terms that are easy to confuse

| Pair | Distinction |
| --- | --- |
| **Actor vs persona or role** | An actor exists because its goal or privilege changes product behavior. Demographics, job titles, and database roles alone do not create actors. |
| **Experience vs feature** | An experience is **where** capabilities are exposed; a feature is **what** capability exists there. A storefront can expose catalog browsing and checkout. |
| **Domain vs feature** | A domain is a broad product area used for organization; a feature is a specific capability within one domain. |
| **Feature vs journey** | A feature can be reused across goals; a journey is an end-to-end goal and may use several features. |
| **Journey vs scenario** | A journey stays stable while its success, permission, validation, conflict, or dependency-failure paths become separate scenarios when their observable outcomes differ materially. |
| **Scenario vs step** | A scenario is a complete acceptance unit. A step is one ordered event inside it and is not independently addressable. |
| **Business rule vs decision point** | A business rule states what must remain true and can govern many entities. A decision point records one question and its condition-to-outcome branches inside a scenario. |
| **Entry point vs code reference** | An entry point says how an actor reaches an experience or journey. A `codeRef` cites tracked source that proves an entity or behavior exists. |
| **Evidence vs coverage** | Evidence supports a particular entity. Coverage describes how complete and trustworthy the model is as a whole. |

## Embedded and supporting concepts

### Intent

**Intent** explains why the product or an entity exists and which outcome its
shape protects. It is an `## Intent` prose section, not a separate entity or a
substitute for observable behavior.

### Decision point

A **decision point** is a conditional fork inside a scenario. It contains one
product question and at least two condition-to-outcome branches. Use one only
when a condition produces materially different observable outcomes; ordinary
sequential behavior belongs in Steps.

### Trigger, Steps, Outcome, and Edge cases

These sections make a scenario observable:

- **Trigger** — the condition or action that starts the path.
- **Steps** — the ordered progression visible at product level.
- **Outcome** — the state the actor or operator ends with.
- **Edge cases** — optional supporting exceptions. A materially distinct path
  should be its own scenario instead.

### Scenario kind and taxonomy

A **scenario kind** classifies a whole scenario, such as `primary` or `edge`.
The allowed kinds form the model's **scenario taxonomy** in
`taxonomies.yaml`. A kind is a label for navigation and analysis; it does not
change scenario structure.

### Experience boundary terms

- **Access mode** — who may enter: `public`, `authenticated`, or `restricted`.
- **Entry point** — a compact type-and-path pair showing how the experience or
  journey is reached, such as `web: /admin` or `api: /v1/orders`.
- **Capability boundary** — what an experience can and cannot do.
- **Exit contract** — the successful state in which a visit or interaction
  ends.

### Evidence and `codeRefs`

**Evidence** is the tracked code that supports a product claim. A **code
reference** (`codeRef`) identifies a repository-relative path and optionally a
symbol or line range, such as
`src/services/orders.ts#OrderService.submit`. Journeys and scenarios require
direct evidence outside a draft model; other entities may cite it when their
boundary is represented in code.

### Links

A **link** connects an entity to a prescriptive or supporting artifact without
copying that artifact into the model. Supported relations are `spec`,
`proposal`, `doc`, and `adr`. Links are the bridge from Product-Driven
Development to technical design and task documents.

### Coverage

**Coverage** records how the model was produced, which source areas were
inspected, what remains unmapped, and known limitations. Its status means:

- `complete` — the claimed product scope is mapped.
- `partial` — useful evidence-backed coverage with known gaps.
- `draft` — a planned greenfield model whose implementation evidence has not
  been earned yet.

Coverage status describes the model's completeness, not whether an individual
feature is enabled, shipped, or deprecated.

## Artifacts that are not product entities

- The **Product Model** is the complete `.businesslens/` source artifact that
  contains the entities and their relationships.
- A **Product Report** is the generated, source-free representation of that
  model. It is a transport artifact and does not add another entity layer.
- A **Product Model Version** is the Platform's immutable record of one
  reported Product Report plus separately stored provenance.
- A **Blueprint** is a Platform-owned reusable identity around selected Product
  Model Versions. A local model, draft model, build, or publish is never
  automatically a Blueprint.
- A **Blueprint Revision** points to exactly one immutable Product Model
  Version. Public visibility is a separate Platform curation action.
- A **product map** is a visual or navigable view of the Product Model. It is
  not the `.businesslens/` artifact itself.
- A git **branch** may hold intended product behavior while implementation is
  in progress; it is the plan, not a Product Model entity.
- Platform concepts such as Project, Track, Hub, Blueprint, and revision belong to the
  hosted BusinessLens workflow, not to the `.businesslens/` product model.

For a narrative walkthrough of how the entities work together, continue to
[The product model](./product-map.md). For field-level authoring rules, use the
[format contract](./format.md).
