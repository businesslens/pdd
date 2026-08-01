---
title: update
description: Refresh only BusinessLens-managed skill installations in project or global scope.
section: open-source
group: CLI
order: 27
---

# `businesslens update`

Refresh installed BusinessLens skills from the CLI package:

```bash
npx businesslens@latest update
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
| `--project` | Shortcut for `--scope project` |
| `--global` | Shortcut for `--scope global` |
| `--user` | Alias for `--global` |
| `--force` | Replace an unmarked colliding `businesslens-*` directory inside a managed target |

For example, update only project-scoped Claude Code and Codex installations:

```bash
npx businesslens@latest update \
  --providers claude,codex \
  --project
```

Scope flags are mutually exclusive. The CLI also rejects a scope flag that
conflicts with `--scope`.

## What changes

Each discovered installation receives the current ten bundled skills. The
command also refreshes its ownership marker while preserving the original
installation timestamp.

`update` does not discover or overwrite unmarked installations. It never
changes the repository's `.businesslens/` Product Model or `AGENTS.md`.
