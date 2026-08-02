---
title: Evidence & coverage
description: codeRefs, the one rule that keeps the model honest, the draft exception for greenfield products, and links to your SDD documents.
section: open-source
group: Product model
order: 15
---

# Evidence & coverage

**Every behavioral claim must cite tracked code.** That is the one rule the
whole format rests on, and a green `validate` means the model and the code
agree.

A claim without evidence is, by definition, unfinished work — which is exactly
what makes planning possible without inventing anything to hold it.

## `codeRefs`

Compact strings, parsed deterministically:

```yaml
codeRefs:
  - src/checkout/handler.ts#CheckoutHandler.submit   # path + symbol
  - src/routes/cart.ts:42-88                         # path + line range
  - server/api/orders.post.ts                        # path only
```

The grammar is `path[#symbol][:start[-end]]`. The line suffix is the last `:`
whose remainder matches `^\d+(-\d+)?$`; the symbol is everything after the first
`#` of what remains.

`validate` checks every path against `git ls-files` — **a codeRef must point at
a tracked file.** That check is what keeps the model from drifting into fiction.

### Who needs evidence

| Entity | Evidence |
| --- | --- |
| [Journeys](./journeys.md), [Scenarios](./scenarios.md) | **Required** — they make behavioral claims |
| [Actors](./actors.md), [Experiences](./experiences.md), [Domains](./domains.md), [Features](./features.md), [Business rules](./business-rules.md) | Optional — cite code when the boundary is directly represented in it |

`codeRefs` are accepted and preserved on every entity.

## The draft rule

One state is special: a **brand-new product with no code at all**.

Setting `status: draft` in `coverage.md` marks the whole model as planned. While
draft, a journey or scenario without `codeRefs` is a **warning** instead of an
error, so the model validates green:

```text
needs at least one codeRef before coverage can leave draft
```

Two things stay true even in draft:

- A codeRef that **is** present must still point at a tracked file. Planned
  behavior carries *no* evidence rather than *invented* evidence.
- Draft models are valid Product Model sources. They can be exported and
  proposed to the catalog with their gaps still visible.

Once implementation is verified and evidence is attached, set the status to
`partial` or `complete`. From then on evidence is strictly required.

## How coverage relates to evidence

> **Evidence vs coverage.** Evidence supports one particular entity. Coverage
> describes how complete and trustworthy the model is as a whole.

Coverage status describes the **model's** completeness — not whether an
individual feature is enabled, shipped, or deprecated. The
[`coverage.md` file and its three statuses](./product-model.md#coveragemd-how-honest-the-model-is)
are in the Overview.

Entity and file counts in exported reports are **computed** from the model and
the tracked file list, never authored.

## `links` — the bridge to your specs

Optional on any entity. Links connect a model entity to a prescriptive or
supporting document without copying that document into the model:

```yaml
links:
  - rel: spec        # spec | proposal | doc | adr
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

`validate` **warns** when a local `href` does not exist. See
[With SDD tools](./with-sdd.md) for how the citation runs in both directions.

## What `validate` checks

| Finding | Severity | Meaning |
| --- | --- | --- |
| `needs at least one codeRef` | error | A journey or scenario with no evidence. On a branch this is the planning checklist — `businesslens-sync` clears it. |
| `codeRef path "…" is not a tracked file` | error | Fix the path, commit the file, or remove the stale ref. |
| `empty codeRef` / `has no path` / `must be repository-relative` / `has an empty symbol` / `has an inverted line range` | error | The codeRef grammar is `path[#symbol][:start[-end]]`. |
| `coverage.md: status "…" must be complete\|partial\|draft` | error | The only allowed coverage states. |
| `link rel "<rel>" must be one of spec\|proposal\|doc\|adr` | error | Unsupported link relation. |
| `needs at least one codeRef before coverage can leave draft` | warning | The draft rule above. |
| `link href "…" does not exist in the repository` | warning | Fix the path or drop the link. |

Warnings never fail validation. Exit codes: `0` when there are no errors,
`1` for validation failure, `2` for invalid usage.

## Stale evidence is not drift

If the code moved but **behavior did not** — a rename, a file move, a
refactor — the model is still true and only its `codeRefs` are stale.
`validate` catches those and `businesslens-sync` repairs them. See
[Your commit loop](./commit-loop.md).
