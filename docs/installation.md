---
title: Installation
description: Install the BusinessLens skills into your AI harnesses — providers, scopes, non-interactive setup, and updating.
section: open-source
group: Get started
order: 2
---

# Installation

BusinessLens is installed once per repository (or once per machine) with the
`businesslens` CLI. It requires Node.js 20.12 or newer.

```bash
npx businesslens@latest install
```

The installer detects supported AI harnesses, lets you customize the
selection, asks for project or global scope, and installs only the
BusinessLens skills. It never creates `.businesslens/`, alters `AGENTS.md`,
installs hooks, connects to the platform, or publishes data — building the
model belongs to the skills themselves.

## Supported harnesses

| Provider | Project skills directory |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` |
| GitHub Copilot | `.github/skills/` |

Global installs respect `CLAUDE_CONFIG_DIR` and `CODEX_HOME`; other
providers use their standard user directories.

## Project or global scope

- **Project** installs into the repository, so the skills travel with it and
  teammates get them on checkout.
- **Global** installs into your user directory, making the skills available
  in every repository you open.

## Non-interactive setup

```bash
npx businesslens@latest install \
  --providers claude,codex \
  --scope project \
  --yes
```

`--yes` accepts detected providers and defaults to project scope. `--force`
replaces an unmarked colliding `businesslens-*` directory — without it, the
installer refuses to overwrite skills it does not own.

## Updating

```bash
npx businesslens@latest update
```

Update discovers BusinessLens-managed installations through their ownership
markers and refreshes only those skill directories. It never touches
`.businesslens/` or `AGENTS.md`. Narrow it with `--scope project|global` or
`--providers <list>`.

## Claude Code plugin

Claude Code users may alternatively install from this repository's
marketplace manifest. The standalone CLI remains the primary installation
experience.

Next: the [Quickstart](./quickstart.md).
