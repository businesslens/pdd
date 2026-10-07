---
title: References
description: Point any resource at material kept outside the model (code, a PRD, a design, research), saying what it is and why it is attached.
section: open-source
group: Product Model
order: 16
terms:
  - term: Reference
    anchor: asset-or-reference
    definition: "A pointer to material outside the model, such as code, a spec, or a screenshot, saying what it is and why it is attached."
  - term: Reference kind
    anchor: kind-and-role
    definition: "What the referenced material is: code, prd, spec, proposal, doc, adr, visual, or research."
  - term: Reference role
    anchor: kind-and-role
    definition: "Why a Reference is attached: intent helps define the Product, implementation points to what was built, and context provides background."
---

# References

**A Reference points a resource at material kept outside the model (code, a PRD,
a design, research) and says what it is and why it is there.** The material
stays where it is, and it never replaces the resource's own words: the model
still says what the Product does.

## In practice

| What you attach | `kind` | `role` |
| --- | --- | --- |
| The function that places an order, on the Checkout Capability | `code` | `implementation` |
| The PRD that defined checkout | `prd` | `intent` |
| An approved design of the Order status Screen | `visual` | `intent` |
| A screenshot of the live Order status Screen | `visual` | `implementation` |
| A competitor's checkout, for comparison | `visual` | `context` |
| The payment provider's published API docs | `doc` | `context` |

Every resource type can carry references. `config.yaml`, `coverage.md` and
`taxonomies.yaml` cannot. A model may have none at all.

## When you create one

- **Attach where the material is about.** Code that settles a payment goes on
  the Capability that settles it, not on the Product.
- **A capture of a condition goes on the Scenario that reaches it.** A screenshot
  of an empty or refused view attaches to the Scenario whose Step meets that
  condition; the Screen carries captures of the place itself.
- **Prefer a symbol to line numbers** in code targets: lines drift, a function
  name rarely does.
- **A Reference is a lead, not proof.** Nothing reads, fetches or verifies its
  content.

### Asset or Reference

Use an **asset** when the model owns the file (a mockup made for this model).
Expand the resource from `<id>.md` to `<id>/<type>.md` and put the file beside
it; captures of this repository's running Product go under `implementation/`:

```text
screens/order-status/
├── screen.md
├── mockup.svg
└── implementation/
    └── order-status-dark.png
```

An asset needs no frontmatter. Add `assets:` only to give one a `title`.

Use a **Reference** when someone else owns the material: source code, a Figma
file, an ADR, research, a hosted design.

## The file

`references` is a list in any resource's frontmatter:

```yaml
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
  - kind: prd
    role: intent
    target: docs/prds/checkout.md
    title: Checkout PRD
  - kind: visual
    role: intent
    target: https://example.com/designs/checkout
```

| Field | Says |
| --- | --- |
| `kind` (required) | What the material is |
| `role` (required) | Why it is attached |
| `target` (required) | Where it is: a repository-relative path or an HTTP(S) URL. Code uses `path#symbol` or `path:start-end` |
| `title` | An optional label |

### Kind and role

| `kind` | The material |
| --- | --- |
| `code` | A tracked source file, optionally a symbol or line range |
| `prd` | A product requirements document — see [how it differs from the model](./product-model.md#is-this-replacing-my-prd) |
| `spec` | A product or technical specification, including a database schema |
| `proposal` | A proposed direction or change |
| `doc` | General documentation |
| `adr` | An architecture decision record |
| `visual` | A screenshot, mockup, prototype, design or diagram |
| `research` | Product or user research |

| `role` | Means |
| --- | --- |
| `intent` | It helped define what the Product should do |
| `implementation` | It points at what was built |
| `context` | Useful background, neither |

## How it connects

A Reference belongs to the one resource that lists it. When the model is
published as a [Blueprint](./cli-export.md), `intent` and `context` references
travel with it; `implementation` references, every `code` reference and every
repository path stay home.

## What lint checks

Errors:

- A reference without `kind`, `role` and `target`, with any other key, or with a
  `kind` or `role` outside the lists above.
- A target that is an absolute path, a `file:` or other non-HTTP(S) URL, or uses
  backslashes.
- A `code` target whose path is not a file tracked by Git.
- The same target twice on one resource.
- `assets:` naming a file that is not in the resource's folder, or with a key
  other than `file` and `title`.

Warning:

- A non-code target path that does not exist in the repository.
