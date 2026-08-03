# Interfaces, Experiences, and Capabilities

Status: implemented. This document records the approved implementation plan;
`spec/format.md` is the authoritative format contract.

## Objective

Make delivery commitments a first-class part of the BusinessLens Product Model
without weakening Experience as a product concept.

The revised model must answer four different questions without conflating them:

- **Interface:** through which supported interaction form is the Product used?
- **Experience:** in which coherent context does an Actor use the Product?
- **Capability:** what durable ability does the Product provide?
- **Journey:** what complete goal does an Actor accomplish?

This is an intentional breaking format change. There is no compatibility layer,
legacy alias, dual read path, or automatic migration command.

## Decisions

1. Add Interface as a first-class entity.
2. Retain Experience as a first-class entity.
3. Model Interface and Experience as orthogonal, many-to-many product concepts,
   not as a rigid directory hierarchy.
4. Rename Feature to Capability so the durable ability is clearly distinct from
   the actor goal modeled by a Journey.
5. Retain the name Domain, make Domains optional, and use them only to organize
   Capabilities.
6. Remove `domain` from Journey. A Journey may cross Domains; its Domains are
   derived from its Capabilities.
7. Classify every Actor as a person or system and as internal or external.
8. Make intended Interface–Experience availability explicit and exact.
9. Remove `exit` from Experience. Journeys and Scenarios own successful outcomes.
10. Keep Screens optional and external visual evidence outside the Product Model.
11. Do not add a closed Interface-kind enum in this revision. The Interface ID,
    title, description, Actors, entry points, and boundary define the contract.
12. Do not add lifecycle or implementation-status fields. Declared availability
    is intended product scope; `businesslens-verify` determines implementation
    alignment.

## Conceptual model

```text
Product
├── Actors
├── Interfaces ───────────────┐
├── Experiences ──────────────┤ exact availability pairs
├── Screens (optional) ───────┤
├── Domains (optional)        │
│   └── Capabilities ─────────┤
├── Journeys ─────────────────┤
│   └── Scenarios ────────────┘
└── Business Rules
```

Interface and Experience form a matrix rather than a parent-child tree:

| Experience | Web application | Mobile application | Operator CLI | Partner API |
| --- | --- | --- | --- | --- |
| Public discovery | yes | yes | no | no |
| Personal workspace | yes | yes | no | no |
| Administration | yes | no | yes | yes |
| Automation | no | no | yes | yes |

The matrix is product meaning. Repository packages, deployables, protocols,
routes, and command namespaces do not determine it automatically.

## Entity contracts

### Product

`product.md` remains the one coherent value promise represented by a Product
Model. A repository may contain several delivery applications for that Product.
Genuinely independent Products use independent `.businesslens/` model roots.

No `productType` or platform list is added.

### Actor

Actors remain roles with a product goal or privilege. Every Actor gains two
required fields:

```yaml
kind: person       # person | system
relationship: external  # external | internal
```

`relationship` is relative to the Product boundary:

- `external`: an independently acting customer, visitor, partner, source, or
  system outside the Product owner's control;
- `internal`: a person or system operating on behalf of the Product owner.

An implementation component is not an Actor merely because it calls another
component. An internal system becomes an Actor only when its responsibility,
privilege, trigger, or outcome is product-significant.

### Interface

Interfaces live at `interfaces/<interface-id>.md`.

An Interface is a supported interaction form through which Actors access the
Product and for which product behavior can be independently required and
verified.

Examples include a customer web application, reader mobile application,
operator CLI, partner API, administrative console, and supported integration.
Frameworks and internal adapters are not Interfaces.

Proposed shape:

```md
---
actors: [reader, visitor]
entryPoints:
  - web: /
codeRefs: []
links: []
---

# Reader web application

The browser interface through which readers use the Product.

## Capability boundary

Supports reader-facing behavior. It does not expose internal operations.
```

Required:

- at least one valid `actors` relation;
- H1 and lead description;
- non-empty `## Capability boundary`.

Optional:

- product-facing root `entryPoints`;
- `## Intent` and supporting prose;
- `links` and `codeRefs`.

Interface Actors state who may use any part of the Interface. Experience Actors
must be valid for every Interface on which that Experience is offered.

There is no Interface-level `access` or `exit`. A single Interface can contain
public, authenticated, and restricted Experiences, and persistent Interfaces do
not have one meaningful successful exit.

### Experience

Experiences remain at `experiences/<experience-id>.md`.

An Experience is a coherent context of Product use with a stable audience,
access boundary, and capability boundary. It may be offered through one or more
Interfaces.

Examples include public discovery, personal workspace, administration, account
management, and partner automation.

Proposed shape:

```md
---
actors: [administrator]
interfaces: [admin-web, operator-cli]
access: restricted
entryPoints:
  - admin-web: /admin
  - operator-cli: product admin
---

# Administration

Where authorized operators manage the Product and its users.

## Capability boundary

Supports operational administration. It does not grant access to a user's
private workspace content.
```

Required:

- at least one Actor;
- at least one Interface;
- `access: public|authenticated|restricted`;
- H1, lead description, and non-empty `## Capability boundary`.

Optional:

- Interface-specific `entryPoints` whose keys must name one of the Experience's
  Interface IDs;
- `## Intent`, supporting prose, `links`, and `codeRefs`.

Remove `exit` entirely.

Experience creation test:

1. It represents a coherent Actor context.
2. It has a meaningful capability boundary and can state exclusions.
3. It remains meaningful when navigation, routes, or commands are reorganized.
4. It normally contains or supports multiple goals, Capabilities, Screens, or
   commands.
5. Its availability through different Interfaces is independently meaningful.

An overview page is a Screen, not automatically an Experience. A command group
is an Experience only when it represents a durable context rather than parser
organization. A settings area may be an Experience, Domain, Capability, Screen,
or Journey depending on which question it actually answers.

### Availability relation

Capabilities, Journeys, Screens, Scenarios, and Business Rules need exact
Interface–Experience placement. Two independent lists are ambiguous, so use one
shared relation shape:

```yaml
availability:
  - interface: reader-web
    experiences: [personal-workspace, account-management]
  - interface: reader-mobile
    experiences: [personal-workspace]
```

Each record states intended Product availability, not current implementation
status. The record is exact: it creates only the listed Interface–Experience
pairs, not a cross-product with another record.

Rules:

- `interface` must reference one Interface;
- `experiences` must be a non-empty unique list;
- every Experience must exist and declare that Interface;
- duplicate Interface–Experience pairs are invalid;
- an entity may have at most one record for the same Interface;
- records and Experience IDs are serialized in authored order but normalized
  deterministically in the report.

### Capability

Rename `features/` to `capabilities/` and Feature to Capability throughout the
format, report, CLI, SDK exports, docs, skills, fixtures, and Blueprint.

A Capability is a stable ability of the Product. It has no necessary beginning
or end and can support several Journeys, Experiences, Screens, and Interfaces.

Proposed shape:

```md
---
domain: library
availability:
  - interface: reader-web
    experiences: [personal-workspace]
  - interface: reader-mobile
    experiences: [personal-workspace]
---

# Reading state

Tracks which items a reader has read and presents a finite unread backlog.

## Intent

Let readers make durable progress through incoming content.
```

Required:

- at least one availability pair;
- H1 and lead description.

Optional:

- exactly one `domain` relation;
- `## Intent`, supporting prose, `links`, and `codeRefs`.

Remove Actor and Business Rule lists from Capability. Actors are expressed by
Journeys and availability through Actor-bound Experiences. Business Rules own
their scope, and consumers derive Capability backlinks.

Capability creation test:

- it completes the sentence “the Product can ...”;
- it is stable beyond one route, command, or implementation module;
- it is reusable across goals or independently important to product scope,
  Interface availability, Screens, or Rules;
- it does not merely repeat a Journey title.

### Domain

Keep `domains/<domain-id>.md` and the name Domain.

A Domain is an optional recognizable grouping of related Capabilities. It is
product navigation, not code architecture and not Journey ownership.

Changes:

- the whole Domain collection is optional;
- Capability `domain` is optional and, when present, singular;
- Journey has no `domain` field;
- a Journey's Domains are derived from its Capabilities;
- a Business Rule may still relate directly to Domains when it governs the
  whole area;
- zero Domains is structurally valid.

### Journey

A Journey remains one complete Actor goal and continues to own its Scenarios.

Proposed shape:

```md
---
actors: [reader]
capabilities: [reading-state, item-saving, source-refresh]
availability:
  - interface: reader-web
    experiences: [personal-workspace]
  - interface: reader-mobile
    experiences: [personal-workspace]
entryPoints:
  - reader-web: /unread
  - reader-mobile: reader://unread
---

# Catch up on unread

A reader sees what arrived, reads it, and leaves the backlog smaller.
```

Required:

- at least one Actor;
- at least one Capability;
- at least one availability pair;
- at least one Scenario;
- H1 and lead summary.

Remove `domain` and the separate `experiences` list. Availability owns the exact
Interface–Experience relationship.

For every Journey availability pair, every referenced Capability must declare
the same pair. This makes a Journey promise internally consistent: a goal cannot
be required through an Interface where one of its required Capabilities is not
promised.

### Scenario

Scenarios continue to describe observable paths through a Journey.

Add optional `availability`. When omitted, a Scenario applies to every pair on
its Journey. When present, every pair must be a subset of the Journey's
availability.

Use Scenario availability only when behavior or outcomes differ materially by
Interface or Experience. Do not copy every Journey pair into every Scenario.

### Screen

Screens remain optional, platform-neutral meaningful visual views.

Replace separate `experiences` with exact `availability` pairs and rename
`features` to `capabilities`:

```yaml
availability:
  - interface: reader-web
    experiences: [personal-workspace]
  - interface: reader-mobile
    experiences: [personal-workspace]
capabilities: [reading-state, item-saving]
scenarios: [work-through-the-unread-backlog]
entryPoints:
  - reader-web: /unread
  - reader-mobile: reader://unread
```

Every Screen availability pair must also be declared by every referenced
Capability. Screens do not create navigation graphs or own visual evidence.
Screenshots, mockups, prototypes, and research stay external through `links`.

### Business Rule

Business Rule remains the single owner of rule scope. Replace `features` with
`capabilities` and allow optional `availability` for an Interface–Experience
specific rule.

A Rule must relate to at least one Domain, Capability, Journey, Scenario, or
availability pair. Consumers derive backlinks; other entities do not duplicate
Business Rule ID lists.

## Folder and wire versions

Advance directly to folder schema `3`:

```text
.businesslens/
├── config.yaml
├── product.md
├── actors/
├── interfaces/
├── experiences/
├── screens/                 # optional
├── domains/                 # optional
├── capabilities/
├── business-rules/
└── journeys/
```

Breaking behavior:

- schema 1 and 2 are rejected with a clear unsupported-schema finding;
- `features/` is no longer read;
- Feature fields and report collections are removed rather than aliased;
- `exit` and Journey `domain` are rejected as unknown keys;
- old Experience, Feature, Screen, Journey, Scenario, and Rule shapes are not
  normalized;
- Product Report advances to v6 and only v6 is accepted by export/open/pull and
  SDK parsing;
- remove Product Report v4/v5 normalization code and media-type negotiation;
- no migration command is added.

The repository's fixture and bundled Blueprint are migrated in the same change,
so the supported package never ships with an old-format example.

## Parser and report work

1. Change `spec/format.md` first with the complete schema 3 contract.
2. Add Interface parser and report types.
3. Add required Actor classification fields.
4. Rename Feature parser/types/collections to Capability.
5. Add the shared availability parser and canonical pair representation.
6. Update Experience parsing, removing `exit` and adding Interface relations.
7. Make Capability Domain optional and remove Journey Domain.
8. Update Screen, Journey, Scenario, and Rule parsing.
9. Publish strict Product Report v6 schemas with `interfaces`, `capabilities`,
   and availability pairs.
10. Remove v4/v5 compatibility schemas and normalizers.
11. Preserve source-free export behavior: product entry points survive; local
    source navigation and repository-relative supporting links are redacted.

## Lint invariants

Add deterministic findings for:

- missing Interface collection or zero Interfaces;
- Interface with no Actors or capability boundary;
- Actor with invalid or missing `kind`/`relationship`;
- Experience with no Interface, no Actor, invalid access, or missing boundary;
- Experience Actor not supported by one of its Interfaces;
- Experience entry point naming an undeclared or missing Interface;
- malformed, duplicate, empty, or impossible availability records;
- Capability with no availability;
- missing optional Domain when a Capability names one;
- Journey with no Actor, Capability, availability, or Scenario;
- Journey availability not supported by every required Capability;
- Scenario availability outside its Journey;
- Screen availability not supported by its Capabilities;
- Rule with no scope;
- removed schema fields and folders reported as unsupported rather than silently
  ignored.

Do not make lint claim implementation alignment or infer availability from code.

## CLI and generated projections

Update `lint`, `blueprint export`, `blueprint open`, `blueprint pull`, and
`blueprint contribute` for schema 3 and Product Report v6.

Update summaries and generated views to include:

- Interface count;
- Experience count;
- Capability count;
- Interface × Experience matrix;
- Capability × Interface/Experience availability;
- Journey × Interface/Experience availability;
- Screens grouped by Interface and Experience;
- Domain groupings derived from Capabilities;
- Actor exposure derived from Actor relationship and Interface/Experience
  relations.

Generated projections never become authored sitemap or navigation entities.

## Skills and authoring behavior

Update all three skills and their self-contained format/rubric references.

### Map

- inventory deployables, routes, commands, API boundaries, and integrations as
  evidence, not as automatic Interfaces;
- create an Interface only for a supported product interaction contract;
- create internal Actors and Interfaces only for product-significant operations;
- distinguish Experience from navigation sections and command namespaces;
- map exact intended availability only when supported by evidence;
- do not claim cross-Interface parity from shared backend code.

### Ideate

- make Interface choice and availability an explicit product decision;
- ask whether web/mobile, iOS/Android, public/internal APIs, or CLIs need
  independently scoped commitments;
- apply the Experience creation test;
- distinguish Capability statements from Journey goals;
- use Domains only when grouping improves the model.

### Verify

- verify every declared availability pair independently;
- trace Interface entry point through the relevant Experience and Journey to
  observable outcome;
- distinguish missing Interface support from a missing shared Capability;
- treat undeclared internal APIs and code paths as implementation details;
- never convert absence of codeRefs into an implementation finding.

## Blueprint migration and validation

Migrate `content-feed-reader` as a product redesign exercise, not a mechanical
rename.

Candidate Interfaces to validate against source-free product meaning:

- reader web application;
- reader mobile application;
- syndicated-content integration.

Candidate Experiences:

- personal library;
- account access;
- public collection reading;
- source ingestion and recovery, if the system interaction warrants a separate
  Experience after applying the creation test.

The Blueprint must decide whether public collection reading is a separate web
Interface or an Experience inside the reader web Interface. It must not invent a
CLI, public API, internal operator, or other unsupported Product concept merely
to demonstrate the schema.

Rename the ten current Features to Capabilities and preserve the meaningful
many-to-many graph. In particular:

- source refresh supports catch-up, follow-source, and recovery Journeys;
- item saving supports catch-up and save-and-organize Journeys;
- collections supports organization and sharing Journeys;
- catch-up remains a cross-Domain Journey assembled from library, curation, and
  source Capabilities;
- share-collection remains a cross-Domain Journey assembled from sharing and
  curation Capabilities.

Keep Domains so the Blueprint demonstrates the optional entity honestly. Add a
separate lint fixture with zero Domains to prove optionality.

Use the fixture shop to demonstrate concepts absent from the Blueprint when
they fit the fixture honestly, including an internal store administrator and
separate public and administrative Interfaces. Parser/unit fixtures may cover
CLI and API Interface shapes without adding fake interfaces to either product.

## Documentation

Update the Product Model overview and one page per entity:

- add `docs/interfaces.md`;
- revise `docs/experiences.md` around coherent contexts and availability;
- rename `docs/features.md` to `docs/capabilities.md`;
- revise Actor, Domain, Journey, Scenario, Screen, Rule, code-reference, CLI,
  integration, workflow, and skill pages;
- use Interface, Experience, Capability, and Journey consistently;
- explain public/internal API decisions without calling every API a Product;
- give side-by-side web, mobile, CLI, API, Screen, and command examples;
- document the Experience creation test and common misclassifications;
- avoid a separate glossary or error catalog.

Update README entity trees and summaries without presenting delivery Interfaces
as Product types.

## Tests

Add or revise tests for:

1. Actor kind and relationship parsing and linting.
2. Interface parsing, required content, Actors, entry points, and links.
3. Experience Interface relations and Interface-keyed entry points.
4. Exact availability parsing, ordering, duplication, and missing relations.
5. Capability rename and optional Domain.
6. Cross-Domain Journey derivation.
7. Journey-to-Capability availability consistency.
8. Scenario availability inheritance and subset validation.
9. Screen availability and Capability consistency.
10. Interface/Experience-scoped Business Rules.
11. Source-free v6 export and round-trip expansion.
12. Rejection of schema 1/2, Product Report v4/v5, `features/`, `exit`, and
    Journey `domain`.
13. Models with no Domains and no Screens.
14. Products with web and mobile Interfaces sharing Experiences and Screens.
15. Products with visual and non-visual Interfaces.
16. Internal person/system Actors and external person/system Actors.
17. Multiple `.businesslens/` roots inside one repository.

## Implementation order

1. Approve this plan and settle any changes to the entity contracts.
2. Rewrite `spec/format.md` as schema 3.
3. Implement core parsing, types, availability, and Product Report v6.
4. Implement lint rules and relationship consistency.
5. Update CLI commands, export redaction, expansion, and generated projections.
6. Update the fixture shop and all automated tests.
7. Migrate and critically review the content-reader Blueprint.
8. Update all skills and validate each with `quick_validate.py`.
9. Update user-facing documentation and README.
10. Update `[Unreleased]` in `CHANGELOG.md`.
11. Run `npm run verify` and `npm pack --dry-run`.

Do not publish, tag, push, or release as part of implementation unless requested
separately.

## Acceptance criteria

- Product is not classified as web, mobile, CLI, or API.
- Interfaces are explicit supported product contracts.
- Experiences remain strong reusable contexts across Interfaces.
- Exact Interface–Experience availability is authored and structurally checked.
- Internal/external and person/system Actor distinctions are explicit.
- Internal implementation APIs are not forced into the Product Model.
- Capability and Journey have visibly different contracts and naming tests.
- Domains remain named Domains and are genuinely optional.
- Journeys can cross Domains without selecting an artificial primary Domain.
- Screens work across visual Interfaces without containing screenshots.
- The Blueprint demonstrates the model honestly and remains source-free.
- The supported codebase contains one strict schema and one strict report version.
- Full repository verification and package dry-run pass.
