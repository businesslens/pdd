---
title: blueprint export
description: Compile a Product Model into a portable Product Report that can move safely between repositories.
section: open-source
group: CLI
order: 31
---

# `businesslens blueprint export`

Compile folder schema 8 `.businesslens/` into a portable Product Report v13:

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

Unrecognized authored H2 sections survive as ordered `supportingSections`
records with separate `heading` and `content` fields — on the Product, whose
record is the report root, and on every other resource record. The report never
flattens them into an opaque Markdown string, so `blueprint open` can restore
the same section boundaries.

## Where it lands

- [`contribute`](./cli-contribute.md) exports one and opens a pull request
  proposing it for a catalog.
- [`blueprint open`](./cli-open.md) expands one back into a Product Model.
- The catalog serves stored Blueprints to [`blueprint pull`](./cli-pull.md).
