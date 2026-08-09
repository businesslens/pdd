---
title: Overview
description: Install skills, lint and view a Product Model locally, and move Blueprints between repositories with the BusinessLens CLI.
section: open-source
group: CLI
order: 29
---

# BusinessLens CLI

Run the current package without a global install:

```bash
npx businesslens <command> [options]
```

| Command | Purpose |
| --- | --- |
| [`install`](./cli-install.md) | Install map, ideate, and verify |
| [`update`](./cli-update.md) | Refresh marked skill installations |
| [`lint`](./cli-lint.md) | Check Product Model structure without semantic claims |
| [`view`](./cli-view.md) | Render the current Product Model on localhost without exporting it |
| [`blueprint export`](./cli-export.md) | Compile a portable Product Report (a Blueprint) |
| [`blueprint open`](./cli-open.md) | Expand a local Blueprint into `.businesslens/` |
| [`blueprint pull`](./cli-pull.md) | Pull a catalog Blueprint by name |
| [`blueprint contribute`](./cli-contribute.md) | Propose a Blueprint by pull request |

Global options are `-c, --cwd <path>`, `-h, --help`, and `-V, --version`.
Each command's help lists only the arguments and options that command accepts:

```bash
npx businesslens view --help
npx businesslens blueprint pull --help
```

## Choosing the Product Model

`lint`, `view`, `blueprint export`, and `blueprint contribute` start from the
current directory. If that directory directly contains `.businesslens/`, that
model is used; otherwise BusinessLens checks the Git repository root. This lets
a nested Blueprint take precedence when the command runs from its directory,
while ordinary repository subdirectories still use the repository model.

Pass `-c, --cwd <path>` to run from another directory. `--cwd .` is identical
to omitting the option. Point to the directory containing `.businesslens/`, not
to `.businesslens/` itself.

```bash
# A nested Blueprint in the current repository
npx businesslens view --cwd ./blueprints/content-feed-reader

# A model in another directory or repository
npx businesslens lint --cwd ../fixture-shop --json
```

For `blueprint open` and `blueprint pull`, `--cwd` is instead the exact target
directory where `.businesslens/` will be created. For `install` and `update`, it
is the project used for harness detection and project-scoped skill installation.

Exit codes: `0` success, `1` operation failure, and `2` invalid usage.
