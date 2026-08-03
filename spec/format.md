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
still belongs to your SDD tool of choice and is referenced via `links`.

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
of what remains. `lint` checks every present path against `git ls-files` — a
codeRef must point at a tracked file. `codeRefs` are optional navigational
bookmarks accepted and preserved on every entity. They help a reader start an
inspection; they are not proof, completeness, implementation state, or
verification receipts. A model, including one with `coverage.status: complete`,
may contain no codeRefs. Missing bookmarks never produce a lint finding.

## links (the PDD → SDD bridge)

Optional on any entity:

```yaml
links:
  - rel: spec        # spec | proposal | doc | adr
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

Links connect model entities to prescriptive documents (OpenSpec specs, design
docs, ADRs). `lint` warns when a local href does not exist.

## Entity files

### `config.yaml`

```yaml
schema: 1                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. A `platform:` block from an older model is
ignored rather than rejected — it named an endpoint nothing contacts any more.

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
`codeRefs` provide navigation into a directly represented actor boundary.

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
scenario. `codeRefs` are optional.

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
`limitations`) and the prose rationale are authored from the inspection that
created or expanded the model. Entity and file counts in the portable output
are computed by `export` from the model and tracked file list — they are never
authored. The linter checks authored entities and relationships; it does not
compile, publish, or semantically verify the model.

`status` describes **model breadth**, never implementation or verification:

- `draft` — the model itself is still being authored or reviewed.
- `partial` — the model is useful and has known unmapped areas.
- `complete` — the intended product scope is modeled.

All three statuses may be exported. A complete model may describe planned,
implemented, or mixed behavior and may contain zero codeRefs. Proposing it as a
catalog Blueprint is a separate, explicit action; public listing remains an
administrator decision.

## Generated files

- `cache/build.json` — metadata for the most recent portable build.
- `build/report.json` — portable Product Report v4 generated by
  `blueprint export` (`build` is refused, not aliased).

The map inventory is emitted to stdout and writes no cache file. All of
`build/` and `cache/` are gitignored by model-creation workflows. Generated
files are derived artifacts and must not be edited or committed.

## Portable report and expansion

`build/report.json` is a Product Report with `schemaVersion: "4.0.0"`. It
contains the product entities, relationships, intent, links, supporting
content, and coverage needed to reconstruct the model.

As written by `blueprint export` it carries the **source-free profile**: it
removes every `codeRef`, repository-relative link, and repository-relative
entry point, and sets `coverage.evidenceRedacted`. It also contains no repository URL, branch,
commit, catalog listing state, pricing, or entitlement data. A report that has
been through `export` is a Blueprint.

The report schema accepts only content that can expand into canonical entity
Markdown: titles and list items are single-line, required descriptions and
behavior sections are non-empty, standard mapped counts equal the entities
carrying one or more navigational `codeRefs`, and relationships resolve to
existing entities.
Historical v4 reports may retain older coverage metric names; any standard
entity count or mapped key that is present must still match the report.
No report profile requires a codeRef. Present codeRefs remain subject to the
same grammar, tracked-path, and redaction rules.

### Source navigation and redaction

Several report fields name the origin repository rather than the product. That
navigation is useful inside its repository but must not be published. Every
report proposed or served as a public catalog Blueprint is first passed through
one shared projection. The API and `evidenceRedacted` field retain their v4
names for compatibility:

```ts
import { redactSourceEvidence } from 'businesslens/report'

serve(redactSourceEvidence(report))
```

| Field | Delivered report |
| --- | --- |
| `codeRefs` | emptied on every entity |
| `entryPoints` | repository paths dropped; routes like `/checkout` and HTTP(S) URLs kept |
| `links` | local hrefs dropped; HTTP(S) URLs kept |
| `coverage.sourceAreas` | emptied |
| `coverage.evidenceRedacted` | set to `true` |

Relative POSIX paths, Windows paths, UNC paths, local `file:` URLs, and
recognizable absolute filesystem paths are repository-origin metadata. A rooted
entry point such as `/checkout` is a product route and is kept; root-relative
links are local and are dropped. HTTP(S) URLs are kept in either field. A
value with no path separator at all, such as a CLI entry point, is not a path
and is kept.

Author-written prose — `method`, `unmapped`, `limitations`, `rationale`,
`intent`, and `supportingContent` — is never rewritten. It carries product
meaning and belongs to the author, so keep repository internals out of it.

The projection is idempotent and does not mutate its input. Because both the
framework and the catalog apply this same exported function, contributors and
the server cannot disagree about what a delivered report exposes, and
`validateProductReport` rejects a report marked `evidenceRedacted` that still
names a repository path.

`coverage.mapped` is deliberately preserved for Product Report v4 wire
compatibility. It counts entities that carried implementation-linked bookmarks
upstream; it is a navigation signal, not proof or model completeness. Since a
redacted report no longer carries the `codeRefs` those counts were derived
from, report validation adapts:

| `coverage.evidenceRedacted` | `coverage.mapped` rule |
| --- | --- |
| absent or `false` | must equal the entities carrying `codeRefs` |
| `true` | must not exceed the entity counts, and no entity may carry a `codeRef` |

`blueprint export` writes the redacted, source-free report. Contribution applies
the same idempotent projection before opening a public pull request. `open` and
`pull` never transplant imported source bookmarks into the receiving repository
regardless of whether the input was already redacted.

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
