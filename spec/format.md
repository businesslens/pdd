# The `.businesslens/` Format

> **This is engineering documentation, not a docs-site page.** It is the
> contract the parser, the linter, and the catalog server must agree on, and
> it changes *before* their behavior does.
>
> The user-facing explanation of the same entities lives in the Product model
> group under `docs/` — one page per entity, each carrying its file shape and
> the `lint` findings that constrain it. Keep the two consistent.

This document is the contract for the BusinessLens PDD folder: the git-tracked
product model that lives inside a repository. Everything the public CLI lints is
defined here. `businesslens lint` checks whether this folder is structurally
sound; it does not claim that the model and implementation agree.

Planning uses the same files: approved intended behavior is written into the
model before implementation. `businesslens-verify` performs the separate,
semantic comparison with the implementation and owns any resolution loop. Git
may narrow that inspection to a branch, but a diff never decides which side is
authoritative. The technical *how* of a change (specs, designs, task lists)
still belongs to your SDD tool of choice and may be attached through
`references`.

## Folder layout

```
.businesslens/
├── config.yaml              # tool config (committed)
├── product.md               # product manifest (committed)
├── taxonomies.yaml          # scenario kinds (committed)
├── coverage.md              # coverage assessment (committed)
├── actors/<actor-id>.md
├── interfaces/<interface-id>.md
├── experiences/<experience-id>.md # optional contexts
├── screens/<screen-id>.md          # optional visual views
├── domains/<domain-id>.md   # optional grouping
├── capabilities/<capability-id>.md
├── journeys/<journey-id>.md        # optional goal compositions
├── capability-scenarios/<scenario-id>.md
├── journey-scenarios/<scenario-id>.md # required only with Journeys
├── business-rules/<rule-id>.md
├── README.md                # canonical agent orientation
├── .gitignore               # generated paths only
├── build/                   # generated Product Report — never committed
└── cache/                   # generated artifacts — never committed
```

## Universal conventions

- **The committed shell is complete.** `README.md` and `.gitignore` are
  required alongside the semantic files. `.gitignore` must ignore `build/`
  and `cache/`; those generated directories are never part of the committed
  model.

- **ID = filename stem.** An entity's id is its filename without `.md`. IDs are
  lowercase kebab-case:
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never write `id:` in frontmatter — the
  filesystem is the id authority. The one exception is `product.md`, whose
  `id:` names the Product Model (it may differ from the repo name) and is
  limited to 64 characters for portability across BusinessLens consumers.
- **H1 = title/name.** The first `# Heading` in the body is the entity's
  title (actors and domains call it `name`).
- **Lead paragraph = description.** Prose between the H1 and the first `##`
  heading is the description for actors, domains, experiences, and the product.
  Journeys and both Scenario types instead use the required structured sections
  specified below.
- **Frontmatter = relations and navigation only.** Never prose.
- **Intent and Goal = recognized prose sections.** `## Intent` explains why the
  product or entity exists and which outcome it protects. `## Goal` states the
  stable Actor intent of a Journey. Both are structured prose, not separate
  entities.
- Scenario IDs are globally unique across `capability-scenarios/` and
  `journey-scenarios/`.

## References

`references` is an optional extension on every semantic entity: Product,
Actor, Interface, Experience, Screen, Domain, Capability, Journey, Capability
Scenario, Journey Scenario, and Business Rule. It is not accepted in
`config.yaml`, `coverage.md`, or `taxonomies.yaml`.

```yaml
references:
  - kind: visual
    role: intent
    target: https://design.example.com/checkout
    title: Approved checkout direction
  - kind: code
    role: implementation
    target: src/checkout/handler.ts#CheckoutHandler.submit
```

Every item requires exactly `kind`, `role`, and `target`; `title` is optional.
Unknown keys are invalid.

- `kind` is `code`, `spec`, `proposal`, `doc`, `adr`, `visual`, or `research`.
  It identifies the artifact, not what the model concludes from it.
- `role` is `intent`, `implementation`, or `context`. It explains why the
  artifact is attached to this entity. It is not a verification result or a
  freshness claim.
- `target` is the artifact address. Duplicate targets on one entity are
  invalid, even when their kinds or roles differ.
- `title` is an optional non-empty display label.

For `kind: code`, `target` uses the compact
`path[#symbol][:start[-end]]` grammar. The line suffix is the last `:` whose
remainder matches `^\d+(-\d+)?$`; the symbol is everything after the first `#`
of what remains. The path must be repository-relative and tracked according to
`git ls-files`. Code references may use any role, including `intent`, but they
remain navigation rather than proof and never replace the entity's prose.

All other kinds accept either an HTTP(S) URL or a repository-relative path.
`lint` ignores a local target's query and fragment when checking the tracked
file set and warns when the path is missing. HTTP(S) targets are syntax-checked
but never fetched. Absolute filesystem paths, `file:` URLs, other URL schemes,
and backslash paths are invalid.

References connect the self-contained Product Model to material maintained
outside it. A model may contain no references at any Coverage status.
The deterministic CLI does not copy, download, generate, execute, or assess
referenced content. BusinessLens skills may follow curated References as leads,
but the artifact remains evidence to assess rather than proof to trust.

## Entity files

### `config.yaml`

```yaml
schema: 4                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. Schema 4 is the only supported folder format.

### `product.md`

```markdown
---
id: acme-shop
summary: Discover products and complete purchases with confidence.
category: commerce
tags: [commerce]
authors:
  - name: Acme
    url: https://example.com
license: MIT
limitations: []
---

# Acme Shop

One-paragraph description of the product.

## Intent

Why this product should exist and the outcome it protects.

## Anything else

Kept in the repo as supporting context.
```

`## Intent` is compiled into the report's product intent. Other unrecognized
sections are preserved as supporting Markdown so a report can be expanded
without silently losing authored context.

The Product frontmatter may also carry portable identity and attribution used
by every report host. `summary` is a single-line short description (400
characters maximum), `category` is a lowercase kebab-case classification,
`authors` is a list of `{ name, url? }` records, and `license` is an SPDX
license identifier. The H1 remains the Product title and the lead prose remains
its full description.

The Product may have one visual identity asset at `.businesslens/logo.svg`.
It is a self-contained, UTF-8 SVG with a `viewBox`, at most 256 KiB, and cannot
contain active content, event handlers, embedded documents, imports, or network
references. It is rendered only as an image and is not embedded in the Product
Report. Public Blueprints require it; general local Product Models may omit it.

General Product Models may omit this metadata. A Product Report always carries
the fields, using the full description as the summary fallback and `null` or an
empty list for omitted optional values. The public Blueprint publication
profile additionally requires a category, at least one tag, at least one
author, a license, and `logo.svg`. There is no separate Blueprint manifest.

### `taxonomies.yaml`

```yaml
scenarioKinds:
  - id: primary
    name: Primary
    description: Expected observable behavior path.
    colorSlot: 1
  - id: edge
    name: Edge case
    description: Alternative or failure path.
    colorSlot: 6
```

### `actors/<id>.md`

```markdown
---
kind: person                 # person | system
relationship: external      # external | internal
---

# Shopper

An external person who browses the catalog and buys products.
```

Both classifications are required. `relationship` is relative to the Product
boundary. An implementation component is not an Actor merely because it calls
another component; an internal system is an Actor only when its responsibility,
privilege, trigger, or outcome is product-significant. H1 = name and the lead
paragraph = description.

### `interfaces/<id>.md`

An Interface is a supported interaction form through which Actors access the
Product and for which product behavior can be independently required and
verified. A customer web application, mobile application, operator CLI, partner
API, and supported integration are Interfaces. Frameworks, internal adapters,
and private component APIs are not.

```markdown
---
actors: [shopper, guest]
entryPoints:
  - web: /
---

# Customer web application

The browser interface through which shoppers use the store.

## Capability boundary

Supports customer-facing behavior. It does not expose store operations.
```

`actors` contains at least one Actor ID. `entryPoints` is optional and contains
product-facing root addresses. H1, lead description, and `## Capability
boundary` are required. There is no closed Interface-kind enum, access mode, or
exit contract.

### `experiences/<id>.md`

An Experience is a coherent context of Product use with a stable audience,
access boundary, and capability boundary. It may be offered through one or more
Interfaces. The entire Experience collection is optional: create Experiences
only when named contexts distinguish meaningful Product scope within an
Interface or express one context shared across Interfaces.

```markdown
---
actors: [store-admin]
interfaces: [admin-web, operator-cli]
access: restricted              # public | authenticated | restricted
entryPoints:
  - admin-web: /admin
  - operator-cli: shop admin
---

# Administration

Where authorized operators manage the store and its orders.

## Capability boundary

Supports store operations. It does not expose a shopper's private account.
```

`actors` and `interfaces` are non-empty ID lists. Every Experience Actor must
be supported by each referenced Interface. `access` is required. Optional
`entryPoints` use Interface IDs as keys and may name only Interfaces declared by
the Experience. H1, lead description, and `## Capability boundary` are required.
There is no `exit` field. An Interface with one undivided usage context does not
need a ceremonial Experience.

### Availability

Capabilities, Screens, and Business Rules use one exact availability shape.
An Interface without Experiences is named directly; an Interface divided into
Experiences names the exact contexts:

```yaml
availability:
  - interface: operator-cli
  - interface: customer-web
    experiences: [storefront, account-management]
  - interface: customer-mobile
    experiences: [storefront]
```

Each record names one independently supported Interface scope. When no
Experience declares that Interface, omit `experiences`; the record means direct
availability through the Interface. When one or more Experiences declare that
Interface, `experiences` is required and must be a non-empty unique list of
Experiences that declare it. An Interface cannot mix direct and
Experience-scoped availability. Duplicate Interfaces or scopes are invalid.
Availability states intended Product scope, never implementation status.

Journeys do not declare availability. Journey Scenarios use an ordered `flow`
because one path may deliberately move between Interfaces or Experiences.
Capability Scenarios declare exact availability selected from their one
Capability.

### `domains/<id>.md`

Optional `colorSlot: 3` and `references` frontmatter. H1 = name, lead paragraph =
description. The entire Domain collection is optional. A Domain groups related
Capabilities for product navigation; it is not code architecture or Journey
ownership.

### `capabilities/<id>.md`

A Capability is a stable ability of the Product. It has no necessary beginning
or end and may support several Journeys, Experiences, Screens, and Interfaces.
Capabilities and their observable Capability Scenarios are the behavioral core
of the model; Journey composition is optional.

```markdown
---
domain: ordering                 # optional
availability:
  - interface: customer-web
    experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Let a shopper complete a purchase without losing cart state on a recoverable
failure.
```

`availability` is required and needs at least one Interface scope. `domain` is
optional and, when present, names exactly one Domain. Actors are expressed by
Capability Scenario, Journey, Journey Scenario, Actor-bound Interface, and
optional Experience relations. Business Rules own their scope, so Capability
files do not duplicate Rule IDs. Capability Scenario files own the acceptance
relation, so Capability files do not duplicate Scenario IDs. A Capability
Scenario is the only direct acceptance coverage for a Capability; Journey
Scenario use does not satisfy that coverage rule. Missing coverage is an error
when `coverage.md` is `complete`, a warning when it is `partial` or `draft`, and
always a publication error for a public Blueprint.

A Capability is the smallest durable behavior that remains independently
meaningful, not necessarily the smallest UI action or code operation. Capability
Scenarios vary the conditions, route, or observable result of that one behavior;
they must not act as hidden sub-capabilities. When supposed Scenarios instead
describe independently meaningful verbs with different purposes, outcomes,
permissions, availability, or Business Rules, split them into Capabilities and
use an optional Domain for their umbrella. For example, `manage-repositories`
is too broad when its cases are actually create, configure, archive, and delete
behaviors with distinct contracts.

### `business-rules/<id>.md`

A Business Rule is a durable constraint or policy that may apply across
multiple behaviors.

```markdown
---
domains: [ordering]
capabilities: [checkout]
journeys: [browse-and-buy]
capabilityScenarios: [reject-out-of-stock-checkout]
journeyScenarios: [browse-and-complete-checkout]
availability:
  - interface: customer-web
    experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Stock must be available

An order can be confirmed only while every requested item has sufficient
available stock.

## Intent

Never accept an order the product cannot fulfill.

## Rationale

Inventory may change between browsing and final submission, so checkout must
revalidate it.
```

The lead paragraph is the rule statement. `domains`, `capabilities`, `journeys`,
`capabilityScenarios`, and `journeyScenarios` are relation lists. `availability`
optionally limits the rule to exact Interface scopes, optionally narrowed by
Experience. A rule must relate to at least one Domain, Capability, Journey,
either Scenario type, or availability scope. Business Rule owns these
relations; consumers derive backlinks.

### `screens/<id>.md`

A Screen is a meaningful user-visible view where product information or
capabilities are exposed. It is platform-neutral: it need not be a web page,
have a URL, fill a device display, or correspond to one implementation module.
The whole `screens/` collection is optional so non-visual products remain valid.

```markdown
---
availability:
  - interface: customer-web
    experiences: [storefront]
  - interface: customer-mobile
    experiences: [storefront]
capabilities: [catalog-browsing]
capabilityScenarios: [browse-catalog]
journeyScenarios: [browse-and-complete-checkout]
entryPoints:
  - customer-web: /products/:id
  - customer-mobile: acme-shop://products/:id
references:
  - kind: visual
    role: intent
    target: docs/ui/product-record.png
    title: Current visual reference
---

# Product record

Shows the information a shopper needs to evaluate one product.

## Intent

Help a shopper decide whether to add the product to the cart.

## Information presented

- Product name and description
- Price and availability

## Available actions

- Add the product to the cart
- Return to the catalog

## Product states

### Available

The product can be added to the cart.

### Unavailable

The reason it cannot be purchased is explained.

## Capability boundary

The screen does not change product or inventory data.
```

`availability` and `capabilities` each need at least one item. Every Screen
scope must also be declared by every referenced Capability.
`capabilityScenarios`, `journeyScenarios`, and `entryPoints` are optional;
entry-point keys must name an Interface in the Screen's availability. The H1,
lead description,
`## Information presented` bullet list, and `## Capability boundary` prose are
required. `## Available actions` is optional but, when present, must contain a
bullet list. `## Product states` is optional; each state is an H3 name followed
by non-empty prose. States remain embedded in the Screen report entity.

A referenced Capability Scenario's Capability must appear in the Screen's
`capabilities`, and the Scenario and Screen must share at least one exact
availability context. A referenced Journey Scenario must have at least one flow
entry whose Capability appears in the Screen's `capabilities` and whose exact
context intersects the Screen's availability.

Only product-significant states belong here: a state changes what the user
understands, can do, or achieves. Empty, unavailable, unauthorized,
validation-failure, and completed states commonly qualify. Themes, viewport
variants, hover states, skeletons, component variants, and screenshot baselines
do not. Visual artifacts stay external and may be attached with
`kind: visual`; their role distinguishes curated intent from implementation or
supporting context.

One Screen may relate to multiple Interfaces and optional Experiences when its
product semantics are shared. Separate Screens are warranted only when purpose,
information, actions, meaningful states, or capability boundaries differ.

Screens do not author a sitemap or transition graph. A screen inventory is a
generated projection grouped by Interface and Experience; observable movement
belongs in Capability Scenarios and Journey Scenarios. XML sitemaps remain
implementation artifacts, and UX sitemaps may be external `doc` or `visual`
references.

### `journeys/<id>.md`

A Journey is an optional, evidence-backed coherent Actor goal that requires
deliberate composition of multiple Capabilities. It owns only its high-level
Goal and Success criterion. Concrete Capability selection, order, branches,
repetition, and failure belong to Journey Scenarios.

```markdown
---
actors: [shopper]
references:
  - kind: doc
    role: context
    target: docs/shopping.md
---

# Browse and buy

## Goal

A shopper wants to purchase a suitable product.

## Success criterion

A confirmed order exists for the selected product.
```

`actors` is a non-empty list of the Actors who pursue the goal, not every system
that participates in its implementation.

`## Goal` states the stable Actor intent. `## Success criterion` states how an
achieved attempt is recognized without prescribing one route. `references` is
optional. Consumers derive Domains and Interface/Experience contexts from
Journey Scenario flow entries. A Journey has no `entryPoints`; concrete Product
routes remain on Interfaces, Experiences, and Screens.

A consumer that presents a Journey entry route starts with the first flow item
of each achieved Journey Scenario, then resolves the matching Interface or
Experience entry point. This is derived navigation, not authored Journey data.

Consumers derive the Journey's primary Capability set from achieved Scenarios
and mark Capabilities observed only in not-achieved Scenarios as failure-only.
These are coverage projections, not authored Journey meaning or proof that
mapping is exhaustive.

A Journey has no `availability`, Trigger, Steps, decisions, concrete Outcome,
authored Capability list, or authored Scenario list. At least one Journey
Scenario must name it with `result: achieved` and exercise at least two distinct
Capabilities. This is Journey acceptance coverage, not the source of its
identity.

A Journey is established behavior only when repository evidence supports a
deliberate handoff, orchestration, shared state, navigation, command, or
cross-Interface transition toward its Actor outcome. A wizard can establish a
Journey but is not required. A merely plausible sequence of independent
Product actions is not a Journey. The number of Journey Scenario variations
does not define it; one achieved variation provides valid coverage. A goal with
no achieved multi-Capability flow belongs to Capability behavior or remains
unsupported Journey intent. Planned Journeys may record approved intent before
implementation but must meet the same structural distinctions.

### `capability-scenarios/<id>.md`

A Capability Scenario is one concrete observable acceptance case for exactly
one Capability. It describes local ability behavior rather than an end-to-end
Journey goal.

```markdown
---
kind: validation
capability: checkout
actors: [shopper]
availability:
  - interface: customer-web
    experiences: [storefront]
  - interface: customer-mobile
    experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Reject checkout with unavailable stock

## Trigger

A shopper submits a cart containing an unavailable product.

## Steps

1. The Product receives the checkout request
2. The Product validates current stock
3. The Product rejects checkout before charging payment

## Outcome

No order is created, the cart is retained, and the unavailable item is
identified.
```

`kind` must exist in `taxonomies.yaml`. `capability` names exactly one existing
Capability. `actors` and `availability` are non-empty. Every availability
context must be declared by the Capability. Equivalent contexts may share one
Capability Scenario when they promise the same behavior and Outcome; split
them when the route changes observable behavior or outcome.

Every selected exact context must permit at least one Scenario Actor, and every
Scenario Actor must be supported by at least one selected context. For an
Experience-scoped context, its `actors` list is authoritative; otherwise the
Interface's `actors` list is authoritative.

A Capability Scenario cannot declare `journey`, `result`, or `flow`.
Business Rules own its Rule relations, so it does not duplicate Rule IDs.

### Scenario sections

Both Scenario types require non-empty `## Trigger`, `## Steps`, and `## Outcome`
sections. `## Steps` is an ordered list with at least one item. `## Edge cases`
is an optional bullet list.

`## Decision points` is optional. Each decision uses an H3 title, a non-empty
question paragraph, then at least two bullet branches. Each branch uses
`condition → outcome` with the Unicode arrow or `condition -> outcome` with
ASCII characters. Its branches stay within and converge on that Scenario's one
observable outcome. A branch with a materially different outcome belongs in a
separate Scenario of the same type. Decision points remain embedded rather than
becoming standalone entities.

### `journey-scenarios/<id>.md`

A Journey Scenario is one concrete end-to-end variation of exactly one Journey.
It begins with the Journey Actor's Goal and ends with that goal achieved or not
achieved. It verifies Capability composition and handoffs rather than replacing
local Capability Scenarios.

```markdown
---
kind: primary
actors: [shopper]
journey: browse-and-buy
result: achieved
flow:
  - capability: catalog-browsing
    operation: Find and select an available product
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
  - capability: checkout
    operation: Submit checkout and confirm the order
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Steps

1. The shopper finds an available product in the catalog
2. The shopper adds the product to the cart and submits checkout
3. The Product validates stock and charges payment
4. The Product persists and confirms the order

## Decision points

### Fulfillment path

Does the cart contain physical items?

- physical items → collect a delivery address before payment
- digital only → continue to payment without delivery details

## Outcome

Order is stored and a confirmation is shown.

## Edge cases

- Receipt delivery unavailable → order remains confirmed and the receipt is available in the account
```

`kind` must exist in `taxonomies.yaml`. `journey` names exactly one existing
Journey. `result` is `achieved` or `not-achieved`. `kind` classifies the nature
of the variation while `result` records its terminal Journey-goal outcome; they
are orthogonal. `actors` and `flow` are non-empty, and the Actors must include
at least one Actor from the Journey.

Every exact flow context must permit at least one Scenario Actor, and every
Scenario Actor must be supported by at least one flow context. This does not
require every Actor to use every flow entry in a cross-Interface path.

Each ordered flow entry names exactly one existing Capability, a required
single-line `operation`, and a non-empty `availability` list using the shared
exact availability shape. In
this context, an availability scope is a supported interaction context: one
Interface plus, when that Interface uses Experiences, one or more Experiences.
Every context must be declared by that flow entry's Capability. Contexts within
one flow entry are equivalent supported routes for the same behavioral stage
and are verified independently.

The Journey Scenario owns Capability selection and order. Capability
flow entries may repeat or stop. An achieved Journey Scenario must use
at least two distinct Capabilities. A not-achieved Journey Scenario may stop
after one Capability, but its Outcome must state the Journey-level reason the
goal was not achieved.

Flow entries reference Capabilities, never Capability Scenarios. Their
`operation` fields are the structured stage labels and the Journey Scenario
Steps expand the flow in the same order; the number of prose Steps need not
equal the number of flow entries. A local
permission, validation, conflict, or failure contract remains a separate
Capability Scenario when it is independently observable; the Journey Scenario
states only its end-to-end consequence for the Goal.

The flow is linear. A Decision point may vary detail while preserving the same
Capability sequence and terminal Outcome. A branch that changes either belongs
in another Journey Scenario.

Split Interface variants when the route changes observable behavior or outcome;
do not duplicate a Journey Scenario merely because the same contract is
supported through web and mobile. Business Rules own Scenario scope, so Journey
Scenarios do not duplicate Rule IDs.

### `coverage.md`

```markdown
---
status: partial                    # complete | partial | draft
method: ["Static review of the pinned revision without executing code"]
sourceAreas: [src, server]
unmapped: ["deployment/"]
limitations: ["Background jobs not yet mapped"]
---

# Coverage

Free prose rationale retained with the coverage assessment.
```

The coverage frontmatter (`status`, `method`, `sourceAreas`, `unmapped`,
`limitations`) and the prose rationale are authored from the inspection that
created or expanded the model. Entity totals in a Product Report belong to its
Summary, not Coverage. Coverage has no reference counts and is never inferred
from `references`. The linter checks authored entities and relationships; it
does not compile, publish, or semantically verify the model.

`status` describes **model breadth**, never implementation or verification:

- `draft` — the model itself is still being authored or reviewed.
- `partial` — the model is useful and has known unmapped areas.
- `complete` — the intended product scope is modeled.

All three statuses may be exported. A complete model may describe planned,
implemented, or mixed behavior and may contain zero references. Proposing it as a
catalog Blueprint is a separate, explicit action; public listing remains an
administrator decision.

## Generated files

- `cache/build.json` — metadata for the most recent portable build.
- `build/report.json` — portable Product Report v8 generated by
  `blueprint export`.

The map inventory is emitted to stdout and writes no cache file. All of
`build/` and `cache/` are gitignored by model-creation workflows. Generated
files are derived artifacts and must not be edited or committed.

## Portable report and expansion

`build/report.json` is a Product Report with `schemaVersion: "8.0.0"`. It
contains the product entities, relationships, intent, portable references,
supporting content, identity, attribution, entity counts, and coverage needed
to reconstruct the model. Its top-level `summary` is the short Product
description; its top-level `counts` object contains entity totals.

Product Report v8 stores `capabilityScenarios` and `journeyScenarios` as
separate entity collections and separate counts. It has no generic `scenarios`
collection. A Journey record's `capabilityIds` and `domainIds` derive from
achieved Scenario flows; `failureOnlyCapabilityIds` separately marks
Capabilities observed only in not-achieved flows. These are modeled coverage
projections rather than authored Journey meaning.

Compilation produces a `workspace` reference profile. As written by
`blueprint export`, a report carries the **portable** reference profile: it
removes every `kind: code` reference, every `role: implementation` reference,
every repository-relative reference, every repository-relative entry point,
and `coverage.sourceAreas`. It also contains no repository URL, branch, commit,
catalog listing state, pricing, or entitlement data. A report that has been
through `export` is a Blueprint.

The report schema accepts only content that can expand into canonical entity
Markdown: titles and list items are single-line, required descriptions and
behavior sections are non-empty, Capability Scenario availability and Journey
Scenario flow entries resolve to existing entities, every achieved Journey
Scenario uses at least two distinct Capabilities, and Interface/Capability
consistency holds. Product Report v8 is the only accepted report version.
No report profile requires a reference. Present references remain subject to
the same strict shape and target rules.

### Portable projection

Several report fields name the origin repository rather than the product. That
navigation is useful inside its repository but must not be published. Every
report proposed or served as a public catalog Blueprint is first passed through
one shared projection:

```ts
import { projectPortableReport } from 'businesslens/report'

serve(projectPortableReport(report))
```

| Field | Delivered report |
| --- | --- |
| `references` | only HTTP(S) intent/context references kept |
| `entryPoints` | repository paths and `file:` URLs dropped; routes, HTTP(S) URLs, non-file mobile deep links, and commands kept |
| `coverage.sourceAreas` | emptied |
| `referenceProfile` | set to `portable` |

Relative POSIX paths, Windows paths, UNC paths, local `file:` URLs, and
recognizable absolute filesystem paths are repository-origin metadata. A rooted
entry point such as `/checkout` is a product route and is kept. An absolute URI
with a non-file scheme such as `acme-shop://products/42` is a product deep link
and is also kept. Repository-relative references are dropped. HTTP(S)
intent/context references are kept. A value with no path separator at all,
such as a CLI entry point, is not a path and is kept.

Author-written prose — `method`, `unmapped`, `limitations`, `rationale`,
`intent`, and `supportingContent` — is never rewritten. It carries product
meaning and belongs to the author, so keep repository internals out of it.

The projection is idempotent and does not mutate its input. Because both the
framework and the catalog apply this same exported function, contributors and
the server cannot disagree about what a delivered report exposes.
`validateProductReport` rejects a report that declares `referenceProfile:
portable` while still carrying a code reference, implementation reference,
repository-relative reference, or Coverage source area.

`blueprint export` writes the portable report. Contribution applies
the same idempotent projection before opening a public pull request. `open` and
`pull` project imported content to the portable profile before expansion, so
source navigation is never transplanted into the receiving repository.

The inverse command is:

```bash
npx businesslens blueprint open ./report.json
```

`open` validates the report and expands it into canonical Markdown/YAML under
`.businesslens/`. `npx businesslens blueprint pull <blueprint-slug>` anonymously
retrieves the current public Blueprint for that catalog slug and invokes the
same expansion path without saving a user-facing report download.

Both commands refuse a non-empty target by default. The semantic round-trip
guarantee is:

```text
report A → blueprint open → .businesslens/ → blueprint export → report B
```

After normalizing `generatedAt` and generator version, A and B describe the
same product. Original whitespace, comments, YAML key order, and formatting are
not preserved. Local linked SDD files are referenced but never created or
overwritten by `open`.
