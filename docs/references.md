---
title: References
description: Attach intent, implementation, or context artifacts to any Product Model resource without moving external material into the model.
section: open-source
group: Product Model
order: 18
---

# References

References connect a self-contained Product Model to material maintained
outside it. They can point to a design used while curating intent, code that
currently implements behavior, a technical proposal, research, or related
context. The referenced artifact is not part of the model and never replaces
the resource's Product prose.

Every semantic resource supports the same optional field: Product, Actor,
Interface, Experience, Screen, Domain, Entity, Capability, Journey, Capability
Scenario, Journey Scenario, and Business Rule. Configuration, Coverage, and
taxonomies do not.

```yaml
references:
  - kind: prd
    role: intent
    target: docs/prds/checkout.md
    title: Checkout PRD
  - kind: visual
    role: intent
    target: https://example.com/designs/checkout
    title: Approved checkout direction
  - kind: code
    role: implementation
    target: src/checkout/handler.ts#CheckoutHandler.submit
```

## Asset or Reference

Use an asset when the model owns the file. Expand the resource from `<id>.md` to
`<id>/<type>.md`, then place authored assets beside `<type>.md`. Put generated
captures describing this repository's realization under the reserved
`implementation/` subdirectory:

```text
screens/unread-library/
├── screen.md
├── mockup.svg
└── implementation/
    └── backlog-dark.png
```

An asset needs no frontmatter entry. Add optional `assets:` metadata only when
it needs a title or, on a Screen, a Product state:

```yaml
assets:
  - file: mockup.svg
    title: Approved unread backlog
  - file: implementation/backlog-dark.png
    title: Implemented backlog, dark
    state: Backlog
```

Use a Reference when another system or repository owns the material: source
code, a Figma file, an ADR, research, a vendor contract, or a hosted design.
This avoids a mirrored asset tree while keeping external material external.

## Kind and role

`kind` says what the artifact is:

| Kind | Artifact |
| --- | --- |
| `code` | A tracked source file, optional symbol, or line range |
| `prd` | A product requirements document — see [how it differs from the model](./product-model.md#is-this-replacing-my-prd) |
| `spec` | A product or technical specification, including a database schema — see [is this an ERD](./entities.md#is-this-an-erd) |
| `proposal` | A proposed direction or change |
| `doc` | General documentation |
| `adr` | An architecture decision record |
| `visual` | A screenshot, mockup, prototype, design, or diagram |
| `research` | Product or user research |

`role` says why it is attached to this resource:

| Role | Meaning | Travels with a published Blueprint |
| --- | --- | --- |
| `intent` | Helped express or curate intended Product meaning | yes |
| `implementation` | Points at a realized Product artifact | **no** |
| `context` | Supplies useful background without defining intent or implementation | yes |

A PRD uses `kind: prd`. Give it `role: intent` when it helped define the
approved Product meaning on that resource, or `role: context` when it supplies
supporting history. The Product Model remains self-contained: the PRD explains
the decision around a resource but never replaces its authored meaning.

`intent` and `context` describe the Product, so they travel with a published
Blueprint. `implementation` describes this repository's realization of it and
stays home — the portable projection removes every `implementation` reference,
along with every `kind: code` reference and every repository-relative target,
whatever its role. That is not a limitation to work around; it is what makes the
role meaningful.

## Naming the state a capture shows

A [Screen](./screens.md) often collects several captures of the same view — one
per Product state, sometimes doubled for light and dark. An optional `state` on
either asset metadata or a Reference names which one:

```yaml
references:
  - kind: visual
    role: implementation
    target: docs/design/screenshots/overview-dark.png
    title: Overview tab, dark
    state: Journeys
```

`state` is valid only on a Screen and must match one of its `## Product states`
H3 titles. Themes are not Product states, so a light and a dark capture of the
same state are two attachments sharing one `state` value.

Without it, six captures of one Screen arrive as a flat list distinguishable
only by free-text title. With it, each one is placed beside the state it shows.

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
backslash paths are invalid. Duplicate targets on one resource are invalid.

The deterministic CLI does not fetch or inspect referenced content, and a
Reference never certifies alignment. BusinessLens skills may follow curated
References as leads while mapping or verifying the repository, but the
artifact is evidence to assess rather than proof to trust.

## Report profiles

A compiled workspace Product Report retains all References and declares
`referenceProfile: workspace`. Co-located assets appear there as
repository-relative References; the report does not embed their bytes. A
portable Product Report keeps only HTTP(S) References whose role is `intent` or
`context`, so local asset pointers do not enter a Blueprint yet.

[`blueprint export`](./cli-export.md#portable-export) defines the complete
portable projection. `open`, `pull`, and `contribute` apply the same projection.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| missing `kind`, `role`, or `target` | Every Reference needs all three fields. |
| unknown Reference key | Use only `kind`, `role`, `target`, and optional `title` and `state`. |
| invalid kind or role | Choose one of the documented values. |
| invalid code target | Use the compact grammar and a repository-relative path. |
| `code reference path "…" is not a tracked file` | Fix or remove stale navigation. |
| duplicate Reference target | Keep only one attachment to that target on the resource. |
| missing local target warning | Fix the target or remove it; warnings do not fail lint. |
| `reference state "…" is not a product state of this Screen` | Name an authored `## Product states` H3, or drop the key. |
| `reference "state" is only valid on a Screen` | No other resource type has a state set for it to resolve against. |
| asset metadata names a missing file | Expand the resource and add the file, or remove the stale metadata. |
| asset state does not name a Product state | Name an authored Screen H3 or remove `state`. |

There is no missing-Reference finding. A complete model may contain none.
