---
title: update
description: Refresh only BusinessLens-managed skill installations in project or global scope.
section: open-source
group: CLI
order: 31
---

# `businesslens update`

Refresh installed BusinessLens skills from the CLI package:

```bash
npx businesslens update
```

With no filters, the command searches every supported provider in both project
and global scope. It updates only skills listed by a valid
`.businesslens-install.json` ownership marker. If it finds no managed
installation, it exits with an error and suggests running
[`install`](./cli-install.md).

## Options

| Option | Meaning |
| --- | --- |
| `--providers <list>` | Limit discovery to a comma-separated list of `claude,codex,cursor,gemini,github` |
| `--scope project\|global` | Search only one installation scope |
| `--force` | Replace an unmarked colliding `businesslens-*` directory inside a managed target |

For example, update only project-scoped Claude Code and Codex installations:

```bash
npx businesslens update \
  --providers claude,codex \
  --scope project
```

## What changes

Each discovered installation receives the current three bundled skills. The
command also refreshes its ownership marker while preserving the original
installation timestamp.

`update` does not discover or overwrite unmarked installations. It never
changes the repository's `.businesslens/` Product Model.
