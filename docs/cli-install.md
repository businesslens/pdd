---
title: install
description: Install the bundled BusinessLens agent skills safely for selected AI harnesses and scopes.
section: open-source
group: CLI
order: 21
---

# `businesslens install`

Install the three `businesslens-*` agent skills into your AI harnesses, once per
project or once for your user, before you map, ideate or verify.

```bash
npx businesslens install [--providers <list>] [--scope project|global] [--yes] [--force]
```

## Options

| Option | Meaning |
| --- | --- |
| `--providers <list>` | Comma-separated harnesses: `claude,codex,cursor,gemini,github` |
| `--scope project\|global` | Install into the current project or your user configuration |
| `--yes` | Take the defaults for anything not given: detected harnesses (Claude Code and Codex when none are detected) and project scope |
| `--force` | Replace a colliding `businesslens-*` skill directory that BusinessLens does not own |

Without a terminal (in CI, for example), pass `--providers` and `--scope`, or
`--yes` to take the defaults:

```bash
npx businesslens install --providers claude,codex --scope project
```

See [Installation](./installation.md) for each harness's directories and how to
choose a scope.

## What it does

1. Detects which harnesses you use. Interactively, you keep that selection or
   customize it, then choose project or global scope.
2. Checks every selected skills directory before writing to any of them.
3. Writes the three skills, removing any `businesslens-*` skill an earlier
   install recorded that this release no longer ships.
4. Writes `.businesslens-install.json` in each skills directory, recording the
   harness, scope, version and skill names, so [`update`](./cli-update.md) can
   find it later.

It installs skills only: no `.businesslens/`, no hooks, no account.

## Safety

**The marker is the only proof of ownership.** A `businesslens-*` directory the
marker does not list is someone else's, so it stops the run unless you pass
`--force`.

**A refusal changes nothing.** Every harness is checked before any is written,
and the message names the directory that blocked the run.

Exits 0 when the skills are installed, 1 when a collision, a missing terminal or
a cancelled prompt stops it, and 2 for an unknown harness, scope or option.

## Next

- [`businesslens-map`](./skill-businesslens-map.md) for established code,
  [`businesslens-ideate`](./skill-businesslens-ideate.md) for a new product, or
  [`businesslens-verify`](./skill-businesslens-verify.md) for an existing model.
- [`update`](./cli-update.md) after upgrading the package.
