---
title: Overview
description: Install skills, lint and view a Product Model locally, and move Blueprints between repositories with the BusinessLens CLI.
section: open-source
group: CLI
order: 20
---

# BusinessLens CLI

Run the current package without a global install:

```bash
npx businesslens <command> [options]
```

| Command | Purpose |
| --- | --- |
| [`install`](./cli-install.md) | Install BusinessLens skills |
| [`update`](./cli-update.md) | Update managed skill installations |
| [`lint`](./cli-lint.md) | Lint a Product Model |
| [`view`](./cli-view.md) | View a Product Model locally, from your checkout or from GitHub |
| [`blueprint export`](./cli-export.md) | Export a Blueprint |
| [`blueprint open`](./cli-open.md) | Open a local Blueprint |
| [`blueprint pull`](./cli-pull.md) | Pull a catalog Blueprint |
| [`blueprint contribute`](./cli-contribute.md) | Contribute a Blueprint |
| `help [command]` | Show help for a command |

The `blueprint` commands move a Product Model between repositories as a
[Blueprint](./from-a-blueprint.md#what-a-blueprint-is).

## Global options

| Option | Meaning |
| --- | --- |
| `-c, --cwd <path>` | Run from another directory (see below) |
| `-h, --help` | Show help for the command |
| `-V, --version` | Show the CLI version |

Each command's help lists only what that command accepts:

```bash
npx businesslens help view
npx businesslens blueprint pull --help
```

## Choosing the Product Model

`lint`, `view`, `blueprint export`, and `blueprint contribute` start from the
current directory. If it directly contains `.businesslens/`, that model is used;
otherwise BusinessLens uses the one at the Git repository root. So a nested
Blueprint wins when you run from its directory, while ordinary subdirectories
use the repository's model.

`--cwd <path>` runs from another directory; `--cwd .` is the same as leaving it
out. Point it at the directory that contains `.businesslens/`, not at
`.businesslens/` itself.

```bash
# A nested Blueprint in the current repository
npx businesslens view --cwd ./blueprints/example-product

# A model in another directory or repository
npx businesslens lint --cwd ../fixture-shop --json
```

`view` can instead take a GitHub repository, branch, or pull request, and then
`--cwd` does not apply. See [`view`](./cli-view.md#a-github-repository).

For `blueprint open` and `blueprint pull`, `--cwd` is the directory where
`.businesslens/` will be created. For `install` and `update`, it is the project
used for harness detection and project-scoped skills.

## Environment

| Variable | Used by | Meaning |
| --- | --- | --- |
| `BUSINESSLENS_CATALOG_URL` | `blueprint pull` | Catalog origin when `--catalog` is not given; defaults to `https://businesslens.io` |
| `BUSINESSLENS_CONTRIBUTE_UPSTREAM` | `blueprint contribute` | `owner/repo` the pull request targets; defaults to `businesslens/pdd` |

Exit codes: `0` success, `1` the command failed or was refused, `2` invalid
usage. Each command page says which cases map to which.
