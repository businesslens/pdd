---
title: blueprint contribute
description: Open a pull request proposing your Product Model as a Blueprint.
section: open-source
group: CLI
order: 29
---

# `pdd-kit blueprint contribute`

Propose your Product Model as a
[Blueprint](./from-a-blueprint.md#what-a-blueprint-is), by opening a pull request.

```bash
npx @itai-gendler/pdd-kit blueprint contribute [--yes]
```

## Options

| Option | Meaning |
| --- | --- |
| `--yes` | Skip the confirmation prompt; required without an interactive terminal |

## Before you run it

- The [GitHub CLI](https://cli.github.com), signed in with `gh auth login`.
- A model with no lint errors.
- In the Product's frontmatter: a category, at least one tag, at least one
  author, and an SPDX license.
- A logo. Move a compact `product-model/product.md` to
  `product-model/product/product.md` and add `logo.svg` beside it. See
  [Logo and publishing](./product.md#logo-and-publishing). An optional
  `cover.webp` beside it is carried into the pull request too.

Your Product id becomes the Blueprint's name, the one others pull.

## What it does

1. Checks `gh` and lints the model. Any failure stops the run.
2. Exports the model, as [`blueprint export`](./cli-export.md) does, and checks
   the metadata and logo above.
3. Regenerates the model from that portable report in a temporary directory, so
   the pull request holds exactly what `blueprint pull` will produce. Code
   References, local paths and Coverage are dropped by the
   [projection](./cli-export.md#portable-export), not refused.
4. Asks you to confirm, unless you pass `--yes`.
5. Forks the upstream into your account and syncs it with the upstream (or, if
   you own the upstream, clones it directly). A fork that cannot be synced
   stops the run.
6. Writes `blueprints/<slug>/product-model/` on a `blueprint/<slug>` branch and
   force-pushes that branch, which only this command uses.
7. Opens the pull request, or updates the open one, and prints its URL. Run it
   again to revise; leave the fork in place until the pull request is merged.

Your repository gains only the gitignored export files; the branch, commit and
fork all live elsewhere. The upstream is `itai-gendler/pdd-kit` unless
`PDD_KIT_BLUEPRINT_REPOSITORY` names another `owner/repo`.

Merging publishes the Blueprint: within minutes it appears in
[`blueprint list`](./cli-list.md) and can be pulled by name.

Exits 0 when the pull request is opened or updated, 1 when a check fails, you
decline, or GitHub refuses, and 2 without a terminal and without `--yes`.

## Next

- [`blueprint pull`](./cli-pull.md) your slug into an empty folder to test it.
