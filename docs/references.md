---
title: References
description: Attach intent, implementation, or context artifacts to any Product Model entity without moving external material into the model.
section: open-source
group: Product Model
order: 19
---

# References

References connect a self-contained Product Model to material maintained
outside it. They can point to a design used while curating intent, code that
currently implements behavior, a technical proposal, research, or related
context. The referenced artifact is not part of the model and never replaces
the entity's Product prose.

Every semantic entity supports the same optional field: Product, Actor,
Interface, Experience, Screen, Domain, Capability, Journey, Capability
Scenario, Journey Scenario, and Business Rule. Configuration, Coverage, and
taxonomies do not.

```yaml
references:
  - kind: visual
    role: intent
    target: https://example.com/designs/checkout
    title: Approved checkout direction
  - kind: code
    role: implementation
    target: src/checkout/handler.ts#CheckoutHandler.submit
```

## Kind and role

`kind` says what the artifact is:

| Kind | Artifact |
| --- | --- |
| `code` | A tracked source file, optional symbol, or line range |
| `spec` | A product or technical specification |
| `proposal` | A proposed direction or change |
| `doc` | General documentation |
| `adr` | An architecture decision record |
| `visual` | A screenshot, mockup, prototype, design, or diagram |
| `research` | Product or user research |

`role` says why it is attached to this entity:

| Role | Meaning |
| --- | --- |
| `intent` | Helped express or curate intended Product meaning |
| `implementation` | Points at a realized Product artifact |
| `context` | Supplies useful background without defining intent or implementation |

The distinction answers the screenshot question directly. A design screenshot
used to define a Screen is `visual` + `intent`; a screenshot captured from the
implemented Product is `visual` + `implementation`; a competitive example is
usually `visual` + `context`. The same separation works for documents and code.
A code reference may even have `role: intent` when source is being used as an
input to curation. None of these roles means current, verified, or proven.

## Target rules

Code targets use `path[#symbol][:start[-end]]`:

```yaml
references:
  - kind: code
    role: implementation
    target: src/routes/cart.ts#submitCart:42-88
```

The path must be repository-relative and tracked by Git. Prefer a stable symbol
over a line range. Lint validates grammar and tracking, but not symbol or line
existence and not behavioral alignment.

Every other kind accepts an HTTP(S) URL or repository-relative path. HTTP(S)
targets are syntax-checked but never fetched. A missing local target warns
without failing lint. Absolute paths, `file:` URLs, unsupported schemes, and
backslash paths are invalid. Duplicate targets on one entity are invalid.

The deterministic CLI does not fetch or inspect referenced content, and a
Reference never certifies alignment. BusinessLens skills may follow curated
References as leads while mapping or verifying the repository, but the
artifact is evidence to assess rather than proof to trust.

## Report profiles

A compiled workspace Product Report retains all References and declares
`referenceProfile: workspace`. A portable Product Report keeps only HTTP(S)
References whose role is `intent` or `context`.

[`blueprint export`](./cli-export.md#portable-export) defines the complete
portable projection. `open`, `pull`, and `contribute` apply the same projection.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| missing `kind`, `role`, or `target` | Every Reference needs all three fields. |
| unknown Reference key | Use only `kind`, `role`, `target`, and optional `title`. |
| invalid kind or role | Choose one of the documented values. |
| invalid code target | Use the compact grammar and a repository-relative path. |
| `code reference path "…" is not a tracked file` | Fix or remove stale navigation. |
| duplicate Reference target | Keep only one attachment to that target on the entity. |
| missing local target warning | Fix the target or remove it; warnings do not fail lint. |

There is no missing-Reference finding. A complete model may contain none.
