---
title: Overview
description: Install skills, lint Product Model structure, and move Blueprints between repositories with the BusinessLens CLI.
section: open-source
group: CLI
order: 24
---

# BusinessLens CLI

Run the current package without a global install:

```bash
npx businesslens@latest <command> [options]
```

| Command | Purpose |
| --- | --- |
| [`install`](./cli-install.md) | Install map, ideate, and verify |
| [`update`](./cli-update.md) | Refresh marked skill installations and remove retired managed skills |
| [`lint`](./cli-lint.md) | Check Product Model structure without semantic claims |
| [`blueprint export`](./cli-export.md) | Compile a source-free Blueprint |
| [`blueprint open`](./cli-open.md) | Expand a local Blueprint into `.businesslens/` |
| [`blueprint pull`](./cli-pull.md) | Pull a catalog Blueprint by name |
| [`blueprint contribute`](./cli-contribute.md) | Propose a Blueprint by pull request |

General options include `--cwd <path>`, `--help`, and `--version`.

```bash
npx businesslens@latest --cwd ../fixture-shop lint --json
```

Exit codes: `0` success, `1` operation failure, and `2` invalid usage.

The bare Blueprint verbs and `build` are refused with the current replacement.
`validate` is likewise refused in favor of `lint`; removed names are not aliases.
