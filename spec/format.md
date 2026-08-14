# The `.businesslens/` Format

> **This is engineering documentation, not a docs-site page.** It is the
> contract the parser, the linter, and the catalog server must agree on, and
> it changes *before* their behavior does.
>
> The user-facing explanation of the same entities lives in the Product model
> group under `docs/` — one page per entity, each carrying its file shape and
> the `lint` findings that constrain it. Keep the two consistent.
>
> This document defines the **authored folder**. The wire contract that
> serializes it — the Product Report, its portable projection, and expansion —
> is [`report.md`](./report.md).

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

## Terms

| Term | Meaning |
| --- | --- |
| **Product Model** | `.businesslens/` — the git-tracked folder this document defines. May cite the repository's code. |
| **Product Report** | the portable serialization of a Product Model. One format, two profiles. |
| — *workspace* | `referenceProfile: workspace`. Repository-relative references and entry points intact, as optional navigation. For a full product instance inside the boundary that owns the code. |
| — *portable* | `referenceProfile: portable`. No `kind: code`, no repository-relative targets or entry points. Required whenever a report crosses an ownership boundary. |
| **Blueprint** | a Product Report curated into the public catalog under a slug. Always the portable profile, because that is what the catalog accepts. |

**Redaction is a property a report has, never a category it belongs to.** A
report carrying repository navigation is still a Product Report; it is simply
not a Blueprint. Nothing about where a file is stored may be decided by whether
it would survive publication — the profile filters at serialization time, and
that is the only place the distinction lives.

## Folder layout

An entity uses the smallest shape that can hold it:

- **compact** — `<id>.md` when the entity has no assets or child entities;
- **expanded** — `<id>/<type>.md` when it owns assets or a typed child
  collection.

The two shapes represent the same entity and derive the same id. Adding the
first asset or child promotes the Markdown file with `git mv`; removing the last
one compacts it again. Both shapes must never exist for the same id. This keeps
leaf-heavy collections readable without giving up co-location or path-owned
parent relations.

Every entity follows that rule; only its type filename and permitted child
collection differ:

| Entity | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Actor | `actors/<id>.md` | `actors/<id>/actor.md` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/` or `experiences/`, never both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<scope>/screens/<id>.md` | `<scope>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |

Here `<scope>` is either an Interface folder or an Experience folder. A
representative model can therefore look like this:

```
.businesslens/
├── config.yaml              # tool config (committed)
├── taxonomies.yaml          # scenario kinds (committed)
├── coverage.md              # coverage assessment (committed)
├── product.md               # compact Product when it has no logo
├── product/                 # expanded Product alternative
│   ├── product.md
│   └── logo.svg             # optional locally; required for a public Blueprint
├── actors/<actor-id>.md
│
│   ── surface tree: where the Product is ──
├── interfaces/<interface-id>/
│   ├── interface.md
│   ├── screens/<screen-id>.md                    # compact Screen
│   └── experiences/<experience-id>/
│       ├── experience.md
│       └── screens/
│           ├── <screen-id>.md                    # compact Screen
│           └── <illustrated-screen-id>/          # expanded Screen
│               ├── screen.md
│               └── mockup.svg
│
│   ── subject axis: what it is about ──
├── domains/<domain-id>.md                       # optional
│
│   ── behavior tree: what the Product does ──
├── capabilities/<capability-id>/
│   ├── capability.md
│   └── scenarios/<scenario-id>.md
├── journeys/<journey-id>/                       # optional
│   ├── journey.md
│   └── scenarios/<scenario-id>.md
│
├── business-rules/<rule-id>.md                  # optional
├── README.md                # canonical agent orientation
├── .gitignore               # generated paths only
├── build/                   # generated Product Report — never committed
└── cache/                   # generated artifacts — never committed
```

The model has **two hierarchies and one axis**. `availability` is the join
between the two trees; Domain classifies members of both; Actors and Business
Rules attach across everything.

## Scopes

A **scope** is one id naming where something is reachable: an undivided
Interface, or an Experience.

```yaml
availability: [customer-web::storefront, customer-mobile::storefront]
```

An Experience belongs to exactly one Interface, so its id already names that
Interface. A scope either resolves in the tree or it does not — there is no
nested record, no `experiences` sub-list, and no rule about when an Experience
is required, because the folder answers all three.

One **exact context** is one scope id:

```yaml
context: customer-web::storefront
```

An Interface holds either `screens/` or `experiences/`, never both. Otherwise
the scope id `customer-web` would be ambiguous between the whole Interface and
the part of it with no Experience.

## Universal conventions

- **The committed shell is complete.** `README.md` and `.gitignore` are
  required alongside the semantic files. `.gitignore` must ignore `build/`
  and `cache/`; those generated directories are never part of the committed
  model.

- **Compact and expanded are exclusive.** `<id>.md` and `<id>/<type>.md` may
  not coexist. An expanded entity must own at least one asset or child entity;
  otherwise it is needless structure and must be compacted. A compact entity
  has no asset or child namespace.

- **ID = the logical path from the collection root.** Behavior-tree ids (Capability,
  Journey, both Scenario types) and cross-cutting ids (Actor, Domain, Business
  Rule) are the bare file or folder name and are globally unique within their
  collection. Surface-tree ids (Interface, Experience, Screen) carry the path
  that distinguishes them, joined by `::`:

  ```
  reader-web
  reader-web::personal-library
  reader-web::personal-library::unread-library
  ```

  Each segment is lowercase kebab-case, `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never
  write `id:` in frontmatter — the filesystem is the id authority. The one
  exception is `product.md`, whose `id:` names the Product Model (it may differ
  from the repo name) and is limited to 64 characters. Compacting or expanding
  an entity never changes this logical path or id.

  Surface names repeat across Interfaces on purpose: `personal-library` on web
  and on mobile pursue the same goal and are different entities. Two entities of
  the same kind sharing a path suffix below their Interface are **counterparts**
  — the same thing on two surfaces. Nothing has to declare that; the path
  already says it.

- **The path owns every parent relation.** An Experience never writes
  `interfaces:`, a Capability Scenario never writes `capability:`, a Journey
  Scenario never writes `journey:`, and a Screen never writes `availability:`.
  One authority instead of two that can disagree, and reparenting becomes a
  `git mv` that reads correctly in a pull request.
- **Assets expand an entity.** Authored assets sit beside `<type>.md` in the
  expanded entity folder. Files under its reserved `implementation/`
  subdirectory describe this repository's realization instead. Typed child
  directories (`experiences/`, `screens/`, and `scenarios/`) are structural,
  not assets; any other nested directory is invalid. Plain asset files need no
  declaration. Optional `assets:` frontmatter annotates files already present:

  ```yaml
  assets:
    - file: mockup.svg
      title: Approved empty state
      state: Empty                 # Screens only; resolves to an H3 Product state
  ```

  `file` is relative to the expanded entity folder and cannot escape it.
  Metadata entries are unique and must name an existing asset. `title` is
  optional. `state` is valid only on a Screen and must name one of that Screen's
  `## Product states`. Unlisted assets remain valid so external tools can write
  captures without editing BusinessLens frontmatter.
- **H1 = title/name.** The first `# Heading` in the body is the entity's
  title (actors and domains call it `name`) and is the file's only H1. Lead and
  section-body Markdown fragments cannot contain another H1 or H2; an H2 begins
  a new section instead.
- **Lead paragraph = description.** Prose between the H1 and the first `##`
  heading is the description for actors, domains, experiences, and the product.
  Journeys and both Scenario types instead use the required structured sections
  specified below and must not carry lead prose.
- **Frontmatter = relations and navigation only.** Never prose.
- **Intent and Goal = recognized prose sections.** `## Intent` explains why the
  product or entity exists and which outcome it protects. `## Goal` states the
  stable Actor intent of a Journey. Both are structured prose, not separate
  entities.
- **Structured sections are unambiguous.** A recognized H2 may appear only once.
  Journey-only sections (`## Goal`, `## Success criterion`) are invalid on both
  Scenario types, and Scenario-only sections (`## Trigger`, `## Steps`,
  `## Decision points`, `## Outcome`, `## Edge cases`) are invalid on Journeys.
  Unrecognized H2 sections are supporting content and retain their heading and
  body through report export and expansion.
- **Structured list items are single-line.** Every item in `## Steps`,
  `## Edge cases`, `## Information presented`, and `## Available actions` must
  occupy one physical line. Prose and continuation lines are invalid because
  they cannot be represented as report list items.
- **Set-valued lists are unique.** Product `tags` and every frontmatter relation
  list contain no duplicate value. Ordered content lists such as Steps and
  Coverage prose are not relation sets and may repeat when the meaning calls
  for it.
- Scenario IDs are globally unique across every `scenarios/` folder.

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
- `state` is optional and **valid only on a Screen**. It names one of that
  Screen's `## Product states` H3 titles, case-insensitively, and says which
  state the artefact depicts. Nowhere else has a state set to resolve against.

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

One Screen commonly collects several captures of the same view — one per
Product state, sometimes doubled for light and dark. Without `state` they arrive
as a flat list distinguishable only by free-text title; with it, each capture is
placed beside the state it shows. Themes are deliberately not Product states, so
a light and a dark capture of one state are two references sharing one `state`.

References connect the self-contained Product Model to material maintained
outside it. A model may contain no references at any Coverage status.
The deterministic CLI does not copy, download, generate, execute, or assess
referenced content. BusinessLens skills may follow curated References as leads,
but the artifact remains evidence to assess rather than proof to trust.

## Entity files

### `config.yaml`

```yaml
schema: 5                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. Schema 5 is the only supported folder format.

### `product.md` or `product/product.md`

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
sections are preserved as ordered `{ heading, content }` supporting sections so
a report can be expanded without silently losing authored context.

The Product frontmatter may also carry portable identity and attribution used
by every report host. `summary` is a single-line short description (400
characters maximum), `category` is a lowercase kebab-case classification,
`authors` is a list of `{ name, url? }` records, and `license` is an SPDX
license identifier. The H1 remains the Product title and the lead prose remains
its full description.

The compact form is `.businesslens/product.md`. Adding a Product logo expands
it to `.businesslens/product/product.md`, with the identity asset at
`.businesslens/product/logo.svg`.

The Product may have one visual identity asset, `logo.svg`.
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

### `actors/<id>.md` or `actors/<id>/actor.md`

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

An external system is an Actor only when it **initiates** interaction with the
Product. A system the Product calls out to is a dependency of the Capability
that calls it: it has no goal inside the Product, no privilege to grant, and no
surface the Product must keep stable for it. Direction decides, not ownership —
the same third party can be a dependency in one direction and an Actor in the
other when it also calls back. See [Outbound dependencies](#outbound-dependencies).

### `interfaces/<id>.md` or `interfaces/<id>/interface.md`

An Interface is a supported interaction form through which Actors access the
Product and for which product behavior can be independently required and
verified. A customer web application, mobile application, operator CLI, partner
API, and inbound webhook endpoint are Interfaces. Frameworks, internal adapters,
and private component APIs are not.

An Interface is **inbound**: something arrives at the Product through it. An
outbound connection the Product opens to a third party is not an Interface,
even when the integration is stable, versioned, and vendor-supported.

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

### Outbound dependencies

An external system the Product calls — a syndicated feed it polls, a payment
processor it charges, a mail provider it sends through, a model API it queries —
is not an Actor and gets no Interface.

Model it where its result is observed:

- the Capability that makes the call names the external system in its prose and
  states what triggers the call;
- its `availability` names the Interfaces where an Actor observes the outcome,
  never a synthetic integration surface;
- product-significant failure behavior — what the Actor sees when the external
  system is unavailable, slow, or wrong — is a Capability Scenario;
- the provider's published contract attaches as a `references` entry with
  `kind: spec` or `kind: doc` and `role: context`.

Direction decides. When the same third party also calls the Product — a webhook,
callback, or push subscription — that inbound surface is an Interface and the
third party is its Actor. A feed provider the Product polls is a dependency; a
feed provider that pushes updates to the Product is an Actor.

There is no external-system entity. An outbound dependency shared by several
Capabilities is described by each Capability that depends on it.

### `interfaces/<interface-id>/experiences/<id>.md` or `<id>/experience.md`

An Experience is a coherent context of Product use with a stable audience,
access boundary, and capability boundary. **It belongs to exactly one
Interface** — the one whose folder holds it. Experiences are optional: create
them only when named contexts distinguish meaningful Product scope inside an
Interface.

The same context on two Interfaces is two Experiences, not one shared entity.
They differ in screens, reach and affordances even when they pursue the same
goal, and one file cannot describe both without hiding where they diverge.
Give them the same file or folder name and they are counterparts by
construction.

```markdown
---
actors: [store-admin]
access: restricted              # public | authenticated | restricted
entryPoints:
  - admin-web: /admin
---

# Administration

Where authorized operators manage the store and its orders.

## Capability boundary

Supports store operations. It does not expose a shopper's private account.
```

`actors` is a non-empty ID list and every Experience Actor must be supported by
the owning Interface. `access` is required. Optional `entryPoints` key the
owning Interface only. H1, lead description, and `## Capability boundary` are
required. There is no `exit` field and no `interfaces` field — the path names
the Interface. An Interface with one undivided usage context does not need a
ceremonial Experience.

Experiences form an exhaustive, potentially overlapping cover of the Interface
that holds them. The union of their Actors must equal that Interface's Actor
list, so no Interface Actor becomes unreachable when Screens move under
Experiences.

An optional ordered `screens:` list names this Experience's own Screen ids
and declares **reading order only** — reachability stays with the tree. Entries
must resolve to children and be unique; unlisted children sort after,
alphabetically. The same field is available on `interface.md` for an Interface
that holds Screens directly.

### Availability

Capabilities and Capability Scenarios declare `availability`: a unique,
non-empty list of scope ids.

```yaml
availability: [operator-cli, customer-web::storefront, customer-mobile::storefront]
```

Availability states intended Product scope, never implementation status.

A **Screen does not declare availability** — it sits inside the scope that owns
it, and the path is the answer. Journeys do not declare availability either.
Capability Scenarios select from their one Capability's scopes. Journey
Scenarios correlate one exact context per flow stage through explicit routes,
because one route may deliberately move between surfaces. Business Rule targets
use the same single-scope `context:` shape.

### `domains/<id>.md` or `domains/<id>/domain.md`

A Domain is a coherent region of the Product's subject matter — its own
vocabulary and its own invariants. It is not code architecture, not Journey
ownership, and not a folder for Capabilities that had nowhere else to go.

```markdown
---
colorSlot: 3
---

# Ordering

Everything between a full cart and a fulfilled order.

## Boundary

Owns cart contents, order state, and the transition between them. It does not
own catalog information, payment instruments, or fulfilment logistics.
```

Optional `colorSlot` and `references` frontmatter. H1 = name, lead paragraph =
description. `## Boundary` states what the region covers and what it explicitly
does not; it is what makes a Domain checkable rather than a label. The entire
Domain collection is optional.

**Domain is an axis, not a level.** It classifies members of both the surface
tree and the behavior tree, so it neither contains nor is contained by anything.
`domain` on a Capability is the only *authored* Domain edge in the model; every
other Domain relation is derived. A Screen, Experience or Journey is about the
Domains its Capabilities are about, and computing that is more reliable than
asking an author to restate it — a second authority can disagree with the first.

`domain` is optional and single. A Capability about two subject regions means
either a `## Boundary` is wrong or the Capability should split.

### `capabilities/<id>.md` or `capabilities/<id>/capability.md`

A Capability is a stable ability of the Product. It has no necessary beginning
or end and may support several Journeys, Experiences, Screens, and Interfaces.
Capabilities and their observable Capability Scenarios are the behavioral core
of the model; Journey composition is optional.

```markdown
---
domain: ordering                 # optional
availability: [customer-web::storefront]
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
permissions, availability, or Business Rules, split them into Capabilities. For
example, `manage-repositories` is too broad when its cases are actually create,
configure, archive, and delete behaviors with distinct contracts. Splitting it
does not create a need for a Domain: those four Capabilities were already about
the Repositories subject region before the split, and a Domain that exists only
to re-gather them is a folder, not a region.

### `business-rules/<id>.md` or `business-rules/<id>/business-rule.md`

A Business Rule is a durable constraint or policy that may apply across
multiple behaviors.

```markdown
---
appliesTo:
  - type: capability
    id: checkout
    contexts:
      - context: customer-web::storefront
  - type: journey
    id: browse-and-buy
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

The lead paragraph is the rule statement. `appliesTo` is a required non-empty
list of typed targets. An entity target uses `type` = `capability`,
`capability-scenario`, `journey`, or `journey-scenario`, requires `id`, and may
use a non-empty `contexts` list to narrow that target. Without `contexts`, the
Rule applies to all supported contexts of the target. A direct context target
uses `type: context` plus one `context` scope id instead of `id`.

Targets are additive: the Rule governs their union. A context on an entity
target must be within that target's derived availability. Target values and
exact contexts are unique. Do not target both a Capability and one of its
Capability Scenarios, or both a Journey and one of its Journey Scenarios; the
ancestor already governs the child. Domains remain navigation-only, so Rule
Domain backlinks are derived through targeted behavior rather than authored.
Business Rule owns these relations; consumers derive every backlink.

### `.../screens/<id>.md` or `.../screens/<id>/screen.md`

A Screen is a meaningful user-visible view where product information or
capabilities are exposed. It is platform-neutral: it need not be a web page,
have a URL, fill a device display, or correspond to one implementation module.
The whole `screens/` collection is optional so non-visual products remain valid.

```markdown
---
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

`capabilities` needs at least one item. A Screen has no `availability` field:
it reaches exactly the scope whose folder holds it, and every referenced
Capability must declare that scope.
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
stage whose Capability appears in the Screen's `capabilities` and a route
context for that stage that intersects the Screen's availability.

Only product-significant states belong here: a state changes what the user
understands, can do, or achieves. Empty, unavailable, unauthorized,
validation-failure, and completed states commonly qualify. Themes, viewport
variants, hover states, skeletons, component variants, and screenshot baselines
do not. Model-owned visuals expand the Screen and sit beside `screen.md`;
generated captures live under its `implementation/` directory. External or
separately maintained visuals attach as `kind: visual` References, whose role
distinguishes curated intent from implementation or supporting context.

A Screen lives in one scope. The same view on another surface is another Screen
with the same name — counterparts, distinguished by their path. They may
share purpose, information and actions, and stating each one separately is what
makes a divergence between them visible instead of silent.

Screens do not author a sitemap or transition graph. A screen inventory is a
generated projection grouped by Interface and Experience; observable movement
belongs in Capability Scenarios and Journey Scenarios. XML sitemaps remain
implementation artifacts, and UX sitemaps may be external `doc` or `visual`
references.

### `journeys/<id>.md` or `journeys/<id>/journey.md`

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

`actors` is a non-empty unique list of the Actors who pursue the goal, not every
system that participates in its implementation. A Journey has no lead prose;
its first content after the H1 is an H2 section.

`## Goal` states the stable Actor intent. `## Success criterion` states how an
achieved attempt is recognized without prescribing one route. `references` is
optional. Consumers derive Domains and Interface/Experience contexts from
Journey Scenario flow entries. A Journey has no `entryPoints`; concrete Product
routes remain on Interfaces, Experiences, and Screens.

A consumer that presents a Journey entry route starts with the first flow stage
of each achieved Journey Scenario route, then resolves that exact Interface or
Experience entry point. This is derived navigation, not authored Journey data.

Consumers derive the Journey's primary Capability set from achieved Scenarios
and mark Capabilities observed only in not-achieved Scenarios as failure-only.
These are coverage projections, not authored Journey meaning or proof that
mapping is exhaustive.

A Journey has no `availability`, Trigger, Steps, decisions, concrete Outcome,
authored Capability list, or authored Scenario list. At least one Journey
Scenario must name it with `result: achieved` and exercise at least two distinct
Capabilities. Every Journey Actor must appear in at least one achieved Scenario.
This is Journey acceptance coverage, not the source of its identity.

A Journey is established behavior only when repository evidence supports a
deliberate handoff, orchestration, shared state, navigation, command, or
cross-Interface transition toward its Actor outcome. A wizard can establish a
Journey but is not required. A merely plausible sequence of independent
Product actions is not a Journey. The number of Journey Scenario variations
does not define it; one achieved variation provides valid coverage. A goal with
no achieved multi-Capability flow belongs to Capability behavior or remains
unsupported Journey intent. Planned Journeys may record approved intent before
implementation but must meet the same structural distinctions.

### `capabilities/<capability-id>/scenarios/<id>.md` or `<id>/capability-scenario.md`

A Capability Scenario is one concrete observable acceptance case for exactly
one Capability. It describes local ability behavior rather than an end-to-end
Journey goal.

```markdown
---
kind: validation
actors: [shopper]
availability: [customer-web::storefront, customer-mobile::storefront]
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

Both Scenario types have no lead prose and require non-empty `## Trigger`,
`## Steps`, and `## Outcome` sections. `## Steps` is an ordered list with at
least one single-line item. `## Edge cases` is an optional non-empty bullet list
whose items are also single-line.

`## Decision points` is optional. Each decision uses an H3 title, a non-empty
question paragraph, then at least two bullet branches. Each branch uses
`condition → outcome` with the Unicode arrow or `condition -> outcome` with
ASCII characters. Its branches stay within and converge on that Scenario's one
observable outcome. A branch with a materially different outcome belongs in a
separate Scenario of the same type. Decision points remain embedded rather than
becoming standalone entities.

### `journeys/<journey-id>/scenarios/<id>.md` or `<id>/journey-scenario.md`

A Journey Scenario is one concrete end-to-end variation of exactly one Journey.
It begins with the Journey Actor's Goal and ends with that goal achieved or not
achieved. It verifies Capability composition and handoffs rather than replacing
local Capability Scenarios.

```markdown
---
kind: primary
actors: [shopper]
result: achieved
flow:
  - id: discover
    capability: catalog-browsing
    operation: Find and select an available product
  - id: checkout
    capability: checkout
    operation: Submit checkout and confirm the order
routes:
  - id: web
    contexts:
      - stage: discover
        context: customer-web::storefront
      - stage: checkout
        context: customer-web::storefront
  - id: mobile
    contexts:
      - stage: discover
        context: customer-mobile::storefront
      - stage: checkout
        context: customer-mobile::storefront
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
are orthogonal. `actors`, `flow`, and `routes` are non-empty, and the Actors
must include at least one Actor from the Journey.

Each ordered flow entry has a locally unique lowercase kebab-case `id`, names
exactly one existing Capability, and carries a required single-line `operation`.
It does not declare availability.

Each route has a locally unique lowercase kebab-case `id` and one context for
every flow stage, referenced by `stage`. It cannot omit a stage, repeat one, or
name an unknown stage. Every context must be declared by that stage's
Capability. The route is the correlation authority: web and mobile lanes do not
imply cross-device transitions, while an intentional cross-Interface handoff is
written directly into one route.

Every route context must permit at least one Scenario Actor, and every Scenario
Actor must be supported by at least one route context. The first context of
every route must permit an Actor who is both a Scenario Actor and an Actor of
the Journey. This does not require every Actor to use every stage in a
cross-Interface route.

The Journey Scenario owns Capability selection and order. Capability flow
entries may repeat or stop, and all routes share that sequence and terminal
Outcome. An achieved Journey Scenario must use at least two distinct
Capabilities. A not-achieved Journey Scenario may stop after one Capability,
but its Outcome must state the Journey-level reason the goal was not achieved.

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

Add equivalent routes when only the supported context changes. Split Journey
Scenarios when the Capability sequence, observable behavior, or Journey-level
Outcome changes. Business Rules own Scenario scope, so Journey Scenarios do not
duplicate Rule IDs.

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

Coverage accepts one H1 and its lead rationale only. It has no H2 sections;
put structured assessment data in the defined frontmatter fields.

`status` describes **model breadth**, never implementation or verification:

- `draft` — the model itself is still being authored or reviewed.
- `partial` — the model is useful and has known unmapped areas.
- `complete` — the intended product scope is modeled.

A complete model has at least one Capability. Every exact Capability
availability scope is selected by at least one Capability Scenario, and every
Journey Actor appears in at least one achieved Journey Scenario. Draft and
partial models warn for uncovered Capability scopes; public Blueprints require
the same complete behavioral coverage regardless of Coverage status.

All three statuses may be exported. A complete model may describe planned,
implemented, or mixed behavior and may contain zero references. Proposing it as a
catalog Blueprint is a separate, explicit action; public listing remains an
administrator decision.

## Serialization

`build/` and `cache/` hold generated artifacts, and the Product Report that
`blueprint export` writes into them is defined by [`report.md`](./report.md) —
including the portable projection, the validation the report schema applies on
top of the rules above, and the `open`/`pull` expansion round trip.
