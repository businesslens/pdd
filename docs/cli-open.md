---
title: blueprint open
description: Expand a local Product Report into a canonical Product Model.
section: open-source
group: CLI
order: 27
---

# `businesslens blueprint open`

Expand a [Blueprint](./from-a-blueprint.md#what-a-blueprint-is) file you were
given into a `.businesslens/` Product Model. For a catalog Blueprint, use
[`blueprint pull`](./cli-pull.md) instead.

```bash
npx businesslens blueprint open <report> [--force]
```

## Options

| Option | Meaning |
| --- | --- |
| `<report>` | Path to a local Product Report file, resolved from your shell's directory, not from `--cwd`. A URL is refused |
| `--force` | Move a non-empty `.businesslens/` aside to a backup first |

`--cwd` picks the directory that receives `.businesslens/`; it need not be a Git
repository:

```bash
npx businesslens --cwd ./new-product blueprint open ./report.json
```

## What it does

1. Reads the file: a regular file, not a link, at most 8 MiB.
2. Validates it as a Product Report and applies the
   [portable projection](./cli-export.md#portable-export).
3. Writes the model, with its orientation `README.md`, into a temporary
   `.businesslens-open-*` directory beside the target, and lints it there.
4. Moves it into place as `.businesslens/` and removes the temporary directory.

Everything except repository navigation comes through (see
[what export keeps](./cli-export.md#portable-export)). Coverage comes through
empty: no code in your repository has been mapped to the model yet. A report
carries no logo or cover, so the Product is written compact, as
`product.md`.

## Safety

A non-empty `.businesslens/` is refused unless you pass `--force`, which first
renames it to a `.businesslens.backup-<timestamp>/` sibling that is never
deleted. A `.businesslens` that is a link or a file is always refused. Nothing is
written to the target until the expanded model lints.

Exits 0 when the model is written, 1 when the file or the target is refused,
and 2 when given a URL or invalid options.

## Next

- [Start from a Blueprint](./from-a-blueprint.md#steps) to review, adapt and
  implement it.
