# BusinessLens authoring format

## Layout

```text
.businesslens/
├── config.yaml
├── taxonomies.yaml
├── product.md
├── coverage.md
├── .gitignore
├── actors/<id>.md
├── experiences/<id>.md
├── domains/<id>.md
├── features/<id>.md
├── business-rules/<id>.md
└── journeys/<id>/journey.md
    └── scenarios/<id>.md
```

Use lowercase kebab-case IDs. An entity ID is its filename stem; a journey ID
is its directory name. Only `product.md` declares an `id:` field.

## Top-level files

Create `config.yaml` without platform settings:

```yaml
schema: 1
sdd:
  paths: []
```

Populate `sdd.paths` with repository-relative SDD roots such as `openspec/`,
`specs/`, or `.kiro/` only when they exist.

Create `taxonomies.yaml`:

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

Create `product.md`:

```markdown
---
id: product-id
tags: []
limitations: []
---

# Product name

One paragraph describing what the product does and for whom.
```

Keep the product `id` lowercase kebab-case and at most 64 characters; it is
also the default Platform Project slug.

Create `coverage.md`:

```markdown
---
status: partial
method: ["Static review without executing target code."]
sourceAreas: [src]
unmapped: []
limitations: []
---

# Coverage

Explain what was inspected, what remains unmapped, and why.
```

Create `.gitignore` with:

```gitignore
build/
cache/
```

## Evidence and links

Use repository-relative compact code references:

```yaml
codeRefs:
  - src/checkout/handler.ts#CheckoutHandler.submit
  - src/routes/cart.ts:42-88
  - server/api/orders.post.ts
```

The grammar is `path[#symbol][:start[-end]]`. Every path must be tracked by
Git. Journeys and scenarios require direct evidence. Other entities may carry
evidence when their boundary is represented directly in code.

Any entity body may contain `## Intent`: structured prose explaining why the
entity exists and which outcome it protects. Other unrecognized H2 sections
are preserved as supporting context.

Use optional `links:` for SDD and documentation:

```yaml
links:
  - rel: spec
    href: openspec/specs/checkout/spec.md
    title: Checkout specification
```

Allowed relations are `spec`, `proposal`, `doc`, and `adr`.

## Entities

Actor:

```markdown
# Shopper

Person purchasing products through the storefront.
```

Domain:

```markdown
---
colorSlot: 2
codeRefs: [src/catalog/service.ts#CatalogService]
---

# Catalog

Product discovery and availability.
```

Experience:

```markdown
---
actors: [shopper]
access: public
entryPoints:
  - web: /
exit: "The visitor leaves the storefront or begins checkout."
codeRefs: [src/routes/storefront.ts]
---

# Storefront

Public product discovery and purchasing surface.

## Capability boundary

Visitors can browse products and begin checkout; administration is excluded.
```

`access` is `public`, `authenticated`, or `restricted`.

Feature:

```markdown
---
domain: ordering
actors: [shopper]
experiences: [storefront]
businessRules: [stock-must-be-available]
codeRefs: [src/services/orders.ts#OrderService.submit]
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without losing cart state after a recoverable failure.
```

Business rule:

```markdown
---
domains: [ordering]
features: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
codeRefs: [src/services/orders.ts#OrderService.submit]
---

# Stock must be available

An order can be confirmed only while every item has sufficient stock.

## Rationale

Checkout must revalidate inventory that changed after browsing.
```

Journey:

```markdown
---
domain: ordering
actors: [shopper]
experiences: [storefront]
features: [checkout]
entryPoints:
  - web: /checkout
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Complete checkout

A shopper turns a valid cart into an order.
```

Scenario:

```markdown
---
kind: primary
businessRules: [stock-must-be-available]
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Checkout succeeds

## Trigger

The shopper submits a valid checkout.

## Steps

1. The system validates stock.
2. Payment is authorized.
3. The order is persisted.

## Decision points

### Stock result

Can every requested item still be fulfilled?

- available → continue to payment
- unavailable → preserve the cart and show the affected items

## Outcome

The shopper receives an order confirmation.

## Edge cases

- A duplicate submission returns the existing order.
```

Scenario IDs are globally unique. Every journey needs at least one actor,
experience, feature, code reference, and scenario. Every feature needs a
domain and experience. Every business rule relates to at least one entity.
Every scenario needs a known kind, Trigger, ordered Steps, Outcome, and direct
code evidence. Each optional decision point needs a question and at least two
`condition → outcome` branches.
