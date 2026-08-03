---
title: install
description: Install the bundled BusinessLens agent skills safely for selected AI harnesses and scopes.
section: open-source
group: CLI
order: 25
---

# `businesslens install`

Install the three bundled `businesslens-*` agent skills into one or more
supported AI harnesses:

```bash
npx businesslens@latest install
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
| `--project` | Shortcut for `--scope project` |
| `--global` | Shortcut for `--scope global` |
| `--user` | Alias for `--global` |
| `--yes` | Accept detected providers and use project scope when those choices were not supplied |
| `--force` | Replace an unmarked colliding `businesslens-*` skill directory |

Scope flags are mutually exclusive. The CLI also rejects a scope flag that
conflicts with `--scope`.

## Non-interactive

Pass the provider and scope choices explicitly in CI or any session without an
interactive terminal:

```bash
npx businesslens@latest install \
  --providers claude,codex \
  --scope project \
  --yes
```

`--yes` by itself selects the detected providers, or Claude Code and Codex
when none are detected, and defaults to project scope.

## Ownership and safety

The installer writes `.businesslens-install.json` into each managed skills
directory. That marker records the provider, scope, package version, and owned
skill names so a later [`update`](./cli-update.md) can find the installation.

An existing skill that is marked or recognizable as BusinessLens-owned can be
refreshed. An unrelated directory with the same `businesslens-*` name stops
the installation unless `--force` is explicit.

The command distributes skills only. It does not:

- create `.businesslens/`;
- install hooks;
- connect an account; or
- export or contribute a Product Model.

After installation, invoke `businesslens-map` for established code,
`businesslens-ideate` for a new product, or `businesslens-verify` for an
existing Product Model.
