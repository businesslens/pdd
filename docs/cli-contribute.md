---
title: blueprint contribute
description: Open a pull request proposing your Product Model as a catalog Blueprint.
section: open-source
group: CLI
order: 28
---

# `businesslens blueprint contribute`

Propose your Product Model for the catalog as a
[Blueprint](./from-a-blueprint.md#what-a-blueprint-is), by opening a pull request.

```bash
npx businesslens blueprint contribute [--yes]
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
- A logo. Move a compact `.businesslens/product.md` to
  `.businesslens/product/product.md` and add `logo.svg` beside it. See
  [Logo and publishing](./product.md#logo-and-publishing).

Your Product id becomes the Blueprint's catalog slug, and the name others pull.

## What it does

1. Checks `gh` and lints the model. Any failure stops the run.
2. Exports the model, as [`blueprint export`](./cli-export.md) does, and checks
   the metadata and logo above.
3. Regenerates the model from that portable report in a temporary directory, so
   the pull request holds exactly what `blueprint pull` will produce. Code
   References, local paths and Coverage paths are dropped by the
   [projection](./cli-export.md#portable-export), not refused.
4. Asks you to confirm, unless you pass `--yes`.
5. Forks the upstream into your account and syncs it with the upstream (or, if
   you own the upstream, clones it directly). A fork that cannot be synced
   stops the run.
6. Writes `blueprints/<slug>/.businesslens/` on a `blueprint/<slug>` branch and
   force-pushes that branch, which only this command uses.
7. Opens the pull request, or updates the open one, and prints its URL. Run it
   again to revise; leave the fork in place until the pull request is merged.

Your repository gains only the gitignored export files; the branch, commit and
fork all live elsewhere. The upstream is `businesslens/pdd` unless
`BUSINESSLENS_CONTRIBUTE_UPSTREAM` names another `owner/repo`.

Merging approves the Blueprint. A maintainer then publishes it to the catalog;
listing it is a separate decision.

Exits 0 when the pull request is opened or updated, 1 when a check fails, you
decline, or GitHub refuses, and 2 without a terminal and without `--yes`.

## Next

- [`blueprint pull`](./cli-pull.md) your slug into an empty folder to test it.
