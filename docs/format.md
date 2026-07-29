---
title: Format contract
description: The contract for the git-tracked product model — folder layout, universal conventions, entities, and codeRefs.
section: open-source
group: Reference
order: 21
---

# The `.businesslens/` Format

This document is the contract for the BusinessLens PDD folder: the git-tracked
product model that lives inside a repository. Everything the public CLI validates
is defined here. The model is **evidence-backed product truth**: every
behavioral claim (journeys and scenarios) must cite tracked code, and a green
`validate` means the model and the code agree.

Planning uses the same file: describe intended behavior by editing the model on
a branch. Until the implementation lands and evidence is attached, `validate`
reports new, unevidenced journeys and scenarios as missing `codeRefs`.
`businesslens-verify` derives the complete worklist from the model diff too, so
changed higher-level contracts and deleted behavior are not invisible merely
because they need no new evidence field. Git is the change model: branches
hold plans, pull requests review them, history archives them. The one
exception is a brand-new product with no code at all, where
`coverage.md` `status: draft` marks the whole model as planned (see
[coverage](#coveragemd)). Draft models are valid Product Model sources:
they may build a Product Report and be reported to the Platform even though missing evidence remains visible as
warnings. The technical *how* of a change (specs, designs, task lists) still
belongs to your SDD tool of choice and is referenced via `links`.

## Folder layout

```
.businesslens/
├── config.yaml              # tool config (committed)
├── product.md               # product manifest (committed)
├── taxonomies.yaml          # scenario kinds (committed)
├── coverage.md              # coverage assessment (committed)
├── actors/<actor-id>.md
├── domains/<domain-id>.md
├── experiences/<experience-id>.md
├── features/<feature-id>.md
├── business-rules/<rule-id>.md
├── journeys/<journey-id>/journey.md
├── journeys/<journey-id>/scenarios/<scenario-id>.md
├── .gitignore               # written by businesslens-init
├── build/                   # generated Product Report — never committed
└── cache/                   # generated artifacts — never committed
```

## Universal conventions

- **ID = filename stem.** An entity's id is its filename without `.md`
  (journeys: the directory name). IDs are lowercase kebab-case:
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never write `id:` in frontmatter — the
  filesystem is the id authority. The one exception is `product.md`, whose
  `id:` names the Product Model (it may differ from the repo name) and is
  limited to 64 characters because it is also the default Platform Project
  slug.
- **H1 = title/name.** The first `# Heading` in the body is the entity's
  title (actors and domains call it `name`).
- **Lead paragraph = description/summary.** Prose between the H1 and the first
  `##` heading is the description for actors, domains, experiences, and the
  product, or the summary for journeys. Later sections provide supporting
  context except where a structured section is required below.
- **Frontmatter = relations and evidence only.** Never prose.
- **Intent = a recognized prose section.** `## Intent` explains why the
  product or entity exists and which outcome it protects. Intent is structured
  prose, not a separate entity.
- Scenario ids must be unique across the whole model, not just within their
  journey.

## codeRefs

Compact strings, parsed deterministically:

```yaml
codeRefs:
  - src/checkout/handler.ts#CheckoutHandler.submit   # path + symbol
  - src/routes/cart.ts:42-88                          # path + line range
  - server/api/orders.post.ts                         # path only
```

Grammar: `path[#symbol][:start[-end]]`. The line suffix is the last `:` whose
remainder matches `^\d+(-\d+)?$`; the symbol is everything after the first `#`
of what remains. `validate` checks every path against `git ls-files` — a
codeRef must point at a tracked file. `codeRefs` are accepted and preserved on
every entity. Journeys and scenarios require at least one because they make
behavioral claims; actors, experiences, domains, features, and business rules
may carry evidence when their boundary is directly represented in code.

While `coverage.md` has `status: draft` (a planned, not-yet-implemented
model), a journey or scenario without `codeRefs` is a **warning** instead of
an error. A codeRef that is present must always point at a tracked file —
planned behavior carries no evidence rather than invented evidence.

## links (the PDD → SDD bridge)

Optional on any entity:

```yaml
links:
  - rel: spec        # spec | proposal | doc | adr
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

Links connect model entities to prescriptive documents (OpenSpec specs, design
docs, ADRs). `validate` warns when a local href does not exist.

## Entity files

### `config.yaml`

```yaml
schema: 1                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

The optional publishing endpoint is deliberately restricted because
`BUSINESSLENS_API_KEY` is sent to it:

```yaml
platform:
  url: https://app.businesslens.io
```

The public CLI accepts only the official `https://app.businesslens.io` origin
or a literal loopback development host: `localhost`, any `127.x.x.x` address,
or `::1`. Loopback endpoints may use HTTP and any port, for example
`http://localhost:3000`. Paths, query strings, fragments, and embedded
credentials are not allowed. Omit `platform` to use the official origin.

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

No required frontmatter. H1 = name, lead paragraph = description. Optional
`codeRefs` provide direct evidence for the actor boundary.

### `domains/<id>.md`

Optional `colorSlot: 3` and `codeRefs` frontmatter. H1 = name, lead paragraph =
description.

### `features/<id>.md`

A Feature is a stable product capability. It is more specific than an
Experience boundary and more durable than one Journey sequence.

```markdown
---
domain: ordering
actors: [shopper]
experiences: [storefront]
businessRules: [stock-must-be-available]
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Let a shopper complete a purchase without losing cart state on a recoverable
failure.
```

`domain` is one Domain ID. `actors`, `experiences`, and `businessRules` are
lists of IDs. A Feature needs at least one Experience.

### `business-rules/<id>.md`

A Business Rule is a durable constraint or policy that may apply across
multiple behaviors.

```markdown
---
domains: [ordering]
features: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
codeRefs:
  - src/services/orders.ts#OrderService.submit
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

The lead paragraph is the rule statement. `domains`, `features`, `journeys`,
and `scenarios` are relation lists. A rule must relate to at least one Domain,
Feature, Journey, or Scenario.

### `experiences/<id>.md`

An experience is a surface of the product with a stable audience and
capability boundary (web console, CLI, admin area, public site, playground…).

```markdown
---
actors: [shopper, guest]
access: public                     # public | authenticated | restricted
entryPoints:
  - web: /
exit: "Order confirmed and receipt emailed"
---

# Storefront

Where shoppers browse the catalog and buy products.

## Capability boundary

Anonymous browsing; checkout requires a session. No administrative actions.
```

`actors` contains actor IDs, `access` is the access mode, `exit` describes the
exit contract, and `## Capability boundary` defines the surface's supported
capabilities. Each `entryPoints` item is a compact `type: path` map.

### `journeys/<id>/journey.md`

```markdown
---
domain: ordering
actors: [shopper]
experiences: [storefront]
features: [checkout]
entryPoints:
  - web: src/routes/storefront.ts
  - api: src/routes/api/orders.ts
codeRefs:
  - src/services/orders.ts#OrderService
---

# Browse and buy

A shopper finds a product and completes checkout.
```

Compilation: `domain` → `domainId`, `actors` → `actorIds`, `experiences` →
`experienceIds`, and `features` → `featureIds`. Every journey must belong to
at least one experience and feature, and have at least one actor and one
scenario. A non-draft journey also needs at least one codeRef.

### `journeys/<jid>/scenarios/<id>.md`

```markdown
---
kind: primary
businessRules: [stock-must-be-available]
codeRefs:
  - src/services/orders.ts#OrderService.submit
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

`kind` must exist in `taxonomies.yaml`. `businessRules` is a list of Business
Rule IDs. `## Trigger` and `## Outcome` are paragraphs, `## Steps` is an
ordered list (≥1 item), and `## Edge cases` is an optional bullet list.

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
`limitations`) and the prose rationale are authored by the agent from
repository evidence. Entity and file counts in the portable output are
computed by `build` from the model and the tracked file list — they are never
authored. The validator checks the authored entities and relationships; it
does not compile or publish the model.

`status: draft` marks a **planned model**: a greenfield product authored before
any implementation exists. While draft, missing journey and scenario
`codeRefs` validate as warnings instead of errors. Draft, partial, and complete
models may all build and publish. Publishing reports a private immutable
Product Model Version; creating a Blueprint and selecting a public Blueprint
revision are separate Platform actions. Once implementation is
verified and evidence is attached, set status to `partial` or `complete`; from
then on evidence is strictly required.

## Generated files

- `cache/inventory.json` — repository inventory generated by the
  `businesslens-init` skill's bundled inventory script.
- `cache/build.json` — metadata for the most recent portable build.
- `build/report.json` — source-free Product Report v4 generated by `build`.
  `publish` wraps it in a separate target-and-Git-provenance envelope.

All of `build/` and `cache/` are gitignored by `businesslens-init`. Generated
files are derived artifacts and must not be edited or committed.

## Portable report and expansion

`build/report.json` is a Product Report with `schemaVersion: "4.0.0"`. It
contains the product entities, relationships, intent, links, supporting
content, evidence, and coverage needed to reconstruct the model. It does not
contain repository URL, branch, commit, workspace, Project, Track, Blueprint,
Blueprint revision, pricing, or entitlement data.

The report schema accepts only content that can expand into canonical entity
Markdown: titles and list items are single-line, required descriptions and
behavior sections are non-empty, standard mapped counts equal the entities
carrying `codeRefs`, and relationships resolve to existing entities.
Historical v4 reports may retain older coverage metric names; any standard
entity count or mapped key that is present must still match the report.
New non-draft reports produced from a Product Model have journey and scenario
evidence because `validate` and `build` enforce that source rule.

The inverse command is:

```bash
npx businesslens open ./report.json
```

`open` validates the report and expands it into canonical Markdown/YAML under
`.businesslens/`. It refuses a non-empty target by default. The semantic
round-trip guarantee is:

```text
report A → open → .businesslens/ → build → report B
```

After normalizing `generatedAt` and generator version, A and B describe the
same product. Original whitespace, comments, YAML key order, and formatting are
not preserved. Local linked SDD files are referenced but never created or
overwritten by `open`.
