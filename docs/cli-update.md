---
title: update
description: Refresh only BusinessLens-managed skill installations in project or global scope.
section: open-source
group: CLI
order: 22
---

# `businesslens update`

Refresh installed BusinessLens skills to the version of the package you run,
after upgrading it.

```bash
npx businesslens update [--providers <list>] [--scope project|global] [--force]
```

## Options

| Option | Meaning |
| --- | --- |
| `--providers <list>` | Look only in these harnesses: `claude,codex,cursor,gemini,github` |
| `--scope project\|global` | Look only in one scope |
| `--force` | Replace a colliding `businesslens-*` directory BusinessLens does not own inside a managed installation |

With no options it looks in every harness, in both scopes:

```bash
npx businesslens update --providers claude,codex --scope project
```

## What it does

1. Finds every skills directory with a valid `.businesslens-install.json`
   marker. Unmarked installations are never found or touched.
2. Writes the current three skills into each, and removes any `businesslens-*`
   skill the marker recorded that this release no longer ships.
3. Refreshes the marker, keeping its original install time.

It never changes your `.businesslens/` Product Model.

Exits 0 when at least one installation is updated, 1 when none is found or a
collision stops it, and 2 for an unknown harness, scope or option.

## Next

- [`install`](./cli-install.md) when there is nothing to update yet.
