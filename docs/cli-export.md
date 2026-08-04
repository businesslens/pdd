---
title: blueprint export
description: Compile a Product Model into a portable Product Report that can move safely between repositories.
section: open-source
group: CLI
order: 32
---

# `businesslens blueprint export`

Compile schema 3 `.businesslens/` into a portable Product Report v7:

```bash
npx businesslens blueprint export
```

The report is written to `.businesslens/build/report.json`. It is generated,
gitignored, and replaced on every run.

**A Blueprint is a portable Product Report.** Publishing that Blueprint in a
catalog is a separate step.

## Portable export

Export applies one portable projection so repository-specific navigation does
not travel with the Product contract:

| Field | Portable result |
| --- | --- |
| `references` | Keep only HTTP(S) intent and context References |
| `entryPoints` | Remove repository paths and `file:` URLs; keep Product routes, HTTP(S) URLs, non-file deep links, and commands |
| `coverage.sourceAreas` | Empty the list |
| `referenceProfile` | Set to `portable` |

`export` lints before it compiles. A model with lint errors does not produce a
report. See [Coverage](./product-model.md#coverage) and
[References](./references.md) for those contracts.

## Where it lands

- [`contribute`](./cli-contribute.md) exports one and opens a pull request
  proposing it for a catalog.
- [`blueprint open`](./cli-open.md) expands one back into a Product Model.
- The catalog serves stored Blueprints to [`blueprint pull`](./cli-pull.md).
