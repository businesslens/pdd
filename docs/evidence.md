---
title: Code refs & coverage
description: Optional code bookmarks help navigation; coverage records how much intended product scope is modeled, not implementation state.
section: open-source
group: Product model
order: 15
---

# Code references and coverage

`codeRefs` and coverage answer different, deliberately limited questions:

- **Where might I start reading code?** → optional codeRefs.
- **How broadly has this Product Model been authored?** → coverage.

Neither is a verification receipt. Use `businesslens-verify` to inspect semantic
alignment.

## `codeRefs`

```yaml
codeRefs:
  - src/checkout/handler.ts#CheckoutHandler.submit
  - src/routes/cart.ts:42-88
  - server/api/orders.post.ts
```

Grammar: `path[#symbol][:start[-end]]`. Present paths must be repository-relative
and tracked by Git. Lint validates grammar and path tracking; it does not check
whether a symbol or line exists or whether behavior matches the entity.

Bookmarks are optional on every entity and at every coverage status. Prefer
symbols over fragile line ranges. Remove or refresh a bookmark after refactors
when it no longer helps navigation.

## `coverage.md`

```md
---
status: partial
method: ["Static inspection without executing target code"]
sourceAreas: [src, server]
unmapped: [deployment]
limitations: ["Runtime-only billing policy not established from source"]
---

# Coverage

The mapped scope and why known gaps remain.
```

| Status | Meaning |
| --- | --- |
| `draft` | The model itself is still being authored or reviewed |
| `partial` | The model is useful and has known unmapped areas |
| `complete` | The intended product scope is modeled |

Status says nothing about whether behavior is planned, implemented, deployed,
or verified. A complete model may contain zero codeRefs. A Blueprint keeps its
coverage status when source bookmarks are redacted.

Exported Product Report v4 retains `coverage.mapped` for wire compatibility. It
counts entities that carried bookmarks before redaction and must not be read as
proof or completeness.

## Links

Optional `links` connect entities to specs, proposals, docs, or ADRs. Lint warns
when a local href is missing.

```yaml
links:
  - rel: spec
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

## What lint checks here

| Finding | Meaning |
| --- | --- |
| `codeRef path "…" is not a tracked file` | Fix or remove the stale bookmark. |
| codeRef grammar finding | Use `path[#symbol][:start[-end]]` and a relative path. |
| `coverage.md: status "…" must be complete\|partial\|draft` | Choose a model-breadth status. |
| invalid link relation | Use `spec`, `proposal`, `doc`, or `adr`. |
| missing local link warning | Fix the href or remove it; warnings do not fail lint. |

There is no “missing codeRef” finding.
