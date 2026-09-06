---
title: install
description: Install the bundled BusinessLens agent skills safely for selected AI harnesses and scopes.
section: open-source
group: CLI
order: 27
---

# `businesslens install`

Install the three bundled `businesslens-*` agent skills into one or more
supported AI harnesses:

```bash
npx businesslens install
```

The interactive flow detects available harnesses, lets you keep or customize
that selection, and asks whether to install into the current project or the
current user's global configuration. When no harness is detected, Claude Code
and Codex are the recommended defaults.

See [Installation](./installation.md) for provider-specific directories and
guidance on choosing project or global scope.

## Options

| Option | Meaning |
| --- | --- |
| `--providers <list>` | Install for a comma-separated list of `claude,codex,cursor,gemini,github` |
| `--scope project\|global` | Install into the current project or the current user's configuration |
| `--yes` | Accept detected providers and use project scope when those choices were not supplied |
| `--force` | Replace an unmarked colliding `businesslens-*` skill directory |

## Non-interactive

Pass the provider and scope choices explicitly in CI or any session without an
interactive terminal:

```bash
npx businesslens install \
  --providers claude,codex \
  --scope project \
  --yes
```

`--yes` by itself selects the detected providers, or Claude Code and Codex
when none are detected, and defaults to project scope.

## Install safety

The installer writes `.businesslens-install.json` into each managed skills
directory. That marker records the provider, scope, package version, and owned
skill names so a later [`update`](./cli-update.md) can find the installation.

**The marker is the only proof of ownership.** A `businesslens-*` directory that
the marker does not list is somebody else's — a fork, a hand-written skill, an
install by another tool, or an installation predating the marker — and it stops
the run unless `--force` is explicit. BusinessLens does not read a directory's
contents to guess that it wrote it: guessing wrong costs someone work they
cannot recover. For the same reason, a skill this release no longer ships is
removed only where the marker recorded it.

**A refusal changes nothing.** Every selected harness is checked before any is
written, so an install for two harnesses that stops on the second leaves the
first untouched. The message names the directory that blocked the run.

The command distributes skills only. It does not:

- create `.businesslens/`;
- install hooks;
- connect an account; or
- export or contribute a Product Model.

After installation, invoke `businesslens-map` for established code,
`businesslens-ideate` for a new product, or `businesslens-verify` for an
existing Product Model.
