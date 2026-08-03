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
├── experiences/<experience-id>.md
├── screens/<screen-id>.md
├── domains/<domain-id>.md   # optional grouping
├── capabilities/<capability-id>.md
├── business-rules/<rule-id>.md
├── journeys/<journey-id>/journey.md
├── journeys/<journey-id>/scenarios/<scenario-id>.md
├── README.md                # canonical agent orientation
├── .gitignore               # generated paths only
├── build/                   # generated Product Report — never committed
└── cache/                   # generated artifacts — never committed
```

## Universal conventions

- **ID = filename stem.** An entity's id is its filename without `.md`
  (journeys: the directory name). IDs are lowercase kebab-case:
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never write `id:` in frontmatter — the
  filesystem is the id authority. The one exception is `product.md`, whose
  `id:` names the Product Model (it may differ from the repo name) and is
  limited to 64 characters for portability across BusinessLens consumers.
- **H1 = title/name.** The first `# Heading` in the body is the entity's
  title (actors and domains call it `name`).
- **Lead paragraph = description/summary.** Prose between the H1 and the first
  `##` heading is the description for actors, domains, experiences, and the
  product, or the summary for journeys. Later sections provide supporting
  context except where a structured section is required below.
- **Frontmatter = relations and navigation only.** Never prose.
- **Intent = a recognized prose section.** `## Intent` explains why the
  product or entity exists and which outcome it protects. Intent is structured
  prose, not a separate entity.
- Scenario ids must be unique across the whole model, not just within their
  journey.

## References

`references` is an optional extension on every semantic entity: Product,
Actor, Interface, Experience, Screen, Domain, Capability, Journey, Scenario,
and Business Rule. It is not accepted in `config.yaml`, `coverage.md`, or
`taxonomies.yaml`.

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
BusinessLens does not copy, download, generate, execute, or assess referenced
content.

## Entity files

### `config.yaml`

```yaml
schema: 3                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. Schema 3 is the only supported folder format.
Any other schema number fails explicitly; old shapes are not inferred,
normalized, migrated, or accepted.

### `product.md`

```markdown
---
id: acme-shop
tags: [commerce]
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

### `taxonomies.yaml`

```yaml
scenarioKinds:
  - id: primary
    name: Primary
    description: Expected path through a user goal.
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
Interfaces.

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
There is no `exit` field.

### Availability

Capabilities, Journeys, Screens, Scenarios, and Business Rules use one exact
Interface–Experience relation shape:

```yaml
availability:
  - interface: customer-web
    experiences: [storefront, account-management]
  - interface: customer-mobile
    experiences: [storefront]
```

Each record creates only the listed Interface–Experience pairs. `interface`
must name one Interface, `experiences` must be a non-empty unique list, and
every Experience must declare that Interface. Duplicate Interfaces or pairs are
invalid. Availability states intended Product scope, never implementation
status.

### `domains/<id>.md`

Optional `colorSlot: 3` and `references` frontmatter. H1 = name, lead paragraph =
description. The entire Domain collection is optional. A Domain groups related
Capabilities for product navigation; it is not code architecture or Journey
ownership.

### `capabilities/<id>.md`

A Capability is a stable ability of the Product. It has no necessary beginning
or end and may support several Journeys, Experiences, Screens, and Interfaces.

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

`availability` is required and needs at least one pair. `domain` is optional
and, when present, names exactly one Domain. Actors are expressed by Journeys
and Actor-bound Experiences. Business Rules own their scope, so Capability
files do not duplicate Rule IDs.

### `business-rules/<id>.md`

A Business Rule is a durable constraint or policy that may apply across
multiple behaviors.

```markdown
---
domains: [ordering]
capabilities: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
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

The lead paragraph is the rule statement. `domains`, `capabilities`,
`journeys`, and `scenarios` are relation lists. `availability` optionally limits
the rule to exact Interface–Experience pairs. A rule must relate to at least one
Domain, Capability, Journey, Scenario, or availability pair. Business Rule owns
these relations; consumers derive backlinks.

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
scenarios: [browse-catalog]
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

`availability` and `capabilities` each need at least one item. Every Screen pair
must also be declared by every referenced Capability. `scenarios` and
`entryPoints` are optional; entry-point keys must name an Interface in the
Screen's availability. The H1, lead description,
`## Information presented` bullet list, and `## Capability boundary` prose are
required. `## Available actions` is optional but, when present, must contain a
bullet list. `## Product states` is optional; each state is an H3 name followed
by non-empty prose. States remain embedded in the Screen report entity.

Only product-significant states belong here: a state changes what the user
understands, can do, or achieves. Empty, unavailable, unauthorized,
validation-failure, and completed states commonly qualify. Themes, viewport
variants, hover states, skeletons, component variants, and screenshot baselines
do not. Visual artifacts stay external and may be attached with
`kind: visual`; their role distinguishes curated intent from implementation or
supporting context.

One Screen may relate to multiple Interfaces and Experiences when its product
semantics are shared. Separate Screens are warranted only when purpose,
information, actions, meaningful states, or capability boundaries differ.

Screens do not author a sitemap or transition graph. A screen inventory is a
generated projection grouped by Interface and Experience; goal-oriented
movement belongs in Journeys and Scenarios. XML sitemaps remain implementation
artifacts, and UX sitemaps may be external `doc` or `visual` references.

### `journeys/<id>/journey.md`

```markdown
---
actors: [shopper]
capabilities: [checkout]
availability:
  - interface: customer-web
    experiences: [storefront]
entryPoints:
  - customer-web: /checkout
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Browse and buy

A shopper finds a product and completes checkout.
```

Every Journey needs at least one Actor, Capability, availability pair, and
Scenario. Every referenced Capability must declare every Journey availability
pair. A Journey has no Domain; consumers derive its Domains from its
Capabilities. `entryPoints` and `references` are optional, and entry-point keys
must name an Interface in the Journey's availability.

### `journeys/<jid>/scenarios/<id>.md`

```markdown
---
kind: primary
availability:
  - interface: customer-web
    experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Guest completes checkout

## Trigger

Guest presses "Place order" with a non-empty cart.

## Steps

1. System validates cart stock
2. Payment intent is created
3. Order is persisted

## Decision points

### Stock result

Can every requested item still be fulfilled?

- available → continue to payment
- unavailable → preserve the cart and show the affected items

## Outcome

Order is stored and a confirmation is shown.

## Edge cases

- Payment declined → cart preserved, error shown
```

`kind` must exist in `taxonomies.yaml`. `availability` is optional and, when
present, must be a subset of the parent Journey's pairs; omission means the
Scenario applies to every Journey pair. Business Rules own Scenario scope, so
Scenarios do not duplicate Rule IDs. `## Trigger` and `## Outcome` are
paragraphs, `## Steps` is an ordered list (≥1 item), and `## Edge cases` is an
optional bullet list.

`## Decision points` is optional. Each decision uses an H3 title, a non-empty
question paragraph, then at least two bullet branches. Each branch uses
`condition → outcome` with the Unicode arrow or `condition -> outcome` with
ASCII characters. Decision points are embedded in the Scenario report entity,
not promoted to standalone files. `journeyId` is derived from the path.

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
- `build/report.json` — portable Product Report v6 generated by
  `blueprint export` (`build` is refused, not aliased).

The map inventory is emitted to stdout and writes no cache file. All of
`build/` and `cache/` are gitignored by model-creation workflows. Generated
files are derived artifacts and must not be edited or committed.

## Portable report and expansion

`build/report.json` is a Product Report with `schemaVersion: "6.0.0"`. It
contains the product entities, relationships, intent, portable references,
supporting content, and coverage needed to reconstruct the model.

Compilation produces a `workspace` reference profile. As written by
`blueprint export`, a report carries the **portable** reference profile: it
removes every `kind: code` reference, every `role: implementation` reference,
every repository-relative reference, every repository-relative entry point,
and `coverage.sourceAreas`. It also contains no repository URL, branch, commit,
catalog listing state, pricing, or entitlement data. A report that has been
through `export` is a Blueprint.

The report schema accepts only content that can expand into canonical entity
Markdown: titles and list items are single-line, required descriptions and
behavior sections are non-empty, availability pairs and other
relationships resolve to existing entities, and Interface/Capability
consistency holds. Product Report v6 is the only accepted report version.
Historical reports are rejected rather than normalized.
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

`blueprint export` writes the portable, source-free report. Contribution applies
the same idempotent projection before opening a public pull request. `open` and
`pull` project imported content to the portable profile before expansion, so
source navigation is never transplanted into the receiving repository.

The inverse command is:

```bash
npx businesslens@latest blueprint open ./report.json
```

`open` validates the report and expands it into canonical Markdown/YAML under
`.businesslens/`. `npx businesslens@latest blueprint pull <blueprint-name>` anonymously
retrieves the current public Blueprint for that canonical name and invokes the
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
