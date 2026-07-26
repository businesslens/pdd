# The `.businesslens/` Format

This document is the contract for the BusinessLens PDD folder: the git-tracked
product map that lives inside a repository. Everything the public CLI validates
is defined here. The map is **descriptive product truth** — what the product
does today, for whom, with code evidence. Prescriptive change intent (what will
be built next) belongs to your SDD tool of choice and is deliberately out of
scope.

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
├── journeys/<journey-id>/journey.md
├── journeys/<journey-id>/scenarios/<scenario-id>.md
├── .gitignore               # written by businesslens-init
└── cache/                   # generated analysis artifacts — never committed
```

## Universal conventions

- **ID = filename stem.** An entity's id is its filename without `.md`
  (journeys: the directory name). IDs are lowercase kebab-case:
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never write `id:` in frontmatter — the
  filesystem is the id authority. The one exception is `product.md`, whose
  `id:` names the product map (it may differ from the repo name).
- **H1 = title/name.** The first `# Heading` in the body is the entity's
  title (actors and domains call it `name`).
- **Lead paragraph = description/summary.** Prose between the H1 and the first
  `##` heading is the description for actors, domains, experiences, and the
  product, or the summary for journeys. Later sections provide supporting
  context except where a structured section is required below.
- **Frontmatter = relations and evidence only.** Never prose.
- Scenario ids must be unique across the whole map, not just within their
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
behavioral claims; actors, experiences, and domains may carry evidence when
their boundary is directly represented in code.

## links (the PDD → SDD bridge)

Optional on any entity:

```yaml
links:
  - rel: spec        # spec | proposal | doc | adr
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

Links connect map entities to prescriptive documents (OpenSpec specs, design
docs, ADRs). `validate` warns when a local href does not exist.

## Entity files

### `config.yaml`

```yaml
schema: 1                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

### `product.md`

```markdown
---
id: acme-shop
tags: [commerce]
limitations: []
---

# Acme Shop

One-paragraph description of the product.

## Anything else

Kept in the repo as supporting context.
```

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
`experienceIds`. Every journey must belong to at least one experience and
have at least one actor, one codeRef, and one scenario.

### `journeys/<jid>/scenarios/<id>.md`

```markdown
---
kind: primary
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

## Outcome

Order is stored and a confirmation is shown.

## Edge cases

- Payment declined → cart preserved, error shown
```

`kind` must exist in `taxonomies.yaml`. `## Trigger` and `## Outcome` are
paragraphs, `## Steps` is an ordered list (≥1 item), `## Edge cases` is an
optional bullet list. `journeyId` is derived from the path.

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

Coverage counts are maintained by the agent from repository evidence. The
validator checks the authored entities and relationships; it does not compile
or publish the map.

## Cache files

- `cache/inventory.json` — repository inventory generated for the init and
  sync skills.

All of `cache/` is gitignored by `businesslens-init`. Cache files are derived
artifacts and must not be edited or committed.
